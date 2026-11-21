import http from "http";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { loadConfig } from "./config/env";
import { createDatabase } from "@giniespace/sheets-db";
import { createPlacesClient } from "@giniespace/places-client";
import { createWhatsAppManager, AuthStateProvider } from "@giniespace/whatsapp-engine";
import { setupSocketServer } from "./websocket/socket-server";
import { authMiddleware, requireAdmin } from "./middleware/auth";
import { globalApiRateLimiter } from "./middleware/rate-limit";
import { createAuthRouter } from "./routes/auth.routes";
import { createCustomersRouter } from "./routes/customers.routes";
import { createProductsRouter } from "./routes/products.routes";
import { createOrdersRouter } from "./routes/orders.routes";
import { createLeadsRouter } from "./routes/leads.routes";
import { createWhatsAppRouter } from "./routes/whatsapp.routes";
import { createSettingsRouter } from "./routes/settings.routes";
import { createAdminRouter } from "./routes/admin.routes";
import { createStorefrontRouter } from "./routes/storefront.routes";
import { createMarketingRouter } from "./routes/marketing.routes";
import { createAnalyticsRouter } from "./routes/analytics.routes";
import { AnalyticsService } from "./services/analytics.service";
import { NotificationService } from "./services/notification.service";
import { startDailyReportScheduler, startChatRetentionScheduler } from "./services/scheduler.service";

// Global resilience handlers against non-fatal Baileys / WebSocket crypto noise errors
process.on("uncaughtException", (err: any) => {
  const msg = err?.message || String(err);
  const stack = err?.stack || "";
  if (
    msg.includes("Unsupported state or unable to authenticate data") ||
    msg.includes("Decipheriv") ||
    stack.includes("noise-handler") ||
    stack.includes("aesDecryptGCM") ||
    stack.includes("crypto.js")
  ) {
    console.warn("[GlobalResilience] Handled non-fatal Baileys crypto noise frame error:", msg);
    return;
  }
  console.error("[GlobalResilience] Uncaught Exception:", err);
});

process.on("unhandledRejection", (reason: any) => {
  console.warn("[GlobalResilience] Unhandled Promise Rejection:", reason?.message || reason);
});

async function bootstrap() {
  const config = loadConfig();
  const app = express();
  const server = http.createServer(app);

  // Trust Cloudflare and Render reverse proxies for accurate client IP in rate limiters
  app.set("trust proxy", 1);

  const allowedOrigins = [
    "https://app.ginie.space",
    "https://ginie.space",
    "https://www.ginie.space",
    "https://giniespace-web.onrender.com",
    ...(process.env.NODE_ENV !== "production"
      ? ["http://localhost:3000", "http://127.0.0.1:3000"]
      : []),
    ...(process.env.ADDITIONAL_ALLOWED_ORIGINS
      ? process.env.ADDITIONAL_ALLOWED_ORIGINS.split(",").map((s) => s.trim())
      : []),
  ];

  app.use(helmet());
  app.use(globalApiRateLimiter);
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin) || origin.endsWith(".ginie.space") || origin.endsWith(".onrender.com")) {
          return callback(null, true);
        }
        return callback(new Error("CORS request blocked from unauthorized origin"));
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
      allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    })
  );
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ limit: "10mb", extended: true }));

  // Uploads directory for static media & marketing banners
  const uploadsDir = path.join(process.cwd(), "uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  app.use("/uploads", express.static(uploadsDir));

  // Database Abstraction Layer (Google Sheets)
  const db = createDatabase({
    spreadsheetId: config.googleSheetId,
    serviceAccountJson: config.googleServiceAccountJson,
  });

  // Ensure Sheet tabs exist
  db.initializeSchema().catch((err) => {
    console.error("Warning: Database schema auto-initialization error:", err.message);
  });

  // AES-256-GCM Session Encryption at Rest (Decoupled from JWT_SECRET)
  const encryptSessionData = (plainText: string, secret: string): string => {
    try {
      const key = crypto.createHash("sha256").update(secret).digest();
      const iv = crypto.randomBytes(12);
      const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
      let encrypted = cipher.update(plainText, "utf8", "base64");
      encrypted += cipher.final("base64");
      const authTag = cipher.getAuthTag();
      return `enc:v1:${iv.toString("base64")}:${authTag.toString("base64")}:${encrypted}`;
    } catch (err: any) {
      console.error("[Crypto] Encryption error:", err.message);
      return plainText;
    }
  };

  const decryptSessionData = (cipherText: string, primarySecret: string, fallbackSecret?: string): string => {
    try {
      if (!cipherText || !cipherText.startsWith("enc:v1:")) {
        // Plaintext fallback for backward compatibility
        return cipherText;
      }
      const parts = cipherText.split(":");
      if (parts.length !== 5) {
        return cipherText;
      }
      const iv = Buffer.from(parts[2], "base64");
      const authTag = Buffer.from(parts[3], "base64");
      const encryptedData = parts[4];

      const tryDecrypt = (sec: string): string | null => {
        try {
          const key = crypto.createHash("sha256").update(sec).digest();
          const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
          decipher.setAuthTag(authTag);
          let dec = decipher.update(encryptedData, "base64", "utf8");
          dec += decipher.final("utf8");
          return dec;
        } catch {
          return null;
        }
      };

      const primary = tryDecrypt(primarySecret);
      if (primary !== null) return primary;

      if (fallbackSecret && fallbackSecret !== primarySecret) {
        const fallback = tryDecrypt(fallbackSecret);
        if (fallback !== null) return fallback;
      }

      console.error("[Crypto] Decryption failed with both primary and fallback keys");
      return cipherText;
    } catch (err: any) {
      console.error("[Crypto] Decryption error (returning raw):", err.message);
      return cipherText;
    }
  };

  // Persistent Cloud Auth Provider for WhatsApp Sessions
  const authProvider: AuthStateProvider = {
    loadAuthState: async (userId: string): Promise<string | null> => {
      try {
        const session = await db.whatsappSessions.findOne({ userId });
        if (!session?.credentialsZip) return null;
        return decryptSessionData(session.credentialsZip, config.dataEncryptionKey, config.jwtSecret);
      } catch (err: any) {
        console.warn(`[AuthProvider] loadAuthState error for ${userId}:`, err.message);
        return null;
      }
    },
    saveAuthState: async (userId: string, authDataZip: string, phoneNumber?: string): Promise<void> => {
      try {
        const existing = await db.whatsappSessions.findOne({ userId });
        const now = new Date().toISOString();
        const encryptedData = encryptSessionData(authDataZip, config.dataEncryptionKey);
        if (existing) {
          await db.whatsappSessions.update(existing.id, {
            status: "connected",
            credentialsZip: encryptedData,
            phoneNumber: phoneNumber || existing.phoneNumber,
            lastSeen: now,
          });
        } else {
          await db.whatsappSessions.create({
            userId,
            status: "connected",
            credentialsZip: encryptedData,
            phoneNumber: phoneNumber || "",
            lastSeen: now,
          });
        }
      } catch (err: any) {
        console.warn(`[AuthProvider] saveAuthState error for ${userId}:`, err.message);
      }
    },
    clearAuthState: async (userId: string): Promise<void> => {
      try {
        const existing = await db.whatsappSessions.findOne({ userId });
        if (existing) {
          await db.whatsappSessions.update(existing.id, {
            status: "disconnected",
            credentialsZip: "",
            qrCode: "",
          });
        }
      } catch (err: any) {
        console.warn(`[AuthProvider] clearAuthState error for ${userId}:`, err.message);
      }
    },
  };

  // Services
  const placesClient = createPlacesClient(config.googlePlacesApiKey);
  const waManager = createWhatsAppManager(config.whatsappStoragePath, authProvider);
  const notificationService = new NotificationService(waManager, db);
  const analyticsService = new AnalyticsService(db);

  // Auto-restore all active WhatsApp sessions on boot (both system-support and tenant sessions)
  setTimeout(async () => {
    try {
      console.log("[Boot] Scanning for saved WhatsApp sessions to auto-restore...");
      const savedSessions = await db.whatsappSessions.findMany();
      for (const sess of savedSessions) {
        if (sess.credentialsZip && sess.credentialsZip.length > 20) {
          if (!sess.credentialsZip.startsWith("enc:v1:")) {
            const encrypted = encryptSessionData(sess.credentialsZip, config.dataEncryptionKey);
            db.whatsappSessions.update(sess.id, { credentialsZip: encrypted }).catch(() => {});
          }
          console.log(`[Boot] Restoring session for ${sess.userId} (${sess.phoneNumber || "unnamed"})...`);
          await waManager.startSession(sess.userId).catch((e) => {
            console.warn(`[Boot] Auto-restore warning for ${sess.userId}:`, e.message);
          });
        }
      }
    } catch (e: any) {
      console.warn("[Boot] Auto-restore scan warning:", e.message);
    }
  }, 2500);

  // Real-time WebSockets
  const io = setupSocketServer(server, config.jwtSecret, config.corsOrigin, waManager, db, notificationService);

  // Health Check
  app.get("/api/health", (_req, res) => {
    res.json({ status: "healthy", timestamp: new Date().toISOString() });
  });

  // Auth Routes, Public Storefront, Marketing Kit & Public Analytics (Public)
  app.use("/api/auth", createAuthRouter(db, config.jwtSecret, notificationService));
  app.use("/api/storefront", createStorefrontRouter(db, io, notificationService, waManager));
  app.use("/api/marketing", createMarketingRouter(db));
  app.use("/api/analytics", createAnalyticsRouter(analyticsService));

  // Protected Business Routes
  const auth = authMiddleware(config.jwtSecret);
  app.use("/api/customers", auth, createCustomersRouter(db, io));
  app.use("/api/products", auth, createProductsRouter(db, io));
  app.use("/api/orders", auth, createOrdersRouter(db, io, waManager, notificationService));
  app.use("/api/leads", auth, createLeadsRouter(db, placesClient, io, notificationService));
  app.use("/api/whatsapp", auth, createWhatsAppRouter(waManager, db));
  app.use("/api/settings", auth, createSettingsRouter(db, notificationService));
  app.use("/api/admin", auth, requireAdmin, createAdminRouter(db, waManager, notificationService, analyticsService, io, placesClient));

  // Automated Schedulers
  startDailyReportScheduler(db, waManager, notificationService);
  startChatRetentionScheduler(db);

  server.listen(config.port, () => {
    console.log("GinieSpace API service active on port " + config.port);
  });
}

bootstrap().catch((err) => {
  console.error("Fatal startup error:", err);
  process.exit(1);
});
