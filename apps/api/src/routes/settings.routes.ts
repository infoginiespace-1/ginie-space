import { Router, Request, Response } from "express";
import { IDatabase } from "@giniespace/sheets-db";
import { requireAdmin } from "../middleware/auth";
import { NotificationService } from "../services/notification.service";
import { normalizePhoneDigits } from "../utils/phone";

export function createSettingsRouter(
  db: IDatabase,
  notificationService?: NotificationService
): Router {
  const router = Router();

  router.get("/", async (req: Request, res: Response): Promise<void> => {
    try {
      const business = await db.businesses.findOne({ userId: req.user!.id });
      res.json({ business });
    } catch {
      res.status(500).json({ error: "Could not load settings" });
    }
  });

  router.put("/business", async (req: Request, res: Response): Promise<void> => {
    try {
      const { name, phone, address, settingsJson } = req.body;
      let business = await db.businesses.findOne({ userId: req.user!.id });

      if (business) {
        business = await db.businesses.update(business.id, {
          name: name !== undefined ? name.trim() : business.name,
          phone: phone !== undefined ? phone.trim() : business.phone,
          address: address !== undefined ? address.trim() : business.address,
          settingsJson: settingsJson !== undefined ? (typeof settingsJson === "string" ? settingsJson : JSON.stringify(settingsJson)) : business.settingsJson,
        });
      } else {
        business = await db.businesses.create({
          userId: req.user!.id,
          name: name ? name.trim() : "My Business",
          phone: phone ? phone.trim() : "",
          address: address ? address.trim() : "",
          settingsJson: settingsJson ? (typeof settingsJson === "string" ? settingsJson : JSON.stringify(settingsJson)) : "{}",
        });
      }

      res.json({ business, message: "Settings saved successfully" });
    } catch {
      res.status(500).json({ error: "Could not save settings" });
    }
  });

  // Admin-only user management
  router.get("/users", requireAdmin, async (_req: Request, res: Response): Promise<void> => {
    try {
      const users = await db.users.findMany();
      const sanitized = users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        businessType: u.businessType,
        createdAt: u.createdAt,
      }));
      res.json({ users: sanitized });
    } catch {
      res.status(500).json({ error: "Could not load users" });
    }
  });

  // Daily Business Summary via Official Support WhatsApp (9279259690)
  router.post("/daily-summary", async (req: Request, res: Response): Promise<void> => {
    try {
      if (!notificationService) {
        res.status(503).json({ error: "Notification service unavailable" });
        return;
      }

      const userId = req.user!.id;
      const [business, orders, products, customers, leads] = await Promise.all([
        db.businesses.findOne({ userId }),
        db.orders.findMany({ userId }),
        db.products.findMany({ userId }),
        db.customers.findMany({ userId }),
        db.leads.findMany({ userId }),
      ]);

      const rawPhone = (req.body?.phone as string) || business?.phone || "";
      const targetDigits = normalizePhoneDigits(rawPhone);
      if (!targetDigits || targetDigits.length < 10) {
        res.status(400).json({ error: "Please add your Store Contact Phone in Settings to receive WhatsApp summary." });
        return;
      }

      const todayPrefix = new Date().toISOString().slice(0, 10);
      const todayOrders = orders.filter((o) => (o.createdAt || "").startsWith(todayPrefix));
      const todaySales = todayOrders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
      const totalSales = orders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
      const pendingOrders = orders.filter((o) => o.status === "pending").length;
      const lowStockItems = products.filter((p) => Number(p.stock) <= 5);

      const storeName = business?.name || "Your Store";
      const lowStockPreview =
        lowStockItems.length > 0
          ? lowStockItems
              .slice(0, 5)
              .map((p) => `  • ${p.name} (${p.stock} ${p.unit || "left"})`)
              .join("\n")
          : "  All items in healthy stock!";

      const summaryMsg =
        `📊 *GinieSpace Daily Business Report*\n` +
        `🏪 *${storeName}* (${todayPrefix})\n\n` +
        `🛒 *Today's Orders:* ${todayOrders.length} (₹${todaySales.toLocaleString("en-IN")})\n` +
        `⏳ *Pending Orders:* ${pendingOrders}\n` +
        `💰 *Total Revenue:* ₹${totalSales.toLocaleString("en-IN")} (${orders.length} orders)\n` +
        `👥 *Customers:* ${customers.length} | 🎯 *Leads:* ${leads.length}\n\n` +
        `⚠️ *Low Stock Items (${lowStockItems.length}):*\n${lowStockPreview}\n\n` +
        `- GinieSpace Official Support (+91 9279259690)`;

      const sent = await notificationService.sendSupportNotification(targetDigits, summaryMsg);
      if (!sent) {
        res.status(503).json({
          error: "Support WhatsApp (+91 9279259690) is currently disconnected. Please ask Admin to link it first.",
        });
        return;
      }

      res.json({
        message: `Daily business summary sent on WhatsApp to +${targetDigits}`,
        summary: {
          todayOrders: todayOrders.length,
          todaySales,
          pendingOrders,
          totalSales,
          lowStockCount: lowStockItems.length,
        },
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to send daily summary" });
    }
  });

  return router;
}