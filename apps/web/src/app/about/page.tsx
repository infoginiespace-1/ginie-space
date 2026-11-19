import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import MarketingNav from "@/components/MarketingNav";
import MarketingFooter from "@/components/MarketingFooter";
import {
  SafetyCertificateFilled,
  ThunderboltFilled,
  CheckCircleFilled,
  ArrowRightOutlined,
  PhoneOutlined,
  MailOutlined,
  EnvironmentOutlined,
  BankOutlined,
  LockOutlined,
  TeamOutlined,
} from "@ant-design/icons";

export const metadata: Metadata = {
  title: "About GinieSpace | India's 0% Commission WhatsApp Commerce Platform",
  description:
    "Learn about GinieSpace, India's leading zero-commission WhatsApp business commerce platform. Empowering retail stores, wholesale traders, and services with direct bank UPI billing and hyperlocal B2B leads.",
  alternates: {
    canonical: "https://app.ginie.space/about",
    languages: {
      "en-IN": "https://app.ginie.space/about",
      "hi-IN": "https://app.ginie.space/hi/about",
      "x-default": "https://app.ginie.space/about",
    },
  },
  openGraph: {
    title: "About GinieSpace | India's 0% Commission WhatsApp Commerce Platform",
    description:
      "GinieSpace empowers Indian retailers, Kiranas, and wholesalers with 0% commission WhatsApp commerce and direct UPI bank settlements.",
    url: "https://app.ginie.space/about",
    siteName: "GinieSpace",
    locale: "en_IN",
    type: "website",
    images: [{ url: "https://app.ginie.space/og-catalog.jpg", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "About GinieSpace - WhatsApp Commerce Engine",
    description:
      "Engineered from the ground up to empower Indian retailers, Kiranas, and wholesalers with 0% commission WhatsApp commerce.",
    images: ["https://app.ginie.space/og-catalog.jpg"],
  },
};

export default function AboutPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    "name": "About GinieSpace",
    "url": "https://app.ginie.space/about",
    "description":
      "Learn about GinieSpace, India's leading zero-commission WhatsApp business commerce platform empowering MSMEs with direct UPI settlements.",
    "mainEntity": {
      "@type": "Organization",
      "name": "GinieSpace",
      "url": "https://app.ginie.space",
      "logo": "https://app.ginie.space/logo.png",
      "contactPoint": {
        "@type": "ContactPoint",
        "telephone": "+91 92792 59690",
        "contactType": "customer support",
        "email": "info.giniespace@gmail.com",
        "availableLanguage": ["Hindi", "English"],
        "hoursAvailable": "Mo-Sa 09:30-19:30"
      },
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "Boring Road",
        "addressLocality": "Patna",
        "addressRegion": "Bihar",
        "postalCode": "800001",
        "addressCountry": "IN"
      }
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", color: "#0f172a" }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <MarketingNav currentPath="/about" lang="en" />

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
          🇮🇳 MISSION &amp; COMMERCE INFRASTRUCTURE
        </span>
        <h1
          style={{
            fontSize: "clamp(2rem, 4vw, 3rem)",
            fontWeight: 900,
            letterSpacing: "-0.03em",
            lineHeight: 1.2,
            margin: "0 auto 16px",
            maxWidth: 900,
          }}
        >
          Democratizing WhatsApp Commerce &amp; Direct Bank UPI for{" "}
          <span style={{ color: "#059669" }}>Bharat&apos;s MSMEs</span>
        </h1>
        <p style={{ fontSize: "clamp(1rem, 2vw, 1.15rem)", color: "#64748b", maxWidth: 740, margin: "0 auto", lineHeight: 1.6 }}>
          Engineered to liberate local Indian retailers, Kirana store owners, and wholesale distributors from predatory 2% to 3% payment gateway cuts, expensive POS hardware, and technical friction.
        </p>
      </section>

      {/* Platform Spotlight Card */}
      <section style={{ maxWidth: 1140, margin: "32px auto 64px", padding: "0 20px" }}>
        <div
          style={{
            background: "#ffffff",
            borderRadius: 24,
            border: "1px solid #e2e8f0",
            boxShadow: "0 16px 40px rgba(15, 23, 42, 0.06)",
            padding: "40px",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: 40,
            alignItems: "center",
          }}
        >
          {/* Company Column */}
          <div
            style={{
              background: "linear-gradient(145deg, #0f172a 0%, #1e293b 100%)",
              borderRadius: 20,
              padding: "36px 28px",
              color: "#fff",
              textAlign: "center",
              boxShadow: "0 10px 30px rgba(15, 23, 42, 0.2)",
            }}
          >
            {/* Brand Logo & Verified Badge */}
            <div style={{ position: "relative", display: "inline-block", marginBottom: 18 }}>
              <div
                style={{
                  width: 104,
                  height: 104,
                  borderRadius: "22px",
                  background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 8px 24px rgba(16, 185, 129, 0.4)",
                  border: "4px solid rgba(255, 255, 255, 0.15)",
                  margin: "0 auto",
                }}
              >
                <img
                  src="/logo-sm.webp"
                  alt="GinieSpace"
                  width={64}
                  height={64}
                  style={{ width: 64, height: 64, borderRadius: 12, objectFit: "contain" }}
                />
              </div>
              <span
                style={{
                  position: "absolute",
                  bottom: -6,
                  right: "50%",
                  transform: "translateX(50%)",
                  background: "#10b981",
                  color: "#fff",
                  borderRadius: 999,
                  fontSize: 11,
                  fontWeight: 700,
                  padding: "2px 12px",
                  whiteSpace: "nowrap",
                }}
              >
                ✓ Verified SaaS Platform
              </span>
            </div>

            <h2 style={{ color: "#fff", margin: "14px 0 4px", fontSize: 24, fontWeight: 800 }}>
              GinieSpace Technologies
            </h2>
            <div style={{ color: "#34d399", fontSize: 14, fontWeight: 700, marginBottom: 20 }}>
              Enterprise Cloud Commerce Platform
            </div>

            {/* Operating Hub & Trust Box */}
            <div
              style={{
                background: "rgba(255, 255, 255, 0.06)",
                borderRadius: 14,
                padding: "16px",
                textAlign: "left",
                marginBottom: 20,
                border: "1px solid rgba(255, 255, 255, 0.1)",
              }}
            >
              <div style={{ fontSize: 11, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700 }}>
                Registered Operating Hub
              </div>
              <div style={{ fontSize: 14, color: "#f8fafc", fontWeight: 700, marginTop: 6 }}>
                🏢 Boring Road, Patna, Bihar 800001, India
              </div>
              <div style={{ fontSize: 13, color: "#cbd5e1", marginTop: 4, lineHeight: 1.5 }}>
                🇮🇳 Serving Retailers, Wholesalers &amp; MSMEs Across Bharat
              </div>
            </div>

            {/* Contact Details */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 13, color: "#cbd5e1", textAlign: "left" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <EnvironmentOutlined style={{ color: "#f59e0b" }} />
                <span>Patna / Pan-India • Bharat</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <MailOutlined style={{ color: "#38bdf8" }} />
                <a href="mailto:info.giniespace@gmail.com" style={{ color: "#38bdf8", textDecoration: "none" }}>
                  info.giniespace@gmail.com
                </a>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <PhoneOutlined style={{ color: "#25D366" }} />
                <span>Official Helpline: +91 92792 59690</span>
              </div>
            </div>
          </div>

          {/* Vision & Story Column */}
          <div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                color: "#059669",
                fontWeight: 700,
                fontSize: 13,
                marginBottom: 12,
              }}
            >
              <SafetyCertificateFilled style={{ fontSize: 18 }} />
              <span>OUR FOUNDATIONAL COMMITMENT</span>
            </div>

            {/* Pull Quote */}
            <div
              style={{
                background: "#ecfdf5",
                borderLeft: "4px solid #10b981",
                borderRadius: "0 14px 14px 0",
                padding: "20px 24px",
                marginBottom: 24,
              }}
            >
              <p
                style={{
                  color: "#065f46",
                  fontSize: 16,
                  lineHeight: 1.8,
                  fontWeight: 500,
                  fontStyle: "italic",
                  margin: 0,
                }}
              >
                &ldquo;Small retailers, Kirana shopkeepers, and local distributors are the true backbone of India&apos;s commercial economy. They should never have to lose 2% to 3% of their profit margins to third-party payment gateways, nor should they get overwhelmed by expensive, complicated POS machinery. At GinieSpace, we built a lean, secure, direct-to-bank commerce engine that lets any merchant turn WhatsApp into an automated store in 60 seconds.&rdquo;
              </p>
            </div>

            <h3 style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", marginBottom: 12 }}>
              The Story: Engineering for Merchant Sovereignty
            </h3>
            <p style={{ color: "#475569", fontSize: 15, lineHeight: 1.8, marginBottom: 16 }}>
              GinieSpace was designed around one fundamental principle: <strong>Technology should serve the merchant, not tax them.</strong> For years, Indian business operators have faced a frustrating trade-off: either remain manual with slow pen-and-paper registers, or surrender their customer relationships and 2–3% transaction fees to intermediary platforms.
            </p>
            <p style={{ color: "#475569", fontSize: 15, lineHeight: 1.8, marginBottom: 24 }}>
              By combining persistent multi-device WhatsApp automation with 100% direct Bharat UPI QR settlement, GinieSpace delivers an enterprise-grade digital storefront with zero commission, zero intermediary escrow, and zero hardware requirements. Every rupee paid by your customers settles directly into your own bank account instantly.
            </p>

            {/* Badges Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginBottom: 28 }}>
              <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", padding: "12px 16px", borderRadius: 10, fontSize: 13, fontWeight: 600, color: "#334155" }}>
                ⚡ 60-Sec Instant Setup
              </div>
              <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", padding: "12px 16px", borderRadius: 10, fontSize: 13, fontWeight: 600, color: "#334155" }}>
                ⚡ Real-Time Socket Architecture
              </div>
              <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", padding: "12px 16px", borderRadius: 10, fontSize: 13, fontWeight: 600, color: "#334155" }}>
                🇮🇳 100% Built for Bharat&apos;s MSMEs
              </div>
              <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", padding: "12px 16px", borderRadius: 10, fontSize: 13, fontWeight: 600, color: "#334155" }}>
                🛡️ 0% Fee &amp; DPDP Compliant
              </div>
            </div>

            <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
              <Link
                href="/signup"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  background: "#059669",
                  color: "#fff",
                  fontWeight: 700,
                  padding: "12px 24px",
                  borderRadius: 10,
                  textDecoration: "none",
                  fontSize: 15,
                  boxShadow: "0 6px 18px rgba(5, 150, 105, 0.25)",
                }}
              >
                Join Free as a Merchant <ArrowRightOutlined />
              </Link>
              <a
                href="https://wa.me/919279259690"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  background: "#fff",
                  color: "#059669",
                  border: "1px solid #cbd5e1",
                  fontWeight: 600,
                  padding: "12px 20px",
                  borderRadius: 10,
                  textDecoration: "none",
                  fontSize: 15,
                }}
              >
                Connect on WhatsApp Helpline
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 4 Core Pillars Section */}
      <section style={{ maxWidth: 1140, margin: "0 auto 64px", padding: "0 20px" }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <span style={{ color: "#059669", fontWeight: 700, fontSize: 13, textTransform: "uppercase" }}>
            OUR CORE VALUES
          </span>
          <h2 style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)", fontWeight: 800, margin: "8px 0" }}>
            What GinieSpace Stands For
          </h2>
          <p style={{ color: "#64748b", maxWidth: 600, margin: "0 auto" }}>
            Engineered with strict ethical guidelines to preserve merchant independence and digital dignity.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 24 }}>
          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: "28px 24px" }}>
            <BankOutlined style={{ fontSize: 32, color: "#059669", marginBottom: 16 }} />
            <h3 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 8px" }}>0% Payment Commission</h3>
            <p style={{ color: "#64748b", fontSize: 14, lineHeight: 1.6, margin: 0 }}>
              We never hold merchant funds in escrow or charge 2–3% transaction cuts. 100% of the customer payment settles directly into the merchant&apos;s own UPI bank account.
            </p>
          </div>

          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: "28px 24px" }}>
            <LockOutlined style={{ fontSize: 32, color: "#2563eb", marginBottom: 16 }} />
            <h3 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 8px" }}>Privacy-First (DPDP 2023)</h3>
            <p style={{ color: "#64748b", fontSize: 14, lineHeight: 1.6, margin: 0 }}>
              Under our strict 72-hour ephemeral retention policy, customer messages are permanently purged from database storage to uphold strict consumer privacy.
            </p>
          </div>

          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: "28px 24px" }}>
            <ThunderboltFilled style={{ fontSize: 32, color: "#f59e0b", marginBottom: 16 }} />
            <h3 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 8px" }}>Zero-Friction Simplicity</h3>
            <p style={{ color: "#64748b", fontSize: 14, lineHeight: 1.6, margin: 0 }}>
              No laptops, coding, or costly POS machines required. A dukandar can manage catalog, orders, and delivery dispatch entirely from their mobile phone in under 60 seconds.
            </p>
          </div>

          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: "28px 24px" }}>
            <TeamOutlined style={{ fontSize: 32, color: "#7c3aed", marginBottom: 16 }} />
            <h3 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 8px" }}>Direct Human Support</h3>
            <p style={{ color: "#64748b", fontSize: 14, lineHeight: 1.6, margin: 0 }}>
              Merchants get direct access to dedicated support engineers via WhatsApp and phone (+91 92792 59690) six days a week, speaking their preferred language.
            </p>
          </div>
        </div>
      </section>

      {/* Pre-Footer Banner */}
      <section style={{ maxWidth: 1080, margin: "0 auto 64px", padding: "0 20px" }}>
        <div
          style={{
            background: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
            borderRadius: 20,
            padding: "40px 32px",
            textAlign: "center",
            color: "#fff",
            boxShadow: "0 16px 40px rgba(5, 150, 105, 0.25)",
          }}
        >
          <h2 style={{ color: "#fff", fontSize: "clamp(1.6rem, 3vw, 2.2rem)", fontWeight: 800, margin: "0 0 12px" }}>
            Ready to Take Your Shop Online in 60 Seconds?
          </h2>
          <p style={{ color: "#ecfdf5", fontSize: 16, maxWidth: 600, margin: "0 auto 24px" }}>
            Join thousands of retail and wholesale businesses across India who trust GinieSpace for automated WhatsApp billing and direct UPI payments.
          </p>
          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            <Link
              href="/signup"
              style={{
                background: "#0f172a",
                color: "#fff",
                fontWeight: 700,
                padding: "14px 32px",
                borderRadius: 10,
                textDecoration: "none",
                fontSize: 16,
              }}
            >
              Create Free Account (₹0) →
            </Link>
            <Link
              href="/pricing"
              style={{
                background: "#fff",
                color: "#059669",
                fontWeight: 700,
                padding: "14px 28px",
                borderRadius: 10,
                textDecoration: "none",
                fontSize: 16,
              }}
            >
              View PRO Plan (₹199)
            </Link>
          </div>
        </div>
      </section>

      <MarketingFooter lang="en" />
    </div>
  );
}
