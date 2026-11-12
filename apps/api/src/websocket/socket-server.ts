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

      // Merchant Automated Welcome Bot + Smart Keyword Bot + Away Responder
      const cooldownKey = `${event.userId}:${contactDigits}`;
      const nowMs = Date.now();
      const lastRepliedAt = merchantAutoReplyCooldown.get(cooldownKey) || 0;
      const incomingLower = String(event.messageText || "").trim().toLowerCase();

      try {
        const business = await db.businesses.findOne({ userId: event.userId });
        let parsed: any = {};
        if (business?.settingsJson) {
          try {
            parsed = JSON.parse(business.settingsJson);
          } catch {}
        }

        const storeSlugOrId = business?.slug || event.userId;
        const storeLink = `https://app.ginie.space/shop/${storeSlugOrId}`;

        const sendBotReply = async (replyText: string) => {
          await waManager.sendMessage({
            userId: event.userId,
            recipientPhone: contactDigits,
            messageText: replyText,
          });

          const autoId = `auto_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
          const autoTs = new Date().toISOString();
          await db.messages.create({
            userId: event.userId,
            contactPhone: contactDigits,
            contactName: event.senderName || `+${contactDigits}`,
            text: replyText,
            fromMe: "true",
            messageId: autoId,
            timestamp: autoTs,
          }).catch(() => {});

          io.to("user:" + event.userId).emit("whatsapp:message", {
            userId: event.userId,
            senderJid: `${contactDigits}@s.whatsapp.net`,
            contactPhone: contactDigits,
            senderName: event.senderName,
            messageText: replyText,
            timestamp: autoTs,
            messageId: autoId,
            fromMe: true,
          });
        };

        // 1. Smart Keyword Auto-Responder (Catalog / Services / Booking / Order Status) with 45s per-keyword cooldown
        let handledByKeyword = false;
        if (parsed.smartKeywordBot !== false && incomingLower.length <= 60) {
          const isCatalogAsk = /\b(catalog|menu|price|rate|items|products|list|book|appointment|service|services|fees|timing|duration)\b/.test(incomingLower);
          const isTrackAsk = /\b(track|order status|status|my order|my booking|booking status)\b/.test(incomingLower);

          if (isCatalogAsk) {
            const kwKey = `kw_cat:${cooldownKey}`;
            if (nowMs - (merchantAutoReplyCooldown.get(kwKey) || 0) > 45000) {
              merchantAutoReplyCooldown.set(kwKey, nowMs);
              handledByKeyword = true;
              const prods = await db.products.findMany({ userId: event.userId }).catch(() => []);
              const inStock = prods.filter((p) => p.itemType === "service" || Number(p.stock) > 0).slice(0, 8);
              const listStr = inStock.length
                ? inStock
                    .map(
                      (p) =>
                        `• *${p.name}*${p.duration ? ` (${p.duration})` : ""} — ₹${Number(p.price).toLocaleString("en-IN")} / ${p.unit || "pcs"}`
                    )
                    .join("\n")
                : "View our latest offerings online!";
              const reply = `📋 *${business?.name || "Store"} Price List & Offerings*\n\n${listStr}\n\n🛒 *Full Catalog & Online Booking:* ${storeLink}`;
              await sendBotReply(reply);
            }
          } else if (isTrackAsk) {
            const kwKey = `kw_trk:${cooldownKey}`;
            if (nowMs - (merchantAutoReplyCooldown.get(kwKey) || 0) > 45000) {
              merchantAutoReplyCooldown.set(kwKey, nowMs);
              handledByKeyword = true;
              const orders = await db.orders.findMany({ userId: event.userId }).catch(() => []);
              const myOrders = orders
                .filter((o) => normalizePhoneDigits(o.customerPhone || "").slice(-10) === contactDigits.slice(-10))
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
              if (myOrders.length > 0) {
                const latest = myOrders[0];
                const due = Math.max(0, (Number(latest.totalAmount) || 0) - (Number(latest.paidAmount) || 0));
                const reply =
                  `📦 *Latest Order Status (#${latest.id.slice(-6).toUpperCase()})*\n` +
                  `Status: *${String(latest.status || "pending").toUpperCase()}*\n` +
                  `Total: ₹${Number(latest.totalAmount).toLocaleString("en-IN")}\n` +
                  `Payment: *${String(latest.paymentStatus || "unpaid").toUpperCase()}*${due > 0 ? ` (Due: ₹${due.toLocaleString("en-IN")})` : ""}\n\n` +
                  `🔍 Track online: ${storeLink}`;
                await sendBotReply(reply);
              } else {
                await sendBotReply(`No recent orders found for this number. Browse & order here: ${storeLink}`);
              }
            }
          }
        }

        // 2. Closed / Away Auto-Reply when Store is marked Closed
        if (!handledByKeyword && parsed.isOpen === false) {
          const awayKey = `away:${cooldownKey}`;
          if (nowMs - (merchantAutoReplyCooldown.get(awayKey) || 0) > 6 * 60 * 60 * 1000) {
            merchantAutoReplyCooldown.set(awayKey, nowMs);
            handledByKeyword = true;
            const awayText = String(parsed.closedMessage || "Our store is currently closed. We will respond as soon as we reopen!").trim();
            await sendBotReply(`🌙 *${business?.name || "Store"}*\n${awayText}\n\n🛍️ Catalog: ${storeLink}`);
          }
        }

        // 3. First-time 24h Welcome Auto-Reply
        if (!handledByKeyword && nowMs - lastRepliedAt > 24 * 60 * 60 * 1000) {
          const autoReplyEnabled = parsed.autoReply !== false;
          const welcomeText = (parsed.welcomeMessage && String(parsed.welcomeMessage).trim())
            ? String(parsed.welcomeMessage).trim()
            : `Namaste! Welcome to ${business?.name || "our store"}. How can we help you today?`;

          if (autoReplyEnabled) {
            merchantAutoReplyCooldown.set(cooldownKey, nowMs);
            const fullGreeting = `${welcomeText}\n\n🛍️ *Browse Our Catalog & Order Online:* ${storeLink}\n💡 Tip: Reply *"catalog"* for price list or *"status"* to check your order.`;
            await sendBotReply(fullGreeting);
          }
        }
      } catch {
        // Non-fatal auto-reply safeguard
      }
    }
  });

  return io;
}
