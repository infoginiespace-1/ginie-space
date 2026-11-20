import React from "react";
import Link from "next/link";
import { ArrowLeftOutlined, HomeOutlined, PhoneOutlined } from "@ant-design/icons";

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: 580,
          background: "#ffffff",
          borderRadius: 20,
          padding: "48px 32px",
          textAlign: "center",
          border: "1px solid #e2e8f0",
          boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
        }}
      >
        <div
          style={{
            display: "inline-block",
            fontSize: 64,
            fontWeight: 900,
            color: "#059669",
            lineHeight: 1,
            marginBottom: 16,
          }}
        >
          404
        </div>
        <h1
          style={{
            fontSize: "clamp(1.5rem, 3vw, 2rem)",
            fontWeight: 800,
            color: "#0f172a",
            margin: "0 0 12px",
          }}
        >
          Page Not Found / पृष्ठ नहीं मिला
        </h1>
        <p
          style={{
            fontSize: 15,
            color: "#64748b",
            lineHeight: 1.6,
            marginBottom: 32,
          }}
        >
          Aap jo page dhoondh rahe hain woh shayad move ho chuka hai ya URL galat hai. Neeche diye gaye links se aap wapas sahi jagah pahunch sakte hain.
        </p>

        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 12, marginBottom: 32 }}>
          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 20px",
              background: "#25D366",
              color: "#fff",
              borderRadius: 8,
              fontWeight: 700,
              textDecoration: "none",
              fontSize: 14,
            }}
          >
            <HomeOutlined />
            <span>Go to Home Page</span>
          </Link>
          <Link
            href="/whatsapp-catalog-maker"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 18px",
              background: "#f1f5f9",
              color: "#0f172a",
              border: "1px solid #cbd5e1",
              borderRadius: 8,
              fontWeight: 600,
              textDecoration: "none",
              fontSize: 14,
            }}
          >
            WhatsApp Catalog
          </Link>
          <Link
            href="/pricing"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 18px",
              background: "#f1f5f9",
              color: "#0f172a",
              border: "1px solid #cbd5e1",
              borderRadius: 8,
              fontWeight: 600,
              textDecoration: "none",
              fontSize: 14,
            }}
          >
            100% Free Plan
          </Link>
        </div>

        <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: 20, fontSize: 13, color: "#94a3b8" }}>
          Need assistance? Call or WhatsApp our helpline:{" "}
          <a href="tel:+919279259690" style={{ color: "#059669", fontWeight: 700, textDecoration: "none" }}>
            +91 92792 59690
          </a>
        </div>
      </div>
    </div>
  );
}
