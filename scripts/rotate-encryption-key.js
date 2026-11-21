const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { createDatabase } = require("../packages/sheets-db/dist/index.js");

/**
 * GinieSpace Data Encryption Key Rotation Utility
 * Re-encrypts WhatsApp sessions and backups from an old key to a new key.
 */

function encryptData(plainText, secret) {
  const key = crypto.createHash("sha256").update(secret).digest();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  let encrypted = cipher.update(plainText, "utf8", "base64");
  encrypted += cipher.final("base64");
  const authTag = cipher.getAuthTag();
  return `enc:v1:${iv.toString("base64")}:${authTag.toString("base64")}:${encrypted}`;
}

function decryptData(cipherText, secret) {
  try {
    if (!cipherText || !cipherText.startsWith("enc:v1:")) {
      return cipherText;
    }
    const parts = cipherText.split(":");
    if (parts.length !== 5) return null;
    const iv = Buffer.from(parts[2], "base64");
    const authTag = Buffer.from(parts[3], "base64");
    const encryptedData = parts[4];
    const key = crypto.createHash("sha256").update(secret).digest();
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encryptedData, "base64", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch {
    return null;
  }
}

async function main() {
  const args = process.argv.slice(2);
  let oldKey = process.env.OLD_DATA_ENCRYPTION_KEY || "";
  let newKey = process.env.NEW_DATA_ENCRYPTION_KEY || "";

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--old-key" && args[i + 1]) {
      oldKey = args[i + 1];
    }
    if (args[i] === "--new-key" && args[i + 1]) {
      newKey = args[i + 1];
    }
  }

  if (!oldKey || !newKey) {
    console.error("Usage: node scripts/rotate-encryption-key.js --old-key <CURRENT_KEY> --new-key <NEW_KEY>");
    console.error("Or set OLD_DATA_ENCRYPTION_KEY and NEW_DATA_ENCRYPTION_KEY environment variables.");
    process.exit(1);
  }

  if (oldKey === newKey) {
    console.error("Error: New key must be different from old key.");
    process.exit(1);
  }

  const spreadsheetId = process.env.GOOGLE_SHEET_ID;
  const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;

  console.log("==========================================");
  console.log("🔄 GinieSpace Encryption Key Rotation");
  console.log("==========================================");

  // 1. Rotate WhatsApp Sessions in Database
  if (spreadsheetId && serviceAccountJson) {
    console.log("Connecting to database to re-encrypt stored WhatsApp sessions...");
    const db = createDatabase({
      spreadsheetId,
      serviceAccountJson,
    });

    const sessions = await db.whatsappSessions.findMany().catch(() => []);
    let rotatedCount = 0;
    let failedCount = 0;

    for (const sess of sessions) {
      if (!sess.credentialsZip) continue;

      const plain = decryptData(sess.credentialsZip, oldKey);
      if (plain === null) {
        console.warn(`! Could not decrypt session for user ${sess.userId} with old key. Skipping.`);
        failedCount++;
        continue;
      }

      const reEncrypted = encryptData(plain, newKey);
      await db.whatsappSessions.update(sess.id, {
        credentialsZip: reEncrypted,
      });
      rotatedCount++;
      console.log(`✓ Re-encrypted session for user ${sess.userId}`);
    }

    console.log(`Database sessions rotation finished: ${rotatedCount} succeeded, ${failedCount} failed.`);
  } else {
    console.log("Note: Database credentials not provided in environment. Skipping database session rotation.");
  }

  // 2. Rotate Local Backups
  const repoRoot = path.join(__dirname, "..");
  const backupsDir = path.join(repoRoot, "backups");
  if (fs.existsSync(backupsDir)) {
    console.log("\nRe-encrypting local backup snapshots...");
    const files = fs.readdirSync(backupsDir).filter((f) => f.endsWith(".enc.json"));
    let backupRotatedCount = 0;

    for (const file of files) {
      const filePath = path.join(backupsDir, file);
      try {
        const raw = JSON.parse(fs.readFileSync(filePath, "utf8"));
        if (raw.type === "GINIESPACE_ENCRYPTED_BACKUP" && raw.data) {
          const iv = Buffer.from(raw.iv, "base64");
          const authTag = Buffer.from(raw.tag, "base64");
          const oldHash = crypto.createHash("sha256").update(oldKey).digest();
          const decipher = crypto.createDecipheriv("aes-256-gcm", oldHash, iv);
          decipher.setAuthTag(authTag);
          let decrypted = decipher.update(raw.data, "base64", "utf8");
          decrypted += decipher.final("utf8");

          // Re-encrypt with new key
          const newHash = crypto.createHash("sha256").update(newKey).digest();
          const newIv = crypto.randomBytes(12);
          const cipher = crypto.createCipheriv("aes-256-gcm", newHash, newIv);
          let newEncrypted = cipher.update(decrypted, "utf8", "base64");
          newEncrypted += cipher.final("base64");
          const newTag = cipher.getAuthTag();

          raw.iv = newIv.toString("base64");
          raw.tag = newTag.toString("base64");
          raw.data = newEncrypted;
          raw.rotatedAt = new Date().toISOString();

          fs.writeFileSync(filePath, JSON.stringify(raw, null, 2), "utf8");
          backupRotatedCount++;
          console.log(`✓ Re-encrypted backup file: ${file}`);
        }
      } catch (err) {
        console.warn(`! Failed to re-encrypt backup ${file}:`, err.message);
      }
    }
    console.log(`Backup snapshots rotation finished: ${backupRotatedCount} files re-encrypted.`);
  }

  console.log("\n==========================================");
  console.log("✅ Key Rotation Complete!");
  console.log("Remember to update DATA_ENCRYPTION_KEY in your Render / hosting environment variables.");
  console.log("==========================================");
}

main().catch((err) => {
  console.error("Key rotation error:", err.message);
  process.exit(1);
});
