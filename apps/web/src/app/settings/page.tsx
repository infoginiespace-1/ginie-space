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
  Upload,
  Table,
  Checkbox,
  Progress,
  Popconfirm,
  Select,
} from "antd";
import {
  SaveOutlined,
  QrcodeOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined,
  PhoneOutlined,
  ShopOutlined,
  CopyOutlined,
  LockOutlined,
  UploadOutlined,
  TeamOutlined,
  DeleteOutlined,
  UserAddOutlined,
  CrownOutlined,
} from "@ant-design/icons";
import { api } from "../../lib/api";
import { getSocket } from "../../lib/socket";
import { UpgradeModal } from "../../components/UpgradeModal";
import { useAuth } from "../../context/AuthContext";

const { Title, Text, Paragraph } = Typography;

async function compressLogoJpg(file: File): Promise<string> {
  const raw: string = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Could not read logo"));
    reader.readAsDataURL(file);
  });
  if (raw.length <= 45000) return raw;
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const maxDim = 320;
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        const s = Math.min(maxDim / width, maxDim / height);
        width = Math.round(width * s);
        height = Math.round(height * s);
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas unavailable"));
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", 0.72));
    };
    img.onerror = () => reject(new Error("Invalid JPG file"));
    img.src = raw;
  });
}

export default function SettingsPage() {
  const { user, updateUserLocal } = useAuth();
  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [staffForm] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const savedQuickRepliesRef = React.useRef<Array<{ label: string; text: string }> | undefined>(undefined);
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [currentSlug, setCurrentSlug] = useState<string>("");
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [planUsage, setPlanUsage] = useState<{
    plan: "free" | "pro";
    subscriptionStatus?: "active" | "pending" | "expired" | "none";
    planExpiresAt?: string | null;
    planPurchasedAt?: string | null;
    paymentUtr?: string | null;
    usage: { productsCount: number; leadsCount: number; staffCount: number };
    limits: { maxProducts: number; maxLeads: number; maxStaff: number; allowBulkBroadcast: boolean };
    pricing?: { monthly: number; yearly: number; upiId: string; supportPhone: string };
  } | null>(null);

  const fetchPlanUsage = () => {
    api.get("/api/settings/plan-usage").then((r) => setPlanUsage(r.data)).catch(() => {});
  };
  const [staffList, setStaffList] = useState<any[]>([]);
  const [creatingStaff, setCreatingStaff] = useState(false);

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
        setCurrentSlug(b.slug || "");
        let parsedSettings: {
          autoReply: boolean;
          welcomeMessage: string;
          upiId?: string;
          gstin?: string;
          gstRate?: number;
          deliveryFee?: number;
          couponCode?: string;
          couponPercent?: number;
          quickReplies?: Array<{ label: string; text: string }>;
          logoUrl?: string;
          isOpen?: boolean;
          closedMessage?: string;
          smartKeywordBot?: boolean;
          dailySummaryEnabled?: boolean;
        } = {
          autoReply: true,
          welcomeMessage: "Hello! Welcome to our store.",
          upiId: "",
          gstin: "",
          gstRate: 0,
          deliveryFee: 0,
          couponCode: "",
          couponPercent: 0,
          isOpen: true,
          closedMessage: "Our store is currently closed. We will respond as soon as we reopen!",
          smartKeywordBot: true,
          dailySummaryEnabled: false,
        };
        if (b.settingsJson) {
          try {
            parsedSettings = { ...parsedSettings, ...JSON.parse(b.settingsJson) };
          } catch {}
        }
        if (parsedSettings.quickReplies) {
          savedQuickRepliesRef.current = parsedSettings.quickReplies;
        }
        if (parsedSettings.logoUrl) {
          setLogoPreview(parsedSettings.logoUrl);
        }
        const firstCoupon = Array.isArray((parsedSettings as any).coupons) ? (parsedSettings as any).coupons[0] : null;
        form.setFieldsValue({
          name: b.name || "",
          businessType: res.data?.businessType || user?.businessType || "retail",
          phone: b.phone || "",
          address: b.address || "",
          slug: b.slug || "",
          upiId: parsedSettings.upiId || "",
          gstin: parsedSettings.gstin || "",
          gstRate: parsedSettings.gstRate || 0,
          deliveryFee: parsedSettings.deliveryFee || 0,
          couponCode: firstCoupon?.code || "",
          couponPercent: firstCoupon?.discountPercent || 0,
          isOpen: parsedSettings.isOpen !== false,
          closedMessage: parsedSettings.closedMessage,
          autoReply: parsedSettings.autoReply,
          smartKeywordBot: parsedSettings.smartKeywordBot !== false,
          dailySummaryEnabled: Boolean(parsedSettings.dailySummaryEnabled),
          welcomeMessage: parsedSettings.welcomeMessage,
        });
      })
      .catch(() => message.error("Could not load settings"))
      .finally(() => setLoading(false));

    api.get("/api/settings/plan-usage").then((r) => setPlanUsage(r.data)).catch(() => {});
    if (user?.role !== "staff") {
      api.get("/api/settings/staff").then((r) => setStaffList(r.data?.staff || [])).catch(() => {});
    }

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

  const handleChangePassword = async (values: { currentPassword: string; newPassword: string; confirmPassword: string }) => {
    if (values.newPassword !== values.confirmPassword) {
      message.error("New password and confirm password do not match");
      return;
    }
    try {
      setChangingPassword(true);
      const res = await api.post("/api/auth/change-password", {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      message.success(res.data?.message || "Password updated successfully!");
      passwordForm.resetFields();
    } catch (err: any) {
      message.error(err.message || "Could not update password");
    } finally {
      setChangingPassword(false);
    }
  };

  const handleSave = async (values: any) => {
    try {
      setSaving(true);
      const cleanCoupon = String(values.couponCode || "").trim().toUpperCase();
      const pct = Math.min(90, Math.max(0, Number(values.couponPercent) || 0));
      const coupons = cleanCoupon && pct > 0 ? [{ code: cleanCoupon, discountPercent: pct }] : [];

      const settingsJson = JSON.stringify({
        autoReply: values.autoReply,
        welcomeMessage: values.welcomeMessage,
        smartKeywordBot: values.smartKeywordBot !== false,
        dailySummaryEnabled: Boolean(values.dailySummaryEnabled),
        dailySummaryHour: 21,
        isOpen: values.isOpen !== false,
        closedMessage: (values.closedMessage || "").trim(),
        logoUrl: logoPreview || "",
        upiId: (values.upiId || "").trim(),
        gstin: (values.gstin || "").trim().toUpperCase(),
        gstRate: Number(values.gstRate) || 0,
        deliveryFee: Math.max(0, Number(values.deliveryFee) || 0),
        coupons,
        quickReplies: savedQuickRepliesRef.current,
      });

      const res = await api.put("/api/settings/business", {
        name: values.name,
        businessType: values.businessType,
        phone: values.phone,
        address: values.address,
        slug: values.slug,
        settingsJson,
      });

      if (res.data?.businessType) {
        updateUserLocal({ businessType: res.data.businessType });
      }
      setCurrentSlug(res.data?.business?.slug || "");
      message.success("Settings saved successfully!");
    } catch (err: any) {
      message.error(err.message || "Failed to update settings");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateStaff = async (values: any) => {
    setCreatingStaff(true);
    try {
      const res = await api.post("/api/settings/staff", values);
      setStaffList((prev) => [res.data.staff, ...prev]);
      staffForm.resetFields();
      message.success("Staff member added!");
      api.get("/api/settings/plan-usage").then((r) => setPlanUsage(r.data)).catch(() => {});
    } catch (err: any) {
      message.error(err.message || "Could not create staff account");
    } finally {
      setCreatingStaff(false);
    }
  };

  const handleDeleteStaff = async (staffId: string) => {
    try {
      await api.delete(`/api/settings/staff/${staffId}`);
      setStaffList((prev) => prev.filter((s) => s.id !== staffId));
      message.success("Staff account removed");
      api.get("/api/settings/plan-usage").then((r) => setPlanUsage(r.data)).catch(() => {});
    } catch (err: any) {
      message.error(err.message || "Could not delete staff member");
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
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}>
                <Form.Item name="name" label="Business Name" rules={[{ required: true, message: "Enter business name" }]}>
                  <Input placeholder="e.g. Ginie Retail Store" />
                </Form.Item>
                <Form.Item name="businessType" label="Business Mode" extra="Switch anytime">
                  <Select
                    options={[
                      { value: "retail", label: "Retail Store" },
                      { value: "wholesale", label: "Wholesale / B2B" },
                      { value: "services", label: "Service & Bookings" },
                    ]}
                  />
                </Form.Item>
              </div>

              <Form.Item name="phone" label="Store Contact Phone">
                <Input placeholder="e.g. +91 98765 43210" />
              </Form.Item>

              <Form.Item name="address" label="Store / Office Address">
                <Input.TextArea rows={2} placeholder="Shop 12, Main Market, MG Road..." />
              </Form.Item>

              <Form.Item
                name="upiId"
                label="Merchant UPI ID (for Bills &amp; Payment Reminders)"
                extra="Automatically included on WhatsApp Order Bills, Storefront Checkout &amp; Scannable UPI QR Codes"
              >
                <Input placeholder="e.g. yourstore@ybl or 9876543210@paytm" />
              </Form.Item>

              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}>
                <Form.Item name="gstin" label="GSTIN (Optional for Invoices)">
                  <Input placeholder="e.g. 27ABCDE1234F1Z5" />
                </Form.Item>

                <Form.Item name="gstRate" label="Default GST %">
                  <Input type="number" min={0} max={28} placeholder="0 or 18" />
                </Form.Item>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                <Form.Item name="deliveryFee" label="Storefront Delivery Fee (₹)">
                  <Input type="number" min={0} placeholder="0" />
                </Form.Item>
                <Form.Item name="couponCode" label="Storefront Coupon Code">
                  <Input placeholder="e.g. WELCOME10" />
                </Form.Item>
                <Form.Item name="couponPercent" label="Coupon Discount %">
                  <Input type="number" min={0} max={90} placeholder="10" />
                </Form.Item>
              </div>

              {user?.id && (
                <Card size="small" style={{ marginBottom: 16, background: "#f0fdf4", borderColor: "#bbf7d0" }}>
                  <Space direction="vertical" size={6} style={{ width: "100%" }}>
                    <Text strong style={{ color: "#15803d" }}>
                      <ShopOutlined /> Your Public Digital Storefront Link
                    </Text>
                    <Space wrap>
                      <Text code>{`https://app.ginie.space/shop/${currentSlug || user.id}`}</Text>
                      <Button
                        size="small"
                        icon={<CopyOutlined />}
                        onClick={() => {
                          const url = `${window.location.origin}/shop/${currentSlug || user.id}`;
                          navigator.clipboard?.writeText(url);
                          message.success("Storefront link copied!");
                        }}
                      >
                        Copy Link
                      </Button>
                    </Space>
                  </Space>
                </Card>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Form.Item name="slug" label="Custom Store URL Slug (Optional)" extra="e.g. bharat-gold -> /shop/bharat-gold">
                  <Input placeholder="my-store-name" />
                </Form.Item>

                <Form.Item label="Store Logo (JPG max 60 KB)">
                  <Space>
                    {logoPreview && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={logoPreview} alt="Logo" style={{ width: 38, height: 38, borderRadius: 8, objectFit: "cover", border: "1px solid #d9d9d9" }} />
                    )}
                    <Upload
                      accept=".jpg,.jpeg,image/jpeg"
                      showUploadList={false}
                      beforeUpload={async (file) => {
                        if (file.size > 60 * 1024) {
                          message.error("Logo JPG size must be under 60 KB");
                          return Upload.LIST_IGNORE;
                        }
                        try {
                          const compressed = await compressLogoJpg(file);
                          setLogoPreview(compressed);
                          message.success("Store logo ready!");
                        } catch (e: any) {
                          message.error(e.message || "Invalid JPG");
                        }
                        return false;
                      }}
                    >
                      <Button icon={<UploadOutlined />}>{logoPreview ? "Change Logo" : "Upload Logo"}</Button>
                    </Upload>
                    {logoPreview && <Button danger size="small" onClick={() => setLogoPreview("")}>Clear</Button>}
                  </Space>
                </Form.Item>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 12 }}>
                <Form.Item name="isOpen" label="Store Open for Orders" valuePropName="checked">
                  <Switch checkedChildren="OPEN" unCheckedChildren="CLOSED" />
                </Form.Item>
                <Form.Item name="closedMessage" label="Closed / Away Notice">
                  <Input placeholder="Store is closed right now. Opening tomorrow at 9 AM!" />
                </Form.Item>
              </div>

              <Divider />

              <Title level={5}>WhatsApp Automation &amp; Reports</Title>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                <Form.Item
                  name="autoReply"
                  label="Welcome Greeting"
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>
                <Form.Item
                  name="smartKeywordBot"
                  label="Catalog / Order Status Bot"
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>
                <Form.Item
                  name="dailySummaryEnabled"
                  label="Nightly 9 PM Report"
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>
              </div>

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

          <Card
            title={
              <Space>
                <LockOutlined style={{ color: "#15803d" }} />
                <span>Account Security — Change Password</span>
              </Space>
            }
            style={{ borderRadius: 12, marginBottom: 20 }}
          >
            <Form form={passwordForm} layout="vertical" onFinish={handleChangePassword}>
              <Form.Item
                name="currentPassword"
                label="Current Password"
                rules={[{ required: true, message: "Enter current password" }]}
              >
                <Input.Password placeholder="Current password" />
              </Form.Item>
              <Form.Item
                name="newPassword"
                label="New Password"
                rules={[
                  { required: true, message: "Enter new password" },
                  { min: 6, message: "Minimum 6 characters required" },
                ]}
              >
                <Input.Password placeholder="At least 6 characters" />
              </Form.Item>
              <Form.Item
                name="confirmPassword"
                label="Confirm New Password"
                rules={[{ required: true, message: "Confirm new password" }]}
              >
                <Input.Password placeholder="Repeat new password" />
              </Form.Item>
              <Button type="primary" htmlType="submit" loading={changingPassword} block>
                Update Password
              </Button>
            </Form>
          </Card>

          <Alert
            type="info"
            showIcon
            message="GinieSpace Official Support Helpline"
            description="Platform alerts, system notifications, aur support queries ke liye official helpline number +91 9279259690 hai."
            style={{ borderRadius: 12, marginBottom: 20 }}
          />

          {planUsage && (
            <Card
              title={
                <Space>
                  <CrownOutlined style={{ color: planUsage.plan === "pro" ? "#d97706" : "#64748b" }} />
                  <span>Workspace Plan &amp; Quotas</span>
                  <Tag color={planUsage.plan === "pro" ? "gold" : "blue"}>{planUsage.plan.toUpperCase()}</Tag>
                </Space>
              }
              style={{ borderRadius: 12, marginBottom: 20 }}
            >
              <Space direction="vertical" style={{ width: "100%" }} size={12}>
                {planUsage.subscriptionStatus === "pending" && (
                  <Alert
                    type="warning"
                    showIcon
                    message="PRO Upgrade Under Verification"
                    description={
                      <div style={{ fontSize: 12 }}>
                        Aapka payment UTR <strong>{planUsage.paymentUtr}</strong> admin review me hai. Confirm hote hi PRO plan activate ho jayega!
                      </div>
                    }
                  />
                )}

                {planUsage.plan === "pro" && planUsage.planExpiresAt && (
                  <div style={{ background: "#fef3c7", padding: "8px 12px", borderRadius: 8, border: "1px solid #fde68a" }}>
                    <Text strong style={{ color: "#92400e", fontSize: 13 }}>
                      👑 PRO Plan Active
                    </Text>
                    <div style={{ fontSize: 12, color: "#b45309" }}>
                      Valid Till: <strong>{new Date(planUsage.planExpiresAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</strong>
                    </div>
                  </div>
                )}

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                    <span>Catalog Items</span>
                    <span>{planUsage.usage.productsCount} / {planUsage.plan === "pro" ? "Unlimited" : planUsage.limits.maxProducts}</span>
                  </div>
                  {planUsage.plan === "free" && (
                    <Progress percent={Math.min(100, Math.round((planUsage.usage.productsCount / planUsage.limits.maxProducts) * 100))} size="small" />
                  )}
                </div>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                    <span>Saved B2B Leads</span>
                    <span>{planUsage.usage.leadsCount} / {planUsage.plan === "pro" ? "Unlimited" : planUsage.limits.maxLeads}</span>
                  </div>
                  {planUsage.plan === "free" && (
                    <Progress percent={Math.min(100, Math.round((planUsage.usage.leadsCount / planUsage.limits.maxLeads) * 100))} size="small" />
                  )}
                </div>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                    <span>Team Staff Accounts</span>
                    <span>{planUsage.usage.staffCount} / {planUsage.limits.maxStaff}</span>
                  </div>
                </div>

                {planUsage.plan === "free" ? (
                  <div>
                    <Button
                      type="primary"
                      icon={<CrownOutlined />}
                      block
                      size="large"
                      onClick={() => setUpgradeModalOpen(true)}
                      style={{
                        marginTop: 4,
                        background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                        borderColor: "#f59e0b",
                        fontWeight: 700,
                        boxShadow: "0 4px 12px rgba(245, 158, 11, 0.25)",
                      }}
                    >
                      👑 Upgrade to PRO (₹99/month)
                    </Button>
                    <div style={{ textAlign: "center", marginTop: 8 }}>
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        Unlock unlimited catalog, leads, 5 staff accounts &amp; verified badge!
                      </Text>
                    </div>
                  </div>
                ) : (
                  <Button
                    icon={<CrownOutlined />}
                    block
                    onClick={() => setUpgradeModalOpen(true)}
                    style={{ borderColor: "#f59e0b", color: "#b45309" }}
                  >
                    Extend / Renew PRO Plan
                  </Button>
                )}
              </Space>
            </Card>
          )}
        </Col>
      </Row>

      {user?.role !== "staff" && (
        <Card
          title={
            <Space>
              <TeamOutlined style={{ color: "#0284c7" }} />
              <span>Team &amp; Staff Accounts</span>
            </Space>
          }
          style={{ borderRadius: 12, marginTop: 20 }}
        >
          <Row gutter={[20, 20]}>
            <Col xs={24} lg={10}>
              <Form form={staffForm} layout="vertical" onFinish={handleCreateStaff} initialValues={{ staffPermissions: ["orders", "inbox", "customers"] }}>
                <Form.Item name="name" label="Staff Name" rules={[{ required: true }]}>
                  <Input placeholder="e.g. Raju (Billing / Delivery)" />
                </Form.Item>
                <Form.Item name="email" label="Staff Login Email" rules={[{ required: true, type: "email" }]}>
                  <Input placeholder="raju@mystore.com" />
                </Form.Item>
                <Form.Item name="password" label="Staff Password" rules={[{ required: true, min: 6 }]}>
                  <Input.Password placeholder="Min 6 characters" />
                </Form.Item>
                <Form.Item name="staffPermissions" label="Allowed Sections">
                  <Checkbox.Group
                    options={[
                      { label: "Orders", value: "orders" },
                      { label: "Live Inbox", value: "inbox" },
                      { label: "Customers", value: "customers" },
                      { label: "Catalog", value: "products" },
                      { label: "Leads", value: "leads" },
                    ]}
                  />
                </Form.Item>
                <Button type="primary" htmlType="submit" icon={<UserAddOutlined />} loading={creatingStaff}>
                  Create Staff Login
                </Button>
              </Form>
            </Col>
            <Col xs={24} lg={14}>
              <Table
                dataSource={staffList}
                rowKey="id"
                size="small"
                pagination={false}
                locale={{ emptyText: "No staff members added yet." }}
                columns={[
                  { title: "Name", dataIndex: "name", key: "name" },
                  { title: "Email", dataIndex: "email", key: "email" },
                  {
                    title: "Permissions",
                    dataIndex: "staffPermissions",
                    key: "perms",
                    render: (p: string) =>
                      String(p || "")
                        .split(",")
                        .filter(Boolean)
                        .map((x) => <Tag key={x}>{x}</Tag>),
                  },
                  {
                    title: "Action",
                    key: "act",
                    render: (_: any, r: any) => (
                      <Popconfirm title="Remove staff access?" onConfirm={() => handleDeleteStaff(r.id)}>
                        <Button size="small" danger icon={<DeleteOutlined />} />
                      </Popconfirm>
                    ),
                  },
                ]}
              />
            </Col>
          </Row>
        </Card>
      )}

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

      <UpgradeModal
        open={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        onSuccess={() => {
          setUpgradeModalOpen(false);
          fetchPlanUsage();
        }}
        currentPlan={planUsage?.plan}
      />
    </AppLayout>
  );
}
