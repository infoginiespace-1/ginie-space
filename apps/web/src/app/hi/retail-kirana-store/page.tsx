import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import MarketingNav from "@/components/MarketingNav";
import MarketingFooter from "@/components/MarketingFooter";

export const metadata: Metadata = {
  title: "किराना व रिटेल दुकान व्हाट्सएप स्टोर सॉफ्टवेयर | GinieSpace",
  description:
    "अपनी स्थानीय किराना व जनरल स्टोर को 24/7 ऑनलाइन व्हाट्सएप कैटलॉग, डायरेक्ट UPI पेमेंट, वजन के अनुसार वेरिएंट और तुरंत होम डिलीवरी रसीद से सुसज्जित करें।",
  alternates: {
    canonical: "https://app.ginie.space/hi/retail-kirana-store",
    languages: {
      "en-IN": "https://app.ginie.space/retail-kirana-store",
      "hi-IN": "https://app.ginie.space/hi/retail-kirana-store",
      "x-default": "https://app.ginie.space/retail-kirana-store",
    },
  },
  openGraph: {
    title: "किराना व रिटेल दुकान व्हाट्सएप स्टोर सॉफ्टवेयर | GinieSpace",
    description: "क्विक-कॉमर्स कंपनियों से मुकाबला करें। अपने नियमित ग्राहकों को व्हाट्सएप पर 24 घंटे ऑनलाइन ऑर्डर और 0% UPI पेमेंट की सुविधा दें।",
    url: "https://app.ginie.space/hi/retail-kirana-store",
    siteName: "GinieSpace",
    locale: "hi_IN",
    type: "website",
    images: [{ url: "https://app.ginie.space/og-catalog.jpg", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "किराना दुकान व्हाट्सएप स्टोर सॉफ्टवेयर - GinieSpace",
    description: "60 सेकंड में डिजिटल दुकान शुरू करें। सीधे बैंक खाते में भुगतान, राशन व किराना वजन वेरिएंट और डिलीवरी पर्ची।",
    images: ["https://app.ginie.space/og-catalog.jpg"],
  },
};

export default function HindiRetailKiranaStorePage() {
  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", color: "#0f172a" }}>
      <MarketingNav currentPath="/hi/retail-kirana-store" lang="hi" />

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
          🏪 स्थानीय किराना व खुदरा दुकानों के लिए
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
          भारतीय किराना व खुदरा दुकानों के लिए व्हाट्सएप स्टोर व डायरेक्ट UPI बिलिंग
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
          10-मिनट डिलीवरी ऐप्स से मुकाबला करने के लिए अपनी दुकान को डिजिटल बनाएं। अपने मोहल्ले के ग्राहकों को व्हाट्सएप पर 24 घंटे ऑर्डर करने की सुविधा, राशन के खुले सामान (किलो/ग्राम) के वेरिएंट, और 0% कमीशन सीधे बैंक में UPI भुगतान दें।
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
            अपनी डिजिटल दुकान शुरू करें (₹0) 🚀
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
            प्लान्स देखें (₹0 व ₹199)
          </Link>
        </div>
      </section>

      {/* Kirana Specific Features */}
      <section style={{ background: "#ffffff", padding: "64px 20px", borderTop: "1px solid #e2e8f0", borderBottom: "1px solid #e2e8f0" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <h2 style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)", fontWeight: 800, color: "#0f172a", marginBottom: 12 }}>
              भारतीय किराना व्यापार की दैनिक जरूरतों के अनुसार निर्मित
            </h2>
            <p style={{ color: "#64748b", fontSize: 15, maxWidth: 680, margin: "0 auto" }}>
              किराना, डेयरी, बेकरी या जनरल स्टोर को तेज और आधुनिक बनाने के सभी जरूरी फीचर्स।
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 28 }}>
            <div style={{ background: "#f8fafc", padding: 28, borderRadius: 16, border: "1px solid #e2e8f0" }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>
                ⚖️ खुले वजन व पैकेट वेरिएंट
              </h3>
              <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.6 }}>
                250 ग्राम, 500 ग्राम, 1 किलो, 5 किलो बैग, या तेल व दालों के खुले विकल्प जोड़ें। ग्राहक अपनी पसंद का सही माप चुनकर आसानी से ऑर्डर दे सकते हैं।
              </p>
            </div>

            <div style={{ background: "#f8fafc", padding: 28, borderRadius: 16, border: "1px solid #e2e8f0" }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>
                🛵 होम डिलीवरी व दुकान से पिकअप
              </h3>
              <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.6 }}>
                ग्राहक होम डिलीवरी या दुकान पर आकर खुद ले जाने (टेकअवे) का विकल्प चुन सकते हैं। फ्री डिलीवरी के लिए न्यूनतम आर्डर राशि (जैसे ₹499 से ऊपर फ्री डिलीवरी) तय करें।
              </p>
            </div>

            <div style={{ background: "#f8fafc", padding: 28, borderRadius: 16, border: "1px solid #e2e8f0" }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>
                🧾 थर्मल पर्ची प्रिंट व हेल्पर ऑपरेटर
              </h3>
              <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.6 }}>
                डिलीवरी बॉय या ग्राहक के लिए मानक 58mm/80mm थर्मल प्रिंटर से पर्ची निकालें। बिना मुख्य व्हाट्सएप पासवर्ड शेयर किए दुकान के लड़कों के लिए अलग स्टाफ अकाउंट बनाएं।
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Internal Linking & Pillar Exploration */}
      <section style={{ background: "#ffffff", padding: "56px 20px", borderTop: "1px solid #e2e8f0" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", marginBottom: 20 }}>
            अन्य मुख्य सॉफ्टवेयर समाधान देखें
          </h2>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 12 }}>
            <Link href="/hi/whatsapp-catalog-maker" style={{ padding: "8px 16px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: 8, color: "#0f172a", fontWeight: 600, textDecoration: "none", fontSize: 13 }}>
              व्हाट्सएप कैटलॉग मेकर ➔
            </Link>
            <Link href="/hi/upi-billing-software" style={{ padding: "8px 16px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: 8, color: "#0f172a", fontWeight: 600, textDecoration: "none", fontSize: 13 }}>
              0% UPI बिलिंग सॉफ्टवेयर ➔
            </Link>
            <Link href="/hi/b2b-leads-finder" style={{ padding: "8px 16px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: 8, color: "#0f172a", fontWeight: 600, textDecoration: "none", fontSize: 13 }}>
              लोकल B2B लीड्स फाइंडर ➔
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
            अपनी किराना दुकान को आज ही स्मार्ट और आधुनिक बनाएं
          </h2>
          <p style={{ color: "#ecfdf5", fontSize: 15, maxWidth: 600, margin: "0 auto 24px" }}>
            अपने नियमित ग्राहकों को व्हाट्सएप पर आसान शॉपिंग अनुभव दें।
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
            फ्री खाता बनाएं (₹0) 🚀
          </Link>
        </div>
      </section>

      <MarketingFooter lang="hi" />
    </div>
  );
}
