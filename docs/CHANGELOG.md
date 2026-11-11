# GinieSpace Changelog

All notable changes to the GinieSpace platform are documented in this file.

## [Unreleased] - 2026-11-11

### Added
- Created remote repository `infoginiespace-1/ginie-space` on GitHub with zero local disk footprint.
- Verified and stored production secrets in GitHub Actions Secrets (`GOOGLE_PLACES_API_KEY`, `GOOGLE_SERVICE_ACCOUNT_JSON`, `GOOGLE_SHEET_ID`).
- Authored initial Architecture Decision Records in `docs/DECISIONS.md`.
- Implemented `@giniespace/sheets-db`:
  - `IRepository<T>` generic repository pattern enabling a zero-rewrite transition to PostgreSQL.
  - `GoogleSheetsAdapter` connecting to Google Sheets API v4 using Service Account credentials.
  - Rate limiting & request throttling (under 240 req/min) to respect Google Sheets 300 req/min quotas.
  - In-memory read caching with cache invalidation upon writes.
  - Auto-schema initializer to provision 8 core tabs (`Users`, `Businesses`, `Customers`, `Products`, `Orders`, `Leads`, `Settings`, `WhatsAppSessions`).
- Implemented `@giniespace/places-client`:
  - Official Google Places API (New) integration with strict field masking for performance and billing optimization.
  - Full support for search dimensions (query, area, city, pincode, state, country).
- Implemented `@giniespace/whatsapp-engine`:
  - Multi-tenant Baileys bridge supporting isolated WhatsApp sockets per business user.
  - Dynamic QR code generation, pairing code support, and automatic reconnection.
  - Event-driven architecture streaming inbound/outbound messages and status changes.
- Root monorepo configuration with npm workspaces.