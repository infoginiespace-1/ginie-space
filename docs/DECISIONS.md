# GinieSpace Architecture Decision Records (ADRs)

## ADR 001: Monorepo Structure for GinieSpace
- **Status**: Accepted
- **Context**: GinieSpace requires a synchronized Next.js frontend, Node.js backend API, Baileys WhatsApp bridge, and Google Sheets database abstraction layer.
- **Decision**: Adopt a modular monorepo structure on GitHub (`apps/web`, `apps/api`, `packages/sheets-db`, `packages/whatsapp-engine`, `packages/places-client`) to share TypeScript types, data contracts, and unified build workflows without code duplication.

## ADR 002: Google Sheets Database Abstraction Layer
- **Status**: Accepted
- **Context**: The client requires Google Sheets as the initial datastore, with a seamless zero-rewrite path to PostgreSQL in the future.
- **Decision**: Define a generic `IRepository<T>` contract for all domain entities (`Users`, `Businesses`, `Customers`, `Products`, `Orders`, `Leads`, `Settings`). The `GoogleSheetsAdapter` implements this contract directly against Google Sheets API v4 using Service Account authentication. Controllers and business logic never interact with Google Sheets APIs directly.

## ADR 003: Google Sheets Quota Protection (Caching & Batching)
- **Status**: Accepted
- **Context**: Google Sheets enforces strict quotas (300 read/min and 300 write/min per project). High-frequency operations like WhatsApp message logging or live order updates can exhaust quotas.
- **Decision**:
  1. In-memory read caching with cache invalidation upon mutations.
  2. Write-behind batching queue: Writes are accumulated and dispatched in batches using `spreadsheets.values.batchUpdate` every 2–3 seconds.
  3. Exponential backoff and retry mechanism for HTTP 429 / 503 responses.

## ADR 004: Baileys WhatsApp Multi-Session Architecture
- **Status**: Accepted
- **Context**: Each business user requires their own isolated WhatsApp session connected via QR code or pairing code.
- **Decision**: Deploy an isolated session manager using Baileys. Sessions are indexed by `userId`. Authentication states and keys are securely stored and rehydrated across container restarts. Live QR codes and connection statuses stream to the frontend in real time over WebSockets.

## ADR 005: Backend-Only Google Places API (New)
- **Status**: Accepted
- **Context**: Business users discover leads by geographic area, pincode, city, or category. API credentials must never be exposed to clients.
- **Decision**: Expose a protected backend endpoint `/api/leads/discover` that proxies requests to Google Places API (New) with strict field masks (`places.id`, `places.displayName`, `places.formattedAddress`, `places.internationalPhoneNumber`, `places.websiteUri`, `places.rating`, `places.userRatingCount`) to minimize billing and latency.

## ADR 006: Real-Time Synchronization
- **Status**: Accepted
- **Context**: Inbox, orders, leads, and WhatsApp connection status must update instantly without manual page refreshes.
- **Decision**: Implement WebSocket (Socket.io) two-way communication between the backend and Next.js frontend. Inbound WhatsApp messages, order status updates, and lead status changes publish real-time events to connected tenant channels.

## ADR 007: Production Infrastructure (Cloudflare + Docker + GitHub Actions)
- **Status**: Accepted
- **Context**: Automated zero-downtime deployments to VPS with enterprise edge security.
- **Decision**: Docker Compose orchestrates `web`, `api`, and `redis`. Cloudflare provides DNS proxying, SSL/TLS encryption, and WAF. A GitHub Actions CI/CD pipeline triggers on push to `main` to build images and deploy to VPS.
## ADR 008: Render.com Cloud Platform Deployment
- **Status**: Accepted
- **Context**: The client required a 100% free hosting solution that delivers production-grade reliability, automatic Git-triggered deployments, and native Node.js runtime support for persistent WhatsApp WebSocket connections.
- **Decision**: Deploy frontend and backend as two decoupled web services on Render.com:
  1. `giniespace-api`: Long-running Node.js process managing Socket.io and Baileys WhatsApp sessions.
  2. `giniespace-web`: Next.js 14 App Router optimized production build.
  3. Custom domain routing managed via Cloudflare CNAME flattening and proxying.
  4. Scheduled 5-minute health check keep-alive prevents free tier instance sleep.
