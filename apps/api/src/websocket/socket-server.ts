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

    const isLid = Boolean(event.isLid || event.senderJid.endsWith("@lid") || event.senderJid.includes("@lid"));
    let realPhone = "";

    if (event.senderPn) {
      realPhone = normalizePhoneDigits(event.senderPn);
    }

    if (!isLid && !realPhone) {
      realPhone = normalizePhoneDigits(event.senderJid);
    }

    // If LID and real phone not extracted yet, attempt to match from merchant's existing customers
    if (isLid && !realPhone && event.senderName) {
      try {
        const userCustomers = await db.customers.findMany({ userId: event.userId });
        const matched = userCustomers.find(
          (c) =>
            c.name &&
            c.name.trim().toLowerCase() === (event.senderName || "").trim().toLowerCase() &&
            c.phone &&
            !c.phone.startsWith("LID:")
        );
        if (matched && matched.phone) {
          realPhone = normalizePhoneDigits(matched.phone);
          waManager.setLidPhoneMapping(event.userId, event.senderJid, realPhone);
        }
      } catch {}
    }

    const rawLidDigits = normalizePhoneDigits(event.senderJid);
    const contactIdentifier = realPhone || rawLidDigits;

    const enrichedEvent = {
      ...event,
      contactPhone: contactIdentifier,
      realPhone: realPhone || undefined,
      isLid: isLid && !realPhone,
      senderLid: isLid ? event.senderJid : undefined,
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
          contactPhone: contactIdentifier,
          contactName: event.senderName || (realPhone ? `+${realPhone}` : ""),
          text: event.messageText,
          fromMe: String(Boolean(event.fromMe)),
          messageId: event.messageId || Date.now().toString(),
          timestamp: event.timestamp || new Date().toISOString(),
        });
      }
    } catch {
      // Non-fatal persistence safeguard
    }

    // Auto-discover customer on merchant WhatsApp using phone or LID matching
    if (event.userId !== SYSTEM_SUPPORT_SESSION_ID && !event.fromMe && contactIdentifier) {
      try {
        const userCustomers = await db.customers.findMany({ userId: event.userId });
        const matched = userCustomers.find(
          (c) =>
            (realPhone && normalizePhoneDigits(c.phone || "") === realPhone) ||
            (!realPhone && normalizePhoneDigits(c.phone || "") === contactIdentifier)
        );

        if (!matched) {
          const displayPhone = realPhone ? toE164(realPhone) : `LID:${contactIdentifier}`;
          await db.customers.create({
            userId: event.userId,
            name: event.senderName || (realPhone ? `+${realPhone}` : "WhatsApp User"),
            phone: displayPhone,
            notes: isLid && !realPhone ? "Contacted via WhatsApp Privacy LID" : "First contacted via WhatsApp",
            tags: isLid && !realPhone ? "WhatsApp,Privacy-ID" : "WhatsApp",
          });
        }
      } catch {
        // Background logging failsafe
      }

      // Merchant Automated Welcome Bot + Smart Keyword Bot + Away Responder
      const cooldownKey = `${event.userId}:${contactIdentifier}`;
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

        const sendBotReply = async (replyText: string, imageUrl?: string) => {
          const targetRecipient = isLid && !realPhone ? event.senderJid : contactIdentifier;
          const cleanImageUrl = imageUrl?.trim() || undefined;

          await waManager.sendMessage({
            userId: event.userId,
            recipientPhone: targetRecipient,
            messageText: replyText,
            mediaType: cleanImageUrl ? "image" : undefined,
            mediaUrl: cleanImageUrl,
          });

          const autoId = `auto_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
          const autoTs = new Date().toISOString();
          const savedText = cleanImageUrl
            ? `${replyText ? replyText.trim() + " " : ""}[Media: ${cleanImageUrl}]`
            : replyText;

          await db.messages.create({
            userId: event.userId,
            contactPhone: contactIdentifier,
            contactName: event.senderName || (realPhone ? `+${realPhone}` : ""),
            text: savedText,
            fromMe: "true",
            messageId: autoId,
            timestamp: autoTs,
          }).catch(() => {});

          io.to("user:" + event.userId).emit("whatsapp:message", {
            userId: event.userId,
            senderJid: targetRecipient,
            contactPhone: contactIdentifier,
            senderName: event.senderName,
            messageText: savedText,
            timestamp: autoTs,
            messageId: autoId,
            fromMe: true,
          });
        };

        let handled = false;

        // 1. Custom Keyword-Based Auto-Reply Rules (Configured by Merchant in Settings)
        const customRules: any[] = Array.isArray(parsed.customRules) ? parsed.customRules : [];
        const activeRules = customRules.filter(
          (r) => r && r.enabled !== false && Array.isArray(r.keywords) && r.keywords.length > 0 && r.replyText
        );

        for (const rule of activeRules) {
          const ruleKey = `rule_${rule.id || rule.name}:${cooldownKey}`;
          if (nowMs - (merchantAutoReplyCooldown.get(ruleKey) || 0) < 30000) {
            // 30s per-rule cooldown to prevent spam loops
            continue;
          }

          let isMatch = false;
          for (const rawKw of rule.keywords) {
            const kw = String(rawKw || "").trim().toLowerCase();
            if (!kw) continue;
            if (rule.matchType === "exact") {
              if (incomingLower === kw) {
                isMatch = true;
                break;
              }
            } else {
              // Contains match
              if (incomingLower.includes(kw)) {
                isMatch = true;
                break;
              }
            }
          }

          if (isMatch) {
            merchantAutoReplyCooldown.set(ruleKey, nowMs);
            handled = true;
            let response = String(rule.replyText)
              .replace(/\{store_name\}/gi, business?.name || "Our Store")
              .replace(/\{catalog_link\}/gi, storeLink)
              .replace(/\{phone\}/gi, business?.phone || "");

            await sendBotReply(response, rule.imageUrl);
            break;
          }
        }

        // 2. Business Working Hours & Away Responder (e.g. 9 AM - 9 PM)
        if (!handled) {
          const wh = parsed.workingHours;
          let isOutsideWorkingHours = false;

          if (wh?.enabled && wh.openTime && wh.closeTime) {
            // Compute current time in India Standard Time (UTC+5:30)
            const istOffsetMs = 5.5 * 60 * 60 * 1000;
            const istDate = new Date(Date.now() + istOffsetMs);
            const currentDay = istDate.getUTCDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
            const currentMinutesOfDay = istDate.getUTCHours() * 60 + istDate.getUTCMinutes();

            const [openH, openM] = String(wh.openTime).split(":").map(Number);
            const [closeH, closeM] = String(wh.closeTime).split(":").map(Number);
            const openMinutes = (openH || 9) * 60 + (openM || 0);
            const closeMinutes = (closeH || 21) * 60 + (closeM || 0);

            const activeDays: number[] = Array.isArray(wh.days) && wh.days.length > 0 ? wh.days : [1, 2, 3, 4, 5, 6];
            if (!activeDays.includes(currentDay) || currentMinutesOfDay < openMinutes || currentMinutesOfDay >= closeMinutes) {
              isOutsideWorkingHours = true;
            }
          }

          if (isOutsideWorkingHours) {
            const awayKey = `away_hours:${cooldownKey}`;
            if (nowMs - (merchantAutoReplyCooldown.get(awayKey) || 0) > 4 * 60 * 60 * 1000) {
              merchantAutoReplyCooldown.set(awayKey, nowMs);
              handled = true;
              const awayMsg = String(wh.awayMessage || "Our store is currently closed. We will respond as soon as we reopen!").trim();
              await sendBotReply(`🌙 *${business?.name || "Store"}*\n${awayMsg}\n\n🛍️ *Browse Catalog Online:* ${storeLink}`);
            }
          } else if (parsed.isOpen === false) {
            const awayKey = `away_closed:${cooldownKey}`;
            if (nowMs - (merchantAutoReplyCooldown.get(awayKey) || 0) > 4 * 60 * 60 * 1000) {
              merchantAutoReplyCooldown.set(awayKey, nowMs);
              handled = true;
              const awayText = String(parsed.closedMessage || "Our store is currently closed. We will respond as soon as we reopen!").trim();
              await sendBotReply(`🌙 *${business?.name || "Store"}*\n${awayText}\n\n🛍️ Catalog: ${storeLink}`);
            }
          }
        }

        // 3. Smart Keyword Auto-Responder (Catalog / Services / Booking / Order Status) with 45s per-keyword cooldown
        if (!handled && parsed.smartKeywordBot !== false && incomingLower.length <= 60) {
          const isCatalogAsk = /\b(catalog|menu|price|rate|items|products|list|book|appointment|service|services|fees|timing|duration)\b/.test(incomingLower);
          const isTrackAsk = /\b(track|order status|status|my order|my booking|booking status)\b/.test(incomingLower);

          if (isCatalogAsk) {
            const kwKey = `kw_cat:${cooldownKey}`;
            if (nowMs - (merchantAutoReplyCooldown.get(kwKey) || 0) > 45000) {
              merchantAutoReplyCooldown.set(kwKey, nowMs);
              handled = true;
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

              // Determine image to attach (Store logo, or first product photo, or fallback catalog banner)
              let catalogImg: string | undefined = undefined;
              if (parsed.logoUrl && (parsed.logoUrl.startsWith("http://") || parsed.logoUrl.startsWith("https://") || parsed.logoUrl.startsWith("data:"))) {
                catalogImg = parsed.logoUrl;
              } else {
                const prodWithImg = inStock.find((p) => p.imageUrl && (p.imageUrl.startsWith("http://") || p.imageUrl.startsWith("https://") || p.imageUrl.startsWith("data:")));
                if (prodWithImg) {
                  catalogImg = prodWithImg.imageUrl;
                } else {
                  catalogImg = "https://app.ginie.space/og-catalog.jpg";
                }
              }

              await sendBotReply(reply, catalogImg);
            }
          } else if (isTrackAsk) {
            const kwKey = `kw_trk:${cooldownKey}`;
            if (nowMs - (merchantAutoReplyCooldown.get(kwKey) || 0) > 45000) {
              merchantAutoReplyCooldown.set(kwKey, nowMs);
              handled = true;
              const orders = await db.orders.findMany({ userId: event.userId }).catch(() => []);
              const myOrders = orders
                .filter((o) => {
                  const oPhone = normalizePhoneDigits(o.customerPhone || "");
                  return realPhone
                    ? oPhone.slice(-10) === realPhone.slice(-10)
                    : oPhone.slice(-10) === contactIdentifier.slice(-10);
                })
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

        // 4. First-time 24h Welcome Auto-Reply
        if (!handled && nowMs - lastRepliedAt > 24 * 60 * 60 * 1000) {
          const autoReplyEnabled = parsed.autoReply !== false;
          const welcomeText = (parsed.welcomeMessage && String(parsed.welcomeMessage).trim())
            ? String(parsed.welcomeMessage).trim()
            : `Namaste! Welcome to ${business?.name || "our store"}. How can we help you today?`;

          if (autoReplyEnabled) {
            merchantAutoReplyCooldown.set(cooldownKey, nowMs);
            handled = true;
            const fullGreeting = `${welcomeText}\n\n🛍️ *Browse Our Catalog & Order Online:* ${storeLink}\n💡 Tip: Reply *"catalog"* for price list or *"status"* to check your order.`;
            const welcomeImg = (parsed.logoUrl && (parsed.logoUrl.startsWith("http") || parsed.logoUrl.startsWith("data:")))
              ? parsed.logoUrl
              : "https://app.ginie.space/og-catalog.jpg";
            await sendBotReply(fullGreeting, welcomeImg);
          }
        }

        // 5. Default Fallback Navigation Menu
        if (!handled && parsed.fallbackReply?.enabled && parsed.fallbackReply.message?.trim()) {
          const fallbackKey = `fallback:${cooldownKey}`;
          if (nowMs - (merchantAutoReplyCooldown.get(fallbackKey) || 0) > 2 * 60 * 60 * 1000) {
            merchantAutoReplyCooldown.set(fallbackKey, nowMs);
            handled = true;
            await sendBotReply(parsed.fallbackReply.message.trim());
          }
        }
      } catch {
        // Non-fatal auto-reply safeguard
      }
    }
  });

  return io;
}
