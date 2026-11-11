import { Router, Request, Response } from "express";
import { IDatabase } from "@giniespace/sheets-db";
import { Server } from "socket.io";

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
      const customer = await db.customers.findById(req.params.id);
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

  router.post("/", async (req: Request, res: Response): Promise<void> => {
    try {
      const { name, phone, email, notes, tags } = req.body;
      if (!name || !phone) {
        res.status(400).json({ error: "Name and Phone Number are required" });
        return;
      }

      const cleanPhone = phone.replace(/[^0-9+]/g, "");

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
      const existing = await db.customers.findById(req.params.id);
      if (!existing) {
        res.status(404).json({ error: "Customer not found" });
        return;
      }
      if (req.user?.role !== "admin" && existing.userId !== req.user!.id) {
        res.status(403).json({ error: "Access denied" });
        return;
      }

      const { name, phone, email, notes, tags } = req.body;
      const updated = await db.customers.update(req.params.id, {
        name: name !== undefined ? name.trim() : existing.name,
        phone: phone !== undefined ? phone.replace(/[^0-9+]/g, "") : existing.phone,
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

  router.delete("/:id", async (req: Request, res: Response): Promise<void> => {
    try {
      const existing = await db.customers.findById(req.params.id);
      if (!existing) {
        res.status(404).json({ error: "Customer not found" });
        return;
      }
      if (req.user?.role !== "admin" && existing.userId !== req.user!.id) {
        res.status(403).json({ error: "Access denied" });
        return;
      }

      await db.customers.delete(req.params.id);
      io.to(`user:${existing.userId}`).emit("customer:deleted", { id: req.params.id });

      res.json({ message: "Customer removed successfully" });
    } catch {
      res.status(500).json({ error: "Could not delete customer" });
    }
  });

  return router;
}