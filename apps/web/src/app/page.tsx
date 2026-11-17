import React from "react";
import type { Metadata } from "next";
import LandingPageClient from "./LandingPageClient";

export const metadata: Metadata = {
  title: "WhatsApp Catalog & UPI Billing Software India | GinieSpace",
  description:
    "Apna WhatsApp catalog banayein, 0% commission par direct UPI payment lein aur local B2B leads payein. Free plan, PRO sirf ₹199/month.",
  alternates: {
    canonical: "https://app.ginie.space",
  },
  openGraph: {
    title: "WhatsApp Catalog & UPI Billing Software India | GinieSpace",
    description:
      "Apna WhatsApp catalog banayein, 0% commission par direct UPI payment lein aur local B2B leads payein. Free plan, PRO sirf ₹199/month.",
    url: "https://app.ginie.space",
    siteName: "GinieSpace",
    locale: "en_IN",
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
      "Apna WhatsApp catalog banayein, 0% commission par direct UPI payment lein aur local B2B leads payein. Free plan, PRO sirf ₹199/month.",
    images: ["https://app.ginie.space/og-catalog.jpg"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function HomePage() {
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
            "name": "Free Starter Plan",
            "price": "0",
            "priceCurrency": "INR"
          },
          {
            "@type": "Offer",
            "name": "PRO Monthly Plan",
            "price": "199",
            "priceCurrency": "INR",
            "billingDuration": "P1M"
          }
        ]
      },
      {
        "@type": "Organization",
        "name": "GinieSpace",
        "url": "https://app.ginie.space",
        "logo": "https://app.ginie.space/icon.svg",
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
            "name": "GinieSpace par customer ki payment mere bank me kaise aati hai?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Seedhe 100% aapke bank me! GinieSpace koi payment gateway middleman nahi hai jo 2% se 3% commission kaate. Har invoice aur bill par aapka apna UPI QR code (aapka apna UPI ID) hota hai. Grahak PhonePe, Google Pay ya Paytm se scan karke seedhe aapke account me paise bhejta hai."
            }
          },
          {
            "@type": "Question",
            "name": "WhatsApp connect karne ke liye kisi technical knowledge ki zaroorat hai?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Bilkul nahi! Jaise aap WhatsApp Web apne computer par scan karke chalate hain, waise hi GinieSpace app me jakar sirf 1 baar QR code scan karna hota hai. Aapka WhatsApp turant sync ho jata hai aur background me orders handle karne lagta hai."
            }
          },
          {
            "@type": "Question",
            "name": "Kya phone ka internet band hone par bhi GinieSpace kaam karega?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Haan! GinieSpace cloud-synced multi-device protocol par chalta hai. Ek baar link hone ke baad aapka shareable store catalog link 24 ghante live rehta hai aur grahak kabhi bhi order place kar sakte hain."
            }
          },
          {
            "@type": "Question",
            "name": "Hyperlocal B2B Leads Finder kya hai aur ye kaise kaam karta hai?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Aap apne city ya pin code me target category (jaise 'Kirana stores in Jaipur', 'Pharmacies in Lucknow') search kar sakte hain. System aapko verified businesses ki details, Google ratings aur verified public phone numbers dikhata hai taaki aap direct 1-click WhatsApp proposal bhej sakein."
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
      <LandingPageClient />
    </>
  );
}
