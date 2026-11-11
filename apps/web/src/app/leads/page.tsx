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
} from "antd";
import {
  SearchOutlined,
  UserAddOutlined,
  SaveOutlined,
  PhoneOutlined,
  GlobalOutlined,
  EnvironmentOutlined,
  StarOutlined,
} from "@ant-design/icons";
import { api } from "../../lib/api";
import { getSocket } from "../../lib/socket";

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
}

export default function LeadsPage() {
  const [activeTab, setActiveTab] = useState("discover");
  const [searching, setSearching] = useState(false);
  const [discoveredLeads, setDiscoveredLeads] = useState<DiscoveredLead[]>([]);
  const [savedLeads, setSavedLeads] = useState<SavedLead[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [convertingId, setConvertingId] = useState<string | null>(null);

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
      const res = await api.post("/api/leads/discover", values);
      setDiscoveredLeads(res.data.leads || []);
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
      message.error(err.message || "Could not save lead");
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
      render: (phone: string) => phone ? `+${phone}` : "-",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => {
        const colors: Record<string, string> = {
          new: "blue",
          contacted: "orange",
          converted: "green",
          archived: "default",
        };
        return <Tag color={colors[status]}>{status.toUpperCase()}</Tag>;
      },
    },
    {
      title: "Convert to Customer",
      key: "convert",
      render: (_: any, record: SavedLead) => (
        record.status === "converted" ? (
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
        )
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
                  />
                </Card>
              </>
            ),
          },
          {
            key: "saved",
            label: `Saved Leads (${savedLeads.length})`,
            children: (
              <Card style={{ borderRadius: 12 }}>
                <Table
                  dataSource={savedLeads}
                  columns={savedColumns}
                  rowKey="id"
                  loading={loadingSaved}
                  pagination={{ pageSize: 10 }}
                />
              </Card>
            ),
          },
        ]}
      />
    </AppLayout>
  );
}