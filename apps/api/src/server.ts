import http from "http";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { loadConfig } from "./config/env";
import { createDatabase } from "@giniespace/sheets-db";
import { createPlacesClient } from "@giniespace/places-client";
import { createWhatsAppManager } from "@giniespace/whatsapp-engine";
import { setupSocketServer } from "./websocket/socket-server";
import { authMiddleware } from "./middleware/auth";
import { createAuthRouter } from "./routes/auth.routes";
import { createCustomersRouter } from "./routes/customers.routes";
import { createProductsRouter } from "./routes/products.routes";
import { createOrdersRouter } from "./routes/orders.routes";
import { createLeadsRouter } from "./routes/leads.routes";
import { createWhatsAppRouter } from "./routes/whatsapp.routes";
import { createSettingsRouter } from "./routes/settings.routes";

async function bootstrap() {
  const config = loadConfig();
  const app = express();
  const server = http.createServer(app);

  app.use(helmet());
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin) return callback(null, true);
        if (
          config.corsOrigin === "*" ||
          origin === config.corsOrigin ||
          origin.includes("ginie.space") ||
          origin.includes("onrender.com") ||
          origin.includes("localhost")
        ) {
          return callback(null, true);
        }
        return callback(null, true);
      },
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

  // Services
  const placesClient = createPlacesClient(config.googlePlacesApiKey);
  const waManager = createWhatsAppManager(config.whatsappStoragePath);

  // Real-time WebSockets
  const io = setupSocketServer(server, config.jwtSecret, config.corsOrigin, waManager, db);

  // Health Check
  app.get("/api/health", (_req, res) => {
    res.json({ status: "healthy", timestamp: new Date().toISOString() });
  });

  // Auth Routes (Public)
  app.use("/api/auth", createAuthRouter(db, config.jwtSecret));

  // Protected Business Routes
  const auth = authMiddleware(config.jwtSecret);
  app.use("/api/customers", auth, createCustomersRouter(db, io));
  app.use("/api/products", auth, createProductsRouter(db, io));
  app.use("/api/orders", auth, createOrdersRouter(db, io, waManager));
  app.use("/api/leads", auth, createLeadsRouter(db, placesClient, io));
  app.use("/api/whatsapp", auth, createWhatsAppRouter(waManager));
  app.use("/api/settings", auth, createSettingsRouter(db));

  server.listen(config.port, () => {
    console.log(GinieSpace API service active on port );
  });
}

bootstrap().catch((err) => {
  console.error("Fatal startup error:", err);
  process.exit(1);
});