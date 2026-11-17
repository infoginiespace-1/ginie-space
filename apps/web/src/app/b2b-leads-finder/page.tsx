import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import MarketingNav from "@/components/MarketingNav";
import MarketingFooter from "@/components/MarketingFooter";
import { SearchOutlined, WhatsAppOutlined, EnvironmentOutlined, StarFilled } from "@ant-design/icons";

export const metadata: Metadata = {
  title: "Hyperlocal B2B Leads Finder for Indian MSMEs | GinieSpace",
  description:
    "Find verified local B2B buyers and retailers in your city by pincode and category. View Google ratings, phone numbers and pitch directly on WhatsApp.",
  alternates: {
    canonical: "https://app.ginie.space/b2b-leads-finder",
    languages: {
      "en-IN": "https://app.ginie.space/b2b-leads-finder",
      "hi-IN": "https://app.ginie.space/hi/b2b-leads-finder",
      "x-default": "https://app.ginie.space/b2b-leads-finder",
    },
  },
  openGraph: {
    title: "Hyperlocal B2B Leads Finder for Indian MSMEs | GinieSpace",
    description: "Discover verified retail shop buyers on Google Maps. Get verified phone numbers, Google ratings, and send 1-click WhatsApp proposals.",
    url: "https://app.ginie.space/b2b-leads-finder",
    siteName: "GinieSpace",
    locale: "en_IN",
    type: "website",
    images: [{ url: "https://app.ginie.space/og-catalog.jpg", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Hyperlocal B2B Leads Discovery for Indian MSMEs | GinieSpace",
    description: "Connect with retail shops, pharmacies & restaurants across any Indian pincode. Send wholesale catalogs directly to WhatsApp.",
    images: ["https://app.ginie.space/og-catalog.jpg"],
  },
};

export default function B2bLeadsFinderPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", color: "#0f172a" }}>
      <MarketingNav currentPath="/b2b-leads-finder" lang="en" />

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
          🔍 HYPERLOCAL B2B DISCOVERY
        </span>
        <h1
          style={{
            fontSize: "clamp(2rem, 4vw, 3rem)",
            fontWeight: 800,
            lineHeight: 1.25,
            letterSpacing: "-0.02em",
            maxWidth: 940,
            margin: "0 auto 16px",
          }}
        >
          Hyperlocal B2B Leads Finder for Indian Wholesale &amp; MSME Suppliers
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
          Find active retail shops, pharmacies, restaurants, and local businesses in your city or pin code. Access verified Google Maps reviews, phone numbers, and pitch your wholesale catalog directly on WhatsApp.
        </p>

        <div style={{ display: "flex", justifyContent: "center", gap: 14, flexWrap: "wrap", marginBottom: 48 }}>
          <Link
            href="/signup"
            style={{
              padding: "12px 28px",
              background: "#25D366",
              color: "#fff",
              borderRadius: 10,
              fontWeight: 700,
              fontSize: 16,
              textDecoration: "none",
              boxShadow: "0 4px 14px rgba(37,211,102,0.35)",
            }}
          >
            Find Local B2B Leads Free (₹0) 🚀
          </Link>
          <Link
            href="/pricing"
            style={{
              padding: "12px 24px",
              background: "#fff",
              color: "#0f172a",
              border: "1px solid #cbd5e1",
              borderRadius: 10,
              fontWeight: 600,
              fontSize: 16,
              textDecoration: "none",
            }}
          >
            Explore PRO Lead Quotas
          </Link>
        </div>
      </section>

      {/* 3 Step Workflow */}
      <section style={{ background: "#ffffff", padding: "64px 20px", borderTop: "1px solid #e2e8f0", borderBottom: "1px solid #e2e8f0" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <h2 style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)", fontWeight: 800, color: "#0f172a", marginBottom: 12 }}>
              How Hyperlocal Lead Discovery Works
            </h2>
            <p style={{ color: "#64748b", fontSize: 15, maxWidth: 680, margin: "0 auto" }}>
              Reach out to real shop owners in your locality without expensive telemarketing lists or cold calls.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 28 }}>
            <div style={{ background: "#f8fafc", padding: 28, borderRadius: 16, border: "1px solid #e2e8f0" }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: "#ecfdf5", color: "#059669", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, marginBottom: 16 }}>
                <SearchOutlined />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>
                1. Search Any Trade &amp; Locality
              </h3>
              <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.6 }}>
                Type your target category, e.g. <i>"Kirana stores in Jaipur"</i>, <i>"Hardware shops in Surat"</i>, or <i>"Pharmacies in Patna 800001"</i>. GinieSpace scans verified Google Maps entities in real time.
              </p>
            </div>

            <div style={{ background: "#f8fafc", padding: 28, borderRadius: 16, border: "1px solid #e2e8f0" }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: "#eff6ff", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, marginBottom: 16 }}>
                <StarFilled style={{ color: "#f59e0b" }} />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>
                2. Review Ratings &amp; Phone Numbers
              </h3>
              <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.6 }}>
                Examine shop names, star ratings, total customer reviews, physical street address, and active mobile contact numbers. Save high-intent prospects straight into your GinieSpace CRM.
              </p>
            </div>

            <div style={{ background: "#f8fafc", padding: 28, borderRadius: 16, border: "1px solid #e2e8f0" }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: "#fef3c7", color: "#d97706", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, marginBottom: 16 }}>
                <WhatsAppOutlined style={{ color: "#25D366" }} />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>
                3. One-Click WhatsApp Proposal
              </h3>
              <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.6 }}>
                Tap the WhatsApp pitch button to open a personalized introduction with your digital catalog link attached. Retailers can immediately view your wholesale rates and submit purchase orders.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Quotas & Limits */}
      <section style={{ maxWidth: 1000, margin: "64px auto", padding: "0 20px" }}>
        <h2 style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)", fontWeight: 800, textAlign: "center", marginBottom: 36 }}>
          Transparent Lead Quotas For Every Business Size
        </h2>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
          <div style={{ background: "#ffffff", padding: 28, borderRadius: 16, border: "1px solid #e2e8f0" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", marginBottom: 8 }}>STARTER PLAN</div>
            <h3 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", marginBottom: 12 }}>Free Forever</h3>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10, fontSize: 14, color: "#475569" }}>
              <li>✅ 3 Local B2B Searches / day</li>
              <li>✅ 60 Verified Merchant Leads daily</li>
              <li>✅ Save up to 10 Leads in CRM</li>
              <li>✅ Direct WhatsApp pitch link</li>
            </ul>
          </div>

          <div style={{ background: "#ffffff", padding: 28, borderRadius: 16, border: "2px solid #059669", boxShadow: "0 8px 24px rgba(5,150,105,0.1)" }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: "#059669", marginBottom: 8 }}>PRO GROWTH PLAN</div>
            <h3 style={{ fontSize: 22, fontWeight: 800, color: "#059669", marginBottom: 12 }}>PRO (₹199 / mo)</h3>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10, fontSize: 14, color: "#334155" }}>
              <li>👑 50 Search Queries / month</li>
              <li>👑 1,000 Verified High-Intent B2B Leads</li>
              <li>👑 Store up to 10,000 Leads in CRM</li>
              <li>👑 Multi-city &amp; cross-state discovery</li>
              <li>👑 Priority phone and WhatsApp support</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Internal Linking & Pillar Exploration */}
      <section style={{ background: "#ffffff", padding: "56px 20px", borderTop: "1px solid #e2e8f0" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", marginBottom: 20 }}>
            Connect With Wholesale &amp; Retail Tools
          </h2>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 12 }}>
            <Link href="/whatsapp-catalog-maker" style={{ padding: "8px 16px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: 8, color: "#0f172a", fontWeight: 600, textDecoration: "none", fontSize: 13 }}>
              WhatsApp Catalog Maker ➔
            </Link>
            <Link href="/upi-billing-software" style={{ padding: "8px 16px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: 8, color: "#0f172a", fontWeight: 600, textDecoration: "none", fontSize: 13 }}>
              0% UPI Billing Software ➔
            </Link>
            <Link href="/retail-kirana-store" style={{ padding: "8px 16px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: 8, color: "#0f172a", fontWeight: 600, textDecoration: "none", fontSize: 13 }}>
              Retail &amp; Kirana Stores ➔
            </Link>
            <Link href="/wholesale-distributors" style={{ padding: "8px 16px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: 8, color: "#0f172a", fontWeight: 600, textDecoration: "none", fontSize: 13 }}>
              Wholesale Distributors &amp; Bulk MOQs ➔
            </Link>
            <Link href="/pricing" style={{ padding: "8px 16px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: 8, color: "#0f172a", fontWeight: 600, textDecoration: "none", fontSize: 13 }}>
              Pricing Plans (₹0 Free &amp; ₹199 PRO) ➔
            </Link>
          </div>
        </div>
      </section>

      {/* Pre-Footer CTA */}
      <section style={{ maxWidth: 960, margin: "48px auto", padding: "0 20px" }}>
        <div style={{ background: "linear-gradient(135deg, #059669 0%, #10b981 100%)", borderRadius: 20, padding: "40px 24px", textAlign: "center", color: "#fff", boxShadow: "0 16px 40px rgba(5,150,105,0.25)" }}>
          <h2 style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)", fontWeight: 800, margin: "0 0 12px", color: "#fff" }}>
            Expand Your Dealer Network Across Your City
          </h2>
          <p style={{ color: "#ecfdf5", fontSize: 15, maxWidth: 600, margin: "0 auto 24px" }}>
            Find active retail buyers in minutes. Start free without credit card.
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
            Start Finding Leads (₹0) 🚀
          </Link>
        </div>
      </section>

      <MarketingFooter lang="en" />
    </div>
  );
}
