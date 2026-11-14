"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Typography, Card, Divider, Space, Button, Tag, Segmented } from "antd";
import {
  ArrowLeftOutlined,
  LockFilled,
  PhoneOutlined,
  MailOutlined,
  ShieldCheckOutlined,
} from "@ant-design/icons";

const { Title, Paragraph } = Typography;

export default function PrivacyPolicyPage() {
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
            <LockFilled style={{ marginRight: 4 }} /> Data Protection &amp; DPDP Act 2023
          </Tag>
          <Title level={1} style={{ color: "#fff", margin: 0, fontWeight: 800 }}>
            {lang === "en" ? "Privacy Policy" : "Gopniyata Niti (Privacy Policy)"}
          </Title>
          <Paragraph style={{ color: "#d1fae5", fontSize: 15, marginTop: 10, maxWidth: 650, margin: "10px auto 0" }}>
            {lang === "en"
              ? "How GinieSpace protects merchant and customer data, enforces 72-hour ephemeral chat retention, and guarantees zero third-party data selling."
              : "Janiye GinieSpace vyapariyon aur grahakon ka data kaise surakshit rakhta hai aur 72 ghante me chat auto-erase karta hai."}
          </Paragraph>
          <div style={{ fontSize: 12, color: "#a7f3d0", marginTop: 12 }}>
            Effective Date: November 1, 2026 • Compliant with Digital Personal Data Protection Act 2023 (India)
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
              <Title level={3} style={{ fontWeight: 700 }}>1. Commitment to Privacy</Title>
              <Paragraph style={{ lineHeight: 1.8, color: "#334155" }}>
                GinieSpace (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) values the privacy and commercial confidentiality of every Indian merchant and their end-customers. This Privacy Policy details the types of personal data we collect, how it is processed, stored, and our strict safeguards against unauthorized access or data monetization.
              </Paragraph>

              <Divider />

              <Title level={3} style={{ fontWeight: 700 }}>2. Information We Collect</Title>
              <Paragraph style={{ lineHeight: 1.8, color: "#334155" }}>
                We collect only the minimum necessary information to operate your business commerce software:
              </Paragraph>
              <ul style={{ lineHeight: 1.8, color: "#334155", paddingLeft: 20 }}>
                <li><strong>Merchant Account Details:</strong> Name, mobile phone number, business trade name, shop address, business category (Retail, Wholesale, Services), and linked UPI VPA ID.</li>
                <li><strong>Customer Order Information:</strong> Customer contact name, delivery address, ordered items, and WhatsApp mobile number submitted during digital storefront checkout.</li>
                <li><strong>Technical Diagnostics:</strong> IP address, browser type, device information, and anonymous performance logs to ensure system reliability and uptime.</li>
              </ul>

              <Divider />

              <Title level={3} style={{ fontWeight: 700 }}>3. Mandatory 72-Hour Ephemeral WhatsApp Chat Retention</Title>
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
                <strong>🛡️ 72-HOUR AUTO-ERASE PRIVACY POLICY:</strong>
                <p style={{ margin: "6px 0 0", color: "#1e293b" }}>
                  Unlike traditional platforms that archive customer conversations permanently, GinieSpace implements an automated retention lifecycle. <strong>All incoming and outgoing business WhatsApp messages are automatically and permanently purged from server memory and database storage exactly seventy-two (72) hours after transmission.</strong>
                </p>
                <p style={{ margin: "6px 0 0", color: "#475569", fontSize: 13 }}>
                  This guarantees high-standard privacy, compliance with India&apos;s DPDP Act 2023, and zero risk of long-term data leaks for your shoppers.
                </p>
              </div>

              <Divider />

              <Title level={3} style={{ fontWeight: 700 }}>4. WhatsApp Multi-Device &amp; LID Resolution Safeguards</Title>
              <Paragraph style={{ lineHeight: 1.8, color: "#334155" }}>
                GinieSpace interfaces with WhatsApp via secure Multi-Device session pairing. We adhere to the following principles:
              </Paragraph>
              <ul style={{ lineHeight: 1.8, color: "#334155", paddingLeft: 20 }}>
                <li>We do NOT read, monitor, or store personal one-on-one chats between you and your personal contacts (friends/family).</li>
                <li>Our software strictly processes business customer interactions initiated via your public storefront or merchant phone.</li>
                <li>WhatsApp Linked Identity (LID) values are respected and protected against unintended disclosure.</li>
              </ul>

              <Divider />

              <Title level={3} style={{ fontWeight: 700 }}>5. Zero Third-Party Data Selling Guarantee</Title>
              <Paragraph style={{ lineHeight: 1.8, color: "#334155" }}>
                We believe your business contacts are your greatest asset. <strong>We do NOT sell, rent, license, or trade merchant or customer data to third-party advertisers, data aggregators, or marketing firms under any circumstances.</strong> Data collected is used solely to deliver the software functionality you have subscribed to.
              </Paragraph>

              <Divider />

              <Title level={3} style={{ fontWeight: 700 }}>6. Cloud Database &amp; Data Security</Title>
              <Paragraph style={{ lineHeight: 1.8, color: "#334155" }}>
                GinieSpace utilizes industry-standard security protocols:
              </Paragraph>
              <ul style={{ lineHeight: 1.8, color: "#334155", paddingLeft: 20 }}>
                <li>Encrypted in-transit communication via Transport Layer Security (TLS 1.3 / HTTPS).</li>
                <li>JWT-based cryptographically signed merchant session tokens.</li>
                <li>Encrypted database storage integrated with Google Cloud Platform and secure cloud instances.</li>
              </ul>

              <Divider />

              <Title level={3} style={{ fontWeight: 700 }}>7. Your Rights under India DPDP Act 2023</Title>
              <Paragraph style={{ lineHeight: 1.8, color: "#334155" }}>
                As a Data Principal under Indian law, you possess:
              </Paragraph>
              <ul style={{ lineHeight: 1.8, color: "#334155", paddingLeft: 20 }}>
                <li><strong>Right of Access &amp; Correction:</strong> You can review, update, or edit your catalog, products, and profile at any time in Settings.</li>
                <li><strong>Right to Erasure (Account Deletion):</strong> You can request complete deletion of your merchant account, sessions, and catalog data by emailing our grievance desk.</li>
                <li><strong>Right to Grievance Redressal:</strong> Rapid redressal of any privacy concerns within prescribed statutory timelines.</li>
              </ul>

              <Divider />

              <Title level={3} style={{ fontWeight: 700 }}>8. Designated Privacy &amp; Grievance Officer</Title>
              <Paragraph style={{ lineHeight: 1.8, color: "#334155" }}>
                For questions, clarifications, or requests concerning your data privacy, contact our designated Grievance Officer:
              </Paragraph>
              <div style={{ padding: "14px 18px", background: "#f8fafc", borderRadius: 10, border: "1px solid #e2e8f0" }}>
                <div><strong>Grievance Redressal Unit:</strong> GinieSpace Privacy Desk</div>
                <div><MailOutlined style={{ marginRight: 6 }} /> Official Email: <strong>info.giniespace@gmail.com</strong></div>
                <div><PhoneOutlined style={{ marginRight: 6 }} /> WhatsApp Helpline: <strong>+91 92792 59690</strong></div>
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>Jurisdiction: Republic of India</div>
              </div>
            </div>
          ) : (
            <div>
              <Title level={3} style={{ fontWeight: 700 }}>1. Gopniyata Ke Prati Hamara Sankalp</Title>
              <Paragraph style={{ lineHeight: 1.8, color: "#334155" }}>
                GinieSpace vyapariyon aur unke grahakon ke business data ki gopniyata ka poora samman karta hai. Is Privacy Policy me bataya gaya hai ki hum konsa data lete hain aur use kaise surakshit rakhte hain.
              </Paragraph>

              <Divider />

              <Title level={3} style={{ fontWeight: 700 }}>2. Konsa Data Collect Hota Hai</Title>
              <Paragraph style={{ lineHeight: 1.8, color: "#334155" }}>
                Hum kewal wahi jankari lete hain jo business software chalane ke liye anivarya hai:
              </Paragraph>
              <ul style={{ lineHeight: 1.8, color: "#334155", paddingLeft: 20 }}>
                <li><strong>Vyapari Ki Jankari:</strong> Name, WhatsApp mobile number, shop ka naam, pata aur UPI ID.</li>
                <li><strong>Customer Order Info:</strong> Customer ka naam, WhatsApp number aur delivery pata jo storefront par order ke samay diya jata hai.</li>
                <li><strong>Technical Info:</strong> System uptime aur error logging ke liye zaroori basic technical data.</li>
              </ul>

              <Divider />

              <Title level={3} style={{ fontWeight: 700 }}>3. 72 Ghante Me Chats Ka Auto-Erase (Vishesh Suvidha)</Title>
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
                <strong>🛡️ 72-GHANTE AUTO-ERASE POLICY:</strong>
                <p style={{ margin: "6px 0 0", color: "#1e293b" }}>
                  GinieSpace par WhatsApp messages hamesha ke liye jama nahi rehte. <strong>Order bhejne aur lene ke theek 72 ghante (3 din) baad saare chat messages server database se automatically permanent delete ho jate hain.</strong>
                </p>
                <p style={{ margin: "6px 0 0", color: "#475569", fontSize: 13 }}>
                  Isse aapke grahakon ki privacy 100% safe rehti hai aur kisi data leak ka dar nahi rehta.
                </p>
              </div>

              <Divider />

              <Title level={3} style={{ fontWeight: 700 }}>4. Personal Chats Ko Access Nahi Karte</Title>
              <Paragraph style={{ lineHeight: 1.8, color: "#334155" }}>
                GinieSpace sirf wahi messages process karta hai jo business orders ya catalog query ke hote hain. Aapke personal WhatsApp par pariwar ya dosto ke messages ko GinieSpace na to read karta hai aur na hi store karta hai.
              </Paragraph>

              <Divider />

              <Title level={3} style={{ fontWeight: 700 }}>5. Zero Data Selling Guarantee</Title>
              <Paragraph style={{ lineHeight: 1.8, color: "#334155" }}>
                <strong>GinieSpace kisi bhi dukaandar ya customer ka data kisi third-party ad company ya telemarketer ko na bechta hai aur na hi rent karta hai.</strong> Aapka data sirf aapke vyapar ke liye hai.
              </Paragraph>

              <Divider />

              <Title level={3} style={{ fontWeight: 700 }}>6. DPDP Act 2023 Ke Antargat Aapke Adhikar</Title>
              <Paragraph style={{ lineHeight: 1.8, color: "#334155" }}>
                Bharat ke naye data kanoon ke antargat aapke paas ye adhikar hain:
              </Paragraph>
              <ul style={{ lineHeight: 1.8, color: "#334155", paddingLeft: 20 }}>
                <li>Aap Settings me jakar apna data kisi bhi samay update ya edit kar sakte hain.</li>
                <li>Aap chahein to apna poora account aur catalog permanent delete karwane ke liye hamari support team se sampark kar sakte hain.</li>
              </ul>

              <Divider />

              <Title level={3} style={{ fontWeight: 700 }}>7. Grievance Officer Aur Helpline</Title>
              <div style={{ padding: "14px 18px", background: "#f8fafc", borderRadius: 10, border: "1px solid #e2e8f0" }}>
                <div><strong>Privacy &amp; Support Contact:</strong></div>
                <div><MailOutlined style={{ marginRight: 6 }} /> Email: <strong>info.giniespace@gmail.com</strong></div>
                <div><PhoneOutlined style={{ marginRight: 6 }} /> WhatsApp Helpline: <strong>+91 92792 59690</strong></div>
              </div>
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}
