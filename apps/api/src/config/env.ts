import dotenv from "dotenv";
dotenv.config();

export interface AppConfig {
  port: number;
  jwtSecret: string;
  corsOrigin: string;
  googleSheetId: string;
  googleServiceAccountJson: string;
  googlePlacesApiKey: string;
  whatsappStoragePath: string;
}

export function loadConfig(): AppConfig {
  const port = parseInt(process.env.PORT || "4000", 10);
  const jwtSecret = process.env.JWT_SECRET || (process.env.NODE_ENV === "production" ? "" : "giniespace-dev-local-secret-32-chars-minimum");
  if (process.env.NODE_ENV === "production" && (!jwtSecret || jwtSecret.length < 16)) {
    console.error("[SECURITY CRITICAL] Missing or weak JWT_SECRET in production environment! Configure a strong secret in Render/environment variables.");
  }
  const corsOrigin = process.env.CORS_ORIGIN || "https://app.ginie.space,https://ginie.space";
  const googleSheetId = process.env.GOOGLE_SHEET_ID || "";
  const googleServiceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON || "";
  const googlePlacesApiKey = process.env.GOOGLE_PLACES_API_KEY || "";
  const whatsappStoragePath = process.env.WHATSAPP_STORAGE_PATH || "/tmp/giniespace-wa";

  return {
    port,
    jwtSecret,
    corsOrigin,
    googleSheetId,
    googleServiceAccountJson,
    googlePlacesApiKey,
    whatsappStoragePath,
  };
}