"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Drawer, Button } from "antd";
import { MenuOutlined, ArrowRightOutlined, GlobalOutlined } from "@ant-design/icons";

interface MarketingNavProps {
  currentPath: string;
  lang?: "en" | "hi";
}

export default function MarketingNav({ currentPath, lang = "en" }: MarketingNavProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Compute alternate language target URL
  const getAltLangUrl = () => {
    if (lang === "hi") {
      // Switch from /hi/... to /...
      if (currentPath === "/hi") return "/";
      return currentPath.replace(/^\/hi/, "") || "/";
    } else {
      // Switch from /... to /hi/...
      if (currentPath === "/") return "/hi";
      return `/hi${currentPath}`;
    }
  };

  const prefix = lang === "hi" ? "/hi" : "";

  const navLinks = [
    { label: lang === "hi" ? "कैटलॉग मेकर" : "WhatsApp Catalog", href: `${prefix}/whatsapp-catalog-maker` },
    { label: lang === "hi" ? "UPI बिलिंग" : "UPI Billing (0%)", href: `${prefix}/upi-billing-software` },
    { label: lang === "hi" ? "B2B लीड्स" : "B2B Leads Finder", href: `${prefix}/b2b-leads-finder` },
    { label: lang === "hi" ? "किराना स्टोर" : "Retail & Kirana", href: `${prefix}/retail-kirana-store` },
    { label: lang === "hi" ? "होलसेल" : "Wholesale", href: `${prefix}/wholesale-distributors` },
    { label: lang === "hi" ? "प्लान्स (₹199)" : "Pricing (₹199)", href: `${prefix}/pricing` },
  ];

  return (
    <header
      style={{
        background: "#ffffff",
        borderBottom: "1px solid #e2e8f0",
        position: "sticky",
        top: 0,
        zIndex: 100,
        boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "14px 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        {/* Brand Logo */}
        <Link href={lang === "hi" ? "/hi" : "/"} style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: "linear-gradient(135deg, #25D366 0%, #128C7E 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontWeight: 800,
              fontSize: 20,
              boxShadow: "0 4px 12px rgba(37, 211, 102, 0.3)",
            }}
          >
            G
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 19, color: "#0f172a", lineHeight: 1.1, letterSpacing: "-0.02em" }}>
              GinieSpace
            </div>
            <div style={{ fontSize: 10, color: "#64748b", fontWeight: 500 }}>
              {lang === "hi" ? "स्मार्ट व्हाट्सएप कॉमर्स" : "Smart WhatsApp Commerce"}
            </div>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hide-on-mobile" style={{ display: "flex", alignItems: "center", gap: 20 }}>
          {navLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              style={{
                color: currentPath === item.href ? "#059669" : "#475569",
                fontWeight: currentPath === item.href ? 700 : 500,
                fontSize: 14,
                textDecoration: "none",
                transition: "color 0.2s",
              }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Actions (Language Switcher, Sign In, Sign Up) */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* Language Switcher Link */}
          <Link
            href={getAltLangUrl()}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              fontSize: 13,
              fontWeight: 600,
              color: "#0f172a",
              background: "#f1f5f9",
              padding: "6px 12px",
              borderRadius: 8,
              textDecoration: "none",
              border: "1px solid #e2e8f0",
            }}
            title={lang === "hi" ? "Switch to English" : "हिंदी में बदलें"}
          >
            <GlobalOutlined style={{ color: "#059669" }} />
            {lang === "hi" ? "English" : "हिन्दी"}
          </Link>

          <Link
            href="/login"
            className="hide-on-mobile"
            style={{
              display: "inline-block",
              padding: "7px 16px",
              fontSize: 14,
              fontWeight: 600,
              color: "#0f172a",
              border: "1px solid #cbd5e1",
              borderRadius: 8,
              textDecoration: "none",
              background: "#fff",
            }}
          >
            {lang === "hi" ? "लॉगिन" : "Sign In"}
          </Link>

          <Link
            href="/signup"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 16px",
              fontSize: 14,
              fontWeight: 700,
              color: "#fff",
              background: "#25D366",
              borderRadius: 8,
              textDecoration: "none",
              boxShadow: "0 4px 14px rgba(37, 211, 102, 0.35)",
            }}
          >
            <span>{lang === "hi" ? "फ्री शुरू करें" : "Start Free"}</span>
            <ArrowRightOutlined style={{ fontSize: 12 }} />
          </Link>

          {/* Mobile Menu Hamburger Button */}
          <button
            type="button"
            className="show-on-mobile"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open navigation menu"
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: 6,
              display: "flex",
              alignItems: "center",
            }}
          >
            <MenuOutlined style={{ fontSize: 22, color: "#0f172a" }} />
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <Drawer
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontWeight: 800, color: "#0f172a" }}>GinieSpace</span>
          </div>
        }
        placement="right"
        onClose={() => setMobileMenuOpen(false)}
        open={mobileMenuOpen}
        bodyStyle={{ padding: "16px 20px" }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {navLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              style={{
                color: "#1e293b",
                fontWeight: 600,
                fontSize: 15,
                textDecoration: "none",
                padding: "8px 0",
                borderBottom: "1px solid #f1f5f9",
              }}
            >
              {item.label}
            </Link>
          ))}

          <Link
            href={getAltLangUrl()}
            onClick={() => setMobileMenuOpen(false)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              color: "#059669",
              fontWeight: 700,
              fontSize: 15,
              textDecoration: "none",
              padding: "10px 0",
              borderBottom: "1px solid #f1f5f9",
            }}
          >
            <GlobalOutlined />
            {lang === "hi" ? "🌐 Switch to English version" : "🌐 हिन्दी संस्करण पर जाएं"}
          </Link>

          <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              style={{
                textAlign: "center",
                padding: "10px",
                border: "1px solid #cbd5e1",
                borderRadius: 8,
                color: "#0f172a",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              {lang === "hi" ? "व्यापारी लॉगिन" : "Merchant Sign In"}
            </Link>
            <Link
              href="/signup"
              onClick={() => setMobileMenuOpen(false)}
              style={{
                textAlign: "center",
                padding: "12px",
                background: "#25D366",
                borderRadius: 8,
                color: "#fff",
                fontWeight: 700,
                textDecoration: "none",
              }}
            >
              {lang === "hi" ? "फ्री खाता बनाएं (₹0)" : "Create Free Account (₹0)"}
            </Link>
          </div>
        </div>
      </Drawer>
    </header>
  );
}
