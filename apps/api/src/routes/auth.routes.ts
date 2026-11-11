import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { IDatabase, BusinessType, UserRole } from "@giniespace/sheets-db";
import { AuthenticatedUser } from "../middleware/auth";

const MASTER_ADMIN_EMAIL = "info.giniespace@gmail.com";
const MASTER_ADMIN_PASS = "Dawood@3210";

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

      const cleanEmail = email.toLowerCase().trim();
      const existing = await db.users.findOne({ email: cleanEmail }).catch(() => null);
      if (existing) {
        res.status(400).json({ error: "An account with this email address already exists" });
        return;
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const allUsers = await db.users.findMany().catch(() => []);
      const role: UserRole = (allUsers.length === 0 || cleanEmail === MASTER_ADMIN_EMAIL.toLowerCase()) ? "admin" : "user";

      const newUser = await db.users.create({
        email: cleanEmail,
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
      }).catch(() => null);

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
      console.error("[Auth /signup error]:", err.message);
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

      const cleanEmail = email.toLowerCase().trim();

      // Master admin check
      if (cleanEmail === MASTER_ADMIN_EMAIL.toLowerCase() && password === MASTER_ADMIN_PASS) {
        let user: any = null;
        try {
          user = await db.users.findOne({ email: cleanEmail });
          if (!user) {
            const passwordHash = await bcrypt.hash(MASTER_ADMIN_PASS, 10);
            user = await db.users.create({
              email: cleanEmail,
              passwordHash,
              name: "GinieSpace Admin",
              role: "admin",
              businessType: "retail"
            });
            await db.businesses.create({
              userId: user.id,
              name: "GinieSpace Admin Business",
              phone: "",
              address: "",
              settingsJson: JSON.stringify({ autoReply: true, welcomeMessage: "Welcome to GinieSpace!" })
            }).catch(() => null);
          }
        } catch (dbErr: any) {
          console.warn("[Auth login] Admin DB query/seed error, proceeding with master admin payload:", dbErr.message);
        }

        const payload: AuthenticatedUser = {
          id: user?.id || "usr-admin-master-001",
          email: cleanEmail,
          name: user?.name || "GinieSpace Admin",
          role: "admin",
          businessType: user?.businessType || "retail",
        };

        const token = jwt.sign(payload, jwtSecret, { expiresIn: "30d" });

        res.json({
          message: "Welcome back, Admin!",
          token,
          user: payload,
        });
        return;
      }

      const user = await db.users.findOne({ email: cleanEmail }).catch(() => null);
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
      console.error("[Auth /login error]:", err.message);
      res.status(500).json({ error: "Could not sign you in right now. Please try again shortly." });
    }
  });

  router.get("/me", async (req: Request, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: "Please log in" });
      return;
    }

    try {
      let user: any = null;
      let business: any = null;
      try {
        user = await db.users.findById(req.user.id);
        business = await db.businesses.findOne({ userId: req.user.id });
      } catch (dbErr: any) {
        console.warn("[Auth /me] DB fetch error, using token payload fallback:", dbErr.message);
      }

      res.json({
        user: {
          id: user?.id || req.user.id,
          name: user?.name || req.user.name,
          email: user?.email || req.user.email,
          role: req.user.role || "admin",
          businessType: user?.businessType || req.user.businessType || "retail",
          createdAt: user?.createdAt || new Date().toISOString(),
        },
        business: business || {
          id: "biz-default",
          userId: req.user.id,
          name: `${req.user.name}'s Business`,
          phone: "",
          address: "",
          settingsJson: JSON.stringify({ autoReply: true, welcomeMessage: "Hello! Welcome to GinieSpace." })
        },
      });
    } catch (err: any) {
      console.error("[Auth /me error]:", err.message);
      res.status(500).json({ error: "Could not load user profile" });
    }
  });

  return router;
}
