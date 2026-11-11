import { EventEmitter } from "events";
import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  WASocket,
  proto,
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import QRCode from "qrcode";
import pino from "pino";
import { SessionState, InboundMessageEvent, OutboundMessageRequest } from "./types";

export class WhatsAppSessionManager extends EventEmitter {
  private sockets: Map<string, WASocket> = new Map();
  private states: Map<string, SessionState> = new Map();
  private baseStoragePath: string;
  private logger = pino({ level: "silent" });

  constructor(baseStoragePath = "/tmp/giniespace-sessions") {
    super();
    this.baseStoragePath = baseStoragePath;
  }

  getSessionState(userId: string): SessionState {
    return (
      this.states.get(userId) || {
        userId,
        status: "disconnected",
      }
    );
  }

  async startSession(userId: string): Promise<SessionState> {
    const existing = this.sockets.get(userId);
    if (existing) {
      return this.getSessionState(userId);
    }

    const sessionDir = `${this.baseStoragePath}/${userId}`;
    const { state, saveCreds } = await useMultiFileAuthState(sessionDir);

    const sock = makeWASocket({
      auth: state,
      logger: this.logger,
      printQRInTerminal: false,
      browser: ["GinieSpace", "Chrome", "1.0.0"],
    });

    this.sockets.set(userId, sock);
    this.updateState(userId, { status: "connecting" });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", async (update) => {
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
        const shouldReconnect =
          (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;

        this.sockets.delete(userId);
        this.updateState(userId, {
          status: "disconnected",
          qrCode: undefined,
        });
        this.emit("status", { userId, status: "disconnected" });

        if (shouldReconnect) {
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
        this.emit("status", { userId, status: "connected", phoneNumber: phone });
      }
    });

    sock.ev.on("messages.upsert", async ({ messages, type }) => {
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

    let cleanPhone = req.recipientPhone.replace(/[^0-9]/g, "");
    if (!cleanPhone.includes("@s.whatsapp.net")) {
      cleanPhone = `${cleanPhone}@s.whatsapp.net`;
    }

    const result = await sock.sendMessage(cleanPhone, {
      text: req.messageText,
    });

    return result || null;
  }

  async disconnectSession(userId: string): Promise<void> {
    const sock = this.sockets.get(userId);
    if (sock) {
      await sock.logout();
      this.sockets.delete(userId);
      this.updateState(userId, { status: "disconnected", qrCode: undefined });
      this.emit("status", { userId, status: "disconnected" });
    }
  }

  private updateState(userId: string, partial: Partial<SessionState>) {
    const current = this.getSessionState(userId);
    const updated = { ...current, ...partial };
    this.states.set(userId, updated);
  }
}