import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import MarketingNav from "@/components/MarketingNav";
import MarketingFooter from "@/components/MarketingFooter";
import { CheckCircleFilled, ArrowRightOutlined } from "@ant-design/icons";

export const metadata: Metadata = {
  title: "GinieSpace प्राइसिंग: फ्री फॉरएवर और PRO सिर्फ ₹199/महीना",
  description:
    "GinieSpace प्राइसिंग प्लान्स: 0% UPI गेटवे फीस के साथ हमेशा फ्री शुरू करें, या ₹199/महीने में PRO अपग्रेड करके अनलिमिटेड कैटलॉग और 1,000 लोकल लीड्स पाएं।",
  alternates: {
    canonical: "https://app.ginie.space/hi/pricing",
    languages: {
      "en-IN": "https://app.ginie.space/pricing",
      "hi-IN": "https://app.ginie.space/hi/pricing",
      "x-default": "https://app.ginie.space/pricing",
    },
  },
  openGraph: {
    title: "GinieSpace प्राइसिंग: फ्री फॉरएवर और PRO सिर्फ ₹199/महीना",
    description:
      "भारतीय खुदरा और थोक व्यापारियों के लिए 0% कमीशन डायरेक्ट बैंक UPI बिलिंग और हाइपरलोकल B2B लीड्स सॉफ्टवेयर।",
    url: "https://app.ginie.space/hi/pricing",
    siteName: "GinieSpace",
    locale: "hi_IN",
    type: "website",
    images: [{ url: "https://app.ginie.space/og-catalog.jpg", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "GinieSpace प्राइसिंग: फ्री फॉरएवर और PRO सिर्फ ₹199/महीना",
    description: "0% पेमेंट गेटवे कट। 100% डायरेक्ट बैंक ट्रांसफर। भारतीय किराना और थोक दुकानों के लिए विशेष रूप से निर्मित।",
    images: ["https://app.ginie.space/og-catalog.jpg"],
  },
};

export default function HindiPricingPage() {
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
          पारदर्शी व किफायती प्लान्स (TRANSPARENT PRICING)
        </span>
        <h1
          style={{
            fontSize: "clamp(2rem, 4vw, 3rem)",
            fontWeight: 800,
            lineHeight: 1.25,
            letterSpacing: "-0.02em",
            maxWidth: 900,
            margin: "0 auto 16px",
          }}
        >
          GinieSpace प्लान्स: फ्री फॉरएवर और PRO सिर्फ ₹199/महीना
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
          भारतीय किराना दुकानदारों, थोक व्यापारियों और सेवा प्रदाताओं के लिए 0% पेमेंट गेटवे कमीशन, डायरेक्ट बैंक UPI सेटलमेंट और वेरिफाइड Google Maps B2B लीड्स।
        </p>

        {/* Pricing Cards Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(310px, 1fr))",
            gap: 28,
            maxWidth: 960,
            margin: "0 auto 56px",
            textAlign: "left",
          }}
        >
          {/* Free Forever Plan */}
          <div
            style={{
              background: "#ffffff",
              borderRadius: 20,
              padding: 36,
              border: "1px solid #e2e8f0",
              boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div style={{ display: "inline-block", background: "#f1f5f9", color: "#475569", fontSize: 12, fontWeight: 700, padding: "4px 10px", borderRadius: 6, marginBottom: 12, width: "fit-content" }}>
              शुरुआती व्यापारियों के लिए
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 800, margin: "0 0 8px" }}>फ्री फॉरएवर (Free Forever)</h2>
            <p style={{ color: "#64748b", fontSize: 14, minHeight: 42, marginBottom: 16 }}>
              नए व्यापारियों के लिए जो बिना किसी लागत के अपना डिजिटल WhatsApp कैटलॉग और UPI बिलिंग शुरू करना चाहते हैं।
            </p>
            <div style={{ fontSize: 36, fontWeight: 800, color: "#0f172a", marginBottom: 20 }}>
              ₹0 <span style={{ fontSize: 14, fontWeight: 500, color: "#64748b" }}>/ हमेशा के लिए</span>
            </div>

            <Link
              href="/signup"
              style={{
                display: "block",
                textAlign: "center",
                padding: "12px",
                borderRadius: 10,
                border: "1px solid #059669",
                color: "#059669",
                fontWeight: 700,
                fontSize: 15,
                textDecoration: "none",
                marginBottom: 28,
              }}
            >
              फ्री में शुरू करें (₹0)
            </Link>

            <div style={{ fontWeight: 700, fontSize: 13, color: "#0f172a", marginBottom: 12 }}>मुख्य सुविधाएं:</div>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 12, fontSize: 14, color: "#334155" }}>
              {[
                "15 प्रोडक्ट्स या सर्विसेज तक का ऑनलाइन कैटलॉग",
                "प्रतिदिन 3 लोकल B2B सर्च (60 वेरिफाइड लीड्स)",
                "अधिकतम 10 सेव्ड CRM लीड्स",
                "1 स्टाफ ऑपरेटर अकाउंट",
                "0% कमीशन डायरेक्ट बैंक UPI बिलिंग",
                "क्लाउड सिंक WhatsApp वेब कनेक्टिविटी",
                "मानक ईमेल व हेल्पडेस्क सपोर्ट",
              ].map((feature, i) => (
                <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <CheckCircleFilled style={{ color: "#059669", marginTop: 3, flexShrink: 0 }} />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* PRO Growth Plan */}
          <div
            style={{
              background: "#ffffff",
              borderRadius: 20,
              padding: 36,
              border: "2px solid #059669",
              boxShadow: "0 12px 36px rgba(5, 150, 105, 0.12)",
              position: "relative",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: -14,
                left: "50%",
                transform: "translateX(-50%)",
                background: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
                color: "#fff",
                fontSize: 12,
                fontWeight: 800,
                padding: "4px 16px",
                borderRadius: 999,
                boxShadow: "0 4px 12px rgba(5,150,105,0.3)",
              }}
            >
              👑 सबसे लोकप्रिय ग्रोथ प्लान
            </div>

            <div style={{ display: "inline-block", background: "#fef3c7", color: "#92400e", fontSize: 12, fontWeight: 700, padding: "4px 10px", borderRadius: 6, marginBottom: 12, width: "fit-content" }}>
              0% पेमेंट गेटवे कटौती
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: "#065f46", margin: "0 0 8px" }}>PRO वर्कस्पेस</h2>
            <p style={{ color: "#64748b", fontSize: 14, minHeight: 42, marginBottom: 16 }}>
              बढ़ते खुदरा स्टोर, थोक डिस्ट्रीब्यूटर और बड़े पैमाने पर ऑर्डर प्रोसेस करने वाले व्यापारियों के लिए।
            </p>
            <div style={{ fontSize: 36, fontWeight: 800, color: "#065f46", marginBottom: 20 }}>
              ₹199 <span style={{ fontSize: 14, fontWeight: 500, color: "#64748b" }}>/ महीना (या ₹1,799 / साल)</span>
            </div>

            <Link
              href="/signup"
              style={{
                display: "block",
                textAlign: "center",
                padding: "12px",
                borderRadius: 10,
                background: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
                color: "#fff",
                fontWeight: 700,
                fontSize: 15,
                textDecoration: "none",
                marginBottom: 28,
                boxShadow: "0 4px 14px rgba(5, 150, 105, 0.35)",
              }}
            >
              PRO में अपग्रेड करें ➔
            </Link>

            <div style={{ fontWeight: 700, fontSize: 13, color: "#0f172a", marginBottom: 12 }}>फ्री की सभी सुविधाएं, साथ में:</div>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 12, fontSize: 14, color: "#334155" }}>
              {[
                "अनलिमिटेड कैटलॉग आइटम्स (10,000+ प्रोडक्ट्स)",
                "प्रति माह 50 लोकल लीड्स सर्च (1,000 वेरिफाइड B2B लीड्स)",
                "10,000 सेव्ड CRM कॉन्टैक्ट्स और लीड्स",
                "5 टीम स्टाफ सीट्स (बिलिंग, डिलीवरी व हेल्पर)",
                "ब्रॉडकास्ट टूल और स्टोर अनाउंसमेंट्स",
                "आपके ऑनलाइन स्टोर लिंक पर वेरिफाइड ग्रीन बैज",
                "रात 9:00 बजे दैनिक बिक्री व ऑर्डर WhatsApp समरी",
                "डायरेक्ट बैंक UPI QR + 12-अंकीय UTR तुरंत एक्टिवेशन",
                "प्राथमिकता WhatsApp VIP सपोर्ट (+91 92792 59690)",
              ].map((feature, i) => (
                <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <CheckCircleFilled style={{ color: "#059669", marginTop: 3, flexShrink: 0 }} />
                  <span style={{ fontWeight: 500 }}>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Why 0% UPI Fee Matters */}
      <section style={{ background: "#ffffff", padding: "64px 20px", borderTop: "1px solid #e2e8f0", borderBottom: "1px solid #e2e8f0" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <h2 style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)", fontWeight: 800, color: "#0f172a", marginBottom: 12 }}>
              GinieSpace से आपकी हर साल ₹30,000–₹75,000 की सीधी बचत कैसे होती है?
            </h2>
            <p style={{ color: "#64748b", fontSize: 15, maxWidth: 700, margin: "0 auto" }}>
              पारंपरिक पेमेंट गेटवे हर लेनदेन पर 2% से 3% कमीशन और 18% GST काटते हैं। जानिए GinieSpace इस बिचौलिए को कैसे समाप्त करता है।
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
            <div style={{ background: "#f8fafc", padding: 24, borderRadius: 16, border: "1px solid #e2e8f0" }}>
              <div style={{ color: "#ef4444", fontWeight: 800, fontSize: 16, marginBottom: 8 }}>❌ पारंपरिक पेमेंट गेटवे</div>
              <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.6 }}>
                यदि आपकी दुकान महीने में ₹2,00,000 का माल बेचती है, तो 2.5% गेटवे कमीशन से हर महीने ₹5,000 (साल का ₹60,000) कट जाता है। साथ ही पैसे बैंक में 2-3 दिन बाद आते हैं।
              </p>
            </div>

            <div style={{ background: "#ecfdf5", padding: 24, borderRadius: 16, border: "1px solid #a7f3d0" }}>
              <div style={{ color: "#059669", fontWeight: 800, fontSize: 16, marginBottom: 8 }}>✅ GinieSpace डायरेक्ट UPI</div>
              <p style={{ fontSize: 14, color: "#065f46", lineHeight: 1.6 }}>
                ग्राहक आपके व्यक्तिगत या चालू खाते का UPI QR स्कैन करता है। 100% राशि सीधे आपके बैंक में उसी क्षण (T+0) जमा होती है। ₹0 गेटवे कमीशन कटता है, सिर्फ ₹199/माह फिक्स सॉफ्टवेयर शुल्क।
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions */}
      <section style={{ maxWidth: 880, margin: "64px auto", padding: "0 20px" }}>
        <h2 style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)", fontWeight: 800, textAlign: "center", marginBottom: 36 }}>
          प्राइसिंग से जुड़े मुख्य सवाल और जवाब
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {[
            {
              q: "क्या फ्री प्लान वास्तव में हमेशा के लिए मुफ्त है?",
              a: "हाँ, GinieSpace का फ्री प्लान हमेशा के लिए फ्री है और इसके लिए किसी क्रेडिट कार्ड की आवश्यकता नहीं होती। इसमें 15 प्रोडक्ट्स, प्रतिदिन 3 लोकल B2B लीड्स सर्च (60 लीड्स) और 0% कमीशन डायरेक्ट बैंक UPI बिलिंग शामिल है।",
            },
            {
              q: "₹199 PRO प्लान कैसे एक्टिवेट करें?",
              a: "GinieSpace डैशबोर्ड में जाकर 'Upgrade to PRO' पर क्लिक करें, आधिकारिक UPI QR कोड को GPay, PhonePe या Paytm से स्कैन करें और 12-अंकीय बैंक UTR नंबर दर्ज करें। आपका PRO वर्कस्पेस तुरंत एक्टिवेट हो जाता है।",
            },
            {
              q: "क्या कोई छुपा हुआ कमीशन या लेनदेन शुल्क है?",
              a: "बिल्कुल नहीं। GinieSpace कोई पेमेंट गेटवे बिचौलिया नहीं है। ग्राहक द्वारा भेजा गया हर एक रुपया सीधे आपके बैंक खाते में 0% कटौती के साथ जमा होता है।",
            },
            {
              q: "क्या मैं कभी भी अपना प्लान बदल या बंद कर सकता हूँ?",
              a: "हाँ, कोई वार्षिक अनिवार्य अनुबंध या पेनल्टी नहीं है। आप ₹199 मासिक प्लान का उपयोग कर सकते हैं और अपनी सुविधानुसार जब चाहें चालू या बंद कर सकते हैं।",
            },
          ].map((item, idx) => (
            <div key={idx} style={{ background: "#ffffff", padding: 24, borderRadius: 12, border: "1px solid #e2e8f0" }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", margin: "0 0 8px" }}>{item.q}</h3>
              <p style={{ fontSize: 14, color: "#475569", lineHeight: 1.6, margin: 0 }}>{item.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Internal Linking & Pillar Exploration */}
      <section style={{ background: "#ffffff", padding: "56px 20px", borderTop: "1px solid #e2e8f0" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", marginBottom: 20 }}>
            GinieSpace के अन्य मुख्य समाधान देखें
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
              किराना व रिटेल समाधान ➔
            </Link>
            <Link href="/hi/wholesale-distributors" style={{ padding: "8px 16px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: 8, color: "#0f172a", fontWeight: 600, textDecoration: "none", fontSize: 13 }}>
              होलसेल व बल्क ऑर्डर ➔
            </Link>
            <Link href="/hi/services-appointments" style={{ padding: "8px 16px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: 8, color: "#0f172a", fontWeight: 600, textDecoration: "none", fontSize: 13 }}>
              सर्विसेज व स्लॉट बुकिंग ➔
            </Link>
          </div>
        </div>
      </section>

      {/* Pre-Footer CTA */}
      <section style={{ maxWidth: 960, margin: "48px auto", padding: "0 20px" }}>
        <div style={{ background: "linear-gradient(135deg, #059669 0%, #10b981 100%)", borderRadius: 20, padding: "40px 24px", textAlign: "center", color: "#fff", boxShadow: "0 16px 40px rgba(5,150,105,0.25)" }}>
          <h2 style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)", fontWeight: 800, margin: "0 0 12px", color: "#fff" }}>
            अपनी पूरी कमाई सीधे अपने बैंक में लाने के लिए तैयार हैं?
          </h2>
          <p style={{ color: "#ecfdf5", fontSize: 15, maxWidth: 600, margin: "0 auto 24px" }}>
            60 सेकंड में अपना ऑनलाइन WhatsApp स्टोर बनाएं। बिना क्रेडिट कार्ड, हमेशा फ्री प्लान उपलब्ध।
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
            आज ही फ्री शुरू करें 🚀
          </Link>
        </div>
      </section>

      <MarketingFooter lang="hi" />
    </div>
  );
}
