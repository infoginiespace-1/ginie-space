import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import MarketingNav from "@/components/MarketingNav";
import MarketingFooter from "@/components/MarketingFooter";
import { CheckCircleFilled, ArrowRightOutlined, ThunderboltOutlined, SafetyCertificateOutlined, ShopOutlined, TeamOutlined, QrcodeOutlined, MessageOutlined } from "@ant-design/icons";

export const metadata: Metadata = {
  title: "100% Free Forever - ₹0 Platform Fee & 0% Commission | GinieSpace",
  description:
    "GinieSpace is 100% Free Forever for all Indian merchants. Zero monthly subscription, 0% UPI gateway commission, unlimited product catalog, and automated WhatsApp billing.",
  alternates: {
    canonical: "https://app.ginie.space/pricing",
    languages: {
      "en-IN": "https://app.ginie.space/pricing",
      "hi-IN": "https://app.ginie.space/hi/pricing",
      "x-default": "https://app.ginie.space/pricing",
    },
  },
  openGraph: {
    title: "100% Free Forever - ₹0 Platform Fee & 0% Commission | GinieSpace",
    description:
      "GinieSpace is 100% Free Forever for all merchants. Zero subscription fees, 0% payment gateway deductions, unlimited catalog, and direct UPI settlements.",
    url: "https://app.ginie.space/pricing",
    siteName: "GinieSpace",
    locale: "en_IN",
    type: "website",
    images: [{ url: "https://app.ginie.space/og-catalog.jpg", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "GinieSpace is 100% Free Forever: ₹0 Platform Fee & 0% Commission",
    description: "Zero gateway fees. 100% direct bank UPI settlements. Built for Indian Kiranas, wholesalers & service providers.",
    images: ["https://app.ginie.space/og-catalog.jpg"],
  },
};

export default function PricingPage() {
  const freeFeatures = [
    { title: "Unlimited Catalog Items", desc: "Add unlimited products, variants, prices & stock without arbitrary limits." },
    { title: "0% UPI Payment Commission", desc: "Customer money goes directly into your bank account. No 2-3% payment gateway cuts." },
    { title: "24/7 Digital Storefront", desc: "Shareable public store link (app.ginie.space/shop/your-store) with cart checkout." },
    { title: "Automated WhatsApp Orders", desc: "Receive customer orders with item details, address & payment proof on WhatsApp." },
    { title: "Multi-Staff Accounts", desc: "Add multiple staff members with customizable role-based permissions." },
    { title: "Customer Khata & Ledgers", desc: "Track credit balances, pending dues, and send automated WhatsApp reminders." },
    { title: "Thermal POS & A4 Invoices", desc: "Generate professional GST tax invoices and 80mm thermal receipts in seconds." },
    { title: "Soundbox Audio Alerts", desc: "In-app Hindi voice announcements for new orders and payments at your checkout counter." },
  ];

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
          🎁 100% FREE FOREVER FOR ALL MERCHANTS
        </span>
        <h1
          style={{
            fontSize: "clamp(2rem, 4vw, 3.2rem)",
            fontWeight: 800,
            lineHeight: 1.2,
            letterSpacing: "-0.02em",
            maxWidth: 900,
            margin: "0 auto 16px",
          }}
        >
          Zero Subscriptions. Zero Commissions. Always Free.
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
          GinieSpace is on a mission to empower Indian retail dukandars, wholesalers, and service businesses with <strong>₹0 platform fees</strong>, <strong>0% payment deductions</strong>, and <strong>100% direct bank UPI settlements</strong>.
        </p>

        {/* Hero Card */}
        <div
          style={{
            maxWidth: 800,
            margin: "0 auto 64px",
            background: "#ffffff",
            borderRadius: 24,
            padding: "40px 32px",
            boxShadow: "0 12px 40px rgba(16, 185, 129, 0.12)",
            border: "2px solid #bbf7d0",
            textAlign: "center",
          }}
        >
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#f0fdf4", padding: "6px 16px", borderRadius: 999, color: "#15803d", fontWeight: 700, fontSize: 13, marginBottom: 20 }}>
            <SafetyCertificateOutlined /> LIFETIME FREE PLAN
          </div>
          <div style={{ fontSize: "clamp(3rem, 6vw, 4.5rem)", fontWeight: 900, color: "#0f172a", lineHeight: 1, marginBottom: 8 }}>
            ₹0 <span style={{ fontSize: "1.2rem", fontWeight: 500, color: "#64748b" }}>/ forever</span>
          </div>
          <p style={{ color: "#64748b", fontSize: 15, maxWidth: 500, margin: "0 auto 28px" }}>
            No credit card required. No trial expiration. Complete unrestricted access for your store.
          </p>

          <Link
            href="/signup"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              background: "#25D366",
              color: "#ffffff",
              padding: "16px 36px",
              borderRadius: 12,
              fontWeight: 800,
              fontSize: 16,
              textDecoration: "none",
              boxShadow: "0 8px 24px rgba(37, 211, 102, 0.35)",
            }}
          >
            Create Your Free Store Now <ArrowRightOutlined />
          </Link>
        </div>

        {/* Feature Grid */}
        <div style={{ maxWidth: 1000, margin: "0 auto 64px", textAlign: "left" }}>
          <h2 style={{ fontSize: 24, fontWeight: 800, textAlign: "center", marginBottom: 36 }}>
            Everything Included — 100% Unlocked
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
            {freeFeatures.map((f, i) => (
              <div key={i} style={{ background: "#fff", padding: "20px 24px", borderRadius: 16, border: "1px solid #e2e8f0" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <CheckCircleFilled style={{ color: "#10b981", fontSize: 18 }} />
                  <span style={{ fontWeight: 700, fontSize: 15, color: "#0f172a" }}>{f.title}</span>
                </div>
                <p style={{ margin: 0, fontSize: 13, color: "#64748b", lineHeight: 1.5 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Why Free Section */}
        <div style={{ maxWidth: 840, margin: "0 auto 64px", background: "#f1f5f9", borderRadius: 20, padding: "36px 32px", textAlign: "left" }}>
          <h3 style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", marginBottom: 12 }}>
            💡 Why is GinieSpace 100% Free?
          </h3>
          <p style={{ fontSize: 14, color: "#475569", lineHeight: 1.7, marginBottom: 16 }}>
            Indian retail and wholesale merchants already bear high overheads, inventory costs, and marketplace commissions (20-30% on food/grocery aggregators). We believe every merchant should own their direct customer relationships and bank settlements without paying middleman fees or heavy software subscriptions.
          </p>
          <p style={{ fontSize: 14, color: "#475569", lineHeight: 1.7, margin: 0 }}>
            GinieSpace provides sovereign, peer-to-peer commerce infrastructure directly over WhatsApp and UPI, keeping Indian merchants competitive and independent.
          </p>
        </div>
      </section>

      <MarketingFooter lang="en" />
    </div>
  );
}
