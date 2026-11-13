import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { IDatabase } from "@giniespace/sheets-db";
import { requireAdmin, requireOwnerOrAdmin } from "../middleware/auth";
import { NotificationService } from "../services/notification.service";
import { normalizePhoneDigits } from "../utils/phone";
import { FREE_PLAN_LIMITS, PRO_PLAN_LIMITS, PRO_PRICING, getEffectivePlan } from "../utils/plan";

export function createSettingsRouter(
  db: IDatabase,
  notificationService?: NotificationService
): Router {
  const router = Router();

  router.get("/", async (req: Request, res: Response): Promise<void> => {
    try {
      const [business, currentUser] = await Promise.all([
        db.businesses.findOne({ userId: req.user!.id }),
        db.users.findById(req.user!.id).catch(() => null),
      ]);
      res.json({
        business,
        businessType: currentUser?.businessType || req.user?.businessType || "retail",
      });
    } catch {
      res.status(500).json({ error: "Could not load settings" });
    }
  });

  router.put("/business", requireOwnerOrAdmin, async (req: Request, res: Response): Promise<void> => {
    try {
      const { name, phone, address, settingsJson, slug, businessType } = req.body;
      let updatedBusinessType: "retail" | "wholesale" | "services" | undefined;
      if (businessType !== undefined) {
        if (!["retail", "wholesale", "services"].includes(String(businessType))) {
          res.status(400).json({ error: "Invalid businessType. Must be retail, wholesale, or services." });
          return;
        }
        updatedBusinessType = businessType as "retail" | "wholesale" | "services";
      }

      let cleanSlug: string | undefined;
      if (slug !== undefined) {
        const trimmedSlug = String(slug).trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
        if (trimmedSlug && trimmedSlug.length < 3) {
          res.status(400).json({ error: "Store custom link slug must be at least 3 characters (letters, numbers, hyphens)" });
          return;
        }
        if (trimmedSlug) {
          const allBusinesses = await db.businesses.findMany().catch(() => []);
          const conflict = allBusinesses.find(
            (b) => b.slug && b.slug.toLowerCase() === trimmedSlug && b.userId !== req.user!.id
          );
          if (conflict) {
            res.status(400).json({ error: "This custom storefront slug is already taken by another store" });
            return;
          }
        }
        cleanSlug = trimmedSlug;
      }

      let business = await db.businesses.findOne({ userId: req.user!.id });

      if (business) {
        business = await db.businesses.update(business.id, {
          name: name !== undefined ? name.trim() : business.name,
          phone: phone !== undefined ? phone.trim() : business.phone,
          address: address !== undefined ? address.trim() : business.address,
          slug: cleanSlug !== undefined ? cleanSlug : business.slug,
          settingsJson: settingsJson !== undefined ? (typeof settingsJson === "string" ? settingsJson : JSON.stringify(settingsJson)) : business.settingsJson,
        });
      } else {
        business = await db.businesses.create({
          userId: req.user!.id,
          name: name ? name.trim() : "My Business",
          phone: phone ? phone.trim() : "",
          address: address ? address.trim() : "",
          slug: cleanSlug,
          settingsJson: settingsJson ? (typeof settingsJson === "string" ? settingsJson : JSON.stringify(settingsJson)) : "{}",
        });
      }

      let resolvedBusinessType = req.user?.businessType || "retail";
      if (updatedBusinessType) {
        const ownerUser = await db.users.update(req.user!.id, { businessType: updatedBusinessType }).catch(() => null);
        resolvedBusinessType = ownerUser?.businessType || updatedBusinessType;
      }

      res.json({ business, businessType: resolvedBusinessType, message: "Settings saved successfully" });
    } catch {
      res.status(500).json({ error: "Could not save settings" });
    }
  });

  // Plan & Quotas Usage Endpoint
  router.get("/plan-usage", async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;
      const [plan, products, leads, allUsers, dbUser] = await Promise.all([
        getEffectivePlan(db, req.user),
        db.products.findMany({ userId }),
        db.leads.findMany({ userId }),
        db.users.findMany({ ownerId: userId }).catch(() => []),
        db.users.findById(userId).catch(() => null),
      ]);

      const limits = plan === "pro" ? PRO_PLAN_LIMITS : FREE_PLAN_LIMITS;

      res.json({
        plan,
        subscriptionStatus: dbUser?.subscriptionStatus || (plan === "pro" ? "active" : "none"),
        planExpiresAt: dbUser?.planExpiresAt || null,
        planPurchasedAt: dbUser?.planPurchasedAt || null,
        paymentUtr: dbUser?.paymentUtr || null,
        pricing: PRO_PRICING,
        usage: {
          productsCount: products.length,
          leadsCount: leads.length,
          staffCount: allUsers.length,
        },
        limits,
      });
    } catch {
      res.status(500).json({ error: "Could not load plan usage" });
    }
  });

  // Submit ₹99 PRO Upgrade Request with UPI UTR
  router.post("/upgrade-request", async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { utrNumber, billingCycle = "monthly", amount = 99 } = req.body;

      if (!utrNumber || String(utrNumber).trim().length < 6) {
        res.status(400).json({ error: "Please enter a valid 12-digit UPI UTR / Transaction Reference Number." });
        return;
      }

      const cleanUtr = String(utrNumber).trim();
      const user = await db.users.findById(userId);
      if (!user) {
        res.status(404).json({ error: "User account not found" });
        return;
      }

      const now = new Date().toISOString();
      await db.users.update(userId, {
        paymentUtr: cleanUtr,
        subscriptionStatus: "pending",
        updatedAt: now,
      });

      // Send Instant WhatsApp Alert to Admin Bot (+91 92792 59690)
      if (notificationService) {
        const biz = await db.businesses.findOne({ userId }).catch(() => null);
        const adminMsg = `🔔 *New PRO Subscription Upgrade Request!*\n\n` +
          `👤 *Merchant:* ${user.name} (${user.email})\n` +
          `🏪 *Store:* ${biz?.name || "N/A"}\n` +
          `📞 *Phone:* ${biz?.phone || "N/A"}\n` +
          `💰 *Amount:* ₹${amount} (${billingCycle})\n` +
          `🔢 *UPI UTR:* \`${cleanUtr}\`\n\n` +
          `Admin panel me jakar Subscriptions tab se Verify & 1-Click Approve karein:\n` +
          `https://app.ginie.space/admin`;

        await notificationService.sendSupportNotification(PRO_PRICING.supportPhone, adminMsg).catch(() => {});
      }

      res.json({
        success: true,
        message: "Your ₹99 PRO Upgrade request has been submitted! It will be verified and activated shortly.",
        subscriptionStatus: "pending",
        utr: cleanUtr,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to submit upgrade request" });
    }
  });

  // Team / Staff Multi-User Management
  router.get("/staff", requireOwnerOrAdmin, async (req: Request, res: Response): Promise<void> => {
    try {
      const staff = await db.users.findMany({ ownerId: req.user!.id });
      res.json({
        staff: staff.map((s) => ({
          id: s.id,
          name: s.name,
          email: s.email,
          status: s.status || "active",
          staffPermissions: s.staffPermissions || "orders,inbox,customers",
          createdAt: s.createdAt,
        })),
      });
    } catch {
      res.status(500).json({ error: "Could not load team staff accounts" });
    }
  });

  router.post("/staff", requireOwnerOrAdmin, async (req: Request, res: Response): Promise<void> => {
    try {
      const { name, email, password, staffPermissions } = req.body;
      if (!name || !email || !password) {
        res.status(400).json({ error: "Staff name, email, and password are required" });
        return;
      }
      if (String(password).length < 6) {
        res.status(400).json({ error: "Staff password must be at least 6 characters" });
        return;
      }

      const [plan, existingStaff] = await Promise.all([
        getEffectivePlan(db, req.user),
        db.users.findMany({ ownerId: req.user!.id }),
      ]);
      const maxStaff = plan === "pro" ? 10 : FREE_PLAN_LIMITS.maxStaff;
      if (existingStaff.length >= maxStaff) {
        res.status(403).json({
          error: `${plan === "pro" ? "Pro" : "Free"} plan supports up to ${maxStaff} staff account(s).`,
        });
        return;
      }

      const cleanEmail = String(email).toLowerCase().trim();
      const dup = await db.users.findOne({ email: cleanEmail }).catch(() => null);
      if (dup) {
        res.status(400).json({ error: "An account with this email already exists" });
        return;
      }

      const passwordHash = await bcrypt.hash(String(password), 10);
      const perms = Array.isArray(staffPermissions)
        ? staffPermissions.join(",")
        : String(staffPermissions || "orders,inbox,customers");

      const created = await db.users.create({
        email: cleanEmail,
        passwordHash,
        name: String(name).trim(),
        role: "staff",
        businessType: req.user!.businessType,
        ownerId: req.user!.id,
        staffPermissions: perms,
        status: "active",
        plan,
      });

      res.status(201).json({
        staff: {
          id: created.id,
          name: created.name,
          email: created.email,
          status: created.status,
          staffPermissions: created.staffPermissions,
          createdAt: created.createdAt,
        },
        message: "Staff account created successfully",
      });
    } catch {
      res.status(500).json({ error: "Could not create staff account" });
    }
  });

  router.delete("/staff/:staffId", requireOwnerOrAdmin, async (req: Request, res: Response): Promise<void> => {
    try {
      const target = await db.users.findById(String(req.params.staffId));
      if (!target || target.role !== "staff") {
        res.status(404).json({ error: "Staff member not found" });
        return;
      }
      if (req.user?.role !== "admin" && target.ownerId !== req.user!.id) {
        res.status(403).json({ error: "Access denied" });
        return;
      }
      await db.users.delete(target.id);
      res.json({ message: "Staff account removed" });
    } catch {
      res.status(500).json({ error: "Could not remove staff account" });
    }
  });

  // Active Platform Announcement Banner for all users
  router.get("/announcement", async (_req: Request, res: Response): Promise<void> => {
    try {
      const setting = await db.settings.findOne({ userId: "admin", key: "platform_announcement" }).catch(() => null);
      if (setting?.value) {
        const parsed = JSON.parse(setting.value);
        if (parsed.enabled && parsed.message) {
          res.json({ announcement: parsed });
          return;
        }
      }
      res.json({ announcement: null });
    } catch {
      res.json({ announcement: null });
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
        status: u.status || "active",
        plan: u.plan || "free",
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