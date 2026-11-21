import fs from "fs";
import path from "path";
import crypto from "crypto";
import { createDatabase } from "@giniespace/sheets-db";

/**
 * GinieSpace Database Restore Utility
 * Decrypts and restores tables from an encrypted backup snapshot.
 */
async function main() {
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;
  const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  const secretKey = process.env.BACKUP_ENCRYPTION_KEY || process.env.JWT_SECRET;
  const backupFilePath = process.argv[2] || path.join(process.cwd(), "backups", "latest.enc.json");
  const isConfirm = process.argv.includes("--confirm");

  if (!spreadsheetId || !serviceAccountJson) {
    console.error("Error: GOOGLE_SHEET_ID and GOOGLE_SERVICE_ACCOUNT_JSON are required.");
    process.exit(1);
  }

  if (!secretKey) {
    console.error("Error: BACKUP_ENCRYPTION_KEY or JWT_SECRET is required to decrypt the backup.");
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
  console.log(`✓ Backup successfully decrypted. Snapshot created at: ${snapshot.createdAt}`);
  console.log("   Snapshot record counts:", snapshot.stats);

  if (!isConfirm) {
    console.log("\n[DRY RUN COMPLETE] Decryption verified! No changes were made to the database.");
    console.log("Run with `--confirm` to restore into the database:\n");
    console.log(`npx tsx scripts/restore-database.ts "${backupFilePath}" --confirm\n`);
    return;
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

    const repo = (db as any)[table];
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
      } catch (err: any) {
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
