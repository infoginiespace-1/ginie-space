import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import MarketingNav from "@/components/MarketingNav";
import MarketingFooter from "@/components/MarketingFooter";

export const metadata: Metadata = {
  title: "अपॉइंटमेंट बुकिंग व एडवांस UPI बिलिंग ऐप | GinieSpace",
  description:
    "व्हाट्सएप पर सर्विस स्लॉट बुकिंग, रिपेयर अनुरोध और एडवांस बुकिंग टोकन प्राप्त करें। 0% पेमेंट गेटवे कटौती के साथ स्वचालित व्हाट्सएप रसीद भेजें।",
  alternates: {
    canonical: "https://app.ginie.space/hi/services-appointments",
    languages: {
      "en-IN": "https://app.ginie.space/services-appointments",
      "hi-IN": "https://app.ginie.space/hi/services-appointments",
      "x-default": "https://app.ginie.space/services-appointments",
    },
  },
  openGraph: {
    title: "अपॉइंटमेंट बुकिंग व एडवांस UPI बिलिंग ऐप | GinieSpace",
    description: "सैलून, एसी रिपेयर, क्लीनिक और सलाहकारों के लिए व्हाट्सएप पर स्लॉट बुकिंग और एडवांस टोकन भुगतान की स्वचालित सुविधा।",
    url: "https://app.ginie.space/hi/services-appointments",
    siteName: "GinieSpace",
    locale: "hi_IN",
    type: "website",
    images: [{ url: "https://app.ginie.space/og-catalog.jpg", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "व्हाट्सएप सर्विसेज व अपॉइंटमेंट बुकिंग - GinieSpace",
    description: "डायरेक्ट UPI से टोकन एडवांस लें। तुरंत व्हाट्सएप कन्फर्मेशन रसीद और कैलेंडर स्लॉट ऑटोमेशन।",
    images: ["https://app.ginie.space/og-catalog.jpg"],
  },
};

export default function HindiServicesAppointmentsPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", color: "#0f172a" }}>
      <MarketingNav currentPath="/hi/services-appointments" lang="hi" />

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
          🛠️ सर्विसेज व अपॉइंटमेंट बुकिंग
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
          व्हाट्सएप अपॉइंटमेंट बुकिंग और एडवांस UPI बिलिंग सॉफ्टवेयर
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
          होम अप्लायंस मैकेनिक, ब्यूटी पार्लर, ट्यूशन टीचर, क्लीनिक और सलाहकारों के लिए विशेष रूप से निर्मित। डायरेक्ट UPI से एडवांस टोकन पेमेंट लेकर ग्राहक द्वारा ऐन वक्त पर अपॉइंटमेंट रद्द करने की समस्या से बचें।
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
            फ्री में बुकिंग शुरू करें (₹0) 🚀
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
            100% फ्री प्लान देखें (₹0)
          </Link>
        </div>
      </section>

      {/* Service Capabilities */}
      <section style={{ background: "#ffffff", padding: "64px 20px", borderTop: "1px solid #e2e8f0", borderBottom: "1px solid #e2e8f0" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <h2 style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)", fontWeight: 800, color: "#0f172a", marginBottom: 12 }}>
              सर्विस प्रोवाइडर्स के व्यापार को बढ़ाने वाले मुख्य फीचर्स
            </h2>
            <p style={{ color: "#64748b", fontSize: 15, maxWidth: 680, margin: "0 auto" }}>
              बिना बार-बार कॉल किए ऑटोमैटिक स्लॉट बुकिंग और व्हाट्सएप पर्ची की सुविधा।
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 28 }}>
            <div style={{ background: "#f8fafc", padding: 28, borderRadius: 16, border: "1px solid #e2e8f0" }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>
                ⏱️ समय अवधि व सर्विस पैकेज
              </h3>
              <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.6 }}>
                30 मिनट की कंसल्टेंसी, 60 मिनट की सर्विसिंग, या 1 साल का वार्षिक मेंटेनेंस (AMC) प्लान जोड़ें। स्पष्ट रेट लिस्ट से ग्राहकों के साथ मोल-भाव की झंझट खत्म होती है।
              </p>
            </div>

            <div style={{ background: "#f8fafc", padding: 28, borderRadius: 16, border: "1px solid #e2e8f0" }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>
                🏠 होम विजिट या सेंटर विजिट
              </h3>
              <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.6 }}>
                ग्राहक के घर जाकर सर्विस देने (पूरा पता व लैंडमार्क के साथ) या आपके सेंटर/दुकान पर आने के स्लॉट दोनों का विकल्प दें।
              </p>
            </div>

            <div style={{ background: "#f8fafc", padding: 28, borderRadius: 16, border: "1px solid #e2e8f0" }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>
                🎟️ एडवांस UPI टोकन बुकिंग
              </h3>
              <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.6 }}>
                बुकिंग पक्की करने के लिए सीधे अपने बैंक UPI में टोकन एडवांस (जैसे ₹99 या ₹250) लें, जिससे ग्राहक समय पर मौजूद रहे और समय की बर्बादी न हो।
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Internal Linking & Pillar Exploration */}
      <section style={{ background: "#ffffff", padding: "56px 20px", borderTop: "1px solid #e2e8f0" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", marginBottom: 20 }}>
            अन्य मुख्य सॉफ्टवेयर टूल्स भी देखें
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
            <Link href="/hi/retail-kirana-store" style={{ padding: "8px 16px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: 8, color: "#0f172a", fontWeight: 600, textDecoration: "none", fontSize: 13 }}>
              किराना व रिटेल दुकान ➔
            </Link>
            <Link href="/hi/pricing" style={{ padding: "8px 16px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: 8, color: "#0f172a", fontWeight: 600, textDecoration: "none", fontSize: 13 }}>
              100% फ्री प्लान (₹0) ➔
            </Link>
          </div>
        </div>
      </section>

      {/* Pre-Footer CTA */}
      <section style={{ maxWidth: 960, margin: "48px auto", padding: "0 20px" }}>
        <div style={{ background: "linear-gradient(135deg, #059669 0%, #10b981 100%)", borderRadius: 20, padding: "40px 24px", textAlign: "center", color: "#fff", boxShadow: "0 16px 40px rgba(5,150,105,0.25)" }}>
          <h2 style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)", fontWeight: 800, margin: "0 0 12px", color: "#fff" }}>
            व्हाट्सएप पर अपॉइंटमेंट बुकिंग आज ही शुरू करें
          </h2>
          <p style={{ color: "#ecfdf5", fontSize: 15, maxWidth: 600, margin: "0 auto 24px" }}>
            60 सेकंड में अपनी सर्विसेज का डिजिटल मेनू बनाएं और टोकन एडवांस लेना शुरू करें।
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
            फ्री शुरू करें (₹0) 🚀
          </Link>
        </div>
      </section>

      <MarketingFooter lang="hi" />
    </div>
  );
}
