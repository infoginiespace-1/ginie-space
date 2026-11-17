import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import MarketingNav from "@/components/MarketingNav";
import MarketingFooter from "@/components/MarketingFooter";

export const metadata: Metadata = {
  title: "थोक व डिस्ट्रीब्यूटर्स के लिए व्हाट्सएप सॉफ्टवेयर | GinieSpace",
  description:
    "थोक ऑर्डर, कार्टन दरें और न्यूनतम ऑर्डर मात्रा (MOQ) स्वचालित करें। नए खुदरा डीलर खोजें और 0% कमीशन पर सीधे बैंक खाते में भुगतान पाएं।",
  alternates: {
    canonical: "https://app.ginie.space/hi/wholesale-distributors",
    languages: {
      "en-IN": "https://app.ginie.space/wholesale-distributors",
      "hi-IN": "https://app.ginie.space/hi/wholesale-distributors",
      "x-default": "https://app.ginie.space/wholesale-distributors",
    },
  },
  openGraph: {
    title: "थोक व डिस्ट्रीब्यूटर्स के लिए व्हाट्सएप सॉफ्टवेयर | GinieSpace",
    description: "MOQ नियम, कार्टन/पेटी रेट लिस्ट और डायरेक्ट बैंक सेटलमेंट के साथ थोक ऑर्डर मैनेज करें। नए किराना व खुदरा डीलर बनाएं।",
    url: "https://app.ginie.space/hi/wholesale-distributors",
    siteName: "GinieSpace",
    locale: "hi_IN",
    type: "website",
    images: [{ url: "https://app.ginie.space/og-catalog.jpg", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "थोक व डिस्ट्रीब्यूटर्स सॉफ्टवेयर - GinieSpace",
    description: "पेटी/कार्टन यूनिट, MOQ नियम, 0% UPI बिलिंग और भारतीय थोक व्यापारियों के लिए आटोमेटिक व्हाट्सएप पर्ची।",
    images: ["https://app.ginie.space/og-catalog.jpg"],
  },
};

export default function HindiWholesaleDistributorsPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", color: "#0f172a" }}>
      <MarketingNav currentPath="/hi/wholesale-distributors" lang="hi" />

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
          📦 थोक व्यापारी व डिस्ट्रीब्यूटर्स के लिए
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
          भारतीय थोक व्यापारियों, डिस्ट्रीब्यूटर्स और स्टॉकिस्ट्स के लिए व्हाट्सएप सॉफ्टवेयर
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
          फोन कॉल पर हाथ से लिखे कच्चे ऑर्डर लेने में घंटों का समय बर्बाद करना बंद करें। कार्टन व पेटी के अनुसार दरें तय करें, न्यूनतम ऑर्डर मात्रा (MOQ) लागू करें, नया माल आने पर सभी डीलरों को एक साथ मैसेज भेजें और नए खुदरा खरीदार जोड़ें।
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
            थोक वर्कस्पेस फ्री बनाएं (₹0) 🚀
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
            PRO प्लान देखें (₹199/माह)
          </Link>
        </div>
      </section>

      {/* Wholesale Capabilities */}
      <section style={{ background: "#ffffff", padding: "64px 20px", borderTop: "1px solid #e2e8f0", borderBottom: "1px solid #e2e8f0" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <h2 style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)", fontWeight: 800, color: "#0f172a", marginBottom: 12 }}>
              बड़े पैमाने पर थोक वितरण के लिए विशेष फीचर्स
            </h2>
            <p style={{ color: "#64748b", fontSize: 15, maxWidth: 680, margin: "0 auto" }}>
              थोक ऑर्डर लेने और डीलरों के साथ पारदर्शी व्यापार करने के आधुनिक टूल्स।
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 28 }}>
            <div style={{ background: "#f8fafc", padding: 28, borderRadius: 16, border: "1px solid #e2e8f0" }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>
                📦 न्यूनतम आर्डर मात्रा (MOQ नियम)
              </h3>
              <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.6 }}>
                हर सामान पर न्यूनतम मात्रा अनिवार्य करें (जैसे कम से कम 5 पेटी, 24 पीस या 10 बॉक्स)। इससे फुटकर ग्राहक थोक पोर्टल पर एक-दो पीस का ऑर्डर नहीं डाल पाएंगे।
              </p>
            </div>

            <div style={{ background: "#f8fafc", padding: 28, borderRadius: 16, border: "1px solid #e2e8f0" }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>
                📢 1-क्लिक डीलर ब्रॉडकास्ट
              </h3>
              <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.6 }}>
                फैक्ट्री से नया माल या ताज़ा स्टॉक आया? अपने सभी जुड़े हुए डीलरों को व्हाट्सएप पर तुरंत ऑर्डर लिंक के साथ नया स्टॉक अलर्ट भेजें।
              </p>
            </div>

            <div style={{ background: "#f8fafc", padding: 28, borderRadius: 16, border: "1px solid #e2e8f0" }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>
                💳 बड़े इनवॉइस पर ₹0 गेटवे कटौती
              </h3>
              <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.6 }}>
                जब डीलर ₹25,000 से ₹1,00,000 का बिल भरता है, तो आम गेटवे ₹600 से ₹2,500 कमीशन काट लेते हैं। GinieSpace डायरेक्ट बैंक सेटलमेंट में 0% कमीशन कटता है।
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Internal Linking & Pillar Exploration */}
      <section style={{ background: "#ffffff", padding: "56px 20px", borderTop: "1px solid #e2e8f0" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", marginBottom: 20 }}>
            अन्य मुख्य सॉफ्टवेयर टूल्स देखें
          </h2>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 12 }}>
            <Link href="/hi/b2b-leads-finder" style={{ padding: "8px 16px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: 8, color: "#0f172a", fontWeight: 600, textDecoration: "none", fontSize: 13 }}>
              लोकल B2B लीड्स फाइंडर ➔
            </Link>
            <Link href="/hi/whatsapp-catalog-maker" style={{ padding: "8px 16px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: 8, color: "#0f172a", fontWeight: 600, textDecoration: "none", fontSize: 13 }}>
              व्हाट्सएप कैटलॉग मेकर ➔
            </Link>
            <Link href="/hi/upi-billing-software" style={{ padding: "8px 16px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: 8, color: "#0f172a", fontWeight: 600, textDecoration: "none", fontSize: 13 }}>
              0% UPI बिलिंग सॉफ्टवेयर ➔
            </Link>
            <Link href="/hi/retail-kirana-store" style={{ padding: "8px 16px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: 8, color: "#0f172a", fontWeight: 600, textDecoration: "none", fontSize: 13 }}>
              किराना व खुदरा स्टोर ➔
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
            अपना थोक व्यापार आज ही डिजिटल और स्वचालित बनाएं
          </h2>
          <p style={{ color: "#ecfdf5", fontSize: 15, maxWidth: 600, margin: "0 auto 24px" }}>
            MOQ नियमों के साथ डिजिटल रेट लिस्ट बनाएं और सीधे बैंक में भुगतान पाएं।
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
