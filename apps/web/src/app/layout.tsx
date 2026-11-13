import type { Metadata, Viewport } from "next";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { ConfigProvider } from "antd";
import { AuthProvider } from "../context/AuthContext";
import React from "react";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://ginie.space"),
  title: {
    default: "GinieSpace | WhatsApp Business Commerce, Hyperlocal Leads & Direct UPI Billing",
    template: "%s | GinieSpace",
  },
  description: "Automate your sales, orders, and customer discovery directly through WhatsApp with 0% payment gateway commission.",
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
            <AuthProvider>{children}</AuthProvider>
          </ConfigProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}