"use client";

import React, { useState } from "react";
import {
  Modal,
  Button,
  Typography,
  Card,
  Space,
  Tag,
  Radio,
  Input,
  message,
  Divider,
  Alert,
} from "antd";
import {
  CrownOutlined,
  CheckCircleOutlined,
  CopyOutlined,
  SafetyCertificateOutlined,
  SendOutlined,
  QrcodeOutlined,
} from "@ant-design/icons";
import { api } from "../lib/api";

const { Title, Text, Paragraph } = Typography;

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  currentPlan?: "free" | "pro";
}

export function UpgradeModal({ open, onClose, onSuccess, currentPlan = "free" }: UpgradeModalProps) {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [utrNumber, setUtrNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [submittedUtr, setSubmittedUtr] = useState<string | null>(null);

  const amount = billingCycle === "monthly" ? 99 : 999;
  const officialUpi = "9279259690@fam";
  const upiLink = `upi://pay?pa=${officialUpi}&pn=GinieSpace&am=${amount}&cu=INR&tn=GinieSpacePro`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiLink)}`;

  const handleCopyUpi = () => {
    navigator.clipboard?.writeText(officialUpi);
    setCopied(true);
    message.success("UPI ID copied to clipboard!");
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSubmitUpgrade = async () => {
    const trimmed = utrNumber.trim();
    if (!trimmed || trimmed.length < 6) {
      message.error("Please enter a valid 12-digit UPI UTR / Transaction Reference Number.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.post("/api/settings/upgrade-request", {
        utrNumber: trimmed,
        billingCycle,
        amount,
      });

      setSubmittedUtr(trimmed);
      message.success(res.data?.message || "Upgrade request submitted successfully!");
      if (onSuccess) onSuccess();
    } catch (err: any) {
      message.error(err.response?.data?.error || err.message || "Failed to submit upgrade request");
    } finally {
      setSubmitting(false);
    }
  };

  const handleModalClose = () => {
    setUtrNumber("");
    setSubmittedUtr(null);
    onClose();
  };

  return (
    <Modal
      open={open}
      onCancel={handleModalClose}
      footer={null}
      width={640}
      centered
      title={
        <Space align="center">
          <CrownOutlined style={{ color: "#f59e0b", fontSize: 22 }} />
          <span style={{ fontSize: 18, fontWeight: 700 }}>
            Upgrade to GinieSpace PRO Workspace
          </span>
          <Tag color="gold" style={{ fontWeight: 600 }}>₹99/mo</Tag>
        </Space>
      }
    >
      <div style={{ padding: "4px 0" }}>
        {submittedUtr ? (
          <div style={{ textAlign: "center", padding: "24px 12px" }}>
            <div style={{ fontSize: 52, color: "#10b981", marginBottom: 12 }}>🎉</div>
            <Title level={4} style={{ color: "#065f46", margin: 0 }}>
              Payment Verification Request Submitted!
            </Title>
            <Paragraph type="secondary" style={{ marginTop: 8, fontSize: 14 }}>
              Aapka UTR Number <strong>{submittedUtr}</strong> hamare admin team ko bhej diya gaya hai.
            </Paragraph>
            <Alert
              type="success"
              showIcon
              message="Quick Activation (Within 15 Minutes)"
              description="Aapke WhatsApp (+91 92792 59690) par verified PRO Invoice aur congratulatory badge send kar diya jayega. Tab tak aapka account verification queue me hai."
              style={{ textAlign: "left", margin: "16px 0", borderRadius: 8 }}
            />
            <Button type="primary" onClick={handleModalClose} style={{ marginTop: 8 }}>
              Done & Return to App
            </Button>
          </div>
        ) : (
          <div>
            {/* Billing Cycle Switch */}
            <div style={{ textAlign: "center", marginBottom: 16 }}>
              <Radio.Group
                value={billingCycle}
                onChange={(e) => setBillingCycle(e.target.value)}
                buttonStyle="solid"
                size="middle"
              >
                <Radio.Button value="monthly">
                  Monthly Plan — <strong>₹99 / mo</strong>
                </Radio.Button>
                <Radio.Button value="yearly">
                  Yearly Plan — <strong>₹999 / yr</strong> <Tag color="green" style={{ marginLeft: 4 }}>Save 2 Months!</Tag>
                </Radio.Button>
              </Radio.Group>
            </div>

            {/* Feature Comparison */}
            <Card
              size="small"
              style={{
                borderRadius: 10,
                background: "#fefce8",
                borderColor: "#fef08a",
                marginBottom: 16,
              }}
            >
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 16px", fontSize: 13 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <CheckCircleOutlined style={{ color: "#16a34a" }} />
                  <span><strong>Unlimited Items</strong> (vs 15 Free)</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <CheckCircleOutlined style={{ color: "#16a34a" }} />
                  <span><strong>Unlimited Leads</strong> (vs 10 Free)</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <CheckCircleOutlined style={{ color: "#16a34a" }} />
                  <span><strong>5 Staff Operator Accounts</strong></span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <CheckCircleOutlined style={{ color: "#16a34a" }} />
                  <span><strong>Bulk WhatsApp Broadcasts</strong></span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <CheckCircleOutlined style={{ color: "#16a34a" }} />
                  <span><strong>Nightly 9 PM Sales Report</strong></span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <CheckCircleOutlined style={{ color: "#16a34a" }} />
                  <span><strong>Verified Storefront Badge</strong></span>
                </div>
              </div>
            </Card>

            {/* UPI QR Payment Step */}
            <Card
              size="small"
              title={
                <Space>
                  <QrcodeOutlined style={{ color: "#2563eb" }} />
                  <span>Step 1: Scan &amp; Pay ₹{amount} via any UPI App</span>
                </Space>
              }
              style={{ borderRadius: 10, marginBottom: 16 }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap", justifyContent: "center" }}>
                <div style={{ textAlign: "center" }}>
                  <img
                    src={qrUrl}
                    alt="UPI QR Code"
                    style={{
                      width: 140,
                      height: 140,
                      border: "2px solid #e2e8f0",
                      borderRadius: 8,
                      display: "block",
                      margin: "0 auto",
                    }}
                  />
                  <Text type="secondary" style={{ fontSize: 11, marginTop: 4, display: "block" }}>
                    Scan with PhonePe, GPay, Paytm
                  </Text>
                </div>

                <div style={{ flex: 1, minWidth: 220 }}>
                  <div style={{ marginBottom: 12 }}>
                    <Text type="secondary" style={{ fontSize: 12, display: "block" }}>
                      Official GinieSpace UPI ID:
                    </Text>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                      <Tag color="blue" style={{ fontSize: 14, padding: "4px 10px", margin: 0 }}>
                        {officialUpi}
                      </Tag>
                      <Button size="small" icon={<CopyOutlined />} onClick={handleCopyUpi}>
                        {copied ? "Copied" : "Copy"}
                      </Button>
                    </div>
                  </div>

                  <div style={{ marginBottom: 6 }}>
                    <Text strong style={{ fontSize: 13, color: "#166534" }}>
                      💰 Payable Amount: ₹{amount} ({billingCycle})
                    </Text>
                  </div>
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    <SafetyCertificateOutlined style={{ color: "#10b981", marginRight: 4 }} />
                    100% Secure Instant UPI Payment. Zero convenience fee.
                  </Text>
                </div>
              </div>
            </Card>

            {/* Step 2: UTR Reference Submission */}
            <Card
              size="small"
              title={
                <Space>
                  <SendOutlined style={{ color: "#16a34a" }} />
                  <span>Step 2: Enter 12-Digit UPI Reference / UTR Number</span>
                </Space>
              }
              style={{ borderRadius: 10 }}
            >
              <Paragraph type="secondary" style={{ fontSize: 12, marginBottom: 10 }}>
                Payment karne ke baad apne Google Pay / PhonePe / Paytm ke receipt me se <strong>12-digit UPI Ref / UTR No.</strong> yahan daalein:
              </Paragraph>
              <div style={{ display: "flex", gap: 8 }}>
                <Input
                  placeholder="e.g. 432198765432 (12-digit UTR)"
                  value={utrNumber}
                  onChange={(e) => setUtrNumber(e.target.value)}
                  maxLength={24}
                  size="large"
                  style={{ fontWeight: 600, letterSpacing: "0.5px" }}
                />
                <Button
                  type="primary"
                  size="large"
                  icon={<CrownOutlined />}
                  loading={submitting}
                  onClick={handleSubmitUpgrade}
                  style={{
                    background: "#f59e0b",
                    borderColor: "#f59e0b",
                    fontWeight: 700,
                    minWidth: 160,
                  }}
                >
                  Activate PRO
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </Modal>
  );
}
