import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import MarketingNav from "@/components/MarketingNav";
import MarketingFooter from "@/components/MarketingFooter";
import { ShopOutlined, CheckCircleFilled, ThunderboltOutlined, CarOutlined } from "@ant-design/icons";

export const metadata: Metadata = {
  title: "WhatsApp Store & Billing for Retail & Kirana | GinieSpace",
  description:
    "Empower your local Kirana & retail store with a 24/7 online WhatsApp catalog, direct UPI payments, item variants and instant home delivery receipts.",
  alternates: {
    canonical: "https://app.ginie.space/retail-kirana-store",
    languages: {
      "en-IN": "https://app.ginie.space/retail-kirana-store",
      "hi-IN": "https://app.ginie.space/hi/retail-kirana-store",
      "x-default": "https://app.ginie.space/retail-kirana-store",
    },
  },
  openGraph: {
    title: "WhatsApp Store & Billing for Retail & Kirana | GinieSpace",
    description: "Compete with quick-commerce apps. Give your neighborhood customers a 24/7 WhatsApp ordering link with 0% commission direct UPI payments.",
    url: "https://app.ginie.space/retail-kirana-store",
    siteName: "GinieSpace",
    locale: "en_IN",
    type: "website",
    images: [{ url: "https://app.ginie.space/og-catalog.jpg", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "WhatsApp Store Software for Indian Kirana & Retail | GinieSpace",
    description: "Launch your local dukaan catalog in 60 seconds. Direct bank payments, loose grocery units, and automated delivery receipts.",
    images: ["https://app.ginie.space/og-catalog.jpg"],
  },
};

export default function RetailKiranaStorePage() {
  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", color: "#0f172a" }}>
      <MarketingNav currentPath="/retail-kirana-store" lang="en" />

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
          🏪 TAILORED FOR LOCAL DUKAANS &amp; KIRANA
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
          WhatsApp Store &amp; Direct UPI Billing for Indian Kirana &amp; Retail Stores
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
          Win back neighborhood customers from 10-minute grocery delivery apps. Give your regular shoppers an interactive, 24/7 digital order link on WhatsApp with loose grocery units, automated delivery slips, and 0% commission direct UPI payments.
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
            Launch Your Online Dukaan (₹0) 🚀
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
            View Pricing (₹0 vs ₹199)
          </Link>
        </div>
      </section>

      {/* Kirana Specific Features */}
      <section style={{ background: "#ffffff", padding: "64px 20px", borderTop: "1px solid #e2e8f0", borderBottom: "1px solid #e2e8f0" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <h2 style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)", fontWeight: 800, color: "#0f172a", marginBottom: 12 }}>
              Built Specifically for the Daily Realities of Indian Retail
            </h2>
            <p style={{ color: "#64748b", fontSize: 15, maxWidth: 680, margin: "0 auto" }}>
              Everything a neighbourhood grocery, dairy, bakery, or general store owner needs to run faster operations.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 28 }}>
            <div style={{ background: "#f8fafc", padding: 28, borderRadius: 16, border: "1px solid #e2e8f0" }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>
                ⚖️ Loose Units &amp; Packets
              </h3>
              <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.6 }}>
                Support fractional weights such as 250g, 500g, 1kg, 5kg bags, or loose oil and flour variants. Customers select the exact unit they want without typing confusion.
              </p>
            </div>

            <div style={{ background: "#f8fafc", padding: 28, borderRadius: 16, border: "1px solid #e2e8f0" }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>
                🛵 Home Delivery &amp; Store Pickup
              </h3>
              <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.6 }}>
                Allow customers to choose between instant home doorstep delivery or counter takeaway pickup. Set minimum order values (e.g. Free Delivery above ₹499).
              </p>
            </div>

            <div style={{ background: "#f8fafc", padding: 28, borderRadius: 16, border: "1px solid #e2e8f0" }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>
                🧾 Thermal Bill Printing &amp; Staff Access
              </h3>
              <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.6 }}>
                Print standard 58mm / 80mm thermal bills for delivery boys. Add separate staff operator seats for billing boys without sharing your main WhatsApp login.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Internal Linking & Pillar Exploration */}
      <section style={{ background: "#ffffff", padding: "56px 20px", borderTop: "1px solid #e2e8f0" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", marginBottom: 20 }}>
            Explore More GinieSpace Software Solutions
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
            <Link href="/wholesale-distributors" style={{ padding: "8px 16px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: 8, color: "#0f172a", fontWeight: 600, textDecoration: "none", fontSize: 13 }}>
              Wholesale Distributors &amp; Bulk MOQs ➔
            </Link>
            <Link href="/pricing" style={{ padding: "8px 16px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: 8, color: "#0f172a", fontWeight: 600, textDecoration: "none", fontSize: 13 }}>
              Pricing &amp; Plans (₹0 Free &amp; ₹199 PRO) ➔
            </Link>
          </div>
        </div>
      </section>

      {/* Pre-Footer CTA */}
      <section style={{ maxWidth: 960, margin: "48px auto", padding: "0 20px" }}>
        <div style={{ background: "linear-gradient(135deg, #059669 0%, #10b981 100%)", borderRadius: 20, padding: "40px 24px", textAlign: "center", color: "#fff", boxShadow: "0 16px 40px rgba(5,150,105,0.25)" }}>
          <h2 style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)", fontWeight: 800, margin: "0 0 12px", color: "#fff" }}>
            Make Your Kirana Store Smarter Today
          </h2>
          <p style={{ color: "#ecfdf5", fontSize: 15, maxWidth: 600, margin: "0 auto 24px" }}>
            Give your regular customers a seamless digital shopping experience on WhatsApp.
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
            Create Free Dukaan Account (₹0) 🚀
          </Link>
        </div>
      </section>

      <MarketingFooter lang="en" />
    </div>
  );
}
