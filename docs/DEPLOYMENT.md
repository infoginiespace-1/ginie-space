# GinieSpace Production Deployment & Cloudflare Setup Guide

This document details the production hosting architecture for **GinieSpace** (`ginie.space`).

---

## 1. Cloudflare Configuration (`ginie.space`)

### A. DNS Records
In your Cloudflare Dashboard for domain `ginie.space`:

| Type | Name | Content / IPv4 | Proxy Status | TTL |
| :--- | :--- | :--- | :--- | :--- |
| **A** | `@` (`ginie.space`) | `<YOUR_VPS_IP>` | **Proxied (Orange Cloud)** | Auto |
| **A** | `api` (`api.ginie.space`) | `<YOUR_VPS_IP>` | **Proxied (Orange Cloud)** | Auto |

### B. SSL/TLS Encryption
- Set SSL/TLS Encryption Mode to **Full (Strict)**.
- Cloudflare handles the Edge SSL certificate automatically.

### C. WebSockets Support
1. Go to **Network** in Cloudflare Dashboard.
2. Ensure **WebSockets** is toggled to **ON** (required for real-time live WhatsApp inbox and status streaming).

### D. Security & WAF
- Set Security Level to **Medium**.
- Enable **Bot Fight Mode** to protect Google Places search and Baileys endpoints from scraping.

---

## 2. VPS Deployment (Docker Compose)

### A. Prerequisites on VPS
- Ubuntu 22.04 LTS / Debian 12
- Docker & Docker Compose (`docker compose version >= 2.20`)
- Git & GitHub CLI (`gh`) authenticated with repository access

### B. One-Time Setup on VPS
```bash
# Clone the repository
git clone https://github.com/infoginiespace-1/ginie-space.git
cd ginie-space

# Create the environment file from your verified secrets
cat << 'EOF' > .env
PORT=4000
NODE_ENV=production
JWT_SECRET=your_long_random_jwt_secret_here
CORS_ORIGIN=https://ginie.space
GOOGLE_SHEET_ID=1hr2uCN4OMHnmD63QjKttqYjHGbQ3isH31hot8p_7fPs
GOOGLE_PLACES_API_KEY=AIzaSyBNtypc9Moejifm9f6om4mH267xKZJE0IY
GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
NEXT_PUBLIC_API_URL=https://api.ginie.space
WHATSAPP_STORAGE_PATH=/data/whatsapp-sessions
EOF

# Build and start all services
docker compose up -d --build
```

### C. Nginx Reverse Proxy on VPS (or Caddy)
Point Cloudflare traffic to internal container ports:
- `ginie.space` $\rightarrow$ `http://127.0.0.1:3000` (Next.js Frontend)
- `api.ginie.space` $\rightarrow$ `http://127.0.0.1:4000` (Node.js API + WebSockets)

```nginx
# API & WebSockets Reverse Proxy
server {
    server_name api.ginie.space;

    location / {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Frontend Web Application Reverse Proxy
server {
    server_name ginie.space;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 3. Persistent Data Protection
- WhatsApp session keys are saved in named Docker volume `wa-sessions` mapped to `/data/whatsapp-sessions`.
- Reboots and container image upgrades preserve active WhatsApp pairings without requiring users to scan QR codes again.