import { Router, Request, Response } from "express";
import fs from "fs";
import path from "path";
import { IDatabase } from "@giniespace/sheets-db";

export function createMarketingRouter(db: IDatabase): Router {
  const router = Router();
  const uploadsDir = path.join(process.cwd(), "uploads");

  // Public / Merchant endpoint to get all custom marketing templates published by Admin
  router.get("/creatives", async (_req: Request, res: Response): Promise<void> => {
    try {
      const setting = await db.settings.findOne({ userId: "admin", key: "marketing_creatives" }).catch(() => null);
      let creatives: any[] = [];
      if (setting?.value) {
        try {
          creatives = JSON.parse(setting.value);
        } catch {}
      }
      res.json({ creatives: Array.isArray(creatives) ? creatives : [] });
    } catch (err: any) {
      console.warn("[MarketingRoutes] Failed to fetch creatives:", err.message);
      res.json({ creatives: [] });
    }
  });

  // Public endpoint to serve uploaded creative images (with persistent DB fallback and local disk cache)
  router.get("/creative-image/:id", async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const cleanId = id.replace(/[^a-zA-Z0-9_-]/g, "");
      const cachedFilePath = path.join(uploadsDir, `mkt_${cleanId}.jpg`);

      // 1. Fast path: check local disk cache
      if (fs.existsSync(cachedFilePath)) {
        res.setHeader("Content-Type", "image/jpeg");
        res.setHeader("Cache-Control", "public, max-age=86400, stale-while-revalidate=604800");
        fs.createReadStream(cachedFilePath).pipe(res);
        return;
      }

      // 2. Persistent fallback: fetch from Google Sheets DB
      const setting = await db.settings.findOne({ userId: "admin", key: `mkt_img_${cleanId}` }).catch(() => null);
      if (!setting || !setting.value) {
        res.status(404).send("Image not found");
        return;
      }

      let base64Data = setting.value;
      let contentType = "image/jpeg";
      if (base64Data.startsWith("data:")) {
        const match = base64Data.match(/^data:([^;]+);base64,/);
        if (match) {
          contentType = match[1];
          base64Data = base64Data.slice(match[0].length);
        }
      }

      const buffer = Buffer.from(base64Data, "base64");

      // Save to disk cache for subsequent requests
      try {
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }
        fs.writeFileSync(cachedFilePath, buffer);
      } catch (cacheErr: any) {
        console.warn("[MarketingRoutes] Cache write warning:", cacheErr.message);
      }

      res.setHeader("Content-Type", contentType);
      res.setHeader("Cache-Control", "public, max-age=86400, stale-while-revalidate=604800");
      res.send(buffer);
    } catch (err: any) {
      console.error("[MarketingRoutes] Error serving creative image:", err.message);
      res.status(500).send("Failed to serve image");
    }
  });

  return router;
}
