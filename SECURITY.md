# GinieSpace Security Policy

GinieSpace is committed to protecting the privacy, availability, and cryptographic integrity of our merchants, their customers, and their digital storefronts.

## 1. Supported Versions

Security updates and patches are actively maintained for the following versions:

| Service / App | Supported Version | Status |
|---------------|-------------------|--------|
| GinieSpace Web (`app.ginie.space`) | v1.0.x (Current) | Active Support |
| GinieSpace API (`api.ginie.space`) | v1.0.x (Current) | Active Support |
| GinieSpace Landing (`ginie.space`) | v1.0.x (Current) | Active Support |

---

## 2. Reporting a Vulnerability

We value the work of independent security researchers and white-hat community members. If you believe you have discovered a vulnerability, security flaw, or privacy issue within GinieSpace services:

- **Primary Security Email:** `info.giniespace@gmail.com`
- **Emergency WhatsApp Hotline:** `+91 9279259690`
- **Report Details to Include:**
  - Brief description of the issue and potential impact.
  - Clear steps to reproduce (HTTP requests, parameters, or proof-of-concept scripts).
  - Any affected endpoints, browser environments, or dependencies.
- **Response SLA:**
  - **Acknowledgment:** Within 12 hours of receipt.
  - **Triage & Initial Assessment:** Within 24 hours.
  - **Remediation & Patch Deployment:** Critical severity issues are patched within 24 to 48 hours.

---

## 3. Safe Harbor & Responsible Disclosure

If you conduct vulnerability research in accordance with this policy:
- We consider your research **authorized** and will not pursue legal action or report you to law enforcement.
- Please allow our engineering team a reasonable window to remediate the vulnerability before public disclosure.
- Do not exploit vulnerabilities to alter, extract, or delete customer or merchant data.
- Avoid intentional degradation of service, distributed denial-of-service (DDoS), or automated spam flooding.

---

## 4. Platform Security Principles

- **Transport Security:** Strict HTTPS enforced with HTTP Strict Transport Security (HSTS preload) across all public domains.
- **Authentication:** Passwordless WhatsApp OTP authentication with cryptographically random one-time codes, 5-minute strict expiry, attempt-based rate limiting, and salted bcrypt password hashing.
- **Data Protection at Rest:** Sensitive WhatsApp session data and database snapshots are encrypted using authenticated AES-256-GCM.
- **Multi-Tenant Access Control:** Tenant data boundaries are enforced server-side. Resource requests for non-owned entities return HTTP 404 to prevent resource enumeration.
- **Abuse Prevention:** Multi-tier rate limiting across API endpoints, authentication flows, and OTP delivery channels with proxy-aware client IP resolution.
- **Upload Safety:** All uploaded media is validated using cryptographic magic bytes, restricted to safe image formats (JPEG, PNG, WebP), bounded by strict file size limits, and stored with randomized UUID naming.

---

*For authorized engineering staff: Consult internal operations documentation under `docs/INTERNAL_SECURITY_ARCHITECTURE.md` for cryptographic key rotation runbooks and disaster recovery guidelines.*
