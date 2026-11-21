import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { randomInt } from "crypto";
import { IDatabase, BusinessType, UserRole } from "@giniespace/sheets-db";
import { AuthenticatedUser } from "../middleware/auth";
import { NotificationService } from "../services/notification.service";
import { normalizePhoneDigits, toE164 } from "../utils/phone";
import { getEffectivePlan } from "../utils/plan";
import { otpRateLimiter, loginRateLimiter } from "../middleware/rate-limit";

const MASTER_ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "info.giniespace@gmail.com").toLowerCase().trim();
const ADMIN_EMERGENCY_PASSWORD = process.env.ADMIN_EMERGENCY_PASSWORD || process.env.ADMIN_PASSWORD;

interface OtpRecord {
  phone: string;
  otpHash: string;
  expiresAt: number;
  attempts: number;
  purpose: "login" | "signup" | "any";
  lastSent: number;
}
const otpCache = new Map<string, OtpRecord>();

export function createAuthRouter(
  db: IDatabase,
  jwtSecret: string,
  notificationService?: NotificationService
): Router {
  const router = Router();

  // 1. WhatsApp OTP Request (Unified for Login & Signup)
  router.post("/send-otp", otpRateLimiter, async (req: Request, res: Response): Promise<void> => {
    try {
      const { phone, purpose } = req.body;
      if (!phone) {
        res.status(400).json({ error: "Please enter your WhatsApp mobile number" });
        return;
      }

      const digits = normalizePhoneDigits(phone);
      if (!digits || digits.length < 10) {
        res.status(400).json({ error: "Please enter a valid 10-digit WhatsApp mobile number" });
        return;
      }

      // Rate-limiting: Ensure 45 seconds between OTP requests per number
      const existingEntry = otpCache.get(digits);
      const now = Date.now();
      if (existingEntry && (now - existingEntry.lastSent) < 45 * 1000) {
        const waitSec = Math.ceil((45 * 1000 - (now - existingEntry.lastSent)) / 1000);
        res.status(429).json({ error: `Please wait ${waitSec} seconds before requesting a new OTP.` });
        return;
      }

      // Check if user already exists with this phone number
      const allBusinesses = await db.businesses.findMany().catch(() => []);
      const matchingBiz = allBusinesses.find(
        (b) => normalizePhoneDigits(b.phone || "") === digits
      );
      const isExistingUser = Boolean(matchingBiz);
      const isMasterAdmin = (digits === "919279259690" || digits === "9279259690");

      if (purpose === "login" && !isExistingUser && !isMasterAdmin) {
        res.status(404).json({
          error: "Is number par koi account registered nahi hai. Kripya pehle Sign Up karein.",
          notRegistered: true,
        });
        return;
      }

      if (purpose === "signup" && isExistingUser) {
        res.status(400).json({
          error: "Is WhatsApp number par pehle se account bana hua hai. Kripya Sign In karein.",
          alreadyRegistered: true,
        });
        return;
      }

      // Generate 6-digit OTP
      const otp = String(randomInt(100000, 999999));
      const otpHash = await bcrypt.hash(otp, 8);
      const expiresAt = now + 10 * 60 * 1000; // 10 minutes

      // Save in memory cache
      otpCache.set(digits, {
        phone: digits,
        otpHash,
        expiresAt,
        attempts: 0,
        purpose: purpose || "any",
        lastSent: now,
      });

      // Also persist in db.settings as backup against process restart
      await db.settings.create({
        userId: `otp_${digits}`,
        key: "active_auth_otp",
        value: JSON.stringify({ otpHash, expiresAt, digits }),
      }).catch(async () => {
        const existing = await db.settings.findOne({ userId: `otp_${digits}`, key: "active_auth_otp" }).catch(() => null);
        if (existing) {
          await db.settings.update(existing.id, { value: JSON.stringify({ otpHash, expiresAt, digits }) }).catch(() => null);
        }
      });

      // Send WhatsApp notification via NotificationService
      if (!notificationService) {
        res.status(503).json({ error: "WhatsApp OTP Service is temporarily unavailable." });
        return;
      }

      const messageText =
        `🔐 *GinieSpace Verification Code*\n\n` +
        `Namaste! Aapka 6-digit WhatsApp Login OTP hai:\n\n` +
        `👉 *${otp}*\n\n` +
        `Yeh code agle 10 minute ke liye valid hai. Kisi ke sath share na karein.\n\n` +
        `- GinieSpace Smart Retail & Wholesale Hub (+91 92792 59690)`;

      const sent = await notificationService.sendSupportNotification(digits, messageText);
      if (!sent) {
        const maskedPhone = digits.length >= 6 ? `${digits.slice(0, 3)}****${digits.slice(-2)}` : "masked";
        console.warn(`[Auth send-otp] WhatsApp bot could not deliver OTP to ${maskedPhone}. Service unavailable.`);
        if (isMasterAdmin) {
          res.json({
            success: true,
            message: "OTP generated for admin!",
            isExistingUser,
          });
          return;
        }
        res.status(503).json({
          error: "Official Support WhatsApp Bot (+91 92792 59690) is currently offline or connecting. Please try again shortly.",
        });
        return;
      }

      const maskedPhone = digits.length >= 10 ? `+91 ${digits.slice(0, 2)}******${digits.slice(-2)}` : digits;
      res.json({
        success: true,
        message: `OTP sent successfully to your WhatsApp (${maskedPhone})`,
        isExistingUser: isExistingUser || isMasterAdmin,
      });
    } catch (err: any) {
      console.error("[Auth send-otp error]:", err.message);
      res.status(500).json({ error: "Failed to send WhatsApp OTP. Please try again." });
    }
  });

  // 2. Verify WhatsApp OTP & Instant Login
  router.post("/verify-otp-login", loginRateLimiter, async (req: Request, res: Response): Promise<void> => {
    try {
      const { phone, otp } = req.body;
      if (!phone || !otp) {
        res.status(400).json({ error: "Mobile number and 6-digit OTP are required" });
        return;
      }

      const digits = normalizePhoneDigits(phone);
      const cleanOtp = String(otp).trim();
      const isMasterAdmin = (digits === "919279259690" || digits === "9279259690");
      let isValid = false;

      // Check cached OTP
      let entry = otpCache.get(digits);
      if (!entry) {
        const backupSetting = await db.settings.findOne({ userId: `otp_${digits}`, key: "active_auth_otp" }).catch(() => null);
        if (backupSetting?.value) {
          try {
            const parsed = JSON.parse(backupSetting.value);
            if (parsed && parsed.expiresAt > Date.now()) {
              entry = {
                phone: digits,
                otpHash: parsed.otpHash,
                expiresAt: parsed.expiresAt,
                attempts: 0,
                purpose: "any",
                lastSent: 0,
              };
            }
          } catch {}
        }
      }

      if (!entry) {
        res.status(400).json({ error: "OTP expired or not found. Please request a new OTP." });
        return;
      }

      if (Date.now() > entry.expiresAt) {
        otpCache.delete(digits);
        res.status(400).json({ error: "OTP has expired. Please request a new OTP." });
        return;
      }

      if (entry.attempts >= 5) {
        otpCache.delete(digits);
        res.status(429).json({ error: "Too many incorrect attempts. Please request a new OTP." });
        return;
      }

      isValid = await bcrypt.compare(cleanOtp, entry.otpHash);
      if (!isValid) {
        entry.attempts++;
        const remaining = 5 - entry.attempts;
        res.status(400).json({ error: `Incorrect OTP. ${remaining} attempts remaining.` });
        return;
      }

      // Valid OTP
      otpCache.delete(digits);

      // Handle Master Admin login
      if (isMasterAdmin) {
        let adminUser: any = await db.users.findOne({ email: MASTER_ADMIN_EMAIL }).catch(() => null);
        if (!adminUser) {
          const initialSecret = ADMIN_EMERGENCY_PASSWORD || ("gs_init_" + randomInt(10000000, 99999999));
          const passwordHash = await bcrypt.hash(initialSecret, 10);
          adminUser = await db.users.create({
            email: MASTER_ADMIN_EMAIL,
            passwordHash,
            name: "GinieSpace Admin",
            role: "admin",
            businessType: "retail",
          });
        }

        const payload: AuthenticatedUser = {
          id: adminUser.id,
          email: adminUser.email,
          name: adminUser.name,
          role: "admin",
          businessType: adminUser.businessType,
          plan: "pro",
          leadsEnabled: true,
        };

        const token = jwt.sign(payload, jwtSecret, { expiresIn: "30d" });
        res.json({
          message: "Welcome back, Admin!",
          token,
          user: payload,
        });
        return;
      }

      // Find user from businesses table
      const allBusinesses = await db.businesses.findMany().catch(() => []);
      const matchingBiz = allBusinesses.find(
        (b) => normalizePhoneDigits(b.phone || "") === digits
      );

      if (!matchingBiz) {
        res.status(404).json({
          error: "Is number par koi account registered nahi hai. Kripya pehle Sign Up karein.",
          notRegistered: true,
        });
        return;
      }

      const user = await db.users.findById(matchingBiz.userId).catch(() => null);
      if (!user) {
        res.status(404).json({ error: "User account not found." });
        return;
      }

      if (user.status === "suspended") {
        res.status(403).json({ error: "Aapka account suspend kar diya gaya hai. Official Support (+91 92792 59690) se sampark karein." });
        return;
      }

      let workspaceId = user.id;
      let plan: "free" | "pro" = user.plan === "pro" ? "pro" : "free";
      let staffPermissions: string[] | undefined;

      if (user.role === "staff" && user.ownerId) {
        workspaceId = user.ownerId;
        const owner = await db.users.findById(user.ownerId).catch(() => null);
        if (owner?.status === "suspended") {
          res.status(403).json({ error: "Business owner ka account suspended hai." });
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
        leadsEnabled: Boolean(user.leadsEnabled === true || user.role === "admin"),
      };

      const token = jwt.sign(payload, jwtSecret, { expiresIn: "30d" });

      res.json({
        message: `Welcome back, ${user.name}!`,
        token,
        user: payload,
      });
    } catch (err: any) {
      console.error("[Auth verify-otp-login error]:", err.message);
      res.status(500).json({ error: "Login failed. Please try again." });
    }
  });

  // 3. Verify WhatsApp OTP & Instant Signup (Create Digital Store)
  router.post("/verify-otp-signup", loginRateLimiter, async (req: Request, res: Response): Promise<void> => {
    try {
      const { phone, otp, name, businessType } = req.body;
      if (!phone || !otp || !name || !businessType) {
        res.status(400).json({ error: "Please enter your Name, WhatsApp Number, Business Category, and 6-digit OTP." });
        return;
      }

      const digits = normalizePhoneDigits(phone);
      if (!digits || digits.length < 10) {
        res.status(400).json({ error: "Please enter a valid 10-digit WhatsApp number" });
        return;
      }

      const validBusinessTypes = ["retail", "wholesale", "services", "restaurant", "garments", "hotel"];
      if (!validBusinessTypes.includes(String(businessType))) {
        res.status(400).json({ error: "Please select a valid business category" });
        return;
      }

      const cleanOtp = String(otp).trim();

      // Verify OTP
      let entry = otpCache.get(digits);
      if (!entry) {
        const backupSetting = await db.settings.findOne({ userId: `otp_${digits}`, key: "active_auth_otp" }).catch(() => null);
        if (backupSetting?.value) {
          try {
            const parsed = JSON.parse(backupSetting.value);
            if (parsed && parsed.expiresAt > Date.now()) {
              entry = {
                phone: digits,
                otpHash: parsed.otpHash,
                expiresAt: parsed.expiresAt,
                attempts: 0,
                purpose: "any",
                lastSent: 0,
              };
            }
          } catch {}
        }
      }

      if (!entry) {
        res.status(400).json({ error: "OTP expired or not found. Please request a new OTP." });
        return;
      }

      if (Date.now() > entry.expiresAt) {
        otpCache.delete(digits);
        res.status(400).json({ error: "OTP has expired. Please request a new OTP." });
        return;
      }

      const isValid = await bcrypt.compare(cleanOtp, entry.otpHash);
      if (!isValid) {
        entry.attempts++;
        res.status(400).json({ error: "Incorrect OTP. Please check your WhatsApp and try again." });
        return;
      }

      // Valid OTP
      otpCache.delete(digits);

      // Check if account already exists
      const allBusinesses = await db.businesses.findMany().catch(() => []);
      const existingBiz = allBusinesses.find(
        (b) => normalizePhoneDigits(b.phone || "") === digits
      );
      if (existingBiz) {
        res.status(400).json({ error: "An account with this WhatsApp mobile number already exists. Please Sign In." });
        return;
      }

      const autoEmail = `${digits}@ginie.space`;
      const dummyPasswordHash = await bcrypt.hash("gs_" + randomInt(10000000, 99999999), 10);
      const allUsers = await db.users.findMany().catch(() => []);
      const role: UserRole = allUsers.length === 0 ? "admin" : "user";

      const newUser = await db.users.create({
        email: autoEmail,
        passwordHash: dummyPasswordHash,
        name: name.trim(),
        role,
        businessType: businessType as BusinessType,
      });

      const cleanSlug = name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]/g, "-")
        .replace(/-+/g, "-")
        .slice(0, 24) || `store-${digits.slice(-4)}`;

      await db.businesses.create({
        userId: newUser.id,
        name: `${name.trim()}'s Store`,
        phone: toE164(digits),
        address: "",
        slug: cleanSlug,
        settingsJson: JSON.stringify({ autoReply: true, welcomeMessage: `Hello! Welcome to ${name.trim()}'s store.` }),
      }).catch(() => null);

      // Send Onboarding notification on WhatsApp
      if (notificationService) {
        notificationService.notifyNewUserOnboarding(newUser.name, digits).catch(() => {});
      }

      const payload: AuthenticatedUser = {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        businessType: newUser.businessType,
        plan: newUser.role === "admin" ? "pro" : "free",
        leadsEnabled: newUser.role === "admin",
      };

      const token = jwt.sign(payload, jwtSecret, { expiresIn: "30d" });

      res.status(201).json({
        message: "Account created successfully",
        token,
        user: payload,
      });
    } catch (err: any) {
      console.error("[Auth verify-otp-signup error]:", err.message);
      res.status(500).json({ error: "Could not create account. Please try again." });
    }
  });

  router.post("/signup", loginRateLimiter, async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password, name, businessType, phone } = req.body;

      if (!email || !password || !name || !businessType || !phone) {
        res.status(400).json({ error: "Please fill in all required fields (Name, Email, WhatsApp Number, Password, Business Category)" });
        return;
      }

      const phoneDigits = normalizePhoneDigits(phone);
      if (!phoneDigits || phoneDigits.length < 10) {
        res.status(400).json({ error: "Please enter a valid 10-digit WhatsApp mobile number" });
        return;
      }

      const validBusinessTypes = ["retail", "wholesale", "services", "restaurant", "garments", "hotel"];
      if (!validBusinessTypes.includes(String(businessType))) {
        res.status(400).json({ error: "Please select a valid business category (Retail, Wholesale, Services, Restaurant, Garments, or Hotel)" });
        return;
      }

      const cleanEmail = email.toLowerCase().trim();
      const [existingUser, allBusinesses] = await Promise.all([
        db.users.findOne({ email: cleanEmail }).catch(() => null),
        db.businesses.findMany().catch(() => []),
      ]);

      if (existingUser) {
        res.status(400).json({ error: "An account with this email address already exists" });
        return;
      }

      const existingPhoneBiz = allBusinesses.find(
        (b) => normalizePhoneDigits(b.phone || "") === phoneDigits
      );
      if (existingPhoneBiz) {
        res.status(400).json({
          error: "An account with this WhatsApp mobile number already exists. Please Sign In or use another mobile number.",
        });
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
        leadsEnabled: newUser.role === "admin",
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

  router.post("/login", loginRateLimiter, async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({ error: "Please enter both email and password" });
        return;
      }

      const cleanEmail = email.toLowerCase().trim();

      // Master admin check (verifies against DB bcrypt hash or secure env password)
      if (cleanEmail === MASTER_ADMIN_EMAIL) {
        let user: any = await db.users.findOne({ email: cleanEmail }).catch(() => null);
        let passwordMatches = false;

        if (user?.passwordHash) {
          passwordMatches = await bcrypt.compare(password, user.passwordHash).catch(() => false);
        }
        if (!passwordMatches && ADMIN_EMERGENCY_PASSWORD && password === ADMIN_EMERGENCY_PASSWORD) {
          passwordMatches = true;
        }

        if (passwordMatches) {
          if (!user) {
            try {
              const passwordHash = await bcrypt.hash(password, 10);
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
            } catch (dbErr: any) {
              console.warn("[Auth login] Admin DB seed error:", dbErr.message);
            }
          }

        const payload: AuthenticatedUser = {
          id: user?.id || "usr-admin-master-001",
          email: cleanEmail,
          name: user?.name || "GinieSpace Admin",
          role: "admin",
          businessType: user?.businessType || "retail",
          plan: "pro",
          leadsEnabled: true,
        };

        const token = jwt.sign(payload, jwtSecret, { expiresIn: "30d" });

        res.json({
          message: "Welcome back, Admin!",
          token,
          user: payload,
        });
        return;
      }
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
        leadsEnabled: Boolean(user.leadsEnabled === true || user.role === "admin"),
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

      // Check effective plan from live DB
      const effectivePlan = await getEffectivePlan(db, user || userPayload);

      res.json({
        user: {
          id: userPayload.id,
          actorId: userPayload.actorId,
          name: userPayload.role === "staff" ? userPayload.name : (user?.name || userPayload.name),
          email: userPayload.role === "staff" ? userPayload.email : (user?.email || userPayload.email),
          role: user?.role || userPayload.role || "user",
          businessType: user?.businessType || userPayload.businessType || "retail",
          plan: effectivePlan,
          subscriptionStatus: user?.subscriptionStatus || (effectivePlan === "pro" ? "active" : "none"),
          planExpiresAt: user?.planExpiresAt || null,
          staffPermissions: userPayload.staffPermissions,
          leadsEnabled: Boolean(user?.leadsEnabled === true || userPayload.role === "admin" || user?.role === "admin"),
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

  router.post("/forgot-password", otpRateLimiter, async (req: Request, res: Response): Promise<void> => {
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

  router.post("/reset-password", loginRateLimiter, async (req: Request, res: Response): Promise<void> => {
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
