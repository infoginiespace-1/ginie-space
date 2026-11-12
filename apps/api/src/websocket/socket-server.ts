import { Server as HttpServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { WhatsAppSessionManager, InboundMessageEvent } from "@giniespace/whatsapp-engine";
import { IDatabase } from "@giniespace/sheets-db";
import { AuthenticatedUser } from "../middleware/auth";
import { NotificationService, SYSTEM_SUPPORT_SESSION_ID } from "../services/notification.service";
import { normalizePhoneDigits, toE164 } from "../utils/phone";

export function setupSocketServer(
  httpServer: HttpServer,
  jwtSecret: string,
  corsOrigin: string,
  waManager: WhatsAppSessionManager,
  db: IDatabase,
  notificationService: NotificationService
): SocketIOServer {
  const merchantAutoReplyCooldown = new Map<string, number>();
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: true,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // Socket Authentication Middleware
  io.use((socket: Socket, next) => {
    const token =
      socket.handshake.auth?.token ||
      (socket.handshake.query?.token as string);

    if (!token) {
      return next(new Error("Authentication required"));
    }

    try {
      const decoded = jwt.verify(token, jwtSecret) as AuthenticatedUser;
      socket.data.user = decoded;
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket: Socket) => {
    const user: AuthenticatedUser = socket.data.user;
    const room = "user:" + user.id;
    socket.join(room);

    // Send immediate WhatsApp connection state upon connecting
    const waState = waManager.getSessionState(user.id);
    socket.emit("whatsapp:status", waState);

    // Admin support room
    if (user.role === "admin") {
      socket.join("admin:support");
      const supportState = waManager.getSessionState(SYSTEM_SUPPORT_SESSION_ID);
      socket.emit("admin:whatsapp:status", supportState);
    }

    socket.on("disconnect", () => {
      socket.leave(room);
      if (user.role === "admin") {
        socket.leave("admin:support");
      }
    });
  });

  // Relay WhatsApp Events to User Room in Real-Time
  waManager.on("qr", ({ userId, qrCode }) => {
    io.to("user:" + userId).emit("whatsapp:qr", { qrCode });
    if (userId === SYSTEM_SUPPORT_SESSION_ID) {
      io.to("admin:support").emit("admin:whatsapp:qr", { qrCode });
    }
  });

  waManager.on("status", (data) => {
    io.to("user:" + data.userId).emit("whatsapp:status", data);
    if (data.userId === SYSTEM_SUPPORT_SESSION_ID) {
      io.to("admin:support").emit("admin:whatsapp:status", data);
    }
  });

  waManager.on("message", async (event: InboundMessageEvent) => {
    // Ignore status broadcasts and group noise
    if (!event.senderJid || event.senderJid === "status@broadcast" || event.senderJid.endsWith("@g.us")) {
      return;
    }

    const contactDigits = normalizePhoneDigits(event.senderJid);
    const enrichedEvent = {
      ...event,
      contactPhone: contactDigits,
    };

    io.to("user:" + event.userId).emit("whatsapp:message", enrichedEvent);

    if (event.userId === SYSTEM_SUPPORT_SESSION_ID) {
      io.to("admin:support").emit("admin:whatsapp:message", enrichedEvent);

      if (!event.fromMe) {
        notificationService
          .handleSupportIncomingMessage(event.senderJid, event.senderName, event.messageText)
          .catch(() => {});
      }
    }

    // Persist message in DB (deduplicate by messageId if present)
    try {
      const existingMsg = event.messageId
        ? await db.messages.findOne({ userId: event.userId, messageId: event.messageId })
        : null;

      if (!existingMsg) {
        await db.messages.create({
          userId: event.userId,
          contactPhone: contactDigits,
          contactName: event.senderName || "",
          text: event.messageText,
          fromMe: String(Boolean(event.fromMe)),
          messageId: event.messageId || Date.now().toString(),
          timestamp: event.timestamp || new Date().toISOString(),
        });
      }
    } catch {
      // Non-fatal persistence safeguard
    }

    // Auto-discover customer on merchant WhatsApp using normalized phone matching
    if (event.userId !== SYSTEM_SUPPORT_SESSION_ID && !event.fromMe && contactDigits) {
      try {
        const userCustomers = await db.customers.findMany({ userId: event.userId });
        const matched = userCustomers.find(
          (c) => normalizePhoneDigits(c.phone || "") === contactDigits
        );

        if (!matched) {
          await db.customers.create({
            userId: event.userId,
            name: event.senderName || `+${contactDigits}`,
            phone: toE164(contactDigits),
            notes: "First contacted via WhatsApp",
            tags: "WhatsApp",
          });
        }
      } catch {
        // Background logging failsafe
      }

      // Merchant Automated Welcome Bot (respects Settings autoReply & welcomeMessage with 24h cooldown)
      const cooldownKey = `${event.userId}:${contactDigits}`;
      const nowMs = Date.now();
      const lastRepliedAt = merchantAutoReplyCooldown.get(cooldownKey) || 0;
      if (nowMs - lastRepliedAt > 24 * 60 * 60 * 1000) {
        try {
          const business = await db.businesses.findOne({ userId: event.userId });
          let autoReplyEnabled = true;
          let welcomeText = `Namaste! Welcome to ${business?.name || "our store"}. How can we help you today?`;

          if (business?.settingsJson) {
            try {
              const parsed = JSON.parse(business.settingsJson);
              if (parsed.autoReply === false) autoReplyEnabled = false;
              if (parsed.welcomeMessage && String(parsed.welcomeMessage).trim()) {
                welcomeText = String(parsed.welcomeMessage).trim();
              }
            } catch {}
          }

          if (autoReplyEnabled) {
            merchantAutoReplyCooldown.set(cooldownKey, nowMs);
            const fullGreeting = `${welcomeText}\n\n🛍️ *Browse Our Catalog & Order Online:* https://app.ginie.space/shop/${event.userId}`;
            await waManager.sendMessage({
              userId: event.userId,
              recipientPhone: contactDigits,
              messageText: fullGreeting,
            });

            const autoId = `auto_${Date.now()}`;
            const autoTs = new Date().toISOString();
            await db.messages.create({
              userId: event.userId,
              contactPhone: contactDigits,
              contactName: event.senderName || `+${contactDigits}`,
              text: fullGreeting,
              fromMe: "true",
              messageId: autoId,
              timestamp: autoTs,
            }).catch(() => {});

            io.to("user:" + event.userId).emit("whatsapp:message", {
              userId: event.userId,
              senderJid: `${contactDigits}@s.whatsapp.net`,
              contactPhone: contactDigits,
              senderName: event.senderName,
              messageText: fullGreeting,
              timestamp: autoTs,
              messageId: autoId,
              fromMe: true,
            });
          }
        } catch {
          // Non-fatal auto-reply safeguard
        }
      }
    }
  });

  return io;
}
