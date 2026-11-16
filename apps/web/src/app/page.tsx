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
        "operatingSystem": "Web, Mobile, WhatsApp Web",
        "applicationCategory": "BusinessApplication",
        "offers": [
          {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "INR",
            "name": "Free Starter Tier"
          },
          {
            "@type": "Offer",
            "price": "199",
            "priceCurrency": "INR",
            "name": "PRO Growth Tier",
            "billingDuration": "P1M"
          }
        ],
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": "4.9",
          "reviewCount": "142"
        }
      },
      {
        "@type": "Organization",
        "name": "GinieSpace",
        "url": "https://app.ginie.space",
        "logo": "https://app.ginie.space/icon.svg",
        "contactPoint": {
          "@type": "ContactPoint",
          "telephone": "+91-9279259690",
          "contactType": "customer service",
          "availableLanguage": ["English", "Hindi"]
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
              "text": "Seedhe 100% aapke bank me! GinieSpace koi payment gateway middleman nahi hai jo 2% se 3% commission kate. Har invoice par aapka apna UPI QR code hota hai aur grahak seedhe aapke account me paise bhejta hai."
            }
          },
          {
            "@type": "Question",
            "name": "WhatsApp connect karne ke liye kisi technical knowledge ki zaroorat hai?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Bilkul nahi! Jaise aap WhatsApp Web scan karke chalate hain, waise hi GinieSpace app me jakar sirf 1 baar QR code scan karna hota hai."
            }
          },
          {
            "@type": "Question",
            "name": "Kya phone ka internet band hone par bhi GinieSpace kaam karega?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Haan! GinieSpace cloud-synced multi-device protocol par chalta hai. Ek baar link hone ke baad aapka shareable store catalog link 24 ghante live rehta hai."
            }
          },
          {
            "@type": "Question",
            "name": "Hyperlocal B2B Leads Finder kya hai aur ye kaise kaam karta hai?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Aap apne city ya pin code me target category search kar sakte hain. System aapko verified businesses ki details, Google ratings aur verified public phone numbers dikhata hai."
            }
          },
          {
            "@type": "Question",
            "name": "₹199 PRO Plan kaise activate hota hai?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "GinieSpace app me jakar Upgrade to PRO par click karein, UPI QR scan karke ₹199 pay karein aur 12-digit UTR submit karein. Admin verification ke turant baad plan unlock ho jata hai."
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
