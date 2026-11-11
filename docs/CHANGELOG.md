# GinieSpace Changelog

All notable changes to the GinieSpace platform are documented in this file.

## [Unreleased] - 2026-11-11

### Added
- Created remote repository `infoginiespace-1/ginie-space` on GitHub with zero local disk footprint.
- Verified and stored production secrets in GitHub Actions Secrets (`GOOGLE_PLACES_API_KEY`, `GOOGLE_SERVICE_ACCOUNT_JSON`, `GOOGLE_SHEET_ID`).
- Authored initial Architecture Decision Records in `docs/DECISIONS.md`.
- Implemented `@giniespace/sheets-db`:
  - `IRepository<T>` generic repository pattern enabling a zero-rewrite transition to PostgreSQL.
  - `GoogleSheetsAdapter` connecting to Google Sheets API v4 with Service Account credentials.
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
- Implemented `@giniespace/api` (Backend API & Real-time WebSockets):
  - Express HTTP server with Helmet and CORS configuration.
  - Authentication router (`/api/auth/signup`, `/api/auth/login`, `/api/auth/me`) with business type selection (Retail / Wholesale).
  - Customers management router (`/api/customers`) with real-time sync.
  - Products catalog router (`/api/products`) with stock and pricing controls.
  - Orders pipeline router (`/api/orders`) with instant status transitions (*Pending* -> *Confirmed* -> *Dispatched* -> *Delivered*) and automated WhatsApp notifications.
  - Leads discovery router (`/api/leads`) with Google Places integration and one-click lead-to-customer conversion.
  - WhatsApp multi-session controller (`/api/whatsapp`) for live QR generation and message dispatch.
  - Settings & admin user management router (`/api/settings`).
  - Real-time Socket.io gateway broadcasting inbound messages, status changes, and order events to tenant rooms.
- Implemented `@giniespace/web` (Next.js 14 App Router + Ant Design):
  - Friendly, non-technical UI terminology throughout.
  - Live WhatsApp Inbox (`/inbox`) with instant incoming/outgoing chat synchronization via Socket.io.
  - Orders & Sales dashboard (`/orders`) with real-time status transitions and automated WhatsApp customer notifications.
  - Local Lead Discovery (`/leads`) querying official Google Places data by category, area, city, and pincode with one-click customer conversion.
  - Customer directory (`/customers`) with direct WhatsApp messaging actions.
  - Product & Catalog management (`/products`) for pricing and inventory tracking.
  - Interactive WhatsApp Link QR Modal with live auto-refresh and connection state badge.
  - Signup with mandatory business type selector (Retail vs. Wholesale) and secure Sign In.
  - Settings & auto-welcome responder management (`/settings`).
  - Admin Panel (`/admin`) for system metrics and user management.