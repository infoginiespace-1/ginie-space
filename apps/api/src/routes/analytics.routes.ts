import { Router, Request, Response } from "express";
import { AnalyticsService } from "../services/analytics.service";

export function createAnalyticsRouter(analyticsService: AnalyticsService): Router {
  const router = Router();

  // Public Beacon Collector (Non-blocking beacon from frontend)
  router.post("/collect", async (req: Request, res: Response): Promise<void> => {
    try {
      const { path, referrer, device, browser, os, pageLoadMs, sessionId } = req.body || {};
      const ip = (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "";
      
      // Fire-and-forget record
      analyticsService.recordHit({
        path: typeof path === "string" ? path : "/",
        referrer: typeof referrer === "string" ? referrer : "",
        device: typeof device === "string" ? device : "Mobile",
        browser: typeof browser === "string" ? browser : "Chrome",
        os: typeof os === "string" ? os : "",
        pageLoadMs: typeof pageLoadMs === "number" ? pageLoadMs : undefined,
        sessionId: typeof sessionId === "string" ? sessionId : undefined,
        ip,
      }).catch(() => {});

      res.status(204).end();
    } catch {
      res.status(204).end();
    }
  });

  // Public SEO Configuration (for Google verification meta tags & GA4 inject)
  router.get("/seo-public", async (_req: Request, res: Response): Promise<void> => {
    try {
      const seo = await analyticsService.getPublicSeoSettings();
      res.json(seo);
    } catch {
      res.json({ ga4MeasurementId: "", googleSiteVerification: "" });
    }
  });

  return router;
}
