import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import MarketingNav from "@/components/MarketingNav";
import MarketingFooter from "@/components/MarketingFooter";
import { CheckCircleFilled, BankOutlined, QrcodeOutlined, SafetyCertificateOutlined, ThunderboltOutlined } from "@ant-design/icons";

export const metadata: Metadata = {
  title: "0% Commission Direct Bank UPI Billing Software | GinieSpace",
  description:
    "Accept customer payments directly into your bank account with your personal UPI QR code. 0% gateway commission, instant WhatsApp invoice & T+0 credit.",
  alternates: {
    canonical: "https://app.ginie.space/upi-billing-software",
    languages: {
      "en-IN": "https://app.ginie.space/upi-billing-software",
      "hi-IN": "https://app.ginie.space/hi/upi-billing-software",
      "x-default": "https://app.ginie.space/upi-billing-software",
    },
  },
  openGraph: {
    title: "0% Commission Direct Bank UPI Billing Software | GinieSpace",
    description: "Accept 100% direct bank UPI payments from GPay, PhonePe, and Paytm with zero commission. Instant WhatsApp receipts and T+0 settlement.",
    url: "https://app.ginie.space/upi-billing-software",
    siteName: "GinieSpace",
    locale: "en_IN",
    type: "website",
    images: [{ url: "https://app.ginie.space/og-catalog.jpg", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "0% Commission Direct Bank UPI Billing for Indian MSMEs | GinieSpace",
    description: "Keep 100% of your earnings. No 2-3% payment gateway deductions. Real-time bank credit and automated WhatsApp invoice billing.",
    images: ["https://app.ginie.space/og-catalog.jpg"],
  },
};

export default function UpiBillingSoftwarePage() {
  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", color: "#0f172a" }}>
      <MarketingNav currentPath="/upi-billing-software" lang="en" />

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
          💰 ZERO COMMISSIONS • DIRECT TO BANK
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
          0% Commission Direct Bank UPI Billing Software for Indian Shops
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
          Stop losing 2% to 3% of your hard-earned revenue to payment gateways. With GinieSpace, every rupee paid via GPay, PhonePe, Paytm, or BHIM lands directly in your bank account with instant automated WhatsApp receipts.
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
            Start Free UPI Billing (₹0) 🚀
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
            Calculate Your Savings
          </Link>
        </div>
      </section>

      {/* How Direct UPI Billing Works */}
      <section style={{ background: "#ffffff", padding: "64px 20px", borderTop: "1px solid #e2e8f0", borderBottom: "1px solid #e2e8f0" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <h2 style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)", fontWeight: 800, color: "#0f172a", marginBottom: 12 }}>
              How Direct Peer-to-Merchant UPI Settlement Works
            </h2>
            <p style={{ color: "#64748b", fontSize: 15, maxWidth: 680, margin: "0 auto" }}>
              A transparent, peer-to-peer settlement architecture that removes intermediaries and delays.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 28 }}>
            <div style={{ background: "#f8fafc", padding: 28, borderRadius: 16, border: "1px solid #e2e8f0" }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: "#ecfdf5", color: "#059669", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, marginBottom: 16 }}>
                <QrcodeOutlined />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>
                1. Your Own Personal UPI QR
              </h3>
              <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.6 }}>
                Configure your existing bank UPI ID (e.g. <code>merchant@okaxis</code> or <code>dukaan@icici</code>). Each digital invoice displays a dynamic QR with the exact order total encoded.
              </p>
            </div>

            <div style={{ background: "#f8fafc", padding: 28, borderRadius: 16, border: "1px solid #e2e8f0" }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: "#eff6ff", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, marginBottom: 16 }}>
                <BankOutlined />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>
                2. Instant T+0 Direct Credit
              </h3>
              <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.6 }}>
                Payment moves directly from the customer's bank to your bank. GinieSpace does not hold your funds in an escrow account. There are no 3-day weekend settlement delays.
              </p>
            </div>

            <div style={{ background: "#f8fafc", padding: 28, borderRadius: 16, border: "1px solid #e2e8f0" }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: "#fef3c7", color: "#d97706", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, marginBottom: 16 }}>
                <ThunderboltOutlined />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>
                3. Automated WhatsApp Receipt
              </h3>
              <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.6 }}>
                Once verified with the 12-digit bank UTR reference, an instant GST/itemized invoice is dispatched to the customer's WhatsApp number and recorded in your merchant dashboard.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Savings Breakdown */}
      <section style={{ maxWidth: 1000, margin: "64px auto", padding: "0 20px" }}>
        <h2 style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)", fontWeight: 800, textAlign: "center", marginBottom: 16 }}>
          How Much Will You Save Every Year?
        </h2>
        <p style={{ color: "#64748b", fontSize: 15, textAlign: "center", maxWidth: 640, margin: "0 auto 36px" }}>
          Compare standard 2.5% payment gateway costs versus GinieSpace 0% direct UPI settlement.
        </p>

        <div style={{ overflowX: "auto", background: "#ffffff", borderRadius: 16, border: "1px solid #e2e8f0", boxShadow: "0 4px 16px rgba(0,0,0,0.03)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 14 }}>
            <thead>
              <tr style={{ background: "#f1f5f9", borderBottom: "1px solid #e2e8f0" }}>
                <th style={{ padding: "16px 20px", fontWeight: 700, color: "#0f172a" }}>Monthly Sales</th>
                <th style={{ padding: "16px 20px", fontWeight: 700, color: "#ef4444" }}>Standard 2.5% Fee</th>
                <th style={{ padding: "16px 20px", fontWeight: 700, color: "#059669" }}>GinieSpace Fee</th>
                <th style={{ padding: "16px 20px", fontWeight: 700, color: "#059669" }}>Annual Savings</th>
              </tr>
            </thead>
            <tbody>
              {[
                { sales: "₹1,00,000 / mo", standard: "₹2,500 / mo", ginie: "₹0 / mo (100% Free)", savings: "₹30,000 / year" },
                { sales: "₹2,50,000 / mo", standard: "₹6,250 / mo", ginie: "₹0 / mo (100% Free)", savings: "₹75,000 / year" },
                { sales: "₹5,00,000 / mo", standard: "₹12,500 / mo", ginie: "₹0 / mo (100% Free)", savings: "₹1,50,000 / year" },
                { sales: "₹10,00,000 / mo", standard: "₹25,000 / mo", ginie: "₹0 / mo (100% Free)", savings: "₹3,00,000 / year" },
              ].map((row, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "16px 20px", fontWeight: 600 }}>{row.sales}</td>
                  <td style={{ padding: "16px 20px", color: "#ef4444" }}>{row.standard}</td>
                  <td style={{ padding: "16px 20px", color: "#059669", fontWeight: 600 }}>{row.ginie}</td>
                  <td style={{ padding: "16px 20px", color: "#059669", fontWeight: 700 }}>{row.savings}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Internal Linking & Pillar Exploration */}
      <section style={{ background: "#ffffff", padding: "56px 20px", borderTop: "1px solid #e2e8f0" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", marginBottom: 20 }}>
            Explore Related GinieSpace Solutions
          </h2>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 12 }}>
            <Link href="/whatsapp-catalog-maker" style={{ padding: "8px 16px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: 8, color: "#0f172a", fontWeight: 600, textDecoration: "none", fontSize: 13 }}>
              WhatsApp Catalog Maker ➔
            </Link>
            <Link href="/b2b-leads-finder" style={{ padding: "8px 16px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: 8, color: "#0f172a", fontWeight: 600, textDecoration: "none", fontSize: 13 }}>
              B2B Local Leads Discovery ➔
            </Link>
            <Link href="/retail-kirana-store" style={{ padding: "8px 16px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: 8, color: "#0f172a", fontWeight: 600, textDecoration: "none", fontSize: 13 }}>
              Retail &amp; Kirana Stores ➔
            </Link>
            <Link href="/wholesale-distributors" style={{ padding: "8px 16px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: 8, color: "#0f172a", fontWeight: 600, textDecoration: "none", fontSize: 13 }}>
              Wholesale &amp; Bulk MOQs ➔
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
            Start Accepting 0% Fee UPI Payments Today
          </h2>
          <p style={{ color: "#ecfdf5", fontSize: 15, maxWidth: 600, margin: "0 auto 24px" }}>
            Set up your direct UPI QR code in under 60 seconds. Permanent free starter tier.
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
