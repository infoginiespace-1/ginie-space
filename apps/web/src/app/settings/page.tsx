"use client";

import React, { useState, useEffect } from "react";
import { AppLayout } from "../../components/AppLayout";
import {
  Card,
  Form,
  Input,
  Button,
  Switch,
  Typography,
  message,
  Divider,
  Tag,
  Space,
  Modal,
  Spin,
  Alert,
  Row,
  Col,
} from "antd";
import {
  SaveOutlined,
  QrcodeOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined,
  PhoneOutlined,
} from "@ant-design/icons";
import { api } from "../../lib/api";
import { getSocket } from "../../lib/socket";

const { Title, Text, Paragraph } = Typography;

export default function SettingsPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Merchant WhatsApp Connection State
  const [waStatus, setWaStatus] = useState<"disconnected" | "connecting" | "connected">("disconnected");
  const [waPhone, setWaPhone] = useState<string | undefined>(undefined);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    api.get("/api/settings")
      .then((res) => {
        const b = res.data.business || {};
        let parsedSettings: { autoReply: boolean; welcomeMessage: string; upiId?: string } = {
          autoReply: true,
          welcomeMessage: "Hello! Welcome to our store.",
          upiId: "",
        };
        if (b.settingsJson) {
          try {
            parsedSettings = { ...parsedSettings, ...JSON.parse(b.settingsJson) };
          } catch {}
        }
        form.setFieldsValue({
          name: b.name || "",
          phone: b.phone || "",
          address: b.address || "",
          upiId: parsedSettings.upiId || "",
          autoReply: parsedSettings.autoReply,
          welcomeMessage: parsedSettings.welcomeMessage,
        });
      })
      .catch(() => message.error("Could not load settings"))
      .finally(() => setLoading(false));

    api.get("/api/whatsapp/status")
      .then((res) => {
        const s = res.data.session;
        setWaStatus(s.status);
        setWaPhone(s.phoneNumber);
        if (s.qrCode) setQrCode(s.qrCode);
      })
      .catch(() => {});

    const socket = getSocket();
    if (socket) {
      socket.on("whatsapp:status", (data: any) => {
        setWaStatus(data.status);
        if (data.phoneNumber) setWaPhone(data.phoneNumber);
        if (data.status === "connected") {
          setQrModalVisible(false);
          setQrCode(null);
        }
      });

      socket.on("whatsapp:qr", (data: any) => {
        setQrCode(data.qrCode);
        setWaStatus("connecting");
        setQrModalVisible(true);
      });
    }

    return () => {
      if (socket) {
        socket.off("whatsapp:status");
        socket.off("whatsapp:qr");
      }
    };
  }, [form]);

  const handleConnectWhatsApp = async () => {
    try {
      setConnecting(true);
      const res = await api.post("/api/whatsapp/connect");
      if (res.data.session?.qrCode) {
        setQrCode(res.data.session.qrCode);
      }
      setQrModalVisible(true);
    } catch (err: any) {
      message.error(err.message || "Could not start WhatsApp connection");
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnectWhatsApp = async () => {
    try {
      await api.post("/api/whatsapp/disconnect");
      setWaStatus("disconnected");
      setWaPhone(undefined);
      setQrCode(null);
      message.info("Your store WhatsApp has been disconnected");
    } catch (err: any) {
      message.error(err.message || "Could not disconnect WhatsApp");
    }
  };

  const handleSave = async (values: any) => {
    try {
      setSaving(true);
      const settingsJson = JSON.stringify({
        autoReply: values.autoReply,
        welcomeMessage: values.welcomeMessage,
        upiId: (values.upiId || "").trim(),
      });

      await api.put("/api/settings/business", {
        name: values.name,
        phone: values.phone,
        address: values.address,
        settingsJson,
      });

      message.success("Settings saved successfully!");
    } catch (err: any) {
      message.error(err.message || "Failed to update settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout>
      <div style={{ marginBottom: 20 }}>
        <Title level={4} style={{ margin: 0 }}>Business Profile & Settings</Title>
        <Text type="secondary">Manage your store WhatsApp connection, business details, and automated greetings</Text>
      </div>

      <Row gutter={[20, 20]}>
        <Col xs={24} lg={14}>
          <Card style={{ borderRadius: 12 }}>
            <Form form={form} layout="vertical" onFinish={handleSave} disabled={loading}>
              <Title level={5}>Business Profile</Title>
              <Form.Item name="name" label="Business Name" rules={[{ required: true, message: "Enter business name" }]}>
                <Input placeholder="e.g. Ginie Retail Store" />
              </Form.Item>

              <Form.Item name="phone" label="Store Contact Phone">
                <Input placeholder="e.g. +91 98765 43210" />
              </Form.Item>

              <Form.Item name="address" label="Store / Office Address">
                <Input.TextArea rows={2} placeholder="Shop 12, Main Market, MG Road..." />
              </Form.Item>

              <Form.Item
                name="upiId"
                label="Merchant UPI ID (for Bills &amp; Payment Reminders)"
                extra="Automatically included on WhatsApp Order Bills &amp; Customer Payment Reminders"
              >
                <Input placeholder="e.g. yourstore@ybl or 9876543210@paytm" />
              </Form.Item>

              <Divider />

              <Title level={5}>WhatsApp Automation</Title>
              <Form.Item
                name="autoReply"
                label="Enable Automated Welcome Message"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>

              <Form.Item
                name="welcomeMessage"
                label="Automated Greeting for First-Time Callers"
              >
                <Input.TextArea
                  rows={3}
                  placeholder="Hello! Thank you for reaching out to us on WhatsApp. How can we assist you today?"
                />
              </Form.Item>

              <Form.Item style={{ marginTop: 24 }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<SaveOutlined />}
                  loading={saving}
                  size="large"
                  style={{ background: "#25D366", borderColor: "#25D366", fontWeight: 600 }}
                >
                  Save Settings
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          <Card
            title={
              <Space>
                <PhoneOutlined style={{ color: "#25D366" }} />
                <span>My Store WhatsApp Connection</span>
              </Space>
            }
            style={{ borderRadius: 12, marginBottom: 20 }}
          >
            <Paragraph type="secondary" style={{ fontSize: 13 }}>
              Apne business ka khud ka WhatsApp yahan link karein taaki aap Live Inbox me apne customers ko direct message aur order bills bhej sakein.
            </Paragraph>

            <div style={{ marginBottom: 16 }}>
              <Text type="secondary" style={{ display: "block", marginBottom: 6 }}>Connection Status:</Text>
              {waStatus === "connected" ? (
                <Tag icon={<CheckCircleOutlined />} color="success" style={{ padding: "5px 12px", fontSize: 13 }}>
                  Connected {waPhone ? `(+${waPhone})` : ""}
                </Tag>
              ) : waStatus === "connecting" ? (
                <Tag icon={<SyncOutlined spin />} color="warning" style={{ padding: "5px 12px", fontSize: 13 }}>
                  Connecting... Scan QR
                </Tag>
              ) : (
                <Tag icon={<CloseCircleOutlined />} color="error" style={{ padding: "5px 12px", fontSize: 13 }}>
                  Disconnected
                </Tag>
              )}
            </div>

            <Space wrap>
              {waStatus === "connected" ? (
                <Button danger onClick={handleDisconnectWhatsApp}>
                  Disconnect My WhatsApp
                </Button>
              ) : (
                <Button
                  type="primary"
                  icon={<QrcodeOutlined />}
                  loading={connecting}
                  onClick={handleConnectWhatsApp}
                  style={{ background: "#25D366", borderColor: "#25D366", fontWeight: 600 }}
                >
                  Scan QR & Link My WhatsApp
                </Button>
              )}
              {waStatus === "connecting" && (
                <Button onClick={() => setQrModalVisible(true)}>View QR</Button>
              )}
            </Space>
          </Card>

          <Alert
            type="info"
            showIcon
            message="GinieSpace Official Support Helpline"
            description="Platform alerts, system notifications, aur support queries ke liye official helpline number +91 9279259690 hai."
            style={{ borderRadius: 12 }}
          />
        </Col>
      </Row>

      <Modal
        title="Link Your Store WhatsApp"
        open={qrModalVisible}
        onCancel={() => setQrModalVisible(false)}
        footer={null}
        centered
        width={400}
      >
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <p style={{ color: "#595959", marginBottom: 20 }}>
            Open WhatsApp on your phone $\rightarrow$ Settings $\rightarrow$ <strong>Linked Devices</strong> $\rightarrow$ <strong>Link a Device</strong> and scan this QR code.
          </p>
          {qrCode ? (
            <div style={{ display: "inline-block", padding: 12, border: "2px solid #25D366", borderRadius: 12, background: "#fff" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrCode} alt="WhatsApp QR Code" style={{ width: 240, height: 240, display: "block" }} />
            </div>
          ) : (
            <div style={{ height: 240, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
              <Spin size="large" />
              <Text type="secondary">Generating secure QR code...</Text>
            </div>
          )}
          <div style={{ marginTop: 20 }}>
            <Button onClick={handleConnectWhatsApp} icon={<SyncOutlined />} loading={connecting}>
              Refresh QR Code
            </Button>
          </div>
        </div>
      </Modal>
    </AppLayout>
  );
}
