import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import MarketingNav from "@/components/MarketingNav";
import MarketingFooter from "@/components/MarketingFooter";
import { SearchOutlined, WhatsAppOutlined, StarFilled } from "@ant-design/icons";

export const metadata: Metadata = {
  title: "लोकल B2B लीड्स फाइंडर - भारतीय थोक व्यापारियों के लिए | GinieSpace",
  description:
    "अपने शहर या पिनकोड में किराना, मेडिकल और खुदरा दुकानों की वेरिफाइड B2B लीड्स खोजें। गूगल रेटिंग, फोन नंबर देखें और सीधे व्हाट्सएप पर माल का प्रस्ताव भेजें।",
  alternates: {
    canonical: "https://app.ginie.space/hi/b2b-leads-finder",
    languages: {
      "en-IN": "https://app.ginie.space/b2b-leads-finder",
      "hi-IN": "https://app.ginie.space/hi/b2b-leads-finder",
      "x-default": "https://app.ginie.space/b2b-leads-finder",
    },
  },
  openGraph: {
    title: "लोकल B2B लीड्स फाइंडर - भारतीय थोक व्यापारियों के लिए | GinieSpace",
    description: "गूगल मैप्स से वेरिफाइड खुदरा खरीदार खोजें। 1-क्लिक में व्हाट्सएप पर थोक कैटलॉग भेजें और नए डीलर बनाएं।",
    url: "https://app.ginie.space/hi/b2b-leads-finder",
    siteName: "GinieSpace",
    locale: "hi_IN",
    type: "website",
    images: [{ url: "https://app.ginie.space/og-catalog.jpg", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "लोकल B2B लीड्स फाइंडर - GinieSpace",
    description: "किराना स्टोर, फ़ार्मेसी और रेस्टोरेंट से सीधे संपर्क करें। किसी भी पिनकोड में 1,000+ वेरिफाइड लीड्स।",
    images: ["https://app.ginie.space/og-catalog.jpg"],
  },
};

export default function HindiB2bLeadsFinderPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", color: "#0f172a" }}>
      <MarketingNav currentPath="/hi/b2b-leads-finder" lang="hi" />

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
          🔍 लोकल B2B खरीदार खोजें
        </span>
        <h1
          style={{
            fontSize: "clamp(2rem, 4vw, 3rem)",
            fontWeight: 800,
            lineHeight: 1.25,
            letterSpacing: "-0.02em",
            maxWidth: 940,
            margin: "0 auto 16px",
          }}
        >
          भारतीय थोक व्यापारियों व निर्माताओं के लिए हाइपरलोकल B2B लीड्स फाइंडर
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
          अपने शहर या पिनकोड में सक्रिय किराना दुकानों, मेडिकल स्टोर, कपड़ों की दुकानों और खुदरा व्यापारियों को खोजें। गूगल मैप्स से वेरिफाइड मोबाइल नंबर देखें और 1-क्लिक में अपना थोक कैटलॉग सीधे उनके व्हाट्सएप पर भेजें।
        </p>

        <div style={{ display: "flex", justifyContent: "center", gap: 14, flexWrap: "wrap", marginBottom: 48 }}>
          <Link
            href="/signup"
            style={{
              padding: "12px 28px",
              background: "#25D366",
              color: "#fff",
              borderRadius: 10,
              fontWeight: 700,
              fontSize: 16,
              textDecoration: "none",
              boxShadow: "0 4px 14px rgba(37,211,102,0.35)",
            }}
          >
            फ्री में लोकल लीड्स खोजें (₹0) 🚀
          </Link>
          <Link
            href="/hi/pricing"
            style={{
              padding: "12px 24px",
              background: "#fff",
              color: "#0f172a",
              border: "1px solid #cbd5e1",
              borderRadius: 10,
              fontWeight: 600,
              fontSize: 16,
              textDecoration: "none",
            }}
          >
            PRO कोटा और प्लान्स देखें
          </Link>
        </div>
      </section>

      {/* 3 Step Workflow */}
      <section style={{ background: "#ffffff", padding: "64px 20px", borderTop: "1px solid #e2e8f0", borderBottom: "1px solid #e2e8f0" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <h2 style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)", fontWeight: 800, color: "#0f172a", marginBottom: 12 }}>
              हाइपरलोकल B2B लीड्स कैसे काम करता है?
            </h2>
            <p style={{ color: "#64748b", fontSize: 15, maxWidth: 680, margin: "0 auto" }}>
              बिना किसी महंगे डेटाबेस या अनजान कॉलिंग के अपने इलाके के असली दुकानदारों से सीधा संपर्क बनाएं।
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 28 }}>
            <div style={{ background: "#f8fafc", padding: 28, borderRadius: 16, border: "1px solid #e2e8f0" }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: "#ecfdf5", color: "#059669", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, marginBottom: 16 }}>
                <SearchOutlined />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>
                1. व्यापार और शहर/पिनकोड लिखें
              </h3>
              <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.6 }}>
                सर्च बॉक्स में लिखें जैसे <i>"जयपुर में किराना दुकानें"</i>, <i>"सूरत में कपड़ा व्यापारी"</i>, या <i>"पटना 800001 में मेडिकल स्टोर"</i>। सिस्टम तुरंत गूगल मैप्स से वेरिफाइड जानकारी लाता है।
              </p>
            </div>

            <div style={{ background: "#f8fafc", padding: 28, borderRadius: 16, border: "1px solid #e2e8f0" }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: "#eff6ff", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, marginBottom: 16 }}>
                <StarFilled style={{ color: "#f59e0b" }} />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>
                2. रेटिंग, रिव्यू और फोन नंबर देखें
              </h3>
              <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.6 }}>
                दुकान का पूरा नाम, स्टार रेटिंग, कुल ग्राहक रिव्यू, वास्तविक पता और चालू फोन नंबर देखें। उपयुक्त दुकानों को सीधे अपने GinieSpace CRM में सेव करें।
              </p>
            </div>

            <div style={{ background: "#f8fafc", padding: 28, borderRadius: 16, border: "1px solid #e2e8f0" }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: "#fef3c7", color: "#d97706", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, marginBottom: 16 }}>
                <WhatsAppOutlined style={{ color: "#25D366" }} />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>
                3. 1-क्लिक में व्हाट्सएप प्रस्ताव भेजें
              </h3>
              <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.6 }}>
                व्हाट्सएप बटन दबाते ही आपके डिजिटल कैटलॉग लिंक के साथ आकर्षक मैसेज तैयार हो जाता है। दुकानदार तुरंत आपका थोक भाव देखकर खरीदारी का ऑर्डर दे सकता है।
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Quotas & Limits */}
      <section style={{ maxWidth: 1000, margin: "64px auto", padding: "0 20px" }}>
        <h2 style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)", fontWeight: 800, textAlign: "center", marginBottom: 36 }}>
          हर व्यापार के लिए पारदर्शी लीड्स कोटा
        </h2>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
          <div style={{ background: "#ffffff", padding: 28, borderRadius: 16, border: "1px solid #e2e8f0" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", marginBottom: 8 }}>शुरुआती व्यापारियों के लिए</div>
            <h3 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", marginBottom: 12 }}>फ्री फॉरएवर (₹0)</h3>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10, fontSize: 14, color: "#475569" }}>
              <li>✅ प्रतिदिन 3 लोकल B2B सर्च</li>
              <li>✅ प्रतिदिन 60 वेरिफाइड दुकानें</li>
              <li>✅ CRM में 10 लीड्स सेव करें</li>
              <li>✅ डायरेक्ट व्हाट्सएप प्रपोजल लिंक</li>
            </ul>
          </div>

          <div style={{ background: "#ffffff", padding: 28, borderRadius: 16, border: "2px solid #059669", boxShadow: "0 8px 24px rgba(5,150,105,0.1)" }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: "#059669", marginBottom: 8 }}>PRO ग्रोथ प्लान</div>
            <h3 style={{ fontSize: 22, fontWeight: 800, color: "#059669", marginBottom: 12 }}>PRO (₹199 / महीना)</h3>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10, fontSize: 14, color: "#334155" }}>
              <li>👑 प्रति माह 50 सर्च क्वेरी</li>
              <li>👑 1,000 वेरिफाइड हाई-इंटेंट B2B लीड्स</li>
              <li>👑 CRM में 10,000 लीड्स स्टोर करें</li>
              <li>👑 पूरे भारत के किसी भी शहर में सर्च</li>
              <li>👑 प्राथमिकता फ़ोन व व्हाट्सएप सपोर्ट</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Internal Linking & Pillar Exploration */}
      <section style={{ background: "#ffffff", padding: "56px 20px", borderTop: "1px solid #e2e8f0" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", marginBottom: 20 }}>
            अन्य समाधान भी देखें
          </h2>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 12 }}>
            <Link href="/hi/whatsapp-catalog-maker" style={{ padding: "8px 16px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: 8, color: "#0f172a", fontWeight: 600, textDecoration: "none", fontSize: 13 }}>
              व्हाट्सएप कैटलॉग मेकर ➔
            </Link>
            <Link href="/hi/upi-billing-software" style={{ padding: "8px 16px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: 8, color: "#0f172a", fontWeight: 600, textDecoration: "none", fontSize: 13 }}>
              0% UPI बिलिंग सॉफ्टवेयर ➔
            </Link>
            <Link href="/hi/retail-kirana-store" style={{ padding: "8px 16px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: 8, color: "#0f172a", fontWeight: 600, textDecoration: "none", fontSize: 13 }}>
              किराना व खुदरा दुकान ➔
            </Link>
            <Link href="/hi/wholesale-distributors" style={{ padding: "8px 16px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: 8, color: "#0f172a", fontWeight: 600, textDecoration: "none", fontSize: 13 }}>
              थोक व्यापारी व डिस्ट्रीब्यूटर्स ➔
            </Link>
            <Link href="/hi/pricing" style={{ padding: "8px 16px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: 8, color: "#0f172a", fontWeight: 600, textDecoration: "none", fontSize: 13 }}>
              प्लान्स और प्राइसिंग (₹199) ➔
            </Link>
          </div>
        </div>
      </section>

      {/* Pre-Footer CTA */}
      <section style={{ maxWidth: 960, margin: "48px auto", padding: "0 20px" }}>
        <div style={{ background: "linear-gradient(135deg, #059669 0%, #10b981 100%)", borderRadius: 20, padding: "40px 24px", textAlign: "center", color: "#fff", boxShadow: "0 16px 40px rgba(5,150,105,0.25)" }}>
          <h2 style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)", fontWeight: 800, margin: "0 0 12px", color: "#fff" }}>
            अपने शहर में नए खरीदारों और डीलरों का नेटवर्क बनाएं
          </h2>
          <p style={{ color: "#ecfdf5", fontSize: 15, maxWidth: 600, margin: "0 auto 24px" }}>
            कुछ ही मिनटों में खुदरा खरीदारों की सूची बनाएं। बिना क्रेडिट कार्ड, हमेशा फ्री प्लान।
          </p>
          <Link
            href="/signup"
            style={{
              display: "inline-block",
              background: "#ffffff",
              color: "#059669",
              padding: "12px 32px",
              borderRadius: 10,
              fontWeight: 800,
              fontSize: 16,
              textDecoration: "none",
              boxShadow: "0 4px 14px rgba(0,0,0,0.1)",
            }}
          >
            लीड्स खोजना शुरू करें (₹0) 🚀
          </Link>
        </div>
      </section>

      <MarketingFooter lang="hi" />
    </div>
  );
}
