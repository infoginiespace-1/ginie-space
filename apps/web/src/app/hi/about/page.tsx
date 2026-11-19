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
  title: "गिन्नीस्पेस का परिचय — भारत का 0% कमीशन व्हाट्सएप कॉमर्स इंजन | GinieSpace",
  description:
    "जानिए गिन्नीस्पेस के बारे में — भारत का अग्रणी 0% कमीशन व्हाट्सएप क्लाउड कॉमर्स और डायरेक्ट बैंक UPI बिलिंग सॉफ्टवेयर। खुदरा दुकानों और थोक व्यापारियों को आत्मनिर्भर बनाने का डिजिटल मंच।",
  alternates: {
    canonical: "https://app.ginie.space/hi/about",
    languages: {
      "en-IN": "https://app.ginie.space/about",
      "hi-IN": "https://app.ginie.space/hi/about",
      "x-default": "https://app.ginie.space/about",
    },
  },
  openGraph: {
    title: "गिन्नीस्पेस का परिचय — भारत का 0% कमीशन व्हाट्सएप कॉमर्स इंजन | GinieSpace",
    description:
      "गिन्नीस्पेस भारत के खुदरा व किराना व्यापारियों को 0% कमीशन व्हाट्सएप कॉमर्स और डायरेक्ट बैंक UPI सेटलमेंट से सशक्त बनाता है।",
    url: "https://app.ginie.space/hi/about",
    siteName: "GinieSpace",
    locale: "hi_IN",
    type: "website",
    images: [{ url: "https://app.ginie.space/og-catalog.jpg", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "GinieSpace - भारत का 0% कमीशन व्हाट्सएप कॉमर्स सॉफ्टवेयर",
    description:
      "भारतीय खुदरा और थोक व्यापारियों के लिए 0% कमीशन व्हाट्सएप कॉमर्स और डायरेक्ट बैंक UPI बिलिंग इंजन।",
    images: ["https://app.ginie.space/og-catalog.jpg"],
  },
};

export default function HindiAboutPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    "name": "गिन्नीस्पेस का परिचय",
    "url": "https://app.ginie.space/hi/about",
    "description":
      "गिन्नीस्पेस के मिशन, 0% कमीशन डायरेक्ट UPI सेटलमेंट और भारत के छोटे व्यापारियों को सशक्त बनाने के बारे में जानें।",
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
      <MarketingNav currentPath="/hi/about" lang="hi" />

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
          🇮🇳 मिशन व डिजिटल कॉमर्स इंफ्रास्ट्रक्चर
        </span>
        <h1
          style={{
            fontSize: "clamp(2rem, 4vw, 3rem)",
            fontWeight: 900,
            letterSpacing: "-0.03em",
            lineHeight: 1.25,
            margin: "0 auto 16px",
            maxWidth: 920,
          }}
        >
          भारत के छोटे व्यापारियों के लिए व्हाट्सएप कॉमर्स और{" "}
          <span style={{ color: "#059669" }}>0% कमीशन डायरेक्ट UPI</span> की नई शुरुआत
        </h1>
        <p style={{ fontSize: "clamp(1rem, 2vw, 1.15rem)", color: "#64748b", maxWidth: 760, margin: "0 auto", lineHeight: 1.7 }}>
          भारतीय खुदरा व किराना दुकानदारों, कपड़ा व्यापारियों और थोक वितरकों को 2% से 3% पेमेंट गेटवे कमीशन, जटिल POS मशीनों और बिचौलियों से मुक्त करने का डिजिटल संकल्प।
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
                ✓ सत्यापित क्लाउड प्लेटफॉर्म
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
                रजिस्टर्ड ऑपरेटिंग हब
              </div>
              <div style={{ fontSize: 14, color: "#f8fafc", fontWeight: 700, marginTop: 6 }}>
                🏢 बोरिंग रोड, पटना, बिहार 800001, भारत
              </div>
              <div style={{ fontSize: 13, color: "#cbd5e1", marginTop: 4, lineHeight: 1.5 }}>
                🇮🇳 संपूर्ण भारत में किराना, रिटेल व होलसेल व्यापारियों की सेवा में
              </div>
            </div>

            {/* Contact Details */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 13, color: "#cbd5e1", textAlign: "left" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <EnvironmentOutlined style={{ color: "#f59e0b" }} />
                <span>पटना / संपूर्ण भारत</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <MailOutlined style={{ color: "#38bdf8" }} />
                <a href="mailto:info.giniespace@gmail.com" style={{ color: "#38bdf8", textDecoration: "none" }}>
                  info.giniespace@gmail.com
                </a>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <PhoneOutlined style={{ color: "#25D366" }} />
                <span>आधिकारिक हेल्पलाइन: +91 92792 59690</span>
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
              <span>हमारा मुख्य संकल्प व प्रतिबद्धता</span>
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
                &ldquo;भारत की असली आर्थिक ताक़त हमारे किराना दुकानदार, कपड़ा व्यापारी और थोक वितरक हैं। उन्हें अपने मुनाफे का 2% से 3% हिस्सा पेमेंट गेटवे कंपनियों को क्यों गंवाना पड़े, या भारी-भरकम महंगे सॉफ़्टवेयर की जटिलताओं में क्यों उलझना पड़े? गिन्नीस्पेस को हमने इसी सोच के साथ बनाया है कि कोई भी व्यापारी बिना किसी कमीशन के 60 सेकंड में अपना व्हाट्सएप स्टोर चालू कर सके और सीधे बैंक में 100% UPI भुगतान पा सके।&rdquo;
              </p>
            </div>

            <h3 style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", marginBottom: 12 }}>
              कहानी: व्यापारी के स्वावलंबन और डिजिटल स्वतंत्रता की शुरुआत
            </h3>
            <p style={{ color: "#475569", fontSize: 15, lineHeight: 1.8, marginBottom: 16 }}>
              गिन्नीस्पेस की नींव इस मूलभूत सिद्धांत पर रखी गई है: <strong>तकनीक को व्यापारी की ताक़त बनना चाहिए, उस पर कर नहीं।</strong> वर्षों से भारतीय व्यापारियों के सामने केवल दो ही रास्ते थे: या तो बही-खातों में उलझे रहें, या फिर बड़े एग्रीगेटर ऐप्स को 2–3% का भारी कमीशन और अपने ग्राहकों का डेटा सौंप दें।
            </p>
            <p style={{ color: "#475569", fontSize: 15, lineHeight: 1.8, marginBottom: 24 }}>
              मल्टी-डिवाइस व्हाट्सएप ऑटोमेशन और 100% डायरेक्ट भारत UPI QR सेटलमेंट के साथ, गिन्नीस्पेस हर व्यापारी को एक ऐसा आधुनिक डिजिटल स्टोर प्रदान करता है जिसमें न कोई कमीशन कटता है और न ही किसी अतिरिक्त मशीन या कंप्यूटर की ज़रूरत पड़ती है।
            </p>

            {/* Badges Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginBottom: 28 }}>
              <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", padding: "12px 16px", borderRadius: 10, fontSize: 13, fontWeight: 600, color: "#334155" }}>
                ⚡ 60-सेकंड इंस्टेंट सेटअप
              </div>
              <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", padding: "12px 16px", borderRadius: 10, fontSize: 13, fontWeight: 600, color: "#334155" }}>
                ⚡ रियल-टाइम सॉकेट आर्किटेक्चर
              </div>
              <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", padding: "12px 16px", borderRadius: 10, fontSize: 13, fontWeight: 600, color: "#334155" }}>
                🇮🇳 100% भारत के एमएसएमई के लिए निर्मित
              </div>
              <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", padding: "12px 16px", borderRadius: 10, fontSize: 13, fontWeight: 600, color: "#334155" }}>
                🛡️ 0% कमीशन व DPDP सुरक्षित
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
                मुफ्त में स्टोर बनाएं (₹0) <ArrowRightOutlined />
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
                व्हाट्सएप हेल्पलाइन से जुड़ें
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 4 Core Pillars Section */}
      <section style={{ maxWidth: 1140, margin: "0 auto 64px", padding: "0 20px" }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <span style={{ color: "#059669", fontWeight: 700, fontSize: 13, textTransform: "uppercase" }}>
            हमारे 4 मुख्य सिद्धांत
          </span>
          <h2 style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)", fontWeight: 800, margin: "8px 0" }}>
            गिन्नीस्पेस की प्रतिबद्धताएं
          </h2>
          <p style={{ color: "#64748b", maxWidth: 600, margin: "0 auto" }}>
            व्यापारी की गोपनीयता, स्वावलंबन और सम्मान की सुरक्षा के लिए पूर्णतः समर्पित।
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 24 }}>
          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: "28px 24px" }}>
            <BankOutlined style={{ fontSize: 32, color: "#059669", marginBottom: 16 }} />
            <h3 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 8px" }}>0% पेमेंट कमीशन</h3>
            <p style={{ color: "#64748b", fontSize: 14, lineHeight: 1.6, margin: 0 }}>
              हम कभी भी व्यापारी का पैसा अपने पास नहीं रोकते। ग्राहक का 100% भुगतान सीधे आपके बैंक खाते में जमा होता है।
            </p>
          </div>

          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: "28px 24px" }}>
            <LockOutlined style={{ fontSize: 32, color: "#2563eb", marginBottom: 16 }} />
            <h3 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 8px" }}>DPDP 2023 गोपनीयता</h3>
            <p style={{ color: "#64748b", fontSize: 14, lineHeight: 1.6, margin: 0 }}>
              72 घंटे की सख्त चैट नीति के तहत ग्राहक के संदेश स्थायी रूप से हटा दिए जाते हैं ताकि किसी का व्यक्तिगत डेटा सुरक्षित रहे।
            </p>
          </div>

          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: "28px 24px" }}>
            <ThunderboltFilled style={{ fontSize: 32, color: "#f59e0b", marginBottom: 16 }} />
            <h3 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 8px" }}>आसान और तेज़</h3>
            <p style={{ color: "#64748b", fontSize: 14, lineHeight: 1.6, margin: 0 }}>
              न लैपटॉप, न कोडिंग, न महंगी मशीनें। सिर्फ अपने मोबाइल से 60 सेकंड में अपनी दुकान लाइव करें।
            </p>
          </div>

          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: "28px 24px" }}>
            <TeamOutlined style={{ fontSize: 32, color: "#7c3aed", marginBottom: 16 }} />
            <h3 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 8px" }}>सीधा मानवीय समर्थन</h3>
            <p style={{ color: "#64748b", fontSize: 14, lineHeight: 1.6, margin: 0 }}>
              सप्ताह के 6 दिन व्हाट्सएप और फोन (+91 92792 59690) पर हमारी तकनीकी टीम से अपनी भाषा में सीधी सहायता प्राप्त करें।
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
            क्या आप अपनी दुकान को ऑनलाइन ले जाने के लिए तैयार हैं?
          </h2>
          <p style={{ color: "#ecfdf5", fontSize: 16, maxWidth: 600, margin: "0 auto 24px" }}>
            आज ही भारत के हजारों खुदरा और थोक व्यापारियों से जुड़ें जो गिन्नीस्पेस पर भरोसा करते हैं।
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
              मुफ्त खाता बनाएं (₹0) →
            </Link>
            <Link
              href="/hi/pricing"
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
              PRO प्लान देखें (₹199)
            </Link>
          </div>
        </div>
      </section>

      <MarketingFooter lang="hi" />
    </div>
  );
}
