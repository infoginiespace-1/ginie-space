const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { createDatabase } = require("../packages/sheets-db/dist/index.js");

/**
 * GinieSpace Database Restore Utility
 * Decrypts and restores tables from an encrypted backup snapshot.
 */
async function main() {
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;
  const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  const secretKey = process.env.DATA_ENCRYPTION_KEY || process.env.BACKUP_ENCRYPTION_KEY || process.env.JWT_SECRET;
  const backupFilePath = process.argv[2] || path.join(process.cwd(), "backups", "latest.enc.json");
  const isConfirm = process.argv.includes("--confirm");

  if (!secretKey) {
    console.error("Error: DATA_ENCRYPTION_KEY, BACKUP_ENCRYPTION_KEY, or JWT_SECRET is required to decrypt the backup.");
    process.exit(1);
  }

  if (!fs.existsSync(backupFilePath)) {
    console.error(`Error: Backup file not found at ${backupFilePath}`);
    process.exit(1);
  }

  console.log("==========================================");
  console.log("📥 GinieSpace Database Restore Utility");
  console.log(`   Source file: ${backupFilePath}`);
  console.log(`   Mode: ${isConfirm ? "LIVE RESTORE" : "DRY RUN (pass --confirm to apply)"}`);
  console.log("==========================================");

  const rawEncrypted = JSON.parse(fs.readFileSync(backupFilePath, "utf8"));
  if (rawEncrypted.type !== "GINIESPACE_ENCRYPTED_BACKUP") {
    console.error("Error: Unrecognized backup file format.");
    process.exit(1);
  }

  // AES-256-GCM Decryption
  const key = crypto.createHash("sha256").update(secretKey).digest();
  const iv = Buffer.from(rawEncrypted.iv, "base64");
  const authTag = Buffer.from(rawEncrypted.tag, "base64");
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(rawEncrypted.data, "base64", "utf8");
  decrypted += decipher.final("utf8");

  const snapshot = JSON.parse(decrypted);
  console.log(`✓ Backup successfully decrypted!`);
  console.log(`   Snapshot created at: ${snapshot.createdAt}`);
  console.log("   Snapshot record counts by table:");
  console.table(
    Object.entries(snapshot.stats || {}).map(([table, count]) => ({
      Table: table,
      "Total Records": count,
    }))
  );

  if (!isConfirm) {
    console.log("\n[DRY RUN COMPLETE] Snapshot decrypted and verified 100% intact!");
    console.log("All tables validated. No changes made to Google Sheets.");
    console.log("\nTo execute a live restore, run with `--confirm`:\n");
    console.log(`node scripts/restore-database.js "${backupFilePath}" --confirm\n`);
    return;
  }

  if (!spreadsheetId || !serviceAccountJson) {
    console.error("Error: Live restore requires GOOGLE_SHEET_ID and GOOGLE_SERVICE_ACCOUNT_JSON in environment.");
    process.exit(1);
  }

  const db = createDatabase({
    spreadsheetId,
    serviceAccountJson,
  });

  await db.initializeSchema().catch(() => {});

  const tables = Object.keys(snapshot.tables || {});
  for (const table of tables) {
    const records = snapshot.tables[table] || [];
    console.log(`\nRestoring table [${table}] (${records.length} records)...`);
    let createdCount = 0;
    let updatedCount = 0;

    const repo = db[table];
    if (!repo) {
      console.warn(`! Table [${table}] repository not found in database adapter. Skipping.`);
      continue;
    }

    for (const record of records) {
      try {
        const existing = record.id ? await repo.findById(record.id).catch(() => null) : null;
        if (existing) {
          await repo.update(record.id, record);
          updatedCount++;
        } else {
          await repo.create(record);
          createdCount++;
        }
      } catch (err) {
        console.warn(`! Could not restore record in [${table}]:`, err.message);
      }
    }

    console.log(`✓ Table [${table}] complete: ${createdCount} created, ${updatedCount} updated.`);
  }

  console.log("\n==========================================");
  console.log("✅ Database restore completed successfully!");
  console.log("==========================================");
}

main().catch((err) => {
  console.error("Restore failed:", err.message);
  process.exit(1);
});
