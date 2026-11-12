import http from "http";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { loadConfig } from "./config/env";
import { createDatabase } from "@giniespace/sheets-db";
import { createPlacesClient } from "@giniespace/places-client";
import { createWhatsAppManager, AuthStateProvider } from "@giniespace/whatsapp-engine";
import { setupSocketServer } from "./websocket/socket-server";
import { authMiddleware, requireAdmin } from "./middleware/auth";
import { createAuthRouter } from "./routes/auth.routes";
import { createCustomersRouter } from "./routes/customers.routes";
import { createProductsRouter } from "./routes/products.routes";
import { createOrdersRouter } from "./routes/orders.routes";
import { createLeadsRouter } from "./routes/leads.routes";
import { createWhatsAppRouter } from "./routes/whatsapp.routes";
import { createSettingsRouter } from "./routes/settings.routes";
import { createAdminRouter } from "./routes/admin.routes";
import { createStorefrontRouter } from "./routes/storefront.routes";
import { NotificationService } from "./services/notification.service";

async function bootstrap() {
  const config = loadConfig();
  const app = express();
  const server = http.createServer(app);

  app.use(helmet());
  app.use(
    cors({
      origin: true,
      credentials: true,
    })
  );
  app.use(express.json());

  // Database Abstraction Layer (Google Sheets)
  const db = createDatabase({
    spreadsheetId: config.googleSheetId,
    serviceAccountJson: config.googleServiceAccountJson,
  });

  // Ensure Sheet tabs exist
  db.initializeSchema().catch((err) => {
    console.error("Warning: Database schema auto-initialization error:", err.message);
  });

  // Persistent Cloud Auth Provider for WhatsApp Sessions
  const authProvider: AuthStateProvider = {
    loadAuthState: async (userId: string): Promise<string | null> => {
      try {
        const session = await db.whatsappSessions.findOne({ userId });
        return session?.credentialsZip || null;
      } catch (err: any) {
        console.warn(`[AuthProvider] loadAuthState error for ${userId}:`, err.message);
        return null;
      }
    },
    saveAuthState: async (userId: string, authDataZip: string, phoneNumber?: string): Promise<void> => {
      try {
        const existing = await db.whatsappSessions.findOne({ userId });
        const now = new Date().toISOString();
        if (existing) {
          await db.whatsappSessions.update(existing.id, {
            status: "connected",
            credentialsZip: authDataZip,
            phoneNumber: phoneNumber || existing.phoneNumber,
            lastSeen: now,
          });
        } else {
          await db.whatsappSessions.create({
            userId,
            status: "connected",
            credentialsZip: authDataZip,
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

  // Auto-restore all active WhatsApp sessions on boot (both system-support and tenant sessions)
  setTimeout(async () => {
    try {
      console.log("[Boot] Scanning for saved WhatsApp sessions to auto-restore...");
      const savedSessions = await db.whatsappSessions.findMany();
      for (const sess of savedSessions) {
        if (sess.credentialsZip && sess.credentialsZip.length > 20) {
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

  // Auth Routes & Public Storefront (Public)
  app.use("/api/auth", createAuthRouter(db, config.jwtSecret, notificationService));
  app.use("/api/storefront", createStorefrontRouter(db, io, notificationService));

  // Protected Business Routes
  const auth = authMiddleware(config.jwtSecret);
  app.use("/api/customers", auth, createCustomersRouter(db, io));
  app.use("/api/products", auth, createProductsRouter(db, io));
  app.use("/api/orders", auth, createOrdersRouter(db, io, waManager, notificationService));
  app.use("/api/leads", auth, createLeadsRouter(db, placesClient, io, notificationService));
  app.use("/api/whatsapp", auth, createWhatsAppRouter(waManager, db));
  app.use("/api/settings", auth, createSettingsRouter(db, notificationService));
  app.use("/api/admin", auth, requireAdmin, createAdminRouter(db, waManager, notificationService));

  server.listen(config.port, () => {
    console.log("GinieSpace API service active on port " + config.port);
  });
}

bootstrap().catch((err) => {
  console.error("Fatal startup error:", err);
  process.exit(1);
});
