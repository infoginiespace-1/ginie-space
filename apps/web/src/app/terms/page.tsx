"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Typography, Card, Divider, Space, Button, Tag, Segmented } from "antd";
import {
  ArrowLeftOutlined,
  SafetyCertificateFilled,
  PhoneOutlined,
  MailOutlined,
  FileTextOutlined,
} from "@ant-design/icons";

const { Title, Paragraph, Text } = Typography;

export default function TermsAndConditionsPage() {
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
            <SafetyCertificateFilled style={{ marginRight: 4 }} /> Legal Documentation
          </Tag>
          <Title level={1} style={{ color: "#fff", margin: 0, fontWeight: 800 }}>
            {lang === "en" ? "Terms & Conditions" : "Niyam Aur Shartein (Terms of Service)"}
          </Title>
          <Paragraph style={{ color: "#d1fae5", fontSize: 15, marginTop: 10, maxWidth: 650, margin: "10px auto 0" }}>
            {lang === "en"
              ? "Official terms of service governing the use of GinieSpace WhatsApp commerce, billing automation, and B2B leads software."
              : "GinieSpace WhatsApp commerce, catalog billing aur B2B leads software ke upyog ke aadhikarik niyam."}
          </Paragraph>
          <div style={{ fontSize: 12, color: "#a7f3d0", marginTop: 12 }}>
            Effective Date: November 1, 2026 • Version 2.4 (India DPDP &amp; IT Act Compliant)
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
              <Title level={3} style={{ fontWeight: 700 }}>1. Agreement to Terms</Title>
              <Paragraph style={{ lineHeight: 1.8, color: "#334155" }}>
                By accessing or using the GinieSpace platform, website (<strong>https://ginie.space</strong>), mobile storefronts, application APIs, and associated WhatsApp automation tools (&quot;Service&quot;), you agree to be legally bound by these Terms and Conditions. If you are entering into this agreement on behalf of a business entity, shop, or partnership in India, you represent that you possess legal authority to bind such entity.
              </Paragraph>

              <Divider />

              <Title level={3} style={{ fontWeight: 700 }}>2. Platform Overview &amp; Software License</Title>
              <Paragraph style={{ lineHeight: 1.8, color: "#334155" }}>
                GinieSpace is an independent Software-as-a-Service (SaaS) utility designed to assist retail merchants, wholesale distributors, salons, and local business operators in managing product catalogs, processing direct bank UPI billing links, automating customer responses, and searching public business directories. GinieSpace provides software infrastructure and does not act as a payment bank or marketplace intermediary.
              </Paragraph>

              <Divider />

              <Title level={3} style={{ fontWeight: 700 }}>3. Merchant Account Responsibilities</Title>
              <Paragraph style={{ lineHeight: 1.8, color: "#334155" }}>
                To use GinieSpace, you must register using an authentic Indian mobile phone number. You agree to:
              </Paragraph>
              <ul style={{ lineHeight: 1.8, color: "#334155", paddingLeft: 20 }}>
                <li>Maintain accurate business profile information, shop address, and valid UPI VPA IDs.</li>
                <li>Safeguard your authentication credentials and linked WhatsApp session devices.</li>
                <li>Assume full responsibility for all activities, messages, transactions, and catalogs conducted under your account.</li>
              </ul>

              <Divider />

              <Title level={3} style={{ fontWeight: 700 }}>4. Subscription Plans &amp; Billing (PRO Tier)</Title>
              <Paragraph style={{ lineHeight: 1.8, color: "#334155" }}>
                GinieSpace provides tiered access:
              </Paragraph>
              <ul style={{ lineHeight: 1.8, color: "#334155", paddingLeft: 20 }}>
                <li><strong>Free Starter Tier:</strong> Available at ₹0 with core catalog creation and basic inbox management.</li>
                <li><strong>PRO Business Growth Tier:</strong> Billed at ₹99/month (or ₹999/year for 365 days). Activations require dynamic UPI transfer and manual/system verification of the 12-digit transaction UTR reference number.</li>
                <li>All prices are in Indian Rupees (INR) and are inclusive/exclusive of applicable Goods and Services Tax (GST) as mandated by Indian tax law.</li>
              </ul>

              <Divider />

              <Title level={3} style={{ fontWeight: 700 }}>5. Acceptable Use &amp; WhatsApp Anti-Spam Compliance</Title>
              <Paragraph style={{ lineHeight: 1.8, color: "#334155" }}>
                GinieSpace strictly enforces anti-abuse standards to protect merchants and consumers:
              </Paragraph>
              <ul style={{ lineHeight: 1.8, color: "#334155", paddingLeft: 20 }}>
                <li><strong>Zero Spamming Tolerance:</strong> You shall not transmit bulk unsolicited promotional broadcasts to individuals who have not consented or had a prior commercial relationship with your business.</li>
                <li><strong>Rate Limiting:</strong> All outbound automated messages must comply with GinieSpace&apos;s human-cadence rate limits and zero-width hash randomization safety protocols.</li>
                <li><strong>Prohibited Goods:</strong> You shall not list, offer, or sell illegal items including firearms, narcotics, prescription-restricted substances, counterfeit goods, or adult content.</li>
                <li>GinieSpace reserves the right to immediately suspend or permanently terminate accounts found violating these provisions without prior notice or refund.</li>
              </ul>

              <Divider />

              <Title level={3} style={{ fontWeight: 700 }}>6. Meta / WhatsApp &amp; Google Nominative Fair Use Disclaimer</Title>
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
                <strong>IMPORTANT TRADEMARK NOTICE:</strong> GinieSpace is an independent SaaS business automation software developed by its creators. GinieSpace is not affiliated, associated, authorized, endorsed by, or in any way officially connected with Meta Platforms, Inc., WhatsApp LLC, or Google LLC. WhatsApp™ is a registered trademark of WhatsApp LLC and Meta Platforms, Inc. Google Maps™ and Google Places™ are registered trademarks of Google LLC. References to these marks are strictly for nominative, descriptive, and compatibility purposes under applicable trademark law.
              </div>

              <Divider />

              <Title level={3} style={{ fontWeight: 700 }}>7. Direct UPI Payments (0% Gateway Commission)</Title>
              <Paragraph style={{ lineHeight: 1.8, color: "#334155" }}>
                GinieSpace facilitates peer-to-peer / peer-to-merchant UPI URI generation. Payments initiated by customers transfer 100% of funds directly to the merchant&apos;s linked UPI bank account (Google Pay, PhonePe, Paytm, BHIM) with zero gateway commission deducted by GinieSpace. GinieSpace is not a payment escrow service and does not hold merchant funds.
              </Paragraph>

              <Divider />

              <Title level={3} style={{ fontWeight: 700 }}>8. 72-Hour Ephemeral WhatsApp Data Retention</Title>
              <Paragraph style={{ lineHeight: 1.8, color: "#334155" }}>
                In accordance with India&apos;s Digital Personal Data Protection (DPDP) Act 2023, GinieSpace applies a strict 72-hour ephemeral retention policy. Chat messages processed through the business inbox are retained for a maximum of seventy-two (72) hours to provide active commercial context and are subsequently purged permanently from database and cache storage.
              </Paragraph>

              <Divider />

              <Title level={3} style={{ fontWeight: 700 }}>9. Limitation of Liability</Title>
              <Paragraph style={{ lineHeight: 1.8, color: "#334155" }}>
                To the fullest extent permitted by Indian law, GinieSpace, its directors, developers, and partners shall not be liable for any indirect, incidental, punitive, or consequential damages resulting from third-party network outages, telecom carrier blocks, WhatsApp Multi-Device session disconnects, or customer disputes. GinieSpace&apos;s maximum aggregate liability shall be strictly limited to the subscription fee amount paid by you in the preceding three (3) months.
              </Paragraph>

              <Divider />

              <Title level={3} style={{ fontWeight: 700 }}>10. Governing Law &amp; Grievance Redressal</Title>
              <Paragraph style={{ lineHeight: 1.8, color: "#334155" }}>
                These Terms shall be governed by and construed in accordance with the laws of the Republic of India. Any disputes arising out of or in connection with these Terms shall be subject to the exclusive jurisdiction of the competent courts in Bihar, India.
              </Paragraph>
              <div style={{ marginTop: 12, padding: "14px 18px", background: "#f8fafc", borderRadius: 10, border: "1px solid #e2e8f0" }}>
                <div><strong>Official Grievance Officer:</strong> GinieSpace Compliance Unit</div>
                <div><MailOutlined style={{ marginRight: 6 }} /> Email: <strong>info.giniespace@gmail.com</strong></div>
                <div><PhoneOutlined style={{ marginRight: 6 }} /> WhatsApp Support Helpline: <strong>+91 92792 59690</strong></div>
              </div>
            </div>
          ) : (
            <div>
              <Title level={3} style={{ fontWeight: 700 }}>1. Niyam Aur Sharton Ka Sveekar</Title>
              <Paragraph style={{ lineHeight: 1.8, color: "#334155" }}>
                GinieSpace platform, website (<strong>https://ginie.space</strong>), digital storefronts aur WhatsApp CRM software ka upyog karke aap in niyamon aur sharton se baandhit hone ke liye poori tarah sahmat hote hain. Agar aap kisi dukan ya business ke behalf par iska upyog kar rahe hain, to aapke paas use represent karne ka legal adhikar hona chahiye.
              </Paragraph>

              <Divider />

              <Title level={3} style={{ fontWeight: 700 }}>2. Platform Ka Swaroop Aur License</Title>
              <Paragraph style={{ lineHeight: 1.8, color: "#334155" }}>
                GinieSpace ek independent Software-as-a-Service (SaaS) platform hai jo retailers, wholesalers aur service providers ko online catalog banane, direct bank UPI payment collect karne, aur local B2B leads nikaalne ki suvidha deta hai. GinieSpace ek software tool hai, koi payment gateway ya intermediary nahi.
              </Paragraph>

              <Divider />

              <Title level={3} style={{ fontWeight: 700 }}>3. Dukaandar (Merchant) Ki Zimmedariyan</Title>
              <Paragraph style={{ lineHeight: 1.8, color: "#334155" }}>
                GinieSpace par account banate samay aapko sahi jankari deni hogi:
              </Paragraph>
              <ul style={{ lineHeight: 1.8, color: "#334155", paddingLeft: 20 }}>
                <li>Apna sahi business name, address aur UPI ID maintain rakhna.</li>
                <li>Apne account login aur WhatsApp paired session ki suraksha rakhna.</li>
                <li>Aapke account dwara bheje gaye sabhi messages, orders aur catalog ke liye aap swayam zimmedar honge.</li>
              </ul>

              <Divider />

              <Title level={3} style={{ fontWeight: 700 }}>4. Subscription Plans Aur Billing (PRO Tier)</Title>
              <Paragraph style={{ lineHeight: 1.8, color: "#334155" }}>
                GinieSpace par do prakar ke plans uplabdh hain:
              </Paragraph>
              <ul style={{ lineHeight: 1.8, color: "#334155", paddingLeft: 20 }}>
                <li><strong>Free Starter Tier:</strong> ₹0 me basic catalog aur limited features ke sath lifetime free.</li>
                <li><strong>PRO Business Tier:</strong> ₹99/mahina ya ₹999/saal. Dynamic UPI payment transfer aur 12-digit UTR verification ke baad turant activate hota hai.</li>
                <li>Sabhi fees Indian Rupees (INR) me hain aur GST niyamon ke antargat aati hain.</li>
              </ul>

              <Divider />

              <Title level={3} style={{ fontWeight: 700 }}>5. WhatsApp Anti-Spam Aur Fair Use Policy</Title>
              <Paragraph style={{ lineHeight: 1.8, color: "#334155" }}>
                GinieSpace anchahe bulk spam messages ki sakht khilafat karta hai:
              </Paragraph>
              <ul style={{ lineHeight: 1.8, color: "#334155", paddingLeft: 20 }}>
                <li>Aap kisi anjaan vyakti ko bina uski anumati ke bulk promotions nahi bhej sakte.</li>
                <li>Kanoonan ban items (hathiyar, nasheeli dawayein, counterfeit products) bechna strictly mana hai.</li>
                <li>Niyamon ka ullanghan karne par bina kisi refund ke account turant band kiya ja sakta hai.</li>
              </ul>

              <Divider />

              <Title level={3} style={{ fontWeight: 700 }}>6. Meta / WhatsApp Aur Google Ka Disclaimer</Title>
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
                <strong>Kanooni Disclaimer:</strong> GinieSpace ek independent software hai aur iska Meta Platforms, Inc., WhatsApp LLC, ya Google LLC ke sath koi official relation ya endorsement nahi hai. WhatsApp™ aur Google Maps™ unke respective owners ke registered trademarks hain.
              </div>

              <Divider />

              <Title level={3} style={{ fontWeight: 700 }}>7. Direct Bank UPI Payments (0% Commission)</Title>
              <Paragraph style={{ lineHeight: 1.8, color: "#334155" }}>
                GinieSpace par customer dwara kiya gaya payment seedhe dukaandar ke bank account me jata hai. GinieSpace kisi bhi transaction par 2-3% ka gateway cut nahi leta aur na hi dukaandar ka paisa apne paas hold karta hai.
              </Paragraph>

              <Divider />

              <Title level={3} style={{ fontWeight: 700 }}>8. 72 Ghante Me Chats Ka Auto-Erase (Privacy)</Title>
              <Paragraph style={{ lineHeight: 1.8, color: "#334155" }}>
                GinieSpace par customer chats sirf 72 ghante (3 din) tak database me rehte hain business context ke liye, aur uske baad automatic permanent delete ho jate hain taaki grahak aur vyapari ki privacy safe rahe.
              </Paragraph>

              <Divider />

              <Title level={3} style={{ fontWeight: 700 }}>9. Kanooni Adhikar Kshetra Aur Helpline</Title>
              <Paragraph style={{ lineHeight: 1.8, color: "#334155" }}>
                Ye shartein Bharat ke kanoon ke antargat aati hain aur kisi bhi vivad ka niptara Bihar/Bharat ke nyayalayon me hoga.
              </Paragraph>
              <div style={{ marginTop: 12, padding: "14px 18px", background: "#f8fafc", borderRadius: 10, border: "1px solid #e2e8f0" }}>
                <div><strong>Grievance &amp; Support Contact:</strong></div>
                <div><MailOutlined style={{ marginRight: 6 }} /> Email: <strong>info.giniespace@gmail.com</strong></div>
                <div><PhoneOutlined style={{ marginRight: 6 }} /> WhatsApp Support: <strong>+91 92792 59690</strong></div>
              </div>
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}
