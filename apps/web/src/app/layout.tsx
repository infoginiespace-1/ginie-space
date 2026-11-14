import type { Metadata, Viewport } from "next";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { ConfigProvider } from "antd";
import { AuthProvider } from "../context/AuthContext";
import { AnalyticsTracker } from "../components/AnalyticsTracker";
import React from "react";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://ginie.space"),
  title: {
    default: "GinieSpace | WhatsApp Business Commerce, Hyperlocal Leads & Direct UPI Billing",
    template: "%s | GinieSpace",
  },
  description: "Automate your sales, orders, and customer discovery directly through WhatsApp with 0% payment gateway commission. Free online dukaan & digital catalog builder.",
  keywords: [
    "GinieSpace",
    "ginie.space",
    "WhatsApp Store Builder",
    "Online Dukaan",
    "Direct UPI Billing",
    "WhatsApp Commerce",
    "B2B Leads India",
    "Zero Commission Store",
    "Hyperlocal Catalog",
  ],
  authors: [{ name: "GinieSpace Team", url: "https://ginie.space" }],
  creator: "GinieSpace",
  publisher: "GinieSpace",
  alternates: {
    canonical: "https://ginie.space",
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
    url: "https://ginie.space",
    siteName: "GinieSpace",
    locale: "en_IN",
    type: "website",
  },
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
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
    <html lang="en">
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