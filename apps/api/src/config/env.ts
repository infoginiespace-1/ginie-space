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
  const jwtSecret = process.env.JWT_SECRET || "giniespace-super-secret-jwt-key";
  const corsOrigin = process.env.CORS_ORIGIN || "*";
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