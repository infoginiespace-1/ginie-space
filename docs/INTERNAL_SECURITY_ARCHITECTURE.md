# GinieSpace Internal Security Architecture & Operations Runbook

> **CONFIDENTIAL — FOR AUTHORIZED ENGINEERING & OPERATIONS STAFF ONLY**  
> Do not expose or publish this internal architecture document in public directories.

---

## 1. System Architecture & Access Control Model

GinieSpace operates a multi-tenant retail and wholesale commerce platform deployed across Cloudflare edge routers, Render application containers, and Google Sheets cloud databases.

### 1.1 Authentication & Credential Storage
- **Passwordless WhatsApp Authentication:** Merchant identity is verified via WhatsApp OTP. Generated one-time codes are 6-digit cryptographically random integers (`randomInt(100000, 999999)`).
- **OTP Lifecycle & Hashing:**
  - Strict 5-minute expiry window (`5 * 60 * 1000` ms).
  - Stored in hashed form using `bcrypt.hash(otp, 8)` in volatile memory and persisted backup storage.
  - Maximum 5 failed verification attempts before permanent invalidation and deletion.
  - Single active OTP enforced: Any new OTP request immediately replaces and invalidates the previous hash.
  - Immediate single-use invalidation upon successful login.
- **Passwords (Legacy & Emergency Accounts):** Passwords are encrypted using salted `bcrypt` (10 rounds).
- **Master Admin Hardening:**
  - Production environments (`NODE_ENV === "production"`) strictly disable `ADMIN_EMERGENCY_PASSWORD` bypass. Admin access requires valid WhatsApp OTP and bcrypt hash validation.
  - Non-production environments restrict emergency access behind an IP allowlist (`ADMIN_ALLOWED_IPS`).
  - Dynamic initialization secrets generated on first setup use randomized tokens (`gs_init_<hex>`).

### 1.2 Multi-Tier Rate Limiting & Proxy Architecture
- **Multi-Proxy Client IP Resolution:**
  - Requests flow through Client $\to$ Cloudflare Edge $\to$ Render Router $\to$ Express App.
  - Express is configured with `app.set("trust proxy", true)`.
  - Rate limiters prioritize `req.headers["cf-connecting-ip"]` (injected by Cloudflare edge), followed by `x-real-ip`, the first hop of `x-forwarded-for`, and `req.ip`.
- **Enforced Rate Limiters:**
  - `phoneOtpRateLimiter`: 5 OTP requests per mobile number per 15 minutes.
  - `phoneLoginRateLimiter`: 5 failed verification attempts per account per 15 minutes.
  - `otpRateLimiter`: 10 requests per IP per 15 minutes.
  - `loginRateLimiter`: 15 login attempts per IP per 15 minutes.
  - `globalApiRateLimiter`: 300 requests per IP per minute.
  - `leadsSearchRateLimiter`: 30 searches per IP per hour.
- **Trade-off Consideration:** Per-phone rate limiting protects against SMS/WhatsApp flooding and distributed brute-force attacks, with the recognized trade-off that malicious actors targeting a specific phone number can trigger a temporary lockout for that number.

### 1.3 Tenant Isolation & Authorization Boundaries
Every data access route strictly validates ownership against `req.user.id`:
- **Customer Directory (`/api/customers`):** Queries filter exclusively by `userId === req.user.id`.
- **Order Management (`/api/orders`):** Order status updates and fetches are scoped strictly to the authenticated owner's `userId`.
- **Product Catalog (`/api/products`):** Mutations enforce `product.userId === req.user.id`.
- **404 Anti-Enumeration Obfuscation:** Unauthorized single-resource requests return `404 Not Found` rather than `403 Forbidden`, preventing attackers from enumerating valid resource IDs.
- **Staff Role Boundaries:** Accounts with `role: "staff"` are restricted by `staffPermissions` (e.g. `orders`, `customers`) and blocked by `requireOwnerOrAdmin` from modifying merchant business settings or staff rosters.
- **Public Storefront Scoping:** Public shop endpoints (`/api/storefront/:storeId`) expose only active catalog items and public store details. Password hashes, internal cost margins, and customer databases are strictly omitted.

---

## 2. Cryptographic Data Protection & Key Management

### 2.1 Dedicated Data Encryption Key (`DATA_ENCRYPTION_KEY`)
- WhatsApp session credentials (`credentialsZip`) and database backup snapshots are encrypted with authenticated AES-256-GCM (`enc:v1:<iv>:<tag>:<ciphertext>`), derived from a dedicated 256-bit `DATA_ENCRYPTION_KEY`.
- `DATA_ENCRYPTION_KEY` is completely decoupled from `JWT_SECRET`. Rotating `JWT_SECRET` invalidates user sessions without corrupting WhatsApp session credentials or database backups.

### 2.2 Key Rotation Runbook
To rotate `DATA_ENCRYPTION_KEY`:
1. Generate a new cryptographically secure 256-bit key:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
2. Execute the re-encryption rotation utility:
   ```bash
   node scripts/rotate-encryption-key.js --old-key "<PREVIOUS_KEY>" --new-key "<NEW_KEY>"
   ```
3. Update `DATA_ENCRYPTION_KEY` in Render Dashboard under `giniespace-api` -> `Environment`.
4. Deploy the API service.
5. **Key Retention Policy:** Keep historical `DATA_ENCRYPTION_KEY`s archived in a secure password manager throughout the organization's backup retention window (e.g. 90 days) to preserve disaster recovery capabilities for older snapshots.

---

## 3. Disaster Recovery & Off-Site Backup Pipeline

### 3.1 Creating Encrypted Backups
```bash
GOOGLE_SHEET_ID="<SHEET_ID>" \
GOOGLE_SERVICE_ACCOUNT_JSON='{"type":"service_account",...}' \
DATA_ENCRYPTION_KEY="<KEY>" \
node scripts/backup-database.js
```
- Local snapshots are stored under `backups/backup_<timestamp>.enc.json` and `backups/latest.enc.json`.
- When configured, `OFFSITE_BACKUP_URL` dispatches snapshots to external cloud storage (AWS S3 / Cloudflare R2 / GCS) via signed HTTPS PUT requests.

### 3.2 Live Restore Procedure
To verify a snapshot in **Dry-Run mode** (no changes applied):
```bash
node scripts/restore-database.js backups/latest.enc.json
```

To execute a **Live Restore** into a database target:
```bash
TARGET_GOOGLE_SHEET_ID="<TARGET_SHEET_ID>" \
GOOGLE_SERVICE_ACCOUNT_JSON='{"type":"service_account",...}' \
DATA_ENCRYPTION_KEY="<KEY>" \
node scripts/restore-database.js backups/latest.enc.json --confirm
```

---

## 4. Automated Security Verification Suites

### 4.1 Static Secret Scanner
Run before every commit to ensure no API keys or credentials enter version control:
```bash
npm run scan:secrets
```
Rule coverage: Google API keys, RSA/EC private keys, GitHub PATs, AWS access keys, hardcoded password strings, and database connection URIs.

### 4.2 End-to-End HTTP IDOR & Multi-Tenant Audit
Execute on running services or staging to verify multi-tenant scoping and 404 obfuscation:
```bash
npm run test:idor
```
Test suite validates:
1. Anti-enumeration: Unauthorized cross-tenant queries return HTTP 404 (not 403).
2. Cross-tenant customer, order, and product tampering rejected.
3. Staff privilege escalation attempts blocked.
4. Admin routes blocked against merchant and staff tokens.
5. Public storefront excludes confidential fields.
6. Legitimate owner queries return HTTP 200.
