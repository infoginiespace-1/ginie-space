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
import { UpgradeModal } from "../../components/UpgradeModal";

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
  const [activeTab, setActiveTab] = useState("discover");
  const [searching, setSearching] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastCriteria, setLastCriteria] = useState<any>(null);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [discoveredLeads, setDiscoveredLeads] = useState<DiscoveredLead[]>([]);
  const [savedLeads, setSavedLeads] = useState<SavedLead[]>([]);
  const [savedStatusFilter, setSavedStatusFilter] = useState<string>("all");
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [convertingId, setConvertingId] = useState<string | null>(null);
  const [followUpTarget, setFollowUpTarget] = useState<SavedLead | null>(null);
  const [followUpDateVal, setFollowUpDateVal] = useState("");
  const [followUpNoteVal, setFollowUpNoteVal] = useState("");
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [savingFollowUp, setSavingFollowUp] = useState(false);
  const [selectedLeadKeys, setSelectedLeadKeys] = useState<React.Key[]>([]);
  const [campaignModalOpen, setCampaignModalOpen] = useState(false);
  const [campaignTemplate, setCampaignTemplate] = useState(() => getDefaultPitchTemplate(user?.businessType));
  const [sendingCampaign, setSendingCampaign] = useState(false);
  const [campaignProgress, setCampaignProgress] = useState({ sent: 0, failed: 0, total: 0 });

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
  }, []);

  const handleSearch = async (values: any) => {
    try {
      setSearching(true);
      setLastCriteria(values);
      const res = await api.post("/api/leads/discover", values);
      setDiscoveredLeads(res.data.leads || []);
      setNextPageToken(res.data.nextPageToken || null);
      if (res.data.leads.length === 0) {
        message.info("No matching businesses found. Try broadening your location or category.");
      } else {
        message.success(`Found ${res.data.leads.length} verified businesses!`);
      }
    } catch (err: any) {
      message.error(err.message || "Failed to search for leads");
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
      if (more.length > 0) {
        message.success(`Loaded ${more.length} more businesses!`);
      }
    } catch (err: any) {
      message.error(err.message || "Could not load more leads");
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
      if (errMsg.includes("Upgrade to Pro") || err.response?.status === 403) {
        setUpgradeModalOpen(true);
      }
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

  return (
    <AppLayout>
      <div style={{ marginBottom: 20 }}>
        <Title level={4} style={{ margin: 0 }}>Find New Leads</Title>
        <Text type="secondary">Discover real local businesses via official Google Places data and reach out via WhatsApp</Text>
      </div>

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
                        label="Business Category or Keywords"
                        rules={[{ required: true, message: "Enter business category" }]}
                      >
                        <Input placeholder="e.g. textile manufacturer, bakery, hardware store" />
                      </Form.Item>

                      <Form.Item name="area" label="Locality / Area">
                        <Input placeholder="e.g. Karol Bagh, Andheri East" />
                      </Form.Item>

                      <Form.Item name="city" label="City">
                        <Input placeholder="e.g. Mumbai, New Delhi, Bengaluru" />
                      </Form.Item>

                      <Form.Item name="pincode" label="Pincode / Postal Code">
                        <Input placeholder="e.g. 110005, 400069" />
                      </Form.Item>

                      <Form.Item name="country" label="Country" initialValue="India">
                        <Input placeholder="India" />
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
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
                  <Text type="secondary">
                    Select saved leads with valid phone numbers to send personalized WhatsApp outreach (3s safe delay).
                  </Text>
                  <Space wrap>
                    <Select
                      value={savedStatusFilter}
                      onChange={setSavedStatusFilter}
                      style={{ width: 170 }}
                      options={[
                        { value: "all", label: "All Statuses" },
                        { value: "followup_due", label: "Follow-Up Due" },
                        { value: "new", label: "New" },
                        { value: "contacted", label: "Contacted" },
                        { value: "converted", label: "Converted" },
                        { value: "archived", label: "Archived" },
                      ]}
                    />
                    <Button
                      icon={<DownloadOutlined />}
                      onClick={() => {
                        const todayStr = new Date().toISOString().slice(0, 10);
                        downloadCsv(
                          "giniespace-leads.csv",
                          ["ID", "Name", "Phone", "Address", "Website", "Rating", "Category", "Status", "FollowUpDate", "Notes"],
                          savedLeads
                            .filter((l) =>
                              savedStatusFilter === "all"
                                ? true
                                : savedStatusFilter === "followup_due"
                                ? Boolean(l.followUpDate && l.followUpDate <= todayStr && l.status !== "converted")
                                : l.status === savedStatusFilter
                            )
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
                      Bulk WhatsApp Campaign ({selectedLeadKeys.length})
                    </Button>
                  </Space>
                </div>
                <Table
                  dataSource={savedLeads.filter((l) => {
                    const todayStr = new Date().toISOString().slice(0, 10);
                    if (savedStatusFilter === "all") return true;
                    if (savedStatusFilter === "followup_due") {
                      return Boolean(l.followUpDate && l.followUpDate <= todayStr && l.status !== "converted");
                    }
                    return l.status === savedStatusFilter;
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

      <UpgradeModal
        open={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        currentPlan={user?.plan}
      />
    </AppLayout>
  );
}