import { Router, Request, Response } from "express";
import { Server } from "socket.io";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import { IDatabase, LeadStatus, BusinessType } from "@giniespace/sheets-db";
import { WhatsAppSessionManager } from "@giniespace/whatsapp-engine";
import { GooglePlacesClient } from "@giniespace/places-client";
import { SYSTEM_SUPPORT_SESSION_ID, SYSTEM_SUPPORT_PHONE, NotificationService } from "../services/notification.service";
import { AnalyticsService } from "../services/analytics.service";
import { normalizePhoneDigits, toE164 } from "../utils/phone";

interface CacheEntry {
  timestamp: number;
  results: any;
}
const leadsSearchCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

async function recordAuditLog(
  db: IDatabase,
  adminEmail: string,
  action: string,
  details: string
): Promise<void> {
  try {
    const setting = await db.settings.findOne({ userId: "admin", key: "admin_audit_logs" }).catch(() => null);
    let logs: any[] = [];
    if (setting?.value) {
      try {
        logs = JSON.parse(setting.value);
      } catch {}
    }
    const newEntry = {
      id: randomUUID(),
      adminEmail: adminEmail || "admin",
      action,
      details,
      timestamp: new Date().toISOString(),
    };
    logs = [newEntry, ...logs].slice(0, 100);
    if (setting) {
      await db.settings.update(setting.id, { value: JSON.stringify(logs) });
    } else {
      await db.settings.create({
        userId: "admin",
        key: "admin_audit_logs",
        value: JSON.stringify(logs),
      });
    }
  } catch (err: any) {
    console.warn("[AdminAudit] Failed to record log:", err.message);
  }
}

export function createAdminRouter(
  db: IDatabase,
  waManager: WhatsAppSessionManager,
  notificationService: NotificationService,
  analyticsService?: AnalyticsService,
  io?: Server,
  placesClient?: GooglePlacesClient
): Router {
  const router = Router();

  // Web Traffic Analytics Report
  router.get("/web-analytics", async (_req: Request, res: Response): Promise<void> => {
    try {
      if (!analyticsService) {
        res.status(503).json({ error: "Analytics service not initialized" });
        return;
      }
      const report = await analyticsService.getAnalyticsReport();
      res.json(report);
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to load web analytics report" });
    }
  });

  // Save SEO & GA4 Configuration
  router.post("/seo-settings", async (req: Request, res: Response): Promise<void> => {
    try {
      if (!analyticsService) {
        res.status(503).json({ error: "Analytics service not initialized" });
        return;
      }
      const { ga4MeasurementId, googleSiteVerification, targetKeywords } = req.body || {};
      await analyticsService.saveSeoSettings({
        ga4MeasurementId,
        googleSiteVerification,
        targetKeywords,
      });
      const adminEmail = req.user?.email || "admin";
      await recordAuditLog(db, adminEmail, "UPDATE_SEO_SETTINGS", `Updated GA4 ID: ${ga4MeasurementId || "none"}`);
      res.json({ message: "SEO and Google Analytics configuration saved successfully!" });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to save SEO settings" });
    }
  });

  // 1. Get Support WhatsApp Connection Status
  router.get("/whatsapp/status", async (_req: Request, res: Response): Promise<void> => {
    try {
      const state = waManager.getSessionState(SYSTEM_SUPPORT_SESSION_ID);
      res.json({
        session: state,
        supportPhone: SYSTEM_SUPPORT_PHONE,
        sessionId: SYSTEM_SUPPORT_SESSION_ID,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to retrieve support WhatsApp status" });
    }
  });

  // 2. Connect / Generate QR for Support WhatsApp (9279259690)
  router.post("/whatsapp/connect", async (_req: Request, res: Response): Promise<void> => {
    try {
      const state = await waManager.startSession(SYSTEM_SUPPORT_SESSION_ID);
      res.json({
        session: state,
        message: "Support WhatsApp connection initiated. Please scan the QR code to link +91 9279259690.",
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to connect support WhatsApp" });
    }
  });

  // 3. Disconnect Support WhatsApp (Admin-Only Action)
  router.post("/whatsapp/disconnect", async (req: Request, res: Response): Promise<void> => {
    try {
      await waManager.disconnectSession(SYSTEM_SUPPORT_SESSION_ID);
      const adminEmail = req.user?.email || "admin";
      await recordAuditLog(db, adminEmail, "DISCONNECT_SUPPORT_WA", "Official support WhatsApp disconnected");
      res.json({ message: "Official Support WhatsApp has been disconnected and credentials cleared." });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to disconnect support WhatsApp" });
    }
  });

  // 3b. Reset E2EE Contact Ratchets without log out
  router.post("/whatsapp/reset-ratchets", async (req: Request, res: Response): Promise<void> => {
    try {
      const state = await waManager.restartClean(SYSTEM_SUPPORT_SESSION_ID);
      const adminEmail = req.user?.email || "admin";
      await recordAuditLog(db, adminEmail, "RESET_E2EE_RATCHETS", "Purged stale contact ratchet sessions to fix Bad MAC");
      res.json({ message: "Stale contact ratchets cleared. Fresh Signal handshake active.", session: state });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to reset ratchets" });
    }
  });

  // 4. Send Message from Support WhatsApp (+91 92792 59690)
  router.post("/whatsapp/send-test", async (req: Request, res: Response): Promise<void> => {
    try {
      const { recipientPhone, messageText, imageUrl, mediaUrl, mediaType, fileName } = req.body;
      if (!recipientPhone || (!messageText && !imageUrl && !mediaUrl)) {
        res.status(400).json({ error: "Recipient phone number and message text or image are required" });
        return;
      }

      const bannerUrl = (imageUrl || mediaUrl || "").trim() || undefined;
      const media = bannerUrl
        ? {
            mediaType: (mediaType as "image" | "document") || "image",
            mediaUrl: bannerUrl,
            fileName: fileName || undefined,
          }
        : undefined;

      const success = await notificationService.sendSupportNotification(
        recipientPhone.trim(),
        messageText?.trim() || (media ? "📷 Media Attachment" : ""),
        { simulateTyping: true, randomizeHash: true },
        media
      );

      if (!success) {
        res.status(503).json({ error: "Support WhatsApp (9279259690) is currently disconnected. Please link it first." });
        return;
      }

      const digits = normalizePhoneDigits(recipientPhone);
      if (digits) {
        try {
          const savedText = bannerUrl
            ? `${messageText ? messageText.trim() + " " : ""}[Media: ${bannerUrl}]`
            : (messageText ? messageText.trim() : "📷 Media Attachment");

          await db.messages.create({
            userId: SYSTEM_SUPPORT_SESSION_ID,
            contactPhone: digits,
            contactName: `+${digits}`,
            text: savedText,
            fromMe: "true",
            messageId: `support_${randomUUID()}`,
            timestamp: new Date().toISOString(),
          });
        } catch (saveErr) {
          console.error("[Admin] Failed to save outgoing support message:", saveErr);
        }
      }

      res.json({ message: `Message sent successfully to ${recipientPhone}` });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to send message" });
    }
  });

  // 5. Notification Rules Settings
  router.get("/whatsapp/rules", async (_req: Request, res: Response): Promise<void> => {
    try {
      const setting = await db.settings.findOne({ userId: "admin", key: "notification_rules" });
      const defaultRules = {
        newUserWelcome: true,
        orderPlacedAlert: true,
        leadConvertedAlert: true,
        supportAutoReply: true,
      };
      const rules = setting ? JSON.parse(setting.value) : defaultRules;
      res.json({ rules });
    } catch {
      res.status(500).json({ error: "Failed to load notification rules" });
    }
  });

  router.post("/whatsapp/rules", async (req: Request, res: Response): Promise<void> => {
    try {
      const { rules } = req.body;
      const existing = await db.settings.findOne({ userId: "admin", key: "notification_rules" });
      if (existing) {
        await db.settings.update(existing.id, {
          value: JSON.stringify(rules),
        });
      } else {
        await db.settings.create({
          userId: "admin",
          key: "notification_rules",
          value: JSON.stringify(rules),
        });
      }
      res.json({ message: "Notification rules updated successfully", rules });
    } catch {
      res.status(500).json({ error: "Failed to save notification rules" });
    }
  });

  // 6. Get Support WhatsApp Inquiries / Messages History
  router.get("/whatsapp/messages", async (_req: Request, res: Response): Promise<void> => {
    try {
      const messages = await db.messages.findMany({ userId: SYSTEM_SUPPORT_SESSION_ID });
      const sorted = [...messages].sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      const normalizedMessages = sorted.map((m: any) => {
        const raw = m.fromMe;
        const isFromAdmin =
          raw === true ||
          raw === 1 ||
          (typeof raw === "string" &&
            (raw.trim().toLowerCase() === "true" || raw.trim() === "1" || raw.trim().toLowerCase() === "yes"));
        return {
          ...m,
          fromMe: isFromAdmin ? "true" : "false",
        };
      });
      res.json({ messages: normalizedMessages });
    } catch {
      res.status(500).json({ error: "Failed to load support messages" });
    }
  });

  // 7. Bulk WhatsApp Broadcast from Official Bot
  router.post("/whatsapp/broadcast", async (req: Request, res: Response): Promise<void> => {
    try {
      const { segment, messageText, imageUrl, mediaUrl } = req.body;
      if (!messageText || !messageText.trim()) {
        res.status(400).json({ error: "Message text is required" });
        return;
      }

      const supportState = waManager.getSessionState(SYSTEM_SUPPORT_SESSION_ID);
      if (supportState.status !== "connected") {
        res.status(503).json({
          error: "Official Support WhatsApp (+91 9279259690) is currently disconnected. Please link it first.",
        });
        return;
      }

      const [users, businesses] = await Promise.all([
        db.users.findMany().catch(() => []),
        db.businesses.findMany().catch(() => []),
      ]);

      let targets = users.filter((u) => u.role !== "staff" && u.status !== "suspended");
      const validSegment = segment || "all";
      if (validSegment === "free") {
        targets = targets.filter((u) => (u.plan || "free") === "free");
      } else if (validSegment === "pro") {
        targets = targets.filter((u) => u.plan === "pro");
      } else if (validSegment === "retail" || validSegment === "wholesale" || validSegment === "services") {
        targets = targets.filter((u) => u.businessType === validSegment);
      }

      const phoneSet = new Set<string>();
      const recipients: Array<{ phone: string; name: string }> = [];

      for (const u of targets) {
        const biz = businesses.find((b) => b.userId === u.id);
        const digits = normalizePhoneDigits(biz?.phone || "");
        if (digits && digits.length >= 10 && !phoneSet.has(digits)) {
          phoneSet.add(digits);
          recipients.push({ phone: digits, name: u.name });
        }
      }

      if (recipients.length === 0) {
        res.status(400).json({ error: "No active users found with valid phone numbers in this segment" });
        return;
      }

      let sentCount = 0;
      let failedCount = 0;

      for (const r of recipients) {
        try {
          let text = messageText.replace(/{{name}}/g, r.name).trim();
          // Anti-Ban: Include polite opt-out footer if not already included
          if (!text.toLowerCase().includes("stop") && !text.toLowerCase().includes("opt out")) {
            text += "\n\n_Reply STOP to opt out._";
          }
          const bannerUrl = (imageUrl || mediaUrl || "").trim() || undefined;
          const ok = await notificationService.sendSupportNotification(
            r.phone,
            text,
            { simulateTyping: true, randomizeHash: true },
            bannerUrl ? { mediaType: "image", mediaUrl: bannerUrl } : undefined
          );
          if (ok) {
            sentCount++;
            await db.messages.create({
              userId: SYSTEM_SUPPORT_SESSION_ID,
              contactPhone: r.phone,
              contactName: r.name,
              text,
              fromMe: "true",
              messageId: `broadcast_${randomUUID()}`,
              timestamp: new Date().toISOString(),
            }).catch(() => null);
          } else {
            failedCount++;
          }
        } catch {
          failedCount++;
        }
        // Anti-Ban: Humanized randomized delay (1.5s - 3.2s) between broadcast messages to avoid spam triggers
        const jitterMs = Math.floor(Math.random() * 1700) + 1500;
        await new Promise((resolve) => setTimeout(resolve, jitterMs));
      }

      const adminEmail = req.user?.email || "admin";
      await recordAuditLog(
        db,
        adminEmail,
        "BROADCAST",
        `Broadcast sent to ${sentCount}/${recipients.length} recipients (Segment: ${validSegment})`
      );

      res.json({
        message: `Broadcast completed: ${sentCount} sent, ${failedCount} failed`,
        sentCount,
        failedCount,
        totalRecipients: recipients.length,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to send broadcast" });
    }
  });

  // 8. Platform Analytics & Live KPIs
  router.get("/analytics", async (_req: Request, res: Response): Promise<void> => {
    try {
      const [users, businesses, customers, products, orders, leads] = await Promise.all([
        db.users.findMany().catch(() => []),
        db.businesses.findMany().catch(() => []),
        db.customers.findMany().catch(() => []),
        db.products.findMany().catch(() => []),
        db.orders.findMany().catch(() => []),
        db.leads.findMany().catch(() => []),
      ]);

      const merchants = users.filter((u) => u.role !== "staff");
      const staff = users.filter((u) => u.role === "staff");

      const totalRevenue = orders
        .filter((o) => o.status !== "cancelled")
        .reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);

      const businessTypeBreakdown = {
        retail: merchants.filter((u) => u.businessType === "retail").length,
        wholesale: merchants.filter((u) => u.businessType === "wholesale").length,
        services: merchants.filter((u) => u.businessType === "services").length,
        restaurant: merchants.filter((u) => u.businessType === "restaurant").length,
        garments: merchants.filter((u) => u.businessType === "garments").length,
        hotel: merchants.filter((u) => u.businessType === "hotel").length,
      };

      const planBreakdown = {
        free: merchants.filter((u) => (u.plan || "free") === "free").length,
        pro: merchants.filter((u) => u.plan === "pro").length,
      };

      let activeWhatsAppCount = 0;
      const supportState = waManager.getSessionState(SYSTEM_SUPPORT_SESSION_ID);
      if (supportState.status === "connected") activeWhatsAppCount++;

      for (const m of merchants) {
        const s = waManager.getSessionState(m.id);
        if (s.status === "connected") {
          activeWhatsAppCount++;
        }
      }

      const merchantMap: Record<string, { name: string; email: string; businessName: string; businessType: string; plan: string; orders: number; revenue: number }> = {};
      for (const m of merchants) {
        const b = businesses.find((x) => x.userId === m.id);
        merchantMap[m.id] = {
          name: m.name,
          email: m.email,
          businessName: b?.name || `${m.name}'s Business`,
          businessType: m.businessType,
          plan: m.plan || "free",
          orders: 0,
          revenue: 0,
        };
      }
      for (const ord of orders) {
        if (merchantMap[ord.userId]) {
          merchantMap[ord.userId].orders += 1;
          if (ord.status !== "cancelled") {
            merchantMap[ord.userId].revenue += (Number(ord.totalAmount) || 0);
          }
        }
      }

      const topMerchants = Object.entries(merchantMap)
        .map(([id, info]) => ({ id, ...info }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      const recentOrders = [...orders]
        .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
        .slice(0, 5)
        .map((o) => ({
          id: o.id,
          customerName: o.customerName,
          customerPhone: o.customerPhone,
          totalAmount: o.totalAmount,
          status: o.status,
          createdAt: o.createdAt,
        }));

      res.json({
        overview: {
          totalMerchants: merchants.length,
          totalStaff: staff.length,
          totalCustomers: customers.length,
          totalProducts: products.length,
          totalOrders: orders.length,
          totalLeads: leads.length,
          totalRevenue,
          activeWhatsAppSessions: activeWhatsAppCount,
          businessTypeBreakdown,
          planBreakdown,
        },
        topMerchants,
        recentOrders,
        systemHealth: {
          status: "operational",
          uptimeSeconds: Math.floor(process.uptime()),
          timestamp: new Date().toISOString(),
        },
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Could not retrieve analytics" });
    }
  });

  // 9. Merchant 360° Detailed Registry
  router.get("/merchants", async (_req: Request, res: Response): Promise<void> => {
    try {
      const [users, businesses, customers, products, orders, leads] = await Promise.all([
        db.users.findMany().catch(() => []),
        db.businesses.findMany().catch(() => []),
        db.customers.findMany().catch(() => []),
        db.products.findMany().catch(() => []),
        db.orders.findMany().catch(() => []),
        db.leads.findMany().catch(() => []),
      ]);

      const merchants = users.map((u) => {
        const biz = businesses.find((b) => b.userId === u.id);
        const userOrders = orders.filter((o) => o.userId === u.id);
        const userProducts = products.filter((p) => p.userId === u.id);
        const userCustomers = customers.filter((c) => c.userId === u.id);
        const userLeads = leads.filter((l) => l.userId === u.id);
        const userStaff = users.filter((x) => x.ownerId === u.id);
        const totalRevenue = userOrders
          .filter((o) => o.status !== "cancelled")
          .reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);

        const waState = waManager.getSessionState(u.id);

        return {
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          businessType: u.businessType,
          status: u.status || "active",
          plan: u.plan || "free",
          leadsEnabled: Boolean(u.leadsEnabled === true),
          ownerId: u.ownerId,
          createdAt: u.createdAt,
          business: {
            name: biz?.name || `${u.name}'s Business`,
            phone: biz?.phone || "",
            slug: biz?.slug || "",
            address: biz?.address || "",
          },
          counts: {
            products: userProducts.length,
            orders: userOrders.length,
            customers: userCustomers.length,
            leads: userLeads.length,
            staff: userStaff.length,
            revenue: totalRevenue,
          },
          whatsapp: {
            status: waState.status,
            phone: waState.phoneNumber,
          },
        };
      });

      res.json({ merchants });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to load merchants list" });
    }
  });

  // 10. Admin Update User (Status, Plan, Business Type, Name)
  router.put("/users/:id", async (req: Request, res: Response): Promise<void> => {
    try {
      const target = await db.users.findById((req.params.id as string));
      if (!target) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      const { status, plan, businessType, name } = req.body;
      if (status === "suspended" && target.role === "admin") {
        res.status(400).json({ error: "Cannot suspend an administrator account" });
        return;
      }

      const patch: any = {};
      if (status && (status === "active" || status === "suspended")) patch.status = status;
      if (plan && (plan === "free" || plan === "pro")) {
        patch.plan = plan;
        if (plan === "free") {
          patch.subscriptionStatus = "none";
          patch.planExpiresAt = "";
          patch.paymentUtr = "";
        } else if (plan === "pro") {
          patch.subscriptionStatus = "active";
          if (!target.planExpiresAt || new Date(target.planExpiresAt).getTime() < Date.now()) {
            patch.planExpiresAt = new Date(Date.now() + 30 * 86400000).toISOString();
            patch.planPurchasedAt = new Date().toISOString();
          }
        }
      }
      if (businessType && ["retail", "wholesale", "services", "restaurant", "garments", "hotel"].includes(businessType)) patch.businessType = businessType;
      if (name && typeof name === "string" && name.trim()) patch.name = name.trim();
      if (typeof req.body.leadsEnabled === "boolean") patch.leadsEnabled = req.body.leadsEnabled;

      const updated = await db.users.update(target.id, patch);

      if (io) {
        io.to(`user:${target.id}`).emit("user:updated", {
          id: updated.id,
          name: updated.name,
          email: updated.email,
          role: updated.role,
          businessType: updated.businessType,
          status: updated.status || "active",
          plan: updated.plan || "free",
          subscriptionStatus: updated.subscriptionStatus || "none",
          planExpiresAt: updated.planExpiresAt || null,
          leadsEnabled: Boolean(updated.leadsEnabled === true),
        });
      }

      const adminEmail = req.user?.email || "admin";
      await recordAuditLog(
        db,
        adminEmail,
        "USER_UPDATE",
        `Updated account ${target.email} (${Object.keys(patch).map((k) => `${k}=${patch[k]}`).join(", ")})`
      );

      res.json({
        user: {
          id: updated.id,
          name: updated.name,
          email: updated.email,
          role: updated.role,
          businessType: updated.businessType,
          status: updated.status || "active",
          plan: updated.plan || "free",
          subscriptionStatus: updated.subscriptionStatus || "none",
          planExpiresAt: updated.planExpiresAt || null,
          leadsEnabled: Boolean(updated.leadsEnabled === true),
          createdAt: updated.createdAt,
        },
        message: "User account updated successfully",
      });
    } catch {
      res.status(500).json({ error: "Could not update user account" });
    }
  });

  // 10b. Admin Toggle B2B Leads Discovery Access for Merchant
  router.post("/merchants/:id/toggle-leads", async (req: Request, res: Response): Promise<void> => {
    try {
      const target = await db.users.findById((req.params.id as string));
      if (!target) {
        res.status(404).json({ error: "Merchant not found" });
        return;
      }

      const enabled = typeof req.body.enabled === "boolean" ? req.body.enabled : !target.leadsEnabled;
      const updated = await db.users.update(target.id, { leadsEnabled: enabled });

      if (io) {
        io.to(`user:${target.id}`).emit("user:updated", {
          id: updated.id,
          leadsEnabled: enabled,
        });
      }

      const adminEmail = req.user?.email || "admin";
      await recordAuditLog(
        db,
        adminEmail,
        "TOGGLE_LEADS_ACCESS",
        `${enabled ? "Enabled" : "Disabled"} B2B Leads Discovery for merchant ${target.name} (${target.email})`
      );

      res.json({
        success: true,
        leadsEnabled: enabled,
        message: `B2B Leads Discovery ${enabled ? "activated" : "deactivated"} for ${target.name}`,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to toggle leads access" });
    }
  });

  // 11. Admin Password Reset (with optional WhatsApp delivery)
  router.post("/users/:id/reset-password", async (req: Request, res: Response): Promise<void> => {
    try {
      const target = await db.users.findById((req.params.id as string));
      if (!target) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      const { newPassword, notifyWhatsApp } = req.body;
      const tempPassword =
        newPassword && String(newPassword).length >= 6
          ? String(newPassword).trim()
          : `Ginie@${Math.floor(100000 + Math.random() * 900000)}`;

      const passwordHash = await bcrypt.hash(tempPassword, 10);
      await db.users.update(target.id, { passwordHash });

      const adminEmail = req.user?.email || "admin";
      await recordAuditLog(
        db,
        adminEmail,
        "RESET_PASSWORD",
        `Admin reset password for ${target.email}`
      );

      let notified = false;
      if (notifyWhatsApp) {
        const biz = await db.businesses.findOne({ userId: target.id }).catch(() => null);
        const targetPhone = normalizePhoneDigits(biz?.phone || "");
        if (targetPhone && targetPhone.length >= 10) {
          const msg =
            `🔐 *GinieSpace Admin Password Reset*\n\n` +
            `Hello *${target.name}*,\n` +
            `Your password has been reset by the platform administrator.\n\n` +
            `📧 *Email:* ${target.email}\n` +
            `🔑 *Temporary Password:* *${tempPassword}*\n\n` +
            `Please sign in at https://app.ginie.space/login and update your password in Settings.\n\n` +
            `- GinieSpace Official Support (+91 9279259690)`;
          notified = await notificationService.sendSupportNotification(targetPhone, msg);
        }
      }

      res.json({
        message: `Password reset successfully for ${target.email}`,
        temporaryPassword: tempPassword,
        notifiedOnWhatsApp: notified,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to reset password" });
    }
  });

  // 12. Admin Force Disconnect Merchant WhatsApp
  router.post("/users/:id/disconnect-whatsapp", async (req: Request, res: Response): Promise<void> => {
    try {
      const target = await db.users.findById((req.params.id as string));
      if (!target) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      await waManager.disconnectSession(target.id);

      const adminEmail = req.user?.email || "admin";
      await recordAuditLog(
        db,
        adminEmail,
        "DISCONNECT_WA",
        `Admin disconnected WhatsApp session for ${target.email}`
      );

      res.json({ message: `WhatsApp session disconnected for ${target.name}` });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to disconnect WhatsApp session" });
    }
  });

  // 13. Admin Delete User Account (Guarded against Admin)
  router.delete("/users/:id", async (req: Request, res: Response): Promise<void> => {
    try {
      const target = await db.users.findById((req.params.id as string));
      if (!target) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      if (target.role === "admin") {
        res.status(400).json({ error: "Cannot delete an administrator account" });
        return;
      }

      try {
        await waManager.disconnectSession(target.id);
      } catch {}

      // 1. Delete associated business profile (frees up phone number & store slug)
      const biz = await db.businesses.findOne({ userId: target.id }).catch(() => null);
      if (biz) {
        await db.businesses.delete(biz.id).catch(() => {});
      }

      // 2. Delete staff accounts created by this merchant
      const staffAccounts = await db.users.findMany({ ownerId: target.id }).catch(() => []);
      for (const s of staffAccounts) {
        await db.users.delete(s.id).catch(() => {});
      }

      // 3. Delete products belonging to this merchant
      const prods = await db.products.findMany({ userId: target.id }).catch(() => []);
      for (const p of prods) {
        await db.products.delete(p.id).catch(() => {});
      }

      // 4. Delete the user account
      await db.users.delete(target.id);

      const adminEmail = req.user?.email || "admin";
      await recordAuditLog(
        db,
        adminEmail,
        "DELETE_USER",
        `Admin deleted user account ${target.email} (${target.name}) and released registered phone`
      );

      res.json({ message: `User account ${target.email} and all workspace data deleted successfully` });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to delete user account" });
    }
  });

  // 14. 1-Click Pro Upgrade Pitch via Support WhatsApp
  router.post("/users/:id/send-pro-pitch", async (req: Request, res: Response): Promise<void> => {
    try {
      const target = await db.users.findById((req.params.id as string));
      if (!target) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      const biz = await db.businesses.findOne({ userId: target.id }).catch(() => null);
      const targetPhone = normalizePhoneDigits(biz?.phone || "");
      if (!targetPhone || targetPhone.length < 10) {
        res.status(400).json({ error: "User does not have a valid store contact phone saved" });
        return;
      }

      const supportState = waManager.getSessionState(SYSTEM_SUPPORT_SESSION_ID);
      if (supportState.status !== "connected") {
        res.status(503).json({ error: "Official Support WhatsApp (+91 9279259690) is currently offline" });
        return;
      }

      const pitchMessage =
        `🌟 *Upgrade to GinieSpace PRO Plan*\n\n` +
        `Namaste *${target.name}* (${biz?.name || "Store"}),\n\n` +
        `Aapke business ko grow karne ke liye GinieSpace PRO plan me ye powerful features unlock hote hain:\n` +
        `  ✅ *Unlimited Catalog Products* (No 25-item limit)\n` +
        `  ✅ *Unlimited Google Maps Leads Finder* (No 30-leads limit)\n` +
        `  ✅ *Up to 10 Team / Staff Accounts* with role permissions\n` +
        `  ✅ *Bulk WhatsApp Broadcast Alerts*\n` +
        `  ✅ *Priority 24/7 Official Support*\n\n` +
        `💰 *Special Pro Upgrade:* Only ₹499/month (or ₹3,999/year)\n` +
        `💳 *UPI ID:* paytmqr9tziqdamfo@paytm\n\n` +
        `Payment ke baad screenshot is number par send karein, aapka plan instant activate kar diya jayega!\n\n` +
        `- GinieSpace Growth Team (+91 9279259690)`;

      const ok = await notificationService.sendSupportNotification(targetPhone, pitchMessage);
      if (!ok) {
        res.status(503).json({ error: "Failed to deliver WhatsApp message" });
        return;
      }

      await db.messages.create({
        userId: SYSTEM_SUPPORT_SESSION_ID,
        contactPhone: targetPhone,
        contactName: target.name,
        text: pitchMessage,
        fromMe: "true",
        messageId: `pitch_${randomUUID()}`,
        timestamp: new Date().toISOString(),
      }).catch(() => null);

      res.json({ message: `Pro upgrade details sent on WhatsApp to +${targetPhone}` });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to send upgrade pitch" });
    }
  });

  // 15. System Announcement Management
  router.get("/announcement", async (_req: Request, res: Response): Promise<void> => {
    try {
      const setting = await db.settings.findOne({ userId: "admin", key: "platform_announcement" }).catch(() => null);
      const defaultAnnouncement = {
        enabled: false,
        title: "Platform Notice",
        message: "",
        type: "info",
      };
      const announcement = setting?.value ? { ...defaultAnnouncement, ...JSON.parse(setting.value) } : defaultAnnouncement;
      res.json({ announcement });
    } catch {
      res.status(500).json({ error: "Failed to load announcement" });
    }
  });

  router.post("/announcement", async (req: Request, res: Response): Promise<void> => {
    try {
      const { enabled, title, message: msg, type } = req.body;
      const payload = {
        enabled: Boolean(enabled),
        title: title || "Platform Announcement",
        message: String(msg || "").trim(),
        type: ["info", "warning", "success", "error"].includes(type) ? type : "info",
        updatedAt: new Date().toISOString(),
      };

      const existing = await db.settings.findOne({ userId: "admin", key: "platform_announcement" }).catch(() => null);
      if (existing) {
        await db.settings.update(existing.id, { value: JSON.stringify(payload) });
      } else {
        await db.settings.create({
          userId: "admin",
          key: "platform_announcement",
          value: JSON.stringify(payload),
        });
      }

      const adminEmail = req.user?.email || "admin";
      await recordAuditLog(
        db,
        adminEmail,
        "ANNOUNCEMENT",
        `${payload.enabled ? "Enabled" : "Disabled"} announcement: "${payload.message.slice(0, 40)}..."`
      );

      res.json({ message: "Platform announcement updated", announcement: payload });
    } catch {
      res.status(500).json({ error: "Failed to save announcement" });
    }
  });

  // 16. Admin Activity Audit Logs
  router.get("/audit-logs", async (_req: Request, res: Response): Promise<void> => {
    try {
      const setting = await db.settings.findOne({ userId: "admin", key: "admin_audit_logs" }).catch(() => null);
      let logs: any[] = [];
      if (setting?.value) {
        try {
          logs = JSON.parse(setting.value);
        } catch {}
      }
      res.json({ logs });
    } catch {
      res.status(500).json({ error: "Failed to load audit logs" });
    }
  });

  // 17. Admin Full Workspace Data Backup Export
  router.get("/backup", async (_req: Request, res: Response): Promise<void> => {
    try {
      const [users, businesses, customers, products, orders, leads, settings] = await Promise.all([
        db.users.findMany(),
        db.businesses.findMany(),
        db.customers.findMany(),
        db.products.findMany(),
        db.orders.findMany(),
        db.leads.findMany(),
        db.settings.findMany(),
      ]);

      const safeUsers = users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        businessType: u.businessType,
        status: u.status || "active",
        plan: u.plan || "free",
        createdAt: u.createdAt,
      }));

      res.json({
        exportedAt: new Date().toISOString(),
        counts: {
          users: safeUsers.length,
          businesses: businesses.length,
          customers: customers.length,
          products: products.length,
          orders: orders.length,
          leads: leads.length,
          settings: settings.length,
        },
        data: {
          users: safeUsers,
          businesses,
          customers,
          products,
          orders,
          leads,
          settings,
        },
      });
    } catch {
      res.status(500).json({ error: "Could not generate platform backup" });
    }
  });

  // 18. List Subscriptions & Upgrade Requests
  router.get("/subscriptions", async (_req: Request, res: Response): Promise<void> => {
    try {
      const [users, businesses] = await Promise.all([
        db.users.findMany(),
        db.businesses.findMany(),
      ]);

      const bizMap = new Map<string, any>();
      for (const b of businesses) {
        bizMap.set(b.userId, b);
      }

      const subscriptions = users
        .filter((u) => u.role !== "staff")
        .map((u) => {
          const biz = bizMap.get(u.id);
          return {
            userId: u.id,
            name: u.name,
            email: u.email,
            storeName: biz?.name || "N/A",
            phone: biz?.phone || "N/A",
            plan: u.plan || "free",
            subscriptionStatus: u.subscriptionStatus || (u.plan === "pro" ? "active" : "none"),
            planPurchasedAt: u.planPurchasedAt || null,
            planExpiresAt: u.planExpiresAt || null,
            paymentUtr: u.paymentUtr || null,
            createdAt: u.createdAt,
          };
        })
        .sort((a, b) => {
          if (a.subscriptionStatus === "pending" && b.subscriptionStatus !== "pending") return -1;
          if (b.subscriptionStatus === "pending" && a.subscriptionStatus !== "pending") return 1;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });

      res.json({ subscriptions });
    } catch {
      res.status(500).json({ error: "Failed to load subscriptions" });
    }
  });

  // 19. Approve PRO Subscription (Activate 30 or 365 Days + WhatsApp Receipt)
  router.post("/subscriptions/:userId/approve", async (req: Request, res: Response): Promise<void> => {
    try {
      const targetUserId = req.params.userId;
      const { cycle = "monthly" } = req.body;
      const amount = req.body.amount || 0;
      const targetUser = await db.users.findById(targetUserId);

      if (!targetUser) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      const days = cycle === "yearly" ? 365 : 30;
      const now = new Date();
      const expiresAt = new Date(now.getTime() + days * 86400000).toISOString();

      await db.users.update(targetUserId, {
        plan: "pro",
        subscriptionStatus: "active",
        planPurchasedAt: now.toISOString(),
        planExpiresAt: expiresAt,
        updatedAt: now.toISOString(),
      });

      if (io) {
        io.to(`user:${targetUserId}`).emit("user:updated", {
          id: targetUserId,
          plan: "pro",
          subscriptionStatus: "active",
          planExpiresAt: expiresAt,
        });
      }

      const adminEmail = req.user?.email || "admin";
      await recordAuditLog(
        db,
        adminEmail,
        "APPROVE_SUBSCRIPTION",
        `Approved PRO plan for ${targetUser.email} (Amount: ₹${amount}, UTR: ${targetUser.paymentUtr || "Manual"}, Valid till: ${expiresAt.split("T")[0]})`
      );

      // Send Congratulatory WhatsApp Invoice / Receipt to Merchant
      const biz = await db.businesses.findOne({ userId: targetUserId }).catch(() => null);
      if (biz?.phone && notificationService) {
        const receiptMsg =
          `🎉 *Mubarak Ho ${targetUser.name}!*\n\n` +
          `Aapka *GinieSpace PRO Workspace* successfully activate ho gaya hai!\n\n` +
          `👑 *Plan:* PRO Workspace (${String(cycle).toUpperCase()})\n` +
          `💰 *Amount Paid:* ₹${amount}\n` +
          `🔢 *Reference / UTR:* \`${targetUser.paymentUtr || "VERIFIED"}\`\n` +
          `🗓️ *Valid Till:* ${new Date(expiresAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}\n\n` +
          `*Aapke Liye Sabhi Unlocked Features:*\n` +
          `✅ Unlimited Products & Services\n` +
          `✅ Unlimited B2B Google Leads Finder\n` +
          `✅ 5 Team Staff Accounts\n` +
          `✅ Bulk WhatsApp Broadcasts Unlocked\n` +
          `✅ Storefront Verified Merchant Badge\n\n` +
          `GinieSpace ke sath apna vyapar aage badhayein! 🚀\n\n` +
          `- GinieSpace Official Support (+91 92792 59690)`;

        await notificationService.sendSupportNotification(biz.phone, receiptMsg).catch(() => {});
      }

      res.json({
        success: true,
        message: `PRO Subscription approved for ${targetUser.name}! Valid till ${expiresAt.split("T")[0]}.`,
        expiresAt,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to approve subscription" });
    }
  });

  // 20. Reject / Reset Subscription Request
  router.post("/subscriptions/:userId/reject", async (req: Request, res: Response): Promise<void> => {
    try {
      const targetUserId = req.params.userId;
      const { reason = "Invalid UTR / Payment not received" } = req.body;
      const targetUser = await db.users.findById(targetUserId);

      if (!targetUser) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      await db.users.update(targetUserId, {
        plan: "free",
        subscriptionStatus: "none",
        planExpiresAt: "",
        paymentUtr: "",
        updatedAt: new Date().toISOString(),
      });

      if (io) {
        io.to(`user:${targetUserId}`).emit("user:updated", {
          id: targetUserId,
          plan: "free",
          subscriptionStatus: "none",
          planExpiresAt: null,
        });
      }

      const adminEmail = req.user?.email || "admin";
      await recordAuditLog(
        db,
        adminEmail,
        "REJECT_SUBSCRIPTION",
        `Rejected subscription request for ${targetUser.email} (Reason: ${reason})`
      );

      res.json({ success: true, message: "Subscription request rejected." });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to reject subscription" });
    }
  });

  // 21. Web Analytics & SEO Dashboard
  router.get("/web-analytics", async (_req: Request, res: Response): Promise<void> => {
    try {
      if (!analyticsService) {
        res.status(500).json({ error: "Analytics service not initialized" });
        return;
      }
      const report = await analyticsService.getAnalyticsReport();
      res.json(report);
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to fetch analytics report" });
    }
  });

  // 22. Update SEO & GA4 Settings
  router.post("/seo-settings", async (req: Request, res: Response): Promise<void> => {
    try {
      if (!analyticsService) {
        res.status(500).json({ error: "Analytics service not initialized" });
        return;
      }
      const { ga4MeasurementId, googleSiteVerification, targetKeywords } = req.body || {};
      await analyticsService.saveSeoSettings({
        ga4MeasurementId: String(ga4MeasurementId || "").trim(),
        googleSiteVerification: String(googleSiteVerification || "").trim(),
        targetKeywords: String(targetKeywords || "").trim(),
      });

      const adminEmail = req.user?.email || "admin";
      await recordAuditLog(
        db,
        adminEmail,
        "UPDATE_SEO_SETTINGS",
        `Updated SEO & GA4 settings (GA4: ${ga4MeasurementId || "None"}, Verification: ${googleSiteVerification ? "Updated" : "None"})`
      );

      res.json({ success: true, message: "SEO & GA4 configuration saved successfully!" });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to update SEO settings" });
    }
  });

  // ==========================================
  // MODULE 23: ADMIN MERCHANT LEAD ACQUISITION & CONVERSION SUITE
  // ==========================================

  // 1. Discover Leads via Google Places (No Quota Limits for Platform Admin)
  router.post("/leads/discover", async (req: Request, res: Response): Promise<void> => {
    try {
      if (!placesClient) {
        res.status(500).json({ error: "Google Places Client is not configured on the server" });
        return;
      }

      const { query, area, pincode, city, state, country, pageSize, pageToken } = req.body;

      const cleanQuery = (query || "").trim();
      const cleanCity = (city || "").trim();
      const cleanArea = (area || "").trim();
      const cleanPincode = (pincode || "").trim();

      if (!cleanQuery || !cleanCity || !cleanArea || !cleanPincode) {
        res.status(400).json({
          error: "All 4 search parameters (Business Category, City, Area/Locality, and 6-digit Pincode) are required for accurate local discovery.",
        });
        return;
      }

      if (!/^[1-9][0-9]{5}$/.test(cleanPincode)) {
        res.status(400).json({
          error: "Please enter a valid 6-digit Indian postal Pincode (e.g. 800020, 110001).",
        });
        return;
      }

      const cacheKey = [
        cleanQuery.toLowerCase(),
        cleanArea.toLowerCase(),
        cleanCity.toLowerCase(),
        cleanPincode,
        pageToken ? String(pageToken) : "",
      ].join("::");

      let results: any = null;
      const cached = leadsSearchCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
        results = cached.results;
      } else {
        results = await placesClient.searchLeads({
          query: cleanQuery,
          area: cleanArea,
          pincode: cleanPincode,
          city: cleanCity,
          state,
          country: country || "India",
          pageSize: pageSize ? Number(pageSize) : 20,
          pageToken: pageToken ? String(pageToken) : undefined,
        });
        leadsSearchCache.set(cacheKey, { timestamp: Date.now(), results });
        if (leadsSearchCache.size > 2000) {
          const oldest = leadsSearchCache.keys().next().value;
          if (oldest) leadsSearchCache.delete(oldest);
        }
      }

      // Cross-reference with live GinieSpace database to enrich leads with merchant registration & saved status
      const [allUsers, allBusinesses, adminSavedLeads] = await Promise.all([
        db.users.findMany().catch(() => []),
        db.businesses.findMany().catch(() => []),
        db.leads.findMany({ userId: req.user!.id }).catch(() => []),
      ]);

      const enrichedLeads = (results.leads || []).map((lead: any) => {
        const leadDigits = normalizePhoneDigits(lead.phone || "");
        const last10 = leadDigits.slice(-10);

        let registeredMerchant: any = null;
        if (last10 && last10.length === 10) {
          const matchingBiz = allBusinesses.find((b) => {
            const bDigits = normalizePhoneDigits(b.phone || "");
            return bDigits.slice(-10) === last10;
          });
          if (matchingBiz) {
            const matchingUser = allUsers.find((u) => u.id === matchingBiz.userId);
            if (matchingUser) {
              registeredMerchant = {
                id: matchingUser.id,
                name: matchingUser.name,
                email: matchingUser.email,
                plan: matchingUser.plan || "free",
                businessName: matchingBiz.name || matchingUser.name,
                slug: matchingBiz.slug || "",
                createdAt: matchingUser.createdAt,
              };
            }
          }
        }

        const savedMatch = adminSavedLeads.find((sl) => {
          if (sl.placeId && lead.id && sl.placeId === lead.id) return true;
          if (last10 && last10.length === 10) {
            const slDigits = normalizePhoneDigits(sl.phone || "");
            return slDigits.slice(-10) === last10;
          }
          return false;
        });

        return {
          ...lead,
          registeredMerchant,
          savedInfo: savedMatch
            ? {
                id: savedMatch.id,
                status: savedMatch.status,
                notes: savedMatch.notes,
                followUpDate: savedMatch.followUpDate,
              }
            : null,
        };
      });

      res.json({
        leads: enrichedLeads,
        nextPageToken: results.nextPageToken,
        totalFound: enrichedLeads.length,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to discover leads" });
    }
  });

  // 2. Get All Admin Saved Leads with Live Merchant Status & Stats
  router.get("/leads", async (req: Request, res: Response): Promise<void> => {
    try {
      const [leads, allUsers, allBusinesses] = await Promise.all([
        db.leads.findMany({ userId: req.user!.id }).catch(() => []),
        db.users.findMany().catch(() => []),
        db.businesses.findMany().catch(() => []),
      ]);

      let signedUpCount = 0;
      let proCount = 0;
      let newCount = 0;
      let contactedCount = 0;
      let convertedCount = 0;
      let archivedCount = 0;

      const enriched = leads.map((lead) => {
        const leadDigits = normalizePhoneDigits(lead.phone || "");
        const last10 = leadDigits.slice(-10);

        let registeredMerchant: any = null;
        if (last10 && last10.length === 10) {
          const matchingBiz = allBusinesses.find((b) => {
            const bDigits = normalizePhoneDigits(b.phone || "");
            return bDigits.slice(-10) === last10;
          });
          if (matchingBiz) {
            const matchingUser = allUsers.find((u) => u.id === matchingBiz.userId);
            if (matchingUser) {
              registeredMerchant = {
                id: matchingUser.id,
                name: matchingUser.name,
                email: matchingUser.email,
                plan: matchingUser.plan || "free",
                businessName: matchingBiz.name || matchingUser.name,
                slug: matchingBiz.slug || "",
                createdAt: matchingUser.createdAt,
              };
              signedUpCount++;
              if (matchingUser.plan === "pro") proCount++;
            }
          }
        }

        if (lead.status === "new") newCount++;
        else if (lead.status === "contacted") contactedCount++;
        else if (lead.status === "converted") convertedCount++;
        else if (lead.status === "archived") archivedCount++;

        return {
          ...lead,
          registeredMerchant,
        };
      });

      res.json({
        leads: enriched,
        stats: {
          totalSaved: leads.length,
          newCount,
          contactedCount,
          convertedCount,
          archivedCount,
          signedUpCount,
          proCount,
        },
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to load admin leads" });
    }
  });

  // 3. Save a Lead to Admin CRM
  router.post("/leads/save", async (req: Request, res: Response): Promise<void> => {
    try {
      const { placeId, name, phone, address, website, rating, ratingCount, category, notes, followUpDate, status } = req.body;
      if (!name) {
        res.status(400).json({ error: "Lead business name is required" });
        return;
      }

      const existingLeads = await db.leads.findMany({ userId: req.user!.id }).catch(() => []);
      const phoneDigits = normalizePhoneDigits(phone || "");
      const last10 = phoneDigits.slice(-10);

      const existing = existingLeads.find((l) => {
        if (placeId && l.placeId && l.placeId === placeId) return true;
        if (last10 && last10.length === 10) {
          const lDigits = normalizePhoneDigits(l.phone || "");
          return lDigits.slice(-10) === last10;
        }
        return false;
      });

      let lead: any;
      if (existing) {
        lead = await db.leads.update(existing.id, {
          name: name.trim(),
          phone: phone ? phone.trim() : existing.phone,
          address: address !== undefined ? address.trim() : existing.address,
          website: website !== undefined ? website.trim() : existing.website,
          rating: rating !== undefined ? Number(rating) : existing.rating,
          ratingCount: ratingCount !== undefined ? Number(ratingCount) : existing.ratingCount,
          category: category ? category.trim() : existing.category,
          status: status || existing.status,
          notes: notes !== undefined ? notes.trim() : existing.notes,
          followUpDate: followUpDate !== undefined ? followUpDate : existing.followUpDate,
        });
      } else {
        lead = await db.leads.create({
          userId: req.user!.id,
          placeId: placeId || "",
          name: name.trim(),
          phone: phone ? phone.trim() : undefined,
          address: address ? address.trim() : undefined,
          website: website ? website.trim() : undefined,
          rating: rating !== undefined ? Number(rating) : undefined,
          ratingCount: ratingCount !== undefined ? Number(ratingCount) : undefined,
          category: category ? category.trim() : "Retail Store",
          status: (status as LeadStatus) || "new",
          notes: notes ? notes.trim() : undefined,
          followUpDate: followUpDate ? String(followUpDate).trim() : undefined,
        });
      }

      res.status(201).json({ lead, message: "Lead saved to Admin CRM pipeline" });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to save lead" });
    }
  });

  // 4. Batch Save Multiple Leads to Admin CRM
  router.post("/leads/batch-save", async (req: Request, res: Response): Promise<void> => {
    try {
      const { leads } = req.body;
      if (!Array.isArray(leads) || leads.length === 0) {
        res.status(400).json({ error: "No leads provided for batch save" });
        return;
      }

      const existingLeads = await db.leads.findMany({ userId: req.user!.id }).catch(() => []);
      let savedCount = 0;

      for (const item of leads) {
        if (!item.name) continue;
        const itemDigits = normalizePhoneDigits(item.phone || "");
        const last10 = itemDigits.slice(-10);

        const exists = existingLeads.find((l) => {
          if (item.id && l.placeId && l.placeId === item.id) return true;
          if (last10 && last10.length === 10) {
            const lDigits = normalizePhoneDigits(l.phone || "");
            return lDigits.slice(-10) === last10;
          }
          return false;
        });

        if (!exists) {
          await db.leads.create({
            userId: req.user!.id,
            placeId: item.id || "",
            name: item.name.trim(),
            phone: item.phone ? item.phone.trim() : undefined,
            address: item.address ? item.address.trim() : undefined,
            website: item.website ? item.website.trim() : undefined,
            rating: item.rating !== undefined ? Number(item.rating) : undefined,
            ratingCount: item.ratingCount !== undefined ? Number(item.ratingCount) : undefined,
            category: item.category ? item.category.trim() : "Retail Store",
            status: "new",
          }).catch(() => {});
          savedCount++;
        }
      }

      res.json({ savedCount, message: `Successfully added ${savedCount} new leads to pipeline` });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to batch save leads" });
    }
  });

  // 5. Update Lead Details / Status
  router.put("/leads/:id", async (req: Request, res: Response): Promise<void> => {
    try {
      const existing = await db.leads.findById(req.params.id as string);
      if (!existing) {
        res.status(404).json({ error: "Lead not found" });
        return;
      }

      const { name, phone, address, status, notes, followUpDate, category } = req.body;
      const updated = await db.leads.update(existing.id, {
        name: name !== undefined ? name.trim() : existing.name,
        phone: phone !== undefined ? phone.trim() : existing.phone,
        address: address !== undefined ? address.trim() : existing.address,
        status: status !== undefined ? (status as LeadStatus) : existing.status,
        notes: notes !== undefined ? notes.trim() : existing.notes,
        followUpDate: followUpDate !== undefined ? followUpDate : existing.followUpDate,
        category: category !== undefined ? category.trim() : existing.category,
      });

      res.json({ lead: updated, message: "Lead updated successfully" });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to update lead" });
    }
  });

  // 6. Delete Lead from Admin CRM
  router.delete("/leads/:id", async (req: Request, res: Response): Promise<void> => {
    try {
      await db.leads.delete(req.params.id as string);
      res.json({ success: true, message: "Lead removed from pipeline" });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to delete lead" });
    }
  });

  // 7. Send WhatsApp Pitch Campaign (Batch or Single with Safe Throttle)
  router.post("/leads/whatsapp-pitch", async (req: Request, res: Response): Promise<void> => {
    try {
      const { leads, templateText, imageUrl } = req.body;
      if (!Array.isArray(leads) || leads.length === 0) {
        res.status(400).json({ error: "Please select at least one lead with a phone number" });
        return;
      }
      if (!templateText || !templateText.trim()) {
        res.status(400).json({ error: "Pitch message template text is required" });
        return;
      }

      const supportState = waManager.getSessionState(SYSTEM_SUPPORT_SESSION_ID);
      if (supportState.status !== "connected") {
        res.status(503).json({
          error: "Official Support WhatsApp (+91 92792 59690) is currently disconnected. Please connect WhatsApp Hub first.",
        });
        return;
      }

      const bannerUrl = (imageUrl || "").trim() || undefined;
      const media = bannerUrl
        ? { mediaType: "image" as const, mediaUrl: bannerUrl }
        : undefined;

      let sentCount = 0;
      let failedCount = 0;
      const results: any[] = [];
      const todayStr = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

      for (const lead of leads) {
        const phone = lead.phone?.trim();
        if (!phone) {
          failedCount++;
          results.push({ name: lead.name, status: "failed", reason: "Missing phone number" });
          continue;
        }

        const renderedText = templateText
          .replace(/{name}|{business_name}/gi, lead.name || "Merchant")
          .replace(/{city}/gi, lead.city || "your city")
          .replace(/{category}/gi, lead.category || "business")
          .replace(/{signup_url}/gi, "https://app.ginie.space/signup?ref=admin")
          .replace(/{demo_url}/gi, "https://app.ginie.space/shop/demo");

        try {
          const ok = await notificationService.sendSupportNotification(
            phone,
            renderedText,
            { simulateTyping: true, randomizeHash: true },
            media
          );

          if (ok) {
            sentCount++;
            results.push({ name: lead.name, phone, status: "sent" });

            // If lead has a DB id, update status to contacted & append note
            if (lead.id) {
              const currentLead = await db.leads.findById(lead.id).catch(() => null);
              if (currentLead) {
                const updatedNotes = currentLead.notes
                  ? `${currentLead.notes}\n[WA Pitch Sent on ${todayStr}]`
                  : `[WA Pitch Sent on ${todayStr}]`;
                await db.leads.update(currentLead.id, {
                  status: currentLead.status === "new" ? "contacted" : currentLead.status,
                  notes: updatedNotes,
                }).catch(() => {});
              }
            }
          } else {
            failedCount++;
            results.push({ name: lead.name, phone, status: "failed", reason: "Delivery failed" });
          }

          // Anti-spam humanized pause between multiple messages (1.5s - 2.5s)
          if (leads.length > 1) {
            await new Promise((resolve) => setTimeout(resolve, 1500 + Math.random() * 1000));
          }
        } catch (sendErr: any) {
          failedCount++;
          results.push({ name: lead.name, phone, status: "failed", reason: sendErr.message });
        }
      }

      await recordAuditLog(
        db,
        req.user?.email || "admin",
        "WHATSAPP_LEAD_PITCH",
        `Sent B2B onboarding pitch to ${sentCount} leads (failed: ${failedCount})`
      );

      res.json({
        success: true,
        sentCount,
        failedCount,
        total: leads.length,
        results,
        message: `Successfully delivered pitch to ${sentCount} of ${leads.length} leads!`,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to execute WhatsApp pitch campaign" });
    }
  });

  // 8. One-Click Instant Onboard as GinieSpace Merchant
  router.post("/leads/:id/onboard-merchant", async (req: Request, res: Response): Promise<void> => {
    try {
      const lead = await db.leads.findById(req.params.id as string);
      if (!lead) {
        res.status(404).json({ error: "Lead not found" });
        return;
      }

      if (!lead.phone) {
        res.status(400).json({ error: "This lead does not have a phone number to create an account" });
        return;
      }

      const phoneDigits = normalizePhoneDigits(lead.phone);
      const last10 = phoneDigits.slice(-10);
      if (last10.length !== 10) {
        res.status(400).json({ error: "Lead phone number is not a valid 10-digit mobile number" });
        return;
      }

      // Check if already registered
      const allBusinesses = await db.businesses.findMany().catch(() => []);
      const existingBiz = allBusinesses.find((b) => normalizePhoneDigits(b.phone || "").slice(-10) === last10);
      if (existingBiz) {
        res.status(400).json({ error: "An account with this mobile number already exists on GinieSpace" });
        return;
      }

      const categoryLower = (lead.category || "").toLowerCase();
      let businessType: BusinessType = "retail";
      if (categoryLower.includes("restaurant") || categoryLower.includes("food") || categoryLower.includes("cafe")) {
        businessType = "restaurant";
      } else if (categoryLower.includes("garment") || categoryLower.includes("cloth") || categoryLower.includes("boutique")) {
        businessType = "garments";
      } else if (categoryLower.includes("wholesale") || categoryLower.includes("distributor")) {
        businessType = "wholesale";
      } else if (categoryLower.includes("hotel") || categoryLower.includes("lodge") || categoryLower.includes("resort")) {
        businessType = "hotel";
      } else if (categoryLower.includes("service") || categoryLower.includes("salon") || categoryLower.includes("clinic") || categoryLower.includes("repair")) {
        businessType = "services";
      }

      // Generate credentials
      const cleanEmail = `merchant${last10}@ginie.space`;
      const tempPassword = `Ginie@${last10.slice(-4)}`;
      const passwordHash = await bcrypt.hash(tempPassword, 10);

      // Store slug
      const baseSlug = lead.name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "-")
        .replace(/-+/g, "-")
        .slice(0, 25);
      const cleanSlug = `${baseSlug}-${last10.slice(-4)}`;

      const newUser = await db.users.create({
        email: cleanEmail,
        passwordHash,
        name: lead.name.trim(),
        role: "user",
        businessType,
        status: "active",
        plan: "free",
      });

      const newBiz = await db.businesses.create({
        userId: newUser.id,
        name: lead.name.trim(),
        phone: toE164(lead.phone),
        address: lead.address || "",
        slug: cleanSlug,
        settingsJson: JSON.stringify({
          autoReply: true,
          welcomeMessage: `Namaste! Welcome to ${lead.name.trim()} on WhatsApp. Check our digital catalog and order easily!`,
        }),
      });

      // Update lead status
      await db.leads.update(lead.id, {
        status: "converted",
        notes: lead.notes
          ? `${lead.notes}\n[Onboarded as Merchant: ${cleanEmail} | Store: /shop/${cleanSlug}]`
          : `[Onboarded as Merchant: ${cleanEmail} | Store: /shop/${cleanSlug}]`,
      });

      // Send WhatsApp credentials & Store link if WhatsApp is connected
      const supportState = waManager.getSessionState(SYSTEM_SUPPORT_SESSION_ID);
      let waNotified = false;
      if (supportState.status === "connected") {
        const welcomeMsg =
          `🎉 *Badhai ho ${lead.name.trim()} ji!*\n\n` +
          `Aapki dukaan ka official digital storefront GinieSpace par live ho gaya hai:\n\n` +
          `🌐 *Live Store Link:* https://app.ginie.space/shop/${cleanSlug}\n` +
          `🔑 *Merchant Login:* https://app.ginie.space/login\n` +
          `• *Username:* ${cleanEmail}\n` +
          `• *Temp Password:* ${tempPassword}\n\n` +
          `Aap abhi login karke apne products aur UPI QR set kar sakte hain. Kisi bhi sahayata ke liye is number par message karein!`;

        await notificationService
          .sendSupportNotification(lead.phone, welcomeMsg, { simulateTyping: true, randomizeHash: true })
          .then(() => {
            waNotified = true;
          })
          .catch(() => {});
      }

      await recordAuditLog(
        db,
        req.user?.email || "admin",
        "INSTANT_ONBOARD_MERCHANT",
        `Created merchant account for ${lead.name} (${cleanEmail}, store: ${cleanSlug})`
      );

      res.status(201).json({
        success: true,
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          businessType: newUser.businessType,
          slug: newBiz.slug,
        },
        storeUrl: `https://app.ginie.space/shop/${cleanSlug}`,
        tempPassword,
        waNotified,
        message: `Account created for ${lead.name}! Credentials ${waNotified ? "sent via WhatsApp" : "generated"}.`,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to onboard merchant" });
    }
  });

  return router;
}
