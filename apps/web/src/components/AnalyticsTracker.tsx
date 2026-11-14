"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export function AnalyticsTracker() {
  const pathname = usePathname();
  const seoFetchedRef = useRef(false);

  // 1. Initial SEO & Google Analytics 4 Script Tag Injection
  useEffect(() => {
    if (seoFetchedRef.current || typeof window === "undefined") return;
    seoFetchedRef.current = true;

    const apiBase = process.env.NEXT_PUBLIC_API_URL || "https://api.ginie.space";

    fetch(`${apiBase}/api/analytics/seo-public`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data) return;

        // A. Google Search Console Verification Meta Tag
        if (data.googleSiteVerification) {
          let meta = document.querySelector('meta[name="google-site-verification"]');
          if (!meta) {
            meta = document.createElement("meta");
            meta.setAttribute("name", "google-site-verification");
            document.head.appendChild(meta);
          }
          meta.setAttribute("content", data.googleSiteVerification);
        }

        // B. Google Analytics 4 Injection
        if (data.ga4MeasurementId && /^G-[A-Za-z0-9]+$/i.test(data.ga4MeasurementId)) {
          if (!document.getElementById("ga4-script")) {
            const script = document.createElement("script");
            script.id = "ga4-script";
            script.async = true;
            script.src = `https://www.googletagmanager.com/gtag/js?id=${data.ga4MeasurementId}`;
            document.head.appendChild(script);

            const inlineScript = document.createElement("script");
            inlineScript.id = "ga4-init";
            inlineScript.innerHTML = `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${data.ga4MeasurementId}', { send_page_view: true });
            `;
            document.head.appendChild(inlineScript);
          }
        }
      })
      .catch(() => {});
  }, []);

  // 2. Route Tracking Beacon (Zero Latency / Non-blocking)
  useEffect(() => {
    if (typeof window === "undefined" || !pathname) return;

    // Send pageview to GA4 if active
    if (typeof (window as any).gtag === "function") {
      try {
        (window as any).gtag("event", "page_view", {
          page_path: pathname,
          page_title: document.title,
        });
      } catch {}
    }

    // Determine device
    const ua = navigator.userAgent;
    let device = "Desktop";
    if (/iPad|Tablet/i.test(ua)) {
      device = "Tablet";
    } else if (/Mobi|Android|iPhone|iPod/i.test(ua)) {
      device = "Mobile";
    }

    // Determine browser
    let browser = "Chrome";
    if (/Firefox/i.test(ua)) browser = "Firefox";
    else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = "Safari";
    else if (/Edg/i.test(ua)) browser = "Edge";

    // Session identifier
    let sessionId = "";
    try {
      sessionId = sessionStorage.getItem("gs_sid") || "";
      if (!sessionId) {
        sessionId = "s_" + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
        sessionStorage.setItem("gs_sid", sessionId);
      }
    } catch {}

    // Page load duration
    let pageLoadMs: number | undefined;
    try {
      const navEntries = performance.getEntriesByType("navigation");
      if (navEntries.length > 0) {
        const nav = navEntries[0] as PerformanceNavigationTiming;
        if (nav.duration > 0) {
          pageLoadMs = Math.round(nav.duration);
        }
      }
    } catch {}

    const apiBase = process.env.NEXT_PUBLIC_API_URL || "https://api.ginie.space";
    const payload = JSON.stringify({
      path: pathname,
      referrer: typeof document !== "undefined" ? document.referrer || "" : "",
      device,
      browser,
      pageLoadMs,
      sessionId,
    });

    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      try {
        const blob = new Blob([payload], { type: "application/json" });
        navigator.sendBeacon(`${apiBase}/api/analytics/collect`, blob);
        return;
      } catch {}
    }

    // Fallback fetch with keepalive
    fetch(`${apiBase}/api/analytics/collect`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      keepalive: true,
    }).catch(() => {});
  }, [pathname]);

  return null;
}
