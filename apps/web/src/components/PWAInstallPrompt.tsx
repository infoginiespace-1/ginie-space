"use client";

import React, { useEffect, useState } from "react";
import { Button, Space, Typography } from "antd";
import { DownloadOutlined, CloseOutlined, MobileOutlined } from "@ant-design/icons";

const { Text } = Typography;

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [visible, setVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    // 1. Register Service Worker
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((reg) => {
            console.log("[PWA] Service Worker registered with scope:", reg.scope);
          })
          .catch((err) => {
            console.warn("[PWA] Service Worker registration failed:", err);
          });
      });
    }

    // 2. Check if already installed as standalone
    if (typeof window !== "undefined") {
      const isStandalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as any).standalone === true;

      if (isStandalone) {
        return; // Already installed, do not show prompt
      }

      // Check if user dismissed recently (within 7 days)
      const dismissedAt = localStorage.getItem("ginie_pwa_dismissed_at");
      if (dismissedAt) {
        const diffDays = (Date.now() - Number(dismissedAt)) / (1000 * 60 * 60 * 24);
        if (diffDays < 7) {
          return;
        }
      }

      // 3. Detect iOS Safari
      const ua = window.navigator.userAgent.toLowerCase();
      const isIphone = /iphone|ipad|ipod/.test(ua);
      const isSafari = /safari/.test(ua) && !/chrome|crios|crmo/.test(ua);
      if (isIphone && isSafari) {
        setIsIOS(true);
        // Delay showing banner slightly so page loads first
        const t = setTimeout(() => setVisible(true), 2500);
        return () => clearTimeout(t);
      }

      // 4. Listen to standard beforeinstallprompt (Android / Chrome)
      const handleBeforeInstall = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e);
        setVisible(true);
      };

      window.addEventListener("beforeinstallprompt", handleBeforeInstall);
      return () => {
        window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      };
    }
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }

    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log("[PWA] User response to install:", outcome);
    setDeferredPrompt(null);
    setVisible(false);
  };

  const handleDismiss = () => {
    setVisible(false);
    setShowIOSGuide(false);
    try {
      localStorage.setItem("ginie_pwa_dismissed_at", String(Date.now()));
    } catch {}
  };

  if (!visible) return null;

  return (
    <div
      className="no-print"
      style={{
        position: "fixed",
        top: 60,
        left: "50%",
        transform: "translateX(-50%)",
        width: "calc(100% - 24px)",
        maxWidth: 480,
        zIndex: 1050,
        background: "linear-gradient(135deg, #064e3b 0%, #065f46 100%)",
        color: "#ffffff",
        padding: "10px 14px",
        borderRadius: 12,
        boxShadow: "0 10px 25px -5px rgba(6, 95, 70, 0.4), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
        border: "1px solid rgba(255, 255, 255, 0.2)",
        animation: "slideDown 0.3s ease-out",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1 }}>
          <img
            src="/logo-sm.webp"
            alt="GinieSpace"
            width={32}
            height={32}
            style={{ borderRadius: 8, flexShrink: 0, boxShadow: "0 2px 6px rgba(0,0,0,0.2)" }}
          />
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#ffffff", lineHeight: 1.2 }}>
              Install GinieSpace App
            </div>
            <div style={{ fontSize: 11, color: "#a7f3d0", lineHeight: 1.3 }}>
              Fast 1-tap launch, 0 MB storage, real-time alerts
            </div>
          </div>
        </div>

        <Space size={6}>
          <Button
            type="primary"
            size="small"
            icon={<DownloadOutlined />}
            onClick={handleInstallClick}
            style={{
              background: "#25D366",
              borderColor: "#25D366",
              fontWeight: 700,
              fontSize: 12,
              borderRadius: 6,
              boxShadow: "0 2px 6px rgba(37, 211, 102, 0.3)",
            }}
          >
            Install
          </Button>
          <Button
            type="text"
            size="small"
            icon={<CloseOutlined style={{ color: "#a7f3d0" }} />}
            onClick={handleDismiss}
            aria-label="Dismiss install banner"
            style={{ padding: 4 }}
          />
        </Space>
      </div>

      {showIOSGuide && (
        <div
          style={{
            marginTop: 8,
            padding: 8,
            background: "rgba(0, 0, 0, 0.25)",
            borderRadius: 8,
            fontSize: 11,
            color: "#ecfdf5",
          }}
        >
          To install on iPhone/iPad: Tap the <strong>Share</strong> button (box with arrow) at the bottom of Safari, then tap <strong>&quot;Add to Home Screen&quot;</strong>.
        </div>
      )}
    </div>
  );
}
