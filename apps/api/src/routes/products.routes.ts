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

  const VALID_SERVICE_MODES = ["at_store", "home_visit", "online", "any"] as const;

  const TRENDING_SERVICE_PACKS: Record<
    string,
    Array<{
      name: string;
      description: string;
      price: number;
      unit: string;
      duration: string;
      serviceMode: "at_store" | "home_visit" | "online" | "any";
      category: string;
    }>
  > = {
    ac_repair: [
      {
        name: "Split AC Foam-Jet Deep Service",
        description: "Indoor/outdoor coil jet wash, filter cleaning & drain line check",
        price: 599,
        unit: "visit",
        duration: "60 mins",
        serviceMode: "home_visit",
        category: "AC & Appliance Repair",
      },
      {
        name: "AC Gas Refill & Leak Testing",
        description: "R32/R410 refrigerant top-up with nitrogen pressure check",
        price: 2499,
        unit: "visit",
        duration: "90 mins",
        serviceMode: "home_visit",
        category: "AC & Appliance Repair",
      },
      {
        name: "RO Water Purifier Complete Service",
        description: "Sediment + Carbon + Membrane inspection & TDS calibration",
        price: 499,
        unit: "visit",
        duration: "45 mins",
        serviceMode: "home_visit",
        category: "AC & Appliance Repair",
      },
      {
        name: "Annual Appliance AMC Plan (1 Year)",
        description: "3 scheduled visits + priority breakdown support for 12 months",
        price: 3999,
        unit: "year",
        duration: "12 Months",
        serviceMode: "home_visit",
        category: "AMC & Maintenance",
      },
    ],
    salon: [
      {
        name: "Haircut + Styling & Beard Grooming",
        description: "Consultation, precision cut, wash & blow-dry styling",
        price: 499,
        unit: "session",
        duration: "45 mins",
        serviceMode: "at_store",
        category: "Salon & Grooming",
      },
      {
        name: "Bridal / Party HD Makeup Package",
        description: "Complete HD makeup, hair styling & draping at venue or studio",
        price: 5999,
        unit: "session",
        duration: "150 mins",
        serviceMode: "any",
        category: "Makeup & Bridal",
      },
      {
        name: "Hydra Glow Facial & Cleanup",
        description: "Deep pore cleansing, exfoliation & soothing serum mask",
        price: 1299,
        unit: "session",
        duration: "60 mins",
        serviceMode: "at_store",
        category: "Skin Care",
      },
    ],
    clinic: [
      {
        name: "Doctor Consultation (Clinic / Video)",
        description: "Detailed health evaluation & digital prescription on WhatsApp",
        price: 500,
        unit: "session",
        duration: "20 mins",
        serviceMode: "any",
        category: "Medical Consultation",
      },
      {
        name: "Dental Scaling, Polishing & Checkup",
        description: "Ultrasonic plaque removal & oral health assessment",
        price: 999,
        unit: "session",
        duration: "40 mins",
        serviceMode: "at_store",
        category: "Dental Care",
      },
      {
        name: "Full Body Health Checkup + Home Sample",
        description: "65+ lab parameters with doorstep morning sample pickup",
        price: 1499,
        unit: "visit",
        duration: "30 mins",
        serviceMode: "home_visit",
        category: "Diagnostics",
      },
    ],
    auto: [
      {
        name: "Periodic Car Service (Synthetic Oil)",
        description: "Engine oil, oil/air filter change & 40-point safety check",
        price: 3499,
        unit: "visit",
        duration: "180 mins",
        serviceMode: "at_store",
        category: "Car & Bike Care",
      },
      {
        name: "Foam Car Wash + Interior Vacuuming",
        description: "Snow foam exterior wash, dashboard polish & tyre dressing",
        price: 499,
        unit: "visit",
        duration: "45 mins",
        serviceMode: "any",
        category: "Car & Bike Care",
      },
      {
        name: "Two-Wheeler Full Tune-Up & Chain Lube",
        description: "Engine oil check, brake adjustment & complete wash",
        price: 699,
        unit: "visit",
        duration: "60 mins",
        serviceMode: "at_store",
        category: "Car & Bike Care",
      },
    ],
    agency: [
      {
        name: "Business Website + WhatsApp Setup",
        description: "Responsive landing page, domain SSL & WhatsApp lead button",
        price: 7999,
        unit: "project",
        duration: "5 Days",
        serviceMode: "online",
        category: "Digital & Web",
      },
      {
        name: "Social Media + Meta Ads Management",
        description: "12 posts/reels + Meta ad campaign management per month",
        price: 9999,
        unit: "month",
        duration: "Monthly",
        serviceMode: "online",
        category: "Digital Marketing",
      },
      {
        name: "Monthly GST Return & Accounting",
        description: "GSTR-1, GSTR-3B filing & monthly reconciliation report",
        price: 1499,
        unit: "month",
        duration: "Monthly",
        serviceMode: "online",
        category: "Tax & Compliance",
      },
    ],
    coaching: [
      {
        name: "1-on-1 Coaching / Tutoring Session",
        description: "Personalized live doubt-solving and practice roadmap",
        price: 699,
        unit: "hour",
        duration: "60 mins",
        serviceMode: "online",
        category: "Coaching & Classes",
      },
      {
        name: "Monthly Fitness / Tuition Batch",
        description: "12 guided sessions per month with progress tracking",
        price: 2499,
        unit: "month",
        duration: "Monthly",
        serviceMode: "any",
        category: "Coaching & Classes",
      },
    ],
  };

  router.post("/service-templates", async (req: Request, res: Response): Promise<void> => {
    try {
      const packKey = String(req.body?.pack || "").trim();
      const templates = TRENDING_SERVICE_PACKS[packKey];
      if (!templates) {
        res.status(400).json({ error: "Invalid service template pack selected" });
        return;
      }

      const [plan, existingProducts] = await Promise.all([
        getEffectivePlan(db, req.user),
        db.products.findMany({ userId: req.user!.id }),
      ]);
      const existingNames = new Set(existingProducts.map((p) => p.name.trim().toLowerCase()));
      const toCreate = templates.filter((t) => !existingNames.has(t.name.trim().toLowerCase()));

      if (toCreate.length === 0) {
        res.json({ createdCount: 0, products: [], message: "All services in this pack already exist in your catalog" });
        return;
      }

      if (plan === "free" && existingProducts.length + toCreate.length > FREE_PLAN_LIMITS.maxProducts) {
        res.status(403).json({
          error: `Free plan allows up to ${FREE_PLAN_LIMITS.maxProducts} items. Upgrade to Pro to import the full pack.`,
        });
        return;
      }

      const created = [];
      for (const tpl of toCreate) {
        const prod = await db.products.create({
          userId: req.user!.id,
          name: tpl.name,
          description: tpl.description,
          price: tpl.price,
          unit: tpl.unit,
          stock: 999999,
          category: tpl.category,
          minOrderQty: 1,
          itemType: "service",
          duration: tpl.duration,
          serviceMode: tpl.serviceMode,
        });
        created.push(prod);
        io.to(`user:${req.user!.id}`).emit("product:created", prod);
      }

      res.status(201).json({
        createdCount: created.length,
        products: created,
        message: `Imported ${created.length} trending service${created.length === 1 ? "" : "s"}`,
      });
    } catch {
      res.status(500).json({ error: "Could not import service template pack" });
    }
  });

  router.post("/", async (req: Request, res: Response): Promise<void> => {
    try {
      const { name, description, price, unit, stock, imageUrl, category, minOrderQty, costPrice, itemType, duration, serviceMode } = req.body;
      const imageErr = validateProductImageUrl(imageUrl);
      if (imageErr) {
        res.status(400).json({ error: imageErr });
        return;
      }
      if (!name || price === undefined) {
        res.status(400).json({ error: "Item name and price are required" });
        return;
      }

      const resolvedItemType = itemType === "service" ? "service" : "product";
      const resolvedServiceMode = VALID_SERVICE_MODES.includes(serviceMode) ? serviceMode : undefined;

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
        unit: unit ? unit.trim() : resolvedItemType === "service" ? "session" : "pcs",
        stock: resolvedItemType === "service" ? (stock !== undefined && Number(stock) > 0 ? Number(stock) : 999999) : stock !== undefined ? Number(stock) : 0,
        imageUrl: imageUrl ? imageUrl.trim() : undefined,
        category: category ? String(category).trim() : resolvedItemType === "service" ? "Services" : "General",
        minOrderQty: minOrderQty !== undefined ? Math.max(1, Number(minOrderQty) || 1) : 1,
        costPrice: costPrice !== undefined && costPrice !== "" ? Math.max(0, Number(costPrice) || 0) : undefined,
        itemType: resolvedItemType,
        duration: duration ? String(duration).trim() : undefined,
        serviceMode: resolvedServiceMode,
      });

      io.to(`user:${req.user!.id}`).emit("product:created", product);

      res.status(201).json({ product, message: resolvedItemType === "service" ? "Service added successfully" : "Item added successfully" });
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

      const { name, description, price, unit, stock, imageUrl, category, minOrderQty, costPrice, itemType, duration, serviceMode } = req.body;
      const imageErr = validateProductImageUrl(imageUrl);
      if (imageErr) {
        res.status(400).json({ error: imageErr });
        return;
      }
      const nextItemType = itemType === "service" ? "service" : itemType === "product" ? "product" : existing.itemType;
      const nextServiceMode = serviceMode !== undefined ? (VALID_SERVICE_MODES.includes(serviceMode) ? serviceMode : undefined) : existing.serviceMode;

      const updated = await db.products.update((req.params.id as string), {
        name: name !== undefined ? name.trim() : existing.name,
        description: description !== undefined ? description.trim() : existing.description,
        price: price !== undefined ? Number(price) : existing.price,
        unit: unit !== undefined ? unit.trim() : existing.unit,
        stock: nextItemType === "service" ? (stock !== undefined && Number(stock) > 0 ? Number(stock) : 999999) : stock !== undefined ? Number(stock) : existing.stock,
        imageUrl: imageUrl !== undefined ? imageUrl.trim() : existing.imageUrl,
        category: category !== undefined ? String(category).trim() : existing.category,
        minOrderQty: minOrderQty !== undefined ? Math.max(1, Number(minOrderQty) || 1) : existing.minOrderQty,
        costPrice: costPrice !== undefined ? (costPrice === "" || costPrice === null ? undefined : Math.max(0, Number(costPrice) || 0)) : existing.costPrice,
        itemType: nextItemType,
        duration: duration !== undefined ? String(duration).trim() : existing.duration,
        serviceMode: nextServiceMode,
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