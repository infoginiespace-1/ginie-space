import { Router, Request, Response } from "express";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import { IDatabase } from "@giniespace/sheets-db";
import { WhatsAppSessionManager } from "@giniespace/whatsapp-engine";
import { SYSTEM_SUPPORT_SESSION_ID, SYSTEM_SUPPORT_PHONE, NotificationService } from "../services/notification.service";
import { normalizePhoneDigits } from "../utils/phone";

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
  notificationService: NotificationService
): Router {
  const router = Router();

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

  // 4. Send Test Message from Support WhatsApp
  router.post("/whatsapp/send-test", async (req: Request, res: Response): Promise<void> => {
    try {
      const { recipientPhone, messageText } = req.body;
      if (!recipientPhone || !messageText) {
        res.status(400).json({ error: "Recipient phone number and message text are required" });
        return;
      }

      const success = await notificationService.sendSupportNotification(
        recipientPhone.trim(),
        messageText.trim()
      );

      if (!success) {
        res.status(503).json({ error: "Support WhatsApp (9279259690) is currently disconnected. Please link it first." });
        return;
      }

      const digits = normalizePhoneDigits(recipientPhone);
      if (digits) {
        try {
          await db.messages.create({
            userId: SYSTEM_SUPPORT_SESSION_ID,
            contactPhone: digits,
            contactName: `+${digits}`,
            text: messageText.trim(),
            fromMe: "true",
            messageId: `support_${randomUUID()}`,
            timestamp: new Date().toISOString(),
          });
        } catch (saveErr) {
          console.error("[Admin] Failed to save outgoing support message:", saveErr);
        }
      }

      res.json({ message: `Test message sent successfully to ${recipientPhone}` });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to send test message" });
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
      res.json({ messages: sorted });
    } catch {
      res.status(500).json({ error: "Failed to load support messages" });
    }
  });

  // 7. Bulk WhatsApp Broadcast from Official Bot
  router.post("/whatsapp/broadcast", async (req: Request, res: Response): Promise<void> => {
    try {
      const { segment, messageText } = req.body;
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
          const ok = await notificationService.sendSupportNotification(r.phone, text, {
            simulateTyping: true,
            randomizeHash: true,
          });
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
      if (plan && (plan === "free" || plan === "pro")) patch.plan = plan;
      if (businessType && ["retail", "wholesale", "services"].includes(businessType)) patch.businessType = businessType;
      if (name && typeof name === "string" && name.trim()) patch.name = name.trim();

      const updated = await db.users.update(target.id, patch);

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
          createdAt: updated.createdAt,
        },
        message: "User account updated successfully",
      });
    } catch {
      res.status(500).json({ error: "Could not update user account" });
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

      await db.users.delete(target.id);

      const adminEmail = req.user?.email || "admin";
      await recordAuditLog(
        db,
        adminEmail,
        "DELETE_USER",
        `Admin deleted user account ${target.email} (${target.name})`
      );

      res.json({ message: `User account ${target.email} deleted successfully` });
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
        `💳 *UPI ID:* info.giniespace@okaxis\n\n` +
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

  return router;
}
