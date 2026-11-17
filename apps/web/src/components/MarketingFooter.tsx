"use client";

import React from "react";
import Link from "next/link";
import { Row, Col, Divider } from "antd";
import {
  PhoneOutlined,
  MailOutlined,
  EnvironmentOutlined,
  SafetyCertificateFilled,
} from "@ant-design/icons";

interface MarketingFooterProps {
  lang?: "en" | "hi";
}

export default function MarketingFooter({ lang = "en" }: MarketingFooterProps) {
  const prefix = lang === "hi" ? "/hi" : "";

  return (
    <footer style={{ background: "#0b1329", color: "#94a3b8", padding: "64px 20px 32px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <Row gutter={[32, 32]}>
          {/* Brand Info */}
          <Col xs={24} md={8}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  background: "linear-gradient(135deg, #25D366 0%, #128C7E 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontWeight: 800,
                  fontSize: 18,
                }}
              >
                G
              </div>
              <span style={{ fontSize: 20, fontWeight: 800, color: "#fff" }}>GinieSpace</span>
            </div>
            <p style={{ fontSize: 13, lineHeight: 1.7, color: "#94a3b8", maxWidth: 340 }}>
              {lang === "hi"
                ? "भारतीय एमएसएमई और खुदरा व्यापारियों के लिए 0% कमीशन डिजिटल व्हाट्सएप कैटलॉग, डायरेक्ट बैंक UPI बिलिंग और हाइपरलोकल B2B लीड्स सॉफ्टवेयर।"
                : "Zero-commission WhatsApp catalog maker, direct bank UPI billing, and hyperlocal B2B leads discovery for Indian MSMEs, retailers, and wholesalers."}
            </p>

            <div style={{ marginTop: 16, fontSize: 13, lineHeight: 2, color: "#cbd5e1" }}>
              <div>
                <PhoneOutlined style={{ color: "#25D366", marginRight: 8 }} />
                <a href="tel:+919279259690" style={{ color: "#cbd5e1", textDecoration: "none" }}>
                  +91 92792 59690
                </a>{" "}
                <span style={{ color: "#64748b", fontSize: 11 }}>(Mon–Sat 9:30–19:30 IST)</span>
              </div>
              <div>
                <MailOutlined style={{ color: "#38bdf8", marginRight: 8 }} />
                <a href="mailto:info.giniespace@gmail.com" style={{ color: "#cbd5e1", textDecoration: "none" }}>
                  info.giniespace@gmail.com
                </a>
              </div>
              <div>
                <EnvironmentOutlined style={{ color: "#f59e0b", marginRight: 8 }} />
                <span>Boring Road, Patna, Bihar 800001, India</span>
              </div>
            </div>
          </Col>

          {/* Solutions & Product Links */}
          <Col xs={12} sm={8} md={5}>
            <div style={{ color: "#fff", fontWeight: 700, fontSize: 15, marginBottom: 16 }}>
              {lang === "hi" ? "समाधान (Solutions)" : "Solutions"}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 13 }}>
              <Link href={`${prefix}/whatsapp-catalog-maker`} style={{ color: "#94a3b8", textDecoration: "none" }}>
                {lang === "hi" ? "व्हाट्सएप कैटलॉग मेकर" : "WhatsApp Catalog Maker"}
              </Link>
              <Link href={`${prefix}/upi-billing-software`} style={{ color: "#94a3b8", textDecoration: "none" }}>
                {lang === "hi" ? "डायरेक्ट UPI बिलिंग (0%)" : "Direct UPI Billing (0%)"}
              </Link>
              <Link href={`${prefix}/b2b-leads-finder`} style={{ color: "#94a3b8", textDecoration: "none" }}>
                {lang === "hi" ? "लोकल B2B लीड्स फाइंडर" : "B2B Leads Discovery"}
              </Link>
              <Link href={`${prefix}/retail-kirana-store`} style={{ color: "#94a3b8", textDecoration: "none" }}>
                {lang === "hi" ? "किराना व रिटेल स्टोर" : "Retail & Kirana Stores"}
              </Link>
              <Link href={`${prefix}/wholesale-distributors`} style={{ color: "#94a3b8", textDecoration: "none" }}>
                {lang === "hi" ? "होलसेल व डिस्ट्रीब्यूटर्स" : "Wholesale Distributors"}
              </Link>
              <Link href={`${prefix}/services-appointments`} style={{ color: "#94a3b8", textDecoration: "none" }}>
                {lang === "hi" ? "सर्विसेज व अपॉइंटमेंट" : "Services & Appointments"}
              </Link>
            </div>
          </Col>

          {/* Pricing & Portal */}
          <Col xs={12} sm={8} md={5}>
            <div style={{ color: "#fff", fontWeight: 700, fontSize: 15, marginBottom: 16 }}>
              {lang === "hi" ? "प्लान्स व पोर्टल" : "Plans & Portal"}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 13 }}>
              <Link href={`${prefix}/pricing`} style={{ color: "#94a3b8", textDecoration: "none" }}>
                {lang === "hi" ? "प्लान्स व प्राइसिंग (₹199)" : "Pricing Plans (₹199)"}
              </Link>
              <Link href="/login" style={{ color: "#94a3b8", textDecoration: "none" }}>
                {lang === "hi" ? "व्यापारी लॉगिन" : "Merchant Sign In"}
              </Link>
              <Link href="/signup" style={{ color: "#94a3b8", textDecoration: "none" }}>
                {lang === "hi" ? "नया फ्री अकाउंट बनाएं" : "Create Free Account"}
              </Link>
              <Link href="/terms" style={{ color: "#94a3b8", textDecoration: "none" }}>
                {lang === "hi" ? "नियम व शर्तें (Terms)" : "Terms & Conditions"}
              </Link>
              <Link href="/privacy" style={{ color: "#94a3b8", textDecoration: "none" }}>
                {lang === "hi" ? "गोपनीयता नीति (Privacy)" : "Privacy Policy"}
              </Link>
              <Link href="/refund" style={{ color: "#94a3b8", textDecoration: "none" }}>
                {lang === "hi" ? "रिफंड नीति (Refund)" : "Refund Policy"}
              </Link>
            </div>
          </Col>

          {/* Trust & Compliance */}
          <Col xs={24} sm={8} md={6}>
            <div style={{ color: "#fff", fontWeight: 700, fontSize: 15, marginBottom: 16 }}>
              {lang === "hi" ? "सुरक्षा व भरोसा" : "Security & Trust"}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 13, color: "#94a3b8" }}>
              <div>🔒 256-Bit SSL Bank-Grade Encryption</div>
              <div>⚡ Direct Peer UPI (0% Gateway Cut)</div>
              <div>🛡️ DPDP Act 2023 Compliant Storage</div>
              <div>📱 Multi-Device Persistent Cloud Sync</div>
              <div>🇮🇳 100% Made with ❤️ in Bharat</div>
            </div>
          </Col>
        </Row>

        <Divider style={{ borderColor: "#1e293b", margin: "40px 0 20px" }} />

        {/* Disclaimer */}
        <div
          style={{
            background: "#070c1a",
            padding: "14px 18px",
            borderRadius: 8,
            fontSize: 11,
            color: "#64748b",
            lineHeight: 1.6,
            marginBottom: 20,
          }}
        >
          {lang === "hi"
            ? "सूचना: GinieSpace एक स्वतंत्र क्लाउड कॉमर्स सॉफ्टवेयर है। WhatsApp®, Meta Platforms Inc. का पंजीकृत ट्रेडमार्क है। GinieSpace का Meta Platforms Inc. से कोई प्रत्यक्ष आधिकारिक संबंध नहीं है। UPI®, नेशनल पेमेंट्स कॉरपोरेशन ऑफ इंडिया (NPCI) का ट्रेडमार्क है।"
            : "Notice: GinieSpace is an independent cloud commerce software platform. WhatsApp® is a registered trademark of Meta Platforms, Inc. GinieSpace is not affiliated with or endorsed by Meta Platforms, Inc. UPI® is a trademark of National Payments Corporation of India (NPCI)."}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 12,
            fontSize: 12,
            color: "#64748b",
          }}
        >
          <div>© {new Date().getFullYear()} GinieSpace. All rights reserved.</div>
          <div>Boring Road, Patna, Bihar 800001, India • Helpline: +91 92792 59690</div>
        </div>
      </div>
    </footer>
  );
}
