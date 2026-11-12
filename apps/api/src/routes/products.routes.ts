import { Router, Request, Response } from "express";
import { IDatabase } from "@giniespace/sheets-db";
import { Server } from "socket.io";
import { requireOwnerOrAdmin } from "../middleware/auth";
import { FREE_PLAN_LIMITS, getEffectivePlan } from "../utils/plan";

const MAX_IMAGE_BYTES = 60 * 1024; // 60 KB strict max
const MAX_SHEETS_CELL_CHARS = 49500; // Google Sheets single-cell safety cap

function validateProductImageUrl(imageUrl: unknown): string | null {
  if (imageUrl === undefined || imageUrl === null || imageUrl === "") return null;
  if (typeof imageUrl !== "string") return "Invalid image format";
  const trimmed = imageUrl.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith("data:")) {
    if (!trimmed.startsWith("data:image/jpeg;base64,")) {
      return "Only JPG / JPEG format images are allowed";
    }
    const base64Part = trimmed.slice("data:image/jpeg;base64,".length);
    const decodedBytes = Buffer.from(base64Part, "base64").length;
    if (decodedBytes > MAX_IMAGE_BYTES) {
      return "Image size exceeds 60 KB limit";
    }
    if (trimmed.length > MAX_SHEETS_CELL_CHARS) {
      return "Image payload exceeds storage capacity (~35 KB optimized JPEG max)";
    }
    return null;
  }

  if (!trimmed.startsWith("https://") && !trimmed.startsWith("http://")) {
    return "Image URL must be a valid JPG upload or http(s) URL";
  }
  return null;
}

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
      const product = await db.products.findById((req.params.id as string));
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
      const { name, description, price, unit, stock, imageUrl, category, minOrderQty, costPrice } = req.body;
      const imageErr = validateProductImageUrl(imageUrl);
      if (imageErr) {
        res.status(400).json({ error: imageErr });
        return;
      }
      if (!name || price === undefined) {
        res.status(400).json({ error: "Item name and price are required" });
        return;
      }

      const [plan, existingProducts] = await Promise.all([
        getEffectivePlan(db, req.user),
        db.products.findMany({ userId: req.user!.id }),
      ]);
      if (plan === "free" && existingProducts.length >= FREE_PLAN_LIMITS.maxProducts) {
        res.status(403).json({
          error: `Free plan allows up to ${FREE_PLAN_LIMITS.maxProducts} products. Upgrade to Pro for unlimited catalog items!`,
        });
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
        category: category ? String(category).trim() : "General",
        minOrderQty: minOrderQty !== undefined ? Math.max(1, Number(minOrderQty) || 1) : 1,
        costPrice: costPrice !== undefined && costPrice !== "" ? Math.max(0, Number(costPrice) || 0) : undefined,
      });

      io.to(`user:${req.user!.id}`).emit("product:created", product);

      res.status(201).json({ product, message: "Item added successfully" });
    } catch {
      res.status(500).json({ error: "Could not save item" });
    }
  });

  router.put("/:id", async (req: Request, res: Response): Promise<void> => {
    try {
      const existing = await db.products.findById((req.params.id as string));
      if (!existing) {
        res.status(404).json({ error: "Item not found" });
        return;
      }
      if (req.user?.role !== "admin" && existing.userId !== req.user!.id) {
        res.status(403).json({ error: "Access denied" });
        return;
      }

      const { name, description, price, unit, stock, imageUrl, category, minOrderQty, costPrice } = req.body;
      const imageErr = validateProductImageUrl(imageUrl);
      if (imageErr) {
        res.status(400).json({ error: imageErr });
        return;
      }
      const updated = await db.products.update((req.params.id as string), {
        name: name !== undefined ? name.trim() : existing.name,
        description: description !== undefined ? description.trim() : existing.description,
        price: price !== undefined ? Number(price) : existing.price,
        unit: unit !== undefined ? unit.trim() : existing.unit,
        stock: stock !== undefined ? Number(stock) : existing.stock,
        imageUrl: imageUrl !== undefined ? imageUrl.trim() : existing.imageUrl,
        category: category !== undefined ? String(category).trim() : existing.category,
        minOrderQty: minOrderQty !== undefined ? Math.max(1, Number(minOrderQty) || 1) : existing.minOrderQty,
        costPrice: costPrice !== undefined ? (costPrice === "" || costPrice === null ? undefined : Math.max(0, Number(costPrice) || 0)) : existing.costPrice,
      });

      io.to(`user:${existing.userId}`).emit("product:updated", updated);

      res.json({ product: updated, message: "Item updated successfully" });
    } catch {
      res.status(500).json({ error: "Could not update item" });
    }
  });

  router.delete("/:id", requireOwnerOrAdmin, async (req: Request, res: Response): Promise<void> => {
    try {
      const existing = await db.products.findById((req.params.id as string));
      if (!existing) {
        res.status(404).json({ error: "Item not found" });
        return;
      }
      if (req.user?.role !== "admin" && existing.userId !== req.user!.id) {
        res.status(403).json({ error: "Access denied" });
        return;
      }

      await db.products.delete((req.params.id as string));
      io.to(`user:${existing.userId}`).emit("product:deleted", { id: (req.params.id as string) });

      res.json({ message: "Item removed successfully" });
    } catch {
      res.status(500).json({ error: "Could not delete item" });
    }
  });

  return router;
}