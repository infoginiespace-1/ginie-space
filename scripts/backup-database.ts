import fs from "fs";
import path from "path";
import crypto from "crypto";
import { createDatabase } from "@giniespace/sheets-db";

/**
 * GinieSpace Automated Database Backup Utility
 * Exports all Google Sheets tables to an encrypted JSON snapshot.
 */
async function main() {
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;
  const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  const secretKey = process.env.BACKUP_ENCRYPTION_KEY || process.env.JWT_SECRET;

  if (!spreadsheetId || !serviceAccountJson) {
    console.error("Error: GOOGLE_SHEET_ID and GOOGLE_SERVICE_ACCOUNT_JSON environment variables are required.");
    process.exit(1);
  }

  if (!secretKey) {
    console.error("Error: BACKUP_ENCRYPTION_KEY or JWT_SECRET is required to encrypt the backup.");
    process.exit(1);
  }

  console.log("==========================================");
  console.log("🔐 GinieSpace Database Backup Running...");
  console.log("==========================================");

  const db = createDatabase({
    spreadsheetId,
    serviceAccountJson,
  });

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupDir = path.join(process.cwd(), "backups");
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const tables = [
    "users",
    "businesses",
    "customers",
    "products",
    "orders",
    "leads",
    "settings",
    "whatsappSessions",
    "messages",
  ] as const;

  const data: Record<string, any[]> = {};
  const stats: Record<string, number> = {};

  for (const table of tables) {
    try {
      const records = await (db as any)[table].findMany();
      data[table] = records;
      stats[table] = records.length;
      console.log(`✓ Table [${table}]: ${records.length} records exported`);
    } catch (err: any) {
      console.warn(`! Table [${table}] warning: ${err.message}`);
      data[table] = [];
      stats[table] = 0;
    }
  }

  const payload = JSON.stringify({
    version: "1.0",
    createdAt: new Date().toISOString(),
    stats,
    tables: data,
  });

  // AES-256-GCM Encryption
  const key = crypto.createHash("sha256").update(secretKey).digest();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  let encrypted = cipher.update(payload, "utf8", "base64");
  encrypted += cipher.final("base64");
  const authTag = cipher.getAuthTag();

  const encryptedOutput = JSON.stringify({
    type: "GINIESPACE_ENCRYPTED_BACKUP",
    version: "1.0",
    iv: iv.toString("base64"),
    tag: authTag.toString("base64"),
    data: encrypted,
    createdAt: new Date().toISOString(),
    stats,
  }, null, 2);

  const filename = `backup_${timestamp}.enc.json`;
  const targetPath = path.join(backupDir, filename);
  fs.writeFileSync(targetPath, encryptedOutput, "utf8");

  const latestPath = path.join(backupDir, "latest.enc.json");
  fs.writeFileSync(latestPath, encryptedOutput, "utf8");

  console.log("==========================================");
  console.log(`✅ Backup successfully saved and encrypted:`);
  console.log(`   Path: ${targetPath}`);
  console.log(`   Latest: ${latestPath}`);
  console.log(`   Total tables: ${Object.keys(stats).length}`);
  console.log("==========================================");
}

main().catch((err) => {
  console.error("Backup failed:", err.message);
  process.exit(1);
});
