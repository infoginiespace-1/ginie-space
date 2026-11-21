# GinieSpace Security Policy & Architecture Guide

## 1. Security Architecture Overview

GinieSpace (`https://app.ginie.space/`) enforces a defense-in-depth security model across its API, frontend, database, and infrastructure layers.

### 1.1 Authentication & Authorization
- **WhatsApp OTP & Password Authentication:** Passwords are encrypted using salted `bcrypt` (10 rounds).
- **Zero Static Backdoors:** All authentication routes require cryptographic verification. No static or fallback OTP codes exist in codebase.
- **Master Admin Protection:** Emergency administrative logins are validated against bcrypt hash or server environment variables (`ADMIN_EMERGENCY_PASSWORD`), with zero plain text secrets in source files.
- **Role-Based Access Control (RBAC):** Server-side verification on all tenant and administrative endpoints (`authMiddleware`, `requireAdmin`, `requireOwnerOrAdmin`).

### 1.2 Rate Limiting & Abuse Prevention
- **Global API Rate Limiting:** 300 requests / minute per IP with standard HTTP headers (`Retry-After`, `RateLimit-*`).
- **Authentication & Login Rate Limiting:** 15 requests / 15 minutes to prevent brute-force attacks.
- **OTP Request Limiting:** 10 requests / 15 minutes to prevent SMS/WhatsApp flooding.
- **Lead Discovery Limiting:** 30 requests / hour per merchant to protect upstream Google Places API limits and prevent scraping.

### 1.3 Data Protection & Encryption at Rest
- **WhatsApp Sessions:** All Baileys credentials and session archives stored in Google Sheets are encrypted using AES-256-GCM authenticated encryption (`enc:v1:<iv>:<tag>:<ciphertext>`), derived from `JWT_SECRET`.
- **Database Backups:** Daily automated database backups export all 9 database tables to AES-256-GCM encrypted JSON snapshots.
- **Sanitized Uploads:** Banner and file uploads enforce magic byte validation (JPEG, PNG, WebP only), 5MB size limits, and cryptographic UUID file naming to eliminate arbitrary file upload and path traversal vulnerabilities.

### 1.4 Web & Transport Security
- **Strict CORS Origin Whitelist:** Only authorized domains (`https://app.ginie.space`, `https://ginie.space`, `https://www.ginie.space`, `https://giniespace-web.onrender.com`) are allowed; wildcard `*` with credentials is strictly disabled.
- **HTTP Security Headers:**
  - `Content-Security-Policy`: Restricts script and object execution, allows only trusted domains.
  - `Strict-Transport-Security`: `max-age=31536000; includeSubDomains; preload`
  - `X-Frame-Options`: `SAMEORIGIN` (prevents clickjacking)
  - `X-Content-Type-Options`: `nosniff` (prevents MIME sniffing)
  - `Referrer-Policy`: `strict-origin-when-cross-origin`
  - `Permissions-Policy`: `camera=(), microphone=(), geolocation=(self)`
  - `X-Powered-By`: Disabled in Next.js and Express.

### 1.5 Infrastructure & Container Security
- **Container Isolation:** Docker images run under non-root unprivileged `node` user.
- **Localhost Binding:** Redis (`6379`) is bound strictly to `127.0.0.1:6379`, inaccessible from public network interfaces.
- **Continuous Integration Security:** Automated GitHub Actions run `npm audit` and TruffleHog secret scanning on every commit and weekly cron.

---

## 2. Vulnerability Reporting

If you discover a security vulnerability in GinieSpace:
- **Email:** `info.giniespace@gmail.com`
- **WhatsApp Emergency Contact:** `+91 9279259690`
- **Response SLA:** Critical reports are acknowledged within 12 hours and patched within 24–48 hours.
- Please do not disclose vulnerabilities publicly until our engineering team has released a patch.

---

## 3. Secret & API Key Rotation Guide

If an API key or service credential is ever exposed or needs routine rotation:

### 3.1 Google Places API Key
1. Open [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
2. Generate a new API Key for the project.
3. Restrict key to:
   - Application restriction: IP addresses of Render / VPS hosts.
   - API restriction: **Places API (New)** only.
4. Update environment variable in Render Dashboard under `giniespace-api` -> `Environment` -> `GOOGLE_PLACES_API_KEY`.
5. In Google Cloud Console, delete the old API key.

### 3.2 Google Service Account JSON & Sheet ID
1. In Google Cloud Console, navigate to IAM & Admin -> Service Accounts.
2. Select the service account used for GinieSpace database, create a new JSON key, and download it.
3. In Google Drive, ensure the target Spreadsheet is shared with the new service account email (`Editor`).
4. Update `GOOGLE_SERVICE_ACCOUNT_JSON` in Render Dashboard.
5. Delete the old key from the service account in Google Cloud Console.

### 3.3 JWT Secret
1. Generate a strong 64-character random string:
   `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
2. Update `JWT_SECRET` in Render Dashboard under `giniespace-api`.
3. Existing active user sessions will prompt for re-login with OTP.

---

## 4. Database Backup & Disaster Recovery Guide

### 4.1 Running a Database Backup
To create an encrypted snapshot of all tables from Google Sheets:
```bash
GOOGLE_SHEET_ID="<SHEET_ID>" \
GOOGLE_SERVICE_ACCOUNT_JSON='{"type":"service_account",...}' \
JWT_SECRET="<SECRET>" \
npx tsx scripts/backup-database.ts
```
The encrypted snapshot will be saved in `backups/backup_<timestamp>.enc.json` and `backups/latest.enc.json`.

### 4.2 Restoring from Backup
To verify and test decryption in **Dry-Run mode** (no changes written):
```bash
npx tsx scripts/restore-database.ts backups/latest.enc.json
```

To execute a **Live Restore** into the database:
```bash
GOOGLE_SHEET_ID="<SHEET_ID>" \
GOOGLE_SERVICE_ACCOUNT_JSON='{"type":"service_account",...}' \
JWT_SECRET="<SECRET>" \
npx tsx scripts/restore-database.ts backups/latest.enc.json --confirm
```
