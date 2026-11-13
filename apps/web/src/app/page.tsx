import React from "react";
import type { Metadata } from "next";
import LandingPageClient from "./LandingPageClient";

export const metadata: Metadata = {
  title: "GinieSpace | WhatsApp Commerce, Hyperlocal B2B Leads & Direct UPI Billing India",
  description:
    "Launch your online WhatsApp catalog, collect direct bank UPI payments with 0% gateway commission, and discover verified local B2B leads. Free plan available; PRO growth tier only ₹99/month.",
  keywords: [
    "WhatsApp Commerce India",
    "WhatsApp Catalog Maker",
    "Direct Bank UPI Billing",
    "Zero Commission Online Store",
    "B2B Leads Finder Google Places India",
    "Kirana WhatsApp Store",
    "Wholesale MOQ Storefront",
    "Services Appointment Booking WhatsApp",
    "GinieSpace",
  ],
  alternates: {
    canonical: "https://ginie.space",
  },
  openGraph: {
    title: "GinieSpace | Turn WhatsApp Into Your Sales & Billing Engine",
    description:
      "Direct bank UPI payments (0% commission), instant digital catalog link, and hyperlocal B2B leads discovery for Indian retail, wholesale, and service businesses.",
    url: "https://ginie.space",
    siteName: "GinieSpace",
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "GinieSpace - Smart WhatsApp Commerce for Indian Businesses",
    description: "Accept 100% direct UPI payments, launch your online catalog, and find verified local B2B leads.",
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
            "price": "99",
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
        "url": "https://ginie.space",
        "logo": "https://ginie.space/icon.svg",
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
            "name": "₹99 PRO Plan kaise activate hota hai?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "GinieSpace app me jakar Upgrade to PRO par click karein, UPI QR scan karke ₹99 pay karein aur 12-digit UTR submit karein. Admin verification ke turant baad plan unlock ho jata hai."
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
