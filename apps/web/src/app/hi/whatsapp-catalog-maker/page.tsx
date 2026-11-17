import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import MarketingNav from "@/components/MarketingNav";
import MarketingFooter from "@/components/MarketingFooter";
import { CheckCircleFilled } from "@ant-design/icons";

export const metadata: Metadata = {
  title: "व्हाट्सएप कैटलॉग मेकर इंडिया - डिजिटल दुकान | GinieSpace",
  description:
    "60 सेकंड में अपनी दुकान का डिजिटल व्हाट्सएप कैटलॉग बनाएं। प्रोडक्ट लिंक शेयर करें, सीधे व्हाट्सएप पर आर्डर लें और 0% कमीशन पर UPI पेमेंट पाएं।",
  alternates: {
    canonical: "https://app.ginie.space/hi/whatsapp-catalog-maker",
    languages: {
      "en-IN": "https://app.ginie.space/whatsapp-catalog-maker",
      "hi-IN": "https://app.ginie.space/hi/whatsapp-catalog-maker",
      "x-default": "https://app.ginie.space/whatsapp-catalog-maker",
    },
  },
  openGraph: {
    title: "व्हाट्सएप कैटलॉग मेकर इंडिया - डिजिटल दुकान | GinieSpace",
    description: "अपनी दुकान का ऑनलाइन व्हाट्सएप कैटलॉग बनाएं। बिना किसी ऐप डाउनलोड के ग्राहक को आसान शॉपिंग अनुभव दें।",
    url: "https://app.ginie.space/hi/whatsapp-catalog-maker",
    siteName: "GinieSpace",
    locale: "hi_IN",
    type: "website",
    images: [{ url: "https://app.ginie.space/og-catalog.jpg", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "फ्री व्हाट्सएप कैटलॉग मेकर - भारतीय व्यापारियों के लिए | GinieSpace",
    description: "भारी PDF रेट लिस्ट की जगह आधुनिक डिजिटल स्टोर लिंक बनाएं। सीधे बैंक खाते में भुगतान और स्वचालित इनवॉइस।",
    images: ["https://app.ginie.space/og-catalog.jpg"],
  },
};

export default function HindiWhatsAppCatalogMakerPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", color: "#0f172a" }}>
      <MarketingNav currentPath="/hi/whatsapp-catalog-maker" lang="hi" />

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
          ⚡ आधुनिक डिजिटल स्टोरफ्रंट
        </span>
        <h1
          style={{
            fontSize: "clamp(2rem, 4vw, 3rem)",
            fontWeight: 800,
            lineHeight: 1.25,
            letterSpacing: "-0.02em",
            maxWidth: 920,
            margin: "0 auto 16px",
          }}
        >
          भारतीय दुकानों के लिए फ्री व्हाट्सएप कैटलॉग मेकर
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
          अपने व्हाट्सएप को एक आधुनिक, हाई-स्पीड मोबाइल दुकान में बदलें। पुराने PDF कैटलॉग और व्हाट्सएप चैट पर बार-बार फोटो भेजने के झंझट से मुक्ति पाएं। अपना पर्सनल <code>/shop/your-dukaan</code> लिंक शेयर करें जिससे ग्राहक आसानी से उत्पाद चुनकर सीधे UPI से ऑर्डर कर सकें।
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
            अपनी डिजिटल दुकान फ्री बनाएं 🚀
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
            फ्री व PRO प्लान्स देखें
          </Link>
        </div>
      </section>

      {/* How It Works */}
      <section style={{ background: "#ffffff", padding: "64px 20px", borderTop: "1px solid #e2e8f0", borderBottom: "1px solid #e2e8f0" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <h2 style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)", fontWeight: 800, color: "#0f172a", marginBottom: 12 }}>
              व्हाट्सएप कैटलॉग मेकर कैसे काम करता है? (3 आसान चरण)
            </h2>
            <p style={{ color: "#64748b", fontSize: 15, maxWidth: 680, margin: "0 auto" }}>
              बिना किसी कोडिंग या तकनीकी ज्ञान के, सिर्फ 60 सेकंड में आपकी ऑनलाइन दुकान शुरू हो जाती है।
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 28 }}>
            <div style={{ background: "#f8fafc", padding: 28, borderRadius: 16, border: "1px solid #e2e8f0" }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: "#ecfdf5", color: "#059669", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, marginBottom: 16 }}>
                1
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>
                उत्पाद और कीमतें जोड़ें
              </h3>
              <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.6 }}>
                फोटो अपलोड करें, कीमत, छूट और यूनिट (किलो, पीस, पैकेट या साइज) तय करें। एक क्लिक में स्टॉक इन या आउट-ऑफ-स्टॉक सेट करें।
              </p>
            </div>

            <div style={{ background: "#f8fafc", padding: 28, borderRadius: 16, border: "1px solid #e2e8f0" }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: "#eff6ff", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, marginBottom: 16 }}>
                2
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>
                अपना स्टोर लिंक शेयर करें
              </h3>
              <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.6 }}>
                अपना <code>app.ginie.space/shop/your-dukaan</code> लिंक व्हाट्सएप बायो, इंस्टाग्राम, स्टेटस और गूगल प्रोफाइल पर साझा करें या दुकान पर QR स्टैंडी लगाएं।
              </p>
            </div>

            <div style={{ background: "#f8fafc", padding: 28, borderRadius: 16, border: "1px solid #e2e8f0" }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: "#fef3c7", color: "#d97706", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, marginBottom: 16 }}>
                3
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>
                सीधे व्हाट्सएप पर आर्डर व भुगतान पाएं
              </h3>
              <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.6 }}>
                ग्राहक कार्ट में सामान जोड़कर चेकआउट करता है, तुरंत व्हाट्सएप पर पक्का इनवॉइस बिल पहुंचता है और पैसा 0% कटौती के साथ आपके बैंक में आता है।
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Deep Dive */}
      <section style={{ maxWidth: 1000, margin: "64px auto", padding: "0 20px" }}>
        <h2 style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)", fontWeight: 800, textAlign: "center", marginBottom: 36 }}>
          व्यापारी PDF कैटलॉग छोड़कर GinieSpace क्यों अपना रहे हैं?
        </h2>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
          <div style={{ background: "#ffffff", padding: 24, borderRadius: 14, border: "1px solid #e2e8f0" }}>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: "#059669", marginBottom: 8 }}>
              ⚡ तेज और स्मूथ मोबाइल अनुभव
            </h3>
            <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.6, margin: 0 }}>
              भारी PDF फाइल डाउनलोड होने में 1-2 मिनट लगाती है। GinieSpace का डिजिटल कैटलॉग किसी भी 4G/5G इंटरनेट पर 1 सेकंड में लोड होता है।
            </p>
          </div>

          <div style={{ background: "#ffffff", padding: 24, borderRadius: 14, border: "1px solid #e2e8f0" }}>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: "#059669", marginBottom: 8 }}>
              🔄 रियल-टाइम रेट और स्टॉक अपडेट
            </h3>
            <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.6, margin: 0 }}>
              दाम बदले या कोई माल खत्म हो गया? कंट्रोल पैनल में बस एक बार बदलें, ग्राहकों को हमेशा नया रेट और सही उपलब्धता दिखेगी।
            </p>
          </div>

          <div style={{ background: "#ffffff", padding: 24, borderRadius: 14, border: "1px solid #e2e8f0" }}>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: "#059669", marginBottom: 8 }}>
              💳 0% कमीशन डायरेक्ट बैंक UPI QR
            </h3>
            <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.6, margin: 0 }}>
              फूड डिलीवरी या ई-कॉमर्स ऐप्स की तरह 15-30% कमीशन देने की जरूरत नहीं। आपका अपना UPI QR कोड दिखता है और 100% पैसा आपके खाते में आता है।
            </p>
          </div>

          <div style={{ background: "#ffffff", padding: 24, borderRadius: 14, border: "1px solid #e2e8f0" }}>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: "#059669", marginBottom: 8 }}>
              📱 ग्राहकों को ऐप डाउनलोड की जरूरत नहीं
            </h3>
            <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.6, margin: 0 }}>
              ग्राहक को अपने फोन में कोई भारी ऐप इंस्टॉल नहीं करनी पड़ती। वे सीधे व्हाट्सएप या ब्राउज़र में लिंक खोलकर तुरंत ऑर्डर कर सकते हैं।
            </p>
          </div>
        </div>
      </section>

      {/* Internal Linking & Pillar Exploration */}
      <section style={{ background: "#ffffff", padding: "56px 20px", borderTop: "1px solid #e2e8f0" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", marginBottom: 20 }}>
            अन्य उपयोगी फीचर्स भी देखें
          </h2>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 12 }}>
            <Link href="/hi/upi-billing-software" style={{ padding: "8px 16px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: 8, color: "#0f172a", fontWeight: 600, textDecoration: "none", fontSize: 13 }}>
              0% UPI बिलिंग सॉफ्टवेयर ➔
            </Link>
            <Link href="/hi/b2b-leads-finder" style={{ padding: "8px 16px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: 8, color: "#0f172a", fontWeight: 600, textDecoration: "none", fontSize: 13 }}>
              लोकल B2B लीड्स फाइंडर ➔
            </Link>
            <Link href="/hi/retail-kirana-store" style={{ padding: "8px 16px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: 8, color: "#0f172a", fontWeight: 600, textDecoration: "none", fontSize: 13 }}>
              किराना व रिटेल दुकान ➔
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
            अपनी दुकान का व्हाट्सएप कैटलॉग आज ही शुरू करें
          </h2>
          <p style={{ color: "#ecfdf5", fontSize: 15, maxWidth: 600, margin: "0 auto 24px" }}>
            सैकड़ों भारतीय व्यापारियों के साथ जुड़ें और बिना किसी कमीशन के अपना डिजिटल कारोबार बढ़ाएं।
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
            फ्री में शुरू करें (₹0) 🚀
          </Link>
        </div>
      </section>

      <MarketingFooter lang="hi" />
    </div>
  );
}
