import { EventEmitter } from "events";
import fs from "fs";
import path from "path";
import zlib from "zlib";
import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  WASocket,
  proto,
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
const QRCode: any = require("qrcode");
import pino from "pino";
import { SessionState, InboundMessageEvent, OutboundMessageRequest, AuthStateProvider } from "./types";

export class WhatsAppSessionManager extends EventEmitter {
  private sockets: Map<string, WASocket> = new Map();
  private states: Map<string, SessionState> = new Map();
  private baseStoragePath: string;
  private authProvider?: AuthStateProvider;
  private syncDebounceTimers: Map<string, NodeJS.Timeout> = new Map();
  private logger = pino({ level: "silent" });

  constructor(baseStoragePath = "/tmp/giniespace-sessions", authProvider?: AuthStateProvider) {
    super();
    this.baseStoragePath = baseStoragePath;
    this.authProvider = authProvider;
  }

  getSessionState(userId: string): SessionState {
    return (
      this.states.get(userId) || {
        userId,
        status: "disconnected",
      }
    );
  }

  private async restoreSessionFromCloud(userId: string, sessionDir: string): Promise<boolean> {
    if (!this.authProvider) return false;
    try {
      const credsFile = path.join(sessionDir, "creds.json");
      if (fs.existsSync(credsFile)) return true;

      const zipBase64 = await this.authProvider.loadAuthState(userId);
      if (!zipBase64 || zipBase64.length < 20) return false;

      const decompressed = zlib.gunzipSync(Buffer.from(zipBase64, "base64"));
      const files: Record<string, string> = JSON.parse(decompressed.toString("utf-8"));

      if (!fs.existsSync(sessionDir)) {
        fs.mkdirSync(sessionDir, { recursive: true });
      }

      for (const [filename, content] of Object.entries(files)) {
        fs.writeFileSync(path.join(sessionDir, filename), content, "utf-8");
      }

      console.log(`[WhatsAppManager] Successfully restored session credentials from cloud for ${userId}`);
      return true;
    } catch (err: any) {
      console.warn(`[WhatsAppManager] Failed to restore session from cloud for ${userId}:`, err.message);
      return false;
    }
  }

  private scheduleCloudSync(userId: string, sessionDir: string) {
    if (!this.authProvider) return;

    const existingTimer = this.syncDebounceTimers.get(userId);
    if (existingTimer) clearTimeout(existingTimer);

    const timer = setTimeout(async () => {
      try {
        if (!fs.existsSync(sessionDir)) return;
        const files: Record<string, string> = {};
        const entries = fs.readdirSync(sessionDir);
        for (const entry of entries) {
          if (entry.endsWith(".json")) {
            files[entry] = fs.readFileSync(path.join(sessionDir, entry), "utf-8");
          }
        }

        if (Object.keys(files).length === 0) return;

        const compressed = zlib.gzipSync(Buffer.from(JSON.stringify(files))).toString("base64");
        const phone = this.states.get(userId)?.phoneNumber;
        await this.authProvider!.saveAuthState(userId, compressed, phone);
        console.log(`[WhatsAppManager] Session backed up to cloud for ${userId} (${Object.keys(files).length} files, ${compressed.length} bytes)`);
      } catch (err: any) {
        console.warn(`[WhatsAppManager] Cloud backup error for ${userId}:`, err.message);
      }
    }, 1500);

    this.syncDebounceTimers.set(userId, timer);
  }

  async startSession(userId: string): Promise<SessionState> {
    const existing = this.sockets.get(userId);
    if (existing) {
      return this.getSessionState(userId);
    }

    const sessionDir = path.join(this.baseStoragePath, userId);
    await this.restoreSessionFromCloud(userId, sessionDir);

    const { state, saveCreds } = await useMultiFileAuthState(sessionDir);

    const sock = makeWASocket({
      auth: state,
      logger: this.logger,
      printQRInTerminal: false,
      browser: ["GinieSpace", "Chrome", "1.0.0"],
      keepAliveIntervalMs: 25000,
      connectTimeoutMs: 60000,
    });

    this.sockets.set(userId, sock);
    this.updateState(userId, { status: "connecting" });

    sock.ev.on("creds.update", async () => {
      await saveCreds();
      this.scheduleCloudSync(userId, sessionDir);
    });

    sock.ev.on("connection.update", async (update: any) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        const qrDataUrl = await QRCode.toDataURL(qr);
        this.updateState(userId, {
          status: "connecting",
          qrCode: qrDataUrl,
        });
        this.emit("qr", { userId, qrCode: qrDataUrl });
      }

      if (connection === "close") {
        const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
        const isLoggedOut = statusCode === DisconnectReason.loggedOut;

        this.sockets.delete(userId);
        this.updateState(userId, {
          status: "disconnected",
          qrCode: undefined,
        });
        this.emit("status", { userId, status: "disconnected" });

        if (isLoggedOut) {
          console.log(`[WhatsAppManager] Session permanently logged out for ${userId}. Clearing cloud credentials.`);
          try {
            if (fs.existsSync(sessionDir)) {
              fs.rmSync(sessionDir, { recursive: true, force: true });
            }
          } catch {}
          if (this.authProvider) {
            await this.authProvider.clearAuthState(userId);
          }
        } else {
          // Reconnect automatically without clearing cloud credentials
          console.log(`[WhatsAppManager] Connection closed (${statusCode}) for ${userId}. Auto-reconnecting in 3s...`);
          setTimeout(() => this.startSession(userId), 3000);
        }
      } else if (connection === "open") {
        const phone = sock.user?.id ? sock.user.id.split(":")[0] : undefined;
        this.updateState(userId, {
          status: "connected",
          qrCode: undefined,
          phoneNumber: phone,
          name: sock.user?.name,
          lastActive: new Date().toISOString(),
        });
        this.scheduleCloudSync(userId, sessionDir);
        this.emit("status", { userId, status: "connected", phoneNumber: phone });
      }
    });

    sock.ev.on("messages.upsert", async ({ messages, type }: any) => {
      if (type !== "notify") return;

      for (const msg of messages) {
        if (!msg.message) continue;

        const senderJid = msg.key.remoteJid || "";
        const fromMe = msg.key.fromMe || false;
        const text =
          msg.message.conversation ||
          msg.message.extendedTextMessage?.text ||
          "";

        if (!text.trim()) continue;

        const event: InboundMessageEvent = {
          userId,
          senderJid,
          senderName: msg.pushName || undefined,
          messageText: text,
          timestamp: new Date().toISOString(),
          messageId: msg.key.id || "",
          fromMe,
        };

        this.emit("message", event);
      }
    });

    return this.getSessionState(userId);
  }

  async sendMessage(req: OutboundMessageRequest): Promise<proto.WebMessageInfo | null> {
    const sock = this.sockets.get(req.userId);
    if (!sock) {
      throw new Error(`WhatsApp session for user ${req.userId} is not connected`);
    }

    let digits = req.recipientPhone.replace(/[^0-9]/g, "");
    if (digits.startsWith("00")) digits = digits.slice(2);
    if (digits.startsWith("0") && digits.length === 11) digits = digits.slice(1);
    // Auto-prefix Indian country code 91 if only 10 digits provided
    if (digits.length === 10) {
      digits = `91${digits}`;
    }

    const defaultJid = `${digits}@s.whatsapp.net`;
    let payload: any = { text: req.messageText };
    if (req.mediaDataUrl && req.mediaDataUrl.startsWith("data:image/")) {
      const commaIdx = req.mediaDataUrl.indexOf(",");
      if (commaIdx !== -1) {
        const imgBuffer = Buffer.from(req.mediaDataUrl.slice(commaIdx + 1), "base64");
        payload = { image: imgBuffer, caption: req.messageText };
      }
    }

    try {
      const results = await sock.onWhatsApp(digits);
      if (results && results.length > 0 && results[0].exists) {
        const sent = await sock.sendMessage(results[0].jid, payload);
        return sent || null;
      }
    } catch (err: any) {
      console.warn(`[WhatsAppManager] onWhatsApp query warning: ${err.message}`);
    }

    const result = await sock.sendMessage(defaultJid, payload);

    return result || null;
  }

  async disconnectSession(userId: string): Promise<void> {
    const sock = this.sockets.get(userId);
    if (sock) {
      try {
        await sock.logout();
      } catch {}
      this.sockets.delete(userId);
    }
    const sessionDir = path.join(this.baseStoragePath, userId);
    try {
      if (fs.existsSync(sessionDir)) {
        fs.rmSync(sessionDir, { recursive: true, force: true });
      }
    } catch {}
    if (this.authProvider) {
      await this.authProvider.clearAuthState(userId);
    }
    this.updateState(userId, { status: "disconnected", qrCode: undefined, phoneNumber: undefined });
    this.emit("status", { userId, status: "disconnected" });
  }

  private updateState(userId: string, partial: Partial<SessionState>) {
    const current = this.getSessionState(userId);
    const updated = { ...current, ...partial };
    this.states.set(userId, updated);
  }
}
