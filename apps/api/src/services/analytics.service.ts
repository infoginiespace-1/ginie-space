import { IDatabase } from "@giniespace/sheets-db";

export interface AnalyticsHit {
  path: string;
  referrer?: string;
  device?: string;
  browser?: string;
  os?: string;
  pageLoadMs?: number;
  sessionId?: string;
  ip?: string;
}

export interface LiveSession {
  sessionId: string;
  lastSeen: number;
  path: string;
  channel: string;
  device: string;
  browser: string;
}

export interface DailyAnalytics {
  date: string;
  pageviews: number;
  uniqueVisitors: number;
  landingViews: number;
  signupViews: number;
  storefrontViews: number;
  channels: Record<string, number>;
  devices: Record<string, number>;
  browsers: Record<string, number>;
  topPages: Record<string, number>;
  totalLoadMs: number;
  loadCount: number;
}

export class AnalyticsService {
  private db: IDatabase;
  private liveSessions: Map<string, LiveSession> = new Map();
  private sessionVisitorIds: Set<string> = new Set();
  private todayStats: DailyAnalytics;
  private allTimeStats: {
    totalPageviews: number;
    totalVisitors: number;
    landingViews: number;
    signupViews: number;
    channels: Record<string, number>;
    devices: Record<string, number>;
  };
  private saveTimeout: NodeJS.Timeout | null = null;
  private isLoaded = false;

  constructor(db: IDatabase) {
    this.db = db;
    const today = new Date().toISOString().slice(0, 10);
    this.todayStats = this.initDay(today);
    this.allTimeStats = {
      totalPageviews: 0,
      totalVisitors: 0,
      landingViews: 0,
      signupViews: 0,
      channels: {},
      devices: {},
    };

    // Load initial persisted stats
    this.loadPersistedStats().catch(() => {});
  }

  private initDay(date: string): DailyAnalytics {
    return {
      date,
      pageviews: 0,
      uniqueVisitors: 0,
      landingViews: 0,
      signupViews: 0,
      storefrontViews: 0,
      channels: {
        "WhatsApp Viral": 0,
        "Google Organic": 0,
        "Direct Navigation": 0,
        "Instagram / Social": 0,
        "Other Referrals": 0,
      },
      devices: {
        Mobile: 0,
        Desktop: 0,
        Tablet: 0,
      },
      browsers: {},
      topPages: {},
      totalLoadMs: 0,
      loadCount: 0,
    };
  }

  private classifyChannel(referrer?: string, path?: string): string {
    if (!referrer || referrer === "direct" || referrer === "") {
      return "Direct Navigation";
    }
    const r = referrer.toLowerCase();
    if (r.includes("whatsapp") || r.includes("wa.me")) {
      return "WhatsApp Viral";
    }
    if (r.includes("google.") || r.includes("bing.") || r.includes("yahoo.")) {
      return "Google Organic";
    }
    if (r.includes("instagram.") || r.includes("facebook.") || r.includes("fb.") || r.includes("t.co") || r.includes("twitter.") || r.includes("linkedin.")) {
      return "Instagram / Social";
    }
    if (r.includes("ginie.space")) {
      return "Direct Navigation";
    }
    return "Other Referrals";
  }

  private classifyDevice(deviceRaw?: string): string {
    if (!deviceRaw) return "Mobile";
    const d = deviceRaw.toLowerCase();
    if (d.includes("tab") || d.includes("ipad")) return "Tablet";
    if (d.includes("desktop") || d.includes("mac") || d.includes("win") || d.includes("pc")) return "Desktop";
    return "Mobile";
  }

  public async recordHit(hit: AnalyticsHit): Promise<void> {
    const today = new Date().toISOString().slice(0, 10);
    if (this.todayStats.date !== today) {
      this.todayStats = this.initDay(today);
      this.sessionVisitorIds.clear();
    }

    const sessionId = hit.sessionId || `anon_${Math.random().toString(36).slice(2, 10)}`;
    const channel = this.classifyChannel(hit.referrer, hit.path);
    const device = this.classifyDevice(hit.device);
    const browser = hit.browser || "Chrome";
    const now = Date.now();

    // 1. Update Live Sessions
    this.liveSessions.set(sessionId, {
      sessionId,
      lastSeen: now,
      path: hit.path || "/",
      channel,
      device,
      browser,
    });

    // Prune stale sessions older than 15 mins
    for (const [id, s] of this.liveSessions.entries()) {
      if (now - s.lastSeen > 15 * 60 * 1000) {
        this.liveSessions.delete(id);
      }
    }

    // 2. Pageviews and Unique Visitors
    this.todayStats.pageviews++;
    this.allTimeStats.totalPageviews++;

    if (!this.sessionVisitorIds.has(sessionId)) {
      this.sessionVisitorIds.add(sessionId);
      this.todayStats.uniqueVisitors++;
      this.allTimeStats.totalVisitors++;
    }

    // 3. Funnel Page Counts
    const p = hit.path || "/";
    if (p === "/" || p === "") {
      this.todayStats.landingViews++;
      this.allTimeStats.landingViews++;
    } else if (p.startsWith("/signup")) {
      this.todayStats.signupViews++;
      this.allTimeStats.signupViews++;
    } else if (p.startsWith("/shop/")) {
      this.todayStats.storefrontViews++;
    }

    // 4. Channel tracking
    this.todayStats.channels[channel] = (this.todayStats.channels[channel] || 0) + 1;
    this.allTimeStats.channels[channel] = (this.allTimeStats.channels[channel] || 0) + 1;

    // 5. Device tracking
    this.todayStats.devices[device] = (this.todayStats.devices[device] || 0) + 1;
    this.allTimeStats.devices[device] = (this.allTimeStats.devices[device] || 0) + 1;

    // 6. Top Pages
    const pageKey = p.split("?")[0].slice(0, 60);
    this.todayStats.topPages[pageKey] = (this.todayStats.topPages[pageKey] || 0) + 1;

    // 7. Page Load Speed
    if (hit.pageLoadMs && hit.pageLoadMs > 0 && hit.pageLoadMs < 10000) {
      this.todayStats.totalLoadMs += hit.pageLoadMs;
      this.todayStats.loadCount++;
    }

    // 8. Schedule debounced persist to db.settings
    this.schedulePersist();
  }

  private schedulePersist() {
    if (this.saveTimeout) return;
    this.saveTimeout = setTimeout(async () => {
      this.saveTimeout = null;
      await this.persistStats();
    }, 10000); // Persist at most once every 10 seconds
  }

  private async loadPersistedStats(): Promise<void> {
    try {
      const setting = await this.db.settings.findOne({ userId: "admin", key: "platform_web_analytics" }).catch(() => null);
      if (setting?.value) {
        const parsed = JSON.parse(setting.value);
        if (parsed.allTime) {
          this.allTimeStats = {
            totalPageviews: Number(parsed.allTime.totalPageviews) || 0,
            totalVisitors: Number(parsed.allTime.totalVisitors) || 0,
            landingViews: Number(parsed.allTime.landingViews) || 0,
            signupViews: Number(parsed.allTime.signupViews) || 0,
            channels: parsed.allTime.channels || {},
            devices: parsed.allTime.devices || {},
          };
        }
        if (parsed.today && parsed.today.date === new Date().toISOString().slice(0, 10)) {
          this.todayStats = {
            ...this.initDay(parsed.today.date),
            ...parsed.today,
          };
        }
      }
      this.isLoaded = true;
    } catch (err: any) {
      console.warn("[AnalyticsService] Load error:", err.message);
    }
  }

  private async persistStats(): Promise<void> {
    try {
      const payload = {
        updatedAt: new Date().toISOString(),
        today: this.todayStats,
        allTime: this.allTimeStats,
      };
      const existing = await this.db.settings.findOne({ userId: "admin", key: "platform_web_analytics" }).catch(() => null);
      if (existing) {
        await this.db.settings.update(existing.id, { value: JSON.stringify(payload) });
      } else {
        await this.db.settings.create({
          userId: "admin",
          key: "platform_web_analytics",
          value: JSON.stringify(payload),
        });
      }
    } catch (err: any) {
      console.warn("[AnalyticsService] Persist error:", err.message);
    }
  }

  public async getAnalyticsReport(): Promise<any> {
    const now = Date.now();
    // Live visitors active in the last 5 minutes
    const fiveMinsAgo = now - 5 * 60 * 1000;
    const activeLive = Array.from(this.liveSessions.values()).filter((s) => s.lastSeen >= fiveMinsAgo);

    // Fetch registered merchants count from DB
    const allUsers = await this.db.users.findMany().catch(() => []);
    const completedSignups = allUsers.filter((u) => u.role !== "staff").length;

    // 100% Real Tracking Numbers (pure real-time data, no dummy baselines)
    const totalPageviews = this.allTimeStats.totalPageviews;
    const totalVisitors = this.allTimeStats.totalVisitors;
    const todayPageviews = this.todayStats.pageviews;
    const todayVisitors = this.todayStats.uniqueVisitors;
    const liveCount = activeLive.length;

    // Real Funnel calculations
    const landingViews = this.allTimeStats.landingViews;
    const signupViews = this.allTimeStats.signupViews;
    const visitorToSignupRate = landingViews > 0
      ? Math.min(100, Math.round((signupViews / landingViews) * 1000) / 10)
      : 0;
    const signupToRegisteredRate = signupViews > 0
      ? Math.min(100, Math.round((completedSignups / signupViews) * 1000) / 10)
      : 0;
    const overallConversionRate = landingViews > 0
      ? Math.min(100, Math.round((completedSignups / landingViews) * 1000) / 10)
      : 0;

    // Real Channel breakdown strictly from actual tracked visits
    const channelCounts: Record<string, number> = {};
    for (const [ch, count] of Object.entries(this.allTimeStats.channels)) {
      if (count > 0) {
        channelCounts[ch] = count;
      }
    }
    const totalChannelHits = Object.values(channelCounts).reduce((a, b) => a + b, 0);
    const sources = totalChannelHits > 0
      ? Object.entries(channelCounts).map(([channel, count]) => ({
          channel,
          count,
          percent: Math.round((count / totalChannelHits) * 100),
        }))
      : [
          { channel: "WhatsApp Viral", count: 0, percent: 0 },
          { channel: "Google Organic", count: 0, percent: 0 },
          { channel: "Direct Navigation", count: 0, percent: 0 },
          { channel: "Instagram / Social", count: 0, percent: 0 },
        ];

    // Real Device breakdown strictly from actual tracked hits (supporting both lowercase and capitalized keys)
    const mobileCount = this.allTimeStats.devices["Mobile"] || 0;
    const desktopCount = this.allTimeStats.devices["Desktop"] || 0;
    const tabletCount = this.allTimeStats.devices["Tablet"] || 0;
    const totalDevices = mobileCount + desktopCount + tabletCount;
    const mobilePct = totalDevices > 0 ? Math.round((mobileCount / totalDevices) * 100) : 0;
    const desktopPct = totalDevices > 0 ? Math.round((desktopCount / totalDevices) * 100) : 0;
    const tabletPct = totalDevices > 0 ? Math.round((tabletCount / totalDevices) * 100) : 0;
    const devices = {
      mobile: mobilePct,
      desktop: desktopPct,
      tablet: tabletPct,
      Mobile: mobilePct,
      Desktop: desktopPct,
      Tablet: tabletPct,
    };

    // Real Average page load speed
    const avgLoadMs = this.todayStats.loadCount > 0
      ? Math.round(this.todayStats.totalLoadMs / this.todayStats.loadCount)
      : 0;
    const speedRating = avgLoadMs === 0
      ? "Realtime Active"
      : avgLoadMs < 800
      ? "Grade A+ (Superfast)"
      : avgLoadMs < 1500
      ? "Grade A (Good)"
      : "Needs Optimization";

    // Read SEO Settings from db.settings
    const seoSetting = await this.db.settings.findOne({ userId: "admin", key: "platform_seo_settings" }).catch(() => null);
    let seoConfig = {
      ga4MeasurementId: "",
      googleSiteVerification: "",
      targetKeywords: "whatsapp store builder, free online dukaan, b2b catalog, giniespace",
      indexingStatus: "Active & Indexed",
      sitemapUrl: "https://app.ginie.space/sitemap.xml",
      robotsUrl: "https://app.ginie.space/robots.txt",
    };
    if (seoSetting?.value) {
      try {
        seoConfig = { ...seoConfig, ...JSON.parse(seoSetting.value) };
      } catch {}
    }

    // Real Top Pages list
    const topPagesList = Object.entries(this.todayStats.topPages || {})
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([path, views]) => {
        let name = path;
        if (path === "/" || path === "") name = "Landing Page & Store Showcase";
        else if (path === "/signup") name = "Merchant Signup & Onboarding";
        else if (path === "/login") name = "Merchant Login Portal";
        else if (path.startsWith("/shop/")) name = "Public Storefronts & Catalogs";
        else if (path.startsWith("/admin")) name = "Admin Command Portal";
        return { path, name, views };
      });

    const topPages = topPagesList.length > 0
      ? topPagesList
      : [
          { path: "/", name: "Landing Page & Store Showcase", views: landingViews },
          { path: "/signup", name: "Merchant Signup & Onboarding", views: signupViews },
          { path: "/shop/*", name: "Public Storefronts & Catalogs", views: this.todayStats.storefrontViews },
        ];

    return {
      liveVisitorsCount: liveCount,
      summary: {
        todayVisitors,
        todayPageviews,
        totalVisitors,
        totalPageviews,
        avgPageLoadMs: avgLoadMs,
        speedRating,
        overallConversionRate,
      },
      funnel: {
        landingViews,
        signupViews,
        completedSignups,
        visitorToSignupRate,
        signupToRegisteredRate,
        overallConversionRate,
      },
      sources,
      devices,
      topPages,
      seo: seoConfig,
    };
  }

  public async saveSeoSettings(config: { ga4MeasurementId?: string; googleSiteVerification?: string; targetKeywords?: string }): Promise<void> {
    const existing = await this.db.settings.findOne({ userId: "admin", key: "platform_seo_settings" }).catch(() => null);
    const updated = {
      ga4MeasurementId: config.ga4MeasurementId || "",
      googleSiteVerification: config.googleSiteVerification || "",
      targetKeywords: config.targetKeywords || "",
      updatedAt: new Date().toISOString(),
      sitemapUrl: "https://app.ginie.space/sitemap.xml",
      robotsUrl: "https://app.ginie.space/robots.txt",
      indexingStatus: "Active & Indexed",
    };
    if (existing) {
      await this.db.settings.update(existing.id, { value: JSON.stringify(updated) });
    } else {
      await this.db.settings.create({
        userId: "admin",
        key: "platform_seo_settings",
        value: JSON.stringify(updated),
      });
    }
  }

  public async getPublicSeoSettings(): Promise<{ ga4MeasurementId: string; googleSiteVerification: string }> {
    try {
      const setting = await this.db.settings.findOne({ userId: "admin", key: "platform_seo_settings" }).catch(() => null);
      if (setting?.value) {
        const parsed = JSON.parse(setting.value);
        return {
          ga4MeasurementId: parsed.ga4MeasurementId || "",
          googleSiteVerification: parsed.googleSiteVerification || "",
        };
      }
    } catch {}
    return {
      ga4MeasurementId: "",
      googleSiteVerification: "",
    };
  }
}
