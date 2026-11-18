import type { Metadata, Viewport } from "next";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { ConfigProvider } from "antd";
import { AuthProvider } from "../context/AuthContext";
import { AnalyticsTracker } from "../components/AnalyticsTracker";
import React from "react";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://app.ginie.space"),
  title: {
    default: "WhatsApp Catalog & UPI Billing Software India | GinieSpace",
    template: "%s",
  },
  description: "Automate your sales, orders, and customer discovery directly through WhatsApp with 0% payment gateway commission. Free online dukaan & digital catalog builder.",
  authors: [{ name: "GinieSpace Team", url: "https://app.ginie.space" }],
  creator: "GinieSpace",
  publisher: "GinieSpace",
  alternates: {
    canonical: "https://app.ginie.space",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    title: "GinieSpace | WhatsApp Business Commerce & Direct UPI Billing",
    description: "Launch your WhatsApp Store in 30 seconds with 0% gateway commission. Automated order receipts and customer discovery.",
    url: "https://app.ginie.space",
    siteName: "GinieSpace",
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: "https://app.ginie.space/og-catalog.jpg",
        width: 1200,
        height: 630,
        alt: "GinieSpace Digital Storefront & Catalog",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "GinieSpace | WhatsApp Business Commerce & Direct UPI Billing",
    description: "Launch your WhatsApp Store in 30 seconds with 0% gateway commission. Automated order receipts and customer discovery.",
    images: ["https://app.ginie.space/og-catalog.jpg"],
  },
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.svg",
    apple: "/logo.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#25D366",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en-IN">
      <head>
        <link rel="preconnect" href="https://app.ginie.space" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://api.ginie.space" />
        <style
          dangerouslySetInnerHTML={{
            __html: `
              html, body { margin: 0; padding: 0; box-sizing: border-box; }
              *, *::before, *::after { box-sizing: inherit; }
              .show-on-mobile, .mobile-header-controls, .hero-cta-mobile { display: none !important; }
              .app-header { min-height: 68px; height: 68px; contain: layout; }
              .hero-section { max-width: 1200px; margin: 0 auto; padding: 64px 24px 32px; text-align: center; }
              .trust-stats-card { background: #ffffff; padding: 16px 10px; border-radius: 14px; border: 1px solid #e2e8f0; height: 100%; min-height: 88px; display: flex; flex-direction: column; justify-content: center; }
              @media(max-width:768px){
                .hide-on-mobile{display:none!important}
                .show-on-mobile{display:flex!important}
                .mobile-header-controls{display:flex!important;align-items:center;gap:8px}
                .hero-cta-mobile{display:flex!important;flex-direction:column;gap:12px;max-width:340px;margin:0 auto 28px}
                .hero-section{padding:36px 16px 24px}
              }
            `,
          }}
        />
      </head>
      <body style={{ margin: 0, padding: 0, fontFamily: "system-ui, -apple-system, sans-serif" }}>
        <AntdRegistry>
          <ConfigProvider
            theme={{
              token: {
                colorPrimary: "#25D366",
                borderRadius: 8,
              },
            }}
          >
            <AuthProvider>
              <AnalyticsTracker />
              {children}
            </AuthProvider>
          </ConfigProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}