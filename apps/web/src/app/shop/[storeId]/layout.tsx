import type { Metadata } from "next";
import React from "react";

interface Props {
  params: { storeId: string };
  children: React.ReactNode;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const storeId = params?.storeId || "";
  let storeName = "Digital Store";
  let description = "Browse our full product catalog, view live prices, and order directly on WhatsApp with 0% commission.";
  let imageUrl = "https://app.ginie.space/og-catalog.jpg";

  if (storeId) {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://api.ginie.space";
      const res = await fetch(`${apiUrl}/api/storefront/${encodeURIComponent(storeId)}`, {
        next: { revalidate: 60 },
      });
      if (res.ok) {
        const data = await res.json();
        const b = data.business || data.store;
        if (b?.name) {
          storeName = b.name;
        }
        if (b?.address) {
          description = `Order online from ${b.name} (${b.address}). Browse full product catalog, live rates, and order directly on WhatsApp with 0% commission.`;
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
  const title = `${storeName} - Online Catalog | GinieSpace`;

  return {
    title,
    description,
    alternates: {
      canonical: storeUrl,
    },
    openGraph: {
      title,
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
          alt: `${storeName} Online Catalog`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  };
}

export default async function ShopLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { storeId: string };
}) {
  const storeId = params?.storeId || "";
  let jsonLd: any = null;

  if (storeId) {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://api.ginie.space";
      const res = await fetch(`${apiUrl}/api/storefront/${encodeURIComponent(storeId)}`, {
        next: { revalidate: 60 },
      });
      if (res.ok) {
        const data = await res.json();
        const b = data.business || data.store;
        if (b?.name) {
          jsonLd = {
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            name: b.name,
            telephone: b.phone || undefined,
            address: b.address
              ? {
                  "@type": "PostalAddress",
                  streetAddress: b.address,
                  addressCountry: "IN",
                }
              : undefined,
            url: `https://app.ginie.space/shop/${storeId}`,
            currenciesAccepted: "INR",
            paymentAccepted: "Direct UPI, Cash",
          };
        }
      }
    } catch {}
  }

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      {children}
    </>
  );
}
