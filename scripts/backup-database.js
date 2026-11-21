const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { createDatabase } = require("../packages/sheets-db/dist/index.js");

/**
 * GinieSpace Automated Database Backup Utility (with Off-Site Cloud Sync)
 * Exports all Google Sheets tables to an encrypted JSON snapshot and syncs off-site.
 */
async function main() {
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;
  const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  const secretKey = process.env.DATA_ENCRYPTION_KEY || process.env.BACKUP_ENCRYPTION_KEY || process.env.JWT_SECRET;

  if (!spreadsheetId || !serviceAccountJson) {
    console.error("Error: GOOGLE_SHEET_ID and GOOGLE_SERVICE_ACCOUNT_JSON are required in environment.");
    process.exit(1);
  }

  if (!secretKey) {
    console.error("Error: DATA_ENCRYPTION_KEY, BACKUP_ENCRYPTION_KEY, or JWT_SECRET is required.");
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
  ];

  const data = {};
  const stats = {};

  for (const table of tables) {
    try {
      const records = await db[table].findMany();
      data[table] = records;
      stats[table] = records.length;
      console.log(`✓ Table [${table}]: ${records.length} records exported`);
    } catch (err) {
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

  const encryptedOutput = JSON.stringify(
    {
      type: "GINIESPACE_ENCRYPTED_BACKUP",
      version: "1.0",
      iv: iv.toString("base64"),
      tag: authTag.toString("base64"),
      data: encrypted,
      createdAt: new Date().toISOString(),
      stats,
    },
    null,
    2
  );

  const filename = `backup_${timestamp}.enc.json`;
  const targetPath = path.join(backupDir, filename);
  fs.writeFileSync(targetPath, encryptedOutput, "utf8");

  const latestPath = path.join(backupDir, "latest.enc.json");
  fs.writeFileSync(latestPath, encryptedOutput, "utf8");

  console.log("==========================================");
  console.log(`✅ Backup successfully created and encrypted:`);
  console.log(`   Path: ${targetPath}`);
  console.log(`   Latest: ${latestPath}`);

  // Off-site Sync Capability (Cloudflare R2 / AWS S3 / Webhook)
  const offsiteUrl = process.env.OFFSITE_BACKUP_URL || process.env.OFFSITE_S3_UPLOAD_URL;
  if (offsiteUrl) {
    console.log(`\n☁️  Syncing encrypted backup off-site to: ${offsiteUrl}...`);
    try {
      const resp = await fetch(offsiteUrl, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-Backup-Filename": filename,
          ...(process.env.OFFSITE_BACKUP_AUTH ? { Authorization: process.env.OFFSITE_BACKUP_AUTH } : {}),
        },
        body: encryptedOutput,
      });
      if (resp.ok) {
        console.log("✓ Off-site upload complete (HTTP " + resp.status + ")");
      } else {
        console.warn("! Off-site upload returned non-200: " + resp.status);
      }
    } catch (offsiteErr) {
      console.warn("! Off-site sync warning:", offsiteErr.message);
    }
  } else {
    console.log("ℹ️  Tip: Set OFFSITE_BACKUP_URL or OFFSITE_S3_UPLOAD_URL to sync snapshots to Cloudflare R2 / AWS S3 automatically.");
  }

  console.log("==========================================");
}

main().catch((err) => {
  console.error("Backup failed:", err.message);
  process.exit(1);
});
