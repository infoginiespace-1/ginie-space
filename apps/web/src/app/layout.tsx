import type { Metadata, Viewport } from "next";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { ConfigProvider } from "antd";
import { AuthProvider } from "../context/AuthContext";
import { AnalyticsTracker } from "../components/AnalyticsTracker";
import React from "react";

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
              html, body {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
                -webkit-font-smoothing: antialiased;
                -moz-osx-font-smoothing: grayscale;
              }
              *, *::before, *::after {
                box-sizing: inherit;
              }
              .app-header {
                min-height: 64px;
                height: 64px;
                contain: layout;
                transition: all 0.2s ease;
              }
              .nav-link-pill {
                color: #475569;
                text-decoration: none;
                font-weight: 500;
                font-size: 14px;
                padding: 6px 12px;
                border-radius: 8px;
                transition: all 0.15s ease;
              }
              .nav-link-pill:hover {
                color: #059669;
                background: #f1f5f9;
              }
              .nav-dropdown-trigger {
                color: #475569;
                font-weight: 500;
                font-size: 14px;
                padding: 6px 12px;
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.15s ease;
                display: inline-flex;
                align-items: center;
                gap: 5px;
              }
              .nav-dropdown-trigger:hover {
                color: #059669;
                background: #f1f5f9;
              }
              .hero-section {
                max-width: 1200px;
                margin: 0 auto;
                padding: 64px 24px 32px;
                text-align: center;
              }
              .trust-stats-grid {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 12px;
                max-width: 960px;
                margin: 0 auto 36px;
                min-height: 88px;
                contain: layout;
              }
              .desktop-nav-links {
                display: flex;
                align-items: center;
                gap: 6px;
                height: 36px;
                contain: layout;
              }
              .roi-range-input {
                width: 100%;
                height: 8px;
                border-radius: 4px;
                background: #334155;
                accent-color: #25D366;
                cursor: pointer;
                margin: 12px 0 8px;
                outline: none;
              }
              .trust-stats-card {
                background: #ffffff;
                padding: 16px 10px;
                border-radius: 14px;
                border: 1px solid #e2e8f0;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
                height: 100%;
                min-height: 88px;
                display: flex;
                flex-direction: column;
                justify-content: center;
              }
              .hero-cta-group {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 16px;
                margin: 0 auto 32px;
                flex-wrap: wrap;
                min-height: 52px;
              }
              .hero-cta-primary-btn {
                background: #25D366 !important;
                border-color: #25D366 !important;
                color: #ffffff !important;
                height: 52px !important;
                padding-inline: 32px !important;
                font-weight: 700 !important;
                font-size: 16px !important;
                border-radius: 10px !important;
                box-shadow: 0 8px 24px rgba(37, 211, 102, 0.4) !important;
                display: inline-flex !important;
                align-items: center !important;
                justify-content: center !important;
              }
              .hero-cta-secondary-btn {
                height: 52px !important;
                padding-inline: 24px !important;
                font-weight: 600 !important;
                font-size: 15px !important;
                border-radius: 10px !important;
                border: 1px solid #cbd5e1 !important;
                background: #ffffff !important;
                color: #1e293b !important;
                display: inline-flex !important;
                align-items: center !important;
                justify-content: center !important;
              }
              .direct-bank-strip {
                max-width: 920px;
                margin: 0 auto 36px;
                background: #ffffff;
                border-radius: 14px;
                padding: 14px 20px;
                border: 1px solid #e2e8f0;
                display: flex;
                align-items: center;
                justify-content: space-between;
                flex-direction: row;
                flex-wrap: wrap;
                gap: 12px;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
                contain: layout style;
                min-height: 56px;
              }
              .direct-bank-title {
                display: flex;
                align-items: center;
                gap: 8px;
              }
              .direct-bank-tags {
                display: flex;
                flex-wrap: wrap;
                align-items: center;
                justify-content: center;
                gap: 6px;
              }
              .bank-tag {
                display: inline-flex;
                align-items: center;
                font-size: 12px;
                line-height: 20px;
                font-weight: 600;
                padding: 2px 8px;
                border-radius: 6px;
                border: 1px solid transparent;
                white-space: nowrap;
              }
              .tag-phonepe { color: #0958d9; background: #e6f4ff; border-color: #91caff; }
              .tag-gpay { color: #08979c; background: #e6fffb; border-color: #87e8de; }
              .tag-paytm { color: #1d39c4; background: #f0f5ff; border-color: #adc6ff; }
              .tag-bhim { color: #389e0d; background: #f6ffed; border-color: #b7eb8f; }
              .tag-bank { color: #531dab; background: #f9f0ff; border-color: #d3adf7; }
              .tag-zero-commission {
                color: #d46b08;
                background: #fff7e6;
                border-color: #ffd591;
                font-weight: 700;
                padding: 3px 10px;
                border-radius: 6px;
              }
              .show-on-mobile,
              .mobile-header-controls,
              .hero-cta-mobile {
                display: none !important;
              }
              @media(max-width:768px){
                .hide-on-mobile { display: none !important; }
                .show-on-mobile { display: flex !important; }
                .mobile-header-controls { display: flex !important; align-items: center; gap: 8px; }
                .hero-section { padding: 36px 16px 24px; }
                .trust-stats-grid {
                  grid-template-columns: repeat(2, 1fr) !important;
                  min-height: 188px !important;
                  margin: 0 16px 32px !important;
                }
                .hero-cta-group {
                  flex-direction: column !important;
                  gap: 12px !important;
                  max-width: 340px !important;
                  margin: 0 auto 28px !important;
                  min-height: 108px !important;
                }
                .hero-cta-primary-btn, .hero-cta-secondary-btn {
                  width: 100% !important;
                  height: 48px !important;
                  padding-inline: 16px !important;
                }
                .direct-bank-strip {
                  padding: 14px 12px !important;
                  justify-content: center !important;
                  flex-direction: column !important;
                  min-height: 154px !important;
                  margin: 0 16px 32px !important;
                  text-align: center;
                  gap: 10px !important;
                }
                .direct-bank-title {
                  justify-content: center !important;
                }
                .app-header { min-height: 58px !important; height: 58px !important; }
                .brand-subtitle-mobile { display: none !important; }
                .mobile-flex-col { flex-direction: column !important; }
                .mobile-w-full { width: 100% !important; }
                .mobile-center { text-align: center !important; justify-content: center !important; }
                .mobile-p-12 { padding: 12px !important; }
                .mobile-p-16 { padding: 16px !important; }
              }
              @media (min-width: 769px) {
                .show-on-mobile { display: none !important; }
                .mobile-only-flex { display: none !important; }
              }
              .mobile-swipe-tabs {
                display: flex !important;
                overflow-x: auto !important;
                -webkit-overflow-scrolling: touch !important;
                white-space: nowrap !important;
                scrollbar-width: none !important;
                -ms-overflow-style: none !important;
                gap: 8px;
                padding: 4px;
              }
              .mobile-swipe-tabs::-webkit-scrollbar { display: none !important; }
              img { max-width: 100%; height: auto; }
              .table-responsive-wrapper { width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; }
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