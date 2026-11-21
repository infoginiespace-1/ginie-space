# Changelog

All notable changes to the GinieSpace platform will be documented in this file.

## [Security Hardening Release] - 2026-11-21

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
