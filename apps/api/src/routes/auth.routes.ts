import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { IDatabase, BusinessType, UserRole } from "@giniespace/sheets-db";
import { AuthenticatedUser } from "../middleware/auth";

export function createAuthRouter(db: IDatabase, jwtSecret: string): Router {
  const router = Router();

  router.post("/signup", async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password, name, businessType } = req.body;

      if (!email || !password || !name || !businessType) {
        res.status(400).json({ error: "Please fill in all required fields (Name, Email, Password, Business Type)" });
        return;
      }

      if (businessType !== "retail" && businessType !== "wholesale") {
        res.status(400).json({ error: "Please select either Retail or Wholesale as your business type" });
        return;
      }

      const existing = await db.users.findOne({ email: email.toLowerCase().trim() });
      if (existing) {
        res.status(400).json({ error: "An account with this email address already exists" });
        return;
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const allUsers = await db.users.findMany();
      const role: UserRole = allUsers.length === 0 ? "admin" : "user";

      const newUser = await db.users.create({
        email: email.toLowerCase().trim(),
        passwordHash,
        name: name.trim(),
        role,
        businessType: businessType as BusinessType,
      });

      await db.businesses.create({
        userId: newUser.id,
        name: `${name.trim()}'s Business`,
        phone: "",
        address: "",
        settingsJson: JSON.stringify({ autoReply: true, welcomeMessage: "Hello! Welcome to our store." }),
      });

      const payload: AuthenticatedUser = {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        businessType: newUser.businessType,
      };

      const token = jwt.sign(payload, jwtSecret, { expiresIn: "30d" });

      res.status(201).json({
        message: "Account created successfully",
        token,
        user: payload,
      });
    } catch (err: any) {
      res.status(500).json({ error: "Could not create your account right now. Please try again shortly." });
    }
  });

  router.post("/login", async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({ error: "Please enter both email and password" });
        return;
      }

      const user = await db.users.findOne({ email: email.toLowerCase().trim() });
      if (!user) {
        res.status(401).json({ error: "Incorrect email or password. Please try again." });
        return;
      }

      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) {
        res.status(401).json({ error: "Incorrect email or password. Please try again." });
        return;
      }

      const payload: AuthenticatedUser = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        businessType: user.businessType,
      };

      const token = jwt.sign(payload, jwtSecret, { expiresIn: "30d" });

      res.json({
        message: "Welcome back!",
        token,
        user: payload,
      });
    } catch (err: any) {
      res.status(500).json({ error: "Could not sign you in right now. Please try again shortly." });
    }
  });

  router.get("/me", async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: "Please log in" });
      return;
    }

    try {
      const user = await db.users.findById(req.user.id);
      if (!user) {
        res.status(404).json({ error: "User profile not found" });
        return;
      }

      const business = await db.businesses.findOne({ userId: req.user.id });

      res.json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          businessType: user.businessType,
          createdAt: user.createdAt,
        },
        business: business || null,
      });
    } catch {
      res.status(500).json({ error: "Could not load user profile" });
    }
  });

  return router;
}