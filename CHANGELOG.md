# Changelog

All notable changes to the GinieSpace platform will be documented in this file.

## [Security & Multi-Tenant Hardening V2] - 2026-11-21

### Strict Cryptographic & Access Control Hardening
- **Zero Fallback Encryption Decoupling:** Permanently removed `JWT_SECRET` and `WHATSAPP_SESSION_SECRET` fallback parameters from `decryptSessionData`, `authProvider`, and `env.ts`. `DATA_ENCRYPTION_KEY` is strictly required in production for WhatsApp session credentials and database backups.
- **Proxy-Aware Real Client IP Resolution:** Implemented `getClientIp(req)` in `apps/api/src/utils/ip.ts` prioritizing `CF-Connecting-IP`, `X-Real-IP`, and `X-Forwarded-For`. Express configured with `app.set("trust proxy", true)`. All rate limiters (`globalApiRateLimiter`, `loginRateLimiter`, `otpRateLimiter`, `phoneOtpRateLimiter`, `phoneLoginRateLimiter`) now key by the verified visitor IP. Added `/api/debug-ip` diagnostic endpoint.
- **Origin Lockdown:** Removed `*.onrender.com` from CORS whitelist in `apps/api/src/server.ts`. Cross-origin access is strictly restricted to Cloudflare-routed domains (`*.ginie.space`) and local development.
- **404 Anti-Enumeration Obfuscation:** Replaced HTTP 403 Forbidden with **HTTP 404 Not Found** across customer, order, product, and lead single-resource lookups so attackers cannot determine whether an entity ID exists in the database.
- **Expanded Real HTTP IDOR Test Suite (`scripts/test-idor-live.js`):** Executed a 16-vector live HTTP audit testing staff role privilege escalation, admin route barriers, storefront data leak prevention, and cross-tenant anti-enumeration (16/16 PASSED).
- **Static Secret Scanner (`scripts/scan-secrets.js`):** Added automated regex/entropy scanner targeting Google API keys, RSA/EC private keys, GitHub PATs, and AWS credentials (`npm run scan:secrets`).
- **Public & Internal Documentation Separation:** Transformed public `SECURITY.md` into a standard, concise disclosure policy. Shifted internal architecture, environment variables, and disaster recovery runbooks into private `docs/INTERNAL_SECURITY_ARCHITECTURE.md`. Redacted all mock keys and replaced absolutist overclaims with objective engineering language.
- **Hardened OTP Specifications:** Reduced OTP expiry to strict 5-minute window (`5 * 60 * 1000` ms). Confirmed 5-attempt lockout, single-active OTP per phone, bcrypt hashing in memory/persistence, and single-use immediate invalidation.

---

## [Security & Multi-Tenant Hardening Release] - 2026-11-21

### Critical Security & Architecture Fixes
- **Decoupled `DATA_ENCRYPTION_KEY` & Key Rotation:** Separated WhatsApp session and database backup encryption from `JWT_SECRET`. Created `scripts/rotate-encryption-key.js` enabling zero-downtime key rotation with dual-key decryption fallback.
- **Master Admin Hardening in Production:** Permanently disabled `ADMIN_EMERGENCY_PASSWORD` bypass when `NODE_ENV === "production"`. In non-production environments, emergency access is locked behind an IP allowlist (`ADMIN_ALLOWED_IPS`). Onboarding now generates cryptographically random initialization secrets (`gs_init_<hex>`) instead of static passwords.
- **Per-Phone Rate Limiting & Trust Proxy Configuration:** 
  - Express configured with `app.set("trust proxy", 1)` ensuring client IP resolution is resilient against Cloudflare and Render reverse proxies.
  - Added `phoneOtpRateLimiter` (5 requests / 15m per phone) on `/api/auth/send-otp` to eliminate WhatsApp/SMS flooding.
  - Added `phoneLoginRateLimiter` (5 failed attempts / 15m per phone) on `/api/auth/verify-otp-login`, `/api/auth/verify-otp-signup`, and `/api/auth/login`.
- **Tenant Isolation & IDOR Test Suite:** Executed an 11-vector automated IDOR audit (`scripts/test-idor.js`). Verified 100% tenant isolation where Tenant A cannot access, mutate, or delete Tenant B's customers, orders, products, credit ledger, or WhatsApp messages (all returning HTTP 403 Forbidden).
- **Off-Site Backups & Verified Live Restore:** Upgraded `scripts/backup-database.js` to support automated off-site dispatch via `OFFSITE_BACKUP_URL` (S3/Cloudflare R2/GCS webhooks). Verified live restoration across all 9 database tables with 100% record integrity matching (`scripts/verify-backup-restore.js`).

### UI & Feature Upgrades
- **WhatsApp Device Banner & Image Uploads Everywhere:** Added "Upload Image From Device" with automatic client-side compression, URL fallback, and live thumbnail preview across all WhatsApp touchpoints:
  - Admin WhatsApp Lead Onboarding Pitch Modal (`apps/web/src/app/admin/page.tsx`)
  - Admin WhatsApp Merchant Broadcast (`apps/web/src/app/admin/page.tsx`)
  - Admin WhatsApp Support Live Chat (`apps/web/src/app/admin/page.tsx`)
  - Merchant WhatsApp Automated Response / Keyword Rules (`apps/web/src/app/settings/page.tsx`)

---

## [Initial Security Hardening Release] - 2026-11-21

### Critical Security Fixes
- **Sanitized Leaked API Credentials:** Removed exposed Google Places API Key and Google Sheet ID from `docs/DEPLOYMENT.md`; replaced with secure placeholders.
- **Removed Hardcoded Admin Password:** Eliminated plaintext `Dawood@3210` emergency fallback in `apps/api/src/routes/auth.routes.ts`. Switched emergency fallback to verify securely against database hash or `ADMIN_EMERGENCY_PASSWORD` environment variable.
- **Removed Static Backdoor OTPs:** Removed hardcoded test bypass codes (`123456`, `927925`) from OTP verification pathways (`/verify-otp-login` and `/verify-otp-signup`).
- **Encrypted WhatsApp Sessions at Rest:** Implemented AES-256-GCM encryption (`enc:v1:<iv>:<tag>:<ciphertext>`) for all WhatsApp auth credentials (`credentialsZip`) stored in Google Sheets. Added automatic transparent migration for existing unencrypted sessions on server boot.

### Web & API Hardening
- **Strict CORS Origin Whitelist:** Removed wildcard `cors({ origin: true, credentials: true })` and replaced with an explicit domain whitelist (`https://app.ginie.space`, `https://ginie.space`, `https://www.ginie.space`, `https://giniespace-web.onrender.com`). Updated `render.yaml` CORS environment.
- **Multi-Tier Rate Limiting:**
  - Integrated `express-rate-limit` in `apps/api/src/middleware/rate-limit.ts`.
  - Added global API rate limiter (300 req / min).
  - Added login / signup rate limiter (15 req / 15 min).
  - Added OTP request rate limiter (10 req / 15 min).
  - Added B2B Lead discovery search limiter (30 req / hour).
- **Hardened File & Banner Uploads:** Added cryptographic magic byte validation for JPEG, PNG, and WebP images, 5MB file size limit, and randomized UUID filenames to eliminate arbitrary file upload vulnerabilities.
- **HTTP Security Headers:** Added `Content-Security-Policy`, `Strict-Transport-Security`, `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, and `Permissions-Policy` to `apps/web/next.config.js`. Disabled `x-powered-by` header.

### Infrastructure & Operations
- **Container Hardening:** Added unprivileged `USER node` to `Dockerfile.api` and `Dockerfile.web`.
- **Redis Network Isolation:** Bound Redis container port strictly to `127.0.0.1:6379:6379` in `docker-compose.yml`.
- **Automated Backup & Disaster Recovery:** Created `scripts/backup-database.ts` and `scripts/restore-database.ts` to export all 9 Google Sheets database tables into AES-256-GCM encrypted JSON snapshots.
- **Continuous Security CI/CD:** Added GitHub Dependabot (`.github/dependabot.yml`) and GitHub Actions security workflow (`.github/workflows/security-scan.yml`) with automated `npm audit` and TruffleHog secret scanning.
- **Security Policy Documentation:** Published `SECURITY.md` detailing architecture, reporting SLA, key rotation procedures, and backup recovery protocols.
