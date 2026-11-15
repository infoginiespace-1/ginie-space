import type { Metadata } from "next";
import React from "react";

interface Props {
  params: { storeId: string };
  children: React.ReactNode;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const storeId = params?.storeId || "";
  let storeName = "Digital Store & Catalog";
  let description = "Browse our full product catalog, view live prices, and order directly on WhatsApp with 0% commission.";
  let imageUrl = "https://app.ginie.space/og-catalog.jpg";

  if (storeId) {
    try {
      const res = await fetch(`https://api.ginie.space/api/storefront/${encodeURIComponent(storeId)}`, {
        next: { revalidate: 60 },
      });
      if (res.ok) {
        const data = await res.json();
        const b = data.business;
        if (b?.name) {
          storeName = b.name;
        }
        if (b?.address) {
          description = `${b.name} (${b.address}). Browse full product catalog, live rates, and order directly on WhatsApp.`;
        }

        let parsedSettings: any = {};
        if (b?.settingsJson) {
          try {
            parsedSettings = JSON.parse(b.settingsJson);
          } catch {}
        }

        if (parsedSettings.logoUrl && (parsedSettings.logoUrl.startsWith("http://") || parsedSettings.logoUrl.startsWith("https://"))) {
          imageUrl = parsedSettings.logoUrl;
        } else if (Array.isArray(data.products) && data.products.length > 0) {
          const prodWithImg = data.products.find((p: any) => p.imageUrl && (p.imageUrl.startsWith("http://") || p.imageUrl.startsWith("https://")));
          if (prodWithImg) {
            imageUrl = prodWithImg.imageUrl;
          }
        }
      }
    } catch {}
  }

  const storeUrl = `https://app.ginie.space/shop/${storeId}`;

  return {
    title: `${storeName} | Digital Catalog & Store`,
    description,
    alternates: {
      canonical: storeUrl,
    },
    openGraph: {
      title: `${storeName} | Online Catalog & Store`,
      description,
      url: storeUrl,
      siteName: `${storeName} - GinieSpace`,
      locale: "en_IN",
      type: "website",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: `${storeName} Digital Catalog`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${storeName} | Online Catalog & Store`,
      description,
      images: [imageUrl],
    },
  };
}

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
