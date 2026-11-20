"use client";

import React from "react";
import { Modal, Button, Typography, Space, Tag } from "antd";
import { CheckCircleOutlined, SafetyCertificateOutlined, HeartFilled } from "@ant-design/icons";

const { Title, Text, Paragraph } = Typography;

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  currentPlan?: "free" | "pro";
}

export function UpgradeModal({ open, onClose }: UpgradeModalProps) {
  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={520}
      centered
      title={
        <Space align="center">
          <SafetyCertificateOutlined style={{ color: "#16a34a", fontSize: 22 }} />
          <span style={{ fontSize: 18, fontWeight: 700 }}>
            100% Free Forever for Your Store
          </span>
          <Tag color="green" style={{ fontWeight: 600 }}>₹0 Subscription</Tag>
        </Space>
      }
    >
      <div style={{ textAlign: "center", padding: "16px 8px 8px" }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
          <CheckCircleOutlined style={{ fontSize: 36, color: "#16a34a" }} />
        </div>
        <Title level={4} style={{ marginBottom: 8, color: "#0f172a" }}>
          All Features Are Already Fully Unlocked!
        </Title>
        <Paragraph type="secondary" style={{ fontSize: 14, lineHeight: 1.6 }}>
          GinieSpace operates on a mission to empower Bharat's local businesses with <strong>zero platform fees</strong>, <strong>0% payment commission</strong>, and <strong>no monthly subscriptions</strong>.
        </Paragraph>

        <div style={{ background: "#f8fafc", borderRadius: 12, padding: "16px 20px", textAlign: "left", marginBottom: 24, border: "1px solid #e2e8f0" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <CheckCircleOutlined style={{ color: "#16a34a", fontSize: 16 }} />
              <span style={{ fontSize: 13, color: "#334155" }}><strong>Unlimited Products:</strong> Add as many items as you want to your catalog</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <CheckCircleOutlined style={{ color: "#16a34a", fontSize: 16 }} />
              <span style={{ fontSize: 13, color: "#334155" }}><strong>Multi-Staff Accounts:</strong> Add your team members with granular permissions</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <CheckCircleOutlined style={{ color: "#16a34a", fontSize: 16 }} />
              <span style={{ fontSize: 13, color: "#334155" }}><strong>0% Payment Commission:</strong> 100% direct bank settlements via UPI QR</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <CheckCircleOutlined style={{ color: "#16a34a", fontSize: 16 }} />
              <span style={{ fontSize: 13, color: "#334155" }}><strong>Automated WhatsApp Bills & Khata:</strong> Instant billing with zero monthly charges</span>
            </div>
          </div>
        </div>

        <Button type="primary" size="large" onClick={onClose} style={{ width: "100%", background: "#16a34a", borderColor: "#16a34a", height: 44, fontWeight: 600 }}>
          Got It, Continue to My Store
        </Button>
      </div>
    </Modal>
  );
}
