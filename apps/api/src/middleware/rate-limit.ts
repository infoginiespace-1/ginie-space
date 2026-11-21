import rateLimit from "express-rate-limit";
import { Request, Response } from "express";
import { normalizePhoneDigits } from "../utils/phone";
import { getClientIp } from "../utils/ip";

// 1. Strict Limiter for WhatsApp OTP Delivery (Prevents toll fraud & SMS/WA bombing by IP)
export const otpRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Max 10 OTP requests per IP per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => getClientIp(req),
  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      error: "Bahut saari OTP requests bheji gayi hain. Kripya 15 minute baad dobara koshish karein.",
      retryAfterMinutes: 15,
    });
  },
});

// 1b. Per-Phone Number OTP Limiter (Prevents bombing a single victim even if attacker uses rotating proxies)
export const phoneOtpRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Max 5 OTP requests per target phone number per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    const raw = req.body?.phone || "";
    const phone = normalizePhoneDigits(String(raw));
    return phone ? `phone_otp:${phone}` : getClientIp(req);
  },
  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      error: "Is mobile number par bahut saari OTP requests bheji gayi hain. Suraksha ke liye 15 minute baad koshish karein.",
      retryAfterMinutes: 15,
    });
  },
});

// 2. Strict Limiter for Login & Verification (Prevents brute force / credential stuffing by IP)
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // Max 15 attempts per IP per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => getClientIp(req),
  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      error: "Bahut saare login attempts hue hain. Suraksha ke liye aapka request kuch der ke liye pause kiya gaya hai.",
      retryAfterMinutes: 15,
    });
  },
});

// 2b. Per-Phone/Account Login Limiter (Prevents distributed password/OTP guessing against a specific account)
export const phoneLoginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Max 5 failed attempts per target account per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    const phone = normalizePhoneDigits(String(req.body?.phone || ""));
    const email = String(req.body?.email || "").toLowerCase().trim();
    const identifier = phone || email;
    return identifier ? `account_login:${identifier}` : getClientIp(req);
  },
  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      error: "Is account ke liye bahut saare login attempts hue hain. Suraksha ke liye 15 minute baad dobara koshish karein.",
      retryAfterMinutes: 15,
    });
  },
});

// 3. Leads Discovery Limiter (Protects Google Places API quota & prevents scraping)
export const leadsSearchRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 30, // Max 30 discovery searches per IP per hour
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => getClientIp(req),
  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      error: "Hourly lead discovery limit reached. Please wait for the next hour window.",
      retryAfterMinutes: 60,
    });
  },
});

// 4. Global API Protection (Prevents general DDoS & bot flooding)
export const globalApiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 300, // Max 300 requests per IP per minute
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => getClientIp(req),
  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      error: "Server busy. Too many requests. Please slow down.",
    });
  },
});
