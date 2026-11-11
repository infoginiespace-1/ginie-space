import { Router, Request, Response } from "express";
import { IDatabase } from "@giniespace/sheets-db";
import { Server } from "socket.io";

export function createProductsRouter(db: IDatabase, io: Server): Router {
  const router = Router();

  router.get("/", async (req: Request, res: Response): Promise<void> => {
    try {
      const filter = req.user?.role === "admin" ? undefined : { userId: req.user!.id };
      const products = await db.products.findMany(filter);
      res.json({ products });
    } catch {
      res.status(500).json({ error: "Could not load items" });
    }
  });

  router.get("/:id", async (req: Request, res: Response): Promise<void> => {
    try {
      const product = await db.products.findById(req.params.id);
      if (!product) {
        res.status(404).json({ error: "Item not found" });
        return;
      }
      if (req.user?.role !== "admin" && product.userId !== req.user!.id) {
        res.status(403).json({ error: "Access denied" });
        return;
      }
      res.json({ product });
    } catch {
      res.status(500).json({ error: "Could not load item" });
    }
  });

  router.post("/", async (req: Request, res: Response): Promise<void> => {
    try {
      const { name, description, price, unit, stock, imageUrl } = req.body;
      if (!name || price === undefined) {
        res.status(400).json({ error: "Item name and price are required" });
        return;
      }

      const product = await db.products.create({
        userId: req.user!.id,
        name: name.trim(),
        description: description ? description.trim() : "",
        price: Number(price) || 0,
        unit: unit ? unit.trim() : "pcs",
        stock: stock !== undefined ? Number(stock) : 0,
        imageUrl: imageUrl ? imageUrl.trim() : undefined,
      });

      io.to(`user:${req.user!.id}`).emit("product:created", product);

      res.status(201).json({ product, message: "Item added successfully" });
    } catch {
      res.status(500).json({ error: "Could not save item" });
    }
  });

  router.put("/:id", async (req: Request, res: Response): Promise<void> => {
    try {
      const existing = await db.products.findById(req.params.id);
      if (!existing) {
        res.status(404).json({ error: "Item not found" });
        return;
      }
      if (req.user?.role !== "admin" && existing.userId !== req.user!.id) {
        res.status(403).json({ error: "Access denied" });
        return;
      }

      const { name, description, price, unit, stock, imageUrl } = req.body;
      const updated = await db.products.update(req.params.id, {
        name: name !== undefined ? name.trim() : existing.name,
        description: description !== undefined ? description.trim() : existing.description,
        price: price !== undefined ? Number(price) : existing.price,
        unit: unit !== undefined ? unit.trim() : existing.unit,
        stock: stock !== undefined ? Number(stock) : existing.stock,
        imageUrl: imageUrl !== undefined ? imageUrl.trim() : existing.imageUrl,
      });

      io.to(`user:${existing.userId}`).emit("product:updated", updated);

      res.json({ product: updated, message: "Item updated successfully" });
    } catch {
      res.status(500).json({ error: "Could not update item" });
    }
  });

  router.delete("/:id", async (req: Request, res: Response): Promise<void> => {
    try {
      const existing = await db.products.findById(req.params.id);
      if (!existing) {
        res.status(404).json({ error: "Item not found" });
        return;
      }
      if (req.user?.role !== "admin" && existing.userId !== req.user!.id) {
        res.status(403).json({ error: "Access denied" });
        return;
      }

      await db.products.delete(req.params.id);
      io.to(`user:${existing.userId}`).emit("product:deleted", { id: req.params.id });

      res.json({ message: "Item removed successfully" });
    } catch {
      res.status(500).json({ error: "Could not delete item" });
    }
  });

  return router;
}