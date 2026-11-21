import rateLimit from "express-rate-limit";
import { Request, Response } from "express";

// 1. Strict Limiter for WhatsApp OTP Delivery (Prevents toll fraud & SMS/WA bombing)
export const otpRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Max 10 OTP requests per IP per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      error: "Bahut saari OTP requests bheji gayi hain. Kripya 15 minute baad dobara koshish karein.",
      retryAfterMinutes: 15,
    });
  },
});

// 2. Strict Limiter for Login & Verification (Prevents brute force / credential stuffing)
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // Max 15 attempts per IP per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      error: "Bahut saare login attempts hue hain. Suraksha ke liye aapka request kuch der ke liye pause kiya gaya hai.",
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
  handler: (_req: Request, res: Response) => {
    res.status(429).json({
      error: "Server busy. Too many requests. Please slow down.",
    });
  },
});
