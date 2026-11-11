import { Router, Request, Response } from "express";
import { IDatabase } from "@giniespace/sheets-db";
import { requireAdmin } from "../middleware/auth";

export function createSettingsRouter(db: IDatabase): Router {
  const router = Router();

  router.get("/", async (req: Request, res: Response): Promise<void> => {
    try {
      const business = await db.businesses.findOne({ userId: req.user!.id });
      res.json({ business });
    } catch {
      res.status(500).json({ error: "Could not load settings" });
    }
  });

  router.put("/business", async (req: Request, res: Response): Promise<void> => {
    try {
      const { name, phone, address, settingsJson } = req.body;
      let business = await db.businesses.findOne({ userId: req.user!.id });

      if (business) {
        business = await db.businesses.update(business.id, {
          name: name !== undefined ? name.trim() : business.name,
          phone: phone !== undefined ? phone.trim() : business.phone,
          address: address !== undefined ? address.trim() : business.address,
          settingsJson: settingsJson !== undefined ? (typeof settingsJson === "string" ? settingsJson : JSON.stringify(settingsJson)) : business.settingsJson,
        });
      } else {
        business = await db.businesses.create({
          userId: req.user!.id,
          name: name ? name.trim() : "My Business",
          phone: phone ? phone.trim() : "",
          address: address ? address.trim() : "",
          settingsJson: settingsJson ? (typeof settingsJson === "string" ? settingsJson : JSON.stringify(settingsJson)) : "{}",
        });
      }

      res.json({ business, message: "Settings saved successfully" });
    } catch {
      res.status(500).json({ error: "Could not save settings" });
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
        createdAt: u.createdAt,
      }));
      res.json({ users: sanitized });
    } catch {
      res.status(500).json({ error: "Could not load users" });
    }
  });

  return router;
}