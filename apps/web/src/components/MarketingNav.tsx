"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Drawer, Button, Dropdown } from "antd";
import {
  MenuOutlined,
  ArrowRightOutlined,
  GlobalOutlined,
  DownOutlined,
  WhatsAppOutlined,
} from "@ant-design/icons";

interface MarketingNavProps {
  currentPath: string;
  lang?: "en" | "hi";
}

export default function MarketingNav({ currentPath, lang = "en" }: MarketingNavProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Compute alternate language target URL
  const getAltLangUrl = () => {
    if (lang === "hi") {
      if (currentPath === "/hi") return "/";
      return currentPath.replace(/^\/hi/, "") || "/";
    } else {
      if (currentPath === "/") return "/hi";
      return `/hi${currentPath}`;
    }
  };

  const prefix = lang === "hi" ? "/hi" : "";

  const solutionsMenuItems = [
    {
      key: "whatsapp-catalog",
      label: (
        <Link href={`${prefix}/whatsapp-catalog-maker`} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 4px" }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: "#ecfdf5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
            📱
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13, color: "#0f172a" }}>
              {lang === "hi" ? "व्हाट्सएप कैटलॉग मेकर" : "WhatsApp Catalog Maker"}
            </div>
            <div style={{ fontSize: 11, color: "#64748b" }}>
              {lang === "hi" ? "24/7 ऑटोमेटेड डिजिटल स्टोर" : "24/7 Digital store with auto WhatsApp orders"}
            </div>
          </div>
        </Link>
      ),
    },
    {
      key: "upi-billing",
      label: (
        <Link href={`${prefix}/upi-billing-software`} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 4px" }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
            ⚡
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13, color: "#0f172a" }}>
              {lang === "hi" ? "0% कमीशन UPI बिलिंग" : "0% Commission UPI Billing"}
            </div>
            <div style={{ fontSize: 11, color: "#64748b" }}>
              {lang === "hi" ? "सीधे बैंक खाते में 100% सेटलमेंट" : "100% Direct bank settlement, no 2-3% cuts"}
            </div>
          </div>
        </Link>
      ),
    },
    {
      key: "b2b-leads",
      label: (
        <Link href={`${prefix}/b2b-leads-finder`} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 4px" }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: "#fef3c7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
            🔍
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13, color: "#0f172a" }}>
              {lang === "hi" ? "लोकल B2B लीड्स फाइंडर" : "B2B Local Leads Discovery"}
            </div>
            <div style={{ fontSize: 11, color: "#64748b" }}>
              {lang === "hi" ? "Google Maps से सत्यापित दुकानें" : "Verified retail buyers & shops from Google Maps"}
            </div>
          </div>
        </Link>
      ),
    },
    {
      type: "divider" as const,
    },
    {
      key: "retail-kirana",
      label: (
        <Link href={`${prefix}/retail-kirana-store`} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 4px" }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
            🏪
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13, color: "#0f172a" }}>
              {lang === "hi" ? "किराना व रिटेल स्टोर्स" : "Retail & Kirana Stores"}
            </div>
            <div style={{ fontSize: 11, color: "#64748b" }}>
              {lang === "hi" ? "फास्ट काउंटर POS व होम डिलीवरी" : "Loose grocery, counter POS & instant receipts"}
            </div>
          </div>
        </Link>
      ),
    },
    {
      key: "wholesale-bulk",
      label: (
        <Link href={`${prefix}/wholesale-distributors`} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 4px" }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: "#faf5ff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
            📦
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13, color: "#0f172a" }}>
              {lang === "hi" ? "होलसेल व डिस्ट्रीब्यूटर्स" : "Wholesale & Bulk Distributors"}
            </div>
            <div style={{ fontSize: 11, color: "#64748b" }}>
              {lang === "hi" ? "बल्क रेट लिस्ट व ऑटो डिस्पैच" : "Bulk pricing tiers, rate lists & auto dispatch"}
            </div>
          </div>
        </Link>
      ),
    },
  ];

  return (
    <header
      className="app-header"
      style={{
        background: "#ffffff",
        borderBottom: "1px solid #e2e8f0",
        position: "sticky",
        top: 0,
        zIndex: 1000,
        boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "0 20px",
          height: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
        }}
      >
        {/* Brand Logo */}
        <Link href={lang === "hi" ? "/hi" : "/"} style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <img
            src="/logo-sm.webp"
            alt="GinieSpace Logo"
            width={34}
            height={34}
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              objectFit: "contain",
              boxShadow: "0 3px 10px rgba(37, 211, 102, 0.25)",
            }}
          />
          <div>
            <div style={{ fontWeight: 800, fontSize: 18, color: "#0f172a", lineHeight: 1.1, letterSpacing: "-0.02em" }}>
              GinieSpace
            </div>
            <div className="brand-subtitle-mobile" style={{ fontSize: 10, color: "#64748b", fontWeight: 500 }}>
              {lang === "hi" ? "स्मार्ट व्हाट्सएप कॉमर्स" : "Smart WhatsApp Commerce"}
            </div>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hide-on-mobile" style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Dropdown menu={{ items: solutionsMenuItems }} placement="bottomLeft">
            <span className="nav-dropdown-trigger">
              {lang === "hi" ? "समाधान" : "Solutions"} <DownOutlined style={{ fontSize: 10, color: "#94a3b8" }} />
            </span>
          </Dropdown>
          <Link
            href={`${prefix}/pricing`}
            className="nav-link-pill"
            style={{ color: currentPath.includes("/pricing") ? "#059669" : undefined, fontWeight: currentPath.includes("/pricing") ? 700 : 500 }}
          >
            {lang === "hi" ? "100% फ्री (₹0)" : "100% Free (₹0)"}
          </Link>
          <Link
            href={`${prefix}/about`}
            className="nav-link-pill"
            style={{ color: currentPath.includes("/about") ? "#059669" : undefined, fontWeight: currentPath.includes("/about") ? 700 : 500 }}
          >
            {lang === "hi" ? "हमारे बारे में" : "About Us"}
          </Link>
        </nav>

        {/* Actions (Language Switcher, Sign In, Sign Up) */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* Language Switcher Link (Desktop) */}
          <Link
            href={getAltLangUrl()}
            className="hide-on-mobile"
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

          {/* Sign In Button (Desktop & Mobile) */}
          <Link
            href="/login"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "6px 14px",
              fontSize: 13,
              fontWeight: 600,
              color: "#0f172a",
              border: "1px solid #cbd5e1",
              borderRadius: 7,
              textDecoration: "none",
              background: "#fff",
              height: 32,
              boxSizing: "border-box",
            }}
          >
            {lang === "hi" ? "लॉगिन" : "Sign In"}
          </Link>

          {/* Primary CTA (Desktop only) */}
          <Link
            href="/signup"
            className="hide-on-mobile"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "7px 16px",
              fontSize: 13,
              fontWeight: 700,
              color: "#fff",
              background: "#25D366",
              borderRadius: 8,
              textDecoration: "none",
              boxShadow: "0 4px 14px rgba(37, 211, 102, 0.35)",
              height: 34,
              boxSizing: "border-box",
            }}
          >
            <span>{lang === "hi" ? "फ्री शुरू करें" : "Start Free"}</span>
            <ArrowRightOutlined style={{ fontSize: 11 }} />
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
              padding: "4px 6px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: 32,
              width: 34,
            }}
          >
            <MenuOutlined style={{ fontSize: 20, color: "#0f172a" }} />
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <Drawer
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <img src="/logo-sm.webp" alt="GinieSpace" width={30} height={30} style={{ borderRadius: 7, objectFit: "contain" }} />
            <div>
              <div style={{ fontWeight: 800, fontSize: 16, color: "#0f172a", lineHeight: 1.1 }}>GinieSpace</div>
              <div style={{ fontSize: 10, color: "#64748b" }}>WhatsApp Commerce Hub</div>
            </div>
          </div>
        }
        placement="right"
        width={310}
        onClose={() => setMobileMenuOpen(false)}
        open={mobileMenuOpen}
        styles={{ body: { padding: "16px 18px" } }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Language Switcher in Mobile Drawer */}
          <Link
            href={getAltLangUrl()}
            onClick={() => setMobileMenuOpen(false)}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "10px 14px",
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: 10,
              color: "#059669",
              fontWeight: 700,
              fontSize: 14,
              textDecoration: "none",
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <GlobalOutlined /> {lang === "hi" ? "Switch to English" : "हिन्दी भाषा चुनें"}
            </span>
            <span style={{ fontSize: 11, background: "#ecfdf5", padding: "2px 8px", borderRadius: 6 }}>
              {lang === "hi" ? "EN" : "HI"}
            </span>
          </Link>

          {/* Group 1: Core Tools */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6, paddingLeft: 4 }}>
              {lang === "hi" ? "मुख्य टूल्स" : "Core Tools"}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <Link
                href={`${prefix}/whatsapp-catalog-maker`}
                onClick={() => setMobileMenuOpen(false)}
                style={{ display: "flex", alignItems: "center", gap: 10, color: "#1e293b", fontWeight: 600, fontSize: 14, textDecoration: "none", padding: "9px 12px", borderRadius: 8, background: "#f8fafc" }}
              >
                <span>📱</span> <span>{lang === "hi" ? "व्हाट्सएप कैटलॉग मेकर" : "WhatsApp Catalog Maker"}</span>
              </Link>
              <Link
                href={`${prefix}/upi-billing-software`}
                onClick={() => setMobileMenuOpen(false)}
                style={{ display: "flex", alignItems: "center", gap: 10, color: "#1e293b", fontWeight: 600, fontSize: 14, textDecoration: "none", padding: "9px 12px", borderRadius: 8, background: "#f8fafc" }}
              >
                <span>⚡</span> <span>{lang === "hi" ? "0% कमीशन UPI बिलिंग" : "0% Commission UPI Billing"}</span>
              </Link>
              <Link
                href={`${prefix}/b2b-leads-finder`}
                onClick={() => setMobileMenuOpen(false)}
                style={{ display: "flex", alignItems: "center", gap: 10, color: "#1e293b", fontWeight: 600, fontSize: 14, textDecoration: "none", padding: "9px 12px", borderRadius: 8, background: "#f8fafc" }}
              >
                <span>🔍</span> <span>{lang === "hi" ? "लोकल B2B लीड्स फाइंडर" : "B2B Leads Discovery"}</span>
              </Link>
            </div>
          </div>

          {/* Group 2: Industry Solutions */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6, paddingLeft: 4 }}>
              {lang === "hi" ? "उद्योग व समाधान" : "Industry Solutions"}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <Link
                href={`${prefix}/retail-kirana-store`}
                onClick={() => setMobileMenuOpen(false)}
                style={{ display: "flex", alignItems: "center", gap: 10, color: "#1e293b", fontWeight: 600, fontSize: 14, textDecoration: "none", padding: "9px 12px", borderRadius: 8, background: "#f8fafc" }}
              >
                <span>🏪</span> <span>{lang === "hi" ? "किराना व रिटेल स्टोर्स" : "Retail & Kirana Stores"}</span>
              </Link>
              <Link
                href={`${prefix}/wholesale-distributors`}
                onClick={() => setMobileMenuOpen(false)}
                style={{ display: "flex", alignItems: "center", gap: 10, color: "#1e293b", fontWeight: 600, fontSize: 14, textDecoration: "none", padding: "9px 12px", borderRadius: 8, background: "#f8fafc" }}
              >
                <span>📦</span> <span>{lang === "hi" ? "होलसेल व डिस्ट्रीब्यूटर्स" : "Wholesale & Bulk Distributors"}</span>
              </Link>
            </div>
          </div>

          {/* Group 3: Company & Free Platform */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6, paddingLeft: 4 }}>
              {lang === "hi" ? "प्लान व कंपनी" : "Platform & About"}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <Link
                href={`${prefix}/pricing`}
                onClick={() => setMobileMenuOpen(false)}
                style={{ display: "flex", alignItems: "center", gap: 10, color: "#15803d", fontWeight: 700, fontSize: 14, textDecoration: "none", padding: "9px 12px", borderRadius: 8, background: "#f0fdf4", border: "1px solid #bbf7d0" }}
              >
                <span>🎁</span> <span>{lang === "hi" ? "100% फ्री (₹0)" : "100% Free (₹0)"}</span>
              </Link>
              <Link
                href={`${prefix}/about`}
                onClick={() => setMobileMenuOpen(false)}
                style={{ display: "flex", alignItems: "center", gap: 10, color: "#1e293b", fontWeight: 600, fontSize: 14, textDecoration: "none", padding: "9px 12px", borderRadius: 8, background: "#f8fafc" }}
              >
                <span>🏢</span> <span>{lang === "hi" ? "हमारे बारे में" : "About Us"}</span>
              </Link>
            </div>
          </div>

          {/* Bottom Action inside Drawer */}
          <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: 16, marginTop: 10, display: "flex", flexDirection: "column", gap: 10 }}>
            <Link
              href="/signup"
              onClick={() => setMobileMenuOpen(false)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                background: "#25D366",
                color: "#fff",
                fontWeight: 700,
                height: 44,
                borderRadius: 10,
                fontSize: 15,
                textDecoration: "none",
                boxShadow: "0 4px 14px rgba(37, 211, 102, 0.35)",
              }}
            >
              <span>{lang === "hi" ? "फ्री खाता बनाएं (₹0)" : "Create Free Account (₹0)"}</span>
              <ArrowRightOutlined style={{ fontSize: 12 }} />
            </Link>
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: 44,
                border: "1px solid #cbd5e1",
                borderRadius: 10,
                color: "#0f172a",
                fontWeight: 600,
                textDecoration: "none",
                fontSize: 14,
              }}
            >
              {lang === "hi" ? "व्यापारी लॉगिन" : "Merchant Sign In"}
            </Link>
            <a
              href="https://wa.me/919279259690"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                fontSize: 12,
                color: "#059669",
                fontWeight: 600,
                textDecoration: "none",
                marginTop: 4,
              }}
            >
              <WhatsAppOutlined /> Helpline: +91 92792 59690
            </a>
          </div>
        </div>
      </Drawer>
    </header>
  );
}
