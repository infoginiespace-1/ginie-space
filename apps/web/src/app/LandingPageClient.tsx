"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
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
} from "@ant-design/icons";

const { Title, Text, Paragraph } = Typography;

export default function LandingPageClient() {
  const { user, loading } = useAuth();
  const router = useRouter();

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
  // Active demo tab
  const [demoType, setDemoType] = useState<"retail" | "wholesale" | "services">("retail");

  // Calculations for zero-fee gateway savings
  const traditionalGatewayFee = Math.round(monthlySales * 0.025); // ~2.5% avg gateway charge
  const ginieSpaceFee = billingCycle === "monthly" ? 99 : 83; // ₹83/mo on yearly
  const monthlySavings = Math.max(0, traditionalGatewayFee - ginieSpaceFee);

  const handleCopyLink = (text: string) => {
    navigator.clipboard?.writeText(text);
    message.success("Link copied to clipboard!");
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", color: "#0f172a", overflowX: "hidden" }}>
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
            padding: "14px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
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
                width: 38,
                height: 38,
                borderRadius: 10,
                background: "linear-gradient(135deg, #25D366 0%, #128C7E 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontWeight: 800,
                fontSize: 20,
                boxShadow: "0 4px 12px rgba(37, 211, 102, 0.3)",
              }}
            >
              G
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 19, color: "#0f172a", lineHeight: 1.1, letterSpacing: "-0.02em" }}>
                GinieSpace
              </div>
              <div style={{ fontSize: 11, color: "#64748b", fontWeight: 500 }}>
                Smart WhatsApp Commerce Hub
              </div>
            </div>
          </div>

          {/* Nav Links */}
          <div style={{ display: "flex", alignItems: "center", gap: 24 }} className="hide-on-mobile">
            <a href="#features" style={{ color: "#475569", textDecoration: "none", fontWeight: 500, fontSize: 14 }}>
              Features
            </a>
            <a href="#solutions" style={{ color: "#475569", textDecoration: "none", fontWeight: 500, fontSize: 14 }}>
              Solutions
            </a>
            <a href="#pricing" style={{ color: "#475569", textDecoration: "none", fontWeight: 500, fontSize: 14 }}>
              Pricing (₹99 PRO)
            </a>
            <a href="#calculator" style={{ color: "#475569", textDecoration: "none", fontWeight: 500, fontSize: 14 }}>
              Savings Calculator
            </a>
            <a href="#faqs" style={{ color: "#475569", textDecoration: "none", fontWeight: 500, fontSize: 14 }}>
              FAQs
            </a>
          </div>

          {/* Action CTAs */}
          <Space size="middle">
            <Button
              onClick={() => router.push("/login")}
              style={{ fontWeight: 600, borderColor: "#cbd5e1", borderRadius: 8 }}
            >
              Sign In
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
              Start Free (₹0)
            </Button>
          </Space>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "64px 24px 40px", textAlign: "center" }}>
        <div style={{ display: "inline-block", marginBottom: 16 }}>
          <Tag
            color="success"
            style={{
              padding: "6px 16px",
              borderRadius: 999,
              fontSize: 13,
              fontWeight: 600,
              background: "#ecfdf5",
              borderColor: "#a7f3d0",
              color: "#065f46",
            }}
          >
            🚀 Zero Payment Gateway Commissions • 100% Direct Bank UPI
          </Tag>
        </div>

        <Title
          level={1}
          style={{
            fontSize: "clamp(2.1rem, 4.8vw, 3.8rem)",
            fontWeight: 800,
            color: "#0f172a",
            lineHeight: 1.15,
            letterSpacing: "-0.03em",
            maxWidth: 960,
            margin: "0 auto 20px",
          }}
        >
          Turn WhatsApp Into Your Complete{" "}
          <span style={{ color: "#059669", background: "linear-gradient(135deg, #059669 0%, #25D366 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Sales, Storefront &amp; B2B Engine
          </span>
        </Title>

        <Paragraph
          style={{
            fontSize: "clamp(1rem, 2vw, 1.25rem)",
            color: "#475569",
            maxWidth: 780,
            margin: "0 auto 32px",
            lineHeight: 1.6,
          }}
        >
          Launch your instant shareable catalog link, accept direct bank UPI payments without 2-3% platform cuts, discover verified local B2B leads by locality, and manage orders with real-time WhatsApp alerts.
        </Paragraph>

        {/* Hero CTAs */}
        <Space size="middle" wrap style={{ justifyContent: "center", marginBottom: 36 }}>
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
            Create Free Business Account
          </Button>

          <Button
            size="large"
            icon={<WhatsAppOutlined style={{ color: "#25D366", fontSize: 18 }} />}
            style={{
              height: 52,
              paddingInline: 24,
              fontWeight: 600,
              fontSize: 15,
              borderRadius: 10,
              borderColor: "#cbd5e1",
              background: "#fff",
            }}
            href="https://wa.me/919279259690?text=Hi%20GinieSpace%20Support%2C%20I%20want%20to%20know%20more%20about%20the%20platform."
            target="_blank"
            rel="noopener noreferrer"
          >
            Support Helpline (+91 92792 59690)
          </Button>
        </Space>

        {/* Live Trust Metrics Badges */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 24,
            flexWrap: "wrap",
            color: "#475569",
            fontSize: 13,
            fontWeight: 600,
            padding: "16px 20px",
            background: "#ffffff",
            borderRadius: 12,
            border: "1px solid #e2e8f0",
            maxWidth: 860,
            margin: "0 auto",
            boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <BankOutlined style={{ color: "#059669" }} /> 100% Direct Bank UPI (Zero Commission)
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <PhoneOutlined style={{ color: "#25D366" }} /> Real Mobile Numbers &amp; Multi-Device Sync
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <CrownOutlined style={{ color: "#d97706" }} /> PRO Growth Tier Only ₹99/Month
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <SafetyCertificateOutlined style={{ color: "#2563eb" }} /> Safe Rate-Limited Message Cadence
          </span>
        </div>
      </section>

      {/* Hero Product Mockup / Realistic Live Dashboard Preview */}
      <section style={{ maxWidth: 1140, margin: "0 auto", padding: "0 24px 64px" }}>
        <div
          style={{
            background: "#ffffff",
            borderRadius: 20,
            border: "1px solid #cbd5e1",
            boxShadow: "0 20px 48px -12px rgba(15, 23, 42, 0.12)",
            overflow: "hidden",
          }}
        >
          {/* Dashboard Window Header */}
          <div
            style={{
              background: "#0f172a",
              padding: "14px 20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ef4444" }} />
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#f59e0b" }} />
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#10b981" }} />
              <Text strong style={{ color: "#94a3b8", fontSize: 13, marginLeft: 8 }}>
                GinieSpace Merchant Portal • Live Connected
              </Text>
            </div>

            <Space size="middle" wrap>
              <Tag color="success" icon={<CheckCircleOutlined />} style={{ fontWeight: 600, padding: "3px 10px" }}>
                WhatsApp Connected (+91 92792 59690)
              </Tag>
              <Tag color="gold" icon={<CrownOutlined />} style={{ fontWeight: 700, padding: "3px 10px" }}>
                PRO WORKSPACE
              </Tag>
            </Space>
          </div>

          {/* Quick Metrics Bar inside Mockup */}
          <div style={{ padding: "20px 24px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
            <Row gutter={[16, 16]}>
              <Col xs={12} sm={6}>
                <div style={{ background: "#fff", padding: "12px 16px", borderRadius: 10, border: "1px solid #e2e8f0" }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>Today&apos;s Store Sales</Text>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "#059669" }}>₹18,450</div>
                  <Text type="secondary" style={{ fontSize: 11 }}>28 Orders processed</Text>
                </div>
              </Col>
              <Col xs={12} sm={6}>
                <div style={{ background: "#fff", padding: "12px 16px", borderRadius: 10, border: "1px solid #e2e8f0" }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>Online Digital Catalog</Text>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "#0f172a" }}>142 Items</div>
                  <Text type="secondary" style={{ fontSize: 11 }}>Live at /shop/store-slug</Text>
                </div>
              </Col>
              <Col xs={12} sm={6}>
                <div style={{ background: "#fff", padding: "12px 16px", borderRadius: 10, border: "1px solid #e2e8f0" }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>Verified Local Leads</Text>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "#2563eb" }}>48 Found</div>
                  <Text type="secondary" style={{ fontSize: 11 }}>Hyperlocal business discovery</Text>
                </div>
              </Col>
              <Col xs={12} sm={6}>
                <div style={{ background: "#fff", padding: "12px 16px", borderRadius: 10, border: "1px solid #e2e8f0" }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>Direct Bank UPI Rate</Text>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "#d97706" }}>0% Fee</div>
                  <Text type="secondary" style={{ fontSize: 11 }}>₹0 cut taken by platform</Text>
                </div>
              </Col>
            </Row>
          </div>

          {/* Visual Showcase: 2 Real Feature Previews */}
          <div style={{ padding: "24px", background: "#fff" }}>
            <Row gutter={[24, 24]}>
              {/* Feature 1: Real WhatsApp Order Alert with UPI QR */}
              <Col xs={24} md={12}>
                <Card
                  title={
                    <Space>
                      <WhatsAppOutlined style={{ color: "#25D366", fontSize: 18 }} />
                      <span style={{ fontWeight: 700 }}>Real-time WhatsApp Order Receipt</span>
                    </Space>
                  }
                  type="inner"
                  style={{ borderRadius: 12, background: "#f0fdf4", borderColor: "#bbf7d0", height: "100%" }}
                >
                  <div
                    style={{
                      background: "#fff",
                      borderRadius: 12,
                      padding: 16,
                      boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                      border: "1px solid #dcfce7",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                      <Text strong style={{ color: "#065f46" }}>📦 GinieSpace Order Alert</Text>
                      <Tag color="green">CONFIRMED</Tag>
                    </div>
                    <Text style={{ fontSize: 13, display: "block", marginBottom: 6 }}>
                      Namaste <strong>DAWOOD</strong>, aapka order <strong>#09ef13</strong> confirm ho gaya hai.
                    </Text>
                    <div style={{ background: "#f8fafc", padding: "8px 12px", borderRadius: 8, fontSize: 12, marginBottom: 10 }}>
                      <div>• 1x Premium Basmati Rice (1kg) - ₹110</div>
                      <div>• 1x Cold Pressed Mustard Oil (500ml) - ₹75</div>
                      <div style={{ borderTop: "1px solid #e2e8f0", marginTop: 6, paddingTop: 6, fontWeight: 700, color: "#059669" }}>
                        💰 Total Amount: ₹185 (0% Gateway Cut)
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <QrcodeOutlined style={{ fontSize: 24, color: "#25D366" }} />
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600 }}>UPI ID: 9279259690@fam</div>
                        <div style={{ fontSize: 11, color: "#64748b" }}>Direct bank settlement initiated</div>
                      </div>
                    </div>
                  </div>
                </Card>
              </Col>

              {/* Feature 2: Hyperlocal B2B Leads Discovery */}
              <Col xs={24} md={12}>
                <Card
                  title={
                    <Space>
                      <SearchOutlined style={{ color: "#2563eb", fontSize: 18 }} />
                      <span style={{ fontWeight: 700 }}>Hyperlocal Verified B2B Lead Finder</span>
                    </Space>
                  }
                  type="inner"
                  style={{ borderRadius: 12, background: "#eff6ff", borderColor: "#bfdbfe", height: "100%" }}
                >
                  <div
                    style={{
                      background: "#fff",
                      borderRadius: 12,
                      padding: 16,
                      boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                      border: "1px solid #dbeafe",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <Text strong style={{ fontSize: 14 }}>Shree Krishna Kirana &amp; General Store</Text>
                      <Tag color="blue">LOCAL RETAILER</Tag>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#64748b", marginBottom: 6 }}>
                      <EnvironmentOutlined /> Sector 18, Noida, Uttar Pradesh
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, marginBottom: 12 }}>
                      <Rate disabled defaultValue={4.8} style={{ fontSize: 12 }} />
                      <Text strong>4.8★</Text>
                      <Text type="secondary">(142 ratings)</Text>
                      <Tag color="cyan">📞 +91 98112 XXXXX</Tag>
                    </div>
                    <Space size="small">
                      <Button size="small" type="primary" icon={<WhatsAppOutlined />} style={{ background: "#25D366", borderColor: "#25D366" }}>
                        Send WhatsApp Pitch
                      </Button>
                      <Button size="small">Save to CRM</Button>
                    </Space>
                  </div>
                </Card>
              </Col>
            </Row>
          </div>
        </div>
      </section>

      {/* Solutions by Business Type (Retail, Wholesale, Services) */}
      <section id="solutions" style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 24px 64px" }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <Tag color="blue" style={{ padding: "4px 14px", borderRadius: 999, fontWeight: 600, fontSize: 13 }}>
            Tailored For Your Business Model
          </Tag>
          <Title level={2} style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.6rem)", fontWeight: 800, marginTop: 12, color: "#0f172a" }}>
            Ek Platform • Teeno Vyapar Ke Liye Perfect
          </Title>
          <Paragraph style={{ color: "#64748b", fontSize: 16, maxWidth: 650, margin: "0 auto" }}>
            Chahe aap dukan chalate ho, wholesale trading karte ho, ya home services provide karte ho — GinieSpace aapke liye custom configured hai.
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
              <Title level={4} style={{ color: "#0f172a" }}>Retail &amp; Kirana Stores</Title>
              <Paragraph style={{ color: "#64748b", fontSize: 14 }}>
                Aapki physical dukan ka digital avataar. Grahak ghar baithe aapka stock browse karein aur direct WhatsApp par order dein.
              </Paragraph>
              <ul style={{ paddingLeft: 20, color: "#334155", fontSize: 13, lineHeight: 1.8 }}>
                <li>Instant Public Storefront Link (`/shop/your-store`)</li>
                <li>Photos &amp; Stock availability tracking</li>
                <li>Scannable UPI QR on printed invoice</li>
                <li>Automated order dispatch alerts on WhatsApp</li>
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
              <Title level={4} style={{ color: "#0f172a" }}>Wholesale &amp; Distributors</Title>
              <Paragraph style={{ color: "#64748b", fontSize: 14 }}>
                Bulk B2B orders manage karein bina call par time waste kiye. Retailers ko carton pricing aur MOQs dikhayein.
              </Paragraph>
              <ul style={{ paddingLeft: 20, color: "#334155", fontSize: 13, lineHeight: 1.8 }}>
                <li>Minimum Order Quantity (MOQ) enforcement</li>
                <li>Carton, Pack &amp; Bulk Box units</li>
                <li>Hyperlocal retail buyers lead discovery</li>
                <li>Broadcast new stock arrivals to verified dealers</li>
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
              <Title level={4} style={{ color: "#0f172a" }}>Services &amp; Appointments</Title>
              <Paragraph style={{ color: "#64748b", fontSize: 14 }}>
                AC Repair, Salons, Coaching ya Consultancy services ke liye hassle-free slot booking aur advance UPI tokens.
              </Paragraph>
              <ul style={{ paddingLeft: 20, color: "#334155", fontSize: 13, lineHeight: 1.8 }}>
                <li>Session duration (30 mins / 60 mins / AMC Plans)</li>
                <li>Home-visit vs In-store appointment modes</li>
                <li>Instant WhatsApp booking confirmation receipts</li>
                <li>Automated appointment reminder notifications</li>
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
              Enterprise-Grade Architecture
            </Tag>
            <Title level={2} style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.6rem)", fontWeight: 800, marginTop: 12, color: "#0f172a" }}>
              Kyun GinieSpace Har Indian Merchant Ka Pehla Choice Hai?
            </Title>
          </div>

          <Row gutter={[24, 24]}>
            <Col xs={24} sm={12} lg={6}>
              <Card style={{ borderRadius: 14, height: "100%", background: "#f8fafc", borderColor: "#e2e8f0" }}>
                <BankOutlined style={{ fontSize: 32, color: "#059669", marginBottom: 16 }} />
                <Title level={4}>0% UPI Commission</Title>
                <Text type="secondary" style={{ fontSize: 13, lineHeight: 1.6 }}>
                  GinieSpace kisi payment gateway ki tarah 2-3% nahi kat-ta. Customer se 100% payment seedhe aapke apne bank UPI account me transfer hoti hai.
                </Text>
              </Card>
            </Col>

            <Col xs={24} sm={12} lg={6}>
              <Card style={{ borderRadius: 14, height: "100%", background: "#f8fafc", borderColor: "#e2e8f0" }}>
                <WhatsAppOutlined style={{ fontSize: 32, color: "#25D366", marginBottom: 16 }} />
                <Title level={4}>Multi-Device Cloud Sync</Title>
                <Text type="secondary" style={{ fontSize: 13, lineHeight: 1.6 }}>
                  Aapka WhatsApp persistently cloud se linked rehta hai. Browser refresh ya PC switch karne par session disconnect nahi hota.
                </Text>
              </Card>
            </Col>

            <Col xs={24} sm={12} lg={6}>
              <Card style={{ borderRadius: 14, height: "100%", background: "#f8fafc", borderColor: "#e2e8f0" }}>
                <SearchOutlined style={{ fontSize: 32, color: "#2563eb", marginBottom: 16 }} />
                <Title level={4}>Hyperlocal B2B Leads</Title>
                <Text type="secondary" style={{ fontSize: 13, lineHeight: 1.6 }}>
                  Apne shahar ya pincode ke verified businesses ko explore karein, Google review scores dekhein aur 1-click WhatsApp proposal send karein.
                </Text>
              </Card>
            </Col>

            <Col xs={24} sm={12} lg={6}>
              <Card style={{ borderRadius: 14, height: "100%", background: "#f8fafc", borderColor: "#e2e8f0" }}>
                <TeamOutlined style={{ fontSize: 32, color: "#7c3aed", marginBottom: 16 }} />
                <Title level={4}>Staff Access Controls</Title>
                <Text type="secondary" style={{ fontSize: 13, lineHeight: 1.6 }}>
                  Billing boy ya delivery staff ke liye alag sub-accounts banayein without sharing WhatsApp session credentials ya admin settings.
                </Text>
              </Card>
            </Col>
          </Row>
        </div>
      </section>

      {/* Interactive Savings Calculator */}
      <section id="calculator" style={{ maxWidth: 980, margin: "64px auto", padding: "0 24px" }}>
        <Card
          style={{
            borderRadius: 20,
            background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
            color: "#fff",
            border: "1px solid #334155",
            boxShadow: "0 20px 48px rgba(15, 23, 42, 0.25)",
            padding: "16px 8px",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <Tag color="warning" style={{ fontWeight: 700, padding: "4px 12px" }}>
              💰 SAVINGS CALCULATOR
            </Tag>
            <Title level={3} style={{ color: "#fff", marginTop: 10 }}>
              GinieSpace Par Shifting Se Aapki Kitni Bachaat Hogi?
            </Title>
            <Text style={{ color: "#94a3b8", fontSize: 14 }}>
              Other e-commerce gateways har transaction par 2% to 3% cut lete hain. GinieSpace par payment 100% Direct UPI hoti hai.
            </Text>
          </div>

          <div style={{ maxWidth: 650, margin: "0 auto", background: "rgba(255,255,255,0.05)", padding: 24, borderRadius: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={{ color: "#cbd5e1", fontSize: 14, fontWeight: 500 }}>Aapki Estimated Monthly Sales:</span>
              <span style={{ color: "#38bdf8", fontSize: 20, fontWeight: 800 }}>
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

            <Divider style={{ borderColor: "rgba(255,255,255,0.1)", margin: "20px 0" }} />

            <Row gutter={[16, 16]} style={{ textAlign: "center" }}>
              <Col xs={12}>
                <div style={{ color: "#94a3b8", fontSize: 12 }}>Standard 2.5% Gateway Fees</div>
                <div style={{ color: "#f87171", fontSize: 18, fontWeight: 700, textDecoration: "line-through" }}>
                  ₹{traditionalGatewayFee.toLocaleString("en-IN")}/mo
                </div>
              </Col>
              <Col xs={12}>
                <div style={{ color: "#94a3b8", fontSize: 12 }}>GinieSpace PRO Flat Fee</div>
                <div style={{ color: "#34d399", fontSize: 18, fontWeight: 700 }}>
                  ₹{ginieSpaceFee}/mo (Zero Commission)
                </div>
              </Col>
            </Row>

            <div
              style={{
                marginTop: 20,
                background: "rgba(16, 185, 129, 0.15)",
                border: "1px solid rgba(16, 185, 129, 0.3)",
                padding: "12px 16px",
                borderRadius: 10,
                textAlign: "center",
              }}
            >
              <Text strong style={{ color: "#6ee7b7", fontSize: 15 }}>
                🎉 Aapki Seedhi Bachaat: ₹{monthlySavings.toLocaleString("en-IN")} har mahine (₹{(monthlySavings * 12).toLocaleString("en-IN")}/saal)!
              </Text>
            </div>
          </div>
        </Card>
      </section>

      {/* Transparent Pricing Section (FREE vs PRO ₹99) */}
      <section id="pricing" style={{ maxWidth: 1080, margin: "64px auto", padding: "0 24px" }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <Tag color="gold" style={{ padding: "4px 14px", borderRadius: 999, fontWeight: 700, fontSize: 13 }}>
            TRANSPARENT &amp; AFFORDABLE PRICING
          </Tag>
          <Title level={2} style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.6rem)", fontWeight: 800, marginTop: 12, color: "#0f172a" }}>
            Har Vyapari Ke Budget Me Fit
          </Title>
          <Paragraph style={{ color: "#64748b", fontSize: 16 }}>
            Free se shuru karein aur bina kisi contractual commitment ke jab chahein PRO upgrade karein.
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
              Monthly Billing
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
              Yearly (₹999/yr) <Tag color="green" style={{ marginLeft: 4 }}>Save 17%</Tag>
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
                  STARTER TIER
                </Tag>
                <Title level={3} style={{ margin: "0 0 6px", color: "#0f172a" }}>Free Forever</Title>
                <div style={{ fontSize: 32, fontWeight: 800, color: "#0f172a", marginBottom: 16 }}>
                  ₹0 <span style={{ fontSize: 14, fontWeight: 500, color: "#64748b" }}>/ forever</span>
                </div>
                <Paragraph style={{ color: "#64748b", fontSize: 13 }}>
                  Naye vyapariyo ke liye jo apna online catalog aur WhatsApp billing test karna chahte hain.
                </Paragraph>

                <Divider style={{ margin: "16px 0" }} />

                <ul style={{ listStyle: "none", padding: 0, margin: 0, fontSize: 14, lineHeight: 2 }}>
                  <li><CheckCircleOutlined style={{ color: "#25D366", marginRight: 8 }} /> Up to <strong>15 Products / Services</strong></li>
                  <li><CheckCircleOutlined style={{ color: "#25D366", marginRight: 8 }} /> <strong>10 Local B2B Leads</strong> discovery</li>
                  <li><CheckCircleOutlined style={{ color: "#25D366", marginRight: 8 }} /> <strong>1 Staff Account</strong></li>
                  <li><CheckCircleOutlined style={{ color: "#25D366", marginRight: 8 }} /> Live WhatsApp Web Inbox</li>
                  <li><CheckCircleOutlined style={{ color: "#25D366", marginRight: 8 }} /> Direct Bank UPI Payments</li>
                  <li><CheckCircleOutlined style={{ color: "#25D366", marginRight: 8 }} /> Standard Support Helpline</li>
                </ul>
              </div>

              <div style={{ marginTop: 28 }}>
                <Button
                  block
                  size="large"
                  style={{ height: 48, fontWeight: 600, borderRadius: 10 }}
                  onClick={() => router.push("/signup")}
                >
                  Start Free Account
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
                    👑 MOST POPULAR GROWTH TIER
                  </Tag>
                  <Tag color="success" style={{ fontWeight: 600 }}>0% Gateway Cut</Tag>
                </div>

                <Title level={3} style={{ margin: "0 0 6px", color: "#92400e" }}>PRO Workspace</Title>
                <div style={{ fontSize: 32, fontWeight: 800, color: "#92400e", marginBottom: 16 }}>
                  ₹{billingCycle === "monthly" ? "99" : "999"}{" "}
                  <span style={{ fontSize: 14, fontWeight: 500, color: "#b45309" }}>
                    / {billingCycle === "monthly" ? "month" : "year"}
                  </span>
                </div>
                <Paragraph style={{ color: "#78350f", fontSize: 13 }}>
                  Growing dukan aur wholesale business ke liye unlimited inventory, unlimited leads aur broadcast tools.
                </Paragraph>

                <Divider style={{ margin: "16px 0" }} />

                <ul style={{ listStyle: "none", padding: 0, margin: 0, fontSize: 14, lineHeight: 2, color: "#451a03" }}>
                  <li><CheckCircleOutlined style={{ color: "#f59e0b", marginRight: 8 }} /> <strong>Unlimited Catalog</strong> (10,000+ items)</li>
                  <li><CheckCircleOutlined style={{ color: "#f59e0b", marginRight: 8 }} /> <strong>Unlimited Local B2B Leads</strong> (10,000+ leads)</li>
                  <li><CheckCircleOutlined style={{ color: "#f59e0b", marginRight: 8 }} /> <strong>5 Team Staff Seats</strong> (Billing &amp; Delivery)</li>
                  <li><CheckCircleOutlined style={{ color: "#f59e0b", marginRight: 8 }} /> <strong>Store Announcements &amp; Broadcast Tool</strong></li>
                  <li><CheckCircleOutlined style={{ color: "#f59e0b", marginRight: 8 }} /> <strong>Verified Storefront Badge</strong> on your link</li>
                  <li><CheckCircleOutlined style={{ color: "#f59e0b", marginRight: 8 }} /> Direct UPI QR + 12-Digit UTR Instant Activation</li>
                  <li><CheckCircleOutlined style={{ color: "#f59e0b", marginRight: 8 }} /> <strong>Priority WhatsApp Support (+91 92792 59690)</strong></li>
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
                  Upgrade to PRO (₹{billingCycle === "monthly" ? "99" : "999"})
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
            FREQUENTLY ASKED QUESTIONS
          </Tag>
          <Title level={2} style={{ fontSize: "clamp(1.8rem, 3.2vw, 2.4rem)", fontWeight: 800, marginTop: 12, color: "#0f172a" }}>
            Aapke Sabhi Sawal, Seedhe Aur Saaf Jawab
          </Title>
        </div>

        <Collapse
          defaultActiveKey={["1"]}
          style={{ background: "#ffffff", borderRadius: 14, border: "1px solid #e2e8f0" }}
          items={[
            {
              key: "1",
              label: <Text strong style={{ fontSize: 15 }}>GinieSpace par customer ki payment mere bank me kaise aati hai?</Text>,
              children: (
                <Paragraph style={{ color: "#475569", lineHeight: 1.7 }}>
                  Seedhe 100% aapke bank me! GinieSpace koi payment gateway middleman nahi hai jo 2% se 3% commission kate. Har invoice aur bill par aapka apna UPI QR code (`9279259690@fam` ya aapka apna UPI ID) hota hai. Grahak PhonePe, Google Pay ya Paytm se scan karke seedhe aapke account me paise bhejta hai.
                </Paragraph>
              ),
            },
            {
              key: "2",
              label: <Text strong style={{ fontSize: 15 }}>WhatsApp connect karne ke liye kisi technical knowledge ki zaroorat hai?</Text>,
              children: (
                <Paragraph style={{ color: "#475569", lineHeight: 1.7 }}>
                  Bilkul nahi! Jaise aap WhatsApp Web apne computer par scan karke chalate hain, waise hi GinieSpace app me jakar sirf 1 baar QR code scan karna hota hai. Aapka WhatsApp turant sync ho jata hai aur background me orders handle karne lagta hai.
                </Paragraph>
              ),
            },
            {
              key: "3",
              label: <Text strong style={{ fontSize: 15 }}>Kya phone ka internet band hone par bhi GinieSpace kaam karega?</Text>,
              children: (
                <Paragraph style={{ color: "#475569", lineHeight: 1.7 }}>
                  Haan! GinieSpace cloud-synced multi-device protocol par chalta hai. Ek baar link hone ke baad aapka shareable store catalog link (`/shop/your-store`) 24 ghante live rehta hai aur grahak kabhi bhi order place kar sakte hain.
                </Paragraph>
              ),
            },
            {
              key: "4",
              label: <Text strong style={{ fontSize: 15 }}>Hyperlocal B2B Leads Finder kya hai aur ye kaise kaam karta hai?</Text>,
              children: (
                <Paragraph style={{ color: "#475569", lineHeight: 1.7 }}>
                  Aap apne city ya pin code me target category (jaise &quot;Kirana stores in Jaipur&quot;, &quot;Pharmacies in Lucknow&quot;) search kar sakte hain. System aapko verified businesses ki details, Google ratings aur verified public phone numbers dikhata hai taaki aap direct 1-click WhatsApp proposal bhej sakein.
                </Paragraph>
              ),
            },
            {
              key: "5",
              label: <Text strong style={{ fontSize: 15 }}>₹99 PRO Plan kaise activate hota hai?</Text>,
              children: (
                <Paragraph style={{ color: "#475569", lineHeight: 1.7 }}>
                  GinieSpace app me jakar &quot;Upgrade to PRO&quot; par click karein, dynamic UPI QR scan karke ₹99 (monthly) ya ₹999 (yearly) transfer karein aur apna 12-digit UTR enter karein. Admin verification ke turant baad aapka PRO plan 30 din ya 365 din ke liye unlock ho jata hai.
                </Paragraph>
              ),
            },
          ]}
        />
      </section>

      {/* High-Converting Pre-Footer CTA */}
      <section style={{ maxWidth: 1080, margin: "40px auto 64px", padding: "0 24px" }}>
        <div
          style={{
            background: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
            borderRadius: 20,
            padding: "48px 32px",
            textAlign: "center",
            color: "#fff",
            boxShadow: "0 16px 40px rgba(5, 150, 105, 0.3)",
          }}
        >
          <Title level={2} style={{ color: "#fff", fontWeight: 800, margin: "0 0 12px" }}>
            Apne Vyapar Ko Aaj Hi Digital Aur WhatsApp-Automated Banayein!
          </Title>
          <Paragraph style={{ color: "#ecfdf5", fontSize: 16, maxWidth: 640, margin: "0 auto 28px" }}>
            Bina kisi monthly contract ya hidden fees ke abhi Free account create karein. Sirf 2 minute me aapka catalog online live hoga.
          </Paragraph>
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
              Get Started Free Now
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
              WhatsApp Us (+91 92792 59690)
            </Button>
          </Space>
        </div>
      </section>

      {/* Footer with Legal Shield Disclaimer & Links */}
      <footer style={{ background: "#0f172a", color: "#94a3b8", padding: "48px 24px 32px", borderTop: "1px solid #1e293b" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <Row gutter={[32, 32]}>
            <Col xs={24} md={8}>
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
                India&apos;s premier WhatsApp business commerce platform. Empowering retail stores, wholesale traders, and services to automate sales, collect direct UPI payments, and discover local B2B leads.
              </Paragraph>
              <div style={{ fontSize: 13, color: "#cbd5e1" }}>
                📞 Official Helpline: <strong>+91 92792 59690</strong>
              </div>
              <div style={{ fontSize: 13, color: "#cbd5e1", marginTop: 4 }}>
                ✉️ Support Email: <strong>info.giniespace@gmail.com</strong>
              </div>
            </Col>

            <Col xs={12} md={5}>
              <Text strong style={{ color: "#fff", display: "block", marginBottom: 14 }}>Product Solutions</Text>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 13 }}>
                <a href="#solutions" style={{ color: "#94a3b8", textDecoration: "none" }}>Retail &amp; Kirana Stores</a>
                <a href="#solutions" style={{ color: "#94a3b8", textDecoration: "none" }}>Wholesale &amp; Bulk Cartons</a>
                <a href="#solutions" style={{ color: "#94a3b8", textDecoration: "none" }}>Services &amp; Appointments</a>
                <a href="#features" style={{ color: "#94a3b8", textDecoration: "none" }}>Hyperlocal B2B Leads</a>
                <a href="#calculator" style={{ color: "#94a3b8", textDecoration: "none" }}>0% Commission UPI Billing</a>
              </div>
            </Col>

            <Col xs={12} md={5}>
              <Text strong style={{ color: "#fff", display: "block", marginBottom: 14 }}>Merchant Portal</Text>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 13 }}>
                <a href="/login" style={{ color: "#94a3b8", textDecoration: "none" }}>Merchant Sign In</a>
                <a href="/signup" style={{ color: "#94a3b8", textDecoration: "none" }}>Create Free Account</a>
                <a href="#pricing" style={{ color: "#94a3b8", textDecoration: "none" }}>PRO Plan (₹99/Month)</a>
                <a href="#faqs" style={{ color: "#94a3b8", textDecoration: "none" }}>Merchant FAQs</a>
              </div>
            </Col>

            <Col xs={24} md={6}>
              <Text strong style={{ color: "#fff", display: "block", marginBottom: 14 }}>Security &amp; Trust</Text>
              <div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.6 }}>
                <div>🔒 100% Direct Bank UPI Settlement</div>
                <div>🛡️ Safe Rate-Limited Message Cadence</div>
                <div>📱 Persistent Cloud Linked Session</div>
                <div>🇮🇳 Proudly Built For Bharat MSMEs</div>
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
            <strong>Legal Disclaimer:</strong> GinieSpace is an independent SaaS business automation platform developed to help Indian merchants manage their sales, catalogs, and customer communications. GinieSpace is not affiliated, associated, authorized, endorsed by, or in any way officially connected with Meta Platforms, Inc., WhatsApp LLC, or Google LLC. WhatsApp™ is a registered trademark of WhatsApp LLC and Meta Platforms, Inc. Google Maps™ is a trademark of Google LLC. All product and company names are the registered trademarks of their respective owners.
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, fontSize: 12, color: "#64748b" }}>
            <div>© {new Date().getFullYear()} GinieSpace. All rights reserved. Operating in India.</div>
            <div>Official Support Helpline: +91 92792 59690</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
