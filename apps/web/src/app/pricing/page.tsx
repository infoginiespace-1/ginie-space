import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import MarketingNav from "@/components/MarketingNav";
import MarketingFooter from "@/components/MarketingFooter";
import { CheckCircleFilled, ArrowRightOutlined, ThunderboltOutlined, CrownOutlined, SafetyCertificateOutlined } from "@ant-design/icons";

export const metadata: Metadata = {
  title: "Pricing & Plans - ₹0 Free Forever & PRO ₹199 | GinieSpace",
  description:
    "GinieSpace pricing plans: Start free forever with 0% UPI gateway fee, or upgrade to PRO at ₹199/month for unlimited catalog & 1,000 local B2B leads.",
  alternates: {
    canonical: "https://app.ginie.space/pricing",
    languages: {
      "en-IN": "https://app.ginie.space/pricing",
      "hi-IN": "https://app.ginie.space/hi/pricing",
      "x-default": "https://app.ginie.space/pricing",
    },
  },
  openGraph: {
    title: "Pricing & Plans - ₹0 Free Forever & PRO ₹199 | GinieSpace",
    description:
      "Start free with 0% UPI payment gateway fee or unlock PRO at ₹199/month for unlimited inventory, 1,000 local B2B leads, and staff seats.",
    url: "https://app.ginie.space/pricing",
    siteName: "GinieSpace",
    locale: "en_IN",
    type: "website",
    images: [{ url: "https://app.ginie.space/og-catalog.jpg", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "GinieSpace Pricing: Free Forever & PRO at ₹199/Month",
    description: "Zero gateway fees. 100% direct bank UPI settlements. Built for Indian Kiranas, wholesalers & service providers.",
    images: ["https://app.ginie.space/og-catalog.jpg"],
  },
};

export default function PricingPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", color: "#0f172a" }}>
      <MarketingNav currentPath="/pricing" lang="en" />

      {/* Hero Header */}
      <section style={{ maxWidth: 1100, margin: "0 auto", padding: "56px 20px 32px", textAlign: "center" }}>
        <span
          style={{
            display: "inline-block",
            background: "#ecfdf5",
            color: "#059669",
            border: "1px solid #a7f3d0",
            fontSize: 13,
            fontWeight: 700,
            padding: "5px 14px",
            borderRadius: 999,
            marginBottom: 16,
          }}
        >
          TRANSPARENT &amp; AFFORDABLE PRICING
        </span>
        <h1
          style={{
            fontSize: "clamp(2rem, 4vw, 3rem)",
            fontWeight: 800,
            lineHeight: 1.25,
            letterSpacing: "-0.02em",
            maxWidth: 900,
            margin: "0 auto 16px",
          }}
        >
          GinieSpace Pricing: Free Forever &amp; PRO at ₹199/Month
        </h1>
        <p
          style={{
            fontSize: "clamp(1rem, 1.8vw, 1.2rem)",
            color: "#475569",
            maxWidth: 780,
            margin: "0 auto 36px",
            lineHeight: 1.6,
          }}
        >
          Empowering Indian retail dukandars, wholesalers, and service businesses with 0% payment gateway commission, 100% direct bank UPI billing, and verified local Google Maps B2B leads.
        </p>

        {/* Pricing Cards Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(310px, 1fr))",
            gap: 28,
            maxWidth: 960,
            margin: "0 auto 56px",
            textAlign: "left",
          }}
        >
          {/* Free Forever Plan */}
          <div
            style={{
              background: "#ffffff",
              borderRadius: 20,
              padding: 36,
              border: "1px solid #e2e8f0",
              boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div style={{ display: "inline-block", background: "#f1f5f9", color: "#475569", fontSize: 12, fontWeight: 700, padding: "4px 10px", borderRadius: 6, marginBottom: 12, width: "fit-content" }}>
              STARTER TIER
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 800, margin: "0 0 8px" }}>Free Forever</h2>
            <p style={{ color: "#64748b", fontSize: 14, minHeight: 42, marginBottom: 16 }}>
              Perfect for new merchants and small shops starting their digital catalog on WhatsApp.
            </p>
            <div style={{ fontSize: 36, fontWeight: 800, color: "#0f172a", marginBottom: 20 }}>
              ₹0 <span style={{ fontSize: 14, fontWeight: 500, color: "#64748b" }}>/ forever</span>
            </div>

            <Link
              href="/signup"
              style={{
                display: "block",
                textAlign: "center",
                padding: "12px",
                borderRadius: 10,
                border: "1px solid #059669",
                color: "#059669",
                fontWeight: 700,
                fontSize: 15,
                textDecoration: "none",
                marginBottom: 28,
              }}
            >
              Start Free (₹0)
            </Link>

            <div style={{ fontWeight: 700, fontSize: 13, color: "#0f172a", marginBottom: 12 }}>Includes:</div>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 12, fontSize: 14, color: "#334155" }}>
              {[
                "Up to 15 Active Products / Services",
                "3 Hyperlocal B2B Searches / day (60 Leads)",
                "Max 10 Saved CRM Business Leads",
                "1 Dedicated Staff Account",
                "0% Commission Direct Bank UPI Billing",
                "Live WhatsApp Web Multi-Device Sync",
                "Standard Email & Helpdesk Support",
              ].map((feature, i) => (
                <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <CheckCircleFilled style={{ color: "#059669", marginTop: 3, flexShrink: 0 }} />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* PRO Growth Plan */}
          <div
            style={{
              background: "#ffffff",
              borderRadius: 20,
              padding: 36,
              border: "2px solid #059669",
              boxShadow: "0 12px 36px rgba(5, 150, 105, 0.12)",
              position: "relative",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: -14,
                left: "50%",
                transform: "translateX(-50%)",
                background: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
                color: "#fff",
                fontSize: 12,
                fontWeight: 800,
                padding: "4px 16px",
                borderRadius: 999,
                boxShadow: "0 4px 12px rgba(5,150,105,0.3)",
              }}
            >
              👑 MOST POPULAR GROWTH TIER
            </div>

            <div style={{ display: "inline-block", background: "#fef3c7", color: "#92400e", fontSize: 12, fontWeight: 700, padding: "4px 10px", borderRadius: 6, marginBottom: 12, width: "fit-content" }}>
              0% GATEWAY COMMISSIONS
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: "#065f46", margin: "0 0 8px" }}>PRO Workspace</h2>
            <p style={{ color: "#64748b", fontSize: 14, minHeight: 42, marginBottom: 16 }}>
              For growing retail stores, wholesale distributors, and high-volume order operations.
            </p>
            <div style={{ fontSize: 36, fontWeight: 800, color: "#065f46", marginBottom: 20 }}>
              ₹199 <span style={{ fontSize: 14, fontWeight: 500, color: "#64748b" }}>/ month (or ₹1,799 / year)</span>
            </div>

            <Link
              href="/signup"
              style={{
                display: "block",
                textAlign: "center",
                padding: "12px",
                borderRadius: 10,
                background: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
                color: "#fff",
                fontWeight: 700,
                fontSize: 15,
                textDecoration: "none",
                marginBottom: 28,
                boxShadow: "0 4px 14px rgba(5, 150, 105, 0.35)",
              }}
            >
              Upgrade to PRO ➔
            </Link>

            <div style={{ fontWeight: 700, fontSize: 13, color: "#0f172a", marginBottom: 12 }}>Everything in Free, plus:</div>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 12, fontSize: 14, color: "#334155" }}>
              {[
                "Unlimited Catalog Items (10,000+ SKU inventory)",
                "50 Local B2B Searches / month (1,000 Verified Leads)",
                "10,000 Saved CRM Leads & Contacts",
                "5 Team Staff Seats (Billing, Delivery & Store boys)",
                "Broadcast Tool & Promotional Announcements",
                "Verified Green Storefront Badge on /shop link",
                "Nightly 9:00 PM WhatsApp Order & Sales Summary",
                "Direct Bank UPI QR + 12-Digit UTR Auto-Activation",
                "Priority WhatsApp VIP Support (+91 92792 59690)",
              ].map((feature, i) => (
                <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <CheckCircleFilled style={{ color: "#059669", marginTop: 3, flexShrink: 0 }} />
                  <span style={{ fontWeight: 500 }}>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Why 0% UPI Fee Matters */}
      <section style={{ background: "#ffffff", padding: "64px 20px", borderTop: "1px solid #e2e8f0", borderBottom: "1px solid #e2e8f0" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <h2 style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)", fontWeight: 800, color: "#0f172a", marginBottom: 12 }}>
              Why GinieSpace Saves You ₹30,000–₹75,000 Every Year
            </h2>
            <p style={{ color: "#64748b", fontSize: 15, maxWidth: 700, margin: "0 auto" }}>
              Conventional e-commerce apps and payment gateways charge 2% to 3% plus 18% GST on every single sale. Here is how GinieSpace eliminates the middleman.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
            <div style={{ background: "#f8fafc", padding: 24, borderRadius: 16, border: "1px solid #e2e8f0" }}>
              <div style={{ color: "#ef4444", fontWeight: 800, fontSize: 16, marginBottom: 8 }}>❌ Gateway Aggregators</div>
              <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.6 }}>
                If your shop sells ₹2,00,000 per month, a 2.5% gateway fee costs you ₹5,000 each month (₹60,000 every year). Settlements are held for T+2 or T+3 business days.
              </p>
            </div>

            <div style={{ background: "#ecfdf5", padding: 24, borderRadius: 16, border: "1px solid #a7f3d0" }}>
              <div style={{ color: "#059669", fontWeight: 800, fontSize: 16, marginBottom: 8 }}>✅ GinieSpace Direct UPI</div>
              <p style={{ fontSize: 14, color: "#065f46", lineHeight: 1.6 }}>
                Customer scans your own personal/business UPI QR code. 100% of the money lands in your bank instantly (T+0). Zero gateway fees deducted. You only pay ₹199/month flat.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions */}
      <section style={{ maxWidth: 880, margin: "64px auto", padding: "0 20px" }}>
        <h2 style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)", fontWeight: 800, textAlign: "center", marginBottom: 36 }}>
          Frequently Asked Questions About GinieSpace Pricing
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {[
            {
              q: "Is the Free Plan really free forever?",
              a: "Yes. You can use GinieSpace Free Starter Tier permanently without entering a credit card. It allows up to 15 catalog items, daily 3 local B2B leads searches (60 leads), and direct bank UPI billing with 0% gateway commission.",
            },
            {
              q: "How do I upgrade to the PRO Plan (₹199)?",
              a: "Simply open your GinieSpace dashboard, click 'Upgrade to PRO', scan the official UPI QR code with GPay, PhonePe, or Paytm, and enter your 12-digit bank UTR transaction number. Your PRO workspace is activated instantly.",
            },
            {
              q: "Are there any hidden transaction fees or commissions?",
              a: "None whatsoever. GinieSpace does not act as a payment gateway intermediary. Every rupee your customer sends goes directly from their UPI app to your bank account with 0% cut.",
            },
            {
              q: "Can I cancel or change my plan anytime?",
              a: "Yes, there are no annual locking contracts or hidden penalties. You can use the monthly plan at ₹199/month and pause or resume whenever your business seasonality requires.",
            },
          ].map((item, idx) => (
            <div key={idx} style={{ background: "#ffffff", padding: 24, borderRadius: 12, border: "1px solid #e2e8f0" }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", margin: "0 0 8px" }}>{item.q}</h3>
              <p style={{ fontSize: 14, color: "#475569", lineHeight: 1.6, margin: 0 }}>{item.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Internal Linking & Pillar Exploration */}
      <section style={{ background: "#ffffff", padding: "56px 20px", borderTop: "1px solid #e2e8f0" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", marginBottom: 20 }}>
            Explore GinieSpace Core Solutions
          </h2>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 12 }}>
            <Link href="/whatsapp-catalog-maker" style={{ padding: "8px 16px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: 8, color: "#0f172a", fontWeight: 600, textDecoration: "none", fontSize: 13 }}>
              WhatsApp Catalog Maker ➔
            </Link>
            <Link href="/upi-billing-software" style={{ padding: "8px 16px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: 8, color: "#0f172a", fontWeight: 600, textDecoration: "none", fontSize: 13 }}>
              0% UPI Billing Software ➔
            </Link>
            <Link href="/b2b-leads-finder" style={{ padding: "8px 16px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: 8, color: "#0f172a", fontWeight: 600, textDecoration: "none", fontSize: 13 }}>
              B2B Local Leads Discovery ➔
            </Link>
            <Link href="/retail-kirana-store" style={{ padding: "8px 16px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: 8, color: "#0f172a", fontWeight: 600, textDecoration: "none", fontSize: 13 }}>
              Retail &amp; Kirana Solution ➔
            </Link>
            <Link href="/wholesale-distributors" style={{ padding: "8px 16px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: 8, color: "#0f172a", fontWeight: 600, textDecoration: "none", fontSize: 13 }}>
              Wholesale &amp; Bulk MOQs ➔
            </Link>
            <Link href="/services-appointments" style={{ padding: "8px 16px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: 8, color: "#0f172a", fontWeight: 600, textDecoration: "none", fontSize: 13 }}>
              Services &amp; Appointments ➔
            </Link>
          </div>
        </div>
      </section>

      {/* Pre-Footer CTA */}
      <section style={{ maxWidth: 960, margin: "48px auto", padding: "0 20px" }}>
        <div style={{ background: "linear-gradient(135deg, #059669 0%, #10b981 100%)", borderRadius: 20, padding: "40px 24px", textAlign: "center", color: "#fff", boxShadow: "0 16px 40px rgba(5,150,105,0.25)" }}>
          <h2 style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)", fontWeight: 800, margin: "0 0 12px", color: "#fff" }}>
            Ready to Take 100% of Your Earnings Home?
          </h2>
          <p style={{ color: "#ecfdf5", fontSize: 15, maxWidth: 600, margin: "0 auto 24px" }}>
            Create your online WhatsApp storefront in 60 seconds. No credit card required. Permanent free plan.
          </p>
          <Link
            href="/signup"
            style={{
              display: "inline-block",
              background: "#ffffff",
              color: "#059669",
              padding: "12px 32px",
              borderRadius: 10,
              fontWeight: 800,
              fontSize: 16,
              textDecoration: "none",
              boxShadow: "0 4px 14px rgba(0,0,0,0.1)",
            }}
          >
            Start Free Today 🚀
          </Link>
        </div>
      </section>

      <MarketingFooter lang="en" />
    </div>
  );
}
