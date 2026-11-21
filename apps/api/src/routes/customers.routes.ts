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

      const sortMode = String(req.query.sort || "latest");
      customers.sort((a, b) => {
        if (sortMode === "alpha") {
          return String(a.name || "").localeCompare(String(b.name || ""));
        }
        if (sortMode === "oldest") {
          return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
        }
        // Default: latest added / converted customer first
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      });

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
        res.status(404).json({ error: "Customer not found" });
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
        res.status(404).json({ error: "Customer not found" });
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

  // Feature 1: Settle Customer Udhaar / Khata Dues across oldest unpaid orders
  router.post("/:id/settle-dues", async (req: Request, res: Response): Promise<void> => {
    try {
      const customer = await db.customers.findById((req.params.id as string));
      if (!customer) {
        res.status(404).json({ error: "Customer not found" });
        return;
      }
      if (req.user?.role !== "admin" && customer.userId !== req.user!.id) {
        res.status(404).json({ error: "Customer not found" });
        return;
      }

      const settleAmount = Number(req.body.settleAmount) || 0;
      if (settleAmount <= 0) {
        res.status(400).json({ error: "Please enter a valid settlement amount greater than 0" });
        return;
      }

      const custDigits = normalizePhoneDigits(customer.phone || "").slice(-10);
      const allOrders = await db.orders.findMany({ userId: customer.userId });
      // Find unpaid or partial orders sorted oldest to newest
      const unpaidOrders = allOrders
        .filter((o) => {
          if (o.status === "cancelled" || o.paymentStatus === "paid") return false;
          if (o.customerId === customer.id) return true;
          const ordDigits = normalizePhoneDigits(o.customerPhone || "").slice(-10);
          return Boolean(custDigits && ordDigits && ordDigits === custDigits);
        })
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

      let remainingToSettle = settleAmount;
      const updatedOrderIds: string[] = [];

      for (const order of unpaidOrders) {
        if (remainingToSettle <= 0) break;
        const total = Number(order.totalAmount) || 0;
        const currentPaid = Number(order.paidAmount) || 0;
        const currentDue = Math.max(0, total - currentPaid);

        if (currentDue > 0) {
          const paying = Math.min(currentDue, remainingToSettle);
          const newPaid = currentPaid + paying;
          const newStatus = newPaid >= total ? "paid" : "partial";
          const settleTag = `[Khata Settle ₹${paying} on ${new Date().toLocaleDateString()}]`;
          const newNotes = order.notes ? `${order.notes} • ${settleTag}` : settleTag;

          await db.orders.update(order.id, {
            paidAmount: newPaid,
            paymentStatus: newStatus,
            notes: newNotes,
          });

          remainingToSettle -= paying;
          updatedOrderIds.push(order.id);
        }
      }

      res.json({
        success: true,
        settledAmount: settleAmount - remainingToSettle,
        remainingBalance: remainingToSettle,
        updatedOrdersCount: updatedOrderIds.length,
        message: `Successfully settled ₹${settleAmount - remainingToSettle} across ${updatedOrderIds.length} orders!`,
      });
    } catch {
      res.status(500).json({ error: "Failed to settle customer dues" });
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
        res.status(404).json({ error: "Customer not found" });
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
        res.status(404).json({ error: "Customer not found" });
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