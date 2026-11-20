import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import MarketingNav from "@/components/MarketingNav";
import MarketingFooter from "@/components/MarketingFooter";
import { CheckCircleFilled, ArrowRightOutlined, ShopOutlined, QrcodeOutlined, ThunderboltOutlined, MobileOutlined } from "@ant-design/icons";

export const metadata: Metadata = {
  title: "WhatsApp Catalog Maker India - Digital Store | GinieSpace",
  description:
    "Create your free digital WhatsApp store catalog in 60 seconds. Share product links, take direct orders and receive payments via UPI with 0% commission.",
  alternates: {
    canonical: "https://app.ginie.space/whatsapp-catalog-maker",
    languages: {
      "en-IN": "https://app.ginie.space/whatsapp-catalog-maker",
      "hi-IN": "https://app.ginie.space/hi/whatsapp-catalog-maker",
      "x-default": "https://app.ginie.space/whatsapp-catalog-maker",
    },
  },
  openGraph: {
    title: "WhatsApp Catalog Maker India - Digital Store | GinieSpace",
    description: "Launch your branded digital WhatsApp store in 60 seconds. Share links on WhatsApp Bio & Instagram, accept direct UPI payments with 0% fee.",
    url: "https://app.ginie.space/whatsapp-catalog-maker",
    siteName: "GinieSpace",
    locale: "en_IN",
    type: "website",
    images: [{ url: "https://app.ginie.space/og-catalog.jpg", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Free WhatsApp Catalog Maker for Indian Businesses | GinieSpace",
    description: "Replace messy PDF rate lists with an interactive mobile storefront. Direct bank settlements & instant WhatsApp invoices.",
    images: ["https://app.ginie.space/og-catalog.jpg"],
  },
};

export default function WhatsAppCatalogMakerPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", color: "#0f172a" }}>
      <MarketingNav currentPath="/whatsapp-catalog-maker" lang="en" />

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
          ⚡ FAST DIGITAL STOREFRONTS
        </span>
        <h1
          style={{
            fontSize: "clamp(2rem, 4vw, 3rem)",
            fontWeight: 800,
            lineHeight: 1.25,
            letterSpacing: "-0.02em",
            maxWidth: 920,
            margin: "0 auto 16px",
          }}
        >
          Free WhatsApp Catalog Maker for Indian Shops &amp; Online Dukaans
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
          Transform your WhatsApp into an interactive, high-speed mobile storefront. Replace outdated PDF files and messy photo dumps with a sleek <code>/shop/your-dukaan</code> link that lets customers browse, select items, and pay instantly via UPI.
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
            Create Your Free Storefront 🚀
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
            View Free vs PRO Plans
          </Link>
        </div>
      </section>

      {/* How It Works */}
      <section style={{ background: "#ffffff", padding: "64px 20px", borderTop: "1px solid #e2e8f0", borderBottom: "1px solid #e2e8f0" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <h2 style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)", fontWeight: 800, color: "#0f172a", marginBottom: 12 }}>
              How WhatsApp Catalog Maker Works in 3 Simple Steps
            </h2>
            <p style={{ color: "#64748b", fontSize: 15, maxWidth: 680, margin: "0 auto" }}>
              No coding, no technical app store approvals, and no monthly hosting costs. Your catalog is live in under 60 seconds.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 28 }}>
            <div style={{ background: "#f8fafc", padding: 28, borderRadius: 16, border: "1px solid #e2e8f0" }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: "#ecfdf5", color: "#059669", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, marginBottom: 16 }}>
                1
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>
                Add Products &amp; Pricing
              </h3>
              <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.6 }}>
                Upload photos, set unit prices, discounts, and item specifications (e.g., kg, pieces, packs, or sizes). Manage in-stock and out-of-stock switches with one tap.
              </p>
            </div>

            <div style={{ background: "#f8fafc", padding: 28, borderRadius: 16, border: "1px solid #e2e8f0" }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: "#eff6ff", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, marginBottom: 16 }}>
                2
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>
                Share Your Unique Store Link
              </h3>
              <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.6 }}>
                Share <code>app.ginie.space/shop/your-dukaan</code> in your WhatsApp bio, Instagram profile, Google Business profile, and print it as a table QR standee.
              </p>
            </div>

            <div style={{ background: "#f8fafc", padding: 28, borderRadius: 16, border: "1px solid #e2e8f0" }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: "#fef3c7", color: "#d97706", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, marginBottom: 16 }}>
                3
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>
                Receive Automated WhatsApp Orders
              </h3>
              <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.6 }}>
                When customers add items to their digital cart and checkout, an itemized invoice is generated automatically and delivered to your merchant inbox and the customer's WhatsApp.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Deep Dive */}
      <section style={{ maxWidth: 1000, margin: "64px auto", padding: "0 20px" }}>
        <h2 style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)", fontWeight: 800, textAlign: "center", marginBottom: 36 }}>
          Why Indian MSMEs Choose GinieSpace Over PDF Catalogs
        </h2>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
          <div style={{ background: "#ffffff", padding: 24, borderRadius: 14, border: "1px solid #e2e8f0" }}>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: "#059669", marginBottom: 8 }}>
              ⚡ Lightning Fast Mobile Experience
            </h3>
            <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.6, margin: 0 }}>
              Heavy PDF catalogs take 30–60 seconds to download and consume customers' mobile data. GinieSpace mobile catalogs load in under 1 second on any 4G/5G connection.
            </p>
          </div>

          <div style={{ background: "#ffffff", padding: 24, borderRadius: 14, border: "1px solid #e2e8f0" }}>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: "#059669", marginBottom: 8 }}>
              🔄 Real-Time Price &amp; Stock Sync
            </h3>
            <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.6, margin: 0 }}>
              Changed an item's wholesale rate or ran out of stock? Update it once in your GinieSpace control panel and the live catalog reflects the change immediately.
            </p>
          </div>

          <div style={{ background: "#ffffff", padding: 24, borderRadius: 14, border: "1px solid #e2e8f0" }}>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: "#059669", marginBottom: 8 }}>
              💳 Integrated 0% Commission UPI QR
            </h3>
            <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.6, margin: 0 }}>
              Unlike third-party delivery aggregators that charge 15% to 30% commission, GinieSpace displays your own UPI QR on checkout, sending 100% of the funds straight to your bank account.
            </p>
          </div>

          <div style={{ background: "#ffffff", padding: 24, borderRadius: 14, border: "1px solid #e2e8f0" }}>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: "#059669", marginBottom: 8 }}>
              📱 No App Download Required For Customers
            </h3>
            <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.6, margin: 0 }}>
              Customers don't need to install any heavy Android or iOS app. They tap your link, browse within WhatsApp or their browser, and complete the order friction-free.
            </p>
          </div>
        </div>
      </section>

      {/* Internal Linking & Pillar Exploration */}
      <section style={{ background: "#ffffff", padding: "56px 20px", borderTop: "1px solid #e2e8f0" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", marginBottom: 20 }}>
            Complementary Commerce Software Modules
          </h2>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 12 }}>
            <Link href="/upi-billing-software" style={{ padding: "8px 16px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: 8, color: "#0f172a", fontWeight: 600, textDecoration: "none", fontSize: 13 }}>
              0% UPI Billing Software ➔
            </Link>
            <Link href="/b2b-leads-finder" style={{ padding: "8px 16px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: 8, color: "#0f172a", fontWeight: 600, textDecoration: "none", fontSize: 13 }}>
              B2B Local Leads Discovery ➔
            </Link>
            <Link href="/retail-kirana-store" style={{ padding: "8px 16px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: 8, color: "#0f172a", fontWeight: 600, textDecoration: "none", fontSize: 13 }}>
              Retail &amp; Kirana Dukaans ➔
            </Link>
            <Link href="/wholesale-distributors" style={{ padding: "8px 16px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: 8, color: "#0f172a", fontWeight: 600, textDecoration: "none", fontSize: 13 }}>
              Wholesale Distributors &amp; Bulk MOQs ➔
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
            Launch Your Online WhatsApp Storefront Right Now
          </h2>
          <p style={{ color: "#ecfdf5", fontSize: 15, maxWidth: 600, margin: "0 auto 24px" }}>
            Join hundreds of verified Indian shops managing orders on WhatsApp with 0% gateway commission.
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
            Start Free (₹0 Forever) 🚀
          </Link>
        </div>
      </section>

      <MarketingFooter lang="en" />
    </div>
  );
}
