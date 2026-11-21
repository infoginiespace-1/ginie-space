"use client";

import React, { useState, useEffect } from "react";
import { AppLayout } from "../../components/AppLayout";
import {
  Card,
  Form,
  Input,
  Button,
  Table,
  Tag,
  Space,
  Typography,
  Tabs,
  Rate,
  message,
  Tooltip,
  Modal,
  Progress,
  Select,
  Popconfirm,
  Alert,
} from "antd";
import {
  SearchOutlined,
  UserAddOutlined,
  SaveOutlined,
  PhoneOutlined,
  GlobalOutlined,
  EnvironmentOutlined,
  StarOutlined,
  WhatsAppOutlined,
  DownloadOutlined,
  DeleteOutlined,
  CalendarOutlined,
  CrownOutlined,
} from "@ant-design/icons";
import { api } from "../../lib/api";
import { downloadCsv } from "../../lib/csv";
import { getSocket } from "../../lib/socket";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";
import { isLeadDiscoveryRelevant, getBusinessCategoryLabel } from "../../lib/business";

const { Title, Text } = Typography;

interface DiscoveredLead {
  id: string;
  name: string;
  phone?: string;
  address?: string;
  website?: string;
  rating?: number;
  ratingCount?: number;
  businessStatus?: string;
  googleMapsUri?: string;
}

interface SavedLead {
  id: string;
  name: string;
  phone?: string;
  address?: string;
  website?: string;
  rating?: number;
  category: string;
  status: "new" | "contacted" | "converted" | "archived";
  followUpDate?: string;
  notes?: string;
}

function getDefaultPitchTemplate(businessType?: string): string {
  if (businessType === "services") {
    return "Namaste {name} ji! Hum reliable maintenance, repair & annual AMC services provide karte hain. Kya aap apni team/office ke liye service rate card aur slot details WhatsApp par chahenge?";
  }
  if (businessType === "retail") {
    return "Namaste {name} ji! Hamare store par latest collection aur special offers live hain. Kya aapko hamara online catalog link WhatsApp par share karoon?";
  }
  return "Namaste {name} ji! Hum wholesale suppliers hain aur best B2B rates par stock supply karte hain. Kya aapko hamara latest price catalog WhatsApp par chahiye?";
}

export default function LeadsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const isAuthorized = Boolean(user?.role === "admin" || user?.leadsEnabled === true);
  const [activeTab, setActiveTab] = useState("discover");
  const [searching, setSearching] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastCriteria, setLastCriteria] = useState<any>(null);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [discoveredLeads, setDiscoveredLeads] = useState<DiscoveredLead[]>([]);
  const [savedLeads, setSavedLeads] = useState<SavedLead[]>([]);
  const [savedStatusFilter, setSavedStatusFilter] = useState<string>("all");
  const [savedSearchText, setSavedSearchText] = useState("");
  const [savedSortBy, setSavedSortBy] = useState<"latest" | "name" | "rating" | "followup">("latest");
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [convertingId, setConvertingId] = useState<string | null>(null);
  const [followUpTarget, setFollowUpTarget] = useState<SavedLead | null>(null);
  const [followUpDateVal, setFollowUpDateVal] = useState("");
  const [followUpNoteVal, setFollowUpNoteVal] = useState("");
  const [savingFollowUp, setSavingFollowUp] = useState(false);
  const [selectedLeadKeys, setSelectedLeadKeys] = useState<React.Key[]>([]);
  const [campaignModalOpen, setCampaignModalOpen] = useState(false);
  const [campaignTemplate, setCampaignTemplate] = useState(() => getDefaultPitchTemplate(user?.businessType));
  const [sendingCampaign, setSendingCampaign] = useState(false);
  const [campaignProgress, setCampaignProgress] = useState({ sent: 0, failed: 0, total: 0 });
  const [quotaInfo, setQuotaInfo] = useState<{
    plan: "free" | "pro";
    usedToday: number;
    maxDaily: number;
    remainingToday: number;
    usedThisMonth: number;
    maxMonthly: number;
    remainingThisMonth: number;
    savedLeadsCount: number;
    maxSavedLeads: number;
  } | null>(null);

  const loadQuota = async () => {
    try {
      const res = await api.get("/api/leads/quota");
      setQuotaInfo(res.data);
    } catch {}
  };

  useEffect(() => {
    if (isAuthorized) {
      loadQuota();
    }
  }, [user, isAuthorized]);

  useEffect(() => {
    if (user?.businessType) {
      setCampaignTemplate(getDefaultPitchTemplate(user.businessType));
    }
  }, [user?.businessType]);

  const loadSavedLeads = async () => {
    try {
      setLoadingSaved(true);
      const res = await api.get("/api/leads");
      setSavedLeads(res.data.leads || []);
    } catch {
      message.error("Could not load saved leads");
    } finally {
      setLoadingSaved(false);
    }
  };

  useEffect(() => {
    if (!isAuthorized) return;
    loadSavedLeads();

    const socket = getSocket();
    if (socket) {
      socket.on("lead:saved", (newLead: SavedLead) => {
        setSavedLeads((prev) => [newLead, ...prev]);
      });

      socket.on("lead:converted", ({ leadId }: { leadId: string }) => {
        setSavedLeads((prev) =>
          prev.map((l) => (l.id === leadId ? { ...l, status: "converted" } : l))
        );
      });
    }

    return () => {
      if (socket) {
        socket.off("lead:saved");
        socket.off("lead:converted");
      }
    };
  }, [isAuthorized]);

  const handleSearch = async (values: any) => {
    const cleanQuery = (values.query || "").trim();
    const cleanCity = (values.city || "").trim();
    const cleanArea = (values.area || "").trim();
    const cleanPincode = (values.pincode || "").trim();

    if (!cleanQuery || !cleanCity || !cleanArea || !cleanPincode) {
      message.error("Kripya Category, City, Area aur 6-digit Pincode charon fields bharein.");
      return;
    }
    if (!/^[1-9][0-9]{5}$/.test(cleanPincode)) {
      message.error("Kripya valid 6-digit Indian Pincode enter karein (e.g. 800020, 110001).");
      return;
    }

    try {
      setSearching(true);
      const searchPayload = {
        ...values,
        query: cleanQuery,
        city: cleanCity,
        area: cleanArea,
        pincode: cleanPincode,
        country: "India",
      };
      setLastCriteria(searchPayload);
      const res = await api.post("/api/leads/discover", searchPayload);
      setDiscoveredLeads(res.data.leads || []);
      setNextPageToken(res.data.nextPageToken || null);
      loadQuota();
      if (res.data.leads.length === 0) {
        message.info("No matching businesses found. Try broadening your location or category.");
      } else {
        message.success(`Found ${res.data.leads.length} verified businesses!`);
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.error || err.message || "Failed to search for leads";
      message.error(errMsg);
    } finally {
      setSearching(false);
    }
  };

  const handleLoadMore = async () => {
    if (!lastCriteria || !nextPageToken) return;
    try {
      setLoadingMore(true);
      const res = await api.post("/api/leads/discover", {
        ...lastCriteria,
        pageToken: nextPageToken,
      });
      const more = res.data.leads || [];
      setDiscoveredLeads((prev) => {
        const existingIds = new Set(prev.map((p) => p.id));
        return [...prev, ...more.filter((m: DiscoveredLead) => !existingIds.has(m.id))];
      });
      setNextPageToken(res.data.nextPageToken || null);
      loadQuota();
      if (more.length > 0) {
        message.success(`Loaded ${more.length} more businesses!`);
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.error || err.message || "Could not load more leads";
      message.error(errMsg);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleDeleteLead = async (id: string) => {
    try {
      await api.delete(`/api/leads/${id}`);
      setSavedLeads((prev) => prev.filter((l) => l.id !== id));
      message.success("Lead removed");
    } catch {
      message.error("Could not delete lead");
    }
  };

  const handleSaveLead = async (lead: DiscoveredLead) => {
    try {
      setSavingId(lead.id);
      await api.post("/api/leads/save", {
        placeId: lead.id,
        name: lead.name,
        phone: lead.phone,
        address: lead.address,
        website: lead.website,
        rating: lead.rating,
        ratingCount: lead.ratingCount,
        category: "Discovered Lead",
      });
      message.success(`${lead.name} saved to your leads book!`);
    } catch (err: any) {
      const errMsg = err.response?.data?.error || err.message || "Could not save lead";
      message.error(errMsg);
    } finally {
      setSavingId(null);
    }
  };

  const handleConvertToCustomer = async (lead: SavedLead) => {
    try {
      setConvertingId(lead.id);
      await api.post(`/api/leads/${lead.id}/convert`);
      message.success(`${lead.name} converted to Customer and added to your contacts!`);
    } catch (err: any) {
      message.error(err.message || "Could not convert lead");
    } finally {
      setConvertingId(null);
    }
  };

  const discoveredColumns = [
    {
      title: "Business Name",
      dataIndex: "name",
      key: "name",
      render: (name: string, record: DiscoveredLead) => (
        <div>
          <div style={{ fontWeight: 600 }}>{name}</div>
          {record.address && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              <EnvironmentOutlined /> {record.address}
            </Text>
          )}
        </div>
      ),
    },
    {
      title: "Contact",
      dataIndex: "phone",
      key: "phone",
      render: (phone: string, record: DiscoveredLead) => (
        <Space direction="vertical" size={2}>
          {phone ? (
            <Text><PhoneOutlined /> {phone}</Text>
          ) : (
            <Text type="secondary" style={{ fontSize: 12 }}>No phone listed</Text>
          )}
          {record.website && (
            <a href={record.website} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12 }}>
              <GlobalOutlined /> Website
            </a>
          )}
        </Space>
      ),
    },
    {
      title: "Google Rating",
      dataIndex: "rating",
      key: "rating",
      render: (rating: number, record: DiscoveredLead) => (
        <div>
          {rating ? (
            <Space size={4}>
              <Rate disabled allowHalf defaultValue={rating} style={{ fontSize: 12 }} />
              <Text strong style={{ fontSize: 13 }}>{rating.toFixed(1)}</Text>
              <Text type="secondary" style={{ fontSize: 11 }}>({record.ratingCount || 0})</Text>
            </Space>
          ) : (
            <Text type="secondary">Not rated</Text>
          )}
        </div>
      ),
    },
    {
      title: "Action",
      key: "action",
      render: (_: any, record: DiscoveredLead) => (
        <Button
          type="primary"
          icon={<SaveOutlined />}
          loading={savingId === record.id}
          onClick={() => handleSaveLead(record)}
          size="small"
          style={{ background: "#25D366", borderColor: "#25D366" }}
        >
          Save Lead
        </Button>
      ),
    },
  ];

  const savedColumns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (name: string, record: SavedLead) => (
        <div>
          <div style={{ fontWeight: 600 }}>{name}</div>
          <Text type="secondary" style={{ fontSize: 12 }}>{record.address || "No address"}</Text>
        </div>
      ),
    },
    {
      title: "Phone",
      dataIndex: "phone",
      key: "phone",
      render: (phone: string) =>
        phone && phone !== "#ERROR!" ? `+${String(phone).replace(/^\+/, "")}` : "-",
    },
    {
      title: "Status & Follow-Up",
      dataIndex: "status",
      key: "status",
      render: (status: string, record: SavedLead) => {
        const colors: Record<string, string> = {
          new: "blue",
          contacted: "orange",
          converted: "green",
          archived: "default",
        };
        const todayStr = new Date().toISOString().slice(0, 10);
        const isDue = record.followUpDate && record.followUpDate <= todayStr && status !== "converted";
        return (
          <Space direction="vertical" size={2}>
            <Tag color={colors[status]}>{status.toUpperCase()}</Tag>
            {record.followUpDate && (
              <Tag color={isDue ? "red" : "cyan"} icon={<CalendarOutlined />} style={{ fontSize: 11 }}>
                {record.followUpDate}
              </Tag>
            )}
          </Space>
        );
      },
    },
    {
      title: "Actions",
      key: "convert",
      render: (_: any, record: SavedLead) => (
        <Space wrap>
          {record.phone && record.phone !== "#ERROR!" && (
            <Button
              size="small"
              icon={<WhatsAppOutlined />}
              style={{ color: "#16a34a", borderColor: "#25D366" }}
              onClick={async () => {
                const intro = `Namaste ${record.name} ji! Hum best wholesale/retail rates par regular supply karte hain. Hamara live product catalog dekhein: https://app.ginie.space/shop/${user?.id || ""}`;
                try {
                  await api.post("/api/whatsapp/send", {
                    recipientPhone: record.phone,
                    messageText: intro,
                    contactName: record.name,
                  });
                  if (record.status === "new") {
                    await api.put(`/api/leads/${record.id}/status`, { status: "contacted" }).catch(() => {});
                  }
                  message.success(`Intro pitch sent to ${record.name}!`);
                  loadSavedLeads();
                } catch {
                  const cleanDigits = String(record.phone).replace(/[^0-9]/g, "");
                  window.open(`https://wa.me/${cleanDigits}?text=${encodeURIComponent(intro)}`, "_blank");
                }
              }}
            >
              Pitch
            </Button>
          )}
          <Button
            size="small"
            icon={<CalendarOutlined />}
            onClick={() => {
              setFollowUpTarget(record);
              setFollowUpDateVal(record.followUpDate || new Date().toISOString().slice(0, 10));
              setFollowUpNoteVal(record.notes || "");
            }}
          >
            Follow-Up
          </Button>
          {record.status === "converted" ? (
            <Tag color="success">Converted</Tag>
          ) : (
            <Button
              type="primary"
              icon={<UserAddOutlined />}
              size="small"
              loading={convertingId === record.id}
              onClick={() => handleConvertToCustomer(record)}
              style={{ background: "#0284c7", borderColor: "#0284c7" }}
            >
              Add to Customers
            </Button>
          )}
          <Popconfirm
            title="Remove lead?"
            description="Delete this saved lead record?"
            onConfirm={() => handleDeleteLead(record.id)}
            okText="Delete"
            cancelText="Cancel"
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  if (!isAuthorized) {
    return (
      <AppLayout>
        <div style={{ maxWidth: 580, margin: "60px auto", padding: "0 16px" }}>
          <Card
            style={{
              borderRadius: 16,
              textAlign: "center",
              boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)",
              border: "1px solid #e2e8f0",
              padding: "32px 20px",
            }}
          >
            <div
              style={{
                width: 68,
                height: 68,
                borderRadius: "50%",
                background: "#fef3c7",
                color: "#d97706",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 20px",
                fontSize: 30,
              }}
            >
              🔒
            </div>
            <Title level={3} style={{ marginBottom: 10, color: "#0f172a" }}>
              B2B Lead Discovery is Restricted
            </Title>
            <Text type="secondary" style={{ fontSize: 14, display: "block", marginBottom: 28, lineHeight: 1.6 }}>
              B2B Outbound Leads Discovery is disabled by default and exclusively managed by Platform Admin.
              If your business requires high-volume local business prospecting, please request activation directly from Admin.
            </Text>

            <Space direction="vertical" size="middle" style={{ width: "100%" }}>
              <a
                href={`https://wa.me/917488825824?text=${encodeURIComponent(
                  `Namaste GinieSpace Admin! Please activate B2B Leads Discovery for my account: ${user?.email || ""}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ width: "100%" }}
              >
                <Button
                  type="primary"
                  size="large"
                  icon={<WhatsAppOutlined />}
                  block
                  style={{ background: "#25D366", borderColor: "#25D366", height: 46, fontWeight: 600 }}
                >
                  Request Admin to Activate on WhatsApp
                </Button>
              </a>

              <Button size="large" block onClick={() => router.push("/dashboard")}>
                Return to Dashboard
              </Button>
            </Space>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div style={{ marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>Find New Leads</Title>
          <Text type="secondary">Discover real local businesses via official Google Places data and reach out via WhatsApp</Text>
        </div>
        {quotaInfo && (
          <Space wrap>
            <Tag color="green" style={{ fontSize: 13, padding: "4px 10px", borderRadius: 6, fontWeight: 600 }}>
              Free Searches: {quotaInfo.usedToday}/100 ({quotaInfo.remainingToday} left today)
            </Tag>
          </Space>
        )}
      </div>

      {!isLeadDiscoveryRelevant(user?.businessType) && (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 20, borderRadius: 10 }}
          message={
            <span style={{ fontWeight: 600 }}>
              Lead Discovery is tailored for Wholesale & B2B Services
            </span>
          }
          description={
            <span>
              Your business profile is currently set to <strong>{getBusinessCategoryLabel(user?.businessType)}</strong>. Lead Discovery finds local shops, suppliers, and institutions to pitch in bulk. For retail & walk-in footfall, we recommend managing your walk-in shoppers under <strong>Customers</strong>. You are still welcome to search here, or customize navigation in <a href="/settings">Settings</a>.
            </span>
          }
        />
      )}

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: "discover",
            label: "Search Google Places",
            children: (
              <>
                <Card style={{ marginBottom: 20, borderRadius: 12 }}>
                  <Form layout="vertical" onFinish={handleSearch}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
                      <Form.Item
                        name="query"
                        label="* Business Category or Keywords"
                        rules={[{ required: true, message: "Please enter business category (e.g. Kirana, Garments, Restaurant)" }]}
                      >
                        <Input placeholder="e.g. Kirana store, bakery, garment manufacturer" />
                      </Form.Item>

                      <Form.Item
                        name="city"
                        label="* Target City"
                        rules={[{ required: true, message: "Please enter city (e.g. Patna, Mumbai, Delhi, Darbhanga)" }]}
                      >
                        <Input placeholder="e.g. Patna, Mumbai, New Delhi, Bengaluru" />
                      </Form.Item>

                      <Form.Item
                        name="area"
                        label="* Locality / Area"
                        rules={[{ required: true, message: "Please enter locality / area (e.g. Kankarbagh, Boring Road, Karol Bagh)" }]}
                      >
                        <Input placeholder="e.g. Kankarbagh, Boring Road, Andheri East" />
                      </Form.Item>

                      <Form.Item
                        name="pincode"
                        label="* 6-Digit Pincode"
                        rules={[
                          { required: true, message: "Please enter 6-digit postal pincode" },
                          { pattern: /^[1-9][0-9]{5}$/, message: "Please enter a valid 6-digit Indian Pincode (e.g. 800020, 110001)" },
                        ]}
                      >
                        <Input placeholder="e.g. 800020, 110005, 400069" maxLength={6} />
                      </Form.Item>
                    </div>

                    <Button
                      type="primary"
                      htmlType="submit"
                      icon={<SearchOutlined />}
                      loading={searching}
                      size="large"
                      style={{ background: "#25D366", borderColor: "#25D366", fontWeight: 600 }}
                    >
                      Search Businesses
                    </Button>
                  </Form>
                </Card>

                <Card style={{ borderRadius: 12 }}>
                  <Table
                    dataSource={discoveredLeads}
                    columns={discoveredColumns}
                    rowKey="id"
                    loading={searching}
                    pagination={{ pageSize: 10 }}
                    scroll={{ x: 850 }}
                  />
                  {nextPageToken && (
                    <div style={{ textAlign: "center", marginTop: 14 }}>
                      <Button onClick={handleLoadMore} loading={loadingMore}>
                        Load More Results from Google Places
                      </Button>
                    </div>
                  )}
                </Card>
              </>
            ),
          },
          {
            key: "saved",
            label: `Saved Leads (${savedLeads.length})`,
            children: (
              <Card style={{ borderRadius: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
                  <Text type="secondary">
                    Select saved leads with valid phone numbers to send personalized WhatsApp outreach (3s safe delay).
                  </Text>
                  <Space wrap>
                    <Input
                      prefix={<SearchOutlined style={{ color: "#94a3b8" }} />}
                      placeholder="Search saved leads..."
                      allowClear
                      value={savedSearchText}
                      onChange={(e) => setSavedSearchText(e.target.value)}
                      style={{ width: 220 }}
                    />
                    <Select
                      value={savedStatusFilter}
                      onChange={setSavedStatusFilter}
                      style={{ width: 150 }}
                      options={[
                        { value: "all", label: "All Statuses" },
                        { value: "followup_due", label: "Follow-Up Due" },
                        { value: "new", label: "New" },
                        { value: "contacted", label: "Contacted" },
                        { value: "converted", label: "Converted" },
                        { value: "archived", label: "Archived" },
                      ]}
                    />
                    <Select
                      value={savedSortBy}
                      onChange={setSavedSortBy}
                      style={{ width: 185 }}
                      options={[
                        { value: "latest", label: "🕒 Recently Added (Newest)" },
                        { value: "name", label: "🔤 Name (A-Z)" },
                        { value: "rating", label: "⭐ Rating (High to Low)" },
                        { value: "followup", label: "📅 Follow-Up Date" },
                      ]}
                    />
                    <Button
                      icon={<DownloadOutlined />}
                      onClick={() => {
                        downloadCsv(
                          "giniespace-leads.csv",
                          ["ID", "Name", "Phone", "Address", "Website", "Rating", "Category", "Status", "FollowUpDate", "Notes"],
                          savedLeads
                            .filter((l) => {
                              const todayStr = new Date().toISOString().slice(0, 10);
                              if (savedStatusFilter === "followup_due") {
                                if (!Boolean(l.followUpDate && l.followUpDate <= todayStr && l.status !== "converted")) return false;
                              } else if (savedStatusFilter !== "all" && l.status !== savedStatusFilter) {
                                return false;
                              }
                              if (!savedSearchText.trim()) return true;
                              const q = savedSearchText.toLowerCase().trim();
                              return (
                                l.name.toLowerCase().includes(q) ||
                                (l.phone || "").toLowerCase().includes(q) ||
                                (l.category || "").toLowerCase().includes(q)
                              );
                            })
                            .map((l) => [l.id, l.name, l.phone, l.address, l.website, l.rating, l.category, l.status, l.followUpDate, l.notes])
                        );
                      }}
                    >
                      Export CSV
                    </Button>
                    <Button
                      type="primary"
                      icon={<WhatsAppOutlined />}
                      disabled={selectedLeadKeys.length === 0}
                      style={
                        selectedLeadKeys.length > 0
                          ? { background: "#25D366", borderColor: "#25D366" }
                          : undefined
                      }
                      onClick={() => {
                        setCampaignProgress({ sent: 0, failed: 0, total: selectedLeadKeys.length });
                        setCampaignModalOpen(true);
                      }}
                    >
                      Bulk WhatsApp ({selectedLeadKeys.length})
                    </Button>
                  </Space>
                </div>
                <Table
                  dataSource={savedLeads
                    .filter((l) => {
                      const todayStr = new Date().toISOString().slice(0, 10);
                      if (savedStatusFilter === "followup_due") {
                        if (!Boolean(l.followUpDate && l.followUpDate <= todayStr && l.status !== "converted")) return false;
                      } else if (savedStatusFilter !== "all" && l.status !== savedStatusFilter) {
                        return false;
                      }
                      if (!savedSearchText.trim()) return true;
                      const q = savedSearchText.toLowerCase().trim();
                      return (
                        l.name.toLowerCase().includes(q) ||
                        (l.phone || "").toLowerCase().includes(q) ||
                        (l.category || "").toLowerCase().includes(q) ||
                        (l.address || "").toLowerCase().includes(q)
                      );
                    })
                    .sort((a, b) => {
                      if (savedSortBy === "name") {
                        return (a.name || "").localeCompare(b.name || "");
                      }
                      if (savedSortBy === "rating") {
                        return (Number(b.rating) || 0) - (Number(a.rating) || 0);
                      }
                      if (savedSortBy === "followup") {
                        return (a.followUpDate || "9999-99-99").localeCompare(b.followUpDate || "9999-99-99");
                      }
                      return new Date((b as any).createdAt || 0).getTime() - new Date((a as any).createdAt || 0).getTime();
                    })}
                  columns={savedColumns}
                  rowKey="id"
                  loading={loadingSaved}
                  pagination={{ pageSize: 10 }}
                  scroll={{ x: 850 }}
                  rowSelection={{
                    selectedRowKeys: selectedLeadKeys,
                    onChange: (keys) => setSelectedLeadKeys(keys),
                    getCheckboxProps: (record: SavedLead) => ({
                      disabled: !record.phone || record.phone === "#ERROR!",
                    }),
                  }}
                />
              </Card>
            ),
          },
        ]}
      />

      <Modal
        title={`Bulk WhatsApp Lead Campaign (${selectedLeadKeys.length} selected)`}
        open={campaignModalOpen}
        onCancel={() => {
          if (!sendingCampaign) setCampaignModalOpen(false);
        }}
        closable={!sendingCampaign}
        maskClosable={!sendingCampaign}
        footer={[
          <Button
            key="cancel"
            disabled={sendingCampaign}
            onClick={() => setCampaignModalOpen(false)}
          >
            Close
          </Button>,
          <Button
            key="send"
            type="primary"
            icon={<WhatsAppOutlined />}
            loading={sendingCampaign}
            style={{ background: "#25D366", borderColor: "#25D366" }}
            onClick={async () => {
              const targets = savedLeads.filter(
                (l) => selectedLeadKeys.includes(l.id) && l.phone && l.phone !== "#ERROR!"
              );
              if (targets.length === 0) {
                message.warning("No valid phone numbers selected");
                return;
              }
              setSendingCampaign(true);
              setCampaignProgress({ sent: 0, failed: 0, total: targets.length });
              let sentCount = 0;
              let failedCount = 0;

              for (let i = 0; i < targets.length; i++) {
                const lead = targets[i];
                const personalized = campaignTemplate.replace(/\{name\}/gi, lead.name);
                try {
                  await api.post("/api/whatsapp/send", {
                    recipientPhone: lead.phone,
                    messageText: personalized,
                    contactName: lead.name,
                  });
                  if (lead.status === "new") {
                    await api.put(`/api/leads/${lead.id}/status`, { status: "contacted" }).catch(() => {});
                  }
                  sentCount++;
                } catch {
                  failedCount++;
                }
                setCampaignProgress({ sent: sentCount, failed: failedCount, total: targets.length });
                if (i < targets.length - 1) {
                  await new Promise((r) => setTimeout(r, 3000));
                }
              }

              setSendingCampaign(false);
              loadSavedLeads();
              setSelectedLeadKeys([]);
              if (failedCount === 0) {
                message.success(`Campaign completed! Sent to ${sentCount} leads.`);
              } else {
                message.warning(`Sent: ${sentCount}, Failed: ${failedCount}. Check WhatsApp connection.`);
              }
            }}
          >
            Start Safe Send (3s Delay)
          </Button>,
        ]}
      >
        <Space direction="vertical" style={{ width: "100%" }} size={12}>
          <Text type="secondary">
            Use <Text code>{"{name}"}</Text> to auto-insert the business name in each message:
          </Text>
          <Input.TextArea
            rows={4}
            value={campaignTemplate}
            onChange={(e) => setCampaignTemplate(e.target.value)}
            disabled={sendingCampaign}
          />
          {campaignProgress.total > 0 && (sendingCampaign || campaignProgress.sent + campaignProgress.failed > 0) && (
            <div>
              <Progress
                percent={Math.round(((campaignProgress.sent + campaignProgress.failed) / campaignProgress.total) * 100)}
                status={sendingCampaign ? "active" : campaignProgress.failed > 0 ? "exception" : "success"}
              />
              <Text type="secondary" style={{ fontSize: 12 }}>
                Sent: {campaignProgress.sent} | Failed: {campaignProgress.failed} | Total: {campaignProgress.total}
              </Text>
            </div>
          )}
        </Space>
      </Modal>

      <Modal
        title={`Schedule Follow-Up — ${followUpTarget?.name || ""}`}
        open={Boolean(followUpTarget)}
        onCancel={() => setFollowUpTarget(null)}
        confirmLoading={savingFollowUp}
        okText="Save Follow-Up"
        onOk={async () => {
          if (!followUpTarget) return;
          setSavingFollowUp(true);
          try {
            await api.put(`/api/leads/${followUpTarget.id}`, {
              followUpDate: followUpDateVal,
              notes: followUpNoteVal,
            });
            message.success("Lead follow-up updated!");
            setFollowUpTarget(null);
            loadSavedLeads();
          } catch {
            message.error("Could not save follow-up");
          } finally {
            setSavingFollowUp(false);
          }
        }}
      >
        <Space direction="vertical" style={{ width: "100%" }} size={12}>
          <div>
            <Text type="secondary">Next Follow-Up Date:</Text>
            <Input
              type="date"
              style={{ marginTop: 4 }}
              value={followUpDateVal}
              onChange={(e) => setFollowUpDateVal(e.target.value)}
            />
          </div>
          <div>
            <Text type="secondary">Call / Pitch Notes:</Text>
            <Input.TextArea
              rows={3}
              style={{ marginTop: 4 }}
              placeholder="Interested in 50kg wholesale trial..."
              value={followUpNoteVal}
              onChange={(e) => setFollowUpNoteVal(e.target.value)}
            />
          </div>
        </Space>
      </Modal>

    </AppLayout>
  );
}