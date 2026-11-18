import { Router, Request, Response } from "express";
import { IDatabase, LeadStatus } from "@giniespace/sheets-db";
import { GooglePlacesClient } from "@giniespace/places-client";
import { Server } from "socket.io";
import { NotificationService } from "../services/notification.service";
import { toE164 } from "../utils/phone";
import { requireOwnerOrAdmin } from "../middleware/auth";
import { FREE_PLAN_LIMITS, PRO_PLAN_LIMITS, getEffectivePlan } from "../utils/plan";

interface CacheEntry {
  timestamp: number;
  results: any;
}

const leadsSearchCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24-hour cache to eliminate duplicate Google Places API costs

export function createLeadsRouter(
  db: IDatabase,
  placesClient: GooglePlacesClient,
  io: Server,
  notificationService?: NotificationService
): Router {
  const router = Router();

  router.get("/quota", async (req: Request, res: Response): Promise<void> => {
    try {
      const plan = await getEffectivePlan(db, req.user);
      const todayStr = new Date().toISOString().slice(0, 10);
      const searchSettingKey = `lead_searches_${todayStr}`;
      const searchSetting = await db.settings.findOne({ userId: req.user!.id, key: searchSettingKey });
      const usedToday = searchSetting ? parseInt(searchSetting.value, 10) || 0 : 0;

      const monthStr = new Date().toISOString().slice(0, 7);
      const monthSettingKey = `lead_searches_month_${monthStr}`;
      const monthSetting = await db.settings.findOne({ userId: req.user!.id, key: monthSettingKey });
      const usedThisMonth = monthSetting ? parseInt(monthSetting.value, 10) || 0 : 0;

      const savedLeads = await db.leads.findMany({ userId: req.user!.id });

      res.json({
        plan,
        usedToday,
        maxDaily: FREE_PLAN_LIMITS.maxDailyLeadSearches,
        remainingToday: Math.max(0, FREE_PLAN_LIMITS.maxDailyLeadSearches - usedToday),
        usedThisMonth,
        maxMonthly: PRO_PLAN_LIMITS.maxMonthlyLeadSearches,
        remainingThisMonth: Math.max(0, PRO_PLAN_LIMITS.maxMonthlyLeadSearches - usedThisMonth),
        savedLeadsCount: savedLeads.length,
        maxSavedLeads: plan === "free" ? FREE_PLAN_LIMITS.maxLeads : PRO_PLAN_LIMITS.maxLeads,
      });
    } catch {
      res.status(500).json({ error: "Could not load quota" });
    }
  });

  router.post("/discover", async (req: Request, res: Response): Promise<void> => {
    try {
      const { query, area, pincode, city, state, country, pageSize, pageToken } = req.body;

      if (!query && !area && !pincode && !city) {
        res.status(400).json({ error: "Please enter at least a category, area, city, or pincode to search" });
        return;
      }

      const plan = await getEffectivePlan(db, req.user);
      const todayStr = new Date().toISOString().slice(0, 10);
      const searchSettingKey = `lead_searches_${todayStr}`;
      const searchSetting = await db.settings.findOne({ userId: req.user!.id, key: searchSettingKey });
      const usedToday = searchSetting ? parseInt(searchSetting.value, 10) || 0 : 0;

      const monthStr = new Date().toISOString().slice(0, 7);
      const monthSettingKey = `lead_searches_month_${monthStr}`;
      const monthSetting = await db.settings.findOne({ userId: req.user!.id, key: monthSettingKey });
      const usedThisMonth = monthSetting ? parseInt(monthSetting.value, 10) || 0 : 0;

      if (plan === "free" && usedToday >= FREE_PLAN_LIMITS.maxDailyLeadSearches) {
        res.status(403).json({
          error: `Daily limit reached! Free plan includes ${FREE_PLAN_LIMITS.maxDailyLeadSearches} searches per day (up to 60 verified leads). Upgrade to PRO (₹199/mo) for 50 searches / 1,000 leads per month!`,
          requiresUpgrade: true,
          dailyLimitReached: true,
        });
        return;
      }

      if (plan === "pro" && usedThisMonth >= PRO_PLAN_LIMITS.maxMonthlyLeadSearches) {
        res.status(403).json({
          error: `Monthly PRO limit reached (${PRO_PLAN_LIMITS.maxMonthlyLeadSearches} searches / ~1,000 leads). Your quota will reset on the 1st of next month.`,
          monthlyLimitReached: true,
        });
        return;
      }

      const cacheKey = [
        (query || "").trim().toLowerCase(),
        (area || "").trim().toLowerCase(),
        (city || "").trim().toLowerCase(),
        (pincode || "").trim().toLowerCase(),
        pageToken ? String(pageToken) : "",
      ].join("::");

      let results: any = null;
      const cached = leadsSearchCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
        results = cached.results;
      } else {
        results = await placesClient.searchLeads({
          query: query || "business",
          area,
          pincode,
          city,
          state,
          country,
          pageSize: pageSize ? Number(pageSize) : 20,
          pageToken: pageToken ? String(pageToken) : undefined,
        });
        leadsSearchCache.set(cacheKey, { timestamp: Date.now(), results });
        if (leadsSearchCache.size > 2000) {
          const oldest = leadsSearchCache.keys().next().value;
          if (oldest) leadsSearchCache.delete(oldest);
        }
      }

      // Increment quota usage after successful search
      if (plan === "free") {
        if (searchSetting) {
          await db.settings.update(searchSetting.id, { value: String(usedToday + 1) }).catch(() => {});
        } else {
          await db.settings.create({ userId: req.user!.id, key: searchSettingKey, value: "1" }).catch(() => {});
        }
      } else {
        if (monthSetting) {
          await db.settings.update(monthSetting.id, { value: String(usedThisMonth + 1) }).catch(() => {});
        } else {
          await db.settings.create({ userId: req.user!.id, key: monthSettingKey, value: "1" }).catch(() => {});
        }
      }

      res.json({
        leads: results.leads,
        nextPageToken: results.nextPageToken,
        totalFound: results.leads.length,
        plan,
        usedToday: plan === "free" ? usedToday + 1 : undefined,
        remainingToday: plan === "free" ? Math.max(0, FREE_PLAN_LIMITS.maxDailyLeadSearches - (usedToday + 1)) : undefined,
        usedThisMonth: plan === "pro" ? usedThisMonth + 1 : undefined,
        remainingThisMonth: plan === "pro" ? Math.max(0, PRO_PLAN_LIMITS.maxMonthlyLeadSearches - (usedThisMonth + 1)) : undefined,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Could not complete lead search" });
    }
  });

  router.get("/", async (req: Request, res: Response): Promise<void> => {
    try {
      const filter = req.user?.role === "admin" ? undefined : { userId: req.user!.id };
      const leads = await db.leads.findMany(filter);
      res.json({ leads });
    } catch {
      res.status(500).json({ error: "Could not load saved leads" });
    }
  });

  router.post("/save", async (req: Request, res: Response): Promise<void> => {
    try {
      const { placeId, name, phone, address, website, rating, ratingCount, category, notes, followUpDate } = req.body;

      if (!name) {
        res.status(400).json({ error: "Lead name is required" });
        return;
      }

      const [plan, existingLeads] = await Promise.all([
        getEffectivePlan(db, req.user),
        db.leads.findMany({ userId: req.user!.id }),
      ]);
      if (plan === "free" && existingLeads.length >= FREE_PLAN_LIMITS.maxLeads) {
        res.status(403).json({
          error: `Free plan allows saving up to ${FREE_PLAN_LIMITS.maxLeads} leads. Upgrade to PRO (₹199/mo) for 10,000 CRM leads!`,
          requiresUpgrade: true,
        });
        return;
      }

      const lead = await db.leads.create({
        userId: req.user!.id,
        placeId: placeId || "",
        name: name.trim(),
        phone: phone ? phone.trim() : undefined,
        address: address ? address.trim() : undefined,
        website: website ? website.trim() : undefined,
        rating: rating !== undefined ? Number(rating) : undefined,
        ratingCount: ratingCount !== undefined ? Number(ratingCount) : undefined,
        category: category ? category.trim() : "General",
        status: "new",
        notes: notes ? notes.trim() : undefined,
        followUpDate: followUpDate ? String(followUpDate).trim() : undefined,
      });

      io.to(`user:${req.user!.id}`).emit("lead:saved", lead);

      res.status(201).json({ lead, message: "Lead saved to your book" });
    } catch {
      res.status(500).json({ error: "Could not save lead" });
    }
  });

  router.post("/:id/convert", async (req: Request, res: Response): Promise<void> => {
    try {
      const lead = await db.leads.findById((req.params.id as string));
      if (!lead) {
        res.status(404).json({ error: "Lead not found" });
        return;
      }
      if (req.user?.role !== "admin" && lead.userId !== req.user!.id) {
        res.status(403).json({ error: "Access denied" });
        return;
      }

      const phoneToUse = req.body.phone || lead.phone;
      if (!phoneToUse || phoneToUse === "#ERROR!") {
        res.status(400).json({ error: "This lead does not have a phone number to convert into a customer" });
        return;
      }

      const cleanPhone = toE164(phoneToUse) || phoneToUse.replace(/[^0-9+]/g, "");

      const customer = await db.customers.create({
        userId: lead.userId,
        name: lead.name,
        phone: cleanPhone,
        notes: `Converted from lead. Address: ${lead.address || "N/A"}`,
        tags: `Lead, ${lead.category}`,
      });

      const updatedLead = await db.leads.update(lead.id, {
        status: "converted",
      });

      io.to(`user:${lead.userId}`).emit("lead:converted", { leadId: lead.id, customer });
      io.to(`user:${lead.userId}`).emit("customer:created", customer);

      if (notificationService) {
        db.businesses.findOne({ userId: lead.userId }).then((biz) => {
          if (biz?.phone) {
            notificationService.notifyLeadConverted(biz.name || "Merchant", lead.name, biz.phone).catch(() => {});
          }
        }).catch(() => {});
      }

      res.json({
        customer,
        lead: updatedLead,
        message: "Lead successfully converted to Customer!",
      });
    } catch {
      res.status(500).json({ error: "Could not convert lead" });
    }
  });

  router.put("/:id/status", async (req: Request, res: Response): Promise<void> => {
    try {
      const { status } = req.body;
      const validStatuses: LeadStatus[] = ["new", "contacted", "converted", "archived"];

      if (!status || !validStatuses.includes(status)) {
        res.status(400).json({ error: `Status must be one of: ${validStatuses.join(", ")}` });
        return;
      }

      const existing = await db.leads.findById((req.params.id as string));
      if (!existing) {
        res.status(404).json({ error: "Lead not found" });
        return;
      }
      if (req.user?.role !== "admin" && existing.userId !== req.user!.id) {
        res.status(403).json({ error: "Access denied" });
        return;
      }

      const updated = await db.leads.update((req.params.id as string), {
        status: status as LeadStatus,
      });

      io.to(`user:${existing.userId}`).emit("lead:status_changed", updated);

      res.json({ lead: updated, message: `Lead marked as ${status}` });
    } catch {
      res.status(500).json({ error: "Could not update lead status" });
    }
  });

  router.put("/:id", async (req: Request, res: Response): Promise<void> => {
    try {
      const existing = await db.leads.findById((req.params.id as string));
      if (!existing) {
        res.status(404).json({ error: "Lead not found" });
        return;
      }
      if (req.user?.role !== "admin" && existing.userId !== req.user!.id) {
        res.status(403).json({ error: "Access denied" });
        return;
      }
      const { notes, followUpDate, status } = req.body;
      const validStatuses: LeadStatus[] = ["new", "contacted", "converted", "archived"];
      const nextStatus = status && validStatuses.includes(status) ? (status as LeadStatus) : existing.status;

      const updated = await db.leads.update(existing.id, {
        notes: notes !== undefined ? String(notes).trim() : existing.notes,
        followUpDate: followUpDate !== undefined ? String(followUpDate).trim() : existing.followUpDate,
        status: nextStatus,
      });
      res.json({ lead: updated, message: "Lead updated" });
    } catch {
      res.status(500).json({ error: "Could not update lead" });
    }
  });

  router.delete("/:id", requireOwnerOrAdmin, async (req: Request, res: Response): Promise<void> => {
    try {
      const existing = await db.leads.findById((req.params.id as string));
      if (!existing) {
        res.status(404).json({ error: "Lead not found" });
        return;
      }
      if (req.user?.role !== "admin" && existing.userId !== req.user!.id) {
        res.status(403).json({ error: "Access denied" });
        return;
      }
      await db.leads.delete((req.params.id as string));
      io.to(`user:${existing.userId}`).emit("lead:deleted", { id: (req.params.id as string) });
      res.json({ message: "Lead deleted successfully" });
    } catch {
      res.status(500).json({ error: "Could not delete lead" });
    }
  });

  return router;
}