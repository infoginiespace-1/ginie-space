"use client";

import React, { useState, useEffect, useMemo } from "react";
import { AppLayout } from "../../components/AppLayout";
import {
  Card,
  Table,
  Tag,
  Typography,
  message,
  Statistic,
  Row,
  Col,
  Tabs,
  Button,
  Modal,
  Space,
  Input,
  Form,
  Switch,
  Alert,
  Popconfirm,
  Spin,
  Divider,
  Select,
  Drawer,
  Badge,
  Tooltip,
  Dropdown,
  Radio,
  Progress,
  List,
  Grid,
} from "antd";
import {
  UserOutlined,
  ShopOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined,
  QrcodeOutlined,
  SendOutlined,
  PhoneOutlined,
  SafetyCertificateOutlined,
  BellOutlined,
  MessageOutlined,
  DownloadOutlined,
  EyeOutlined,
  KeyOutlined,
  DeleteOutlined,
  DisconnectOutlined,
  CrownOutlined,
  NotificationOutlined,
  HistoryOutlined,
  SearchOutlined,
  FilterOutlined,
  DashboardOutlined,
  ThunderboltOutlined,
  LinkOutlined,
  DollarOutlined,
  ShoppingOutlined,
  TeamOutlined,
  CheckOutlined,
  WhatsAppOutlined,
  CopyOutlined,
  LineChartOutlined,
  GlobalOutlined,
  RocketOutlined,
  RiseOutlined,
} from "@ant-design/icons";
import { api } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";
import { getSocket } from "../../lib/socket";
import { downloadCsv } from "../../lib/csv";
import { formatDisplayPhone } from "../../lib/phone";

const { Title, Text, Paragraph } = Typography;

export interface MerchantItem {
  id: string;
  name: string;
  email: string;
  role: "admin" | "user" | "staff";
  businessType: "retail" | "wholesale" | "services";
  status: "active" | "suspended";
  plan: "free" | "pro";
  ownerId?: string;
  createdAt: string;
  business: {
    name: string;
    phone: string;
    slug?: string;
    address?: string;
  };
  counts: {
    products: number;
    orders: number;
    customers: number;
    leads: number;
    staff: number;
    revenue: number;
  };
  whatsapp: {
    status: "disconnected" | "connecting" | "connected";
    phone?: string;
  };
}

export interface SupportMessage {
  id: string;
  messageId?: string;
  contactPhone: string;
  contactName?: string;
  text: string;
  fromMe: string | boolean;
  timestamp: string;
}

export interface AuditLog {
  id: string;
  adminEmail: string;
  action: string;
  details: string;
  timestamp: string;
}

export default function AdminPage() {
  const { user } = useAuth();
  const router = useRouter();

  const screens = Grid.useBreakpoint();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  const isMobile = mounted ? (screens.md === false || (typeof window !== "undefined" && window.innerWidth < 768)) : false;

  // Navigation
  const [activeTab, setActiveTab] = useState("overview");

  // Analytics & KPIs
  const [analytics, setAnalytics] = useState<any>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);

  // Merchants State
  const [merchants, setMerchants] = useState<MerchantItem[]>([]);
  const [loadingMerchants, setLoadingMerchants] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [planFilter, setPlanFilter] = useState<"all" | "free" | "pro">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "suspended">("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "retail" | "wholesale" | "services">("all");
  const [selectedMerchant, setSelectedMerchant] = useState<MerchantItem | null>(null);
  const [merchantDrawerOpen, setMerchantDrawerOpen] = useState(false);

  // User Actions State
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [resetPassModalUser, setResetPassModalUser] = useState<MerchantItem | null>(null);
  const [tempPassword, setTempPassword] = useState("");
  const [notifyOnWhatsApp, setNotifyOnWhatsApp] = useState(true);
  const [resettingPassword, setResettingPassword] = useState(false);

  // Official Support WhatsApp State
  const [supportStatus, setSupportStatus] = useState<"disconnected" | "connecting" | "connected">("disconnected");
  const [supportPhone, setSupportPhone] = useState<string>("919279259690");
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  // Notification Rules
  const [rules, setRules] = useState({
    newUserWelcome: true,
    orderPlacedAlert: true,
    leadConvertedAlert: true,
    supportAutoReply: true,
  });
  const [savingRules, setSavingRules] = useState(false);

  // Direct Test Form
  const [testForm] = Form.useForm();
  const [sendingTest, setSendingTest] = useState(false);

  // Broadcast State
  const [broadcastSegment, setBroadcastSegment] = useState<"all" | "free" | "pro" | "retail" | "wholesale" | "services">("all");
  const [broadcastText, setBroadcastText] = useState("");
  const [sendingBroadcast, setSendingBroadcast] = useState(false);

  // Platform Announcement State
  const [announcement, setAnnouncement] = useState({
    enabled: false,
    title: "Platform Notice",
    message: "",
    type: "info" as "info" | "warning" | "success" | "error",
  });
  const [savingAnnouncement, setSavingAnnouncement] = useState(false);

  // Support Queries / Smart Inbox State
  const [supportMessages, setSupportMessages] = useState<SupportMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [supportSearch, setSupportSearch] = useState("");
  const [needsReplyOnly, setNeedsReplyOnly] = useState(false);
  const [activeChatPhone, setActiveChatPhone] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  // Audit Logs
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loadingAuditLogs, setLoadingAuditLogs] = useState(false);

  // Backup Download State
  const [downloadingBackup, setDownloadingBackup] = useState(false);
  const [resettingRatchets, setResettingRatchets] = useState(false);

  // Subscriptions & PRO Upgrade Requests State
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loadingSubscriptions, setLoadingSubscriptions] = useState(false);
  const [subscriptionSearch, setSubscriptionSearch] = useState("");
  const [subscriptionFilter, setSubscriptionFilter] = useState<string>("all");
  const [approvingUserId, setApprovingUserId] = useState<string | null>(null);
  const [rejectingUserId, setRejectingUserId] = useState<string | null>(null);

  // Web Analytics & SEO State
  const [webAnalytics, setWebAnalytics] = useState<any>(null);
  const [loadingWebAnalytics, setLoadingWebAnalytics] = useState(false);
  const [savingSeo, setSavingSeo] = useState(false);
  const [seoForm] = Form.useForm();

  // Load All Data
  const loadAnalytics = async () => {
    try {
      setLoadingAnalytics(true);
      const res = await api.get("/api/admin/analytics");
      setAnalytics(res.data);
    } catch {
      // ignore
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const loadMerchants = async () => {
    try {
      setLoadingMerchants(true);
      const res = await api.get("/api/admin/merchants");
      setMerchants(res.data?.merchants || []);
    } catch {
      message.error("Could not load merchants");
    } finally {
      setLoadingMerchants(false);
    }
  };

  const loadSupportMessages = async () => {
    try {
      setLoadingMessages(true);
      const res = await api.get("/api/admin/whatsapp/messages");
      setSupportMessages(res.data?.messages || []);
    } catch {
      // ignore
    } finally {
      setLoadingMessages(false);
    }
  };

  const loadAnnouncement = async () => {
    try {
      const res = await api.get("/api/admin/announcement");
      if (res.data?.announcement) {
        setAnnouncement(res.data.announcement);
      }
    } catch {}
  };

  const loadAuditLogs = async () => {
    try {
      setLoadingAuditLogs(true);
      const res = await api.get("/api/admin/audit-logs");
      setAuditLogs(res.data?.logs || []);
    } catch {}
    finally {
      setLoadingAuditLogs(false);
    }
  };

  const loadSubscriptions = async () => {
    try {
      setLoadingSubscriptions(true);
      const res = await api.get("/api/admin/subscriptions");
      setSubscriptions(res.data?.subscriptions || []);
    } catch {
      // ignore
    } finally {
      setLoadingSubscriptions(false);
    }
  };

  const loadWebAnalytics = async () => {
    try {
      setLoadingWebAnalytics(true);
      const res = await api.get("/api/admin/web-analytics");
      setWebAnalytics(res.data);
      if (res.data?.seo) {
        seoForm.setFieldsValue({
          ga4MeasurementId: res.data.seo.ga4MeasurementId || "",
          googleSiteVerification: res.data.seo.googleSiteVerification || "",
          targetKeywords: res.data.seo.targetKeywords || "",
        });
      }
    } catch {
      // ignore
    } finally {
      setLoadingWebAnalytics(false);
    }
  };

  const handleSaveSeo = async (values: any) => {
    try {
      setSavingSeo(true);
      const res = await api.post("/api/admin/seo-settings", values);
      message.success(res.data?.message || "SEO & GA4 configuration saved!");
      loadWebAnalytics();
    } catch (err: any) {
      message.error(err.response?.data?.error || err.message || "Failed to save SEO settings");
    } finally {
      setSavingSeo(false);
    }
  };

  const handleApproveSubscription = async (userId: string, cycle: "monthly" | "yearly" = "monthly") => {
    try {
      setApprovingUserId(userId);
      const res = await api.post(`/api/admin/subscriptions/${userId}/approve`, { cycle });
      message.success(res.data?.message || "PRO Plan activated successfully!");
      loadSubscriptions();
      loadMerchants();
    } catch (err: any) {
      message.error(err.response?.data?.error || err.message || "Failed to approve subscription");
    } finally {
      setApprovingUserId(null);
    }
  };

  const handleRejectSubscription = async (userId: string) => {
    try {
      setRejectingUserId(userId);
      await api.post(`/api/admin/subscriptions/${userId}/reject`, { reason: "Payment UTR not verified" });
      message.info("Subscription request rejected.");
      loadSubscriptions();
      loadMerchants();
    } catch (err: any) {
      message.error(err.message || "Failed to reject subscription");
    } finally {
      setRejectingUserId(null);
    }
  };

  useEffect(() => {
    if (user && user.role !== "admin") {
      router.replace("/inbox");
      return;
    }

    loadAnalytics();
    loadMerchants();
    loadSubscriptions();
    loadSupportMessages();
    loadAnnouncement();
    loadAuditLogs();
    loadWebAnalytics();

    // Load Support WA Status
    api.get("/api/admin/whatsapp/status")
      .then((res) => {
        const s = res.data.session;
        setSupportStatus(s.status);
        if (s.phoneNumber) setSupportPhone(s.phoneNumber);
        if (s.qrCode) setQrCode(s.qrCode);
      })
      .catch(() => {});

    // Load Notification Rules
    api.get("/api/admin/whatsapp/rules")
      .then((res) => {
        if (res.data?.rules) setRules(res.data.rules);
      })
      .catch(() => {});

    // WebSockets
    const socket = getSocket();
    if (socket) {
      socket.on("admin:whatsapp:status", (data: any) => {
        setSupportStatus(data.status);
        if (data.phoneNumber) setSupportPhone(data.phoneNumber);
        if (data.status === "connected") {
          setQrModalVisible(false);
          setQrCode(null);
          message.success("Support WhatsApp (+91 9279259690) connected & synced to cloud!");
        }
      });

      socket.on("admin:whatsapp:qr", (data: any) => {
        setQrCode(data.qrCode);
        setSupportStatus("connecting");
        setQrModalVisible(true);
      });

      socket.on("admin:whatsapp:message", (event: any) => {
        setSupportMessages((prev) => {
          const id = event.messageId || `live_${Date.now()}`;
          if (prev.some((m) => m.messageId === id || m.id === id)) return prev;
          return [
            {
              id,
              messageId: id,
              contactPhone: event.contactPhone || "",
              contactName: event.senderName || event.contactPhone || "",
              text: event.messageText || "",
              fromMe: String(Boolean(event.fromMe)),
              timestamp: event.timestamp || new Date().toISOString(),
            },
            ...prev,
          ];
        });
      });
    }

    return () => {
      if (socket) {
        socket.off("admin:whatsapp:status");
        socket.off("admin:whatsapp:qr");
        socket.off("admin:whatsapp:message");
      }
    };
  }, [user, router]);

  // Support WhatsApp Connect / Disconnect
  const handleConnectSupport = async () => {
    try {
      setConnecting(true);
      const res = await api.post("/api/admin/whatsapp/connect");
      if (res.data.session?.qrCode) {
        setQrCode(res.data.session.qrCode);
      }
      setQrModalVisible(true);
    } catch (err: any) {
      message.error(err.response?.data?.error || err.message || "Failed to start support connection");
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnectSupport = async () => {
    try {
      setDisconnecting(true);
      await api.post("/api/admin/whatsapp/disconnect");
      setSupportStatus("disconnected");
      setQrCode(null);
      message.warning("Official Support WhatsApp disconnected and credentials cleared");
      loadAuditLogs();
    } catch (err: any) {
      message.error(err.response?.data?.error || err.message || "Failed to disconnect support WhatsApp");
    } finally {
      setDisconnecting(false);
    }
  };

  const handleResetRatchets = async () => {
    try {
      setResettingRatchets(true);
      await api.post("/api/admin/whatsapp/reset-ratchets");
      message.success("E2EE Contact ratchets reset cleanly! Fresh encryption keys active.");
      loadAuditLogs();
    } catch (err: any) {
      message.error(err.response?.data?.error || err.message || "Failed to reset ratchets");
    } finally {
      setResettingRatchets(false);
    }
  };

  // Direct Test Message
  const handleSendTest = async (values: any) => {
    try {
      setSendingTest(true);
      await api.post("/api/admin/whatsapp/send-test", {
        recipientPhone: values.phone,
        messageText: values.message,
      });
      message.success(`Test alert sent successfully to ${values.phone}!`);
      testForm.resetFields();
    } catch (err: any) {
      message.error(err.response?.data?.error || err.message || "Failed to send test message");
    } finally {
      setSendingTest(false);
    }
  };

  // Notification Rules Toggle
  const handleRuleToggle = async (ruleKey: string, checked: boolean) => {
    const updated = { ...rules, [ruleKey]: checked };
    setRules(updated);
    try {
      setSavingRules(true);
      await api.post("/api/admin/whatsapp/rules", { rules: updated });
      message.success("Notification setting saved");
    } catch {
      message.error("Failed to update notification setting");
    } finally {
      setSavingRules(false);
    }
  };

  // User Actions
  const handleUpdateMerchant = async (target: MerchantItem, patch: { status?: "active" | "suspended"; plan?: "free" | "pro"; businessType?: "retail" | "wholesale" | "services" }) => {
    try {
      setUpdatingUserId(target.id);
      const res = await api.put(`/api/admin/users/${target.id}`, patch);
      if (res.data?.user) {
        setMerchants((prev) =>
          prev.map((m) => (m.id === target.id ? { ...m, ...res.data.user } : m))
        );
        if (selectedMerchant?.id === target.id) {
          setSelectedMerchant((prev) => (prev ? { ...prev, ...res.data.user } : null));
        }
      }
      message.success(`Updated ${target.name}'s account`);
      loadAuditLogs();
      loadAnalytics();
    } catch (err: any) {
      message.error(err.message || "Could not update user account");
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleResetPassword = async () => {
    if (!resetPassModalUser) return;
    try {
      setResettingPassword(true);
      const res = await api.post(`/api/admin/users/${resetPassModalUser.id}/reset-password`, {
        newPassword: tempPassword.trim() || undefined,
        notifyWhatsApp: notifyOnWhatsApp,
      });
      message.success(res.data.message);
      if (res.data.temporaryPassword) {
        Modal.info({
          title: "Temporary Password Generated",
          content: (
            <div>
              <Paragraph>New password for <strong>{resetPassModalUser.email}</strong>:</Paragraph>
              <Input.TextArea readOnly value={res.data.temporaryPassword} rows={1} style={{ fontSize: 16, fontWeight: 700 }} />
              <Paragraph type="secondary" style={{ marginTop: 8 }}>
                {res.data.notifiedOnWhatsApp
                  ? "✅ This temporary password was sent to the user on WhatsApp."
                  : "Share this temporary password with the user so they can sign in."}
              </Paragraph>
            </div>
          ),
        });
      }
      setResetPassModalUser(null);
      setTempPassword("");
      loadAuditLogs();
    } catch (err: any) {
      message.error(err.message || "Failed to reset password");
    } finally {
      setResettingPassword(false);
    }
  };

  const handleDisconnectMerchantWhatsApp = async (target: MerchantItem) => {
    try {
      await api.post(`/api/admin/users/${target.id}/disconnect-whatsapp`);
      message.info(`WhatsApp session disconnected for ${target.name}`);
      setMerchants((prev) =>
        prev.map((m) => (m.id === target.id ? { ...m, whatsapp: { status: "disconnected" } } : m))
      );
      loadAuditLogs();
    } catch (err: any) {
      message.error(err.message || "Failed to disconnect WhatsApp");
    }
  };

  const handleDeleteUser = async (target: MerchantItem) => {
    try {
      await api.delete(`/api/admin/users/${target.id}`);
      message.success(`Account ${target.email} removed`);
      setMerchants((prev) => prev.filter((m) => m.id !== target.id));
      if (selectedMerchant?.id === target.id) {
        setMerchantDrawerOpen(false);
      }
      loadAuditLogs();
      loadAnalytics();
    } catch (err: any) {
      message.error(err.message || "Could not delete user account");
    }
  };

  const handleSendProPitch = async (target: MerchantItem) => {
    try {
      const res = await api.post(`/api/admin/users/${target.id}/send-pro-pitch`);
      message.success(res.data.message);
      loadSupportMessages();
    } catch (err: any) {
      message.error(err.message || "Could not send Pro upgrade message");
    }
  };

  // Broadcast Handler
  const handleSendBroadcast = async () => {
    if (!broadcastText.trim()) {
      message.warning("Please enter broadcast message content");
      return;
    }
    try {
      setSendingBroadcast(true);
      const res = await api.post("/api/admin/whatsapp/broadcast", {
        segment: broadcastSegment,
        messageText: broadcastText.trim(),
      });
      message.success(res.data.message);
      setBroadcastText("");
      loadAuditLogs();
      loadSupportMessages();
    } catch (err: any) {
      message.error(err.message || "Failed to send broadcast");
    } finally {
      setSendingBroadcast(false);
    }
  };

  // Announcement Handler
  const handleSaveAnnouncement = async () => {
    try {
      setSavingAnnouncement(true);
      const res = await api.post("/api/admin/announcement", announcement);
      message.success(res.data.message);
      loadAuditLogs();
    } catch (err: any) {
      message.error(err.message || "Failed to save announcement");
    } finally {
      setSavingAnnouncement(false);
    }
  };

  // Full Backup Download
  const handleDownloadBackup = async () => {
    try {
      setDownloadingBackup(true);
      const res = await api.get("/api/admin/backup");
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `giniespace-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      message.success("Full platform JSON backup downloaded!");
    } catch (err: any) {
      message.error(err.message || "Failed to export backup");
    } finally {
      setDownloadingBackup(false);
    }
  };

  // Export Merchants CSV
  const handleExportMerchantsCSV = () => {
    if (merchants.length === 0) {
      message.info("No merchants to export");
      return;
    }
    const headers = [
      "User ID",
      "Owner Name",
      "Email",
      "Role",
      "Business Type",
      "Store Name",
      "Phone",
      "Plan",
      "Status",
      "Orders Count",
      "Total Revenue (INR)",
      "Products Count",
      "Customers Count",
      "Leads Count",
      "Joined Date",
    ];
    const rows = filteredMerchants.map((m) => [
      m.id,
      m.name,
      m.email,
      m.role,
      m.businessType,
      m.business?.name || "",
      m.business?.phone || "",
      m.plan,
      m.status,
      m.counts?.orders || 0,
      m.counts?.revenue || 0,
      m.counts?.products || 0,
      m.counts?.customers || 0,
      m.counts?.leads || 0,
      m.createdAt ? new Date(m.createdAt).toLocaleDateString() : "",
    ]);
    downloadCsv(`giniespace-merchants-${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
    message.success("Merchants list exported as CSV!");
  };

  // Filtered Merchants
  const filteredMerchants = useMemo(() => {
    return merchants.filter((m) => {
      if (planFilter !== "all" && m.plan !== planFilter) return false;
      if (statusFilter !== "all" && m.status !== statusFilter) return false;
      if (typeFilter !== "all" && m.businessType !== typeFilter) return false;

      if (!searchTerm.trim()) return true;
      const q = searchTerm.toLowerCase().trim();
      return (
        m.name?.toLowerCase().includes(q) ||
        m.email?.toLowerCase().includes(q) ||
        m.business?.name?.toLowerCase().includes(q) ||
        m.business?.phone?.includes(q) ||
        m.business?.slug?.toLowerCase().includes(q)
      );
    });
  }, [merchants, searchTerm, planFilter, statusFilter, typeFilter]);

  // Target count for selected broadcast segment
  const broadcastTargetCount = useMemo(() => {
    const targets = merchants.filter((m) => m.role !== "staff" && m.status !== "suspended");
    if (broadcastSegment === "free") return targets.filter((m) => m.plan === "free").length;
    if (broadcastSegment === "pro") return targets.filter((m) => m.plan === "pro").length;
    if (broadcastSegment === "retail" || broadcastSegment === "wholesale" || broadcastSegment === "services") {
      return targets.filter((m) => m.businessType === broadcastSegment).length;
    }
    return targets.length;
  }, [merchants, broadcastSegment]);

  // Grouped Support Conversations (1 thread per phone number)
  const conversationThreads = useMemo(() => {
    const threadMap: Record<string, { phone: string; name: string; messages: SupportMessage[] }> = {};
    for (const msg of supportMessages) {
      const phone = msg.contactPhone || "unknown";
      if (!threadMap[phone]) {
        threadMap[phone] = {
          phone,
          name: msg.contactName || `+${phone}`,
          messages: [],
        };
      }
      threadMap[phone].messages.push(msg);
    }

    const threads = Object.values(threadMap).map((t) => {
      const sorted = [...t.messages].sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      const latest = sorted[0];
      const isOut = latest?.fromMe === "true" || latest?.fromMe === true;
      return {
        phone: t.phone,
        name: t.name,
        latestText: latest?.text || "",
        latestTimestamp: latest?.timestamp || "",
        lastFromMe: isOut,
        messageCount: t.messages.length,
        messages: sorted,
      };
    });

    threads.sort((a, b) => new Date(b.latestTimestamp).getTime() - new Date(a.latestTimestamp).getTime());

    return threads.filter((t) => {
      if (needsReplyOnly && t.lastFromMe) return false;
      if (!supportSearch.trim()) return true;
      const q = supportSearch.toLowerCase().trim();
      return t.phone.includes(q) || t.name.toLowerCase().includes(q) || t.latestText.toLowerCase().includes(q);
    });
  }, [supportMessages, needsReplyOnly, supportSearch]);

  const activeThread = useMemo(() => {
    if (!activeChatPhone) return null;
    return conversationThreads.find((t) => t.phone === activeChatPhone) || null;
  }, [conversationThreads, activeChatPhone]);

  // Canned Quick Reply Templates
  const CANNED_REPLIES = [
    {
      title: "Store Setup Help",
      text: "Namaste! GinieSpace support team me aapka swagat hai. Aapka online storefront setup karne me hum aapki madad kar sakte hain. Aapka kya query hai?",
    },
    {
      title: "WhatsApp QR Link Guide",
      text: "WhatsApp link karne ke liye: WhatsApp open karein $\\rightarrow$ Settings / 3-dots $\\rightarrow$ 'Linked Devices' $\\rightarrow$ 'Link a Device' par click karein aur dashboard par dikh rahe QR code ko scan karein.",
    },
    {
      title: "PRO Plan Upgrade Details",
      text: "GinieSpace PRO plan me aapko Unlimited Catalog, Unlimited Leads Finder, 10 Staff Accounts aur Bulk WhatsApp alerts milte hain. Upgrade ke liye UPI ID: info.giniespace@okaxis par ₹499 pay karke screenshot bhej sakte hain.",
    },
    {
      title: "Order Processed Update",
      text: "Aapka order receive ho gaya hai aur store owner ise dispatch ke liye ready kar rahe hain. Kisi bhi sahayata ke liye aap hume yahan text kar sakte hain.",
    },
  ];

  return (
    <AppLayout>
      <div style={{ marginBottom: isMobile ? 14 : 20, display: "flex", justifyContent: "space-between", alignItems: isMobile ? "flex-start" : "center", flexWrap: "wrap", gap: 10 }}>
        <div>
          <Title level={isMobile ? 5 : 4} style={{ margin: 0, fontWeight: 800 }}>Platform Administration</Title>
          <Text type="secondary" style={{ fontSize: isMobile ? 12 : 14 }}>
            {isMobile ? "Live central admin & monitoring hub" : "Central management for merchant workspaces, analytics, WhatsApp engine, and support operations"}
          </Text>
        </div>
        <Space size="small" wrap>
          <Button
            size={isMobile ? "small" : "middle"}
            icon={<DownloadOutlined />}
            loading={downloadingBackup}
            onClick={handleDownloadBackup}
          >
            {isMobile ? "Backup" : "Full Backup (JSON)"}
          </Button>
          <Button
            type="primary"
            size={isMobile ? "small" : "middle"}
            icon={<SyncOutlined />}
            onClick={() => {
              loadAnalytics();
              loadMerchants();
              loadSupportMessages();
              loadAuditLogs();
              loadSubscriptions();
            }}
          >
            {isMobile ? "Sync" : "Refresh Data"}
          </Button>
        </Space>
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        tabBarStyle={{ overflowX: "auto", whiteSpace: "nowrap" }}
        items={[
          // TAB 1: PLATFORM OVERVIEW (Analytics & KPIs)
          {
            key: "overview",
            label: (
              <span>
                <DashboardOutlined /> {isMobile ? "Overview" : "Platform Overview"}
              </span>
            ),
            children: (
              <div>
                {loadingAnalytics ? (
                  <div style={{ textAlign: "center", padding: "60px 0" }}>
                    <Spin size="large" />
                  </div>
                ) : (
                  <div>
                    {/* Top KPI Cards (2x2 on Mobile) */}
                    <Row gutter={isMobile ? [10, 10] : [16, 16]} style={{ marginBottom: isMobile ? 16 : 24 }}>
                      <Col xs={12} sm={12} lg={6}>
                        <Card
                          styles={{ body: { padding: isMobile ? "12px 14px" : "20px" } }}
                          style={{ borderRadius: 12, background: "linear-gradient(135deg, #10b981 0%, #059669 100%)", color: "#fff" }}
                        >
                          <Statistic
                            title={<span style={{ color: "rgba(255,255,255,0.85)", fontSize: isMobile ? 11 : 14 }}>Total GMV</span>}
                            value={analytics?.overview?.totalRevenue || 0}
                            precision={0}
                            prefix={<DollarOutlined style={{ color: "#fff", fontSize: isMobile ? 14 : 18 }} />}
                            formatter={(val) => `₹${Number(val).toLocaleString("en-IN")}`}
                            valueStyle={{ color: "#fff", fontWeight: 700, fontSize: isMobile ? 17 : 24 }}
                          />
                          <Text style={{ color: "rgba(255,255,255,0.9)", fontSize: isMobile ? 10 : 12, display: "block", marginTop: 4 }}>
                            {analytics?.overview?.totalOrders || 0} orders
                          </Text>
                        </Card>
                      </Col>

                      <Col xs={12} sm={12} lg={6}>
                        <Card
                          styles={{ body: { padding: isMobile ? "12px 14px" : "20px" } }}
                          style={{ borderRadius: 12, background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)", color: "#fff" }}
                        >
                          <Statistic
                            title={<span style={{ color: "rgba(255,255,255,0.85)", fontSize: isMobile ? 11 : 14 }}>Active Businesses</span>}
                            value={analytics?.overview?.totalMerchants || 0}
                            prefix={<ShopOutlined style={{ color: "#fff", fontSize: isMobile ? 14 : 18 }} />}
                            valueStyle={{ color: "#fff", fontWeight: 700, fontSize: isMobile ? 17 : 24 }}
                          />
                          <Text style={{ color: "rgba(255,255,255,0.9)", fontSize: isMobile ? 10 : 12, display: "block", marginTop: 4 }}>
                            +{analytics?.overview?.totalStaff || 0} staff
                          </Text>
                        </Card>
                      </Col>

                      <Col xs={12} sm={12} lg={6}>
                        <Card
                          styles={{ body: { padding: isMobile ? "12px 14px" : "20px" } }}
                          style={{ borderRadius: 12, background: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)", color: "#fff" }}
                        >
                          <Statistic
                            title={<span style={{ color: "rgba(255,255,255,0.85)", fontSize: isMobile ? 11 : 14 }}>WA Sessions</span>}
                            value={analytics?.overview?.activeWhatsAppSessions || 0}
                            prefix={<PhoneOutlined style={{ color: "#fff", fontSize: isMobile ? 14 : 18 }} />}
                            valueStyle={{ color: "#fff", fontWeight: 700, fontSize: isMobile ? 17 : 24 }}
                          />
                          <Text style={{ color: "rgba(255,255,255,0.9)", fontSize: isMobile ? 10 : 12, display: "block", marginTop: 4 }}>
                            Bot: {supportStatus === "connected" ? "LIVE" : "OFF"}
                          </Text>
                        </Card>
                      </Col>

                      <Col xs={12} sm={12} lg={6}>
                        <Card
                          styles={{ body: { padding: isMobile ? "12px 14px" : "20px" } }}
                          style={{ borderRadius: 12, background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)", color: "#fff" }}
                        >
                          <Statistic
                            title={<span style={{ color: "rgba(255,255,255,0.85)", fontSize: isMobile ? 11 : 14 }}>Catalog &amp; Leads</span>}
                            value={(analytics?.overview?.totalProducts || 0) + (analytics?.overview?.totalLeads || 0)}
                            prefix={<ThunderboltOutlined style={{ color: "#fff", fontSize: isMobile ? 14 : 18 }} />}
                            valueStyle={{ color: "#fff", fontWeight: 700, fontSize: isMobile ? 17 : 24 }}
                          />
                          <Text style={{ color: "rgba(255,255,255,0.9)", fontSize: isMobile ? 10 : 12, display: "block", marginTop: 4 }}>
                            {analytics?.overview?.totalProducts || 0} p | {analytics?.overview?.totalLeads || 0} l
                          </Text>
                        </Card>
                      </Col>
                    </Row>

                    {/* Breakdown & Leaderboard */}
                    <Row gutter={isMobile ? [12, 12] : [20, 20]} style={{ marginBottom: isMobile ? 16 : 24 }}>
                      <Col xs={24} lg={12}>
                        <Card title="Business Mode & Plan Distribution" style={{ borderRadius: 12, height: "100%" }}>
                          <div style={{ marginBottom: 16 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                              <Text strong>Retail Stores ({analytics?.overview?.businessTypeBreakdown?.retail || 0})</Text>
                              <Text type="secondary">
                                {Math.round(((analytics?.overview?.businessTypeBreakdown?.retail || 0) / Math.max(1, analytics?.overview?.totalMerchants || 1)) * 100)}%
                              </Text>
                            </div>
                            <Progress percent={Math.round(((analytics?.overview?.businessTypeBreakdown?.retail || 0) / Math.max(1, analytics?.overview?.totalMerchants || 1)) * 100)} strokeColor="#10b981" />
                          </div>

                          <div style={{ marginBottom: 16 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                              <Text strong>Wholesale Hubs ({analytics?.overview?.businessTypeBreakdown?.wholesale || 0})</Text>
                              <Text type="secondary">
                                {Math.round(((analytics?.overview?.businessTypeBreakdown?.wholesale || 0) / Math.max(1, analytics?.overview?.totalMerchants || 1)) * 100)}%
                              </Text>
                            </div>
                            <Progress percent={Math.round(((analytics?.overview?.businessTypeBreakdown?.wholesale || 0) / Math.max(1, analytics?.overview?.totalMerchants || 1)) * 100)} strokeColor="#3b82f6" />
                          </div>

                          <div style={{ marginBottom: 20 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                              <Text strong>Services & Appointments ({analytics?.overview?.businessTypeBreakdown?.services || 0})</Text>
                              <Text type="secondary">
                                {Math.round(((analytics?.overview?.businessTypeBreakdown?.services || 0) / Math.max(1, analytics?.overview?.totalMerchants || 1)) * 100)}%
                              </Text>
                            </div>
                            <Progress percent={Math.round(((analytics?.overview?.businessTypeBreakdown?.services || 0) / Math.max(1, analytics?.overview?.totalMerchants || 1)) * 100)} strokeColor="#8b5cf6" />
                          </div>

                          <Divider style={{ margin: "16px 0" }} />

                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div>
                              <Text type="secondary">Free vs Pro Subscribers</Text>
                              <div>
                                <Tag color="gold" style={{ fontSize: 13, padding: "2px 8px" }}>
                                  PRO: {analytics?.overview?.planBreakdown?.pro || 0}
                                </Tag>
                                <Tag color="default" style={{ fontSize: 13, padding: "2px 8px" }}>
                                  FREE: {analytics?.overview?.planBreakdown?.free || 0}
                                </Tag>
                              </div>
                            </div>
                            <Button size="small" type="primary" onClick={() => setActiveTab("merchants")}>
                              Manage Users
                            </Button>
                          </div>
                        </Card>
                      </Col>

                      <Col xs={24} lg={12}>
                        <Card title="Top Performing Businesses" style={{ borderRadius: 12, height: "100%" }}>
                          <Table
                            dataSource={analytics?.topMerchants || []}
                            rowKey="id"
                            pagination={false}
                            size="small"
                            scroll={{ x: 420 }}
                            columns={[
                              {
                                title: "Store & Owner",
                                key: "store",
                                render: (_: any, r: any) => (
                                  <div>
                                    <Text strong>{r.businessName}</Text>
                                    <div style={{ fontSize: 11, color: "#8c8c8c" }}>{r.name} ({r.email})</div>
                                  </div>
                                ),
                              },
                              {
                                title: "Mode",
                                dataIndex: "businessType",
                                key: "mode",
                                render: (t: string) => (
                                  <Tag color={t === "wholesale" ? "blue" : t === "services" ? "purple" : "green"}>
                                    {t?.toUpperCase()}
                                  </Tag>
                                ),
                              },
                              {
                                title: "Orders",
                                dataIndex: "orders",
                                key: "orders",
                                align: "center",
                              },
                              {
                                title: "Revenue",
                                dataIndex: "revenue",
                                key: "revenue",
                                align: "right",
                                render: (rev: number) => <Text strong style={{ color: "#10b981" }}>₹{Number(rev || 0).toLocaleString("en-IN")}</Text>,
                              },
                            ]}
                          />
                        </Card>
                      </Col>
                    </Row>

                    {/* System Status Card */}
                    <Card style={{ borderRadius: 12 }}>
                      <Row gutter={[16, 16]} align="middle">
                        <Col xs={24} md={8}>
                          <Space>
                            <Badge status="processing" color="#10b981" />
                            <Text strong>API & WebSocket Server Status:</Text>
                            <Tag color="success">HEALTHY & OPERATIONAL</Tag>
                          </Space>
                        </Col>
                        <Col xs={24} md={8}>
                          <Text type="secondary">Process Uptime: </Text>
                          <Text strong>{Math.floor((analytics?.systemHealth?.uptimeSeconds || 0) / 3600)}h {Math.floor(((analytics?.systemHealth?.uptimeSeconds || 0) % 3600) / 60)}m</Text>
                        </Col>
                        <Col xs={24} md={8} style={{ textAlign: "right" }}>
                          <Text type="secondary">Last Sync: {analytics?.systemHealth?.timestamp ? new Date(analytics.systemHealth.timestamp).toLocaleTimeString() : "Live"}</Text>
                        </Col>
                      </Row>
                    </Card>
                  </div>
                )}
              </div>
            ),
          },

          // TAB 2: MERCHANTS & USERS (360° Management)
          {
            key: "merchants",
            label: (
              <span>
                <UserOutlined /> {isMobile ? "Merchants" : "Merchants & Workspaces"} ({filteredMerchants.length})
              </span>
            ),
            children: (
              <div>
                {/* Search & Filters */}
                <Card styles={{ body: { padding: isMobile ? 12 : 20 } }} style={{ marginBottom: 16, borderRadius: 12 }}>
                  <Row gutter={isMobile ? [8, 8] : [16, 12]} align="middle">
                    <Col xs={24} md={8}>
                      <Input
                        placeholder="Search merchant, store, phone..."
                        prefix={<SearchOutlined style={{ color: "#8c8c8c" }} />}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        allowClear
                      />
                    </Col>
                    <Col xs={12} md={4}>
                      <Select
                        style={{ width: "100%" }}
                        value={planFilter}
                        onChange={setPlanFilter}
                        options={[
                          { value: "all", label: "All Plans" },
                          { value: "free", label: "FREE Plan" },
                          { value: "pro", label: "PRO Plan" },
                        ]}
                      />
                    </Col>
                    <Col xs={12} md={4}>
                      <Select
                        style={{ width: "100%" }}
                        value={typeFilter}
                        onChange={setTypeFilter}
                        options={[
                          { value: "all", label: "All Modes" },
                          { value: "retail", label: "Retail" },
                          { value: "wholesale", label: "Wholesale" },
                          { value: "services", label: "Services" },
                        ]}
                      />
                    </Col>
                    <Col xs={12} md={4}>
                      <Select
                        style={{ width: "100%" }}
                        value={statusFilter}
                        onChange={setStatusFilter}
                        options={[
                          { value: "all", label: "All Status" },
                          { value: "active", label: "Active" },
                          { value: "suspended", label: "Suspended" },
                        ]}
                      />
                    </Col>
                    <Col xs={12} md={4}>
                      <Button block={isMobile} icon={<DownloadOutlined />} onClick={handleExportMerchantsCSV}>
                        Export CSV
                      </Button>
                    </Col>
                  </Row>
                </Card>

                {/* Merchants View: Mobile Cards or Desktop Table */}
                {isMobile ? (
                  <List
                    dataSource={filteredMerchants}
                    loading={loadingMerchants}
                    pagination={{ pageSize: 8, size: "small", align: "center" }}
                    locale={{ emptyText: "No merchants found matching filters." }}
                    renderItem={(r: MerchantItem) => (
                      <Card
                        key={r.id}
                        styles={{ body: { padding: "14px" } }}
                        style={{ marginBottom: 12, borderRadius: 12, border: "1px solid #e2e8f0", background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8, gap: 8 }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 700, fontSize: 15, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {r.business?.name || r.name}
                            </div>
                            <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                              {r.name} ({r.email})
                            </div>
                          </div>
                          <div style={{ display: "flex", gap: 4, flexWrap: "wrap", justifyContent: "flex-end" }}>
                            <Tag color={r.plan === "pro" ? "gold" : "default"} style={{ margin: 0, fontWeight: 700 }}>
                              {r.plan === "pro" ? "👑 PRO" : "FREE"}
                            </Tag>
                            <Tag color={r.status === "suspended" ? "red" : "green"} style={{ margin: 0 }}>
                              {r.status?.toUpperCase()}
                            </Tag>
                          </div>
                        </div>

                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
                          <Tag color={r.businessType === "wholesale" ? "blue" : r.businessType === "services" ? "purple" : "green"} style={{ margin: 0 }}>
                            {r.businessType?.toUpperCase()}
                          </Tag>
                          {r.whatsapp?.status === "connected" ? (
                            <Tag icon={<CheckCircleOutlined />} color="success" style={{ margin: 0 }}>WA LINKED</Tag>
                          ) : (
                            <Tag color="default" style={{ margin: 0 }}>WA OFFLINE</Tag>
                          )}
                          {r.role === "admin" && <Tag color="purple" style={{ margin: 0 }}>ADMIN</Tag>}
                          {r.role === "staff" && <Tag color="cyan" style={{ margin: 0 }}>STAFF</Tag>}
                        </div>

                        {r.business?.phone && (
                          <div style={{ marginBottom: 10, display: "flex", alignItems: "center", justifyContent: "space-between", background: "#f8fafc", padding: "8px 10px", borderRadius: 8 }}>
                            <span style={{ fontSize: 12, color: "#047857", fontWeight: 700 }}>
                              📱 {formatDisplayPhone(r.business.phone)}
                            </span>
                            <a
                              href={`https://wa.me/${r.business.phone.replace(/\D/g, "")}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ fontSize: 12, color: "#25D366", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}
                            >
                              <WhatsAppOutlined /> WhatsApp Chat
                            </a>
                          </div>
                        )}

                        <div style={{ fontSize: 12, color: "#475569", marginBottom: 12, display: "flex", justifyContent: "space-between", borderTop: "1px dashed #e2e8f0", paddingTop: 8 }}>
                          <span>📦 {r.counts?.products || 0} items | 🛒 {r.counts?.orders || 0} orders</span>
                          <span style={{ color: "#10b981", fontWeight: 700 }}>₹{Number(r.counts?.revenue || 0).toLocaleString("en-IN")}</span>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                          <Button
                            icon={<EyeOutlined />}
                            onClick={() => {
                              setSelectedMerchant(r);
                              setMerchantDrawerOpen(true);
                            }}
                            style={{ height: 38, fontWeight: 600 }}
                          >
                            360° Profile
                          </Button>

                          <Dropdown
                            trigger={["click"]}
                            menu={{
                              items: [
                                {
                                  key: "plan-toggle",
                                  label: r.plan === "pro" ? "Downgrade to FREE" : "Upgrade to PRO",
                                  icon: <CrownOutlined style={{ color: "#f59e0b" }} />,
                                  onClick: () => handleUpdateMerchant(r, { plan: r.plan === "pro" ? "free" : "pro" }),
                                },
                                {
                                  key: "pro-pitch",
                                  label: "Send Pro Offer on WhatsApp",
                                  icon: <CrownOutlined style={{ color: "#f59e0b" }} />,
                                  disabled: r.plan === "pro" || !r.business?.phone,
                                  onClick: () => handleSendProPitch(r),
                                },
                                {
                                  key: "reset-pass",
                                  label: "Reset Password",
                                  icon: <KeyOutlined />,
                                  onClick: () => {
                                    setResetPassModalUser(r);
                                    setTempPassword("");
                                  },
                                },
                                {
                                  key: "disconnect-wa",
                                  label: "Force Disconnect WhatsApp",
                                  icon: <DisconnectOutlined style={{ color: "#ff4d4f" }} />,
                                  disabled: r.whatsapp?.status === "disconnected",
                                  onClick: () => handleDisconnectMerchantWhatsApp(r),
                                },
                                { type: "divider" },
                                {
                                  key: "toggle-status",
                                  label: r.status === "suspended" ? "Reactivate Account" : "Suspend Account",
                                  danger: r.status !== "suspended",
                                  disabled: r.role === "admin",
                                  onClick: () => handleUpdateMerchant(r, { status: r.status === "suspended" ? "active" : "suspended" }),
                                },
                                {
                                  key: "delete-user",
                                  label: "Delete User",
                                  danger: true,
                                  disabled: r.role === "admin",
                                  onClick: () => {
                                    Modal.confirm({
                                      title: `Delete ${r.name}'s account?`,
                                      content: `Are you sure you want to delete ${r.email}? This cannot be undone.`,
                                      okText: "Delete Account",
                                      okButtonProps: { danger: true },
                                      onOk: () => handleDeleteUser(r),
                                    });
                                  },
                                },
                              ],
                            }}
                          >
                            <Button type="primary" style={{ height: 38, background: "#0f172a", borderColor: "#0f172a" }}>
                              Manage ▾
                            </Button>
                          </Dropdown>
                        </div>
                      </Card>
                    )}
                  />
                ) : (
                  <Card style={{ borderRadius: 12 }}>
                    <Table
                      dataSource={filteredMerchants}
                      rowKey="id"
                      loading={loadingMerchants}
                      scroll={{ x: 1050 }}
                      pagination={{ pageSize: 10, showTotal: (total) => `Total ${total} merchants` }}
                      columns={[
                        {
                          title: "Merchant / Owner",
                          key: "merchant",
                          render: (_: any, r: MerchantItem) => (
                            <div>
                              <Text strong>{r.name}</Text>
                              <div style={{ fontSize: 12, color: "#595959" }}>{r.email}</div>
                              {r.business?.phone && (
                                <div style={{ fontSize: 11, color: "#047857", fontWeight: 600 }}>
                                  📞 {formatDisplayPhone(r.business.phone)}
                                </div>
                              )}
                            </div>
                          ),
                        },
                        {
                          title: "Storefront",
                          key: "store",
                          render: (_: any, r: MerchantItem) => (
                            <div>
                              <div style={{ fontWeight: 600 }}>{r.business?.name || "No Store Name"}</div>
                              <Tag color={r.businessType === "wholesale" ? "blue" : r.businessType === "services" ? "purple" : "green"}>
                                {r.businessType?.toUpperCase()}
                              </Tag>
                              {r.role === "admin" && <Tag color="purple">ADMIN</Tag>}
                              {r.role === "staff" && <Tag color="cyan">STAFF</Tag>}
                            </div>
                          ),
                        },
                        {
                          title: "Plan",
                          key: "plan",
                          render: (_: any, r: MerchantItem) => (
                            <Select
                              size="small"
                              value={r.plan || "free"}
                              style={{ width: 88 }}
                              loading={updatingUserId === r.id}
                              onChange={(val) => handleUpdateMerchant(r, { plan: val as "free" | "pro" })}
                              options={[
                                { value: "free", label: "FREE" },
                                { value: "pro", label: "PRO" },
                              ]}
                            />
                          ),
                        },
                        {
                          title: "WA Status",
                          key: "waStatus",
                          render: (_: any, r: MerchantItem) => {
                            const status = r.whatsapp?.status;
                            return status === "connected" ? (
                              <Tag icon={<CheckCircleOutlined />} color="success">LINKED</Tag>
                            ) : status === "connecting" ? (
                              <Tag icon={<SyncOutlined spin />} color="warning">SCANNING</Tag>
                            ) : (
                              <Tag color="default">OFFLINE</Tag>
                            );
                          },
                        },
                        {
                          title: "Usage & Activity",
                          key: "activity",
                          render: (_: any, r: MerchantItem) => (
                            <div style={{ fontSize: 12 }}>
                              <div>📦 {r.counts?.products || 0} items | 🛒 {r.counts?.orders || 0} orders</div>
                              <div style={{ color: "#10b981", fontWeight: 600 }}>
                                ₹{Number(r.counts?.revenue || 0).toLocaleString("en-IN")} sales
                              </div>
                            </div>
                          ),
                        },
                        {
                          title: "Status",
                          key: "status",
                          render: (_: any, r: MerchantItem) => {
                            const isSuspended = r.status === "suspended";
                            return (
                              <Tag color={isSuspended ? "red" : "green"}>
                                {isSuspended ? "SUSPENDED" : "ACTIVE"}
                              </Tag>
                            );
                          },
                        },
                        {
                          title: "Actions",
                          key: "actions",
                          align: "right",
                          render: (_: any, r: MerchantItem) => (
                            <Space size="small">
                              <Tooltip title="View 360° Profile & Stats">
                                <Button
                                  size="small"
                                  icon={<EyeOutlined />}
                                  onClick={() => {
                                    setSelectedMerchant(r);
                                    setMerchantDrawerOpen(true);
                                  }}
                                />
                              </Tooltip>

                              <Dropdown
                                menu={{
                                  items: [
                                    {
                                      key: "pro-pitch",
                                      label: "Send Pro Upgrade on WhatsApp",
                                      icon: <CrownOutlined style={{ color: "#f59e0b" }} />,
                                      disabled: r.plan === "pro" || !r.business?.phone,
                                      onClick: () => handleSendProPitch(r),
                                    },
                                    {
                                      key: "reset-pass",
                                      label: "Reset Password",
                                      icon: <KeyOutlined />,
                                      onClick: () => {
                                        setResetPassModalUser(r);
                                        setTempPassword("");
                                      },
                                    },
                                    {
                                      key: "disconnect-wa",
                                      label: "Force Disconnect WhatsApp",
                                      icon: <DisconnectOutlined style={{ color: "#ff4d4f" }} />,
                                      disabled: r.whatsapp?.status === "disconnected",
                                      onClick: () => handleDisconnectMerchantWhatsApp(r),
                                    },
                                    {
                                      type: "divider",
                                    },
                                    {
                                      key: "toggle-status",
                                      label: r.status === "suspended" ? "Reactivate Account" : "Suspend Account",
                                      danger: r.status !== "suspended",
                                      disabled: r.role === "admin",
                                      onClick: () => handleUpdateMerchant(r, { status: r.status === "suspended" ? "active" : "suspended" }),
                                    },
                                    {
                                      key: "delete-user",
                                      label: "Delete User",
                                      danger: true,
                                      disabled: r.role === "admin",
                                      onClick: () => {
                                        Modal.confirm({
                                          title: `Delete ${r.name}'s account?`,
                                          content: `Are you sure you want to delete ${r.email}? This cannot be undone.`,
                                          okText: "Delete Account",
                                          okButtonProps: { danger: true },
                                          onOk: () => handleDeleteUser(r),
                                        });
                                      },
                                    },
                                  ],
                                }}
                              >
                                <Button size="small">Manage ▾</Button>
                              </Dropdown>
                            </Space>
                          ),
                        },
                      ]}
                    />
                  </Card>
                )}
              </div>
            ),
          },

          // TAB 3: SUBSCRIPTIONS & PRO UPGRADES (₹99 MRR)
          {
            key: "subscriptions",
            label: (
              <span>
                <CrownOutlined style={{ color: "#d97706" }} /> {isMobile ? "Subs" : "Subscriptions & Revenue"}
                {subscriptions.filter((s) => s.subscriptionStatus === "pending").length > 0 && (
                  <Badge
                    count={subscriptions.filter((s) => s.subscriptionStatus === "pending").length}
                    style={{ marginLeft: 6, backgroundColor: "#f59e0b" }}
                  />
                )}
              </span>
            ),
            children: (
              <div>
                {/* Revenue & Subscription KPIs (2x2 on Mobile) */}
                <Row gutter={isMobile ? [10, 10] : [16, 16]} style={{ marginBottom: isMobile ? 16 : 20 }}>
                  <Col xs={12} sm={12} lg={6}>
                    <Card
                      styles={{ body: { padding: isMobile ? "12px 14px" : "20px" } }}
                      style={{ borderRadius: 12, background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)", color: "#fff" }}
                    >
                      <Statistic
                        title={<span style={{ color: "rgba(255,255,255,0.85)", fontSize: isMobile ? 11 : 14 }}>Active PRO</span>}
                        value={subscriptions.filter((s) => s.plan === "pro").length}
                        prefix={<CrownOutlined style={{ color: "#fff", fontSize: isMobile ? 14 : 18 }} />}
                        valueStyle={{ color: "#fff", fontWeight: 700, fontSize: isMobile ? 18 : 24 }}
                      />
                      <Text style={{ color: "rgba(255,255,255,0.9)", fontSize: isMobile ? 10 : 12, display: "block", marginTop: 4 }}>
                        Paid PRO active
                      </Text>
                    </Card>
                  </Col>

                  <Col xs={12} sm={12} lg={6}>
                    <Card
                      styles={{ body: { padding: isMobile ? "12px 14px" : "20px" } }}
                      style={{ borderRadius: 12, background: subscriptions.filter((s) => s.subscriptionStatus === "pending").length > 0 ? "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)" : "linear-gradient(135deg, #10b981 0%, #059669 100%)", color: "#fff" }}
                    >
                      <Statistic
                        title={<span style={{ color: "rgba(255,255,255,0.85)", fontSize: isMobile ? 11 : 14 }}>Pending UTR</span>}
                        value={subscriptions.filter((s) => s.subscriptionStatus === "pending").length}
                        prefix={<CheckCircleOutlined style={{ color: "#fff", fontSize: isMobile ? 14 : 18 }} />}
                        valueStyle={{ color: "#fff", fontWeight: 700, fontSize: isMobile ? 18 : 24 }}
                      />
                      <Text style={{ color: "rgba(255,255,255,0.9)", fontSize: isMobile ? 10 : 12, display: "block", marginTop: 4 }}>
                        {subscriptions.filter((s) => s.subscriptionStatus === "pending").length > 0 ? "Needs approval" : "All verified"}
                      </Text>
                    </Card>
                  </Col>

                  <Col xs={12} sm={12} lg={6}>
                    <Card
                      styles={{ body: { padding: isMobile ? "12px 14px" : "20px" } }}
                      style={{ borderRadius: 12, background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)", color: "#fff" }}
                    >
                      <Statistic
                        title={<span style={{ color: "rgba(255,255,255,0.85)", fontSize: isMobile ? 11 : 14 }}>MRR Run Rate</span>}
                        value={subscriptions.filter((s) => s.plan === "pro").length * 99}
                        precision={0}
                        prefix={<DollarOutlined style={{ color: "#fff", fontSize: isMobile ? 14 : 18 }} />}
                        formatter={(val) => `₹${Number(val).toLocaleString("en-IN")}`}
                        valueStyle={{ color: "#fff", fontWeight: 700, fontSize: isMobile ? 18 : 24 }}
                      />
                      <Text style={{ color: "rgba(255,255,255,0.9)", fontSize: isMobile ? 10 : 12, display: "block", marginTop: 4 }}>
                        ₹99/mo per sub
                      </Text>
                    </Card>
                  </Col>

                  <Col xs={12} sm={12} lg={6}>
                    <Card
                      styles={{ body: { padding: isMobile ? "12px 14px" : "20px" } }}
                      style={{ borderRadius: 12, background: "linear-gradient(135deg, #64748b 0%, #475569 100%)", color: "#fff" }}
                    >
                      <Statistic
                        title={<span style={{ color: "rgba(255,255,255,0.85)", fontSize: isMobile ? 11 : 14 }}>Free Pool</span>}
                        value={subscriptions.filter((s) => s.plan !== "pro").length}
                        prefix={<TeamOutlined style={{ color: "#fff", fontSize: isMobile ? 14 : 18 }} />}
                        valueStyle={{ color: "#fff", fontWeight: 700, fontSize: isMobile ? 18 : 24 }}
                      />
                      <Text style={{ color: "rgba(255,255,255,0.9)", fontSize: isMobile ? 10 : 12, display: "block", marginTop: 4 }}>
                        Upgrade pool
                      </Text>
                    </Card>
                  </Col>
                </Row>

                {/* Subscriptions Search & Filter Controls */}
                <Card styles={{ body: { padding: isMobile ? 12 : 20 } }} style={{ borderRadius: 12, marginBottom: 16 }}>
                  <Row gutter={isMobile ? [8, 10] : [16, 12]} align="middle">
                    <Col xs={24} md={10}>
                      <Input
                        placeholder="Search merchant, phone, UTR..."
                        prefix={<SearchOutlined style={{ color: "#8c8c8c" }} />}
                        value={subscriptionSearch}
                        onChange={(e) => setSubscriptionSearch(e.target.value)}
                        allowClear
                      />
                    </Col>
                    <Col xs={18} md={10}>
                      <div style={{ overflowX: "auto", whiteSpace: "nowrap", paddingBottom: 4 }}>
                        <Radio.Group
                          value={subscriptionFilter}
                          onChange={(e) => setSubscriptionFilter(e.target.value)}
                          optionType="button"
                          buttonStyle="solid"
                          size={isMobile ? "small" : "middle"}
                        >
                          <Radio.Button value="all">All ({subscriptions.length})</Radio.Button>
                          <Radio.Button value="pending">
                            Pending ({subscriptions.filter((s) => s.subscriptionStatus === "pending").length})
                          </Radio.Button>
                          <Radio.Button value="pro">
                            PRO ({subscriptions.filter((s) => s.plan === "pro").length})
                          </Radio.Button>
                          <Radio.Button value="free">
                            Free ({subscriptions.filter((s) => s.plan !== "pro").length})
                          </Radio.Button>
                        </Radio.Group>
                      </div>
                    </Col>
                    <Col xs={6} md={4} style={{ textAlign: "right" }}>
                      <Button size={isMobile ? "small" : "middle"} icon={<SyncOutlined />} onClick={loadSubscriptions} loading={loadingSubscriptions}>
                        {isMobile ? "" : "Refresh"}
                      </Button>
                    </Col>
                  </Row>
                </Card>

                {/* Subscriptions View: Mobile Cards or Desktop Table */}
                {isMobile ? (
                  <List
                    dataSource={subscriptions
                      .filter((s) => {
                        if (subscriptionFilter === "pending") return s.subscriptionStatus === "pending";
                        if (subscriptionFilter === "pro") return s.plan === "pro";
                        if (subscriptionFilter === "free") return s.plan !== "pro";
                        return true;
                      })
                      .filter((s) => {
                        if (!subscriptionSearch.trim()) return true;
                        const q = subscriptionSearch.toLowerCase();
                        return (
                          s.name?.toLowerCase().includes(q) ||
                          s.email?.toLowerCase().includes(q) ||
                          s.storeName?.toLowerCase().includes(q) ||
                          s.phone?.includes(q) ||
                          s.paymentUtr?.toLowerCase().includes(q)
                        );
                      })}
                    loading={loadingSubscriptions}
                    pagination={{ pageSize: 8, size: "small", align: "center" }}
                    locale={{ emptyText: "No subscription records found." }}
                    renderItem={(r: any) => (
                      <Card
                        key={r.userId}
                        styles={{ body: { padding: "14px" } }}
                        style={{
                          marginBottom: 12,
                          borderRadius: 12,
                          border: r.subscriptionStatus === "pending" ? "2px solid #f59e0b" : "1px solid #e2e8f0",
                          background: "#fff",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8, gap: 8 }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 700, fontSize: 15, color: "#0f172a" }}>
                              {r.name}
                            </div>
                            <div style={{ fontSize: 12, color: "#64748b" }}>
                              🏬 {r.storeName} ({r.email})
                            </div>
                          </div>
                          <div style={{ display: "flex", gap: 4, flexWrap: "wrap", justifyContent: "flex-end" }}>
                            {r.plan === "pro" ? (
                              <Tag color="gold" style={{ margin: 0, fontWeight: 700 }}>👑 PRO</Tag>
                            ) : (
                              <Tag style={{ margin: 0 }}>FREE</Tag>
                            )}
                            {r.subscriptionStatus === "pending" ? (
                              <Tag color="orange" style={{ margin: 0, fontWeight: 700 }}>VERIFY UTR</Tag>
                            ) : r.subscriptionStatus === "active" ? (
                              <Tag color="green" style={{ margin: 0 }}>ACTIVE</Tag>
                            ) : r.subscriptionStatus === "expired" ? (
                              <Tag color="red" style={{ margin: 0 }}>EXPIRED</Tag>
                            ) : null}
                          </div>
                        </div>

                        {r.phone && (
                          <div style={{ marginBottom: 10, display: "flex", alignItems: "center", justifyContent: "space-between", background: "#f8fafc", padding: "8px 10px", borderRadius: 8 }}>
                            <span style={{ fontSize: 12, color: "#047857", fontWeight: 700 }}>
                              📱 {formatDisplayPhone(r.phone)}
                            </span>
                            <a
                              href={`https://wa.me/${String(r.phone).replace(/\D/g, "")}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ fontSize: 12, color: "#25D366", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}
                            >
                              <WhatsAppOutlined /> Chat
                            </a>
                          </div>
                        )}

                        {r.paymentUtr && (
                          <div style={{ background: "#f1f5f9", padding: "8px 10px", borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                            <div>
                              <span style={{ fontSize: 11, color: "#64748b", display: "block" }}>Payment UTR:</span>
                              <span style={{ fontFamily: "monospace", fontWeight: 700, fontSize: 13, color: "#0f172a" }}>{r.paymentUtr}</span>
                            </div>
                            <Button
                              size="small"
                              icon={<CopyOutlined />}
                              onClick={() => {
                                if (typeof navigator !== "undefined" && navigator.clipboard) {
                                  navigator.clipboard.writeText(r.paymentUtr);
                                  message.success("UTR Copied!");
                                }
                              }}
                            >
                              Copy
                            </Button>
                          </div>
                        )}

                        {r.planExpiresAt && (
                          <div style={{ fontSize: 12, color: "#64748b", marginBottom: 10 }}>
                            Plan Expiry: <Text strong>{new Date(r.planExpiresAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</Text>
                          </div>
                        )}

                        {r.subscriptionStatus === "pending" ? (
                          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
                            <Button
                              type="primary"
                              icon={<CheckCircleOutlined />}
                              loading={approvingUserId === r.userId}
                              onClick={() => handleApproveSubscription(r.userId, "monthly")}
                              style={{ background: "#10b981", borderColor: "#10b981", height: 42, fontWeight: 700, fontSize: 14 }}
                            >
                              Approve ₹99 (1 Month PRO)
                            </Button>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                              <Button
                                loading={approvingUserId === r.userId}
                                onClick={() => handleApproveSubscription(r.userId, "yearly")}
                                style={{ height: 38 }}
                              >
                                Approve 1 Yr (₹999)
                              </Button>
                              <Popconfirm
                                title="Reject upgrade request?"
                                description="Decision audit log me save hoga."
                                onConfirm={() => handleRejectSubscription(r.userId)}
                              >
                                <Button danger loading={rejectingUserId === r.userId} style={{ height: 38 }}>
                                  Reject
                                </Button>
                              </Popconfirm>
                            </div>
                          </div>
                        ) : r.plan === "pro" ? (
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 10 }}>
                            <Button
                              icon={<CrownOutlined />}
                              loading={approvingUserId === r.userId}
                              onClick={() => handleApproveSubscription(r.userId, "monthly")}
                              style={{ height: 38 }}
                            >
                              +30 Days
                            </Button>
                            <Popconfirm
                              title="Downgrade user to Free tier?"
                              onConfirm={() => handleRejectSubscription(r.userId)}
                            >
                              <Button danger style={{ height: 38 }}>
                                Downgrade
                              </Button>
                            </Popconfirm>
                          </div>
                        ) : (
                          <Button
                            block
                            icon={<CrownOutlined style={{ color: "#d97706" }} />}
                            loading={approvingUserId === r.userId}
                            onClick={() => handleApproveSubscription(r.userId, "monthly")}
                            style={{ height: 38, marginTop: 10 }}
                          >
                            Grant 30D PRO
                          </Button>
                        )}
                      </Card>
                    )}
                  />
                ) : (
                  <Card style={{ borderRadius: 12 }}>
                    <Table
                      dataSource={subscriptions
                        .filter((s) => {
                          if (subscriptionFilter === "pending") return s.subscriptionStatus === "pending";
                          if (subscriptionFilter === "pro") return s.plan === "pro";
                          if (subscriptionFilter === "free") return s.plan !== "pro";
                          return true;
                        })
                        .filter((s) => {
                          if (!subscriptionSearch.trim()) return true;
                          const q = subscriptionSearch.toLowerCase();
                          return (
                            s.name?.toLowerCase().includes(q) ||
                            s.email?.toLowerCase().includes(q) ||
                            s.storeName?.toLowerCase().includes(q) ||
                            s.phone?.includes(q) ||
                            s.paymentUtr?.toLowerCase().includes(q)
                          );
                        })}
                      rowKey="userId"
                      loading={loadingSubscriptions}
                      scroll={{ x: 1000 }}
                      pagination={{ pageSize: 10 }}
                      locale={{ emptyText: "No subscription records found." }}
                      columns={[
                        {
                          title: "Merchant & Store",
                          key: "merchant",
                          render: (_: any, r: any) => (
                            <div>
                              <Text strong style={{ fontSize: 13 }}>{r.name}</Text>
                              <div style={{ fontSize: 12, color: "#64748b" }}>🏬 {r.storeName}</div>
                              <div style={{ fontSize: 11, color: "#8c8c8c" }}>{r.email}</div>
                            </div>
                          ),
                        },
                        {
                          title: "WhatsApp Phone",
                          key: "phone",
                          render: (_: any, r: any) => (
                            <Text strong style={{ color: "#047857" }}>
                              📱 {formatDisplayPhone(r.phone)}
                            </Text>
                          ),
                        },
                        {
                          title: "Plan",
                          key: "plan",
                          render: (_: any, r: any) =>
                            r.plan === "pro" ? (
                              <Tag color="gold" style={{ fontWeight: 700 }}>👑 PRO</Tag>
                            ) : (
                              <Tag>FREE</Tag>
                            ),
                        },
                        {
                          title: "Status",
                          key: "status",
                          render: (_: any, r: any) => {
                            const status = r.subscriptionStatus;
                            if (status === "pending") return <Tag color="orange" style={{ fontWeight: 700 }}>PENDING VERIFICATION</Tag>;
                            if (status === "active") return <Tag color="green">ACTIVE</Tag>;
                            if (status === "expired") return <Tag color="red">EXPIRED</Tag>;
                            return <Tag color="default">FREE TIER</Tag>;
                          },
                        },
                        {
                          title: "Payment UTR",
                          key: "utr",
                          render: (_: any, r: any) =>
                            r.paymentUtr ? (
                              <Tag color="blue" style={{ fontFamily: "monospace", fontSize: 12 }}>
                                {r.paymentUtr}
                              </Tag>
                            ) : (
                              <Text type="secondary" style={{ fontSize: 12 }}>-</Text>
                            ),
                        },
                        {
                          title: "Expiry Date",
                          key: "expires",
                          render: (_: any, r: any) =>
                            r.planExpiresAt ? (
                              <Text style={{ fontSize: 12 }}>
                                {new Date(r.planExpiresAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                              </Text>
                            ) : (
                              <Text type="secondary" style={{ fontSize: 12 }}>-</Text>
                            ),
                        },
                        {
                          title: "Actions",
                          key: "actions",
                          align: "right",
                          render: (_: any, r: any) => (
                            <Space size="small">
                              {r.subscriptionStatus === "pending" ? (
                                <>
                                  <Button
                                    type="primary"
                                    size="small"
                                    icon={<CheckCircleOutlined />}
                                    loading={approvingUserId === r.userId}
                                    onClick={() => handleApproveSubscription(r.userId, "monthly")}
                                    style={{ background: "#10b981", borderColor: "#10b981", fontWeight: 600 }}
                                  >
                                    Approve (₹99 / 1 Mo)
                                  </Button>
                                  <Button
                                    size="small"
                                    loading={approvingUserId === r.userId}
                                    onClick={() => handleApproveSubscription(r.userId, "yearly")}
                                  >
                                    Approve (₹999 / 1 Yr)
                                  </Button>
                                  <Popconfirm
                                    title="Reject upgrade request?"
                                    description="Aapka decision audit log me save hoga aur merchant ko re-submit karna hoga."
                                    onConfirm={() => handleRejectSubscription(r.userId)}
                                  >
                                    <Button size="small" danger loading={rejectingUserId === r.userId}>
                                      Reject
                                    </Button>
                                  </Popconfirm>
                                </>
                              ) : r.plan === "pro" ? (
                                <>
                                  <Button
                                    size="small"
                                    icon={<CrownOutlined />}
                                    loading={approvingUserId === r.userId}
                                    onClick={() => handleApproveSubscription(r.userId, "monthly")}
                                  >
                                    +30 Days
                                  </Button>
                                  <Popconfirm
                                    title="Downgrade user to Free tier?"
                                    onConfirm={() => handleRejectSubscription(r.userId)}
                                  >
                                    <Button size="small" danger>
                                      Downgrade
                                    </Button>
                                  </Popconfirm>
                                </>
                              ) : (
                                <Button
                                  size="small"
                                  icon={<CrownOutlined style={{ color: "#d97706" }} />}
                                  loading={approvingUserId === r.userId}
                                  onClick={() => handleApproveSubscription(r.userId, "monthly")}
                                >
                                  Grant 30D PRO
                                </Button>
                              )}
                            </Space>
                          ),
                        },
                      ]}
                    />
                  </Card>
                )}
              </div>
            ),
          },

          // TAB 4: BROADCAST & PLATFORM NOTICES
          {
            key: "broadcast",
            label: (
              <span>
                <NotificationOutlined /> {isMobile ? "Broadcast" : "Broadcast & Notices"}
              </span>
            ),
            children: (
              <Row gutter={isMobile ? [14, 14] : [24, 24]}>
                {/* Platform Announcement Banner Manager */}
                <Col xs={24} lg={12}>
                  <Card
                    title={
                      <Space>
                        <BellOutlined style={{ color: "#faad14" }} />
                        <span>Platform Announcement Banner</span>
                      </Space>
                    }
                    styles={{ body: { padding: isMobile ? 14 : 24 } }}
                    style={{ borderRadius: 12, height: "100%" }}
                  >
                    <Paragraph type="secondary" style={{ fontSize: 13 }}>
                      Ye banner sabhi users ke dashboard aur app header me top par real-time me display hota hai. System maintenance ya offers ke liye use karein.
                    </Paragraph>

                    <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <Text strong>Active Banner Status:</Text>
                      <Switch
                        checked={announcement.enabled}
                        onChange={(val) => setAnnouncement((prev) => ({ ...prev, enabled: val }))}
                      />
                    </div>

                    <Form layout="vertical">
                      <Form.Item label="Banner Type">
                        <div style={{ overflowX: "auto", whiteSpace: "nowrap", paddingBottom: 4 }}>
                          <Radio.Group
                            value={announcement.type}
                            onChange={(e) => setAnnouncement((prev) => ({ ...prev, type: e.target.value }))}
                            size={isMobile ? "small" : "middle"}
                          >
                            <Radio.Button value="info">Info</Radio.Button>
                            <Radio.Button value="warning">Warning</Radio.Button>
                            <Radio.Button value="success">Success</Radio.Button>
                            <Radio.Button value="error">Critical</Radio.Button>
                          </Radio.Group>
                        </div>
                      </Form.Item>

                      <Form.Item label="Banner Headline">
                        <Input
                          placeholder="e.g. Scheduled System Upgrade"
                          value={announcement.title}
                          onChange={(e) => setAnnouncement((prev) => ({ ...prev, title: e.target.value }))}
                        />
                      </Form.Item>

                      <Form.Item label="Banner Message Content">
                        <Input.TextArea
                          rows={3}
                          placeholder="Type notice message visible to all logged-in users..."
                          value={announcement.message}
                          onChange={(e) => setAnnouncement((prev) => ({ ...prev, message: e.target.value }))}
                        />
                      </Form.Item>

                      {announcement.message && (
                        <div style={{ marginBottom: 16 }}>
                          <Text type="secondary" style={{ display: "block", marginBottom: 6 }}>Live Preview:</Text>
                          <Alert
                            message={announcement.title || "Platform Notice"}
                            description={announcement.message}
                            type={announcement.type}
                            showIcon
                          />
                        </div>
                      )}

                      <Button
                        block={isMobile}
                        type="primary"
                        icon={<CheckOutlined />}
                        loading={savingAnnouncement}
                        onClick={handleSaveAnnouncement}
                        style={{ height: isMobile ? 40 : 36, fontWeight: 600 }}
                      >
                        Publish Announcement
                      </Button>
                    </Form>
                  </Card>
                </Col>

                {/* Bulk WhatsApp Broadcast Sender */}
                <Col xs={24} lg={12}>
                  <Card
                    title={
                      <Space>
                        <SendOutlined style={{ color: "#25D366" }} />
                        <span>Bulk WhatsApp Broadcast (+91 9279259690)</span>
                      </Space>
                    }
                    styles={{ body: { padding: isMobile ? 14 : 24 } }}
                    style={{ borderRadius: 12, height: "100%" }}
                  >
                    <Paragraph type="secondary" style={{ fontSize: 13 }}>
                      Official GinieSpace bot (+91 9279259690) se sabhi merchants ko ek saath message ya offers bhejein. Message me <code>{"{{name}}"}</code> merchant ke real name se replace ho jayega.
                    </Paragraph>

                    <Form layout="vertical">
                      <Form.Item label="Target Audience Segment">
                        <Select
                          value={broadcastSegment}
                          onChange={setBroadcastSegment}
                          options={[
                            { value: "all", label: `All Active Businesses (${merchants.filter((m) => m.role !== "staff" && m.status !== "suspended").length} users)` },
                            { value: "free", label: `Free Plan Users Only (${merchants.filter((m) => m.role !== "staff" && m.status !== "suspended" && m.plan === "free").length} users)` },
                            { value: "pro", label: `Pro Subscribers Only (${merchants.filter((m) => m.role !== "staff" && m.status !== "suspended" && m.plan === "pro").length} users)` },
                            { value: "retail", label: "Retail Stores" },
                            { value: "wholesale", label: "Wholesale Businesses" },
                            { value: "services", label: "Service Providers" },
                          ]}
                        />
                      </Form.Item>

                      <div style={{ marginBottom: 12 }}>
                        <Tag color="cyan">Estimated WhatsApp Recipients: {broadcastTargetCount} businesses</Tag>
                        {supportStatus !== "connected" && (
                          <Tag color="error">⚠️ Support Bot Disconnected</Tag>
                        )}
                      </div>

                      <Form.Item label="Broadcast Message">
                        <Input.TextArea
                          rows={4}
                          placeholder="Namaste {{name}}! GinieSpace has introduced new service features to help your business grow..."
                          value={broadcastText}
                          onChange={(e) => setBroadcastText(e.target.value)}
                        />
                      </Form.Item>

                      <div style={{ overflowX: "auto", whiteSpace: "nowrap", paddingBottom: 6, marginBottom: 12 }}>
                        <Space size={6}>
                          <Button
                            size="small"
                            onClick={() =>
                              setBroadcastText(
                                "Namaste {{name}}! 🚀 GinieSpace par ab naye Services aur Booking features live ho chuke hain. Aap apne catalog me services add kar sakte hain aur Google Maps leads search kar sakte hain!\n\n- GinieSpace Official Support (+91 9279259690)"
                              )
                            }
                          >
                            Template: New Features
                          </Button>
                          <Button
                            size="small"
                            onClick={() =>
                              setBroadcastText(
                                "🌟 Special Pro Upgrade Offer for {{name}}! Unlimited catalog, B2B leads aur 5 team staff accounts unlock karein only ₹99/month me. UPI ID: paytmqr9tziqdamfo@paytm par pay karein aur app me 12-digit UTR submit karein!\n\n- GinieSpace Official Support (+91 92792 59690)"
                              )
                            }
                          >
                            Template: Pro Offer (₹99)
                          </Button>
                        </Space>
                      </div>

                      <Divider style={{ margin: "14px 0" }} />

                      <Popconfirm
                        title="Send Broadcast Message?"
                        description={`Ye message ${broadcastTargetCount} active users ke WhatsApp par bheja jayega.`}
                        okText="Yes, Send Broadcast"
                        onConfirm={handleSendBroadcast}
                        disabled={supportStatus !== "connected" || !broadcastText.trim()}
                      >
                        <Button
                          block={isMobile}
                          type="primary"
                          icon={<SendOutlined />}
                          loading={sendingBroadcast}
                          disabled={supportStatus !== "connected" || !broadcastText.trim()}
                          style={{
                            height: isMobile ? 42 : 38,
                            fontWeight: 700,
                            background: supportStatus === "connected" && broadcastText.trim() ? "#25D366" : undefined,
                            borderColor: supportStatus === "connected" && broadcastText.trim() ? "#25D366" : undefined,
                          }}
                        >
                          Send WhatsApp Broadcast
                        </Button>
                      </Popconfirm>
                    </Form>
                  </Card>
                </Col>
              </Row>
            ),
          },

          // TAB 5: SUPPORT QUERIES & SMART INBOX
          {
            key: "support",
            label: (
              <span>
                <MessageOutlined /> {isMobile ? "Support" : "Smart Support Inbox"} ({conversationThreads.length})
              </span>
            ),
            children: (
              <div>
                <Card styles={{ body: { padding: isMobile ? 12 : 20 } }} style={{ marginBottom: 16, borderRadius: 12 }}>
                  <Row gutter={isMobile ? [8, 10] : [16, 12]} align="middle">
                    <Col xs={24} md={10}>
                      <Input
                        placeholder="Search chats by contact number, name, or text..."
                        prefix={<SearchOutlined style={{ color: "#8c8c8c" }} />}
                        value={supportSearch}
                        onChange={(e) => setSupportSearch(e.target.value)}
                        allowClear
                      />
                    </Col>
                    <Col xs={14} md={6}>
                      <Space>
                        <Switch checked={needsReplyOnly} onChange={setNeedsReplyOnly} />
                        <Text strong style={{ fontSize: isMobile ? 12 : 14 }}>Needs Reply Only</Text>
                      </Space>
                    </Col>
                    <Col xs={10} md={8} style={{ textAlign: "right" }}>
                      <Button icon={<SyncOutlined />} onClick={loadSupportMessages} loading={loadingMessages} size={isMobile ? "small" : "middle"}>
                        Refresh
                      </Button>
                    </Col>
                  </Row>
                </Card>

                {/* Support Chats View: Mobile Cards or Desktop Table */}
                {isMobile ? (
                  <List
                    dataSource={conversationThreads}
                    loading={loadingMessages}
                    pagination={{ pageSize: 8, size: "small", align: "center" }}
                    locale={{ emptyText: "No incoming support queries found." }}
                    renderItem={(t: any) => (
                      <Card
                        key={t.phone}
                        styles={{ body: { padding: "14px" } }}
                        style={{
                          marginBottom: 10,
                          borderRadius: 12,
                          border: t.lastFromMe ? "1px solid #e2e8f0" : "1px solid #f59e0b",
                          background: t.lastFromMe ? "#fff" : "#fffbeb",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 15, color: "#0f172a" }}>
                              {t.name}
                            </div>
                            <div style={{ fontSize: 12, color: "#047857", fontWeight: 600 }}>
                              📞 {formatDisplayPhone(t.phone)}
                            </div>
                          </div>
                          <div>
                            {t.lastFromMe ? (
                              <Tag color="green" style={{ margin: 0 }}>REPLIED</Tag>
                            ) : (
                              <Tag color="orange" style={{ margin: 0, fontWeight: 700 }}>PENDING REPLY</Tag>
                            )}
                          </div>
                        </div>

                        <div style={{ background: "#f8fafc", padding: "8px 10px", borderRadius: 8, fontSize: 13, color: "#334155", marginBottom: 10 }}>
                          <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {t.latestText || "No text"}
                          </div>
                          <div style={{ fontSize: 10, color: "#94a3b8", textAlign: "right", marginTop: 2 }}>
                            {t.latestTimestamp ? new Date(t.latestTimestamp).toLocaleString() : ""}
                          </div>
                        </div>

                        <Button
                          block
                          type="primary"
                          icon={<SendOutlined />}
                          style={{ background: "#25D366", borderColor: "#25D366", height: 40, fontWeight: 600 }}
                          onClick={() => {
                            setActiveChatPhone(t.phone);
                            setReplyText("");
                          }}
                        >
                          Open Chat &amp; Reply
                        </Button>
                      </Card>
                    )}
                  />
                ) : (
                  <Card style={{ borderRadius: 12 }}>
                    <Table
                      dataSource={conversationThreads}
                      rowKey="phone"
                      loading={loadingMessages}
                      scroll={{ x: 800 }}
                      pagination={{ pageSize: 10 }}
                      locale={{ emptyText: "No incoming support queries found." }}
                      columns={[
                        {
                          title: "Customer / Contact",
                          key: "contact",
                          render: (_: any, t: any) => (
                            <div>
                              <Text strong>{t.name}</Text>
                              <div style={{ fontSize: 12, color: "#047857", fontWeight: 600 }}>
                                📞 {formatDisplayPhone(t.phone)}
                              </div>
                            </div>
                          ),
                        },
                        {
                          title: "Last Message",
                          key: "msg",
                          render: (_: any, t: any) => (
                            <div>
                              <div style={{ maxWidth: 420, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                {t.latestText}
                              </div>
                              <div style={{ fontSize: 11, color: "#8c8c8c" }}>
                                {t.latestTimestamp ? new Date(t.latestTimestamp).toLocaleString() : ""}
                              </div>
                            </div>
                          ),
                        },
                        {
                          title: "Status",
                          key: "status",
                          render: (_: any, t: any) =>
                            t.lastFromMe ? (
                              <Tag color="green">REPLIED</Tag>
                            ) : (
                              <Tag color="orange">PENDING REPLY</Tag>
                            ),
                        },
                        {
                          title: "Total Messages",
                          dataIndex: "messageCount",
                          key: "count",
                          align: "center",
                        },
                        {
                          title: "Action",
                          key: "action",
                          align: "right",
                          render: (_: any, t: any) => (
                            <Button
                              type="primary"
                              size="small"
                              icon={<SendOutlined />}
                              style={{ background: "#25D366", borderColor: "#25D366" }}
                              onClick={() => {
                                setActiveChatPhone(t.phone);
                                setReplyText("");
                              }}
                            >
                              Open Chat &amp; Reply
                            </Button>
                          ),
                        },
                      ]}
                    />
                  </Card>
                )}
              </div>
            ),
          },

          // TAB 6: OFFICIAL SUPPORT BOT & AUDIT LOGS
          {
            key: "support-bot",
            label: (
              <span>
                <PhoneOutlined /> {isMobile ? "Bot" : "Official Bot (+91 9279259690)"}
              </span>
            ),
            children: (
              <div>
                <Row gutter={isMobile ? [14, 14] : [20, 20]} style={{ marginBottom: 24 }}>
                  {/* Bot Connection Card */}
                  <Col xs={24} lg={12}>
                    <Card
                      title={
                        <Space>
                          <SafetyCertificateOutlined style={{ color: "#25D366", fontSize: 20 }} />
                          <span>Support Bot Connection Status</span>
                        </Space>
                      }
                      styles={{ body: { padding: isMobile ? 14 : 24 } }}
                      style={{ borderRadius: 12, height: "100%" }}
                    >
                      <div style={{ marginBottom: 20 }}>
                        <Text type="secondary" style={{ display: "block", marginBottom: 6 }}>Current Status:</Text>
                        {supportStatus === "connected" ? (
                          <Tag icon={<CheckCircleOutlined />} color="success" style={{ padding: "6px 14px", fontSize: 14 }}>
                            WhatsApp Connected (+91 9279259690)
                          </Tag>
                        ) : supportStatus === "connecting" ? (
                          <Tag icon={<SyncOutlined spin />} color="warning" style={{ padding: "6px 14px", fontSize: 14 }}>
                            Connecting... Scan QR Code
                          </Tag>
                        ) : (
                          <Tag icon={<CloseCircleOutlined />} color="error" style={{ padding: "6px 14px", fontSize: 14 }}>
                            Disconnected
                          </Tag>
                        )}
                      </div>

                      <div style={{ marginBottom: 12 }}>
                        <Text strong>Official GinieSpace Helpline: </Text>
                        <Tag color="cyan">+91 9279259690</Tag>
                      </div>

                      <div style={{ marginBottom: 16 }}>
                        <Text strong>Session Persistence: </Text>
                        <Tag color="purple">Cloud State Synced (Auto-restores on restart)</Tag>
                      </div>

                      <Paragraph type="secondary" style={{ fontSize: 13 }}>
                        ⚠️ Ye session tab tak active rahega jab tak admin khud niche diye gaye <strong>Disconnect</strong> button se log out na kare ya phone ke WhatsApp app me jakar Linked Devices se remove na kare.
                      </Paragraph>

                      <Divider />

                      <Space wrap direction={isMobile ? "vertical" : "horizontal"} style={{ width: isMobile ? "100%" : "auto" }}>
                        {supportStatus === "connected" ? (
                          <>
                            <Popconfirm
                              title="Disconnect Official Support WhatsApp?"
                              description="Disconnect karne par 9279259690 se system alerts pause ho jayenge."
                              onConfirm={handleDisconnectSupport}
                              okText="Yes, Disconnect"
                              cancelText="Cancel"
                              okButtonProps={{ danger: true }}
                            >
                              <Button block={isMobile} danger loading={disconnecting} style={{ height: isMobile ? 40 : 32 }}>
                                Disconnect Session
                              </Button>
                            </Popconfirm>
                            <Button
                              block={isMobile}
                              icon={<SyncOutlined />}
                              loading={resettingRatchets}
                              onClick={handleResetRatchets}
                              title="Purge stale contact encryption keys and re-sync fresh Signal ratchets"
                              style={{ height: isMobile ? 40 : 32 }}
                            >
                              Fix E2EE Keys (Clear Bad MAC)
                            </Button>
                          </>
                        ) : (
                          <Button
                            block={isMobile}
                            type="primary"
                            icon={<QrcodeOutlined />}
                            loading={connecting}
                            onClick={handleConnectSupport}
                            style={{ background: "#25D366", borderColor: "#25D366", fontWeight: 600, height: isMobile ? 42 : 36 }}
                          >
                            Link Support WhatsApp (+91 9279259690)
                          </Button>
                        )}

                        {supportStatus === "connecting" && (
                          <Button block={isMobile} onClick={() => setQrModalVisible(true)} icon={<QrcodeOutlined />} style={{ height: isMobile ? 40 : 32 }}>
                            View QR Code
                          </Button>
                        )}
                      </Space>
                    </Card>
                  </Col>

                  {/* Direct Test Alert Card */}
                  <Col xs={24} lg={12}>
                    <Card
                      title={
                        <Space>
                          <SendOutlined style={{ color: "#1677ff", fontSize: 18 }} />
                          <span>Direct Test Notification</span>
                        </Space>
                      }
                      styles={{ body: { padding: isMobile ? 14 : 24 } }}
                      style={{ borderRadius: 12, height: "100%" }}
                    >
                      <Paragraph type="secondary" style={{ fontSize: 13 }}>
                        Official support number (+91 9279259690) se kisi bhi mobile number par test WhatsApp message bhej kar verify karein:
                      </Paragraph>

                      <Form form={testForm} layout="vertical" onFinish={handleSendTest}>
                        <Form.Item
                          name="phone"
                          label="Recipient Mobile Number"
                          rules={[{ required: true, message: "Enter recipient phone number (e.g. 918797186001)" }]}
                        >
                          <Input placeholder="e.g. 918797186001 or +91 87971 86001" />
                        </Form.Item>

                        <Form.Item
                          name="message"
                          label="Message Content"
                          initialValue="Hello! This is a verified test notification from GinieSpace Official Support (+91 9279259690)."
                          rules={[{ required: true, message: "Enter message text" }]}
                        >
                          <Input.TextArea rows={3} />
                        </Form.Item>

                        <Button
                          block={isMobile}
                          type="primary"
                          htmlType="submit"
                          icon={<SendOutlined />}
                          loading={sendingTest}
                          disabled={supportStatus !== "connected"}
                          style={{
                            height: isMobile ? 40 : 34,
                            fontWeight: 600,
                            background: supportStatus === "connected" ? "#25D366" : undefined,
                            borderColor: supportStatus === "connected" ? "#25D366" : undefined,
                          }}
                        >
                          {supportStatus === "connected" ? "Send Test Alert" : "Connect WhatsApp First"}
                        </Button>
                      </Form>
                    </Card>
                  </Col>

                  {/* Notification Rules (2x2 on Mobile) */}
                  <Col xs={24}>
                    <Card
                      title={
                        <Space>
                          <BellOutlined style={{ color: "#faad14", fontSize: 20 }} />
                          <span>Automated Platform Notification Rules (Via +91 9279259690)</span>
                        </Space>
                      }
                      styles={{ body: { padding: isMobile ? 12 : 24 } }}
                      style={{ borderRadius: 12 }}
                    >
                      <Row gutter={isMobile ? [10, 10] : [24, 24]}>
                        <Col xs={12} sm={12} md={6}>
                          <Card type="inner" styles={{ body: { padding: isMobile ? "10px" : "16px" } }} style={{ borderRadius: 8, height: "100%" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                              <Text strong style={{ fontSize: isMobile ? 12 : 14 }}>Welcome</Text>
                              <Switch
                                checked={rules.newUserWelcome}
                                onChange={(c) => handleRuleToggle("newUserWelcome", c)}
                                loading={savingRules}
                                size={isMobile ? "small" : "default"}
                              />
                            </div>
                            <Text type="secondary" style={{ fontSize: 11 }}>
                              New user onboarding greeting.
                            </Text>
                          </Card>
                        </Col>

                        <Col xs={12} sm={12} md={6}>
                          <Card type="inner" styles={{ body: { padding: isMobile ? "10px" : "16px" } }} style={{ borderRadius: 8, height: "100%" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                              <Text strong style={{ fontSize: isMobile ? 12 : 14 }}>Orders</Text>
                              <Switch
                                checked={rules.orderPlacedAlert}
                                onChange={(c) => handleRuleToggle("orderPlacedAlert", c)}
                                loading={savingRules}
                                size={isMobile ? "small" : "default"}
                              />
                            </div>
                            <Text type="secondary" style={{ fontSize: 11 }}>
                              Order confirmation alerts.
                            </Text>
                          </Card>
                        </Col>

                        <Col xs={12} sm={12} md={6}>
                          <Card type="inner" styles={{ body: { padding: isMobile ? "10px" : "16px" } }} style={{ borderRadius: 8, height: "100%" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                              <Text strong style={{ fontSize: isMobile ? 12 : 14 }}>Leads</Text>
                              <Switch
                                checked={rules.leadConvertedAlert}
                                onChange={(c) => handleRuleToggle("leadConvertedAlert", c)}
                                loading={savingRules}
                                size={isMobile ? "small" : "default"}
                              />
                            </div>
                            <Text type="secondary" style={{ fontSize: 11 }}>
                              Lead conversion alert.
                            </Text>
                          </Card>
                        </Col>

                        <Col xs={12} sm={12} md={6}>
                          <Card type="inner" styles={{ body: { padding: isMobile ? "10px" : "16px" } }} style={{ borderRadius: 8, height: "100%" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                              <Text strong style={{ fontSize: isMobile ? 12 : 14 }}>Auto-Reply</Text>
                              <Switch
                                checked={rules.supportAutoReply}
                                onChange={(c) => handleRuleToggle("supportAutoReply", c)}
                                loading={savingRules}
                                size={isMobile ? "small" : "default"}
                              />
                            </div>
                            <Text type="secondary" style={{ fontSize: 11 }}>
                              Helpline auto-greeting.
                            </Text>
                          </Card>
                        </Col>
                      </Row>
                    </Card>
                  </Col>

                  {/* Admin Audit Trail */}
                  <Col xs={24}>
                    <Card
                      title={
                        <Space>
                          <HistoryOutlined style={{ color: "#1677ff", fontSize: 18 }} />
                          <span>Admin Activity Audit Trail</span>
                        </Space>
                      }
                      extra={
                        <Button icon={<SyncOutlined />} onClick={loadAuditLogs} loading={loadingAuditLogs} size={isMobile ? "small" : "middle"}>
                          Refresh
                        </Button>
                      }
                      styles={{ body: { padding: isMobile ? 10 : 24 } }}
                      style={{ borderRadius: 12 }}
                    >
                      <Table
                        dataSource={auditLogs}
                        rowKey="id"
                        loading={loadingAuditLogs}
                        scroll={{ x: 750 }}
                        pagination={{ pageSize: 8, size: "small" }}
                        locale={{ emptyText: "No admin actions recorded yet." }}
                        columns={[
                          {
                            title: "Timestamp",
                            dataIndex: "timestamp",
                            key: "timestamp",
                            render: (ts: string) => (ts ? new Date(ts).toLocaleString() : "-"),
                          },
                          {
                            title: "Admin",
                            dataIndex: "adminEmail",
                            key: "admin",
                            render: (email: string) => <Tag color="purple">{email}</Tag>,
                          },
                          {
                            title: "Action",
                            dataIndex: "action",
                            key: "action",
                            render: (act: string) => <Tag color="blue">{act}</Tag>,
                          },
                          {
                            title: "Details",
                            dataIndex: "details",
                            key: "details",
                          },
                        ]}
                      />
                    </Card>
                  </Col>
                </Row>
              </div>
            ),
          },

          // TAB 5: WEBSITE TRAFFIC, FUNNEL & SEO
          {
            key: "web-analytics",
            label: (
              <span>
                <LineChartOutlined /> {isMobile ? "Web Traffic" : "Web Analytics & SEO"}
              </span>
            ),
            children: (
              <div>
                {/* Header with Title & Live badge */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 12,
                    marginBottom: 20,
                  }}
                >
                  <div>
                    <Title level={4} style={{ margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                      <GlobalOutlined style={{ color: "#25D366" }} /> Website Traffic & Google SEO Engine
                    </Title>
                    <Text type="secondary" style={{ fontSize: 13 }}>
                      Real-time visitors, conversion funnels, page speed & Google search indexing.
                    </Text>
                  </div>

                  <Space>
                    <Badge status="processing" color="#25D366" text={<strong style={{ color: "#047857" }}>{webAnalytics?.liveVisitorsCount || 0} Online Live</strong>} />
                    <Button
                      icon={<SyncOutlined spin={loadingWebAnalytics} />}
                      onClick={loadWebAnalytics}
                      loading={loadingWebAnalytics}
                      size={isMobile ? "small" : "middle"}
                    >
                      Refresh
                    </Button>
                  </Space>
                </div>

                {loadingWebAnalytics ? (
                  <div style={{ textAlign: "center", padding: "60px 0" }}>
                    <Spin size="large" />
                  </div>
                ) : (
                  <div>
                    {/* Top 4 KPI Cards */}
                    <Row gutter={isMobile ? [10, 10] : [16, 16]} style={{ marginBottom: isMobile ? 16 : 24 }}>
                      <Col xs={12} sm={12} lg={6}>
                        <Card
                          styles={{ body: { padding: isMobile ? "12px 14px" : "20px" } }}
                          style={{ borderRadius: 12, background: "linear-gradient(135deg, #10b981 0%, #059669 100%)", color: "#fff" }}
                        >
                          <Statistic
                            title={<span style={{ color: "rgba(255,255,255,0.85)", fontSize: isMobile ? 11 : 14 }}>Live Active Now</span>}
                            value={webAnalytics?.liveVisitorsCount || 0}
                            prefix={<Badge status="processing" color="#fff" style={{ marginRight: 6 }} />}
                            valueStyle={{ color: "#fff", fontWeight: 700, fontSize: isMobile ? 18 : 26 }}
                          />
                          <Text style={{ color: "rgba(255,255,255,0.9)", fontSize: isMobile ? 10 : 12, display: "block", marginTop: 4 }}>
                            Active in last 5 mins
                          </Text>
                        </Card>
                      </Col>

                      <Col xs={12} sm={12} lg={6}>
                        <Card
                          styles={{ body: { padding: isMobile ? "12px 14px" : "20px" } }}
                          style={{ borderRadius: 12, background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)", color: "#fff" }}
                        >
                          <Statistic
                            title={<span style={{ color: "rgba(255,255,255,0.85)", fontSize: isMobile ? 11 : 14 }}>Total Visitors</span>}
                            value={webAnalytics?.summary?.totalVisitors || 0}
                            valueStyle={{ color: "#fff", fontWeight: 700, fontSize: isMobile ? 18 : 26 }}
                          />
                          <Text style={{ color: "rgba(255,255,255,0.9)", fontSize: isMobile ? 10 : 12, display: "block", marginTop: 4 }}>
                            Today: {webAnalytics?.summary?.todayVisitors || 0} ({webAnalytics?.summary?.totalPageviews || 0} views)
                          </Text>
                        </Card>
                      </Col>

                      <Col xs={12} sm={12} lg={6}>
                        <Card
                          styles={{ body: { padding: isMobile ? "12px 14px" : "20px" } }}
                          style={{ borderRadius: 12, background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)", color: "#fff" }}
                        >
                          <Statistic
                            title={<span style={{ color: "rgba(255,255,255,0.85)", fontSize: isMobile ? 11 : 14 }}>Visitor Conversion</span>}
                            value={webAnalytics?.funnel?.overallConversionRate || 0}
                            suffix="%"
                            prefix={<RiseOutlined style={{ color: "#fff", fontSize: isMobile ? 14 : 18 }} />}
                            valueStyle={{ color: "#fff", fontWeight: 700, fontSize: isMobile ? 18 : 26 }}
                          />
                          <Text style={{ color: "rgba(255,255,255,0.9)", fontSize: isMobile ? 10 : 12, display: "block", marginTop: 4 }}>
                            {webAnalytics?.funnel?.completedSignups || 0} Merchant Stores Created
                          </Text>
                        </Card>
                      </Col>

                      <Col xs={12} sm={12} lg={6}>
                        <Card
                          styles={{ body: { padding: isMobile ? "12px 14px" : "20px" } }}
                          style={{ borderRadius: 12, background: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)", color: "#fff" }}
                        >
                          <Statistic
                            title={<span style={{ color: "rgba(255,255,255,0.85)", fontSize: isMobile ? 11 : 14 }}>Page Load Speed</span>}
                            value={webAnalytics?.summary?.avgPageLoadMs ? webAnalytics.summary.avgPageLoadMs : 0}
                            suffix={webAnalytics?.summary?.avgPageLoadMs ? "ms" : ""}
                            prefix={<ThunderboltOutlined style={{ color: "#fff", fontSize: isMobile ? 14 : 18 }} />}
                            valueStyle={{ color: "#fff", fontWeight: 700, fontSize: isMobile ? 18 : 26 }}
                          />
                          <Text style={{ color: "rgba(255,255,255,0.9)", fontSize: isMobile ? 10 : 12, display: "block", marginTop: 4 }}>
                            {webAnalytics?.summary?.avgPageLoadMs ? (webAnalytics?.summary?.speedRating || "Grade A+ (Superfast)") : "Realtime Active"}
                          </Text>
                        </Card>
                      </Col>
                    </Row>

                    {/* Middle Section: Funnel & Channels */}
                    <Row gutter={isMobile ? [12, 12] : [16, 16]} style={{ marginBottom: isMobile ? 16 : 24 }}>
                      {/* Left: Conversion Funnel */}
                      <Col xs={24} lg={12}>
                        <Card
                          title={
                            <Space>
                              <RocketOutlined style={{ color: "#f59e0b" }} />
                              <span>Merchant Acquisition Funnel</span>
                            </Space>
                          }
                          styles={{ body: { padding: isMobile ? 14 : 20 } }}
                          style={{ borderRadius: 12, height: "100%" }}
                        >
                          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                            {/* Step 1 */}
                            <div style={{ background: "#f8fafc", padding: "12px 14px", borderRadius: 10, border: "1px solid #e2e8f0" }}>
                              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                                <Text strong style={{ fontSize: 13 }}>1. Landing Page Visitors</Text>
                                <span style={{ fontWeight: 700, color: "#0f172a" }}>
                                  {webAnalytics?.funnel?.landingViews || 0} visits (100%)
                                </span>
                              </div>
                              <Progress percent={100} strokeColor="#3b82f6" showInfo={false} size="small" />
                            </div>

                            {/* Step 2 */}
                            <div style={{ background: "#f8fafc", padding: "12px 14px", borderRadius: 10, border: "1px solid #e2e8f0" }}>
                              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                                <Text strong style={{ fontSize: 13 }}>2. Signup Started</Text>
                                <span style={{ fontWeight: 700, color: "#f59e0b" }}>
                                  {webAnalytics?.funnel?.signupViews || 0} ({webAnalytics?.funnel?.visitorToSignupRate || 0}%)
                                </span>
                              </div>
                              <Progress
                                percent={Math.min(100, Math.round(webAnalytics?.funnel?.visitorToSignupRate || 0))}
                                strokeColor="#f59e0b"
                                showInfo={false}
                                size="small"
                              />
                            </div>

                            {/* Step 3 */}
                            <div style={{ background: "#f8fafc", padding: "12px 14px", borderRadius: 10, border: "1px solid #e2e8f0" }}>
                              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                                <Text strong style={{ fontSize: 13 }}>3. Registered Stores Created</Text>
                                <span style={{ fontWeight: 700, color: "#10b981" }}>
                                  {webAnalytics?.funnel?.completedSignups || 0} ({webAnalytics?.funnel?.overallConversionRate || 0}%)
                                </span>
                              </div>
                              <Progress
                                percent={Math.min(100, Math.round(webAnalytics?.funnel?.overallConversionRate || 0))}
                                strokeColor="#10b981"
                                showInfo={false}
                                size="small"
                              />
                            </div>
                          </div>
                        </Card>
                      </Col>

                      {/* Right: Traffic Channels */}
                      <Col xs={24} lg={12}>
                        <Card
                          title={
                            <Space>
                              <GlobalOutlined style={{ color: "#3b82f6" }} />
                              <span>Traffic Sources & Channels</span>
                            </Space>
                          }
                          styles={{ body: { padding: isMobile ? 14 : 20 } }}
                          style={{ borderRadius: 12, height: "100%" }}
                        >
                          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                            {(webAnalytics?.sources && webAnalytics.sources.length > 0
                              ? webAnalytics.sources
                              : [
                                  { channel: "WhatsApp Viral", count: 0, percent: 0 },
                                  { channel: "Google Organic", count: 0, percent: 0 },
                                  { channel: "Direct Navigation", count: 0, percent: 0 },
                                  { channel: "Instagram / Social", count: 0, percent: 0 },
                                ]
                            ).map((src: any, idx: number) => {
                              const colors = ["#25D366", "#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b"];
                              const color = colors[idx % colors.length];
                              return (
                                <div key={src.channel}>
                                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                                    <span style={{ fontWeight: 600, color: "#334155" }}>{src.channel}</span>
                                    <span style={{ fontWeight: 700, color }}>{src.percent}% ({src.count})</span>
                                  </div>
                                  <Progress percent={src.percent} strokeColor={color} showInfo={false} size="small" />
                                </div>
                              );
                            })}
                          </div>
                        </Card>
                      </Col>
                    </Row>

                    {/* Row 3: Top Visited Pages & Devices */}
                    <Row gutter={isMobile ? [12, 12] : [16, 16]} style={{ marginBottom: isMobile ? 16 : 24 }}>
                      <Col xs={24} lg={14}>
                        <Card
                          title="Top Visited Pages"
                          styles={{ body: { padding: isMobile ? 10 : 16 } }}
                          style={{ borderRadius: 12 }}
                        >
                          <Table
                            dataSource={webAnalytics?.topPages || []}
                            rowKey="path"
                            pagination={false}
                            size="small"
                            columns={[
                              {
                                title: "Page / Route",
                                dataIndex: "path",
                                key: "path",
                                render: (path: string, row: any) => (
                                  <div>
                                    <div style={{ fontWeight: 600, color: "#0f172a" }}>{row.name || path}</div>
                                    <div style={{ fontSize: 11, color: "#64748b" }}>{path}</div>
                                  </div>
                                ),
                              },
                              {
                                title: "Views",
                                dataIndex: "views",
                                key: "views",
                                width: 100,
                                align: "right" as const,
                                render: (v: number) => <Tag color="blue">{v?.toLocaleString()}</Tag>,
                              },
                            ]}
                          />
                        </Card>
                      </Col>

                      <Col xs={24} lg={10}>
                        <Card
                          title="Device & Platform Distribution"
                          styles={{ body: { padding: isMobile ? 14 : 20 } }}
                          style={{ borderRadius: 12 }}
                        >
                          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                            <div>
                              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 13 }}>
                                <span style={{ fontWeight: 600 }}>📱 Mobile Browsers</span>
                                <span style={{ fontWeight: 700, color: "#25D366" }}>
                                  {webAnalytics?.devices?.Mobile ?? webAnalytics?.devices?.mobile ?? 0}%
                                </span>
                              </div>
                              <Progress percent={webAnalytics?.devices?.Mobile ?? webAnalytics?.devices?.mobile ?? 0} strokeColor="#25D366" showInfo={false} size="small" />
                            </div>

                            <div>
                              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 13 }}>
                                <span style={{ fontWeight: 600 }}>💻 Desktop & Laptop</span>
                                <span style={{ fontWeight: 700, color: "#3b82f6" }}>
                                  {webAnalytics?.devices?.Desktop ?? webAnalytics?.devices?.desktop ?? 0}%
                                </span>
                              </div>
                              <Progress percent={webAnalytics?.devices?.Desktop ?? webAnalytics?.devices?.desktop ?? 0} strokeColor="#3b82f6" showInfo={false} size="small" />
                            </div>

                            <div>
                              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 13 }}>
                                <span style={{ fontWeight: 600 }}>📟 Tablets</span>
                                <span style={{ fontWeight: 700, color: "#8b5cf6" }}>
                                  {webAnalytics?.devices?.Tablet ?? webAnalytics?.devices?.tablet ?? 0}%
                                </span>
                              </div>
                              <Progress percent={webAnalytics?.devices?.Tablet ?? webAnalytics?.devices?.tablet ?? 0} strokeColor="#8b5cf6" showInfo={false} size="small" />
                            </div>
                          </div>
                        </Card>
                      </Col>
                    </Row>

                    {/* Row 4: Google Ranking, SEO & GA4 Setup */}
                    <Card
                      title={
                        <Space>
                          <GlobalOutlined style={{ color: "#25D366" }} />
                          <span>Google Ranking, Search Console & Google Analytics 4 Setup</span>
                        </Space>
                      }
                      styles={{ body: { padding: isMobile ? 14 : 24 } }}
                      style={{ borderRadius: 12 }}
                    >
                      {/* SEO Status Badges */}
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: 12,
                          background: "#f0fdf4",
                          border: "1px solid #bbf7d0",
                          borderRadius: 8,
                          padding: "12px 16px",
                          marginBottom: 20,
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 700, color: "#065f46", fontSize: 14 }}>
                            ✅ Google Search Indexing & Sitemap Ready
                          </div>
                          <div style={{ fontSize: 12, color: "#047857", marginTop: 2 }}>
                            XML Sitemap: <a href="https://app.ginie.space/sitemap.xml" target="_blank" rel="noopener noreferrer">https://app.ginie.space/sitemap.xml</a> | Robots: <a href="https://app.ginie.space/robots.txt" target="_blank" rel="noopener noreferrer">https://app.ginie.space/robots.txt</a>
                          </div>
                        </div>
                        <Tag color="success" style={{ fontWeight: 700 }}>GOOGLE INDEXED</Tag>
                      </div>

                      <Form
                        form={seoForm}
                        layout="vertical"
                        onFinish={handleSaveSeo}
                      >
                        <Row gutter={16}>
                          <Col xs={24} md={12}>
                            <Form.Item
                              name="ga4MeasurementId"
                              label="Google Analytics 4 Measurement ID"
                              extra="GA4 tracking ID (e.g. G-ABC123XYZ). Saves and auto-injects real-time Google tracking."
                            >
                              <Input placeholder="e.g. G-ABC123XYZ" />
                            </Form.Item>
                          </Col>

                          <Col xs={24} md={12}>
                            <Form.Item
                              name="googleSiteVerification"
                              label="Google Search Console Verification Meta Tag"
                              extra="Paste the Google site verification tag content to verify domain ownership."
                            >
                              <Input placeholder="e.g. google-site-verification=abc..." />
                            </Form.Item>
                          </Col>

                          <Col xs={24}>
                            <Form.Item
                              name="targetKeywords"
                              label="Target Google Ranking Keywords"
                              extra="Comma separated keywords targeted for Google Search ranking."
                            >
                              <Input.TextArea rows={2} placeholder="whatsapp store builder, free online dukaan, b2b catalog, giniespace" />
                            </Form.Item>
                          </Col>
                        </Row>

                        <Button
                          type="primary"
                          htmlType="submit"
                          loading={savingSeo}
                          icon={<CheckOutlined />}
                          style={{
                            background: "#25D366",
                            borderColor: "#25D366",
                            fontWeight: 600,
                            height: 40,
                            padding: "0 24px",
                          }}
                        >
                          Save SEO & Google Analytics Settings
                        </Button>
                      </Form>
                    </Card>
                  </div>
                )}
              </div>
            ),
          },
        ]}
      />

      {/* 360° Merchant Profile Drawer (Responsive width) */}
      <Drawer
        title={
          <Space>
            <ShopOutlined style={{ color: "#25D366" }} />
            <span>{selectedMerchant?.business?.name || selectedMerchant?.name}&apos;s 360° Profile</span>
          </Space>
        }
        open={merchantDrawerOpen}
        onClose={() => setMerchantDrawerOpen(false)}
        width={isMobile ? "100%" : 560}
      >
        {selectedMerchant && (
          <div>
            <div style={{ marginBottom: 20 }}>
              <Title level={5} style={{ margin: 0 }}>{selectedMerchant.name}</Title>
              <Text type="secondary">{selectedMerchant.email}</Text>
              <div style={{ marginTop: 8 }}>
                <Tag color={selectedMerchant.businessType === "wholesale" ? "blue" : selectedMerchant.businessType === "services" ? "purple" : "green"}>
                  {selectedMerchant.businessType?.toUpperCase()}
                </Tag>
                <Tag color={selectedMerchant.plan === "pro" ? "gold" : "default"}>
                  {selectedMerchant.plan?.toUpperCase()} PLAN
                </Tag>
                <Tag color={selectedMerchant.status === "suspended" ? "red" : "green"}>
                  {selectedMerchant.status?.toUpperCase()}
                </Tag>
              </div>
            </div>

            <Card type="inner" title="Storefront & Public Links" style={{ marginBottom: 20, borderRadius: 8 }}>
              <div style={{ marginBottom: 8 }}>
                <Text strong>Store Name: </Text>
                <Text>{selectedMerchant.business?.name || "Not Set"}</Text>
              </div>
              <div style={{ marginBottom: 8 }}>
                <Text strong>WhatsApp Phone: </Text>
                <Text strong style={{ color: "#047857" }}>
                  {selectedMerchant.business?.phone ? `📱 ${formatDisplayPhone(selectedMerchant.business.phone)}` : "Not Set"}
                </Text>
              </div>
              <div style={{ marginBottom: 8 }}>
                <Text strong>Custom Link Slug: </Text>
                <Tag color="cyan">/{selectedMerchant.business?.slug || selectedMerchant.id}</Tag>
              </div>
              <div>
                <a
                  href={`/shop/${selectedMerchant.business?.slug || selectedMerchant.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
                >
                  <LinkOutlined /> Open Live Storefront
                </a>
              </div>
            </Card>

            <Card type="inner" title="Workspace Usage Metrics" style={{ marginBottom: 20, borderRadius: 8 }}>
              <Row gutter={[12, 12]}>
                <Col xs={12} sm={12}>
                  <Statistic title="Total Orders" value={selectedMerchant.counts?.orders || 0} prefix={<ShoppingOutlined />} />
                </Col>
                <Col xs={12} sm={12}>
                  <Statistic
                    title="Total Revenue (GMV)"
                    value={selectedMerchant.counts?.revenue || 0}
                    formatter={(val) => `₹${Number(val).toLocaleString("en-IN")}`}
                    valueStyle={{ color: "#10b981", fontWeight: 700 }}
                  />
                </Col>
                <Col xs={12} sm={12}>
                  <Statistic title="Catalog Products" value={selectedMerchant.counts?.products || 0} />
                </Col>
                <Col xs={12} sm={12}>
                  <Statistic title="Saved Customers" value={selectedMerchant.counts?.customers || 0} prefix={<TeamOutlined />} />
                </Col>
                <Col xs={12} sm={12}>
                  <Statistic title="Leads Discovered" value={selectedMerchant.counts?.leads || 0} />
                </Col>
                <Col xs={12} sm={12}>
                  <Statistic title="Team Staff Accounts" value={selectedMerchant.counts?.staff || 0} />
                </Col>
              </Row>
            </Card>

            <Card type="inner" title="Quick Admin Controls" style={{ borderRadius: 8 }}>
              <Space direction="vertical" style={{ width: "100%" }}>
                <Button
                  block
                  icon={<CrownOutlined />}
                  onClick={() => handleSendProPitch(selectedMerchant)}
                  disabled={selectedMerchant.plan === "pro" || !selectedMerchant.business?.phone}
                >
                  Send Pro Upgrade Pitch on WhatsApp
                </Button>

                <Button
                  block
                  icon={<KeyOutlined />}
                  onClick={() => {
                    setResetPassModalUser(selectedMerchant);
                    setTempPassword("");
                  }}
                >
                  Reset Merchant Password
                </Button>

                <Button
                  block
                  danger
                  icon={<DisconnectOutlined />}
                  onClick={() => handleDisconnectMerchantWhatsApp(selectedMerchant)}
                  disabled={selectedMerchant.whatsapp?.status === "disconnected"}
                >
                  Force Disconnect Merchant WhatsApp
                </Button>

                <Button
                  block
                  danger={selectedMerchant.status !== "suspended"}
                  disabled={selectedMerchant.role === "admin"}
                  onClick={() =>
                    handleUpdateMerchant(selectedMerchant, {
                      status: selectedMerchant.status === "suspended" ? "active" : "suspended",
                    })
                  }
                >
                  {selectedMerchant.status === "suspended" ? "Reactivate Workspace" : "Suspend Workspace"}
                </Button>
              </Space>
            </Card>
          </div>
        )}
      </Drawer>

      {/* Reset Password Modal (Responsive width) */}
      <Modal
        title={`Reset Password for ${resetPassModalUser?.name || ""}`}
        open={Boolean(resetPassModalUser)}
        onCancel={() => setResetPassModalUser(null)}
        onOk={handleResetPassword}
        confirmLoading={resettingPassword}
        okText="Set New Password"
        centered
        width={isMobile ? "92%" : 480}
      >
        <Paragraph type="secondary">
          Enter a new password or leave blank to automatically generate a secure temporary password:
        </Paragraph>
        <div style={{ marginBottom: 12 }}>
          <Input.Password
            placeholder="Auto-generate or enter custom password (min 6 chars)"
            value={tempPassword}
            onChange={(e) => setTempPassword(e.target.value)}
          />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Switch checked={notifyOnWhatsApp} onChange={setNotifyOnWhatsApp} />
          <Text style={{ fontSize: 13 }}>Send temporary password to merchant via WhatsApp bot (+91 9279259690)</Text>
        </div>
      </Modal>

      {/* Support Conversation & Reply Drawer (Responsive width) */}
      <Drawer
        title={
          <Space>
            <MessageOutlined style={{ color: "#25D366" }} />
            <span>Chat: {activeThread?.name} ({formatDisplayPhone(activeChatPhone || "")})</span>
          </Space>
        }
        open={Boolean(activeChatPhone)}
        onClose={() => setActiveChatPhone(null)}
        width={isMobile ? "100%" : 540}
      >
        <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
          {/* Messages Feed */}
          <div style={{ flex: 1, overflowY: "auto", padding: "12px 0" }}>
            <List
              dataSource={[...(activeThread?.messages || [])].reverse()}
              renderItem={(m) => {
                const isOut = m.fromMe === "true" || m.fromMe === true;
                return (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: isOut ? "flex-end" : "flex-start",
                      marginBottom: 12,
                    }}
                  >
                    <div
                      style={{
                        maxWidth: isMobile ? "90%" : "80%",
                        padding: "10px 14px",
                        borderRadius: 12,
                        background: isOut ? "#dcf8c6" : "#ffffff",
                        border: "1px solid",
                        borderColor: isOut ? "#c7e8b4" : "#e5e7eb",
                        boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                      }}
                    >
                      <div style={{ fontSize: 11, fontWeight: 700, color: isOut ? "#059669" : "#3b82f6", marginBottom: 2 }}>
                        {isOut ? "Official Support (+91 92792 59690)" : `${activeThread?.name || "Customer"} (📱 ${formatDisplayPhone(activeThread?.phone || activeChatPhone || "")})`}
                      </div>
                      <div style={{ fontSize: 13, whiteSpace: "pre-wrap", color: "#1f2937" }}>{m.text}</div>
                      <div style={{ fontSize: 10, color: "#9ca3af", textAlign: "right", marginTop: 4 }}>
                        {m.timestamp ? new Date(m.timestamp).toLocaleTimeString() : ""}
                      </div>
                    </div>
                  </div>
                );
              }}
            />
          </div>

          {/* Quick Replies Buttons (Horizontal Scroll on Mobile) */}
          <div style={{ borderTop: "1px solid #f0f0f0", paddingTop: 10, marginBottom: 10 }}>
            <Text type="secondary" style={{ fontSize: 11, display: "block", marginBottom: 4 }}>Quick Canned Responses:</Text>
            <div style={{ overflowX: "auto", whiteSpace: "nowrap", paddingBottom: 4 }}>
              <Space size={6}>
                {CANNED_REPLIES.map((c, i) => (
                  <Button key={i} size="small" onClick={() => setReplyText(c.text)}>
                    {c.title}
                  </Button>
                ))}
              </Space>
            </div>
          </div>

          {/* Reply Input */}
          <div style={{ borderTop: "1px solid #f0f0f0", paddingTop: 10 }}>
            <Input.TextArea
              rows={isMobile ? 2 : 3}
              placeholder="Type official reply to send via +91 9279259690..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
            />
            <div style={{ marginTop: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Text type="secondary" style={{ fontSize: 11 }}>Via +91 9279259690</Text>
              <Button
                type="primary"
                icon={<SendOutlined />}
                loading={sendingReply}
                disabled={!replyText.trim()}
                style={{ background: "#25D366", borderColor: "#25D366", height: 36, fontWeight: 600 }}
                onClick={async () => {
                  if (!activeChatPhone || !replyText.trim()) return;
                  setSendingReply(true);
                  try {
                    await api.post("/api/admin/whatsapp/send-test", {
                      recipientPhone: activeChatPhone,
                      messageText: replyText.trim(),
                    });
                    message.success(`Reply sent to +${activeChatPhone}`);
                    setReplyText("");
                    loadSupportMessages();
                  } catch (err: any) {
                    message.error(err.message || "Failed to send support reply");
                  } finally {
                    setSendingReply(false);
                  }
                }}
              >
                Send Reply
              </Button>
            </div>
          </div>
        </div>
      </Drawer>

      {/* QR Code Modal for Support WhatsApp (Responsive width) */}
      <Modal
        title={
          <Space>
            <SafetyCertificateOutlined style={{ color: "#25D366" }} />
            <span>Link Official Support WhatsApp (+91 9279259690)</span>
          </Space>
        }
        open={qrModalVisible}
        onCancel={() => setQrModalVisible(false)}
        footer={null}
        centered
        width={isMobile ? "92%" : 420}
      >
        <div style={{ textAlign: "center", padding: "16px 0" }}>
          <Paragraph style={{ color: "#595959", marginBottom: 18 }}>
            Phone me WhatsApp open karein (<strong>9279259690</strong> wala SIM) $\rightarrow$ <strong>Settings / 3-dots</strong> $\rightarrow$ <strong>Linked Devices</strong> $\rightarrow$ <strong>Link a Device</strong> aur camera se is QR code ko scan karein.
          </Paragraph>

          {qrCode ? (
            <div style={{ display: "inline-block", padding: 12, border: "2px solid #25D366", borderRadius: 12, background: "#fff" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrCode} alt="WhatsApp QR Code" style={{ width: 250, height: 250, display: "block" }} />
            </div>
          ) : (
            <div style={{ height: 250, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
              <Spin size="large" />
              <Text type="secondary">Generating secure QR code for +91 9279259690...</Text>
            </div>
          )}

          <div style={{ marginTop: 20 }}>
            <Button onClick={handleConnectSupport} icon={<SyncOutlined />} loading={connecting}>
              Refresh QR Code
            </Button>
          </div>
        </div>
      </Modal>
    </AppLayout>
  );
}
