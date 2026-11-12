import { Router, Request, Response } from "express";
import { IDatabase } from "@giniespace/sheets-db";
import { Server } from "socket.io";
import { requireOwnerOrAdmin } from "../middleware/auth";
import { normalizePhoneDigits } from "../utils/phone";

export function createCustomersRouter(db: IDatabase, io: Server): Router {
  const router = Router();

  router.get("/", async (req: Request, res: Response): Promise<void> => {
    try {
      const filter = req.user?.role === "admin" ? undefined : { userId: req.user!.id };
      const customers = await db.customers.findMany(filter);
      res.json({ customers });
    } catch {
      res.status(500).json({ error: "Could not load customers" });
    }
  });

  router.get("/:id", async (req: Request, res: Response): Promise<void> => {
    try {
      const customer = await db.customers.findById((req.params.id as string));
      if (!customer) {
        res.status(404).json({ error: "Customer not found" });
        return;
      }
      if (req.user?.role !== "admin" && customer.userId !== req.user!.id) {
        res.status(403).json({ error: "Access denied" });
        return;
      }
      res.json({ customer });
    } catch {
      res.status(500).json({ error: "Could not load customer" });
    }
  });

  router.get("/:id/ledger", async (req: Request, res: Response): Promise<void> => {
    try {
      const customer = await db.customers.findById((req.params.id as string));
      if (!customer) {
        res.status(404).json({ error: "Customer not found" });
        return;
      }
      if (req.user?.role !== "admin" && customer.userId !== req.user!.id) {
        res.status(403).json({ error: "Access denied" });
        return;
      }

      const custDigits = normalizePhoneDigits(customer.phone || "").slice(-10);
      const allOrders = await db.orders.findMany({ userId: customer.userId });
      const matchingOrders = allOrders
        .filter((o) => {
          if (o.customerId === customer.id) return true;
          const ordDigits = normalizePhoneDigits(o.customerPhone || "").slice(-10);
          return Boolean(custDigits && ordDigits && ordDigits === custDigits);
        })
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      let totalSpent = 0;
      let totalPaid = 0;
      let pendingDue = 0;
      for (const ord of matchingOrders) {
        if (ord.status === "cancelled") continue;
        const tot = Number(ord.totalAmount) || 0;
        const paid = ord.paymentStatus === "paid" ? tot : Math.min(tot, Number(ord.paidAmount) || 0);
        totalSpent += tot;
        totalPaid += paid;
        pendingDue += Math.max(0, tot - paid);
      }

      res.json({
        customer,
        orders: matchingOrders,
        summary: {
          totalOrders: matchingOrders.length,
          totalSpent,
          totalPaid,
          pendingDue,
        },
      });
    } catch {
      res.status(500).json({ error: "Could not load customer ledger" });
    }
  });

  router.post("/", async (req: Request, res: Response): Promise<void> => {
    try {
      const { name, phone, email, notes, tags } = req.body;
      if (!name || !phone) {
        res.status(400).json({ error: "Name and Phone Number are required" });
        return;
      }

      let digits = phone.replace(/[^0-9]/g, "");
      if (digits.startsWith("0") && digits.length === 11) digits = digits.slice(1);
      if (digits.length === 10) digits = `91${digits}`;
      const cleanPhone = `+${digits}`;

      const customer = await db.customers.create({
        userId: req.user!.id,
        name: name.trim(),
        phone: cleanPhone,
        email: email ? email.trim() : undefined,
        notes: notes ? notes.trim() : undefined,
        tags: tags ? tags.trim() : undefined,
      });

      io.to(`user:${req.user!.id}`).emit("customer:created", customer);

      res.status(201).json({ customer, message: "Customer added successfully" });
    } catch {
      res.status(500).json({ error: "Could not save customer" });
    }
  });

  router.put("/:id", async (req: Request, res: Response): Promise<void> => {
    try {
      const existing = await db.customers.findById((req.params.id as string));
      if (!existing) {
        res.status(404).json({ error: "Customer not found" });
        return;
      }
      if (req.user?.role !== "admin" && existing.userId !== req.user!.id) {
        res.status(403).json({ error: "Access denied" });
        return;
      }

      const { name, phone, email, notes, tags } = req.body;
      const updated = await db.customers.update((req.params.id as string), {
        name: name !== undefined ? name.trim() : existing.name,
        phone: phone !== undefined ? (() => {
        let d = phone.replace(/[^0-9]/g, "");
        if (d.startsWith("0") && d.length === 11) d = d.slice(1);
        if (d.length === 10) d = `91${d}`;
        return `+${d}`;
      })() : existing.phone,
        email: email !== undefined ? email.trim() : existing.email,
        notes: notes !== undefined ? notes.trim() : existing.notes,
        tags: tags !== undefined ? tags.trim() : existing.tags,
      });

      io.to(`user:${existing.userId}`).emit("customer:updated", updated);

      res.json({ customer: updated, message: "Customer updated successfully" });
    } catch {
      res.status(500).json({ error: "Could not update customer" });
    }
  });

  router.delete("/:id", requireOwnerOrAdmin, async (req: Request, res: Response): Promise<void> => {
    try {
      const existing = await db.customers.findById((req.params.id as string));
      if (!existing) {
        res.status(404).json({ error: "Customer not found" });
        return;
      }
      if (req.user?.role !== "admin" && existing.userId !== req.user!.id) {
        res.status(403).json({ error: "Access denied" });
        return;
      }

      await db.customers.delete((req.params.id as string));
      io.to(`user:${existing.userId}`).emit("customer:deleted", { id: (req.params.id as string) });

      res.json({ message: "Customer removed successfully" });
    } catch {
      res.status(500).json({ error: "Could not delete customer" });
    }
  });

  return router;
}