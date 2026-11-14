"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Typography, Card, Divider, Space, Button, Tag, Segmented } from "antd";
import {
  ArrowLeftOutlined,
  DollarCircleFilled,
  PhoneOutlined,
  MailOutlined,
  CheckCircleFilled,
} from "@ant-design/icons";

const { Title, Paragraph } = Typography;

export default function RefundPolicyPage() {
  const [lang, setLang] = useState<"en" | "hi">("en");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("ginie_locale") as "en" | "hi";
      if (saved === "en" || saved === "hi") setLang(saved);
    } catch {}
  }, []);

  const handleLangChange = (val: "en" | "hi") => {
    setLang(val);
    try {
      localStorage.setItem("ginie_locale", val);
    } catch {}
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", color: "#1e293b" }}>
      {/* Top Navbar */}
      <header
        style={{
          background: "#ffffff",
          borderBottom: "1px solid #e2e8f0",
          position: "sticky",
          top: 0,
          zIndex: 50,
          padding: "14px 24px",
        }}
      >
        <div
          style={{
            maxWidth: 1080,
            margin: "0 auto",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Link href="/" style={{ textDecoration: "none" }}>
              <Button icon={<ArrowLeftOutlined />} size="small">
                {lang === "en" ? "Back to Home" : "Wapas Home"}
              </Button>
            </Link>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 8,
                  background: "#047857",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 800,
                  fontSize: 16,
                }}
              >
                G
              </div>
              <span style={{ fontWeight: 800, fontSize: 18, color: "#0f172a" }}>GinieSpace</span>
            </div>
          </div>

          <Space size="middle">
            <Segmented
              value={lang}
              onChange={(val: any) => handleLangChange(val)}
              options={[
                { label: "🇬🇧 English", value: "en" },
                { label: "🇮🇳 Hinglish", value: "hi" },
              ]}
            />
            <Link href="/login">
              <Button type="primary" style={{ background: "#047857", borderColor: "#047857" }}>
                {lang === "en" ? "Merchant Portal" : "Login Karein"}
              </Button>
            </Link>
          </Space>
        </div>
      </header>

      {/* Hero Header */}
      <div
        style={{
          background: "linear-gradient(135deg, #064e3b 0%, #047857 50%, #059669 100%)",
          color: "#fff",
          padding: "44px 24px",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: 860, margin: "0 auto" }}>
          <Tag color="success" style={{ fontWeight: 700, borderRadius: 6, marginBottom: 12, fontSize: 12 }}>
            <DollarCircleFilled style={{ marginRight: 4 }} /> Fair Billing &amp; Consumer Trust
          </Tag>
          <Title level={1} style={{ color: "#fff", margin: 0, fontWeight: 800 }}>
            {lang === "en" ? "Refund & Cancellation Policy" : "Refund Aur Cancellation Niti"}
          </Title>
          <Paragraph style={{ color: "#d1fae5", fontSize: 15, marginTop: 10, maxWidth: 650, margin: "10px auto 0" }}>
            {lang === "en"
              ? "Transparent terms covering GinieSpace PRO subscriptions, 7-day money-back guarantee, cancellation rights, and direct UPI settlements."
              : "GinieSpace PRO subscription, 7 din ki money-back guarantee, cancellation aur direct UPI billing ki poori transparent jankari."}
          </Paragraph>
          <div style={{ fontSize: 12, color: "#a7f3d0", marginTop: 12 }}>
            Effective Date: November 1, 2026 • Governed by Consumer Protection (E-Commerce) Rules India
          </div>
        </div>
      </div>

      {/* Main Document Body */}
      <main style={{ maxWidth: 960, margin: "-24px auto 60px", padding: "0 20px" }}>
        <Card
          style={{
            borderRadius: 16,
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.03)",
            border: "1px solid #e2e8f0",
          }}
          styles={{ body: { padding: "36px 32px" } }}
        >
          {lang === "en" ? (
            <div>
              <Title level={3} style={{ fontWeight: 700 }}>1. Free Evaluation Before You Upgrade</Title>
              <Paragraph style={{ lineHeight: 1.8, color: "#334155" }}>
                At GinieSpace, we believe merchants should never pay for software without testing its real value. We offer a <strong>permanent Free Starter Tier</strong> (₹0) that enables any shopkeeper or wholesaler to test catalog creation, automated message handling, and direct UPI QR generation before making any financial commitment.
              </Paragraph>

              <Divider />

              <Title level={3} style={{ fontWeight: 700 }}>2. 7-Day Money-Back Guarantee for PRO Subscriptions</Title>
              <div
                style={{
                  background: "#f0fdf4",
                  padding: "18px 22px",
                  borderRadius: 12,
                  borderLeft: "4px solid #059669",
                  marginBottom: 16,
                  color: "#166534",
                  fontSize: 14,
                  lineHeight: 1.7,
                }}
              >
                <strong>💰 100% RISK-FREE 7-DAY REFUND PROMISE:</strong>
                <p style={{ margin: "6px 0 0", color: "#1e293b" }}>
                  When you upgrade your business to the <strong>GinieSpace PRO Plan</strong> (₹99/month or ₹999/year), you are protected by our 7-Day Money-Back Guarantee. If for any reason the platform does not meet your operational expectations, you may request a <strong>100% full refund within seven (7) calendar days of activation</strong>.
                </p>
                <p style={{ margin: "6px 0 0", color: "#475569", fontSize: 13 }}>
                  No complex forms or tedious questions asked. Simply message our WhatsApp support desk with your registered phone number and payment UTR.
                </p>
              </div>

              <Divider />

              <Title level={3} style={{ fontWeight: 700 }}>3. Subscription Cancellation Policy (Zero Lock-in)</Title>
              <Paragraph style={{ lineHeight: 1.8, color: "#334155" }}>
                You maintain complete control over your subscription:
              </Paragraph>
              <ul style={{ lineHeight: 1.8, color: "#334155", paddingLeft: 20 }}>
                <li>You can cancel your PRO plan renewal at any time directly through your merchant dashboard or by notifying our support desk.</li>
                <li>There are <strong>zero lock-in periods and zero cancellation penalties</strong>.</li>
                <li>Upon cancellation, all PRO capabilities remain fully active until the expiration of your current 30-day or 365-day paid cycle. After expiration, your account smoothly downgrades to the Free Starter Tier with all your catalogs and data preserved.</li>
              </ul>

              <Divider />

              <Title level={3} style={{ fontWeight: 700 }}>4. Erroneous, Failed, or Duplicate UPI Payments</Title>
              <Paragraph style={{ lineHeight: 1.8, color: "#334155" }}>
                In the rare event of a technical discrepancy where your bank account is debited twice for a single billing cycle or an excess payment is transferred:
              </Paragraph>
              <ul style={{ lineHeight: 1.8, color: "#334155", paddingLeft: 20 }}>
                <li>Our billing team automatically reconciles duplicate UTR references within 24 hours.</li>
                <li>The excess amount is refunded directly back to your originating UPI VPA / bank account within <strong>3 to 5 business days</strong>.</li>
              </ul>

              <Divider />

              <Title level={3} style={{ fontWeight: 700 }}>5. Storefront Customer Orders (Merchant vs. End-Customer)</Title>
              <div
                style={{
                  background: "#f1f5f9",
                  padding: "16px 20px",
                  borderRadius: 12,
                  borderLeft: "4px solid #047857",
                  marginBottom: 16,
                  color: "#334155",
                  fontSize: 13,
                  lineHeight: 1.7,
                }}
              >
                <strong>DIRECT COMMERCE DISCLAIMER:</strong> GinieSpace facilitates direct peer-to-merchant UPI transactions with zero intermediary deductions. When a retail customer pays for goods via your digital storefront QR, 100% of the funds transfer directly from the customer&apos;s bank to your linked merchant UPI account. Consequently, any refunds, returns, or order cancellations for goods/services purchased through your digital shop are handled directly between you (the merchant) and your customer in accordance with your independent store policy.
              </div>

              <Divider />

              <Title level={3} style={{ fontWeight: 700 }}>6. How to Submit a Refund Request</Title>
              <Paragraph style={{ lineHeight: 1.8, color: "#334155" }}>
                To initiate a refund under the 7-day policy, please provide your registered details to our official desk:
              </Paragraph>
              <div style={{ padding: "14px 18px", background: "#f8fafc", borderRadius: 10, border: "1px solid #e2e8f0" }}>
                <div><strong>Merchant Helpdesk &amp; Billing Support:</strong></div>
                <div style={{ marginTop: 4 }}>
                  <PhoneOutlined style={{ marginRight: 6, color: "#059669" }} /> WhatsApp Helpline: <strong>+91 92792 59690</strong> (Fastest Resolution)
                </div>
                <div style={{ marginTop: 4 }}>
                  <MailOutlined style={{ marginRight: 6, color: "#059669" }} /> Email Desk: <strong>info.giniespace@gmail.com</strong>
                </div>
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 6 }}>
                  Please mention: Registered Mobile Number, Shop Name, and the 12-digit UPI UTR Transaction Reference.
                </div>
              </div>
            </div>
          ) : (
            <div>
              <Title level={3} style={{ fontWeight: 700 }}>1. Upgrade Karne Se Pehle Free Trial</Title>
              <Paragraph style={{ lineHeight: 1.8, color: "#334155" }}>
                GinieSpace par har vyapari ke liye <strong>Lifetime Free Starter Tier (₹0)</strong> uplabdh hai. Aap pehle bina koi paisa diye catalog bana kar aur software chala kar dekh sakte hain.
              </Paragraph>

              <Divider />

              <Title level={3} style={{ fontWeight: 700 }}>2. PRO Plan (₹99) Par 7-Din Ki Money-Back Guarantee</Title>
              <div
                style={{
                  background: "#f0fdf4",
                  padding: "18px 22px",
                  borderRadius: 12,
                  borderLeft: "4px solid #059669",
                  marginBottom: 16,
                  color: "#166534",
                  fontSize: 14,
                  lineHeight: 1.7,
                }}
              >
                <strong>💰 100% SURAKSHIT 7 DINO KI REFUND GUARANTEE:</strong>
                <p style={{ margin: "6px 0 0", color: "#1e293b" }}>
                  Jab aap apna business <strong>GinieSpace PRO Plan (₹99/mahina ya ₹999/saal)</strong> par upgrade karte hain, to aapko poore 7 dino ki money-back guarantee milti hai. Agar kisi bhi kaaran se aap software se santusht nahi hain, to <strong>activation ke 7 dino ke andar 100% full refund</strong> claim kar sakte hain.
                </p>
                <p style={{ margin: "6px 0 0", color: "#475569", fontSize: 13 }}>
                  Kewal hamare official WhatsApp helpline par apna phone number aur UTR message karein, aapka refund turant process kiya jayega.
                </p>
              </div>

              <Divider />

              <Title level={3} style={{ fontWeight: 700 }}>3. Cancellation Policy (Bina Kisi Lock-in Ke)</Title>
              <Paragraph style={{ lineHeight: 1.8, color: "#334155" }}>
                Aap jab chahein apna plan cancel kar sakte hain:
              </Paragraph>
              <ul style={{ lineHeight: 1.8, color: "#334155", paddingLeft: 20 }}>
                <li>Aap Settings me jakar kabhi bhi PRO plan cancel kar sakte hain.</li>
                <li>Isme koi lock-in period ya cancellation penalty nahi hoti.</li>
                <li>Cancel karne ke baad bhi aapka plan 30 din poore hone tak active rahega, aur agle mahine koi paisa nahi katega.</li>
              </ul>

              <Divider />

              <Title level={3} style={{ fontWeight: 700 }}>4. Duplicate Ya Galat UPI Payment Ka Refund</Title>
              <Paragraph style={{ lineHeight: 1.8, color: "#334155" }}>
                Agar technical issue ki wajah se bank se double payment cut ho jata hai ya extra amount transfer ho jata hai, to hamari team UTR verify karke <strong>3 se 5 working days</strong> ke andar aapke mool UPI bank khate me refund bhej deti hai.
              </Paragraph>

              <Divider />

              <Title level={3} style={{ fontWeight: 700 }}>5. Storefront Par Grahak Ke Orders Ka Refund</Title>
              <Paragraph style={{ lineHeight: 1.8, color: "#334155" }}>
                GinieSpace par storefront ke orders ka paisa customer se seedhe dukaandar ke bank account me jata hai bina kisi platform commission ke. Isliye customer ke return ya order cancellation ka niptara dukaandar apni dukan ki policy ke mutabiq direct customer ke sath karta hai.
              </Paragraph>

              <Divider />

              <Title level={3} style={{ fontWeight: 700 }}>6. Refund Request Kaise Karein</Title>
              <div style={{ padding: "14px 18px", background: "#f8fafc", borderRadius: 10, border: "1px solid #e2e8f0" }}>
                <div><strong>Official Helpdesk &amp; Refund Desk:</strong></div>
                <div style={{ marginTop: 4 }}>
                  <PhoneOutlined style={{ marginRight: 6, color: "#059669" }} /> WhatsApp Helpline: <strong>+91 92792 59690</strong> (Fast Support)
                </div>
                <div style={{ marginTop: 4 }}>
                  <MailOutlined style={{ marginRight: 6, color: "#059669" }} /> Email Desk: <strong>info.giniespace@gmail.com</strong>
                </div>
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 6 }}>
                  Kripya apna Registered Mobile Number aur 12-digit UPI UTR reference zaroor share karein.
                </div>
              </div>
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}
