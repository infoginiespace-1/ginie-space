import { Router, Request, Response } from "express";
import { randomUUID } from "crypto";
import { IDatabase } from "@giniespace/sheets-db";
import { WhatsAppSessionManager } from "@giniespace/whatsapp-engine";
import { SYSTEM_SUPPORT_SESSION_ID, SYSTEM_SUPPORT_PHONE, NotificationService } from "../services/notification.service";
import { normalizePhoneDigits } from "../utils/phone";

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
  router.post("/whatsapp/disconnect", async (_req: Request, res: Response): Promise<void> => {
    try {
      await waManager.disconnectSession(SYSTEM_SUPPORT_SESSION_ID);
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

  // 7. Admin Update User Status (active/suspended) & Plan (free/pro)
  router.put("/users/:id", async (req: Request, res: Response): Promise<void> => {
    try {
      const target = await db.users.findById((req.params.id as string));
      if (!target) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      const { status, plan } = req.body;
      if (status === "suspended" && target.role === "admin") {
        res.status(400).json({ error: "Cannot suspend an administrator account" });
        return;
      }

      const validStatus = status === "active" || status === "suspended" ? status : target.status || "active";
      const validPlan = plan === "free" || plan === "pro" ? plan : target.plan || "free";

      const updated = await db.users.update(target.id, {
        status: validStatus,
        plan: validPlan,
      });

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

  // 8. Admin Full Workspace Data Backup Export
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
