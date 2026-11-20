import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import MarketingNav from "@/components/MarketingNav";
import MarketingFooter from "@/components/MarketingFooter";
import { CheckCircleFilled, ArrowRightOutlined, SafetyCertificateOutlined } from "@ant-design/icons";

export const metadata: Metadata = {
  title: "100% फ्री फॉरएवर - ₹0 प्लेटफॉर्म फीस और 0% कमीशन | GinieSpace",
  description:
    "GinieSpace सभी भारतीय दुकानदारों के लिए 100% फ्री है। जीरो मंथली सब्सक्रिप्शन, 0% UPI गेटवे कमीशन, अनलिमिटेड कैटलॉग और ऑटोमेटेड व्हाट्सएप बिलिंग।",
  alternates: {
    canonical: "https://app.ginie.space/hi/pricing",
    languages: {
      "en-IN": "https://app.ginie.space/pricing",
      "hi-IN": "https://app.ginie.space/hi/pricing",
      "x-default": "https://app.ginie.space/pricing",
    },
  },
  openGraph: {
    title: "100% फ्री फॉरएवर - ₹0 प्लेटफॉर्म फीस और 0% कमीशन | GinieSpace",
    description:
      "भारतीय खुदरा और थोक व्यापारियों के लिए 0% कमीशन डायरेक्ट बैंक UPI बिलिंग और ऑटोमेटेड व्हाट्सएप डिजिटल स्टोर।",
    url: "https://app.ginie.space/hi/pricing",
    siteName: "GinieSpace",
    locale: "hi_IN",
    type: "website",
    images: [{ url: "https://app.ginie.space/og-catalog.jpg", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "GinieSpace 100% फ्री फॉरएवर: ₹0 प्लेटफॉर्म फीस और 0% कमीशन",
    description: "0% पेमेंट गेटवे कट। 100% डायरेक्ट बैंक ट्रांसफर। भारतीय किराना और थोक दुकानों के लिए विशेष रूप से निर्मित।",
    images: ["https://app.ginie.space/og-catalog.jpg"],
  },
};

export default function HindiPricingPage() {
  const freeFeatures = [
    { title: "अनलिमिटेड कैटलॉग आइटम्स", desc: "जितने चाहें उतने प्रोडक्ट्स, दाम, फोटो और स्टॉक बिना किसी लिमिट के जोड़ें।" },
    { title: "0% UPI पेमेंट कमीशन", desc: "ग्राहक का 100% पैसा बिना किसी 2-3% गेटवे कट के सीधे आपके बैंक खाते में जाता है।" },
    { title: "24/7 डिजिटल स्टोर लिंक", desc: "शेयर करने योग्य पब्लिक स्टोर लिंक (app.ginie.space/shop/your-store) कार्ट चेकआउट के साथ।" },
    { title: "व्हाट्सएप पर ऑटो ऑर्डर्स", desc: "सामान की पूरी लिस्ट, ग्राहक का पता और पेमेंट स्क्रीनशॉट सीधे व्हाट्सएप पर पाएं।" },
    { title: "मल्टी-स्टाफ अकाउंट्स", desc: "अपनी दुकान के स्टाफ और कर्मचारियों के लिए अलग-अलग लॉगिन और अनुमतियां सेट करें।" },
    { title: "ग्राहक खाता व उधारी बही", desc: "उधारी बैलेंस ट्रैक करें और ग्राहकों को 1-क्लिक में ऑटोमेटेड व्हाट्सएप तकादा भेजें।" },
    { title: "थर्मल POS व A4 GST इनवॉइस", desc: "कुछ ही सेकंड में पक्के GST टैक्स इनवॉइस और 80mm थर्मल प्रिंट पर्ची निकालें।" },
    { title: "साउंडबॉक्स ऑडियो अलर्ट्स", desc: "दुकान के काउंटर पर नए ऑर्डर और पेमेंट की हिंदी आवाज में घोषणा।" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", color: "#0f172a" }}>
      <MarketingNav currentPath="/hi/pricing" lang="hi" />

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
          🎁 सभी भारतीय व्यापारियों के लिए 100% फ्री फॉरएवर
        </span>
        <h1
          style={{
            fontSize: "clamp(2rem, 4vw, 3.2rem)",
            fontWeight: 800,
            lineHeight: 1.25,
            letterSpacing: "-0.02em",
            maxWidth: 900,
            margin: "0 auto 16px",
          }}
        >
          जीरो सब्सक्रिप्शन। जीरो कमीशन। हमेशा 100% फ्री।
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
          GinieSpace का संकल्प है कि भारत के खुदरा दुकानदारों, थोक व्यापारियों और सर्विस सेंटर्स को <strong>₹0 प्लेटफॉर्म फीस</strong> और <strong>0% पेमेंट कमीशन</strong> के साथ आत्मनिर्भर बनाया जाए।
        </p>

        {/* Hero Card */}
        <div
          style={{
            maxWidth: 800,
            margin: "0 auto 64px",
            background: "#ffffff",
            borderRadius: 24,
            padding: "40px 32px",
            boxShadow: "0 12px 40px rgba(16, 185, 129, 0.12)",
            border: "2px solid #bbf7d0",
            textAlign: "center",
          }}
        >
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#f0fdf4", padding: "6px 16px", borderRadius: 999, color: "#15803d", fontWeight: 700, fontSize: 13, marginBottom: 20 }}>
            <SafetyCertificateOutlined /> लाइफटाइम फ्री प्लान
          </div>
          <div style={{ fontSize: "clamp(3rem, 6vw, 4.5rem)", fontWeight: 900, color: "#0f172a", lineHeight: 1, marginBottom: 8 }}>
            ₹0 <span style={{ fontSize: "1.2rem", fontWeight: 500, color: "#64748b" }}>/ हमेशा के लिए</span>
          </div>
          <p style={{ color: "#64748b", fontSize: 15, maxWidth: 500, margin: "0 auto 28px" }}>
            कोई क्रेडिट कार्ड जरूरी नहीं। कोई समय सीमा या ट्रायल एक्सपायरी नहीं। आपकी दुकान के लिए सभी फीचर्स पूरी तरह अनलॉक।
          </p>

          <Link
            href="/signup"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              background: "#25D366",
              color: "#ffffff",
              padding: "16px 36px",
              borderRadius: 12,
              fontWeight: 800,
              fontSize: 16,
              textDecoration: "none",
              boxShadow: "0 8px 24px rgba(37, 211, 102, 0.35)",
            }}
          >
            अपनी फ्री दुकान अभी शुरू करें <ArrowRightOutlined />
          </Link>
        </div>

        {/* Feature Grid */}
        <div style={{ maxWidth: 1000, margin: "0 auto 64px", textAlign: "left" }}>
          <h2 style={{ fontSize: 24, fontWeight: 800, textAlign: "center", marginBottom: 36 }}>
            सब कुछ शामिल — 100% अनलॉक
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
            {freeFeatures.map((f, i) => (
              <div key={i} style={{ background: "#fff", padding: "20px 24px", borderRadius: 16, border: "1px solid #e2e8f0" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <CheckCircleFilled style={{ color: "#10b981", fontSize: 18 }} />
                  <span style={{ fontWeight: 700, fontSize: 15, color: "#0f172a" }}>{f.title}</span>
                </div>
                <p style={{ margin: 0, fontSize: 13, color: "#64748b", lineHeight: 1.5 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Why Free Section */}
        <div style={{ maxWidth: 840, margin: "0 auto 64px", background: "#f1f5f9", borderRadius: 20, padding: "36px 32px", textAlign: "left" }}>
          <h3 style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", marginBottom: 12 }}>
            💡 GinieSpace 100% फ्री क्यों है?
          </h3>
          <p style={{ fontSize: 14, color: "#475569", lineHeight: 1.7, marginBottom: 16 }}>
            भारतीय खुदरा और थोक व्यापारियों को पहले से ही दुकान का किराया, इन्वेंटरी और ऑनलाइन मार्केटप्लेस के भारी कमीशन (20% से 30%) का बोझ उठाना पड़ता है। हमारा मानना है कि हर व्यापारी को अपने ग्राहकों और अपनी कमाई पर पूरा अधिकार होना चाहिए — बिना किसी बिचौलिए या सॉफ्टवेयर फीस के।
          </p>
          <p style={{ fontSize: 14, color: "#475569", lineHeight: 1.7, margin: 0 }}>
            GinieSpace सीधे व्हाट्सएप और UPI के जरिए आपको स्वतंत्र डिजिटल इन्फ्रास्ट्रक्चर प्रदान करता है, ताकि आपका हर रुपया आपकी जेब में रहे।
          </p>
        </div>
      </section>

      <MarketingFooter lang="hi" />
    </div>
  );
}
