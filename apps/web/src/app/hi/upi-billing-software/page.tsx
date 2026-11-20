import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import MarketingNav from "@/components/MarketingNav";
import MarketingFooter from "@/components/MarketingFooter";
import { BankOutlined, QrcodeOutlined, ThunderboltOutlined } from "@ant-design/icons";

export const metadata: Metadata = {
  title: "0% कमीशन डायरेक्ट बैंक UPI बिलिंग सॉफ्टवेयर | GinieSpace",
  description:
    "अपने व्यक्तिगत UPI QR से सीधे बैंक खाते में भुगतान प्राप्त करें। 0% पेमेंट गेटवे कमीशन, स्वचालित व्हाट्सएप इनवॉइस और तत्काल T+0 क्रेडिट।",
  alternates: {
    canonical: "https://app.ginie.space/hi/upi-billing-software",
    languages: {
      "en-IN": "https://app.ginie.space/upi-billing-software",
      "hi-IN": "https://app.ginie.space/hi/upi-billing-software",
      "x-default": "https://app.ginie.space/upi-billing-software",
    },
  },
  openGraph: {
    title: "0% कमीशन डायरेक्ट बैंक UPI बिलिंग सॉफ्टवेयर | GinieSpace",
    description: "Google Pay, PhonePe, Paytm से 100% डायरेक्ट पेमेंट अपने खाते में पाएं। ₹0 गेटवे फीस और तुरंत व्हाट्सएप बिल।",
    url: "https://app.ginie.space/hi/upi-billing-software",
    siteName: "GinieSpace",
    locale: "hi_IN",
    type: "website",
    images: [{ url: "https://app.ginie.space/og-catalog.jpg", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "0% कमीशन डायरेक्ट बैंक UPI बिलिंग | GinieSpace",
    description: "अपनी पूरी कमाई अपने पास रखें। 2-3% पेमेंट गेटवे कटौती बंद करें। भारतीय खुदरा व थोक व्यापारियों के लिए निर्मित।",
    images: ["https://app.ginie.space/og-catalog.jpg"],
  },
};

export default function HindiUpiBillingSoftwarePage() {
  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", color: "#0f172a" }}>
      <MarketingNav currentPath="/hi/upi-billing-software" lang="hi" />

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
          💰 0% गेटवे कमीशन • सीधे बैंक में पैसा
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
          भारतीय दुकानों के लिए 0% कमीशन डायरेक्ट बैंक UPI बिलिंग सॉफ्टवेयर
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
          पेमेंट गेटवे कंपनियों को हर बिक्री पर 2% से 3% कमीशन देना बंद करें। GinieSpace के साथ Google Pay, PhonePe, Paytm या BHIM द्वारा ग्राहक द्वारा दिया गया हर एक रुपया सीधे आपके बैंक खाते में जमा होता है और ग्राहक को तुरंत व्हाट्सएप बिल मिलता है।
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
            फ्री में UPI बिलिंग शुरू करें 🚀
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
            अपनी बचत का हिसाब देखें
          </Link>
        </div>
      </section>

      {/* How Direct UPI Billing Works */}
      <section style={{ background: "#ffffff", padding: "64px 20px", borderTop: "1px solid #e2e8f0", borderBottom: "1px solid #e2e8f0" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <h2 style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)", fontWeight: 800, color: "#0f172a", marginBottom: 12 }}>
              डायरेक्ट बैंक UPI सेटलमेंट कैसे काम करता है?
            </h2>
            <p style={{ color: "#64748b", fontSize: 15, maxWidth: 680, margin: "0 auto" }}>
              एक पारदर्शी और सुरक्षित व्यवस्था जो बिचौलियों और देरी को पूरी तरह खत्म करती है।
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 28 }}>
            <div style={{ background: "#f8fafc", padding: 28, borderRadius: 16, border: "1px solid #e2e8f0" }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: "#ecfdf5", color: "#059669", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, marginBottom: 16 }}>
                <QrcodeOutlined />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>
                1. आपकी अपनी UPI QR आईडी
              </h3>
              <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.6 }}>
                अपनी दुकान का मौजूदा बैंक UPI ID सेट करें (जैसे <code>merchant@okaxis</code>)। डिजिटल बिल पर कुल रकम के अनुसार ऑटोमैटिक QR कोड जनरेट होता है।
              </p>
            </div>

            <div style={{ background: "#f8fafc", padding: 28, borderRadius: 16, border: "1px solid #e2e8f0" }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: "#eff6ff", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, marginBottom: 16 }}>
                <BankOutlined />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>
                2. उसी समय बैंक में पैसा (T+0)
              </h3>
              <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.6 }}>
                पैसा ग्राहक के बैंक खाते से सीधे आपके बैंक खाते में उसी क्षण पहुंचता है। GinieSpace आपके पैसे को अपने पास नहीं रखता और न ही 2-3 दिन की देरी होती है।
              </p>
            </div>

            <div style={{ background: "#f8fafc", padding: 28, borderRadius: 16, border: "1px solid #e2e8f0" }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: "#fef3c7", color: "#d97706", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, marginBottom: 16 }}>
                <ThunderboltOutlined />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>
                3. स्वचालित व्हाट्सएप इनवॉइस
              </h3>
              <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.6 }}>
                12-अंकीय बैंक UTR रेफरेंस द्वारा भुगतान वेरिफाई होते ही ग्राहक के फोन पर पक्का बिल पहुंच जाता है और आपके डैशबोर्ड में बिक्री दर्ज हो जाती है।
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Savings Breakdown */}
      <section style={{ maxWidth: 1000, margin: "64px auto", padding: "0 20px" }}>
        <h2 style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)", fontWeight: 800, textAlign: "center", marginBottom: 16 }}>
          आपकी हर साल कितनी बचत होगी?
        </h2>
        <p style={{ color: "#64748b", fontSize: 15, textAlign: "center", maxWidth: 640, margin: "0 auto 36px" }}>
          सामान्य 2.5% पेमेंट गेटवे लागत बनाम GinieSpace 0% डायरेक्ट UPI की तुलना करें।
        </p>

        <div style={{ overflowX: "auto", background: "#ffffff", borderRadius: 16, border: "1px solid #e2e8f0", boxShadow: "0 4px 16px rgba(0,0,0,0.03)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: 14 }}>
            <thead>
              <tr style={{ background: "#f1f5f9", borderBottom: "1px solid #e2e8f0" }}>
                <th style={{ padding: "16px 20px", fontWeight: 700, color: "#0f172a" }}>मासिक बिक्री</th>
                <th style={{ padding: "16px 20px", fontWeight: 700, color: "#ef4444" }}>सामान्य 2.5% कटौती</th>
                <th style={{ padding: "16px 20px", fontWeight: 700, color: "#059669" }}>GinieSpace शुल्क</th>
                <th style={{ padding: "16px 20px", fontWeight: 700, color: "#059669" }}>वार्षिक बचत</th>
              </tr>
            </thead>
            <tbody>
              {[
                { sales: "₹1,00,000 / महीना", standard: "₹2,500 / महीना", ginie: "₹0 (100% फ्री)", savings: "₹30,000 / साल" },
                { sales: "₹2,50,000 / महीना", standard: "₹6,250 / महीना", ginie: "₹0 (100% फ्री)", savings: "₹75,000 / साल" },
                { sales: "₹5,00,000 / महीना", standard: "₹12,500 / महीना", ginie: "₹0 (100% फ्री)", savings: "₹1,50,000 / साल" },
                { sales: "₹10,00,000 / महीना", standard: "₹25,000 / महीना", ginie: "₹0 (100% फ्री)", savings: "₹3,00,000 / साल" },
              ].map((row, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "16px 20px", fontWeight: 600 }}>{row.sales}</td>
                  <td style={{ padding: "16px 20px", color: "#ef4444" }}>{row.standard}</td>
                  <td style={{ padding: "16px 20px", color: "#059669", fontWeight: 600 }}>{row.ginie}</td>
                  <td style={{ padding: "16px 20px", color: "#059669", fontWeight: 700 }}>{row.savings}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Internal Linking & Pillar Exploration */}
      <section style={{ background: "#ffffff", padding: "56px 20px", borderTop: "1px solid #e2e8f0" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", marginBottom: 20 }}>
            अन्य मुख्य फीचर्स देखें
          </h2>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 12 }}>
            <Link href="/hi/whatsapp-catalog-maker" style={{ padding: "8px 16px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: 8, color: "#0f172a", fontWeight: 600, textDecoration: "none", fontSize: 13 }}>
              व्हाट्सएप कैटलॉग मेकर ➔
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
              100% फ्री प्लान (₹0) ➔
            </Link>
          </div>
        </div>
      </section>

      {/* Pre-Footer CTA */}
      <section style={{ maxWidth: 960, margin: "48px auto", padding: "0 20px" }}>
        <div style={{ background: "linear-gradient(135deg, #059669 0%, #10b981 100%)", borderRadius: 20, padding: "40px 24px", textAlign: "center", color: "#fff", boxShadow: "0 16px 40px rgba(5,150,105,0.25)" }}>
          <h2 style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)", fontWeight: 800, margin: "0 0 12px", color: "#fff" }}>
            आज ही 0% फीस डायरेक्ट UPI बिलिंग शुरू करें
          </h2>
          <p style={{ color: "#ecfdf5", fontSize: 15, maxWidth: 600, margin: "0 auto 24px" }}>
            सिर्फ 60 सेकंड में अपना पर्सनल UPI QR कोड सेट करें। कोई क्रेडिट कार्ड आवश्यक नहीं।
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
