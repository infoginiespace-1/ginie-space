"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { translations, Locale } from "../lib/translations";
import {
  Button,
  Card,
  Col,
  Row,
  Space,
  Spin,
  Tag,
  Typography,
  Tabs,
  Badge,
  Slider,
  Collapse,
  Divider,
  message,
  Rate,
  Modal,
  Drawer,
  Grid,
  Segmented,
} from "antd";
import {
  WhatsAppOutlined,
  ShopOutlined,
  SearchOutlined,
  FileTextOutlined,
  ArrowRightOutlined,
  CheckCircleOutlined,
  CrownOutlined,
  SafetyCertificateOutlined,
  ThunderboltOutlined,
  TeamOutlined,
  DollarOutlined,
  QrcodeOutlined,
  CheckOutlined,
  PhoneOutlined,
  StarOutlined,
  CustomerServiceOutlined,
  RocketOutlined,
  BankOutlined,
  CopyOutlined,
  EnvironmentOutlined,
  LockOutlined,
  PlayCircleOutlined,
  MobileOutlined,
  LaptopOutlined,
  RightOutlined,
  ShoppingOutlined,
  ClockCircleOutlined,
  SendOutlined,
  MenuOutlined,
  CloseOutlined,
} from "@ant-design/icons";

const { Title, Text, Paragraph } = Typography;

export default function LandingPageClient() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const screens = Grid.useBreakpoint();
  const isMobile = screens.md === false;

  // Global Language state (en: Pure English, hi: Friendly Hinglish)
  const [locale, setLocale] = useState<Locale>("hi");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("ginie_locale") as Locale;
      if (saved === "en" || saved === "hi") {
        setLocale(saved);
      }
    } catch {}
  }, []);

  const handleLocaleChange = (newLoc: Locale) => {
    setLocale(newLoc);
    try {
      localStorage.setItem("ginie_locale", newLoc);
    } catch {}
  };

  const t = translations[locale];

  // Mobile drawer state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  // Mobile twin device preview toggle
  const [deviceMockupView, setDeviceMockupView] = useState<"store" | "merchant">("store");

  // Redirect logged-in merchant directly to their dashboard
  useEffect(() => {
    if (!loading && user) {
      router.replace("/dashboard");
    }
  }, [user, loading, router]);

  // Billing Cycle state (Monthly ₹99 vs Yearly ₹999)
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  // Interactive ROI Calculator State (Monthly sales in ₹)
  const [monthlySales, setMonthlySales] = useState<number>(100000);
  // Interactive Tour Active Tab
  const [tourTab, setTourTab] = useState<string>("sync");
  // Video walkthrough modal
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  // Live Chat Simulator state
  const [simStep, setSimStep] = useState<number>(1);

  // Calculations for zero-fee gateway savings
  const traditionalGatewayFee = Math.round(monthlySales * 0.025); // ~2.5% avg gateway charge
  const ginieSpaceFee = billingCycle === "monthly" ? 99 : 83; // ₹83/mo on yearly
  const monthlySavings = Math.max(0, traditionalGatewayFee - ginieSpaceFee);
  const [copiedLink, setCopiedLink] = useState(false);

  const handleCopyLink = (text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedLink(true);
    message.success("Link copied to clipboard!");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", color: "#0f172a", overflowX: "hidden", paddingBottom: isMobile ? 64 : 0 }}>
      {/* Top Banner Notice */}
      <div
        style={{
          background: "linear-gradient(90deg, #047857 0%, #059669 100%)",
          color: "#fff",
          padding: "8px 16px",
          textAlign: "center",
          fontSize: 13,
          fontWeight: 600,
        }}
      >
        <span>🇮🇳 Built specifically for Indian Retailers, Wholesalers &amp; Service MSMEs • 100% Direct Bank UPI</span>
      </div>

      {/* Navigation Header */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 1000,
          background: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid #e2e8f0",
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            padding: isMobile ? "10px 16px" : "14px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          {/* Logo & Brand */}
          <div
            style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}
            onClick={() => router.push("/")}
          >
            <div
              style={{
                width: isMobile ? 34 : 38,
                height: isMobile ? 34 : 38,
                borderRadius: 10,
                background: "linear-gradient(135deg, #25D366 0%, #128C7E 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontWeight: 800,
                fontSize: isMobile ? 18 : 20,
                boxShadow: "0 4px 12px rgba(37, 211, 102, 0.3)",
              }}
            >
              G
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: isMobile ? 18 : 19, color: "#0f172a", lineHeight: 1.1, letterSpacing: "-0.02em" }}>
                GinieSpace
              </div>
              <div style={{ fontSize: 10, color: "#64748b", fontWeight: 500 }}>
                Smart WhatsApp Commerce Hub
              </div>
            </div>
          </div>

          {/* Desktop Nav Links */}
          <div style={{ display: "flex", alignItems: "center", gap: 24 }} className="hide-on-mobile">
            <a href="#how-it-works" style={{ color: "#475569", textDecoration: "none", fontWeight: 500, fontSize: 14 }}>
              {t.nav.howItWorks}
            </a>
            <a href="#demo-tour" style={{ color: "#475569", textDecoration: "none", fontWeight: 500, fontSize: 14 }}>
              {t.twinDevice.title.slice(0, 15)}
            </a>
            <a href="#solutions" style={{ color: "#475569", textDecoration: "none", fontWeight: 500, fontSize: 14 }}>
              {t.nav.solutions}
            </a>
            <a href="#pricing" style={{ color: "#475569", textDecoration: "none", fontWeight: 500, fontSize: 14 }}>
              {t.nav.pricing}
            </a>
            <a href="#faqs" style={{ color: "#475569", textDecoration: "none", fontWeight: 500, fontSize: 14 }}>
              {t.nav.faq}
            </a>
          </div>

          {/* Desktop Action CTAs */}
          <Space size="middle" className="hide-on-mobile">
            <Segmented
              value={locale}
              onChange={(val: any) => handleLocaleChange(val)}
              options={[
                { label: "🇬🇧 English", value: "en" },
                { label: "🇮🇳 Hinglish", value: "hi" },
              ]}
              style={{ background: "#f1f5f9", fontWeight: 600 }}
            />
            <Button
              onClick={() => router.push("/login")}
              style={{ fontWeight: 600, borderColor: "#cbd5e1", borderRadius: 8 }}
            >
              {t.nav.login}
            </Button>
            <Button
              type="primary"
              style={{
                background: "#25D366",
                borderColor: "#25D366",
                fontWeight: 700,
                borderRadius: 8,
                boxShadow: "0 4px 14px rgba(37, 211, 102, 0.35)",
              }}
              onClick={() => router.push("/signup")}
            >
              {t.nav.getStarted}
            </Button>
          </Space>

          {/* Mobile Right Controls (Lang Toggle + Sign In + Hamburger) */}
          <div className="show-on-mobile" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Segmented
              size="small"
              value={locale}
              onChange={(val: any) => handleLocaleChange(val)}
              options={[
                { label: "EN", value: "en" },
                { label: "HI", value: "hi" },
              ]}
              style={{ background: "#f1f5f9", fontWeight: 600 }}
            />
            <Button
              size="small"
              onClick={() => router.push("/login")}
              style={{ fontWeight: 600, borderColor: "#cbd5e1", borderRadius: 6, fontSize: 13 }}
            >
              {t.nav.login}
            </Button>
            <Button
              type="text"
              icon={<MenuOutlined style={{ fontSize: 20, color: "#0f172a" }} />}
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              style={{ padding: "4px 8px" }}
            />
          </div>
        </div>
      </header>

      {/* Mobile Slide-Over Navigation Drawer */}
      <Drawer
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: "linear-gradient(135deg, #25D366 0%, #128C7E 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontWeight: 800,
                fontSize: 18,
              }}
            >
              G
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 16, color: "#0f172a", lineHeight: 1.1 }}>GinieSpace</div>
              <div style={{ fontSize: 11, color: "#64748b" }}>WhatsApp Commerce Hub</div>
            </div>
          </div>
        }
        placement="right"
        width={300}
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        styles={{ body: { padding: "16px 20px" } }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Language Switcher in Mobile Drawer */}
          <div style={{ paddingBottom: 12, borderBottom: "1px solid #f1f5f9" }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#64748b", marginBottom: 6 }}>
              {locale === "en" ? "Select Language:" : "Bhasha Chunein:"}
            </div>
            <Segmented
              block
              value={locale}
              onChange={(val: any) => handleLocaleChange(val)}
              options={[
                { label: "🇬🇧 English", value: "en" },
                { label: "🇮🇳 Hinglish", value: "hi" },
              ]}
              style={{ background: "#f1f5f9", fontWeight: 600 }}
            />
          </div>

          <a
            href="#how-it-works"
            onClick={() => setMobileMenuOpen(false)}
            style={{ color: "#1e293b", fontWeight: 600, fontSize: 15, textDecoration: "none", padding: "8px 0", borderBottom: "1px solid #f1f5f9" }}
          >
            ⚡ {t.nav.howItWorks}
          </a>
          <a
            href="#demo-tour"
            onClick={() => setMobileMenuOpen(false)}
            style={{ color: "#1e293b", fontWeight: 600, fontSize: 15, textDecoration: "none", padding: "8px 0", borderBottom: "1px solid #f1f5f9" }}
          >
            🎮 {t.twinDevice.title.slice(0, 22)}
          </a>
          <a
            href="#solutions"
            onClick={() => setMobileMenuOpen(false)}
            style={{ color: "#1e293b", fontWeight: 600, fontSize: 15, textDecoration: "none", padding: "8px 0", borderBottom: "1px solid #f1f5f9" }}
          >
            📦 {t.nav.solutions}
          </a>
          <a
            href="#pricing"
            onClick={() => setMobileMenuOpen(false)}
            style={{ color: "#1e293b", fontWeight: 600, fontSize: 15, textDecoration: "none", padding: "8px 0", borderBottom: "1px solid #f1f5f9" }}
          >
            👑 {t.nav.pricing}
          </a>
          <a
            href="#calculator"
            onClick={() => setMobileMenuOpen(false)}
            style={{ color: "#1e293b", fontWeight: 600, fontSize: 15, textDecoration: "none", padding: "8px 0", borderBottom: "1px solid #f1f5f9" }}
          >
            💰 {locale === "en" ? "UPI Commission Savings" : "Zero Commission Bachaat"}
          </a>
          <a
            href="#faqs"
            onClick={() => setMobileMenuOpen(false)}
            style={{ color: "#1e293b", fontWeight: 600, fontSize: 15, textDecoration: "none", padding: "8px 0", borderBottom: "1px solid #f1f5f9" }}
          >
            ❓ {t.nav.faq}
          </a>

          {/* Legal Pages in Mobile Drawer */}
          <div style={{ paddingTop: 8, borderBottom: "1px solid #f1f5f9", paddingBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
              {t.footer.legalTitle}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <Link
                href="/terms"
                onClick={() => setMobileMenuOpen(false)}
                style={{ color: "#475569", fontWeight: 500, fontSize: 14, textDecoration: "none" }}
              >
                📜 {t.footer.terms}
              </Link>
              <Link
                href="/privacy"
                onClick={() => setMobileMenuOpen(false)}
                style={{ color: "#475569", fontWeight: 500, fontSize: 14, textDecoration: "none" }}
              >
                🔒 {t.footer.privacy}
              </Link>
              <Link
                href="/refund"
                onClick={() => setMobileMenuOpen(false)}
                style={{ color: "#475569", fontWeight: 500, fontSize: 14, textDecoration: "none" }}
              >
                💳 {t.footer.refund}
              </Link>
            </div>
          </div>

          <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
            <Button
              type="primary"
              block
              size="large"
              style={{
                background: "#25D366",
                borderColor: "#25D366",
                fontWeight: 700,
                height: 46,
                borderRadius: 10,
                boxShadow: "0 4px 14px rgba(37, 211, 102, 0.35)",
              }}
              onClick={() => {
                setMobileMenuOpen(false);
                router.push("/signup");
              }}
            >
              {t.nav.getStarted}
            </Button>
            <Button
              block
              size="large"
              style={{ fontWeight: 600, height: 46, borderRadius: 10, borderColor: "#cbd5e1" }}
              onClick={() => {
                setMobileMenuOpen(false);
                router.push("/login");
              }}
            >
              {t.nav.login}
            </Button>
            <Button
              block
              size="large"
              icon={<WhatsAppOutlined />}
              style={{
                background: "#f0fdf4",
                borderColor: "#86efac",
                color: "#166534",
                fontWeight: 600,
                height: 46,
                borderRadius: 10,
              }}
              href="https://wa.me/919279259690"
              target="_blank"
              rel="noopener noreferrer"
            >
              WhatsApp (+91 92792 59690)
            </Button>
          </div>
        </div>
      </Drawer>

      {/* Hero Section */}
      <section style={{ maxWidth: 1200, margin: "0 auto", padding: isMobile ? "36px 16px 24px" : "64px 24px 32px", textAlign: "center" }}>
        <div style={{ display: "inline-block", marginBottom: 16 }}>
          <Tag
            color="success"
            style={{
              padding: "6px 14px",
              borderRadius: 999,
              fontSize: isMobile ? 12 : 13,
              fontWeight: 600,
              background: "#ecfdf5",
              borderColor: "#a7f3d0",
              color: "#065f46",
              whiteSpace: "normal",
              lineHeight: 1.4,
            }}
          >
            {t.hero.badge}
          </Tag>
        </div>

        <Title
          level={1}
          style={{
            fontSize: isMobile ? "1.85rem" : "clamp(2.1rem, 4.8vw, 3.8rem)",
            fontWeight: 800,
            color: "#0f172a",
            lineHeight: 1.2,
            letterSpacing: "-0.03em",
            maxWidth: 960,
            margin: "0 auto 18px",
          }}
        >
          {t.hero.titleStart}{" "}
          <span style={{ color: "#059669", background: "linear-gradient(135deg, #059669 0%, #25D366 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            {t.hero.titleHighlight}
          </span>{" "}
          {t.hero.titleEnd}
        </Title>

        <Paragraph
          style={{
            fontSize: isMobile ? "0.95rem" : "clamp(1rem, 2vw, 1.25rem)",
            color: "#475569",
            maxWidth: 780,
            margin: "0 auto 28px",
            lineHeight: 1.6,
          }}
        >
          {t.hero.subtitle}
        </Paragraph>

        {/* Hero CTAs */}
        {isMobile ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 340, margin: "0 auto 28px" }}>
            <Button
              type="primary"
              size="large"
              block
              icon={<ArrowRightOutlined />}
              style={{
                background: "#25D366",
                borderColor: "#25D366",
                height: 48,
                fontWeight: 700,
                fontSize: 16,
                borderRadius: 10,
                boxShadow: "0 6px 20px rgba(37, 211, 102, 0.4)",
              }}
              onClick={() => router.push("/signup")}
            >
              {t.hero.ctaPrimary}
            </Button>
            <Button
              size="large"
              block
              icon={<PlayCircleOutlined style={{ color: "#059669", fontSize: 18 }} />}
              style={{
                height: 48,
                fontWeight: 600,
                fontSize: 15,
                borderRadius: 10,
                borderColor: "#cbd5e1",
                background: "#fff",
              }}
              onClick={() => setVideoModalOpen(true)}
            >
              {t.hero.ctaSecondary}
            </Button>
          </div>
        ) : (
          <Space size="middle" wrap style={{ justifyContent: "center", marginBottom: 28 }}>
            <Button
              type="primary"
              size="large"
              icon={<ArrowRightOutlined />}
              style={{
                background: "#25D366",
                borderColor: "#25D366",
                height: 52,
                paddingInline: 32,
                fontWeight: 700,
                fontSize: 16,
                borderRadius: 10,
                boxShadow: "0 8px 24px rgba(37, 211, 102, 0.4)",
              }}
              onClick={() => router.push("/signup")}
            >
              {t.hero.ctaPrimary}
            </Button>

            <Button
              size="large"
              icon={<PlayCircleOutlined style={{ color: "#059669", fontSize: 18 }} />}
              style={{
                height: 52,
                paddingInline: 24,
                fontWeight: 600,
                fontSize: 15,
                borderRadius: 10,
                borderColor: "#cbd5e1",
                background: "#fff",
              }}
              onClick={() => setVideoModalOpen(true)}
            >
              {t.hero.ctaSecondary}
            </Button>
          </Space>
        )}

        {/* Direct UPI Ecosystem Trust Strip */}
        <div
          style={{
            maxWidth: 920,
            margin: "0 auto 36px",
            background: "#ffffff",
            borderRadius: 14,
            padding: isMobile ? "12px 14px" : "14px 20px",
            border: "1px solid #e2e8f0",
            display: "flex",
            alignItems: "center",
            justifyContent: isMobile ? "center" : "space-between",
            flexDirection: isMobile ? "column" : "row",
            flexWrap: "wrap",
            gap: 12,
            boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <BankOutlined style={{ color: "#059669", fontSize: 18 }} />
            <Text strong style={{ fontSize: 13, color: "#334155" }}>
              100% Direct Bank Settlements:
            </Text>
          </div>

          <Space size="small" wrap style={{ justifyContent: "center" }}>
            <Tag color="blue" style={{ fontWeight: 600, padding: "2px 8px", borderRadius: 6 }}>
              PhonePe
            </Tag>
            <Tag color="cyan" style={{ fontWeight: 600, padding: "2px 8px", borderRadius: 6 }}>
              Google Pay
            </Tag>
            <Tag color="geekblue" style={{ fontWeight: 600, padding: "2px 8px", borderRadius: 6 }}>
              Paytm UPI
            </Tag>
            <Tag color="green" style={{ fontWeight: 600, padding: "2px 8px", borderRadius: 6 }}>
              BHIM UPI
            </Tag>
            <Tag color="purple" style={{ fontWeight: 600, padding: "2px 8px", borderRadius: 6 }}>
              Any Bank Account
            </Tag>
          </Space>

          <Tag color="gold" style={{ fontWeight: 700, padding: "3px 8px" }}>
            0% Gateway Commission
          </Tag>
        </div>
      </section>

      {/* TWIN DEVICE SHOWCASE (Desktop Dashboard + Mobile Customer Storefront) */}
      <section style={{ maxWidth: 1200, margin: "0 auto", padding: isMobile ? "0 16px 48px" : "0 24px 64px" }}>
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <Tag color="purple" style={{ padding: "4px 12px", borderRadius: 999, fontWeight: 600 }}>
            {t.twinDevice.tag}
          </Tag>
          <Title level={3} style={{ marginTop: 8, color: "#0f172a", fontSize: isMobile ? "1.3rem" : undefined }}>
            {t.twinDevice.title}
          </Title>
        </div>

        {/* Mobile Switcher Toggle */}
        {isMobile && (
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
            <Segmented
              value={deviceMockupView}
              onChange={(val) => setDeviceMockupView(val as "store" | "merchant")}
              options={[
                { label: t.twinDevice.storeTab, value: "store" },
                { label: t.twinDevice.merchantTab, value: "merchant" },
              ]}
              size="large"
              style={{ background: "#e2e8f0", padding: 4, borderRadius: 10, fontWeight: 600 }}
            />
          </div>
        )}

        <Row gutter={[24, 24]} align="stretch" justify="center">
          {/* Left Side: Desktop Merchant Portal Mockup (65% on Desktop) */}
          {(!isMobile || deviceMockupView === "merchant") && (
            <Col xs={24} lg={15}>
              <div
                style={{
                  background: "#ffffff",
                  borderRadius: 18,
                  border: "1px solid #cbd5e1",
                  boxShadow: "0 20px 48px -12px rgba(15, 23, 42, 0.12)",
                  overflow: "hidden",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {/* Window Header */}
                <div
                  style={{
                    background: "#0f172a",
                    padding: isMobile ? "10px 14px" : "12px 18px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: 8,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ef4444" }} />
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#f59e0b" }} />
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#10b981" }} />
                    <Text strong style={{ color: "#94a3b8", fontSize: 12, marginLeft: 6 }}>
                      <LaptopOutlined /> {t.twinDevice.hubTitle}
                    </Text>
                  </div>
                  <Tag color="success" icon={<CheckCircleOutlined />} style={{ fontWeight: 600, margin: 0, fontSize: 11 }}>
                    {isMobile ? "WhatsApp Live" : t.twinDevice.statusLive}
                  </Tag>
                </div>

                {/* Top Stats */}
                <div style={{ padding: isMobile ? "12px 14px" : "16px 20px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                  <Row gutter={[10, 10]}>
                    <Col xs={12} sm={8}>
                      <div style={{ background: "#fff", padding: "10px 12px", borderRadius: 8, border: "1px solid #e2e8f0" }}>
                        <Text type="secondary" style={{ fontSize: 11 }}>{t.twinDevice.todayRevenue}</Text>
                        <div style={{ fontSize: 17, fontWeight: 800, color: "#059669" }}>₹18,450</div>
                      </div>
                    </Col>
                    <Col xs={12} sm={8}>
                      <div style={{ background: "#fff", padding: "10px 12px", borderRadius: 8, border: "1px solid #e2e8f0" }}>
                        <Text type="secondary" style={{ fontSize: 11 }}>{t.twinDevice.activeProducts}</Text>
                        <div style={{ fontSize: 17, fontWeight: 800, color: "#0f172a" }}>142 Items</div>
                      </div>
                    </Col>
                    <Col xs={24} sm={8}>
                      <div style={{ background: "#fff", padding: "10px 12px", borderRadius: 8, border: "1px solid #e2e8f0" }}>
                        <Text type="secondary" style={{ fontSize: 11 }}>{t.twinDevice.localLeads}</Text>
                        <div style={{ fontSize: 17, fontWeight: 800, color: "#2563eb" }}>48 Found</div>
                      </div>
                    </Col>
                  </Row>
                </div>

                {/* Main Content inside Desktop View */}
                <div style={{ padding: isMobile ? 14 : 20, flex: 1, display: "flex", flexDirection: "column", gap: 14 }}>
                  {/* Simulated Order Notification */}
                  <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", padding: 14, borderRadius: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6, flexWrap: "wrap", gap: 6 }}>
                      <Text strong style={{ color: "#065f46", fontSize: 13 }}>📦 {t.twinDevice.orderTitle} #09ef13</Text>
                      <Tag color="green" style={{ margin: 0, fontSize: 11 }}>{t.twinDevice.instantConfirmed}</Tag>
                    </div>
                    <Text style={{ fontSize: 12, color: "#1e293b", display: "block" }}>
                      Customer: <strong>Rahul Sharma</strong> (+91 98765 XXXXX)
                    </Text>
                    <div style={{ fontSize: 12, color: "#475569", marginTop: 4 }}>
                      • 1x Premium Basmati Rice (1kg) - ₹110<br />
                      • 1x Cold Pressed Mustard Oil (500ml) - ₹75
                    </div>
                    <div style={{ marginTop: 8, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                      <Text strong style={{ color: "#059669", fontSize: 13 }}>Total: ₹185 (Direct Bank UPI)</Text>
                      <Space size="small">
                        <Button size="small" type="primary" style={{ background: "#25D366", borderColor: "#25D366" }}>
                          {t.twinDevice.printBill}
                        </Button>
                        <Button size="small">{t.twinDevice.dispatchAlert}</Button>
                      </Space>
                    </div>
                  </div>

                  {/* Hyperlocal Lead Card */}
                  <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", padding: 14, borderRadius: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4, flexWrap: "wrap", gap: 6 }}>
                      <Text strong style={{ color: "#1e3a8a", fontSize: 13 }}>Shree Krishna Kirana Store</Text>
                      <Tag color="blue" style={{ margin: 0, fontSize: 11 }}>LOCAL RETAILER</Tag>
                    </div>
                    <Text type="secondary" style={{ fontSize: 11, display: "block" }}>
                      <EnvironmentOutlined /> Sector 18, Noida • ⭐ 4.8 (142 reviews) • 📱 +91 98112 XXXXX
                    </Text>
                    <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <Button size="small" type="primary" icon={<WhatsAppOutlined />} style={{ background: "#25D366", borderColor: "#25D366" }}>
                        {t.twinDevice.pitchButton}
                      </Button>
                      <Button size="small">{t.twinDevice.saveToCrm}</Button>
                    </div>
                  </div>
                </div>
              </div>
            </Col>
          )}

          {/* Right Side: Mobile Smartphone Mockup (Customer View) (35% on Desktop) */}
          {(!isMobile || deviceMockupView === "store") && (
            <Col xs={24} lg={9}>
              <div
                style={{
                  background: "#0f172a",
                  borderRadius: 36,
                  padding: "12px",
                  boxShadow: "0 24px 60px -12px rgba(15, 23, 42, 0.25)",
                  border: "4px solid #334155",
                  height: "100%",
                  maxWidth: 360,
                  margin: "0 auto",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {/* Phone Speaker Notch */}
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
                  <div style={{ width: 64, height: 5, background: "#475569", borderRadius: 4 }} />
                </div>

                {/* Phone Screen Container */}
                <div
                  style={{
                    background: "#ffffff",
                    borderRadius: 24,
                    overflow: "hidden",
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  {/* Store Header inside Phone */}
                  <div style={{ background: "#25D366", color: "#fff", padding: "14px 16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: 14 }}>Sharma General Store</div>
                        <div style={{ fontSize: 10, opacity: 0.9 }}>app.ginie.space/shop/sharma-store</div>
                      </div>
                      <Tag color="gold" style={{ fontWeight: 700, margin: 0 }}>VERIFIED</Tag>
                    </div>
                  </div>

                  {/* Product Catalog Items inside Phone Screen */}
                  <div style={{ padding: "12px 14px", flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f1f5f9", paddingBottom: 8 }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>Premium Basmati Rice</div>
                        <div style={{ fontSize: 11, color: "#64748b" }}>1 kg Pack • In Stock</div>
                        <div style={{ fontWeight: 700, color: "#059669", fontSize: 13 }}>₹110</div>
                      </div>
                      <Button size="small" type="primary" style={{ background: "#25D366", borderColor: "#25D366" }}>
                        + Add
                      </Button>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f1f5f9", paddingBottom: 8 }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>Cold Pressed Mustard Oil</div>
                        <div style={{ fontSize: 11, color: "#64748b" }}>500 ml Bottle • In Stock</div>
                        <div style={{ fontWeight: 700, color: "#059669", fontSize: 13 }}>₹75</div>
                      </div>
                      <Button size="small" type="primary" style={{ background: "#25D366", borderColor: "#25D366" }}>
                        + Add
                      </Button>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>Organic Whole Wheat</div>
                        <div style={{ fontSize: 11, color: "#64748b" }}>5 kg Bag • Fresh Milling</div>
                        <div style={{ fontWeight: 700, color: "#059669", fontSize: 13 }}>₹240</div>
                      </div>
                      <Button size="small">+ Add</Button>
                    </div>
                  </div>

                  {/* Floating WhatsApp Checkout Button on Mobile */}
                  <div style={{ padding: "12px 14px", background: "#f8fafc", borderTop: "1px solid #e2e8f0" }}>
                    <Button
                      type="primary"
                      block
                      icon={<WhatsAppOutlined />}
                      style={{
                        background: "#25D366",
                        borderColor: "#25D366",
                        fontWeight: 700,
                        height: 40,
                        borderRadius: 10,
                        boxShadow: "0 4px 12px rgba(37, 211, 102, 0.35)",
                      }}
                    >
                      {t.twinDevice.placeOrder}
                    </Button>
                  </div>
                </div>
              </div>
            </Col>
          )}
        </Row>
      </section>

      {/* 3-STEP VISUAL FLOW GRAPHIC ("How It Works in 60 Seconds") */}
      <section id="how-it-works" style={{ background: "#ffffff", padding: "64px 24px", borderTop: "1px solid #e2e8f0", borderBottom: "1px solid #e2e8f0" }}>
        <div style={{ maxWidth: 1140, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <Tag color="green" style={{ padding: "4px 14px", borderRadius: 999, fontWeight: 700, fontSize: 13 }}>
              {t.howItWorks.tag}
            </Tag>
            <Title level={2} style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.6rem)", fontWeight: 800, marginTop: 12, color: "#0f172a" }}>
              {t.howItWorks.title}
            </Title>
            <Paragraph style={{ color: "#64748b", fontSize: 16 }}>
              {t.howItWorks.subtitle}
            </Paragraph>
          </div>

          <Row gutter={[24, 24]}>
            {/* Step 1 */}
            <Col xs={24} md={8}>
              <Card
                style={{
                  borderRadius: 16,
                  height: "100%",
                  border: "1px solid #e2e8f0",
                  background: "#f8fafc",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: 12,
                    right: 16,
                    fontSize: 48,
                    fontWeight: 900,
                    color: "rgba(15, 23, 42, 0.05)",
                    lineHeight: 1,
                  }}
                >
                  01
                </div>
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 14,
                    background: "#ecfdf5",
                    color: "#059669",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 26,
                    marginBottom: 20,
                  }}
                >
                  <QrcodeOutlined />
                </div>
                <Tag color="green" style={{ fontWeight: 700, marginBottom: 8 }}>{t.howItWorks.step1Tag}</Tag>
                <Title level={4} style={{ color: "#0f172a", margin: "4px 0 10px" }}>
                  {t.howItWorks.step1Title}
                </Title>
                <Paragraph style={{ color: "#64748b", fontSize: 14, lineHeight: 1.6 }}>
                  {t.howItWorks.step1Desc}
                </Paragraph>
                <Tag color="cyan">{t.howItWorks.step1Badge}</Tag>
              </Card>
            </Col>

            {/* Step 2 */}
            <Col xs={24} md={8}>
              <Card
                style={{
                  borderRadius: 16,
                  height: "100%",
                  border: "1px solid #e2e8f0",
                  background: "#f8fafc",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: 12,
                    right: 16,
                    fontSize: 48,
                    fontWeight: 900,
                    color: "rgba(15, 23, 42, 0.05)",
                    lineHeight: 1,
                  }}
                >
                  02
                </div>
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 14,
                    background: "#eff6ff",
                    color: "#2563eb",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 26,
                    marginBottom: 20,
                  }}
                >
                  <ShopOutlined />
                </div>
                <Tag color="blue" style={{ fontWeight: 700, marginBottom: 8 }}>{t.howItWorks.step2Tag}</Tag>
                <Title level={4} style={{ color: "#0f172a", margin: "4px 0 10px" }}>
                  {t.howItWorks.step2Title}
                </Title>
                <Paragraph style={{ color: "#64748b", fontSize: 14, lineHeight: 1.6 }}>
                  {t.howItWorks.step2Desc}
                </Paragraph>
                <Tag color="purple">{t.howItWorks.step2Badge}</Tag>
              </Card>
            </Col>

            {/* Step 3 */}
            <Col xs={24} md={8}>
              <Card
                style={{
                  borderRadius: 16,
                  height: "100%",
                  border: "1px solid #e2e8f0",
                  background: "#f8fafc",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: 12,
                    right: 16,
                    fontSize: 48,
                    fontWeight: 900,
                    color: "rgba(15, 23, 42, 0.05)",
                    lineHeight: 1,
                  }}
                >
                  03
                </div>
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 14,
                    background: "#fffbeb",
                    color: "#d97706",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 26,
                    marginBottom: 20,
                  }}
                >
                  <BankOutlined />
                </div>
                <Tag color="gold" style={{ fontWeight: 700, marginBottom: 8 }}>{t.howItWorks.step3Tag}</Tag>
                <Title level={4} style={{ color: "#0f172a", margin: "4px 0 10px" }}>
                  {t.howItWorks.step3Title}
                </Title>
                <Paragraph style={{ color: "#64748b", fontSize: 14, lineHeight: 1.6 }}>
                  {t.howItWorks.step3Desc}
                </Paragraph>
                <Tag color="gold">{t.howItWorks.step3Badge}</Tag>
              </Card>
            </Col>
          </Row>
        </div>
      </section>

      {/* INTERACTIVE DEMO TOUR / SIMULATOR SECTION */}
      <section id="demo-tour" style={{ maxWidth: 1140, margin: isMobile ? "40px auto" : "64px auto", padding: isMobile ? "0 16px" : "0 24px" }}>
        <div style={{ textAlign: "center", marginBottom: isMobile ? 24 : 36 }}>
          <Tag color="blue" style={{ padding: "4px 14px", borderRadius: 999, fontWeight: 700, fontSize: 13 }}>
            {t.demoTour.tag}
          </Tag>
          <Title level={2} style={{ fontSize: isMobile ? "1.5rem" : "clamp(1.8rem, 3.5vw, 2.6rem)", fontWeight: 800, marginTop: 12, color: "#0f172a" }}>
            {t.demoTour.title}
          </Title>
          <Paragraph style={{ color: "#64748b", fontSize: isMobile ? 14 : 16 }}>
            {t.demoTour.subtitle}
          </Paragraph>

          {/* Tour Tabs Bar (Swipeable on Mobile) */}
          <div
            className={isMobile ? "mobile-swipe-tabs" : undefined}
            style={{
              display: isMobile ? "flex" : "inline-flex",
              background: "#e2e8f0",
              padding: 4,
              borderRadius: 12,
              gap: 4,
              maxWidth: "100%",
              overflowX: isMobile ? "auto" : undefined,
              justifyContent: isMobile ? "flex-start" : "center",
              margin: "0 auto",
            }}
          >
            <Button
              type={tourTab === "sync" ? "primary" : "text"}
              icon={<QrcodeOutlined />}
              onClick={() => setTourTab("sync")}
              style={{
                background: tourTab === "sync" ? "#0f172a" : "transparent",
                color: tourTab === "sync" ? "#fff" : "#475569",
                fontWeight: 600,
                borderRadius: 8,
                flexShrink: 0,
              }}
            >
              {t.demoTour.tabSync}
            </Button>
            <Button
              type={tourTab === "store" ? "primary" : "text"}
              icon={<ShopOutlined />}
              onClick={() => setTourTab("store")}
              style={{
                background: tourTab === "store" ? "#0f172a" : "transparent",
                color: tourTab === "store" ? "#fff" : "#475569",
                fontWeight: 600,
                borderRadius: 8,
                flexShrink: 0,
              }}
            >
              {t.demoTour.tabStore}
            </Button>
            <Button
              type={tourTab === "leads" ? "primary" : "text"}
              icon={<SearchOutlined />}
              onClick={() => setTourTab("leads")}
              style={{
                background: tourTab === "leads" ? "#0f172a" : "transparent",
                color: tourTab === "leads" ? "#fff" : "#475569",
                fontWeight: 600,
                borderRadius: 8,
                flexShrink: 0,
              }}
            >
              {t.demoTour.tabLeads}
            </Button>
            <Button
              type={tourTab === "billing" ? "primary" : "text"}
              icon={<FileTextOutlined />}
              onClick={() => setTourTab("billing")}
              style={{
                background: tourTab === "billing" ? "#0f172a" : "transparent",
                color: tourTab === "billing" ? "#fff" : "#475569",
                fontWeight: 600,
                borderRadius: 8,
                flexShrink: 0,
              }}
            >
              {t.demoTour.tabBilling}
            </Button>
          </div>
        </div>

        {/* Tour Stage Card */}
        <Card
          style={{
            borderRadius: 18,
            border: "1px solid #cbd5e1",
            boxShadow: "0 16px 40px rgba(15, 23, 42, 0.08)",
            padding: isMobile ? 12 : 20,
            background: "#ffffff",
          }}
        >
          {tourTab === "sync" && (
            <Row gutter={[24, 24]} align="middle">
              <Col xs={24} md={12}>
                <Tag color="green" style={{ fontWeight: 700, marginBottom: 8 }}>{t.demoTour.syncTag}</Tag>
                <Title level={3} style={{ color: "#0f172a", fontSize: isMobile ? "1.25rem" : undefined }}>{t.demoTour.syncTitle}</Title>
                <Paragraph style={{ color: "#64748b", lineHeight: 1.7, fontSize: 14 }}>
                  {t.demoTour.syncDesc}
                </Paragraph>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 14 }}>
                  <Tag color="success">{t.demoTour.syncBadge1}</Tag>
                  <Tag color="blue">{t.demoTour.syncBadge2}</Tag>
                  <Tag color="cyan">{t.demoTour.syncBadge3}</Tag>
                </div>
              </Col>
              <Col xs={24} md={12} style={{ textAlign: "center" }}>
                <div style={{ background: "#f8fafc", padding: isMobile ? 16 : 24, borderRadius: 14, border: "2px dashed #cbd5e1", display: "inline-block" }}>
                  <QrcodeOutlined style={{ fontSize: isMobile ? 80 : 120, color: "#25D366" }} />
                  <div style={{ marginTop: 12, fontWeight: 700, color: "#065f46", fontSize: 14 }}>
                    {t.demoTour.syncScanTitle}
                  </div>
                  <Text type="secondary" style={{ fontSize: 12 }}>{t.demoTour.syncSafeDelivery}</Text>
                </div>
              </Col>
            </Row>
          )}

          {tourTab === "store" && (
            <Row gutter={[24, 24]} align="middle">
              <Col xs={24} md={12}>
                <Tag color="blue" style={{ fontWeight: 700, marginBottom: 8 }}>{t.demoTour.storeTag}</Tag>
                <Title level={3} style={{ color: "#0f172a", fontSize: isMobile ? "1.25rem" : undefined }}>{t.demoTour.storeTitle}</Title>
                <Paragraph style={{ color: "#64748b", lineHeight: 1.7, fontSize: 14 }}>
                  {t.demoTour.storeDesc}
                </Paragraph>
                <div style={{ background: "#f1f5f9", padding: "10px 14px", borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
                  <Text strong style={{ fontSize: 13, color: "#0f172a", wordBreak: "break-all" }}>app.ginie.space/shop/kirana-hub</Text>
                  <Button size="small" icon={<CopyOutlined />} onClick={() => handleCopyLink("https://app.ginie.space/shop/demo")}>{copiedLink ? t.demoTour.storeCopied : t.demoTour.storeCopy}</Button>
                </div>
              </Col>
              <Col xs={24} md={12}>
                <div style={{ background: "#f8fafc", padding: isMobile ? 14 : 20, borderRadius: 14, border: "1px solid #e2e8f0" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <Text strong>{t.demoTour.storePreview}</Text>
                    <Tag color="green">142 Items</Tag>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{ background: "#fff", padding: "8px 12px", borderRadius: 8, display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                      <span>Premium Basmati Rice 1kg</span>
                      <strong style={{ color: "#059669" }}>₹110</strong>
                    </div>
                    <div style={{ background: "#fff", padding: "8px 12px", borderRadius: 8, display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                      <span>Cold Pressed Mustard Oil 500ml</span>
                      <strong style={{ color: "#059669" }}>₹75</strong>
                    </div>
                  </div>
                </div>
              </Col>
            </Row>
          )}

          {tourTab === "leads" && (
            <Row gutter={[24, 24]} align="middle">
              <Col xs={24} md={12}>
                <Tag color="cyan" style={{ fontWeight: 700, marginBottom: 8 }}>{t.demoTour.leadsTag}</Tag>
                <Title level={3} style={{ color: "#0f172a" }}>{t.demoTour.leadsTitle}</Title>
                <Paragraph style={{ color: "#64748b", lineHeight: 1.7, fontSize: 15 }}>
                  {t.demoTour.leadsDesc}
                </Paragraph>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 12 }}>
                  <Tag color="blue">{t.demoTour.leadsBadge1}</Tag>
                  <Tag color="green">{t.demoTour.leadsBadge2}</Tag>
                  <Tag color="purple">{t.demoTour.leadsBadge3}</Tag>
                </div>
              </Col>
              <Col xs={24} md={12}>
                <div style={{ background: "#eff6ff", padding: 20, borderRadius: 14, border: "1px solid #bfdbfe" }}>
                  <div style={{ fontWeight: 700, color: "#1e3a8a", fontSize: 14, marginBottom: 4 }}>
                    Shree Ganesh Supermarket (Sector 18)
                  </div>
                  <div style={{ fontSize: 12, color: "#475569", marginBottom: 8 }}>
                    ⭐ 4.9 (210 reviews) • 📱 +91 98765 XXXXX • Verified Retailer
                  </div>
                  <Button size="small" type="primary" icon={<WhatsAppOutlined />} style={{ background: "#25D366", borderColor: "#25D366" }}>
                    {t.demoTour.leadsPitch}
                  </Button>
                </div>
              </Col>
            </Row>
          )}

          {tourTab === "billing" && (
            <Row gutter={[24, 24]} align="middle">
              <Col xs={24} md={12}>
                <Tag color="gold" style={{ fontWeight: 700, marginBottom: 8 }}>{t.demoTour.billingTag}</Tag>
                <Title level={3} style={{ color: "#0f172a" }}>{t.demoTour.billingTitle}</Title>
                <Paragraph style={{ color: "#64748b", lineHeight: 1.7, fontSize: 15 }}>
                  {t.demoTour.billingDesc}
                </Paragraph>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 12 }}>
                  <Tag color="gold">{t.demoTour.billingBadge1}</Tag>
                  <Tag color="success">{t.demoTour.billingBadge2}</Tag>
                  <Tag color="cyan">{t.demoTour.billingBadge3}</Tag>
                </div>
              </Col>
              <Col xs={24} md={12} style={{ textAlign: "center" }}>
                <div style={{ background: "#fffbeb", padding: 20, borderRadius: 14, border: "1px solid #fde68a", display: "inline-block", textAlign: "left" }}>
                  <div style={{ fontWeight: 700, color: "#92400e", marginBottom: 6 }}>
                    GST Tax Invoice #09ef13
                  </div>
                  <div style={{ fontSize: 12, color: "#78350f", marginBottom: 8 }}>
                    Items Total: ₹185 • Payment Mode: Direct UPI
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#fff", padding: "8px 12px", borderRadius: 8 }}>
                    <QrcodeOutlined style={{ fontSize: 32, color: "#25D366" }} />
                    <div style={{ fontSize: 11 }}>
                      <strong>UPI: paytmqr9tziqdamfo@paytm</strong><br />
                      Scan to Pay via any UPI App
                    </div>
                  </div>
                </div>
              </Col>
            </Row>
          )}
        </Card>
      </section>

      {/* Solutions by Business Type (Retail, Wholesale, Services) */}
      <section id="solutions" style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 24px 64px" }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <Tag color="blue" style={{ padding: "4px 14px", borderRadius: 999, fontWeight: 600, fontSize: 13 }}>
            {t.solutions.tag}
          </Tag>
          <Title level={2} style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.6rem)", fontWeight: 800, marginTop: 12, color: "#0f172a" }}>
            {t.solutions.title}
          </Title>
          <Paragraph style={{ color: "#64748b", fontSize: 16, maxWidth: 650, margin: "0 auto" }}>
            {t.solutions.subtitle}
          </Paragraph>
        </div>

        <Row gutter={[24, 24]}>
          {/* Solution 1: Retail & Kirana */}
          <Col xs={24} md={8}>
            <Card
              style={{
                borderRadius: 16,
                height: "100%",
                border: "1px solid #e2e8f0",
                boxShadow: "0 4px 16px rgba(0,0,0,0.03)",
              }}
            >
              <div
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 12,
                  background: "#ecfdf5",
                  color: "#059669",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 24,
                  marginBottom: 16,
                }}
              >
                <ShopOutlined />
              </div>
              <Title level={4} style={{ color: "#0f172a" }}>{t.solutions.retailTitle}</Title>
              <Paragraph style={{ color: "#64748b", fontSize: 14 }}>
                {t.solutions.retailDesc}
              </Paragraph>
              <ul style={{ paddingLeft: 20, color: "#334155", fontSize: 13, lineHeight: 1.8 }}>
                {t.solutions.retailItems.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </Card>
          </Col>

          {/* Solution 2: Wholesale & Distributors */}
          <Col xs={24} md={8}>
            <Card
              style={{
                borderRadius: 16,
                height: "100%",
                border: "1px solid #e2e8f0",
                boxShadow: "0 4px 16px rgba(0,0,0,0.03)",
              }}
            >
              <div
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 12,
                  background: "#eff6ff",
                  color: "#2563eb",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 24,
                  marginBottom: 16,
                }}
              >
                <ThunderboltOutlined />
              </div>
              <Title level={4} style={{ color: "#0f172a" }}>{t.solutions.wholesaleTitle}</Title>
              <Paragraph style={{ color: "#64748b", fontSize: 14 }}>
                {t.solutions.wholesaleDesc}
              </Paragraph>
              <ul style={{ paddingLeft: 20, color: "#334155", fontSize: 13, lineHeight: 1.8 }}>
                {t.solutions.wholesaleItems.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </Card>
          </Col>

          {/* Solution 3: Services & Booking */}
          <Col xs={24} md={8}>
            <Card
              style={{
                borderRadius: 16,
                height: "100%",
                border: "1px solid #e2e8f0",
                boxShadow: "0 4px 16px rgba(0,0,0,0.03)",
              }}
            >
              <div
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 12,
                  background: "#fdf4ff",
                  color: "#a855f7",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 24,
                  marginBottom: 16,
                }}
              >
                <CustomerServiceOutlined />
              </div>
              <Title level={4} style={{ color: "#0f172a" }}>{t.solutions.servicesTitle}</Title>
              <Paragraph style={{ color: "#64748b", fontSize: 14 }}>
                {t.solutions.servicesDesc}
              </Paragraph>
              <ul style={{ paddingLeft: 20, color: "#334155", fontSize: 13, lineHeight: 1.8 }}>
                {t.solutions.servicesItems.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </Card>
          </Col>
        </Row>
      </section>

      {/* The 4 Core Pillars of GinieSpace */}
      <section id="features" style={{ background: "#ffffff", padding: "64px 24px", borderTop: "1px solid #e2e8f0", borderBottom: "1px solid #e2e8f0" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <Tag color="cyan" style={{ padding: "4px 14px", borderRadius: 999, fontWeight: 600, fontSize: 13 }}>
              {t.pillars.tag}
            </Tag>
            <Title level={2} style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.6rem)", fontWeight: 800, marginTop: 12, color: "#0f172a" }}>
              {t.pillars.title}
            </Title>
          </div>

          <Row gutter={[24, 24]}>
            <Col xs={24} sm={12} lg={6}>
              <Card style={{ borderRadius: 14, height: "100%", background: "#f8fafc", borderColor: "#e2e8f0" }}>
                <BankOutlined style={{ fontSize: 32, color: "#059669", marginBottom: 16 }} />
                <Title level={4}>{t.pillars.p1Title}</Title>
                <Text type="secondary" style={{ fontSize: 13, lineHeight: 1.6 }}>
                  {t.pillars.p1Desc}
                </Text>
              </Card>
            </Col>

            <Col xs={24} sm={12} lg={6}>
              <Card style={{ borderRadius: 14, height: "100%", background: "#f8fafc", borderColor: "#e2e8f0" }}>
                <WhatsAppOutlined style={{ fontSize: 32, color: "#25D366", marginBottom: 16 }} />
                <Title level={4}>{t.pillars.p2Title}</Title>
                <Text type="secondary" style={{ fontSize: 13, lineHeight: 1.6 }}>
                  {t.pillars.p2Desc}
                </Text>
              </Card>
            </Col>

            <Col xs={24} sm={12} lg={6}>
              <Card style={{ borderRadius: 14, height: "100%", background: "#f8fafc", borderColor: "#e2e8f0" }}>
                <SearchOutlined style={{ fontSize: 32, color: "#2563eb", marginBottom: 16 }} />
                <Title level={4}>{t.pillars.p3Title}</Title>
                <Text type="secondary" style={{ fontSize: 13, lineHeight: 1.6 }}>
                  {t.pillars.p3Desc}
                </Text>
              </Card>
            </Col>

            <Col xs={24} sm={12} lg={6}>
              <Card style={{ borderRadius: 14, height: "100%", background: "#f8fafc", borderColor: "#e2e8f0" }}>
                <TeamOutlined style={{ fontSize: 32, color: "#7c3aed", marginBottom: 16 }} />
                <Title level={4}>{t.pillars.p4Title}</Title>
                <Text type="secondary" style={{ fontSize: 13, lineHeight: 1.6 }}>
                  {t.pillars.p4Desc}
                </Text>
              </Card>
            </Col>
          </Row>
        </div>
      </section>

      {/* Interactive Savings Calculator */}
      <section id="calculator" style={{ maxWidth: 980, margin: isMobile ? "40px auto" : "64px auto", padding: isMobile ? "0 16px" : "0 24px" }}>
        <Card
          style={{
            borderRadius: 20,
            background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
            color: "#fff",
            border: "1px solid #334155",
            boxShadow: "0 20px 48px rgba(15, 23, 42, 0.25)",
            padding: isMobile ? "12px 6px" : "16px 8px",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: isMobile ? 20 : 28 }}>
            <Tag color="warning" style={{ fontWeight: 700, padding: "4px 12px" }}>
              {t.calculator.tag}
            </Tag>
            <Title level={3} style={{ color: "#fff", marginTop: 10, fontSize: isMobile ? "1.25rem" : undefined }}>
              {t.calculator.title}
            </Title>
            <Text style={{ color: "#94a3b8", fontSize: isMobile ? 13 : 14 }}>
              {t.calculator.subtitle}
            </Text>
          </div>

          <div style={{ maxWidth: 650, margin: "0 auto", background: "rgba(255,255,255,0.05)", padding: isMobile ? "16px 12px" : 24, borderRadius: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={{ color: "#cbd5e1", fontSize: isMobile ? 13 : 14, fontWeight: 500 }}>{t.calculator.estimatedSales}</span>
              <span style={{ color: "#38bdf8", fontSize: isMobile ? 18 : 20, fontWeight: 800 }}>
                ₹{monthlySales.toLocaleString("en-IN")}
              </span>
            </div>

            <Slider
              min={10000}
              max={1000000}
              step={10000}
              value={monthlySales}
              onChange={setMonthlySales}
              tooltip={{ formatter: (v) => `₹${Number(v).toLocaleString("en-IN")}` }}
            />

            <Divider style={{ borderColor: "rgba(255,255,255,0.1)", margin: "18px 0" }} />

            <Row gutter={[12, 12]} style={{ textAlign: "center" }}>
              <Col xs={12}>
                <div style={{ color: "#94a3b8", fontSize: isMobile ? 11 : 12 }}>{t.calculator.standardFee}</div>
                <div style={{ color: "#f87171", fontSize: isMobile ? 15 : 18, fontWeight: 700, textDecoration: "line-through" }}>
                  ₹{traditionalGatewayFee.toLocaleString("en-IN")}/mo
                </div>
              </Col>
              <Col xs={12}>
                <div style={{ color: "#94a3b8", fontSize: isMobile ? 11 : 12 }}>{t.calculator.ginieFee}</div>
                <div style={{ color: "#34d399", fontSize: isMobile ? 15 : 18, fontWeight: 700 }}>
                  ₹{ginieSpaceFee}/mo (0% Cut)
                </div>
              </Col>
            </Row>

            <div
              style={{
                marginTop: 18,
                background: "rgba(16, 185, 129, 0.15)",
                border: "1px solid rgba(16, 185, 129, 0.3)",
                padding: "10px 14px",
                borderRadius: 10,
                textAlign: "center",
              }}
            >
              <Text strong style={{ color: "#6ee7b7", fontSize: isMobile ? 13 : 15 }}>
                {t.calculator.savingsPrefix} ₹{monthlySavings.toLocaleString("en-IN")} {t.calculator.savingsPerMonth} (₹{(monthlySavings * 12).toLocaleString("en-IN")}{t.calculator.savingsPerYear})!
              </Text>
            </div>
          </div>
        </Card>
      </section>

      {/* Transparent Pricing Section (FREE vs PRO ₹99) */}
      <section id="pricing" style={{ maxWidth: 1080, margin: isMobile ? "40px auto" : "64px auto", padding: isMobile ? "0 16px" : "0 24px" }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <Tag color="gold" style={{ padding: "4px 14px", borderRadius: 999, fontWeight: 700, fontSize: 13 }}>
            {t.pricing.tag}
          </Tag>
          <Title level={2} style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.6rem)", fontWeight: 800, marginTop: 12, color: "#0f172a" }}>
            {t.pricing.title}
          </Title>
          <Paragraph style={{ color: "#64748b", fontSize: 16 }}>
            {t.pricing.subtitle}
          </Paragraph>

          {/* Billing Cycle Toggle */}
          <div style={{ display: "inline-flex", background: "#e2e8f0", padding: 4, borderRadius: 10, marginTop: 8 }}>
            <Button
              type={billingCycle === "monthly" ? "primary" : "text"}
              style={{
                background: billingCycle === "monthly" ? "#0f172a" : "transparent",
                color: billingCycle === "monthly" ? "#fff" : "#475569",
                fontWeight: 600,
                borderRadius: 8,
              }}
              onClick={() => setBillingCycle("monthly")}
            >
              {t.pricing.monthlyBilling}
            </Button>
            <Button
              type={billingCycle === "yearly" ? "primary" : "text"}
              style={{
                background: billingCycle === "yearly" ? "#0f172a" : "transparent",
                color: billingCycle === "yearly" ? "#fff" : "#475569",
                fontWeight: 600,
                borderRadius: 8,
              }}
              onClick={() => setBillingCycle("yearly")}
            >
              {t.pricing.yearlyBilling} <Tag color="green" style={{ marginLeft: 4 }}>{t.pricing.saveBadge}</Tag>
            </Button>
          </div>
        </div>

        <Row gutter={[24, 24]} align="stretch">
          {/* FREE PLAN */}
          <Col xs={24} md={12}>
            <Card
              style={{
                borderRadius: 18,
                height: "100%",
                border: "1px solid #e2e8f0",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                boxShadow: "0 4px 16px rgba(0,0,0,0.03)",
              }}
            >
              <div>
                <Tag color="default" style={{ fontWeight: 600, marginBottom: 12 }}>
                  {t.pricing.freeTag}
                </Tag>
                <Title level={3} style={{ margin: "0 0 6px", color: "#0f172a" }}>{t.pricing.freeTitle}</Title>
                <div style={{ fontSize: 32, fontWeight: 800, color: "#0f172a", marginBottom: 16 }}>
                  {t.pricing.freePrice} <span style={{ fontSize: 14, fontWeight: 500, color: "#64748b" }}>{t.pricing.freePeriod}</span>
                </div>
                <Paragraph style={{ color: "#64748b", fontSize: 13 }}>
                  {t.pricing.freeDesc}
                </Paragraph>

                <Divider style={{ margin: "16px 0" }} />

                <ul style={{ listStyle: "none", padding: 0, margin: 0, fontSize: 14, lineHeight: 2 }}>
                  {t.pricing.freeItems.map((item, i) => (
                    <li key={i}>
                      <CheckCircleOutlined style={{ color: "#25D366", marginRight: 8 }} /> {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div style={{ marginTop: 28 }}>
                <Button
                  block
                  size="large"
                  style={{ height: 48, fontWeight: 600, borderRadius: 10 }}
                  onClick={() => router.push("/signup")}
                >
                  {t.pricing.freeCta}
                </Button>
              </div>
            </Card>
          </Col>

          {/* PRO PLAN */}
          <Col xs={24} md={12}>
            <Card
              style={{
                borderRadius: 18,
                height: "100%",
                border: "2px solid #f59e0b",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                background: "linear-gradient(180deg, #fffbeb 0%, #ffffff 40%)",
                boxShadow: "0 12px 32px rgba(245, 158, 11, 0.15)",
                position: "relative",
              }}
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <Tag color="gold" icon={<CrownOutlined />} style={{ fontWeight: 700, padding: "2px 8px" }}>
                    {t.pricing.proTag}
                  </Tag>
                  <Tag color="success" style={{ fontWeight: 600 }}>{t.pricing.proZeroCut}</Tag>
                </div>

                <Title level={3} style={{ margin: "0 0 6px", color: "#92400e" }}>{t.pricing.proTitle}</Title>
                <div style={{ fontSize: 32, fontWeight: 800, color: "#92400e", marginBottom: 16 }}>
                  ₹{billingCycle === "monthly" ? "99" : "999"}{" "}
                  <span style={{ fontSize: 14, fontWeight: 500, color: "#b45309" }}>
                    {billingCycle === "monthly" ? t.pricing.proPeriodMonthly : t.pricing.proPeriodYearly}
                  </span>
                </div>
                <Paragraph style={{ color: "#78350f", fontSize: 13 }}>
                  {t.pricing.proDesc}
                </Paragraph>

                <Divider style={{ margin: "16px 0" }} />

                <ul style={{ listStyle: "none", padding: 0, margin: 0, fontSize: 14, lineHeight: 2, color: "#451a03" }}>
                  {t.pricing.proItems.map((item, i) => (
                    <li key={i}>
                      <CheckCircleOutlined style={{ color: "#f59e0b", marginRight: 8 }} /> {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div style={{ marginTop: 28 }}>
                <Button
                  type="primary"
                  block
                  size="large"
                  icon={<CrownOutlined />}
                  style={{
                    height: 48,
                    fontWeight: 700,
                    borderRadius: 10,
                    background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                    borderColor: "#f59e0b",
                    boxShadow: "0 6px 18px rgba(245, 158, 11, 0.3)",
                  }}
                  onClick={() => router.push("/signup")}
                >
                  {t.pricing.proCta} (₹{billingCycle === "monthly" ? "99" : "999"})
                </Button>
              </div>
            </Card>
          </Col>
        </Row>
      </section>

      {/* Real Merchant FAQs Accordion */}
      <section id="faqs" style={{ maxWidth: 880, margin: "64px auto", padding: "0 24px" }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <Tag color="cyan" style={{ padding: "4px 14px", borderRadius: 999, fontWeight: 600, fontSize: 13 }}>
            {t.faqs.tag}
          </Tag>
          <Title level={2} style={{ fontSize: "clamp(1.8rem, 3.2vw, 2.4rem)", fontWeight: 800, marginTop: 12, color: "#0f172a" }}>
            {t.faqs.title}
          </Title>
        </div>

        <Collapse
          defaultActiveKey={["1"]}
          style={{ background: "#ffffff", borderRadius: 14, border: "1px solid #e2e8f0" }}
          items={t.faqs.items.map((faqItem, idx) => ({
            key: String(idx + 1),
            label: <Text strong style={{ fontSize: 15 }}>{faqItem.q}</Text>,
            children: (
              <Paragraph style={{ color: "#475569", lineHeight: 1.7 }}>
                {faqItem.a}
              </Paragraph>
            ),
          }))}
        />
      </section>

      {/* High-Converting Pre-Footer CTA */}
      <section style={{ maxWidth: 1080, margin: isMobile ? "32px auto 48px" : "40px auto 64px", padding: isMobile ? "0 16px" : "0 24px" }}>
        <div
          style={{
            background: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
            borderRadius: 20,
            padding: isMobile ? "32px 18px" : "48px 32px",
            textAlign: "center",
            color: "#fff",
            boxShadow: "0 16px 40px rgba(5, 150, 105, 0.3)",
          }}
        >
          <Title level={2} style={{ color: "#fff", fontWeight: 800, margin: "0 0 12px", fontSize: isMobile ? "1.45rem" : undefined }}>
            {t.preFooter.title}
          </Title>
          <Paragraph style={{ color: "#ecfdf5", fontSize: isMobile ? 14 : 16, maxWidth: 640, margin: "0 auto 24px" }}>
            {t.preFooter.subtitle}
          </Paragraph>
          {isMobile ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 340, margin: "0 auto" }}>
              <Button
                type="primary"
                size="large"
                block
                style={{
                  background: "#0f172a",
                  borderColor: "#0f172a",
                  color: "#fff",
                  height: 48,
                  fontWeight: 700,
                  borderRadius: 10,
                }}
                onClick={() => router.push("/signup")}
              >
                {t.preFooter.cta}
              </Button>
              <Button
                size="large"
                block
                icon={<WhatsAppOutlined />}
                style={{
                  background: "#fff",
                  borderColor: "#fff",
                  color: "#059669",
                  height: 48,
                  fontWeight: 600,
                  borderRadius: 10,
                }}
                href="https://wa.me/919279259690"
                target="_blank"
                rel="noopener noreferrer"
              >
                WhatsApp (+91 92792 59690)
              </Button>
            </div>
          ) : (
            <Space size="middle" wrap style={{ justifyContent: "center" }}>
              <Button
                type="primary"
                size="large"
                style={{
                  background: "#0f172a",
                  borderColor: "#0f172a",
                  color: "#fff",
                  height: 50,
                  paddingInline: 32,
                  fontWeight: 700,
                  borderRadius: 10,
                }}
                onClick={() => router.push("/signup")}
              >
                {t.preFooter.cta}
              </Button>
              <Button
                size="large"
                icon={<WhatsAppOutlined />}
                style={{
                  background: "#fff",
                  borderColor: "#fff",
                  color: "#059669",
                  height: 50,
                  paddingInline: 24,
                  fontWeight: 600,
                  borderRadius: 10,
                }}
                href="https://wa.me/919279259690"
                target="_blank"
                rel="noopener noreferrer"
              >
                WhatsApp (+91 92792 59690)
              </Button>
            </Space>
          )}
        </div>
      </section>

      {/* Video Walkthrough Modal */}
      <Modal
        title={
          <Space>
            <PlayCircleOutlined style={{ color: "#059669" }} />
            <span>GinieSpace 45-Second Walkthrough Demo</span>
          </Space>
        }
        open={videoModalOpen}
        onCancel={() => setVideoModalOpen(false)}
        footer={null}
        width={700}
        centered
      >
        <div style={{ padding: "12px 0" }}>
          {/* Interactive Simulated Video Screen */}
          <div
            style={{
              background: "#0f172a",
              borderRadius: 12,
              padding: 24,
              color: "#fff",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <Tag color="green">● LIVE PLATFORM DEMO</Tag>
              <Text style={{ color: "#94a3b8", fontSize: 12 }}>Step {simStep} of 3</Text>
            </div>

            {simStep === 1 && (
              <div style={{ textAlign: "center", padding: "20px 0" }}>
                <QrcodeOutlined style={{ fontSize: 64, color: "#25D366", marginBottom: 12 }} />
                <Title level={4} style={{ color: "#fff", margin: 0 }}>
                  1. Scan WhatsApp QR from Linked Devices
                </Title>
                <Text style={{ color: "#94a3b8", display: "block", marginTop: 8 }}>
                  Phone connects in under 10 seconds. Your number stays safe and cloud-maintained.
                </Text>
                <Button
                  type="primary"
                  style={{ marginTop: 20, background: "#25D366", borderColor: "#25D366" }}
                  onClick={() => setSimStep(2)}
                >
                  Next: See Customer Store View ➔
                </Button>
              </div>
            )}

            {simStep === 2 && (
              <div style={{ textAlign: "center", padding: "20px 0" }}>
                <ShopOutlined style={{ fontSize: 64, color: "#38bdf8", marginBottom: 12 }} />
                <Title level={4} style={{ color: "#fff", margin: 0 }}>
                  2. Share Your Storefront: /shop/your-store
                </Title>
                <Text style={{ color: "#94a3b8", display: "block", marginTop: 8 }}>
                  Customer clicks link in WhatsApp bio, adds products to cart, and taps Order!
                </Text>
                <Button
                  type="primary"
                  style={{ marginTop: 20, background: "#38bdf8", borderColor: "#38bdf8" }}
                  onClick={() => setSimStep(3)}
                >
                  Next: See Automated WhatsApp Bill ➔
                </Button>
              </div>
            )}

            {simStep === 3 && (
              <div style={{ textAlign: "center", padding: "20px 0" }}>
                <BankOutlined style={{ fontSize: 64, color: "#34d399", marginBottom: 12 }} />
                <Title level={4} style={{ color: "#fff", margin: 0 }}>
                  3. Customer Pays 100% Direct via UPI (0% Fee)
                </Title>
                <Text style={{ color: "#94a3b8", display: "block", marginTop: 8 }}>
                  Instant WhatsApp invoice receipt delivered. Settlement directly into your bank.
                </Text>
                <Space style={{ marginTop: 20 }}>
                  <Button onClick={() => setSimStep(1)}>Restart Demo</Button>
                  <Button
                    type="primary"
                    style={{ background: "#25D366", borderColor: "#25D366" }}
                    onClick={() => {
                      setVideoModalOpen(false);
                      router.push("/signup");
                    }}
                  >
                    Start Free Account Now
                  </Button>
                </Space>
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Footer with Legal Shield Disclaimer & Links */}
      <footer style={{ background: "#0f172a", color: "#94a3b8", padding: "48px 24px 32px", borderTop: "1px solid #1e293b" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <Row gutter={[24, 24]}>
            <Col xs={24} md={7}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: "#25D366",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    fontWeight: 800,
                    fontSize: 18,
                  }}
                >
                  G
                </div>
                <div style={{ fontWeight: 800, fontSize: 18, color: "#fff" }}>GinieSpace</div>
              </div>
              <Paragraph style={{ color: "#64748b", fontSize: 13, lineHeight: 1.6 }}>
                {t.footer.desc}
              </Paragraph>
              <div style={{ fontSize: 13, color: "#cbd5e1" }}>
                📞 Official Helpline: <strong>+91 92792 59690</strong>
              </div>
              <div style={{ fontSize: 13, color: "#cbd5e1", marginTop: 4 }}>
                ✉️ Support Email: <strong>info.giniespace@gmail.com</strong>
              </div>
            </Col>

            <Col xs={12} sm={6} md={4}>
              <Text strong style={{ color: "#fff", display: "block", marginBottom: 14 }}>{t.footer.solutionsTitle}</Text>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 13 }}>
                <a href="#solutions" style={{ color: "#94a3b8", textDecoration: "none" }}>Retail &amp; Kirana</a>
                <a href="#solutions" style={{ color: "#94a3b8", textDecoration: "none" }}>Wholesale &amp; Bulk</a>
                <a href="#solutions" style={{ color: "#94a3b8", textDecoration: "none" }}>Services &amp; Booking</a>
                <a href="#demo-tour" style={{ color: "#94a3b8", textDecoration: "none" }}>B2B Local Leads</a>
                <a href="#calculator" style={{ color: "#94a3b8", textDecoration: "none" }}>0% Commission UPI</a>
              </div>
            </Col>

            <Col xs={12} sm={6} md={4}>
              <Text strong style={{ color: "#fff", display: "block", marginBottom: 14 }}>{t.footer.merchantPortalTitle}</Text>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 13 }}>
                <a href="/login" style={{ color: "#94a3b8", textDecoration: "none" }}>Merchant Sign In</a>
                <a href="/signup" style={{ color: "#94a3b8", textDecoration: "none" }}>Create Free Account</a>
                <a href="#pricing" style={{ color: "#94a3b8", textDecoration: "none" }}>PRO Plan (₹99)</a>
                <a href="#faqs" style={{ color: "#94a3b8", textDecoration: "none" }}>Merchant FAQs</a>
              </div>
            </Col>

            <Col xs={12} sm={6} md={5}>
              <Text strong style={{ color: "#fff", display: "block", marginBottom: 14 }}>{t.footer.legalTitle}</Text>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 13 }}>
                <Link href="/terms" style={{ color: "#cbd5e1", textDecoration: "none" }}>
                  📜 {t.footer.terms}
                </Link>
                <Link href="/privacy" style={{ color: "#cbd5e1", textDecoration: "none" }}>
                  🔒 {t.footer.privacy}
                </Link>
                <Link href="/refund" style={{ color: "#cbd5e1", textDecoration: "none" }}>
                  💳 {t.footer.refund}
                </Link>
                <span style={{ color: "#64748b", fontSize: 11 }}>
                  🛡️ DPDP Act 2023 Compliant
                </span>
              </div>
            </Col>

            <Col xs={12} sm={6} md={4}>
              <Text strong style={{ color: "#fff", display: "block", marginBottom: 14 }}>{t.footer.trustTitle}</Text>
              <div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.6 }}>
                <div>🔒 100% Direct Bank UPI</div>
                <div>🛡️ 72h Ephemeral Chats</div>
                <div>📱 Persistent Cloud Session</div>
                <div>🇮🇳 Made in Bharat</div>
              </div>
            </Col>
          </Row>

          <Divider style={{ borderColor: "#1e293b", margin: "32px 0 20px" }} />

          {/* Mandatory Nominative Fair Use Legal Shield Disclaimer */}
          <div
            style={{
              background: "#0a0f1d",
              padding: "16px 20px",
              borderRadius: 10,
              fontSize: 11,
              color: "#64748b",
              lineHeight: 1.6,
              marginBottom: 20,
            }}
          >
            {t.footer.disclaimer}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, fontSize: 12, color: "#64748b" }}>
            <div>© {new Date().getFullYear()} {t.footer.copyright}</div>
            <div>{t.footer.helpline}</div>
          </div>
        </div>
      </footer>

      {/* Mobile-Only Sticky Floating Conversion Bar */}
      {isMobile && (
        <div
          className="no-print"
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 999,
            background: "rgba(255, 255, 255, 0.95)",
            backdropFilter: "blur(12px)",
            borderTop: "1px solid #e2e8f0",
            padding: "10px 16px",
            display: "flex",
            gap: 10,
            alignItems: "center",
            boxShadow: "0 -4px 16px rgba(0, 0, 0, 0.08)",
          }}
        >
          <Button
            type="primary"
            style={{
              flex: 1,
              background: "#25D366",
              borderColor: "#25D366",
              fontWeight: 700,
              height: 44,
              borderRadius: 8,
              fontSize: 15,
              boxShadow: "0 4px 12px rgba(37, 211, 102, 0.3)",
            }}
            onClick={() => router.push("/signup")}
          >
            Start Free (₹0)
          </Button>
          <Button
            icon={<WhatsAppOutlined style={{ color: "#25D366", fontSize: 20 }} />}
            style={{
              height: 44,
              paddingInline: 14,
              borderColor: "#cbd5e1",
              borderRadius: 8,
              background: "#fff",
            }}
            href="https://wa.me/919279259690"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="WhatsApp Support"
          />
        </div>
      )}
    </div>
  );
}
