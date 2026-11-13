import { EventEmitter } from "events";
import fs from "fs";
import path from "path";
import zlib from "zlib";
import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  WASocket,
  proto,
  makeCacheableSignalKeyStore,
  Browsers,
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
const QRCode: any = require("qrcode");
import pino from "pino";
import { SessionState, InboundMessageEvent, OutboundMessageRequest, AuthStateProvider } from "./types";

function randomizeMessageHash(text: string): string {
  const zeroWidth = ["\u200B", "\u200C", "\u200D", "\uFEFF"];
  const suffix = Array.from({ length: 3 }, () => zeroWidth[Math.floor(Math.random() * zeroWidth.length)]).join("");
  return `${text}${suffix}`;
}

export class WhatsAppSessionManager extends EventEmitter {
  private sockets: Map<string, WASocket> = new Map();
  private states: Map<string, SessionState> = new Map();
  private baseStoragePath: string;
  private authProvider?: AuthStateProvider;
  private syncDebounceTimers: Map<string, NodeJS.Timeout> = new Map();
  private logger = pino({ level: "silent" });

  // In-memory message store for E2EE retry requests ("Waiting for this message" fix)
  private recentMessages: Map<string, proto.IMessage> = new Map();
  private maxCachedMessages = 1000;

  // In-memory mapping from WhatsApp LID (e.g. 120629256810681@lid) to Real Phone JID (e.g. 919876543210@s.whatsapp.net)
  private lidToPhoneMap: Map<string, Map<string, string>> = new Map();

  constructor(baseStoragePath = "/tmp/giniespace-sessions", authProvider?: AuthStateProvider) {
    super();
    this.baseStoragePath = baseStoragePath;
    this.authProvider = authProvider;
  }

  setLidPhoneMapping(userId: string, lid: string, jidOrPhone: string): void {
    if (!lid || !jidOrPhone) return;
    const cleanLid = lid.includes("@") ? lid : `${lid}@lid`;
    let userMap = this.lidToPhoneMap.get(userId);
    if (!userMap) {
      userMap = new Map();
      this.lidToPhoneMap.set(userId, userMap);
    }
    userMap.set(cleanLid, jidOrPhone);
  }

  getPhoneForLid(userId: string, lid: string): string | undefined {
    const cleanLid = lid.includes("@") ? lid : `${lid}@lid`;
    return this.lidToPhoneMap.get(userId)?.get(cleanLid);
  }

  getSessionState(userId: string): SessionState {
    return (
      this.states.get(userId) || {
        userId,
        status: "disconnected",
      }
    );
  }

  private cacheMessage(id?: string, msg?: proto.IMessage): void {
    if (!id || !msg) return;
    if (this.recentMessages.size >= this.maxCachedMessages) {
      const oldestKey = this.recentMessages.keys().next().value;
      if (oldestKey) this.recentMessages.delete(oldestKey);
    }
    this.recentMessages.set(id, msg);
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
        // Exclude stale contact-specific ratchet files (session-*.json)
        // These dynamic ratchets cause "Bad MAC" and "Waiting for this message" when restored from old snapshots
        if (filename.startsWith("session-")) continue;
        fs.writeFileSync(path.join(sessionDir, filename), content, "utf-8");
      }

      console.log(`[WhatsAppManager] Successfully restored session credentials from cloud for ${userId} (${Object.keys(files).length} files)`);
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
          // Never backup contact session ratchets (session-*.json)
          // Master login is preserved via creds.json, pre-key-*.json, app-state-*.json
          if (entry.endsWith(".json") && !entry.startsWith("session-")) {
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

    // Purge any local session-*.json files to eliminate stale Signal ratchets that cause Bad MAC
    try {
      if (fs.existsSync(sessionDir)) {
        const localEntries = fs.readdirSync(sessionDir);
        for (const entry of localEntries) {
          if (entry.startsWith("session-") && entry.endsWith(".json")) {
            try {
              fs.unlinkSync(path.join(sessionDir, entry));
            } catch {}
          }
        }
      }
    } catch {}

    const { state, saveCreds } = await useMultiFileAuthState(sessionDir);

    // Initialise WASocket with Signal Key Caching, Official Browser signature and getMessage retry handler
    const sock = makeWASocket({
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, this.logger),
      },
      logger: this.logger,
      printQRInTerminal: false,
      browser: Browsers.macOS("Desktop"),
      markOnlineOnConnect: true,
      syncFullHistory: false,
      getMessage: async (key) => {
        if (key?.id && this.recentMessages.has(key.id)) {
          return this.recentMessages.get(key.id);
        }
        return undefined;
      },
      defaultQueryTimeoutMs: undefined,
      keepAliveIntervalMs: 30000,
      connectTimeoutMs: 60000,
    });

    this.sockets.set(userId, sock);
    this.updateState(userId, { status: "connecting" });

    // Catch non-fatal raw socket error events
    try {
      (sock.ws as any)?.on?.("error", (err: any) => {
        console.warn(`[WhatsAppManager] Raw socket error for ${userId}:`, err?.message || err);
      });
    } catch {}

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
          // Reconnect automatically with backoff to prevent noise/state conflicts
          const reconnectDelay = statusCode === 440 ? 15000 : 5000;
          console.log(`[WhatsAppManager] Connection closed (${statusCode}) for ${userId}. Auto-reconnecting in ${reconnectDelay / 1000}s...`);
          setTimeout(() => {
            if (!this.sockets.has(userId)) {
              this.startSession(userId).catch((e) => console.warn(`[WhatsAppManager] Auto-reconnect error for ${userId}:`, e.message));
            }
          }, reconnectDelay);
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

    sock.ev.on("chats.phoneNumberShare", ({ lid, jid }: any) => {
      if (lid && jid) {
        this.setLidPhoneMapping(userId, lid, jid);
        console.log(`[WhatsAppManager] Captured chats.phoneNumberShare for ${userId}: ${lid} -> ${jid}`);
      }
    });

    sock.ev.on("contacts.upsert", (contacts: any[]) => {
      if (Array.isArray(contacts)) {
        for (const c of contacts) {
          if (c.lid && c.id && !c.id.endsWith("@lid")) {
            this.setLidPhoneMapping(userId, c.lid, c.id);
          }
        }
      }
    });

    sock.ev.on("contacts.update", (updates: any[]) => {
      if (Array.isArray(updates)) {
        for (const u of updates) {
          if (u.lid && u.id && !u.id.endsWith("@lid")) {
            this.setLidPhoneMapping(userId, u.lid, u.id);
          }
        }
      }
    });

    sock.ev.on("messages.upsert", async ({ messages, type }: any) => {
      if (type !== "notify") return;

      for (const msg of messages) {
        if (!msg.message) continue;

        // Cache incoming message for E2EE decryption retry handling
        if (msg.key?.id) {
          this.cacheMessage(msg.key.id, msg.message);
        }

        const rawRemoteJid = msg.key.remoteJid || "";
        const isLid = rawRemoteJid.endsWith("@lid") || rawRemoteJid.includes("@lid");

        // Extract senderPn if provided by WhatsApp / Baileys
        const rawSenderPn = (msg.key as any).senderPn || (msg.key as any).participantPn || "";
        if (isLid && rawSenderPn) {
          this.setLidPhoneMapping(userId, rawRemoteJid, rawSenderPn);
        }

        const resolvedPn = isLid
          ? rawSenderPn || this.getPhoneForLid(userId, rawRemoteJid)
          : undefined;

        const senderJid = rawRemoteJid;
        const fromMe = msg.key.fromMe || false;
        const text =
          msg.message.conversation ||
          msg.message.extendedTextMessage?.text ||
          "";

        if (!text.trim()) continue;

        const event: InboundMessageEvent = {
          userId,
          senderJid,
          senderPn: resolvedPn,
          isLid,
          lid: isLid ? rawRemoteJid : undefined,
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

    let targetJid: string;
    const recipientRaw = (req.recipientPhone || "").trim();

    // If recipient is already a full WhatsApp JID (e.g. LID ending with @lid or group)
    if (recipientRaw.endsWith("@lid") || recipientRaw.endsWith("@s.whatsapp.net")) {
      targetJid = recipientRaw;
    } else {
      let digits = recipientRaw.replace(/[^0-9]/g, "");
      if (digits.startsWith("00")) digits = digits.slice(2);
      if (digits.startsWith("0") && digits.length === 11) digits = digits.slice(1);
      // Auto-prefix Indian country code 91 if only 10 digits provided
      if (digits.length === 10) {
        digits = `91${digits}`;
      }

      // Check if this 15-digit number corresponds to an LID in our session map
      const possibleLid = `${digits}@lid`;
      const mappedPn = this.getPhoneForLid(req.userId, possibleLid);

      if (mappedPn) {
        targetJid = mappedPn;
      } else if (digits.length >= 14 && (digits.startsWith("12") || digits.startsWith("14") || digits.startsWith("17") || digits.startsWith("96"))) {
        // Direct LID send target fallback
        targetJid = possibleLid;
      } else {
        targetJid = `${digits}@s.whatsapp.net`;
        // Strict onWhatsApp validation check for standard phone numbers
        try {
          const results = await sock.onWhatsApp(digits);
          if (results && results.length > 0 && results[0].exists) {
            targetJid = results[0].jid;
          }
        } catch (err: any) {
          console.warn(`[WhatsAppManager] onWhatsApp query warning: ${err.message}`);
        }
      }
    }

    // 2. Anti-Ban Human Simulation: Typing (composing) presence
    if (req.antiBan?.simulateTyping !== false) {
      try {
        await sock.sendPresenceUpdate("composing", targetJid);
        const typingDelay = req.antiBan?.typingDurationMs || Math.min(1800, Math.max(700, req.messageText.length * 15));
        await new Promise((resolve) => setTimeout(resolve, typingDelay));
        await sock.sendPresenceUpdate("paused", targetJid);
      } catch {}
    }

    // 3. Anti-Ban Unique Hash Randomization (Zero-Width suffix to prevent bulk spam hash matching)
    const outboundText =
      req.antiBan?.randomizeHash !== false && !req.mediaDataUrl
        ? randomizeMessageHash(req.messageText)
        : req.messageText;

    let payload: any = { text: outboundText };
    if (req.mediaDataUrl && req.mediaDataUrl.startsWith("data:image/")) {
      const commaIdx = req.mediaDataUrl.indexOf(",");
      if (commaIdx !== -1) {
        const imgBuffer = Buffer.from(req.mediaDataUrl.slice(commaIdx + 1), "base64");
        payload = { image: imgBuffer, caption: outboundText };
      }
    }

    const result = await sock.sendMessage(targetJid, payload);

    // Cache outbound message in memory for E2EE Retry responses ("Waiting for this message" fix)
    if (result?.key?.id && result.message) {
      this.cacheMessage(result.key.id, result.message);
    }

    // Trigger cloud sync
    const sessionDir = path.join(this.baseStoragePath, req.userId);
    this.scheduleCloudSync(req.userId, sessionDir);

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

  async restartClean(userId: string): Promise<SessionState> {
    const sock = this.sockets.get(userId);
    if (sock) {
      try {
        sock.end(undefined);
      } catch {}
      this.sockets.delete(userId);
    }
    const sessionDir = path.join(this.baseStoragePath, userId);
    try {
      if (fs.existsSync(sessionDir)) {
        const localEntries = fs.readdirSync(sessionDir);
        for (const entry of localEntries) {
          if (entry.startsWith("session-") && entry.endsWith(".json")) {
            try {
              fs.unlinkSync(path.join(sessionDir, entry));
            } catch {}
          }
        }
      }
    } catch {}
    return this.startSession(userId);
  }

  private updateState(userId: string, partial: Partial<SessionState>) {
    const current = this.getSessionState(userId);
    const updated = { ...current, ...partial };
    this.states.set(userId, updated);
  }
}
