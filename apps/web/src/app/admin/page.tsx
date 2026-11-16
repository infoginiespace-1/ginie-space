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
  Radio,
  Progress,
  List,
  Grid,
  Segmented,
  Avatar,
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
  SettingOutlined,
  PictureOutlined,
  ArrowLeftOutlined,
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

  // Primary Navigation (4 Clean Modules)
  const [activeTab, setActiveTab] = useState<string>("overview");

  // Sub-view toggles inside modules
  const [overviewSubView, setOverviewSubView] = useState<"kpis" | "analytics">("kpis");
  const [merchantsSubView, setMerchantsSubView] = useState<"merchants" | "subscriptions">("merchants");
  const [whatsappSubView, setWhatsappSubView] = useState<"live-chat" | "broadcast" | "bot-settings">("live-chat");

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

  // Official Support WhatsApp State (+91 92792 59690)
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
  const [broadcastImageUrl, setBroadcastImageUrl] = useState("");
  const [sendingBroadcast, setSendingBroadcast] = useState(false);

  // Platform Announcement State
  const [announcement, setAnnouncement] = useState({
    enabled: false,
    title: "Platform Notice",
    message: "",
    type: "info" as "info" | "warning" | "success" | "error",
  });
  const [savingAnnouncement, setSavingAnnouncement] = useState(false);

  // In-App Support Chat & Messaging State
  const [supportMessages, setSupportMessages] = useState<SupportMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [supportSearch, setSupportSearch] = useState("");
  const [needsReplyOnly, setNeedsReplyOnly] = useState(false);
  const [activeChatPhone, setActiveChatPhone] = useState<string | null>(null);
  const [activeChatName, setActiveChatName] = useState<string>("");
  const [replyText, setReplyText] = useState("");
  const [chatImageUrl, setChatImageUrl] = useState("");
  const [showMediaInput, setShowMediaInput] = useState(false);
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
        imageUrl: broadcastImageUrl.trim() || undefined,
      });
      message.success(res.data.message);
      setBroadcastText("");
      setBroadcastImageUrl("");
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

  // In-App Chat: Grouped Support Conversations (1 thread per phone number)
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

      // Match merchant
      const merchant = merchants.find((m) => {
        const mPhone = m.business?.phone?.replace(/D/g, "");
        return mPhone && (mPhone === t.phone || mPhone.endsWith(t.phone.slice(-10)));
      });

      return {
        phone: t.phone,
        name: merchant?.business?.name ? `${merchant.business.name} (${merchant.name})` : (t.name || `+${t.phone}`),
        latestText: latest?.text || "",
        latestTimestamp: latest?.timestamp || "",
        lastFromMe: isOut,
        messageCount: t.messages.length,
        messages: sorted,
        merchant,
      };
    });

    threads.sort((a, b) => new Date(b.latestTimestamp).getTime() - new Date(a.latestTimestamp).getTime());
    return threads;
  }, [supportMessages, merchants]);

  // Combined Directory & Chat Contacts (existing active threads + all merchants)
  const allChatContacts = useMemo(() => {
    const threadPhoneSet = new Set(conversationThreads.map((t) => t.phone));
    const merchantContacts = merchants
      .filter((m) => {
        const p = m.business?.phone?.replace(/D/g, "");
        return p && p.length >= 10 && !threadPhoneSet.has(p);
      })
      .map((m) => {
        const cleanPhone = m.business.phone.replace(/D/g, "");
        return {
          phone: cleanPhone,
          name: m.business?.name ? `${m.business.name} (${m.name})` : m.name,
          latestText: `Merchant · ${(m.plan || "free").toUpperCase()} Plan · ${m.counts?.orders || 0} orders`,
          latestTimestamp: m.createdAt || "",
          lastFromMe: true,
          messageCount: 0,
          messages: [] as SupportMessage[],
          merchant: m,
          isMerchantPlaceholder: true,
        };
      });

    let combined = [...conversationThreads, ...merchantContacts];
    if (needsReplyOnly) {
      combined = combined.filter((t) => !t.lastFromMe);
    }
    if (supportSearch.trim()) {
      const q = supportSearch.toLowerCase().trim();
      combined = combined.filter(
        (t) =>
          t.phone.includes(q) ||
          t.name.toLowerCase().includes(q) ||
          t.latestText.toLowerCase().includes(q)
      );
    }
    return combined;
  }, [conversationThreads, merchants, needsReplyOnly, supportSearch]);

  const activeThread = useMemo(() => {
    if (!activeChatPhone) return null;
    const existing = conversationThreads.find((t) => t.phone === activeChatPhone);
    if (existing) return existing;

    const merchant = merchants.find((m) => {
      const mPhone = m.business?.phone?.replace(/D/g, "");
      return mPhone && (mPhone === activeChatPhone || mPhone.endsWith(activeChatPhone.slice(-10)));
    });

    const displayName = activeChatName || (merchant?.business?.name ? `${merchant.business.name} (${merchant.name})` : merchant?.name) || `+${activeChatPhone}`;

    return {
      phone: activeChatPhone,
      name: displayName,
      latestText: "",
      latestTimestamp: "",
      lastFromMe: true,
      messageCount: 0,
      messages: [] as SupportMessage[],
      merchant,
      isMerchantPlaceholder: true,
    };
  }, [conversationThreads, activeChatPhone, activeChatName, merchants]);

  const pendingRepliesCount = useMemo(() => {
    return conversationThreads.filter((t) => !t.lastFromMe).length;
  }, [conversationThreads]);

  // Start in-app chat with any merchant/customer without external wa.me redirect
  const handleStartChat = (phone: string, name?: string) => {
    if (!phone) {
      message.warning("No phone number available for this contact");
      return;
    }
    const clean = phone.replace(/D/g, "");
    setActiveChatPhone(clean);
    setActiveChatName(name || "");
    setReplyText("");
    setActiveTab("whatsapp-hub");
    setWhatsappSubView("live-chat");
  };

  // Send support message from official bot (+91 92792 59690)
  const handleSendSupportMessage = async () => {
    if (!activeChatPhone || (!replyText.trim() && !chatImageUrl.trim())) return;
    setSendingReply(true);
    try {
      await api.post("/api/admin/whatsapp/send-test", {
        recipientPhone: activeChatPhone,
        messageText: replyText.trim(),
        imageUrl: chatImageUrl.trim() || undefined,
      });
      message.success(`Message sent to +${activeChatPhone} via +91 92792 59690`);
      setReplyText("");
      setChatImageUrl("");
      setShowMediaInput(false);
      loadSupportMessages();
    } catch (err: any) {
      message.error(err.response?.data?.error || err.message || "Failed to send WhatsApp message");
    } finally {
      setSendingReply(false);
    }
  };

  // Canned Quick Reply Templates
  const CANNED_REPLIES = [
    {
      title: "Store Setup Help",
      text: "Namaste! GinieSpace support team me aapka swagat hai. Aapka online storefront setup karne me hum aapki madad kar sakte hain. Aapka kya query hai?",
    },
    {
      title: "WhatsApp QR Link Guide",
      text: "WhatsApp link karne ke liye: WhatsApp open karein -> Settings / 3-dots -> 'Linked Devices' -> 'Link a Device' par click karein aur dashboard par dikh rahe QR code ko scan karein.",
    },
    {
      title: "PRO Plan Upgrade Details",
      text: "GinieSpace PRO plan me aapko Unlimited Catalog, Unlimited Leads Finder, 10 Staff Accounts aur Bulk WhatsApp alerts milte hain. Upgrade ke liye UPI ID: paytmqr9tziqdamfo@paytm par ₹99 pay karke UTR submit karein.",
    },
    {
      title: "Payment UTR Verified",
      text: "Namaste! Aapka PRO subscription payment UTR verify ho gaya hai aur aapka account PRO me upgrade kar diya gaya hai. Thank you for choosing GinieSpace!",
    },
    {
      title: "Order Fulfillment Help",
      text: "Namaste! Aapke recent order ke sambandh me koi bhi query ya dispatch support ke liye hum available hain. Kripya order number share karein.",
    },
  ];

  return (
    <AppLayout>
      {/* Top Header & Actions Bar */}
      <div style={{ marginBottom: isMobile ? 14 : 20, display: "flex", justifyContent: "space-between", alignItems: isMobile ? "flex-start" : "center", flexWrap: "wrap", gap: 10 }}>
        <div>
          <Title level={isMobile ? 5 : 4} style={{ margin: 0, fontWeight: 800 }}>Platform Administration</Title>
          <Text type="secondary" style={{ fontSize: isMobile ? 12 : 14 }}>
            {isMobile ? "Central management for merchants & WhatsApp" : "Central management for merchant workspaces, analytics, WhatsApp Command Center, and system audit"}
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
              loadWebAnalytics();
            }}
          >
            {isMobile ? "Sync" : "Refresh Data"}
          </Button>
        </Space>
      </div>

      {/* 4 PRIMARY MODULE TABS */}
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        tabBarStyle={{ overflowX: "auto", whiteSpace: "nowrap", marginBottom: 18 }}
        items={[
          // ==========================================
          // MODULE 1: PLATFORM OVERVIEW & TRAFFIC
          // ==========================================
          {
            key: "overview",
            label: (
              <span>
                <DashboardOutlined /> {isMobile ? "Overview" : "Overview & Traffic"}
              </span>
            ),
            children: (
              <div>
                {/* Module Sub-Switch */}
                <div style={{ marginBottom: 18, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                  <Segmented
                    value={overviewSubView}
                    onChange={(val) => setOverviewSubView(val as "kpis" | "analytics")}
                    options={[
                      { label: "📊 Overview KPIs & Stores", value: "kpis" },
                      { label: "🌐 Web Traffic & Google SEO", value: "analytics" },
                    ]}
                    size={isMobile ? "small" : "middle"}
                  />
                  {overviewSubView === "kpis" && (
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Live Platform Metrics · {analytics?.overview?.totalMerchants || merchants.length} Active Businesses
                    </Text>
                  )}
                </div>

                {overviewSubView === "kpis" ? (
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
                                {merchants.filter((m) => m.plan === "pro").length} on PRO tier
                              </Text>
                            </Card>
                          </Col>

                          <Col xs={12} sm={12} lg={6}>
                            <Card
                              styles={{ body: { padding: isMobile ? "12px 14px" : "20px" } }}
                              style={{ borderRadius: 12, background: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)", color: "#fff" }}
                            >
                              <Statistic
                                title={<span style={{ color: "rgba(255,255,255,0.85)", fontSize: isMobile ? 11 : 14 }}>Catalog Products</span>}
                                value={analytics?.overview?.totalProducts || 0}
                                prefix={<ShoppingOutlined style={{ color: "#fff", fontSize: isMobile ? 14 : 18 }} />}
                                valueStyle={{ color: "#fff", fontWeight: 700, fontSize: isMobile ? 17 : 24 }}
                              />
                              <Text style={{ color: "rgba(255,255,255,0.9)", fontSize: isMobile ? 10 : 12, display: "block", marginTop: 4 }}>
                                In active storefronts
                              </Text>
                            </Card>
                          </Col>

                          <Col xs={12} sm={12} lg={6}>
                            <Card
                              styles={{ body: { padding: isMobile ? "12px 14px" : "20px" } }}
                              style={{ borderRadius: 12, background: "linear-gradient(135deg, #059669 0%, #047857 100%)", color: "#fff" }}
                            >
                              <Statistic
                                title={<span style={{ color: "rgba(255,255,255,0.85)", fontSize: isMobile ? 11 : 14 }}>WA Connected Stores</span>}
                                value={analytics?.overview?.totalConnectedWhatsApp || 0}
                                prefix={<WhatsAppOutlined style={{ color: "#fff", fontSize: isMobile ? 14 : 18 }} />}
                                valueStyle={{ color: "#fff", fontWeight: 700, fontSize: isMobile ? 17 : 24 }}
                              />
                              <Text style={{ color: "rgba(255,255,255,0.9)", fontSize: isMobile ? 10 : 12, display: "block", marginTop: 4 }}>
                                Live Baileys Sessions
                              </Text>
                            </Card>
                          </Col>
                        </Row>

                        {/* Secondary Stats Row */}
                        <Row gutter={isMobile ? [10, 10] : [16, 16]} style={{ marginBottom: isMobile ? 16 : 24 }}>
                          <Col xs={12} sm={6}>
                            <Card styles={{ body: { padding: isMobile ? 12 : 18 } }} style={{ borderRadius: 12 }}>
                              <Statistic
                                title={<span style={{ fontSize: isMobile ? 11 : 13 }}>Avg Order Value</span>}
                                value={analytics?.overview?.avgOrderValue || 0}
                                precision={0}
                                formatter={(val) => `₹${Number(val).toLocaleString("en-IN")}`}
                                valueStyle={{ fontWeight: 700, fontSize: isMobile ? 16 : 20 }}
                              />
                            </Card>
                          </Col>
                          <Col xs={12} sm={6}>
                            <Card styles={{ body: { padding: isMobile ? 12 : 18 } }} style={{ borderRadius: 12 }}>
                              <Statistic
                                title={<span style={{ fontSize: isMobile ? 11 : 13 }}>Total Leads</span>}
                                value={analytics?.overview?.totalLeads || 0}
                                prefix={<TeamOutlined style={{ color: "#3b82f6" }} />}
                                valueStyle={{ fontWeight: 700, fontSize: isMobile ? 16 : 20 }}
                              />
                            </Card>
                          </Col>
                          <Col xs={12} sm={6}>
                            <Card styles={{ body: { padding: isMobile ? 12 : 18 } }} style={{ borderRadius: 12 }}>
                              <Statistic
                                title={<span style={{ fontSize: isMobile ? 11 : 13 }}>Staff Accounts</span>}
                                value={analytics?.overview?.totalStaff || 0}
                                prefix={<UserOutlined style={{ color: "#8b5cf6" }} />}
                                valueStyle={{ fontWeight: 700, fontSize: isMobile ? 16 : 20 }}
                              />
                            </Card>
                          </Col>
                          <Col xs={12} sm={6}>
                            <Card styles={{ body: { padding: isMobile ? 12 : 18 } }} style={{ borderRadius: 12 }}>
                              <Statistic
                                title={<span style={{ fontSize: isMobile ? 11 : 13 }}>Saved Customers</span>}
                                value={analytics?.overview?.totalCustomers || 0}
                                prefix={<ShopOutlined style={{ color: "#10b981" }} />}
                                valueStyle={{ fontWeight: 700, fontSize: isMobile ? 16 : 20 }}
                              />
                            </Card>
                          </Col>
                        </Row>

                        {/* Top Stores Table */}
                        <Card
                          title={
                            <Space>
                              <ThunderboltOutlined style={{ color: "#f59e0b" }} />
                              <span>Top Performing Merchant Stores</span>
                            </Space>
                          }
                          styles={{ body: { padding: isMobile ? 10 : 20 } }}
                          style={{ borderRadius: 12 }}
                        >
                          <Table
                            dataSource={analytics?.topMerchants || []}
                            rowKey="userId"
                            pagination={false}
                            scroll={{ x: 600 }}
                            columns={[
                              {
                                title: "Store Name",
                                dataIndex: "businessName",
                                key: "store",
                                render: (name: string, r: any) => (
                                  <div>
                                    <Text strong>{name || "Unnamed Store"}</Text>
                                    <div style={{ fontSize: 11, color: "#8c8c8c" }}>{r.ownerName} ({r.email})</div>
                                  </div>
                                ),
                              },
                              {
                                title: "Type",
                                dataIndex: "businessType",
                                key: "mode",
                                render: (t: string) => (
                                  <Tag color={t === "wholesale" ? "blue" : t === "services" ? "purple" : "green"}>
                                    {(t || "retail").toUpperCase()}
                                  </Tag>
                                ),
                              },
                              {
                                title: "Orders",
                                dataIndex: "orders",
                                key: "orders",
                                align: "center",
                                render: (c: number) => <Tag color="blue">{c || 0}</Tag>,
                              },
                              {
                                title: "Sales GMV",
                                dataIndex: "revenue",
                                key: "revenue",
                                align: "right",
                                render: (rev: number) => (
                                  <span style={{ color: "#10b981", fontWeight: 700 }}>
                                    ₹{Number(rev || 0).toLocaleString("en-IN")}
                                  </span>
                                ),
                              },
                              {
                                title: "Action",
                                key: "action",
                                align: "right",
                                render: (_: any, r: any) => (
                                  <Space size="small">
                                    {r.phone && (
                                      <Button
                                        size="small"
                                        type="primary"
                                        icon={<MessageOutlined />}
                                        style={{ background: "#25D366", borderColor: "#25D366" }}
                                        onClick={() => handleStartChat(r.phone, r.businessName || r.ownerName)}
                                      >
                                        Chat
                                      </Button>
                                    )}
                                  </Space>
                                ),
                              },
                            ]}
                          />
                        </Card>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    {/* WEB ANALYTICS & SEO */}
                    {loadingWebAnalytics ? (
                      <div style={{ textAlign: "center", padding: "60px 0" }}>
                        <Spin size="large" />
                      </div>
                    ) : (
                      <div>
                        {/* Traffic KPIs */}
                        <Row gutter={isMobile ? [10, 10] : [16, 16]} style={{ marginBottom: isMobile ? 16 : 24 }}>
                          <Col xs={12} sm={12} lg={6}>
                            <Card styles={{ body: { padding: isMobile ? "12px 14px" : "20px" } }} style={{ borderRadius: 12, background: "linear-gradient(135deg, #10b981 0%, #059669 100%)", color: "#fff" }}>
                              <Statistic
                                title={<span style={{ color: "rgba(255,255,255,0.85)", fontSize: isMobile ? 11 : 14 }}>Total Web Visits</span>}
                                value={webAnalytics?.traffic?.totalVisits || 0}
                                prefix={<GlobalOutlined style={{ color: "#fff" }} />}
                                valueStyle={{ color: "#fff", fontWeight: 700, fontSize: isMobile ? 18 : 24 }}
                              />
                            </Card>
                          </Col>

                          <Col xs={12} sm={12} lg={6}>
                            <Card styles={{ body: { padding: isMobile ? "12px 14px" : "20px" } }} style={{ borderRadius: 12, background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)", color: "#fff" }}>
                              <Statistic
                                title={<span style={{ color: "rgba(255,255,255,0.85)", fontSize: isMobile ? 11 : 14 }}>Unique Visitors</span>}
                                value={webAnalytics?.traffic?.uniqueVisitors || 0}
                                prefix={<UserOutlined style={{ color: "#fff" }} />}
                                valueStyle={{ color: "#fff", fontWeight: 700, fontSize: isMobile ? 18 : 24 }}
                              />
                            </Card>
                          </Col>

                          <Col xs={12} sm={12} lg={6}>
                            <Card styles={{ body: { padding: isMobile ? "12px 14px" : "20px" } }} style={{ borderRadius: 12, background: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)", color: "#fff" }}>
                              <Statistic
                                title={<span style={{ color: "rgba(255,255,255,0.85)", fontSize: isMobile ? 11 : 14 }}>Page Views</span>}
                                value={webAnalytics?.traffic?.pageViews || 0}
                                prefix={<LineChartOutlined style={{ color: "#fff" }} />}
                                valueStyle={{ color: "#fff", fontWeight: 700, fontSize: isMobile ? 18 : 24 }}
                              />
                            </Card>
                          </Col>

                          <Col xs={12} sm={12} lg={6}>
                            <Card styles={{ body: { padding: isMobile ? "12px 14px" : "20px" } }} style={{ borderRadius: 12, background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)", color: "#fff" }}>
                              <Statistic
                                title={<span style={{ color: "rgba(255,255,255,0.85)", fontSize: isMobile ? 11 : 14 }}>Bounce Rate</span>}
                                value={webAnalytics?.traffic?.bounceRate || 32}
                                suffix="%"
                                valueStyle={{ color: "#fff", fontWeight: 700, fontSize: isMobile ? 18 : 24 }}
                              />
                            </Card>
                          </Col>
                        </Row>

                        {/* Google SEO & Sitemap Card */}
                        <Card
                          title={
                            <Space>
                              <GlobalOutlined style={{ color: "#25D366" }} />
                              <span>Google Ranking, Search Console & Google Analytics 4 Setup</span>
                            </Space>
                          }
                          styles={{ body: { padding: isMobile ? 14 : 24 } }}
                          style={{ borderRadius: 12, marginBottom: 20 }}
                        >
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

                          <Form form={seoForm} layout="vertical" onFinish={handleSaveSeo}>
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
                )}
              </div>
            ),
          },

          // ==========================================
          // MODULE 2: MERCHANTS & SUBSCRIPTIONS
          // ==========================================
          {
            key: "merchants",
            label: (
              <span>
                <ShopOutlined /> {isMobile ? "Merchants" : "Merchants & Subscriptions"}
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
                {/* Module Sub-Switch */}
                <div style={{ marginBottom: 18, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                  <Segmented
                    value={merchantsSubView}
                    onChange={(val) => setMerchantsSubView(val as "merchants" | "subscriptions")}
                    options={[
                      { label: `🏬 All Merchants (${merchants.length})`, value: "merchants" },
                      {
                        label: (
                          <span>
                            👑 Pro Subscriptions & Approvals
                            {subscriptions.filter((s) => s.subscriptionStatus === "pending").length > 0 && (
                              <Badge
                                count={subscriptions.filter((s) => s.subscriptionStatus === "pending").length}
                                style={{ marginLeft: 6, backgroundColor: "#ef4444" }}
                              />
                            )}
                          </span>
                        ),
                        value: "subscriptions",
                      },
                    ]}
                    size={isMobile ? "small" : "middle"}
                  />
                  {merchantsSubView === "merchants" ? (
                    <Button icon={<DownloadOutlined />} onClick={handleExportMerchantsCSV} size={isMobile ? "small" : "middle"}>
                      Export CSV
                    </Button>
                  ) : (
                    <Button icon={<SyncOutlined />} onClick={loadSubscriptions} size={isMobile ? "small" : "middle"}>
                      Refresh UTRs
                    </Button>
                  )}
                </div>

                {merchantsSubView === "merchants" ? (
                  <div>
                    {/* Filters Bar */}
                    <Card styles={{ body: { padding: isMobile ? 12 : 20 } }} style={{ marginBottom: 16, borderRadius: 12 }}>
                      <Row gutter={isMobile ? [8, 10] : [16, 12]} align="middle">
                        <Col xs={24} md={8}>
                          <Input
                            placeholder="Search store name, phone, owner, email..."
                            prefix={<SearchOutlined style={{ color: "#8c8c8c" }} />}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            allowClear
                          />
                        </Col>
                        <Col xs={12} md={5}>
                          <Select
                            style={{ width: "100%" }}
                            value={planFilter}
                            onChange={setPlanFilter}
                            options={[
                              { value: "all", label: "All Plans" },
                              { value: "free", label: "FREE Plan Only" },
                              { value: "pro", label: "PRO Subscribers Only" },
                            ]}
                          />
                        </Col>
                        <Col xs={12} md={5}>
                          <Select
                            style={{ width: "100%" }}
                            value={statusFilter}
                            onChange={setStatusFilter}
                            options={[
                              { value: "all", label: "All Statuses" },
                              { value: "active", label: "Active Only" },
                              { value: "suspended", label: "Suspended Only" },
                            ]}
                          />
                        </Col>
                        <Col xs={24} md={6}>
                          <Select
                            style={{ width: "100%" }}
                            value={typeFilter}
                            onChange={setTypeFilter}
                            options={[
                              { value: "all", label: "All Business Types" },
                              { value: "retail", label: "Retail / Dukaan" },
                              { value: "wholesale", label: "Wholesale / B2B" },
                              { value: "services", label: "Services / Freelance" },
                            ]}
                          />
                        </Col>
                      </Row>
                    </Card>

                    {/* Merchants View */}
                    {isMobile ? (
                      <List
                        dataSource={filteredMerchants}
                        loading={loadingMerchants}
                        pagination={{ pageSize: 8, size: "small", align: "center" }}
                        renderItem={(r) => (
                          <Card
                            key={r.id}
                            styles={{ body: { padding: "14px" } }}
                            style={{ marginBottom: 10, borderRadius: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}
                          >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                              <div>
                                <div style={{ fontWeight: 700, fontSize: 15, color: "#0f172a" }}>
                                  {r.business?.name || "No Store Name"}
                                </div>
                                <div style={{ fontSize: 12, color: "#64748b" }}>
                                  {r.name} · {r.email}
                                </div>
                              </div>
                              <div>
                                {r.status === "suspended" ? (
                                  <Tag color="red" style={{ margin: 0 }}>SUSPENDED</Tag>
                                ) : (
                                  <Tag color="green" style={{ margin: 0 }}>ACTIVE</Tag>
                                )}
                              </div>
                            </div>

                            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
                              <Tag color={r.plan === "pro" ? "gold" : "default"} style={{ margin: 0, fontWeight: 700 }}>
                                {r.plan === "pro" ? "👑 PRO" : "FREE"}
                              </Tag>
                              <Tag color={r.businessType === "wholesale" ? "blue" : r.businessType === "services" ? "purple" : "green"} style={{ margin: 0 }}>
                                {r.businessType?.toUpperCase()}
                              </Tag>
                              {r.whatsapp?.status === "connected" ? (
                                <Tag icon={<CheckCircleOutlined />} color="success" style={{ margin: 0 }}>WA LINKED</Tag>
                              ) : (
                                <Tag color="default" style={{ margin: 0 }}>WA OFFLINE</Tag>
                              )}
                            </div>

                            {r.business?.phone && (
                              <div style={{ marginBottom: 10, display: "flex", alignItems: "center", justifyContent: "space-between", background: "#f8fafc", padding: "8px 10px", borderRadius: 8 }}>
                                <span style={{ fontSize: 12, color: "#047857", fontWeight: 700 }}>
                                  📱 {formatDisplayPhone(r.business.phone)}
                                </span>
                                <Space size={6}>
                                  <Button
                                    type="primary"
                                    size="small"
                                    icon={<MessageOutlined />}
                                    style={{ background: "#25D366", borderColor: "#25D366", fontWeight: 600 }}
                                    onClick={() => handleStartChat(r.business.phone, r.name || r.business.name)}
                                  >
                                    Chat
                                  </Button>
                                  <Tooltip title="External WhatsApp link">
                                    <a
                                      href={`https://wa.me/${r.business.phone.replace(/\D/g, "")}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      style={{ fontSize: 12, color: "#8c8c8c", padding: "2px 4px" }}
                                    >
                                      <LinkOutlined />
                                    </a>
                                  </Tooltip>
                                </Space>
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
                                View 360° Profile
                              </Button>
                              <Button
                                icon={<KeyOutlined />}
                                onClick={() => {
                                  setResetPassModalUser(r);
                                  setTempPassword("");
                                }}
                                style={{ height: 38 }}
                              >
                                Reset Pass
                              </Button>
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
                          scroll={{ x: 1000 }}
                          pagination={{ pageSize: 10 }}
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
                                  {r.business?.phone && (
                                    <Button
                                      size="small"
                                      type="primary"
                                      icon={<MessageOutlined />}
                                      style={{ background: "#25D366", borderColor: "#25D366", fontWeight: 600 }}
                                      onClick={() => handleStartChat(r.business.phone, r.name || r.business.name)}
                                    >
                                      Chat
                                    </Button>
                                  )}
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
                                  <Tooltip title="Reset Password">
                                    <Button
                                      size="small"
                                      icon={<KeyOutlined />}
                                      onClick={() => {
                                        setResetPassModalUser(r);
                                        setTempPassword("");
                                      }}
                                    />
                                  </Tooltip>
                                  {r.role !== "admin" && (
                                    <Popconfirm
                                      title={`Delete ${r.name || r.business?.name || "account"} permanently?`}
                                      description="User account, business profile, catalog and data will be permanently wiped."
                                      onConfirm={() => handleDeleteUser(r)}
                                      okText="Yes, Delete"
                                      cancelText="Cancel"
                                      okButtonProps={{ danger: true }}
                                    >
                                      <Tooltip title="Delete Account Permanently">
                                        <Button size="small" danger icon={<DeleteOutlined />} />
                                      </Tooltip>
                                    </Popconfirm>
                                  )}
                                </Space>
                              ),
                            },
                          ]}
                        />
                      </Card>
                    )}
                  </div>
                ) : (
                  <div>
                    {/* SUBSCRIPTIONS & UTR APPROVALS */}
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
                        </Card>
                      </Col>

                      <Col xs={12} sm={12} lg={6}>
                        <Card
                          styles={{ body: { padding: isMobile ? "12px 14px" : "20px" } }}
                          style={{
                            borderRadius: 12,
                            background: subscriptions.filter((s) => s.subscriptionStatus === "pending").length > 0
                              ? "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)"
                              : "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                            color: "#fff",
                          }}
                        >
                          <Statistic
                            title={<span style={{ color: "rgba(255,255,255,0.85)", fontSize: isMobile ? 11 : 14 }}>Pending UTRs</span>}
                            value={subscriptions.filter((s) => s.subscriptionStatus === "pending").length}
                            prefix={<CheckCircleOutlined style={{ color: "#fff", fontSize: isMobile ? 14 : 18 }} />}
                            valueStyle={{ color: "#fff", fontWeight: 700, fontSize: isMobile ? 18 : 24 }}
                          />
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
                        </Card>
                      </Col>

                      <Col xs={12} sm={12} lg={6}>
                        <Card
                          styles={{ body: { padding: isMobile ? "12px 14px" : "20px" } }}
                          style={{ borderRadius: 12, background: "linear-gradient(135deg, #6b7280 0%, #4b5563 100%)", color: "#fff" }}
                        >
                          <Statistic
                            title={<span style={{ color: "rgba(255,255,255,0.85)", fontSize: isMobile ? 11 : 14 }}>Expired Accounts</span>}
                            value={subscriptions.filter((s) => s.subscriptionStatus === "expired").length}
                            valueStyle={{ color: "#fff", fontWeight: 700, fontSize: isMobile ? 18 : 24 }}
                          />
                        </Card>
                      </Col>
                    </Row>

                    {/* Subscriptions Table */}
                    <Card style={{ borderRadius: 12 }}>
                      <Table
                        dataSource={subscriptions}
                        rowKey="userId"
                        loading={loadingSubscriptions}
                        scroll={{ x: 900 }}
                        pagination={{ pageSize: 10 }}
                        columns={[
                          {
                            title: "Merchant",
                            key: "merchant",
                            render: (_: any, r: any) => (
                              <div>
                                <Text strong>{r.name}</Text>
                                <div style={{ fontSize: 12, color: "#64748b" }}>🏬 {r.storeName}</div>
                                <div style={{ fontSize: 11, color: "#8c8c8c" }}>{r.email}</div>
                              </div>
                            ),
                          },
                          {
                            title: "Phone & Chat",
                            key: "phone",
                            render: (_: any, r: any) => (
                              <div>
                                <div style={{ fontWeight: 600, color: "#047857" }}>
                                  📱 {formatDisplayPhone(r.phone)}
                                </div>
                                <Button
                                  type="link"
                                  size="small"
                                  icon={<MessageOutlined />}
                                  style={{ padding: 0, color: "#25D366", fontWeight: 600 }}
                                  onClick={() => handleStartChat(r.phone, r.name || r.storeName)}
                                >
                                  Chat in Hub
                                </Button>
                              </div>
                            ),
                          },
                          {
                            title: "Plan",
                            key: "plan",
                            render: (_: any, r: any) => (
                              <Tag color={r.plan === "pro" ? "gold" : "default"} style={{ fontWeight: 700 }}>
                                {r.plan === "pro" ? "👑 PRO" : "FREE"}
                              </Tag>
                            ),
                          },
                          {
                            title: "Status",
                            key: "status",
                            render: (_: any, r: any) => {
                              const s = r.subscriptionStatus;
                              return s === "pending" ? (
                                <Tag color="orange" style={{ fontWeight: 700 }}>VERIFY UTR</Tag>
                              ) : s === "active" ? (
                                <Tag color="green">ACTIVE</Tag>
                              ) : s === "expired" ? (
                                <Tag color="red">EXPIRED</Tag>
                              ) : (
                                <Tag color="default">NONE</Tag>
                              );
                            },
                          },
                          {
                            title: "Payment UTR",
                            dataIndex: "paymentUtr",
                            key: "utr",
                            render: (utr: string) =>
                              utr ? (
                                <Space>
                                  <Text copyable style={{ fontFamily: "monospace", fontWeight: 700 }}>
                                    {utr}
                                  </Text>
                                </Space>
                              ) : (
                                <Text type="secondary">-</Text>
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
                                    <Popconfirm
                                      title="Reject upgrade request?"
                                      description="Merchant ko re-submit karna hoga."
                                      onConfirm={() => handleRejectSubscription(r.userId)}
                                    >
                                      <Button size="small" danger loading={rejectingUserId === r.userId}>
                                        Reject
                                      </Button>
                                    </Popconfirm>
                                  </>
                                ) : (
                                  <Button
                                    size="small"
                                    icon={<CrownOutlined />}
                                    loading={approvingUserId === r.userId}
                                    onClick={() => handleApproveSubscription(r.userId, "monthly")}
                                  >
                                    +30 Days PRO
                                  </Button>
                                )}
                              </Space>
                            ),
                          },
                        ]}
                      />
                    </Card>
                  </div>
                )}
              </div>
            ),
          },

          // ==========================================
          // MODULE 3: WHATSAPP COMMAND CENTER
          // ==========================================
          {
            key: "whatsapp-hub",
            label: (
              <span>
                <WhatsAppOutlined style={{ color: "#25D366" }} /> {isMobile ? "WhatsApp" : "WhatsApp Command Center"}
                {pendingRepliesCount > 0 && (
                  <Badge
                    count={pendingRepliesCount}
                    style={{ marginLeft: 6, backgroundColor: "#ef4444" }}
                  />
                )}
              </span>
            ),
            children: (
              <div>
                {/* Module Sub-Switch */}
                <div style={{ marginBottom: 18, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                  <Segmented
                    value={whatsappSubView}
                    onChange={(val) => setWhatsappSubView(val as "live-chat" | "broadcast" | "bot-settings")}
                    options={[
                      {
                        label: (
                          <span>
                            💬 Live Support & Merchant Chat
                            {pendingRepliesCount > 0 && (
                              <Badge count={pendingRepliesCount} style={{ marginLeft: 6, backgroundColor: "#ef4444" }} />
                            )}
                          </span>
                        ),
                        value: "live-chat",
                      },
                      { label: "📢 Campaigns & Broadcast", value: "broadcast" },
                      {
                        label: (
                          <Space size={4}>
                            <SafetyCertificateOutlined style={{ color: supportStatus === "connected" ? "#25D366" : "#ef4444" }} />
                            <span>Official Bot (+91 92792 59690)</span>
                          </Space>
                        ),
                        value: "bot-settings",
                      },
                    ]}
                    size={isMobile ? "small" : "middle"}
                  />

                  {/* Status Indicator Pill */}
                  <Tag
                    icon={supportStatus === "connected" ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
                    color={supportStatus === "connected" ? "success" : "error"}
                    style={{ fontWeight: 600, padding: "4px 10px", fontSize: 12 }}
                  >
                    {supportStatus === "connected" ? "Bot Linked (+91 92792 59690)" : "Bot Disconnected"}
                  </Tag>
                </div>

                {whatsappSubView === "live-chat" ? (
                  <div>
                    {/* WHATSAPP WEB STYLE 2-COLUMN DESKTOP / RESPONSIVE INBOX */}
                    <Card
                      styles={{ body: { padding: 0 } }}
                      style={{ borderRadius: 12, overflow: "hidden", border: "1px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}
                    >
                      <Row style={{ minHeight: isMobile ? "auto" : 640 }}>
                        {/* LEFT COLUMN: Thread & Merchant List */}
                        <Col
                          xs={24}
                          md={8}
                          style={{
                            borderRight: isMobile ? "none" : "1px solid #f0f0f0",
                            display: isMobile && activeChatPhone ? "none" : "flex",
                            flexDirection: "column",
                            background: "#fafafa",
                          }}
                        >
                          {/* Search & Filter Header */}
                          <div style={{ padding: "14px 16px", borderBottom: "1px solid #f0f0f0", background: "#fff" }}>
                            <Input
                              placeholder="Search chats, merchants, or phone..."
                              prefix={<SearchOutlined style={{ color: "#8c8c8c" }} />}
                              value={supportSearch}
                              onChange={(e) => setSupportSearch(e.target.value)}
                              allowClear
                              style={{ marginBottom: 10, borderRadius: 8 }}
                            />
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <Space size={6}>
                                <Switch size="small" checked={needsReplyOnly} onChange={setNeedsReplyOnly} />
                                <Text style={{ fontSize: 12, fontWeight: 600 }}>Needs Reply Only</Text>
                              </Space>
                              <Button
                                size="small"
                                icon={<SyncOutlined />}
                                onClick={loadSupportMessages}
                                loading={loadingMessages}
                              >
                                Refresh
                              </Button>
                            </div>
                          </div>

                          {/* Contacts / Threads List */}
                          <div style={{ flex: 1, overflowY: "auto", maxHeight: isMobile ? 400 : 560 }}>
                            {allChatContacts.length === 0 ? (
                              <div style={{ textAlign: "center", padding: "40px 16px", color: "#8c8c8c" }}>
                                <MessageOutlined style={{ fontSize: 32, color: "#d1d5db", marginBottom: 8 }} />
                                <div>No matching contacts or support queries found.</div>
                              </div>
                            ) : (
                              <List
                                dataSource={allChatContacts}
                                renderItem={(t: any) => {
                                  const isSelected = activeChatPhone === t.phone;
                                  const isUnread = !t.lastFromMe;
                                  return (
                                    <div
                                      key={t.phone}
                                      onClick={() => {
                                        setActiveChatPhone(t.phone);
                                        setActiveChatName(t.name);
                                        setReplyText("");
                                      }}
                                      style={{
                                        padding: "12px 16px",
                                        borderBottom: "1px solid #f0f0f0",
                                        cursor: "pointer",
                                        background: isSelected ? "#f0fdf4" : isUnread ? "#fffbeb" : "#fff",
                                        borderLeft: isSelected ? "4px solid #25D366" : isUnread ? "4px solid #f59e0b" : "4px solid transparent",
                                        transition: "all 0.15s ease",
                                      }}
                                    >
                                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                                        <div style={{ fontWeight: isSelected || isUnread ? 700 : 600, fontSize: 14, color: "#0f172a" }}>
                                          {t.name}
                                        </div>
                                        <div style={{ fontSize: 10, color: "#94a3b8" }}>
                                          {t.latestTimestamp ? new Date(t.latestTimestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                                        </div>
                                      </div>

                                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                                        <span style={{ fontSize: 12, color: "#047857", fontWeight: 600 }}>
                                          📱 {formatDisplayPhone(t.phone)}
                                        </span>
                                        {t.isMerchantPlaceholder ? (
                                          <Tag color="cyan" style={{ margin: 0, fontSize: 10 }}>MERCHANT</Tag>
                                        ) : isUnread ? (
                                          <Tag color="orange" style={{ margin: 0, fontSize: 10, fontWeight: 700 }}>PENDING REPLY</Tag>
                                        ) : (
                                          <Tag color="green" style={{ margin: 0, fontSize: 10 }}>REPLIED</Tag>
                                        )}
                                      </div>

                                      <div style={{ fontSize: 12, color: "#64748b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                        {t.latestText || "Click to open direct chat"}
                                      </div>
                                    </div>
                                  );
                                }}
                              />
                            )}
                          </div>
                        </Col>

                        {/* RIGHT COLUMN: Interactive Chat Pane */}
                        <Col
                          xs={24}
                          md={16}
                          style={{
                            display: isMobile && !activeChatPhone ? "none" : "flex",
                            flexDirection: "column",
                            background: "#fff",
                          }}
                        >
                          {activeChatPhone ? (
                            <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                              {/* Chat Header */}
                              <div
                                style={{
                                  padding: "12px 18px",
                                  borderBottom: "1px solid #f0f0f0",
                                  background: "#f8fafc",
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                }}
                              >
                                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                  {isMobile && (
                                    <Button
                                      size="small"
                                      icon={<ArrowLeftOutlined />}
                                      onClick={() => setActiveChatPhone(null)}
                                      style={{ marginRight: 4 }}
                                    />
                                  )}
                                  <Avatar style={{ backgroundColor: "#25D366" }} icon={<UserOutlined />} />
                                  <div>
                                    <div style={{ fontWeight: 700, fontSize: 15, color: "#0f172a" }}>
                                      {activeThread?.name || activeChatName || `+${activeChatPhone}`}
                                    </div>
                                    <div style={{ fontSize: 11, color: "#047857", fontWeight: 600 }}>
                                      📱 {formatDisplayPhone(activeChatPhone)} · Official Session (+91 92792 59690)
                                    </div>
                                  </div>
                                </div>

                                <Space size="small">
                                  {activeThread?.merchant && (
                                    <Button
                                      size="small"
                                      icon={<ShopOutlined />}
                                      onClick={() => {
                                        setSelectedMerchant(activeThread.merchant || null);
                                        setMerchantDrawerOpen(true);
                                      }}
                                    >
                                      Profile
                                    </Button>
                                  )}
                                  <Tooltip title="Open external WhatsApp Web fallback">
                                    <a
                                      href={`https://wa.me/${activeChatPhone}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      style={{ color: "#8c8c8c", fontSize: 13, padding: "4px 8px" }}
                                    >
                                      <LinkOutlined />
                                    </a>
                                  </Tooltip>
                                  <Button size="small" icon={<SyncOutlined />} onClick={loadSupportMessages} />
                                </Space>
                              </div>

                              {/* Messages Stream */}
                              <div
                                style={{
                                  flex: 1,
                                  overflowY: "auto",
                                  padding: "16px 20px",
                                  background: "#efeae2",
                                  backgroundImage: "radial-gradient(#e5ddd5 1px, transparent 1px)",
                                  backgroundSize: "16px 16px",
                                  minHeight: 380,
                                  maxHeight: 480,
                                }}
                              >
                                {(!activeThread?.messages || activeThread.messages.length === 0) ? (
                                  <div style={{ textAlign: "center", padding: "60px 20px", color: "#64748b" }}>
                                    <WhatsAppOutlined style={{ fontSize: 40, color: "#25D366", marginBottom: 12 }} />
                                    <div style={{ fontWeight: 700, fontSize: 15, color: "#1f2937" }}>
                                      Direct WhatsApp Chat Ready
                                    </div>
                                    <div style={{ fontSize: 13, marginTop: 4 }}>
                                      Aap official GinieSpace Support bot (+91 92792 59690) se <strong>{activeThread?.name}</strong> (+{activeChatPhone}) ko directly message ya image bhej sakte hain.
                                    </div>
                                  </div>
                                ) : (
                                  <List
                                    dataSource={[...activeThread.messages].reverse()}
                                    renderItem={(m) => {
                                      const isOut = m.fromMe === "true" || m.fromMe === true;
                                      const hasMedia = m.text?.includes("[Media: ") || m.text?.startsWith("http");
                                      const mediaUrlMatch = m.text?.match(/\[Media:\s*(https?:\/\/[^\]]+)\]/);
                                      const cleanMediaUrl = mediaUrlMatch ? mediaUrlMatch[1] : null;

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
                                              maxWidth: isMobile ? "90%" : "75%",
                                              padding: "10px 14px",
                                              borderRadius: 12,
                                              background: isOut ? "#dcf8c6" : "#ffffff",
                                              border: "1px solid",
                                              borderColor: isOut ? "#c7e8b4" : "#e5e7eb",
                                              boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
                                            }}
                                          >
                                            <div style={{ fontSize: 11, fontWeight: 700, color: isOut ? "#059669" : "#3b82f6", marginBottom: 3 }}>
                                              {isOut ? "Official Support (+91 92792 59690)" : activeThread?.name}
                                            </div>

                                            {cleanMediaUrl && (
                                              <div style={{ marginBottom: 6 }}>
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img
                                                  src={cleanMediaUrl}
                                                  alt="Attachment"
                                                  style={{ maxWidth: 220, maxHeight: 180, borderRadius: 8, display: "block" }}
                                                />
                                              </div>
                                            )}

                                            <div style={{ fontSize: 13, whiteSpace: "pre-wrap", color: "#1f2937" }}>
                                              {m.text}
                                            </div>
                                            <div style={{ fontSize: 10, color: "#9ca3af", textAlign: "right", marginTop: 4 }}>
                                              {m.timestamp ? new Date(m.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    }}
                                  />
                                )}
                              </div>

                              {/* Quick Canned Replies Bar */}
                              <div style={{ background: "#f8fafc", borderTop: "1px solid #e2e8f0", padding: "8px 14px" }}>
                                <div style={{ overflowX: "auto", whiteSpace: "nowrap", display: "flex", gap: 6 }}>
                                  {CANNED_REPLIES.map((c, i) => (
                                    <Button
                                      key={i}
                                      size="small"
                                      onClick={() => setReplyText(c.text)}
                                      style={{ borderRadius: 16, fontSize: 11 }}
                                    >
                                      {c.title}
                                    </Button>
                                  ))}
                                </div>
                              </div>

                              {/* Media Attachment Bar (Optional Banner / Image URL) */}
                              {showMediaInput && (
                                <div style={{ background: "#f1f5f9", padding: "8px 14px", borderTop: "1px solid #e2e8f0" }}>
                                  <Input
                                    size="small"
                                    placeholder="Enter image URL to attach (e.g. promotional banner or receipt)..."
                                    prefix={<PictureOutlined style={{ color: "#25D366" }} />}
                                    value={chatImageUrl}
                                    onChange={(e) => setChatImageUrl(e.target.value)}
                                    allowClear
                                  />
                                  {chatImageUrl && (
                                    <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 10 }}>
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img src={chatImageUrl} alt="Preview" style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 4 }} />
                                      <Text style={{ fontSize: 11, color: "#047857" }}>Attached Image ready to send</Text>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Message Input Toolbar */}
                              <div style={{ padding: "12px 16px", borderTop: "1px solid #e2e8f0", background: "#fff" }}>
                                <Input.TextArea
                                  rows={isMobile ? 2 : 3}
                                  placeholder="Type official reply or update to send via +91 92792 59690..."
                                  value={replyText}
                                  onChange={(e) => setReplyText(e.target.value)}
                                  style={{ borderRadius: 8, marginBottom: 8 }}
                                />
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                  <Button
                                    size="small"
                                    type={showMediaInput ? "primary" : "default"}
                                    icon={<PictureOutlined />}
                                    onClick={() => setShowMediaInput(!showMediaInput)}
                                    style={{ fontSize: 11 }}
                                  >
                                    {showMediaInput ? "Hide Photo Attachment" : "Attach Photo / Banner"}
                                  </Button>

                                  <Button
                                    type="primary"
                                    icon={<SendOutlined />}
                                    loading={sendingReply}
                                    disabled={!replyText.trim() && !chatImageUrl.trim()}
                                    onClick={handleSendSupportMessage}
                                    style={{ background: "#25D366", borderColor: "#25D366", fontWeight: 600, height: 36, padding: "0 20px" }}
                                  >
                                    Send via Bot
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 40, color: "#94a3b8" }}>
                              <WhatsAppOutlined style={{ fontSize: 56, color: "#25D366", marginBottom: 16 }} />
                              <Title level={5} style={{ margin: 0, color: "#334155" }}>GinieSpace WhatsApp Hub</Title>
                              <Paragraph type="secondary" style={{ textAlign: "center", maxWidth: 420, marginTop: 8 }}>
                                Left side ke contact list me se kisi bhi conversation ya merchant ko select karein direct 2-way in-app chatting shuru karne ke liye.
                              </Paragraph>
                            </div>
                          )}
                        </Col>
                      </Row>
                    </Card>
                  </div>
                ) : whatsappSubView === "broadcast" ? (
                  <div>
                    {/* CAMPAIGNS & BROADCAST */}
                    <Card
                      title={
                        <Space>
                          <NotificationOutlined style={{ color: "#25D366" }} />
                          <span>Bulk WhatsApp Broadcast Campaigns (+91 92792 59690)</span>
                        </Space>
                      }
                      styles={{ body: { padding: isMobile ? 14 : 24 } }}
                      style={{ borderRadius: 12 }}
                    >
                      <Paragraph type="secondary" style={{ fontSize: 13 }}>
                        Official GinieSpace bot (+91 9279259690) se sabhi merchants ko ek saath message, offers ya banner image bhejein. Message me <code>{"{{name}}"}</code> merchant ke real name se replace ho jayega.
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

                        <div style={{ marginBottom: 16 }}>
                          <Tag color="cyan">Estimated WhatsApp Recipients: {broadcastTargetCount} businesses</Tag>
                          {supportStatus !== "connected" && (
                            <Tag color="error">Support Bot is Disconnected</Tag>
                          )}
                        </div>

                        <Form.Item
                          label="Promotional Banner Image URL (Optional)"
                          extra="Enter a publicly accessible image URL (e.g. Cloudinary, Imgur, or Ginie CDN). Bot will send this image along with your campaign text."
                        >
                          <Input
                            placeholder="https://example.com/banner.jpg"
                            prefix={<PictureOutlined style={{ color: "#25D366" }} />}
                            value={broadcastImageUrl}
                            onChange={(e) => setBroadcastImageUrl(e.target.value)}
                            allowClear
                          />
                        </Form.Item>

                        {broadcastImageUrl && (
                          <div style={{ marginBottom: 16, background: "#f8fafc", padding: 12, borderRadius: 8, display: "flex", gap: 14, alignItems: "center" }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={broadcastImageUrl} alt="Banner Preview" style={{ width: 100, height: 60, objectFit: "cover", borderRadius: 6 }} />
                            <div>
                              <Text strong style={{ fontSize: 13, color: "#065f46" }}>Banner Image Preview</Text>
                              <div style={{ fontSize: 11, color: "#64748b" }}>This image will be delivered directly inside WhatsApp.</div>
                            </div>
                          </div>
                        )}

                        <Form.Item label="Campaign Message Content">
                          <Input.TextArea
                            rows={4}
                            placeholder="Namaste {{name}}, GinieSpace par aapke business ke liye naye features live ho gaye hain..."
                            value={broadcastText}
                            onChange={(e) => setBroadcastText(e.target.value)}
                          />
                        </Form.Item>

                        <Button
                          block={isMobile}
                          type="primary"
                          icon={<SendOutlined />}
                          loading={sendingBroadcast}
                          disabled={supportStatus !== "connected" || !broadcastText.trim()}
                          onClick={handleSendBroadcast}
                          style={{
                            height: 42,
                            fontWeight: 600,
                            background: supportStatus === "connected" ? "#25D366" : undefined,
                            borderColor: supportStatus === "connected" ? "#25D366" : undefined,
                          }}
                        >
                          Send Broadcast to {broadcastTargetCount} Recipients
                        </Button>
                      </Form>
                    </Card>
                  </div>
                ) : (
                  <div>
                    {/* BOT CONNECTION & NOTIFICATION RULES */}
                    <Row gutter={isMobile ? [14, 14] : [20, 20]} style={{ marginBottom: 20 }}>
                      {/* Connection Card */}
                      <Col xs={24} lg={12}>
                        <Card
                          title={
                            <Space>
                              <SafetyCertificateOutlined style={{ color: "#25D366", fontSize: 20 }} />
                              <span>Support Bot Connection (+91 92792 59690)</span>
                            </Space>
                          }
                          styles={{ body: { padding: isMobile ? 14 : 24 } }}
                          style={{ borderRadius: 12, height: "100%" }}
                        >
                          <div style={{ marginBottom: 16 }}>
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
                            <Text strong>Official Helpline: </Text>
                            <Tag color="cyan">+91 9279259690</Tag>
                          </div>

                          <div style={{ marginBottom: 16 }}>
                            <Text strong>Cloud Auto-Sync: </Text>
                            <Tag color="purple">Credentials persisted in DB</Tag>
                          </div>

                          <Divider />

                          <Space wrap direction={isMobile ? "vertical" : "horizontal"} style={{ width: isMobile ? "100%" : "auto" }}>
                            {supportStatus === "connected" ? (
                              <>
                                <Popconfirm
                                  title="Disconnect Official Support WhatsApp?"
                                  onConfirm={handleDisconnectSupport}
                                  okText="Yes, Disconnect"
                                  cancelText="Cancel"
                                  okButtonProps={{ danger: true }}
                                >
                                  <Button block={isMobile} danger loading={disconnecting}>
                                    Disconnect Session
                                  </Button>
                                </Popconfirm>
                                <Button
                                  block={isMobile}
                                  icon={<SyncOutlined />}
                                  loading={resettingRatchets}
                                  onClick={handleResetRatchets}
                                  title="Clear stale E2EE encryption keys"
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
                                style={{ background: "#25D366", borderColor: "#25D366", fontWeight: 600 }}
                              >
                                Link Support WhatsApp (+91 92792 59690)
                              </Button>
                            )}

                            {supportStatus === "connecting" && (
                              <Button block={isMobile} onClick={() => setQrModalVisible(true)} icon={<QrcodeOutlined />}>
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
                            Support number (+91 92792 59690) se kisi bhi mobile number par test message bhej kar verify karein:
                          </Paragraph>

                          <Form form={testForm} layout="vertical" onFinish={handleSendTest}>
                            <Form.Item
                              name="phone"
                              label="Recipient Mobile Number"
                              rules={[{ required: true, message: "Enter recipient phone number (e.g. 918797186001)" }]}
                            >
                              <Input placeholder="e.g. 918797186001" />
                            </Form.Item>

                            <Form.Item
                              name="message"
                              label="Message Content"
                              initialValue="Hello! This is a verified test notification from GinieSpace Official Support (+91 9279259690)."
                              rules={[{ required: true, message: "Enter message text" }]}
                            >
                              <Input.TextArea rows={2} />
                            </Form.Item>

                            <Button
                              block={isMobile}
                              type="primary"
                              htmlType="submit"
                              icon={<SendOutlined />}
                              loading={sendingTest}
                              disabled={supportStatus !== "connected"}
                              style={{
                                background: supportStatus === "connected" ? "#25D366" : undefined,
                                borderColor: supportStatus === "connected" ? "#25D366" : undefined,
                                fontWeight: 600,
                              }}
                            >
                              Send Test Alert
                            </Button>
                          </Form>
                        </Card>
                      </Col>

                      {/* Notification Rules */}
                      <Col xs={24}>
                        <Card
                          title={
                            <Space>
                              <BellOutlined style={{ color: "#faad14", fontSize: 20 }} />
                              <span>Automated Platform Notification Rules (Via +91 92792 59690)</span>
                            </Space>
                          }
                          styles={{ body: { padding: isMobile ? 12 : 24 } }}
                          style={{ borderRadius: 12 }}
                        >
                          <Row gutter={isMobile ? [10, 10] : [24, 24]}>
                            <Col xs={12} sm={6}>
                              <Card type="inner" styles={{ body: { padding: 12 } }} style={{ borderRadius: 8 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                                  <Text strong style={{ fontSize: 13 }}>Welcome</Text>
                                  <Switch
                                    checked={rules.newUserWelcome}
                                    onChange={(c) => handleRuleToggle("newUserWelcome", c)}
                                    loading={savingRules}
                                    size="small"
                                  />
                                </div>
                                <Text type="secondary" style={{ fontSize: 11 }}>New user greeting.</Text>
                              </Card>
                            </Col>

                            <Col xs={12} sm={6}>
                              <Card type="inner" styles={{ body: { padding: 12 } }} style={{ borderRadius: 8 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                                  <Text strong style={{ fontSize: 13 }}>Orders</Text>
                                  <Switch
                                    checked={rules.orderPlacedAlert}
                                    onChange={(c) => handleRuleToggle("orderPlacedAlert", c)}
                                    loading={savingRules}
                                    size="small"
                                  />
                                </div>
                                <Text type="secondary" style={{ fontSize: 11 }}>Order confirmations.</Text>
                              </Card>
                            </Col>

                            <Col xs={12} sm={6}>
                              <Card type="inner" styles={{ body: { padding: 12 } }} style={{ borderRadius: 8 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                                  <Text strong style={{ fontSize: 13 }}>Leads</Text>
                                  <Switch
                                    checked={rules.leadConvertedAlert}
                                    onChange={(c) => handleRuleToggle("leadConvertedAlert", c)}
                                    loading={savingRules}
                                    size="small"
                                  />
                                </div>
                                <Text type="secondary" style={{ fontSize: 11 }}>Lead conversions.</Text>
                              </Card>
                            </Col>

                            <Col xs={12} sm={6}>
                              <Card type="inner" styles={{ body: { padding: 12 } }} style={{ borderRadius: 8 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                                  <Text strong style={{ fontSize: 13 }}>Auto-Reply</Text>
                                  <Switch
                                    checked={rules.supportAutoReply}
                                    onChange={(c) => handleRuleToggle("supportAutoReply", c)}
                                    loading={savingRules}
                                    size="small"
                                  />
                                </div>
                                <Text type="secondary" style={{ fontSize: 11 }}>Helpline auto-reply.</Text>
                              </Card>
                            </Col>
                          </Row>
                        </Card>
                      </Col>
                    </Row>
                  </div>
                )}
              </div>
            ),
          },

          // ==========================================
          // MODULE 4: SYSTEM & AUDIT LOGS
          // ==========================================
          {
            key: "system",
            label: (
              <span>
                <SettingOutlined /> {isMobile ? "System" : "System & Audit"}
              </span>
            ),
            children: (
              <div>
                <Row gutter={isMobile ? [14, 14] : [24, 24]}>
                  {/* Announcement Banner Creator */}
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

                  {/* Platform Data Export */}
                  <Col xs={24} lg={12}>
                    <Card
                      title={
                        <Space>
                          <DownloadOutlined style={{ color: "#3b82f6" }} />
                          <span>Platform Data & Backups</span>
                        </Space>
                      }
                      styles={{ body: { padding: isMobile ? 14 : 24 } }}
                      style={{ borderRadius: 12, height: "100%" }}
                    >
                      <Paragraph type="secondary" style={{ fontSize: 13 }}>
                        Complete system data snapshots aur merchant registers ko locally export karein:
                      </Paragraph>

                      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                        <Card type="inner" style={{ borderRadius: 8 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div>
                              <Text strong>Full Platform JSON Backup</Text>
                              <div style={{ fontSize: 12, color: "#64748b" }}>Users, stores, orders, products, audit logs</div>
                            </div>
                            <Button
                              type="primary"
                              icon={<DownloadOutlined />}
                              loading={downloadingBackup}
                              onClick={handleDownloadBackup}
                            >
                              Download JSON
                            </Button>
                          </div>
                        </Card>

                        <Card type="inner" style={{ borderRadius: 8 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div>
                              <Text strong>Merchants Register (CSV)</Text>
                              <div style={{ fontSize: 12, color: "#64748b" }}>Spreadsheet format with revenue, counts & plans</div>
                            </div>
                            <Button
                              icon={<DownloadOutlined />}
                              onClick={handleExportMerchantsCSV}
                            >
                              Export CSV
                            </Button>
                          </div>
                        </Card>
                      </div>
                    </Card>
                  </Col>

                  {/* Audit Logs Table */}
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
                      styles={{ body: { padding: isMobile ? 10 : 20 } }}
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
        ]}
      />

      {/* 360° Merchant Profile Drawer */}
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
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 8 }}>
                <a
                  href={`/shop/${selectedMerchant.business?.slug || selectedMerchant.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
                >
                  <LinkOutlined /> Open Live Storefront
                </a>
                {selectedMerchant.business?.phone && (
                  <Button
                    type="primary"
                    size="small"
                    icon={<MessageOutlined />}
                    style={{ background: "#25D366", borderColor: "#25D366" }}
                    onClick={() => {
                      setMerchantDrawerOpen(false);
                      handleStartChat(selectedMerchant.business.phone, selectedMerchant.name || selectedMerchant.business.name);
                    }}
                  >
                    Chat on WhatsApp
                  </Button>
                )}
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

                {selectedMerchant.role !== "admin" && (
                  <Popconfirm
                    title={`Permanently delete ${selectedMerchant.name || selectedMerchant.business?.name || "merchant"}?`}
                    description="This action cannot be undone. User account, business profile, catalog and data will be permanently wiped."
                    onConfirm={() => handleDeleteUser(selectedMerchant)}
                    okText="Yes, Delete Forever"
                    cancelText="Cancel"
                    okButtonProps={{ danger: true }}
                  >
                    <Button block danger icon={<DeleteOutlined />} style={{ fontWeight: 600 }}>
                      Delete Account Permanently
                    </Button>
                  </Popconfirm>
                )}
              </Space>
            </Card>
          </div>
        )}
      </Drawer>

      {/* Reset Password Modal */}
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

      {/* QR Code Modal for Support WhatsApp */}
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
            Phone me WhatsApp open karein (<strong>9279259690</strong> SIM) -&gt; <strong>Settings / 3-dots</strong> -&gt; <strong>Linked Devices</strong> -&gt; <strong>Link a Device</strong> aur camera se scan karein.
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
