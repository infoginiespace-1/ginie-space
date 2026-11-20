import React from "react";
import type { Metadata } from "next";
import LandingPageClient from "../LandingPageClient";

export const metadata: Metadata = {
  title: "WhatsApp Catalog & UPI Billing Software India | GinieSpace",
  description:
    "अपना WhatsApp कैटलॉग बनाएं, 0% कमीशन पर डायरेक्ट UPI पेमेंट लें और लोकल B2B लीड्स पाएं। 100% फ्री फॉरएवर प्लेटफॉर्म।",
  alternates: {
    canonical: "https://app.ginie.space/hi",
    languages: {
      "en-IN": "https://app.ginie.space",
      "hi-IN": "https://app.ginie.space/hi",
      "x-default": "https://app.ginie.space",
    },
  },
  openGraph: {
    title: "WhatsApp Catalog & UPI Billing Software India | GinieSpace",
    description:
      "अपना WhatsApp कैटलॉग बनाएं, 0% कमीशन पर डायरेक्ट UPI पेमेंट लें और लोकल B2B लीड्स पाएं। 100% फ्री फॉरएवर प्लेटफॉर्म।",
    url: "https://app.ginie.space/hi",
    siteName: "GinieSpace",
    locale: "hi_IN",
    type: "website",
    images: [
      {
        url: "https://app.ginie.space/og-catalog.jpg",
        width: 1200,
        height: 630,
        alt: "GinieSpace - WhatsApp Catalog & UPI Billing Software India",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "WhatsApp Catalog & UPI Billing Software India | GinieSpace",
    description:
      "अपना WhatsApp कैटलॉग बनाएं, 0% कमीशन पर डायरेक्ट UPI पेमेंट लें और लोकल B2B लीड्स पाएं। 100% फ्री फॉरएवर प्लेटफॉर्म।",
    images: ["https://app.ginie.space/og-catalog.jpg"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function HindiHomePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        "name": "GinieSpace",
        "operatingSystem": "Web",
        "applicationCategory": "BusinessApplication",
        "offers": [
          {
            "@type": "Offer",
            "name": "100% फ्री लाइफटाइम प्लेटफॉर्म",
            "price": "0",
            "priceCurrency": "INR"
          }
        ]
      },
      {
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
      },
      {
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "GinieSpace पर ग्राहक का भुगतान मेरे बैंक में कैसे आता है?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "सीधे 100% आपके बैंक खाते में! GinieSpace कोई पेमेंट गेटवे बिचौलिया नहीं है जो 2% से 3% कमीशन काटे। हर इनवॉइस बिल पर आपका अपना UPI QR कोड होता है और ग्राहक सीधे आपके खाते में पैसे भेजता है।"
            }
          },
          {
            "@type": "Question",
            "name": "WhatsApp कनेक्ट करने के लिए क्या किसी तकनीकी ज्ञान की आवश्यकता है?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "बिल्कुल नहीं! जैसे आप कंप्यूटर पर WhatsApp Web स्कैन करके चलाते हैं, वैसे ही GinieSpace ऐप में जाकर सिर्फ 1 बार QR कोड स्कैन करना होता है। आपका व्हाट्सएप तुरंत सिंक हो जाता है।"
            }
          },
          {
            "@type": "Question",
            "name": "क्या फोन का इंटरनेट बंद होने पर भी GinieSpace काम करेगा?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "हाँ! GinieSpace क्लाउड-सिंक मल्टी-डिवाइस प्रोटोकॉल पर चलता है। एक बार लिंक होने के बाद आपका स्टोर कैटलॉग लिंक 24 घंटे लाइव रहता है और ग्राहक कभी भी ऑर्डर कर सकते हैं।"
            }
          },
          {
            "@type": "Question",
            "name": "हाइपरलोकल B2B लीड्स फाइंडर क्या है और यह कैसे काम करता है?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "आप अपने शहर या पिनकोड में किराना दुकान, फार्मेसी या कपड़ा व्यापारी सर्च कर सकते हैं। सिस्टम आपको गूगल मैप्स से वेरिफाइड मोबाइल नंबर दिखाता है ताकि आप सीधे व्हाट्सएप पर माल का प्रस्ताव भेज सकें।"
            }
          }
        ]
      }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LandingPageClient initialLocale="hi" />
    </>
  );
}
