import { createDatabase } from "../index";

async function main() {
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;
  const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;

  if (!spreadsheetId || !serviceAccountJson) {
    console.error("Missing GOOGLE_SHEET_ID or GOOGLE_SERVICE_ACCOUNT_JSON environment variables");
    process.exit(1);
  }

  console.log("Connecting to Google Sheets Database...");
  const db = createDatabase({ spreadsheetId, serviceAccountJson });

  console.log("Initializing database schema tabs...");
  await db.initializeSchema();
  console.log("Database schema successfully initialized!");
}

main().catch((err) => {
  console.error("Failed to initialize database:", err);
  process.exit(1);
});