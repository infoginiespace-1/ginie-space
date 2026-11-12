"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { Button, Card, Col, Row, Space, Spin, Tag, Typography } from "antd";
import {
  WhatsAppOutlined,
  ShopOutlined,
  SearchOutlined,
  FileTextOutlined,
  ArrowRightOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";

const { Title, Text, Paragraph } = Typography;

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace("/dashboard");
    }
  }, [user, loading, router]);

  if (loading || user) {
    return (
      <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(180deg, #f0fdf4 0%, #ffffff 45%, #f8fafc 100%)" }}>
      {/* Top Navbar */}
      <div
        style={{
          maxWidth: 1180,
          margin: "0 auto",
          padding: "18px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <Space size="small">
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: "#25D366",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontWeight: 800,
              fontSize: 20,
            }}
          >
            G
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 18, color: "#0f172a", lineHeight: 1.1 }}>GinieSpace</div>
            <div style={{ fontSize: 11, color: "#64748b" }}>WhatsApp Business Automation Hub</div>
          </div>
        </Space>

        <Space>
          <Button onClick={() => router.push("/login")}>Sign In</Button>
          <Button
            type="primary"
            style={{ background: "#25D366", borderColor: "#25D366", fontWeight: 600 }}
            onClick={() => router.push("/signup")}
          >
            Get Started Free
          </Button>
        </Space>
      </div>

      {/* Hero Section */}
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "56px 24px 36px", textAlign: "center" }}>
        <Tag color="green" style={{ padding: "4px 12px", borderRadius: 999, marginBottom: 16, fontWeight: 600 }}>
          Built for Indian Retail &amp; Wholesale Businesses
        </Tag>
        <Title level={1} style={{ fontSize: "clamp(2rem, 4vw, 3.1rem)", color: "#0f172a", marginBottom: 16 }}>
          Turn WhatsApp into Your Complete Sales, Storefront &amp; Billing Engine
        </Title>
        <Paragraph style={{ fontSize: 17, color: "#475569", maxWidth: 720, margin: "0 auto 28px" }}>
          Connect your WhatsApp in seconds, discover verified B2B leads, launch your own digital catalog link, generate GST invoices with UPI QR codes, and automate customer updates.
        </Paragraph>

        <Space size="middle" wrap style={{ justifyContent: "center" }}>
          <Button
            type="primary"
            size="large"
            icon={<ArrowRightOutlined />}
            style={{ background: "#25D366", borderColor: "#25D366", height: 48, paddingInline: 28, fontWeight: 600 }}
            onClick={() => router.push("/signup")}
          >
            Create Free Business Account
          </Button>
          <Button size="large" style={{ height: 48, paddingInline: 24 }} onClick={() => router.push("/login")}>
            Merchant Login
          </Button>
        </Space>

        <div style={{ marginTop: 24, display: "flex", justifyContent: "center", gap: 20, flexWrap: "wrap", color: "#64748b", fontSize: 13 }}>
          <span><CheckCircleOutlined style={{ color: "#25D366" }} /> Persistent Cloud WhatsApp</span>
          <span><CheckCircleOutlined style={{ color: "#25D366" }} /> Direct UPI QR Payments</span>
          <span><CheckCircleOutlined style={{ color: "#25D366" }} /> Official Support: +91 9279259690</span>
        </div>
      </div>

      {/* Feature Grid */}
      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "24px 24px 64px" }}>
        <Row gutter={[20, 20]}>
          <Col xs={24} sm={12} lg={6}>
            <Card style={{ borderRadius: 14, height: "100%" }}>
              <WhatsAppOutlined style={{ fontSize: 28, color: "#25D366", marginBottom: 12 }} />
              <Title level={5}>Real-Time WhatsApp Inbox</Title>
              <Text type="secondary">
                Cloud-synced chat history, quick-reply snippets, instant catalog sharing, and 1-click order creation from chat.
              </Text>
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card style={{ borderRadius: 14, height: "100%" }}>
              <ShopOutlined style={{ fontSize: 28, color: "#0284c7", marginBottom: 12 }} />
              <Title level={5}>Shareable Digital Store</Title>
              <Text type="secondary">
                Get your public online catalog link (`/shop/your-id`) so customers can browse stock and place orders 24/7.
              </Text>
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card style={{ borderRadius: 14, height: "100%" }}>
              <FileTextOutlined style={{ fontSize: 28, color: "#7c3aed", marginBottom: 12 }} />
              <Title level={5}>GST Invoices &amp; UPI QR</Title>
              <Text type="secondary">
                Print professional GST invoices, share WhatsApp bills with UPI IDs, and send scannable UPI QR payment reminders.
              </Text>
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card style={{ borderRadius: 14, height: "100%" }}>
              <SearchOutlined style={{ fontSize: 28, color: "#d97706", marginBottom: 12 }} />
              <Title level={5}>Google Places B2B Leads</Title>
              <Text type="secondary">
                Discover real local businesses by city/pincode and run safe rate-limited WhatsApp outreach campaigns.
              </Text>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
}
