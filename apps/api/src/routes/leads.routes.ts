import { Router, Request, Response } from "express";
import { IDatabase, LeadStatus } from "@giniespace/sheets-db";
import { GooglePlacesClient } from "@giniespace/places-client";
import { Server } from "socket.io";

export function createLeadsRouter(
  db: IDatabase,
  placesClient: GooglePlacesClient,
  io: Server
): Router {
  const router = Router();

  router.post("/discover", async (req: Request, res: Response): Promise<void> => {
    try {
      const { query, area, pincode, city, state, country, pageSize } = req.body;

      if (!query && !area && !pincode && !city) {
        res.status(400).json({ error: "Please enter at least a category, area, city, or pincode to search" });
        return;
      }

      const results = await placesClient.searchLeads({
        query: query || "business",
        area,
        pincode,
        city,
        state,
        country,
        pageSize: pageSize ? Number(pageSize) : 20,
      });

      res.json({
        leads: results.leads,
        nextPageToken: results.nextPageToken,
        totalFound: results.leads.length,
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
      const { placeId, name, phone, address, website, rating, ratingCount, category, notes } = req.body;

      if (!name) {
        res.status(400).json({ error: "Lead name is required" });
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

      const cleanPhone = phoneToUse.replace(/[^0-9+]/g, "");

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

  return router;
}