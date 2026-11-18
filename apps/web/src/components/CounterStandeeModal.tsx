"use client";

import React, { useState } from "react";
import { Modal, Button, Space, Tag, Typography, Segmented, Row, Col } from "antd";
import { PrinterOutlined, QrcodeOutlined, DownloadOutlined, WhatsAppOutlined, BankOutlined, CheckCircleFilled } from "@ant-design/icons";
import { QRCode } from "antd";

const { Title, Text, Paragraph } = Typography;

export interface CounterStandeeModalProps {
  open: boolean;
  onClose: () => void;
  storeName: string;
  storeSlug: string;
  upiId?: string;
  phone?: string;
  address?: string;
  businessType?: string;
}

export function CounterStandeeModal({
  open,
  onClose,
  storeName,
  storeSlug,
  upiId,
  phone,
  address,
  businessType,
}: CounterStandeeModalProps) {
  const [layoutMode, setLayoutMode] = useState<"dual" | "catalog" | "upi">("dual");

  const catalogUrl = `https://app.ginie.space/shop/${storeSlug || "store"}`;
  const effectiveUpi = upiId && upiId.trim() ? upiId.trim() : "paytmqr9tziqdamfo@paytm";
  const upiPaymentUrl = `upi://pay?pa=${effectiveUpi}&pn=${encodeURIComponent(storeName || "Store")}&cu=INR`;

  const handlePrint = () => {
    window.print();
  };

  const getCategoryLabel = (type?: string) => {
    switch (type) {
      case "wholesale":
        return "Wholesale & Distribution";
      case "services":
        return "Services & Booking Hub";
      case "restaurant":
        return "Food & Restaurant";
      case "garments":
        return "Fashion & Garments";
      case "hotel":
        return "Hotel & Hospitality";
      default:
        return "Retail & Kirana Store";
    }
  };

  return (
    <>
      <Modal
        open={open}
        onCancel={onClose}
        footer={null}
        width={720}
        destroyOnClose
        className="counter-standee-dialog"
      >
        {/* Screen Controls (Hidden during print) */}
        <div className="no-print" style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
            <div>
              <Title level={4} style={{ margin: 0, color: "#0f172a" }}>
                🖨️ Counter Standee &amp; Table Poster
              </Title>
              <Text type="secondary" style={{ fontSize: 13 }}>
                Apne billing counter ya table par lagane ke liye ready-to-print A4 / Table-Top standee.
              </Text>
            </div>
            <Space>
              <Button icon={<PrinterOutlined />} type="primary" onClick={handlePrint} style={{ background: "#25D366", borderColor: "#25D366", fontWeight: 700 }}>
                Print / Save PDF
              </Button>
            </Space>
          </div>

          <div style={{ marginTop: 14, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8, background: "#f8fafc", padding: "8px 12px", borderRadius: 8, border: "1px solid #e2e8f0" }}>
            <Text strong style={{ fontSize: 13 }}>Standee Style:</Text>
            <Segmented
              value={layoutMode}
              onChange={(val) => setLayoutMode(val as any)}
              options={[
                { label: "Both (Catalog + UPI)", value: "dual" },
                { label: "Catalog QR Only", value: "catalog" },
                { label: "UPI Payment QR Only", value: "upi" },
              ]}
            />
          </div>
        </div>

        {/* The Printable Standee Card */}
        <div
          id="printable-standee-root"
          style={{
            background: "#ffffff",
            border: "2px solid #059669",
            borderRadius: 16,
            padding: "24px 20px",
            textAlign: "center",
            boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
            position: "relative",
            overflow: "hidden",
            maxWidth: 640,
            margin: "0 auto",
          }}
        >
          {/* Top Decorative Stripe */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 8,
              background: "linear-gradient(90deg, #059669 0%, #25D366 50%, #10b981 100%)",
            }}
          />

          {/* Store Brand Header */}
          <div style={{ marginTop: 8, marginBottom: 16 }}>
            <Tag color="success" style={{ fontWeight: 700, padding: "2px 10px", borderRadius: 999, fontSize: 12 }}>
              {getCategoryLabel(businessType)}
            </Tag>
            <Title level={2} style={{ margin: "8px 0 2px", color: "#0f172a", fontWeight: 800, fontSize: 26, letterSpacing: "-0.02em" }}>
              {storeName || "Hamara Store"}
            </Title>
            <Text style={{ fontSize: 13, color: "#475569", fontWeight: 500 }}>
              {address || "Official WhatsApp Storefront &amp; Direct UPI Billing"}
            </Text>
          </div>

          {/* QR Codes Grid */}
          <Row gutter={[20, 20]} justify="center" align="middle" style={{ margin: "16px 0" }}>
            {(layoutMode === "dual" || layoutMode === "catalog") && (
              <Col xs={24} sm={layoutMode === "dual" ? 12 : 18}>
                <div
                  style={{
                    background: "#f0fdf4",
                    border: "2px solid #86efac",
                    borderRadius: 14,
                    padding: 16,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    height: "100%",
                  }}
                >
                  <Tag color="green" style={{ fontWeight: 800, fontSize: 13, padding: "3px 12px", borderRadius: 6, marginBottom: 10 }}>
                    🛍️ SCAN FOR CATALOG
                  </Tag>
                  <div style={{ background: "#ffffff", padding: 12, borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                    <QRCode
                      value={catalogUrl}
                      size={140}
                      bordered={false}
                      errorLevel="H"
                    />
                  </div>
                  <Text strong style={{ marginTop: 10, fontSize: 13, color: "#065f46" }}>
                    Browse Menu &amp; Order
                  </Text>
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    Scan with Phone Camera / WhatsApp
                  </Text>
                </div>
              </Col>
            )}

            {(layoutMode === "dual" || layoutMode === "upi") && (
              <Col xs={24} sm={layoutMode === "dual" ? 12 : 18}>
                <div
                  style={{
                    background: "#f8fafc",
                    border: "2px solid #cbd5e1",
                    borderRadius: 14,
                    padding: 16,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    height: "100%",
                  }}
                >
                  <Tag color="blue" style={{ fontWeight: 800, fontSize: 13, padding: "3px 12px", borderRadius: 6, marginBottom: 10 }}>
                    ⚡ DIRECT UPI PAYMENT
                  </Tag>
                  <div style={{ background: "#ffffff", padding: 12, borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                    <QRCode
                      value={upiPaymentUrl}
                      size={140}
                      bordered={false}
                      errorLevel="H"
                    />
                  </div>
                  <Text strong style={{ marginTop: 10, fontSize: 13, color: "#1e293b" }}>
                    100% Direct Bank Transfer
                  </Text>
                  <Text code style={{ fontSize: 11, background: "#e2e8f0", color: "#0f172a" }}>
                    UPI: {effectiveUpi}
                  </Text>
                </div>
              </Col>
            )}
          </Row>

          {/* Accepted UPI Apps Row */}
          <div
            style={{
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: 10,
              padding: "10px 14px",
              marginTop: 12,
              marginBottom: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            <Text strong style={{ fontSize: 12, color: "#475569" }}>
              Accepted via any UPI App:
            </Text>
            <Tag color="blue" style={{ fontWeight: 700 }}>PhonePe</Tag>
            <Tag color="cyan" style={{ fontWeight: 700 }}>Google Pay</Tag>
            <Tag color="geekblue" style={{ fontWeight: 700 }}>Paytm</Tag>
            <Tag color="green" style={{ fontWeight: 700 }}>BHIM UPI</Tag>
            <Tag color="purple" style={{ fontWeight: 700 }}>Any Bank UPI</Tag>
          </div>

          {/* Standee Footer */}
          <div style={{ borderTop: "1px dashed #cbd5e1", paddingTop: 12, marginTop: 12 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
              {phone && (
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <WhatsAppOutlined style={{ color: "#25D366", fontSize: 16 }} />
                  <Text strong style={{ fontSize: 12, color: "#0f172a" }}>
                    WhatsApp: {phone}
                  </Text>
                </div>
              )}
              <div style={{ margin: "0 auto", fontSize: 11, color: "#64748b" }}>
                Powered by <strong>GinieSpace</strong> (app.ginie.space) • 0% Middleman Commission
              </div>
            </div>
          </div>
        </div>

        {/* Screen Bottom Actions */}
        <div className="no-print" style={{ textAlign: "center", marginTop: 20 }}>
          <Space size="middle">
            <Button onClick={onClose} style={{ borderRadius: 8 }}>
              Close
            </Button>
            <Button
              type="primary"
              icon={<PrinterOutlined />}
              onClick={handlePrint}
              style={{ background: "#25D366", borderColor: "#25D366", fontWeight: 700, borderRadius: 8 }}
            >
              Print / Save PDF
            </Button>
          </Space>
        </div>
      </Modal>

      {/* Embedded Print Stylesheet */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .counter-standee-dialog,
          .counter-standee-dialog .ant-modal-content,
          #printable-standee-root,
          #printable-standee-root * {
            visibility: visible !important;
          }
          .counter-standee-dialog {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .counter-standee-dialog .ant-modal-content {
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
          }
          .counter-standee-dialog .ant-modal-close,
          .no-print {
            display: none !important;
          }
          #printable-standee-root {
            width: 100% !important;
            max-width: 100% !important;
            border: 3px solid #059669 !important;
            padding: 32px 24px !important;
            page-break-inside: avoid !important;
          }
        }
      `}</style>
    </>
  );
}
