import { Request } from "express";

/**
 * Resolves the true client IP address behind multi-proxy setups (Cloudflare + Render).
 * Prioritizes CF-Connecting-IP (injected by Cloudflare edge),
 * then X-Real-IP, then the first hop of X-Forwarded-For, falling back to req.ip.
 */
export function getClientIp(req: Request): string {
  const cfConnectingIp = req.headers["cf-connecting-ip"];
  if (cfConnectingIp && typeof cfConnectingIp === "string") {
    const clean = cfConnectingIp.trim();
    if (clean) return clean;
  }

  const xRealIp = req.headers["x-real-ip"];
  if (xRealIp && typeof xRealIp === "string") {
    const clean = xRealIp.trim();
    if (clean) return clean;
  }

  const xForwardedFor = req.headers["x-forwarded-for"];
  if (xForwardedFor && typeof xForwardedFor === "string") {
    const first = xForwardedFor.split(",")[0].trim();
    if (first) return first;
  }

  return req.ip || req.socket?.remoteAddress || "127.0.0.1";
}
