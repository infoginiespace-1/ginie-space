import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import MarketingNav from "@/components/MarketingNav";
import MarketingFooter from "@/components/MarketingFooter";
import { ThunderboltOutlined, CheckCircleFilled, SearchOutlined, TeamOutlined } from "@ant-design/icons";

export const metadata: Metadata = {
  title: "B2B Wholesale & Distributor WhatsApp Software | GinieSpace",
  description:
    "Automate wholesale order taking, carton pricing, and Minimum Order Quantity (MOQ). Find new retail shop dealers and collect direct bank payments.",
  alternates: {
    canonical: "https://app.ginie.space/wholesale-distributors",
    languages: {
      "en-IN": "https://app.ginie.space/wholesale-distributors",
      "hi-IN": "https://app.ginie.space/hi/wholesale-distributors",
      "x-default": "https://app.ginie.space/wholesale-distributors",
    },
  },
  openGraph: {
    title: "B2B Wholesale & Distributor WhatsApp Software | GinieSpace",
    description: "Automate wholesale orders with MOQ enforcement, carton pricing, and 0% gateway commission. Expand your dealer network on Google Maps.",
    url: "https://app.ginie.space/wholesale-distributors",
    siteName: "GinieSpace",
    locale: "en_IN",
    type: "website",
    images: [{ url: "https://app.ginie.space/og-catalog.jpg", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Wholesale & Stockist Software on WhatsApp | GinieSpace",
    description: "Carton units, MOQ rules, direct bank UPI billing, and automated wholesale order slips for Indian distributors.",
    images: ["https://app.ginie.space/og-catalog.jpg"],
  },
};

export default function WholesaleDistributorsPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", color: "#0f172a" }}>
      <MarketingNav currentPath="/wholesale-distributors" lang="en" />

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
          📦 WHOLESALE &amp; DISTRIBUTORS
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
          WhatsApp Software for B2B Wholesale Distributors &amp; Stockists
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
          Stop spending hours taking messy handwritten orders over phone calls. Manage carton pricing, enforce Minimum Order Quantities (MOQ), broadcast fresh inventory arrivals, and discover new retail shop buyers across your district.
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
            Start Free Wholesale Workspace (₹0) 🚀
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
            View 100% Free Plan (₹0)
          </Link>
        </div>
      </section>

      {/* Wholesale Capabilities */}
      <section style={{ background: "#ffffff", padding: "64px 20px", borderTop: "1px solid #e2e8f0", borderBottom: "1px solid #e2e8f0" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <h2 style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)", fontWeight: 800, color: "#0f172a", marginBottom: 12 }}>
              Engineered for High-Volume B2B Distribution
            </h2>
            <p style={{ color: "#64748b", fontSize: 15, maxWidth: 680, margin: "0 auto" }}>
              Purpose-built tools to simplify complex wholesale ordering and large ledger accounts.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 28 }}>
            <div style={{ background: "#f8fafc", padding: 28, borderRadius: 16, border: "1px solid #e2e8f0" }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>
                📦 Minimum Order Quantities (MOQ)
              </h3>
              <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.6 }}>
                Enforce minimum order quantities per item (e.g. minimum 5 cartons, 24 pieces, or 10 boxes). Prevent retail consumers from placing single-item orders on your wholesale portal.
              </p>
            </div>

            <div style={{ background: "#f8fafc", padding: 28, borderRadius: 16, border: "1px solid #e2e8f0" }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>
                📢 1-Click Dealer Broadcasts
              </h3>
              <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.6 }}>
                Received fresh stock or seasonal goods? Broadcast high-converting announcements with direct order links to your verified dealer list on WhatsApp without getting flagged.
              </p>
            </div>

            <div style={{ background: "#f8fafc", padding: 28, borderRadius: 16, border: "1px solid #e2e8f0" }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>
                💳 0% Cut on Large Invoice Values
              </h3>
              <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.6 }}>
                When dealers pay ₹25,000 to ₹1,00,000 per order, standard payment gateways deduct ₹600 to ₹2,500 per transaction. GinieSpace direct bank settlements cost ₹0 gateway fee.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Internal Linking & Pillar Exploration */}
      <section style={{ background: "#ffffff", padding: "56px 20px", borderTop: "1px solid #e2e8f0" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", marginBottom: 20 }}>
            Complementary B2B Software Tools
          </h2>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 12 }}>
            <Link href="/b2b-leads-finder" style={{ padding: "8px 16px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: 8, color: "#0f172a", fontWeight: 600, textDecoration: "none", fontSize: 13 }}>
              B2B Local Leads Discovery ➔
            </Link>
            <Link href="/whatsapp-catalog-maker" style={{ padding: "8px 16px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: 8, color: "#0f172a", fontWeight: 600, textDecoration: "none", fontSize: 13 }}>
              WhatsApp Catalog Maker ➔
            </Link>
            <Link href="/upi-billing-software" style={{ padding: "8px 16px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: 8, color: "#0f172a", fontWeight: 600, textDecoration: "none", fontSize: 13 }}>
              0% UPI Billing Software ➔
            </Link>
            <Link href="/retail-kirana-store" style={{ padding: "8px 16px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: 8, color: "#0f172a", fontWeight: 600, textDecoration: "none", fontSize: 13 }}>
              Retail &amp; Kirana Stores ➔
            </Link>
            <Link href="/pricing" style={{ padding: "8px 16px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: 8, color: "#0f172a", fontWeight: 600, textDecoration: "none", fontSize: 13 }}>
              100% Free Plan (₹0 Forever) ➔
            </Link>
          </div>
        </div>
      </section>

      {/* Pre-Footer CTA */}
      <section style={{ maxWidth: 960, margin: "48px auto", padding: "0 20px" }}>
        <div style={{ background: "linear-gradient(135deg, #059669 0%, #10b981 100%)", borderRadius: 20, padding: "40px 24px", textAlign: "center", color: "#fff", boxShadow: "0 16px 40px rgba(5,150,105,0.25)" }}>
          <h2 style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)", fontWeight: 800, margin: "0 0 12px", color: "#fff" }}>
            Automate Your Wholesale Distribution Today
          </h2>
          <p style={{ color: "#ecfdf5", fontSize: 15, maxWidth: 600, margin: "0 auto 24px" }}>
            Share your digital wholesale rate list with MOQ rules and collect direct bank payments.
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
            Create Free Account 🚀
          </Link>
        </div>
      </section>

      <MarketingFooter lang="en" />
    </div>
  );
}
