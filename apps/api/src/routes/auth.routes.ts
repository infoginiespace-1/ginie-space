import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { randomInt } from "crypto";
import { IDatabase, BusinessType, UserRole } from "@giniespace/sheets-db";
import { AuthenticatedUser } from "../middleware/auth";
import { NotificationService } from "../services/notification.service";
import { normalizePhoneDigits, toE164 } from "../utils/phone";

const MASTER_ADMIN_EMAIL = "info.giniespace@gmail.com";
const MASTER_ADMIN_PASS = "Dawood@3210";

export function createAuthRouter(
  db: IDatabase,
  jwtSecret: string,
  notificationService?: NotificationService
): Router {
  const router = Router();

  router.post("/signup", async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password, name, businessType, phone } = req.body;

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
        phone: phone ? toE164(phone) : "",
        address: "",
        settingsJson: JSON.stringify({ autoReply: true, welcomeMessage: "Hello! Welcome to our store." }),
      }).catch(() => null);

      if (notificationService && phone) {
        notificationService.notifyNewUserOnboarding(newUser.name, phone).catch(() => {});
      }

      const payload: AuthenticatedUser = {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        businessType: newUser.businessType,
        plan: newUser.role === "admin" ? "pro" : "free",
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
          plan: "pro",
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

      if (user.status === "suspended") {
        res.status(403).json({ error: "Your account has been suspended by Admin. Please contact Support (+91 9279259690)." });
        return;
      }

      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) {
        res.status(401).json({ error: "Incorrect email or password. Please try again." });
        return;
      }

      let workspaceId = user.id;
      let plan: "free" | "pro" = user.plan === "pro" ? "pro" : "free";
      let staffPermissions: string[] | undefined;

      if (user.role === "staff" && user.ownerId) {
        workspaceId = user.ownerId;
        const owner = await db.users.findById(user.ownerId).catch(() => null);
        if (owner?.status === "suspended") {
          res.status(403).json({ error: "The business owner's account is currently suspended." });
          return;
        }
        plan = owner?.plan === "pro" ? "pro" : "free";
        staffPermissions = (user.staffPermissions || "orders,inbox,customers")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      } else if (user.role === "admin") {
        plan = "pro";
      }

      const payload: AuthenticatedUser = {
        id: workspaceId,
        actorId: user.role === "staff" ? user.id : undefined,
        email: user.email,
        name: user.name,
        role: user.role,
        businessType: user.businessType,
        plan,
        staffPermissions,
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
    let userPayload = req.user;
    if (!userPayload) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        try {
          userPayload = jwt.verify(authHeader.substring(7), jwtSecret) as AuthenticatedUser;
        } catch {}
      }
    }

    if (!userPayload) {
      res.status(401).json({ error: "Please log in" });
      return;
    }

    try {
      let user: any = null;
      let business: any = null;
      try {
        user = await db.users.findById(userPayload.id);
        business = await db.businesses.findOne({ userId: userPayload.id });
      } catch (dbErr: any) {
        console.warn("[Auth /me] DB fetch error, using token payload fallback:", dbErr.message);
      }

      res.json({
        user: {
          id: userPayload.id,
          actorId: userPayload.actorId,
          name: userPayload.role === "staff" ? userPayload.name : (user?.name || userPayload.name),
          email: userPayload.role === "staff" ? userPayload.email : (user?.email || userPayload.email),
          role: userPayload.role || "admin",
          businessType: user?.businessType || userPayload.businessType || "retail",
          plan: (user?.role === "admin" || userPayload.role === "admin" || user?.plan === "pro") ? "pro" : "free",
          staffPermissions: userPayload.staffPermissions,
          createdAt: user?.createdAt || new Date().toISOString(),
        },
        business: business || {
          id: "biz-default",
          userId: userPayload.id,
          name: `${userPayload.name}'s Business`,
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

  router.post("/forgot-password", async (req: Request, res: Response): Promise<void> => {
    try {
      const { email } = req.body;
      if (!email) {
        res.status(400).json({ error: "Please enter your registered email address" });
        return;
      }

      const cleanEmail = String(email).toLowerCase().trim();
      const user = await db.users.findOne({ email: cleanEmail }).catch(() => null);
      if (!user) {
        res.status(404).json({ error: "No account found with that email address" });
        return;
      }

      const business = await db.businesses.findOne({ userId: user.id }).catch(() => null);
      const targetDigits = normalizePhoneDigits(business?.phone || "");
      if (!targetDigits || targetDigits.length < 10) {
        res.status(400).json({
          error: "No Store WhatsApp Phone saved for this account. Contact Official Support (+91 9279259690).",
        });
        return;
      }

      if (!notificationService) {
        res.status(503).json({ error: "Support WhatsApp service is unavailable" });
        return;
      }

      const otp = String(randomInt(100000, 999999));
      const otpHash = await bcrypt.hash(otp, 8);
      const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
      const payload = JSON.stringify({ otpHash, expiresAt });

      const existingSetting = await db.settings
        .findOne({ userId: user.id, key: "password_reset_otp" })
        .catch(() => null);
      if (existingSetting) {
        await db.settings.update(existingSetting.id, { value: payload });
      } else {
        await db.settings.create({
          userId: user.id,
          key: "password_reset_otp",
          value: payload,
        });
      }

      const msg =
        `🔐 *GinieSpace Password Reset OTP*\n\n` +
        `Hello *${user.name}*,\n` +
        `Your 6-digit password reset OTP is: *${otp}*\n` +
        `Valid for 10 minutes. Do not share this code with anyone.\n\n` +
        `- GinieSpace Official Support (+91 9279259690)`;

      const sent = await notificationService.sendSupportNotification(targetDigits, msg);
      if (!sent) {
        res.status(503).json({
          error: "Support WhatsApp (+91 9279259690) is currently offline. Please try again later.",
        });
        return;
      }

      const masked = `***${targetDigits.slice(-4)}`;
      res.json({ message: `OTP sent to your registered WhatsApp ending in ${masked}` });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Could not send password reset OTP" });
    }
  });

  router.post("/reset-password", async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, otp, newPassword } = req.body;
      if (!email || !otp || !newPassword || String(newPassword).length < 6) {
        res.status(400).json({ error: "Email, 6-digit OTP, and new password (min 6 chars) are required" });
        return;
      }

      const cleanEmail = String(email).toLowerCase().trim();
      const user = await db.users.findOne({ email: cleanEmail }).catch(() => null);
      if (!user) {
        res.status(404).json({ error: "Account not found" });
        return;
      }

      const setting = await db.settings
        .findOne({ userId: user.id, key: "password_reset_otp" })
        .catch(() => null);
      if (!setting?.value) {
        res.status(400).json({ error: "No active OTP request found. Please request a new OTP." });
        return;
      }

      let parsed: { otpHash: string; expiresAt: number } | null = null;
      try {
        parsed = JSON.parse(setting.value);
      } catch {}

      if (!parsed || Date.now() > parsed.expiresAt) {
        res.status(400).json({ error: "OTP has expired. Please request a new OTP." });
        return;
      }

      const match = await bcrypt.compare(String(otp).trim(), parsed.otpHash);
      if (!match) {
        res.status(400).json({ error: "Invalid OTP. Please double check your WhatsApp message." });
        return;
      }

      const passwordHash = await bcrypt.hash(String(newPassword), 10);
      await db.users.update(user.id, { passwordHash });
      await db.settings.update(setting.id, { value: JSON.stringify({ otpHash: "", expiresAt: 0 }) }).catch(() => {});

      res.json({ message: "Password updated successfully! You can now sign in." });
    } catch {
      res.status(500).json({ error: "Could not reset password" });
    }
  });

  router.post("/change-password", async (req: Request, res: Response): Promise<void> => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    let userPayload: AuthenticatedUser | null = null;
    try {
      userPayload = jwt.verify(authHeader.substring(7), jwtSecret) as AuthenticatedUser;
    } catch {
      res.status(401).json({ error: "Invalid or expired session" });
      return;
    }

    try {
      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword || String(newPassword).length < 6) {
        res.status(400).json({ error: "Current password and new password (min 6 chars) are required" });
        return;
      }

      const user = await db.users.findById(userPayload.id);
      if (!user) {
        res.status(404).json({ error: "User record not found" });
        return;
      }

      const valid = await bcrypt.compare(String(currentPassword), user.passwordHash);
      if (!valid) {
        res.status(400).json({ error: "Current password is incorrect" });
        return;
      }

      const passwordHash = await bcrypt.hash(String(newPassword), 10);
      await db.users.update(user.id, { passwordHash });

      res.json({ message: "Password changed successfully!" });
    } catch {
      res.status(500).json({ error: "Could not change password" });
    }
  });

  return router;
}
