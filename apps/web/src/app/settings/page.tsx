"use client";

import React, { useState, useEffect, useRef } from "react";
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
  Radio,
  Tooltip,
  Badge,
  Avatar,
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
  RobotOutlined,
  ClockCircleOutlined,
  PlusOutlined,
  EditOutlined,
  PictureOutlined,
  MessageOutlined,
  BulbOutlined,
  EyeOutlined,
  SendOutlined,
  CheckOutlined,
  LinkOutlined,
  WhatsAppOutlined,
} from "@ant-design/icons";
import { api } from "../../lib/api";
import { getSocket } from "../../lib/socket";
import { UpgradeModal } from "../../components/UpgradeModal";
import { CounterStandeeModal } from "../../components/CounterStandeeModal";
import { useAuth } from "../../context/AuthContext";

const { Title, Text, Paragraph } = Typography;

export interface AutoReplyCustomRule {
  id: string;
  name: string;
  keywords: string[];
  matchType: "contains" | "exact";
  replyText: string;
  imageUrl?: string;
  enabled: boolean;
}

export interface WorkingHoursConfig {
  enabled: boolean;
  openTime: string;
  closeTime: string;
  days: number[];
  awayMessage: string;
}

export interface FallbackReplyConfig {
  enabled: boolean;
  message: string;
}

const DEFAULT_SAMPLE_RULES: AutoReplyCustomRule[] = [
  {
    id: "sample_location",
    name: "Store Location & Address",
    keywords: ["location", "address", "map", "kahan hai", "dukaan kahan"],
    matchType: "contains",
    replyText: "Namaste! Hamari dukaan yahan sthit hai:\n📍 {store_name}, Main Market.\n📞 Sampark: {phone}\n\n🛍️ Digital Catalog: {catalog_link}",
    imageUrl: "",
    enabled: true,
  },
  {
    id: "sample_payment",
    name: "Payment & UPI QR Code",
    keywords: ["upi", "payment", "pay", "gpay", "phonepe", "paytm", "qr"],
    matchType: "contains",
    replyText: "Aap niche diye gaye UPI par payment kar sakte hain aur payment ka screenshot yahan bhej sakte hain. Thank you!",
    imageUrl: "",
    enabled: true,
  },
];

const DEFAULT_WORKING_HOURS: WorkingHoursConfig = {
  enabled: false,
  openTime: "09:00",
  closeTime: "21:00",
  days: [1, 2, 3, 4, 5, 6],
  awayMessage: "Namaste! Hamara store abhi closed hai. Hamare working hours subah 09:00 AM se raat 09:00 PM tak hain. Aap hamara digital catalog browse kar sakte hain: {catalog_link}",
};

const DEFAULT_FALLBACK_REPLY: FallbackReplyConfig = {
  enabled: false,
  message: "Namaste! 🙏 {store_name} me aapka swagat hai.\n\nAap niche diye gaye vikalpo me se chun sakte hain:\n1️⃣ *Catalog & Rates* dekhne ke liye reply karein: *\"catalog\"*\n2️⃣ *Order Status* janne ke liye reply karein: *\"status\"*\n3️⃣ *Store Address* ke liye reply karein: *\"address\"*\n\n🛒 Direct Online Order: {catalog_link}",
};

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
  const [ruleForm] = Form.useForm();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const savedQuickRepliesRef = useRef<Array<{ label: string; text: string }> | undefined>(undefined);
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [currentSlug, setCurrentSlug] = useState<string>("");
  const [standeeModalOpen, setStandeeModalOpen] = useState(false);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [planUsage, setPlanUsage] = useState<any>(null);

  // Auto-Reply Rules Engine State
  const [customRules, setCustomRules] = useState<AutoReplyCustomRule[]>(DEFAULT_SAMPLE_RULES);
  const [workingHours, setWorkingHours] = useState<WorkingHoursConfig>(DEFAULT_WORKING_HOURS);
  const [fallbackReply, setFallbackReply] = useState<FallbackReplyConfig>(DEFAULT_FALLBACK_REPLY);
  const [smartKeywordBot, setSmartKeywordBot] = useState<boolean>(true);
  const [autoReply, setAutoReply] = useState<boolean>(true);
  const [welcomeMessage, setWelcomeMessage] = useState<string>("Hello! Welcome to our store.");
  const [ruleModalOpen, setRuleModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<AutoReplyCustomRule | null>(null);
  const [ruleKeywordsInput, setRuleKeywordsInput] = useState("");
  const [savingAutoReply, setSavingAutoReply] = useState(false);

  // Live Simulator State
  const [simulatorInput, setSimulatorInput] = useState("");
  const [simulatorLogs, setSimulatorLogs] = useState<Array<{ fromUser: boolean; text: string; image?: string; time: string }>>([
    { fromUser: true, text: "location kahan hai?", time: "10:30 AM" },
    { fromUser: false, text: "Namaste! Hamari dukaan yahan sthit hai:\n📍 Main Market\n📞 Sampark: +91 9279259690\n\n🛍️ Digital Catalog: https://app.ginie.space/shop/demo", time: "10:30 AM" },
  ]);

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
        let parsedSettings: any = {
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

        if (parsedSettings.customRules && Array.isArray(parsedSettings.customRules)) {
          setCustomRules(parsedSettings.customRules);
        } else {
          setCustomRules(DEFAULT_SAMPLE_RULES);
        }

        if (parsedSettings.workingHours) {
          setWorkingHours({ ...DEFAULT_WORKING_HOURS, ...parsedSettings.workingHours });
        }

        if (parsedSettings.fallbackReply) {
          setFallbackReply({ ...DEFAULT_FALLBACK_REPLY, ...parsedSettings.fallbackReply });
        }

        if (parsedSettings.smartKeywordBot !== undefined) {
          setSmartKeywordBot(parsedSettings.smartKeywordBot !== false);
        } else {
          setSmartKeywordBot(true);
        }

        if (parsedSettings.autoReply !== undefined) {
          setAutoReply(parsedSettings.autoReply !== false);
        } else {
          setAutoReply(true);
        }

        if (parsedSettings.welcomeMessage) {
          setWelcomeMessage(parsedSettings.welcomeMessage);
        }

        if (parsedSettings.quickReplies) {
          savedQuickRepliesRef.current = parsedSettings.quickReplies;
        }
        if (parsedSettings.logoUrl) {
          setLogoPreview(parsedSettings.logoUrl);
        }

        const firstCoupon = Array.isArray(parsedSettings.coupons) ? parsedSettings.coupons[0] : null;
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
          autoReply: parsedSettings.autoReply !== false,
          smartKeywordBot: parsedSettings.smartKeywordBot !== false,
          dailySummaryEnabled: Boolean(parsedSettings.dailySummaryEnabled),
          welcomeMessage: parsedSettings.welcomeMessage || "Hello! Welcome to our store.",
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
  }, [user, form]);

  const handleConnect = async () => {
    try {
      setConnecting(true);
      const res = await api.post("/api/whatsapp/connect");
      if (res.data.session?.qrCode) {
        setQrCode(res.data.session.qrCode);
      }
      setQrModalVisible(true);
    } catch {
      message.error("Could not start WhatsApp connection");
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await api.post("/api/whatsapp/disconnect");
      setWaStatus("disconnected");
      setQrCode(null);
      message.info("WhatsApp disconnected");
    } catch {
      message.error("Could not disconnect");
    }
  };

  const handleChangePassword = async (values: any) => {
    try {
      setChangingPassword(true);
      await api.put("/api/auth/password", {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      message.success("Password changed successfully!");
      passwordForm.resetFields();
    } catch (err: any) {
      message.error(err.message || "Could not update password");
    } finally {
      setChangingPassword(false);
    }
  };

  const handleCreateStaff = async (values: any) => {
    try {
      setCreatingStaff(true);
      const res = await api.post("/api/settings/staff", values);
      message.success(res.data?.message || "Staff account created!");
      staffForm.resetFields();
      setStaffList((prev) => [res.data.staff, ...prev]);
      fetchPlanUsage();
    } catch (err: any) {
      if (err.response?.status === 403 && err.response?.data?.upgradeRequired) {
        setUpgradeModalOpen(true);
      } else {
        message.error(err.response?.data?.error || err.message || "Could not create staff account");
      }
    } finally {
      setCreatingStaff(false);
    }
  };

  const handleDeleteStaff = async (staffId: string) => {
    try {
      await api.delete(`/api/settings/staff/${staffId}`);
      message.success("Staff account removed");
      setStaffList((prev) => prev.filter((s) => s.id !== staffId));
      fetchPlanUsage();
    } catch (err: any) {
      message.error(err.message || "Could not remove staff account");
    }
  };

  // Save Settings Handler (combines Profile + Auto-Reply Rules)
  const handleSave = async (values: any) => {
    try {
      setSaving(true);
      const cleanCoupon = String(values.couponCode || "").trim().toUpperCase();
      const pct = Math.min(90, Math.max(0, Number(values.couponPercent) || 0));
      const coupons = cleanCoupon && pct > 0 ? [{ code: cleanCoupon, discountPercent: pct }] : [];

      const settingsJson = JSON.stringify({
        autoReply: autoReply !== false,
        welcomeMessage: (welcomeMessage || "Hello! Welcome to our store.").trim(),
        smartKeywordBot: smartKeywordBot !== false,
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
        customRules,
        workingHours,
        fallbackReply,
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
      message.success("Settings & Auto-Reply Rules saved successfully!");
    } catch (err: any) {
      message.error(err.message || "Failed to update settings");
    } finally {
      setSaving(false);
    }
  };

  // Dedicated Auto-Reply Saver
  const handleSaveAutoReplyOnly = async (
    updatedRules?: AutoReplyCustomRule[],
    updatedWh?: WorkingHoursConfig,
    updatedFb?: FallbackReplyConfig,
    updatedSmartBot?: boolean,
    updatedAutoReply?: boolean,
    updatedWelcomeMsg?: string
  ) => {
    try {
      setSavingAutoReply(true);
      const bRes = await api.get("/api/settings");
      const currentBiz = bRes.data.business || {};
      let existingSettings: any = {};
      if (currentBiz.settingsJson) {
        try {
          existingSettings = JSON.parse(currentBiz.settingsJson);
        } catch {}
      }

      const nextRules = updatedRules !== undefined ? updatedRules : customRules;
      const nextWh = updatedWh !== undefined ? updatedWh : workingHours;
      const nextFb = updatedFb !== undefined ? updatedFb : fallbackReply;
      const nextSmartBot = updatedSmartBot !== undefined ? updatedSmartBot : smartKeywordBot;
      const nextAutoReply = updatedAutoReply !== undefined ? updatedAutoReply : autoReply;
      const nextWelcomeMsg = updatedWelcomeMsg !== undefined ? updatedWelcomeMsg : welcomeMessage;

      const mergedSettings = {
        ...existingSettings,
        autoReply: nextAutoReply !== false,
        welcomeMessage: (nextWelcomeMsg || "Hello! Welcome to our store.").trim(),
        smartKeywordBot: nextSmartBot !== false,
        customRules: nextRules,
        workingHours: nextWh,
        fallbackReply: nextFb,
      };

      await api.put("/api/settings/business", {
        name: currentBiz.name,
        businessType: currentBiz.businessType,
        phone: currentBiz.phone,
        address: currentBiz.address,
        slug: currentBiz.slug,
        settingsJson: JSON.stringify(mergedSettings),
      });

      message.success("WhatsApp Auto-Reply & Bot Rules updated successfully!");
    } catch (err: any) {
      message.error(err.message || "Failed to save auto-reply rules");
    } finally {
      setSavingAutoReply(false);
    }
  };

  // Add or Edit Rule Modal Handlers
  const handleOpenAddRuleModal = () => {
    setEditingRule(null);
    setRuleKeywordsInput("");
    ruleForm.resetFields();
    ruleForm.setFieldsValue({
      name: "",
      keywords: "",
      matchType: "contains",
      replyText: "",
      imageUrl: "",
      enabled: true,
    });
    setRuleModalOpen(true);
  };

  const handleOpenEditRuleModal = (rule: AutoReplyCustomRule) => {
    setEditingRule(rule);
    setRuleKeywordsInput(rule.keywords.join(", "));
    ruleForm.setFieldsValue({
      name: rule.name,
      keywords: rule.keywords.join(", "),
      matchType: rule.matchType || "contains",
      replyText: rule.replyText,
      imageUrl: rule.imageUrl || "",
      enabled: rule.enabled !== false,
    });
    setRuleModalOpen(true);
  };

  const handleSaveRuleModal = () => {
    ruleForm.validateFields().then((vals) => {
      const parsedKeywords = String(vals.keywords || "")
        .split(",")
        .map((k) => k.trim().toLowerCase())
        .filter(Boolean);

      if (parsedKeywords.length === 0) {
        message.warning("Kam se kam ek keyword enter karein (e.g. address, upi)");
        return;
      }

      let nextRules: AutoReplyCustomRule[];
      if (editingRule) {
        nextRules = customRules.map((r) =>
          r.id === editingRule.id
            ? {
                ...r,
                name: vals.name.trim(),
                keywords: parsedKeywords,
                matchType: vals.matchType,
                replyText: vals.replyText.trim(),
                imageUrl: vals.imageUrl?.trim() || "",
                enabled: vals.enabled !== false,
              }
            : r
        );
      } else {
        const newRule: AutoReplyCustomRule = {
          id: `rule_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          name: vals.name.trim(),
          keywords: parsedKeywords,
          matchType: vals.matchType,
          replyText: vals.replyText.trim(),
          imageUrl: vals.imageUrl?.trim() || "",
          enabled: vals.enabled !== false,
        };
        nextRules = [...customRules, newRule];
      }

      setCustomRules(nextRules);
      setRuleModalOpen(false);
      handleSaveAutoReplyOnly(nextRules);
    });
  };

  const handleDeleteRule = (ruleId: string) => {
    const nextRules = customRules.filter((r) => r.id !== ruleId);
    setCustomRules(nextRules);
    handleSaveAutoReplyOnly(nextRules);
  };

  const handleToggleRuleStatus = (ruleId: string, enabled: boolean) => {
    const nextRules = customRules.map((r) => (r.id === ruleId ? { ...r, enabled } : r));
    setCustomRules(nextRules);
    handleSaveAutoReplyOnly(nextRules);
  };

  // Bot Simulator Handler
  const handleSimulateMessage = (textToTest: string) => {
    if (!textToTest.trim()) return;
    const q = textToTest.trim().toLowerCase();
    const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const newLogs = [...simulatorLogs, { fromUser: true, text: textToTest.trim(), time: timeStr }];

    let matchedReply: { text: string; image?: string } | null = null;
    const storeName = form.getFieldValue("name") || "Our Store";
    const storeLink = `https://app.ginie.space/shop/${currentSlug || user?.id || "demo"}`;
    const phone = form.getFieldValue("phone") || "+91 9279259690";

    // 1. Custom Rules check
    const active = customRules.filter((r) => r.enabled !== false && r.keywords?.length > 0 && r.replyText);
    for (const rule of active) {
      let match = false;
      for (const rawKw of rule.keywords) {
        const kw = String(rawKw || "").trim().toLowerCase();
        if (!kw) continue;
        if (rule.matchType === "exact") {
          if (q === kw) {
            match = true;
            break;
          }
        } else {
          if (q.includes(kw)) {
            match = true;
            break;
          }
        }
      }

      if (match) {
        matchedReply = {
          text: String(rule.replyText)
            .replace(/\{store_name\}/gi, storeName)
            .replace(/\{catalog_link\}/gi, storeLink)
            .replace(/\{phone\}/gi, phone),
          image: rule.imageUrl || undefined,
        };
        break;
      }
    }

    // 2. Working Hours check
    if (!matchedReply && workingHours.enabled) {
      matchedReply = {
        text: `🌙 *${storeName}*\n${workingHours.awayMessage.replace(/\{catalog_link\}/gi, storeLink)}`,
      };
    }

    // 3. Smart Catalog check
    if (!matchedReply && smartKeywordBot && /\b(catalog|menu|price|rate|items|products|list)\b/.test(q)) {
      matchedReply = {
        text: `📋 *${storeName} Price List & Offerings*\n\n• Sample Special Product — ₹250 / pcs\n• Premium Offering — ₹499 / pack\n\n🛒 *Full Catalog & Online Booking:* ${storeLink}`,
      };
    }

    // 4. Default / Welcome check
    if (!matchedReply) {
      if (fallbackReply.enabled && fallbackReply.message) {
        matchedReply = {
          text: fallbackReply.message.replace(/\{store_name\}/gi, storeName).replace(/\{catalog_link\}/gi, storeLink),
        };
      } else if (autoReply) {
        const welcomeText = (welcomeMessage || "Hello! Welcome to our store.").trim();
        matchedReply = {
          text: `${welcomeText}\n\n🛍️ *Browse Catalog & Order Online:* ${storeLink}\n💡 Tip: Reply *"catalog"* for price list.`,
        };
      }
    }

    if (matchedReply) {
      newLogs.push({
        fromUser: false,
        text: matchedReply.text,
        image: matchedReply.image,
        time: timeStr,
      });
    }

    setSimulatorLogs(newLogs);
    setSimulatorInput("");
  };

  return (
    <AppLayout>
      <div style={{ marginBottom: 20 }}>
        <Title level={4} style={{ margin: 0, fontWeight: 800 }}>Business Profile &amp; Settings</Title>
        <Text type="secondary">Manage your store WhatsApp connection, automated bot rules, and business profile</Text>
      </div>

      <Row gutter={[20, 20]}>
        {/* LEFT COLUMN: Store Profile & Public Info */}
        <Col xs={24} lg={14}>
          <Card
            title={
              <Space>
                <ShopOutlined style={{ color: "#25D366" }} />
                <span>Business Details &amp; Catalog</span>
              </Space>
            }
            style={{ borderRadius: 12, marginBottom: 20 }}
          >
            <Form form={form} layout="vertical" onFinish={handleSave}>
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="name"
                    label="Business Name"
                    rules={[{ required: true, message: "Please enter your business name" }]}
                  >
                    <Input placeholder="e.g. Acme Retail" />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item name="businessType" label="Business Category / Industry" rules={[{ required: true }]}>
                    <Select
                      onChange={(val) => {
                        form.setFieldsValue({ businessType: val });
                      }}
                      options={[
                        { label: "🛒 Retail Store & Kirana", value: "retail" },
                        { label: "👗 Garments, Boutique & Fashion", value: "garments" },
                        { label: "🍽️ Restaurant, Cafe & Kitchen", value: "restaurant" },
                        { label: "🏨 Hotel, Homestay & Lodge", value: "hotel" },
                        { label: "📦 Wholesale & Bulk B2B", value: "wholesale" },
                        { label: "🛠️ Services & Appointments", value: "services" },
                      ]}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <div style={{ padding: "14px 18px", background: "#f8fafc", borderRadius: 8, border: "1px solid #e2e8f0", marginBottom: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                  <div>
                    <div style={{ fontWeight: 600, color: "#1e293b", fontSize: 14 }}>
                      🔍 B2B Lead Discovery (Google Places Search)
                    </div>
                    <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                      {user?.role === "admin" || user?.leadsEnabled
                        ? "Active — Granted by Platform Admin. 'Find New Leads' is unlocked on your sidebar and dashboard."
                        : "Disabled by default. B2B Lead Discovery is an exclusive wholesale feature governed exclusively by Platform Admin."}
                    </div>
                  </div>
                  {user?.role === "admin" || user?.leadsEnabled ? (
                    <Tag color="green" style={{ padding: "4px 10px", fontSize: 12, fontWeight: 600 }}>
                      ✓ ACTIVE (ADMIN GRANTED)
                    </Tag>
                  ) : (
                    <a
                      href={`https://wa.me/917488825824?text=${encodeURIComponent(
                        `Namaste GinieSpace Admin! Please activate B2B Leads Discovery for my account: ${user?.email || ""}`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button size="small" type="primary" icon={<WhatsAppOutlined />} style={{ background: "#25D366", borderColor: "#25D366", fontWeight: 600 }}>
                        Request Activation on WhatsApp
                      </Button>
                    </a>
                  )}
                </div>
              </div>

              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="phone"
                    label="WhatsApp Business Phone"
                    rules={[{ required: true, message: "Please enter your WhatsApp phone number" }]}
                  >
                    <Input placeholder="e.g. +91 98765 43210" />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    name="upiId"
                    label="Merchant UPI ID (for Invoices &amp; QR)"
                    extra="Included on WhatsApp Bills, Storefront Checkout &amp; UPI QR"
                  >
                    <Input placeholder="e.g. yourstore@ybl or paytmqr...@paytm" />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item name="address" label="Physical Store Address">
                <Input.TextArea rows={2} placeholder="e.g. Shop #4, Main Market, MG Road, New Delhi" />
              </Form.Item>

              {user?.id && (
                <Card size="small" style={{ marginBottom: 16, background: "#f0fdf4", borderColor: "#bbf7d0" }}>
                  <Space direction="vertical" size={6} style={{ width: "100%" }}>
                    <Text strong style={{ color: "#15803d" }}>
                      <ShopOutlined /> Your Public Digital Storefront Link
                    </Text>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                      <Tag color="green" style={{ fontSize: 13, padding: "4px 8px" }}>
                        https://app.ginie.space/shop/{currentSlug || user.id}
                      </Tag>
                      <Button
                        size="small"
                        icon={<CopyOutlined />}
                        onClick={() => {
                          const url = `https://app.ginie.space/shop/${currentSlug || user.id}`;
                          navigator.clipboard.writeText(url);
                          message.success("Store link copied!");
                        }}
                      >
                        Copy
                      </Button>
                      <a href={`/shop/${currentSlug || user.id}`} target="_blank" rel="noopener noreferrer">
                        <Button size="small" type="link">Open Store</Button>
                      </a>
                      <Button
                        size="small"
                        icon={<QrcodeOutlined />}
                        onClick={() => setStandeeModalOpen(true)}
                        style={{ borderColor: "#059669", color: "#065f46", fontWeight: 600 }}
                      >
                        Print Counter Standee
                      </Button>
                    </div>
                  </Space>
                </Card>
              )}

              <Form.Item
                name="slug"
                label="Custom Storefront URL Slug"
                extra="Create a branded short link (e.g. entering 'mydukaan' gives app.ginie.space/shop/mydukaan)"
              >
                <Input addonBefore="app.ginie.space/shop/" placeholder="e.g. modern-store" />
              </Form.Item>

              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item name="gstin" label="GSTIN (Optional)">
                    <Input placeholder="e.g. 07AAAAA0000A1Z5" maxLength={15} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name="deliveryFee" label="Flat Delivery Fee (₹)">
                    <Input type="number" min={0} placeholder="0 for Free Delivery" />
                  </Form.Item>
                </Col>
              </Row>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, background: "#f8fafc", padding: "10px 14px", borderRadius: 8 }}>
                <div>
                  <Text strong>Store Open / Closed Toggle</Text>
                  <div style={{ fontSize: 12, color: "#64748b" }}>Mark closed during holidays or renovations</div>
                </div>
                <Form.Item name="isOpen" valuePropName="checked" noStyle>
                  <Switch checkedChildren="Open" unCheckedChildren="Closed" />
                </Form.Item>
              </div>

              <Form.Item style={{ marginTop: 20 }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<SaveOutlined />}
                  loading={saving}
                  size="large"
                  style={{ background: "#25D366", borderColor: "#25D366", fontWeight: 600, width: "100%" }}
                >
                  Save Business Details
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        {/* RIGHT COLUMN: WhatsApp Connection, Security, Staff */}
        <Col xs={24} lg={10}>
          {/* WhatsApp Connection Card */}
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
              Apne business ka WhatsApp link karein taaki aap Live Inbox me customers ko direct message aur automated bills bhej sakein.
            </Paragraph>

            <div style={{ marginBottom: 16 }}>
              <Text type="secondary" style={{ display: "block", marginBottom: 6 }}>Connection Status:</Text>
              {waStatus === "connected" ? (
                <Tag icon={<CheckCircleOutlined />} color="success" style={{ padding: "5px 12px", fontSize: 13 }}>
                  Connected {waPhone ? `(+${waPhone})` : ""}
                </Tag>
              ) : waStatus === "connecting" ? (
                <Tag icon={<SyncOutlined spin />} color="warning" style={{ padding: "5px 12px", fontSize: 13 }}>
                  Connecting... Scan QR Code
                </Tag>
              ) : (
                <Tag icon={<CloseCircleOutlined />} color="error" style={{ padding: "5px 12px", fontSize: 13 }}>
                  Disconnected
                </Tag>
              )}
            </div>

            <Space wrap>
              {waStatus === "connected" ? (
                <Popconfirm
                  title="Disconnect your WhatsApp?"
                  description="Aapke WhatsApp se live messaging pause ho jayegi."
                  onConfirm={handleDisconnect}
                  okText="Yes, Disconnect"
                  cancelText="Cancel"
                  okButtonProps={{ danger: true }}
                >
                  <Button danger>Disconnect WhatsApp</Button>
                </Popconfirm>
              ) : (
                <Button
                  type="primary"
                  icon={<QrcodeOutlined />}
                  loading={connecting}
                  onClick={handleConnect}
                  style={{ background: "#25D366", borderColor: "#25D366", fontWeight: 600 }}
                >
                  Link My WhatsApp
                </Button>
              )}

              {waStatus === "connecting" && (
                <Button onClick={() => setQrModalVisible(true)} icon={<QrcodeOutlined />}>
                  View QR Code
                </Button>
              )}
            </Space>
          </Card>

          {/* Platform Access: 100% Free Forever */}
          <Card
            title={
              <Space>
                <CheckCircleOutlined style={{ color: "#16a34a" }} />
                <span>Plan &amp; Platform Access</span>
              </Space>
            }
            style={{ borderRadius: 12, marginBottom: 20 }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <Text strong>Account Status:</Text>
              <Tag color="green" style={{ fontWeight: 700, padding: "2px 10px", fontSize: 12, borderRadius: 6 }}>
                100% FREE LIFETIME
              </Tag>
            </div>
            <div style={{ background: "#f0fdf4", borderRadius: 8, padding: "10px 14px", border: "1px solid #bbf7d0", fontSize: 13, color: "#15803d", lineHeight: 1.5 }}>
              All features are permanently unlocked for your store with <strong>₹0 platform fees</strong>, <strong>0% payment commission</strong>, and <strong>unlimited catalog &amp; staff</strong>.
            </div>
          </Card>

          {/* Change Password Card */}
          <Card
            title={
              <Space>
                <LockOutlined style={{ color: "#1677ff" }} />
                <span>Security &amp; Password</span>
              </Space>
            }
            style={{ borderRadius: 12, marginBottom: 20 }}
          >
            <Form form={passwordForm} layout="vertical" onFinish={handleChangePassword}>
              <Form.Item name="currentPassword" label="Current Password" rules={[{ required: true }]}>
                <Input.Password placeholder="Enter current password" />
              </Form.Item>
              <Form.Item name="newPassword" label="New Password" rules={[{ required: true, min: 6 }]}>
                <Input.Password placeholder="Min 6 characters" />
              </Form.Item>
              <Button type="primary" htmlType="submit" loading={changingPassword}>
                Change Password
              </Button>
            </Form>
          </Card>
        </Col>

        {/* ======================================================== */}
        {/* FULL-WIDTH DEDICATED SECTION: WHATSAPP AUTO-REPLY HUB */}
        {/* ======================================================== */}
        <Col xs={24}>
          <div id="autoreply">
            <Card
              title={
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, width: "100%" }}>
                  <Space size={8}>
                    <RobotOutlined style={{ color: "#25D366", fontSize: 22 }} />
                    <span style={{ fontWeight: 800, fontSize: 16 }}>WhatsApp Auto-Reply &amp; Smart Bot Rule Center</span>
                    <Badge count={customRules.filter((r) => r.enabled).length} style={{ backgroundColor: "#25D366" }} />
                  </Space>
                  <Space size={8}>
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={handleOpenAddRuleModal}
                      style={{ background: "#25D366", borderColor: "#25D366", fontWeight: 600 }}
                    >
                      Add Custom Rule
                    </Button>
                    <Button
                      icon={<SaveOutlined />}
                      loading={savingAutoReply}
                      onClick={() => handleSaveAutoReplyOnly()}
                    >
                      Save Bot Rules
                    </Button>
                  </Space>
                </div>
              }
              styles={{ body: { padding: 20 } }}
              style={{ borderRadius: 12, marginBottom: 24, border: "2px solid #bbf7d0", boxShadow: "0 4px 12px rgba(37,211,102,0.06)" }}
            >
              <Row gutter={[24, 24]}>
                {/* RULES BUILDER & SETTINGS (Left 15 cols) */}
                <Col xs={24} xl={15}>
                  {/* Subsection 1: Custom Keyword Rules Table */}
                  <div style={{ marginBottom: 24 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                      <div>
                        <Text strong style={{ fontSize: 15, color: "#0f172a" }}>
                          🎯 Custom Keyword Auto-Responder Rules
                        </Text>
                        <Text type="secondary" style={{ display: "block", fontSize: 12 }}>
                          Jab bhi customer in keywords ko bhejega, bot automatically aapka custom message ya photo bhej dega.
                        </Text>
                      </div>
                    </div>

                    <Table
                      dataSource={customRules}
                      rowKey="id"
                      pagination={false}
                      scroll={{ x: 650 }}
                      size="small"
                      columns={[
                        {
                          title: "Rule Name",
                          key: "name",
                          render: (_: any, r: AutoReplyCustomRule) => (
                            <div>
                              <Text strong>{r.name}</Text>
                              <div>
                                <Tag color={r.matchType === "exact" ? "purple" : "blue"} style={{ fontSize: 10, margin: 0 }}>
                                  {r.matchType === "exact" ? "EXACT WORD" : "CONTAINS"}
                                </Tag>
                              </div>
                            </div>
                          ),
                        },
                        {
                          title: "Trigger Keywords",
                          key: "keywords",
                          render: (_: any, r: AutoReplyCustomRule) => (
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                              {r.keywords.map((kw, idx) => (
                                <Tag key={idx} color="geekblue" style={{ margin: 0, fontSize: 11 }}>
                                  {kw}
                                </Tag>
                              ))}
                            </div>
                          ),
                        },
                        {
                          title: "Auto-Reply Preview",
                          key: "replyText",
                          render: (_: any, r: AutoReplyCustomRule) => (
                            <div style={{ maxWidth: 220 }}>
                              <div style={{ fontSize: 12, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                {r.replyText}
                              </div>
                              {r.imageUrl && (
                                <Tag icon={<PictureOutlined />} color="green" style={{ fontSize: 10, marginTop: 2 }}>
                                  Photo Attached
                                </Tag>
                              )}
                            </div>
                          ),
                        },
                        {
                          title: "Status",
                          key: "status",
                          align: "center",
                          render: (_: any, r: AutoReplyCustomRule) => (
                            <Switch
                              size="small"
                              checked={r.enabled !== false}
                              onChange={(chk) => handleToggleRuleStatus(r.id, chk)}
                            />
                          ),
                        },
                        {
                          title: "Actions",
                          key: "actions",
                          align: "right",
                          render: (_: any, r: AutoReplyCustomRule) => (
                            <Space size={4}>
                              <Tooltip title="Edit Rule">
                                <Button
                                  size="small"
                                  icon={<EditOutlined />}
                                  onClick={() => handleOpenEditRuleModal(r)}
                                />
                              </Tooltip>
                              <Popconfirm
                                title="Delete this auto-reply rule?"
                                onConfirm={() => handleDeleteRule(r.id)}
                                okText="Delete"
                                okButtonProps={{ danger: true }}
                              >
                                <Button size="small" danger icon={<DeleteOutlined />} />
                              </Popconfirm>
                            </Space>
                          ),
                        },
                      ]}
                    />
                  </div>

                  <Divider style={{ margin: "20px 0" }} />

                  {/* Subsection 2: Business Working Hours & Away Responder */}
                  <div style={{ marginBottom: 24, background: "#f8fafc", padding: 16, borderRadius: 10, border: "1px solid #e2e8f0" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                      <div>
                        <Text strong style={{ fontSize: 14 }}>
                          <ClockCircleOutlined style={{ color: "#3b82f6", marginRight: 6 }} />
                          Business Working Hours &amp; Off-Hours Away Responder
                        </Text>
                        <Text type="secondary" style={{ display: "block", fontSize: 12 }}>
                          Working hours ke baad message karne wale customers ko automatically store closed notice bhejein.
                        </Text>
                      </div>
                      <Switch
                        checked={workingHours.enabled}
                        onChange={(chk) => {
                          const nextWh = { ...workingHours, enabled: chk };
                          setWorkingHours(nextWh);
                        }}
                      />
                    </div>

                    {workingHours.enabled && (
                      <div style={{ marginTop: 14 }}>
                        <Row gutter={12} style={{ marginBottom: 12 }}>
                          <Col xs={12} sm={6}>
                            <Text style={{ fontSize: 12, display: "block", marginBottom: 4 }}>Opening Time:</Text>
                            <Select
                              value={workingHours.openTime}
                              onChange={(val) => setWorkingHours({ ...workingHours, openTime: val })}
                              style={{ width: "100%" }}
                              options={[
                                { label: "07:00 AM", value: "07:00" },
                                { label: "08:00 AM", value: "08:00" },
                                { label: "09:00 AM", value: "09:00" },
                                { label: "10:00 AM", value: "10:00" },
                                { label: "11:00 AM", value: "11:00" },
                              ]}
                            />
                          </Col>
                          <Col xs={12} sm={6}>
                            <Text style={{ fontSize: 12, display: "block", marginBottom: 4 }}>Closing Time:</Text>
                            <Select
                              value={workingHours.closeTime}
                              onChange={(val) => setWorkingHours({ ...workingHours, closeTime: val })}
                              style={{ width: "100%" }}
                              options={[
                                { label: "06:00 PM", value: "18:00" },
                                { label: "07:00 PM", value: "19:00" },
                                { label: "08:00 PM", value: "20:00" },
                                { label: "09:00 PM", value: "21:00" },
                                { label: "10:00 PM", value: "22:00" },
                                { label: "11:00 PM", value: "23:00" },
                              ]}
                            />
                          </Col>
                          <Col xs={24} sm={12}>
                            <Text style={{ fontSize: 12, display: "block", marginBottom: 4 }}>Working Days:</Text>
                            <Checkbox.Group
                              value={workingHours.days}
                              onChange={(val: any) => setWorkingHours({ ...workingHours, days: val })}
                              options={[
                                { label: "Mon", value: 1 },
                                { label: "Tue", value: 2 },
                                { label: "Wed", value: 3 },
                                { label: "Thu", value: 4 },
                                { label: "Fri", value: 5 },
                                { label: "Sat", value: 6 },
                                { label: "Sun", value: 0 },
                              ]}
                            />
                          </Col>
                        </Row>

                        <Text style={{ fontSize: 12, display: "block", marginBottom: 4 }}>Off-Hours Automated Message:</Text>
                        <Input.TextArea
                          rows={2}
                          value={workingHours.awayMessage}
                          onChange={(e) => setWorkingHours({ ...workingHours, awayMessage: e.target.value })}
                        />
                      </div>
                    )}
                  </div>

                  {/* Subsection 3: Smart Built-In Bots & Fallback */}
                  <div style={{ background: "#f8fafc", padding: 16, borderRadius: 10, border: "1px solid #e2e8f0" }}>
                    <Text strong style={{ fontSize: 14, display: "block", marginBottom: 12 }}>
                      <BulbOutlined style={{ color: "#faad14", marginRight: 6 }} />
                      Smart Built-in Bots &amp; Navigation Menu
                    </Text>

                    <Row gutter={[16, 16]}>
                      <Col xs={24} md={12}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div>
                            <Text strong style={{ fontSize: 13 }}>Smart Catalog &amp; Rate List Bot</Text>
                            <div style={{ fontSize: 11, color: "#64748b" }}>Replies with products when asked for "price", "catalog", "menu"</div>
                          </div>
                          <Switch
                            checked={smartKeywordBot}
                            onChange={(chk) => setSmartKeywordBot(chk)}
                          />
                        </div>
                      </Col>

                      <Col xs={24} md={12}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div>
                            <Text strong style={{ fontSize: 13 }}>First-time Welcome Greeting</Text>
                            <div style={{ fontSize: 11, color: "#64748b" }}>Greeting on first contact (24h cooldown)</div>
                          </div>
                          <Switch
                            checked={autoReply}
                            onChange={(chk) => setAutoReply(chk)}
                          />
                        </div>
                        {autoReply && (
                          <div style={{ marginTop: 8 }}>
                            <Input.TextArea
                              rows={2}
                              value={welcomeMessage}
                              onChange={(e) => setWelcomeMessage(e.target.value)}
                              placeholder="Enter greeting message for new customers..."
                            />
                          </div>
                        )}
                      </Col>

                      <Col xs={24}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                          <div>
                            <Text strong style={{ fontSize: 13 }}>Fallback Navigation Menu</Text>
                            <div style={{ fontSize: 11, color: "#64748b" }}>Unknown query par menu option send karein</div>
                          </div>
                          <Switch
                            checked={fallbackReply.enabled}
                            onChange={(chk) => setFallbackReply({ ...fallbackReply, enabled: chk })}
                          />
                        </div>
                        {fallbackReply.enabled && (
                          <Input.TextArea
                            rows={3}
                            value={fallbackReply.message}
                            onChange={(e) => setFallbackReply({ ...fallbackReply, message: e.target.value })}
                            placeholder="Enter navigation menu options..."
                          />
                        )}
                      </Col>
                    </Row>
                  </div>
                </Col>

                {/* SIMULATOR & PHONE PREVIEW (Right 9 cols) */}
                <Col xs={24} xl={9}>
                  <Card
                    styles={{ body: { padding: 14 } }}
                    style={{
                      borderRadius: 14,
                      background: "#efeae2",
                      border: "1px solid #d1d5db",
                      boxShadow: "0 4px 14px rgba(0,0,0,0.06)",
                    }}
                  >
                    {/* Simulated Phone Header */}
                    <div
                      style={{
                        background: "#075e54",
                        color: "#fff",
                        padding: "10px 14px",
                        borderRadius: "10px 10px 0 0",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Space size={8}>
                        <Avatar style={{ backgroundColor: "#25D366" }} icon={<ShopOutlined />} />
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 13 }}>
                            {form.getFieldValue("name") || "My Store"}
                          </div>
                          <div style={{ fontSize: 10, color: "#a7f3d0" }}>Online · Automated Bot Active</div>
                        </div>
                      </Space>
                      <Tag color="success" style={{ margin: 0, fontSize: 10 }}>BOT LIVE</Tag>
                    </div>

                    {/* Simulated Message Stream */}
                    <div
                      style={{
                        padding: 12,
                        minHeight: 340,
                        maxHeight: 380,
                        overflowY: "auto",
                        backgroundImage: "radial-gradient(#e5ddd5 1px, transparent 1px)",
                        backgroundSize: "16px 16px",
                      }}
                    >
                      {simulatorLogs.map((log, idx) => (
                        <div
                          key={idx}
                          style={{
                            display: "flex",
                            justifyContent: log.fromUser ? "flex-end" : "flex-start",
                            marginBottom: 10,
                          }}
                        >
                          <div
                            style={{
                              maxWidth: "85%",
                              padding: "8px 12px",
                              borderRadius: 10,
                              background: log.fromUser ? "#dcf8c6" : "#ffffff",
                              boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
                              fontSize: 12,
                              color: "#1f2937",
                            }}
                          >
                            {!log.fromUser && (
                              <div style={{ fontSize: 10, fontWeight: 700, color: "#059669", marginBottom: 2 }}>
                                🤖 Auto-Reply
                              </div>
                            )}

                            {log.image && (
                              <div style={{ marginBottom: 4 }}>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={log.image} alt="Attachment" style={{ maxWidth: 160, maxHeight: 110, borderRadius: 6, display: "block" }} />
                              </div>
                            )}

                            <div style={{ whiteSpace: "pre-wrap" }}>{log.text}</div>
                            <div style={{ fontSize: 9, color: "#9ca3af", textAlign: "right", marginTop: 3 }}>
                              {log.time} {log.fromUser ? "✓✓" : ""}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Simulator Input Box */}
                    <div style={{ background: "#f0f2f5", padding: "8px 10px", borderRadius: "0 0 10px 10px", borderTop: "1px solid #e5e7eb" }}>
                      <Text type="secondary" style={{ fontSize: 11, display: "block", marginBottom: 4 }}>
                        💡 Try typing: <strong>location</strong>, <strong>upi</strong>, <strong>catalog</strong>, or <strong>hi</strong>:
                      </Text>
                      <Space.Compact style={{ width: "100%" }}>
                        <Input
                          placeholder="Type customer question to test bot..."
                          value={simulatorInput}
                          onChange={(e) => setSimulatorInput(e.target.value)}
                          onPressEnter={() => handleSimulateMessage(simulatorInput)}
                        />
                        <Button
                          type="primary"
                          icon={<SendOutlined />}
                          style={{ background: "#25D366", borderColor: "#25D366" }}
                          onClick={() => handleSimulateMessage(simulatorInput)}
                        >
                          Test
                        </Button>
                      </Space.Compact>
                    </div>
                  </Card>
                </Col>
              </Row>
            </Card>
          </div>
        </Col>
      </Row>

      {/* Modal: Create or Edit Auto-Reply Rule */}
      <Modal
        title={
          <Space>
            <RobotOutlined style={{ color: "#25D366" }} />
            <span>{editingRule ? "Edit Auto-Reply Rule" : "Create New WhatsApp Auto-Reply Rule"}</span>
          </Space>
        }
        open={ruleModalOpen}
        onCancel={() => setRuleModalOpen(false)}
        onOk={handleSaveRuleModal}
        okText="Save Rule"
        centered
        width={540}
      >
        <Form form={ruleForm} layout="vertical">
          <Form.Item
            name="name"
            label="Rule Name / Purpose"
            rules={[{ required: true, message: "Enter rule name (e.g. Store Location & Map)" }]}
          >
            <Input placeholder="e.g. Store Location, UPI Payment Details, Discount Offer" />
          </Form.Item>

          <Form.Item
            name="keywords"
            label="Trigger Keywords"
            extra="Comma-separated words that trigger this auto-reply (e.g. location, address, map, kahan hai)"
            rules={[{ required: true, message: "Enter at least one keyword" }]}
          >
            <Input
              placeholder="location, address, map, kahan hai, dukaan"
              value={ruleKeywordsInput}
              onChange={(e) => setRuleKeywordsInput(e.target.value)}
            />
          </Form.Item>

          <Form.Item name="matchType" label="Keyword Matching Mode" initialValue="contains">
            <Radio.Group>
              <Radio value="contains">
                <strong>Contains Keyword</strong> (Triggers if keyword is anywhere in message)
              </Radio>
              <Radio value="exact">
                <strong>Exact Match</strong> (Customer sends only this exact word)
              </Radio>
            </Radio.Group>
          </Form.Item>

          <Form.Item
            name="replyText"
            label="Automated Response Message"
            rules={[{ required: true, message: "Enter response text" }]}
            extra="Supports dynamic variables: {store_name}, {catalog_link}, {phone}"
          >
            <Input.TextArea
              rows={4}
              placeholder="Namaste! Hamari dukaan yahan sthit hai: {store_name}, Main Market. Catalog dekhein: {catalog_link}"
            />
          </Form.Item>

          <Form.Item
            name="imageUrl"
            label="Optional Photo Attachment URL"
            extra="Attach a public image (e.g. UPI QR code image, menu photo, or shop picture)"
          >
            <Input placeholder="https://example.com/upi-qr.jpg" prefix={<PictureOutlined />} allowClear />
          </Form.Item>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Text strong>Enable this rule immediately:</Text>
            <Form.Item name="enabled" valuePropName="checked" noStyle initialValue={true}>
              <Switch />
            </Form.Item>
          </div>
        </Form>
      </Modal>

      {/* QR Code Modal for Merchant WhatsApp */}
      <Modal
        title={
          <Space>
            <PhoneOutlined style={{ color: "#25D366" }} />
            <span>Link Your Store WhatsApp</span>
          </Space>
        }
        open={qrModalVisible}
        onCancel={() => setQrModalVisible(false)}
        footer={null}
        centered
        width={400}
      >
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <p style={{ color: "#595959", marginBottom: 20 }}>
            Open WhatsApp on your phone -&gt; Settings -&gt; <strong>Linked Devices</strong> -&gt; <strong>Link a Device</strong> and scan this QR code.
          </p>
          {qrCode ? (
            <div style={{ display: "inline-block", padding: 12, border: "2px solid #25D366", borderRadius: 12, background: "#fff" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrCode} alt="WhatsApp QR Code" style={{ width: 250, height: 250, display: "block" }} />
            </div>
          ) : (
            <div style={{ height: 250, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
              <Spin size="large" />
              <Text type="secondary">Generating secure QR code...</Text>
            </div>
          )}
          <div style={{ marginTop: 20 }}>
            <Button onClick={handleConnect} icon={<SyncOutlined />} loading={connecting}>
              Refresh QR Code
            </Button>
          </div>
        </div>
      </Modal>

      {/* Upgrade to Pro Modal */}
      <UpgradeModal
        open={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        currentPlan={planUsage?.plan || "free"}
      />

      <CounterStandeeModal
        open={standeeModalOpen}
        onClose={() => setStandeeModalOpen(false)}
        storeName={form.getFieldValue("name") || user?.name || "My Store"}
        storeSlug={currentSlug || user?.id || ""}
        upiId={form.getFieldValue("upiId") || ""}
        phone={form.getFieldValue("phone") || ""}
        address={form.getFieldValue("address") || ""}
        businessType={user?.businessType || "retail"}
      />
    </AppLayout>
  );
}
