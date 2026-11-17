import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://app.ginie.space";
  const now = new Date();

  const publicRoutes = [
    // Home (English & Hindi)
    { path: "", changeFrequency: "daily" as const, priority: 1.0 },
    { path: "/hi", changeFrequency: "daily" as const, priority: 1.0 },

    // Pricing
    { path: "/pricing", changeFrequency: "weekly" as const, priority: 0.9 },
    { path: "/hi/pricing", changeFrequency: "weekly" as const, priority: 0.9 },

    // Core Pillars (English)
    { path: "/whatsapp-catalog-maker", changeFrequency: "weekly" as const, priority: 0.9 },
    { path: "/upi-billing-software", changeFrequency: "weekly" as const, priority: 0.9 },
    { path: "/b2b-leads-finder", changeFrequency: "weekly" as const, priority: 0.9 },
    { path: "/retail-kirana-store", changeFrequency: "weekly" as const, priority: 0.8 },
    { path: "/wholesale-distributors", changeFrequency: "weekly" as const, priority: 0.8 },
    { path: "/services-appointments", changeFrequency: "weekly" as const, priority: 0.8 },

    // Core Pillars (Hindi)
    { path: "/hi/whatsapp-catalog-maker", changeFrequency: "weekly" as const, priority: 0.9 },
    { path: "/hi/upi-billing-software", changeFrequency: "weekly" as const, priority: 0.9 },
    { path: "/hi/b2b-leads-finder", changeFrequency: "weekly" as const, priority: 0.9 },
    { path: "/hi/retail-kirana-store", changeFrequency: "weekly" as const, priority: 0.8 },
    { path: "/hi/wholesale-distributors", changeFrequency: "weekly" as const, priority: 0.8 },
    { path: "/hi/services-appointments", changeFrequency: "weekly" as const, priority: 0.8 },

    // Legal / Compliance
    { path: "/terms", changeFrequency: "monthly" as const, priority: 0.3 },
    { path: "/privacy", changeFrequency: "monthly" as const, priority: 0.3 },
    { path: "/refund", changeFrequency: "monthly" as const, priority: 0.3 },
  ];

  return publicRoutes.map((route) => ({
    url: `${baseUrl}${route.path}`,
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
