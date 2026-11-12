"use client";

import React, { useState, useEffect } from "react";
import { AppLayout } from "../../components/AppLayout";
import { api } from "../../lib/api";
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Tag,
  Button,
  Typography,
  Space,
  Alert,
  Modal,
  Input,
  message,
} from "antd";
import {
  ShoppingOutlined,
  TeamOutlined,
  SearchOutlined,
  WarningOutlined,
  WhatsAppOutlined,
  ReloadOutlined,
  ArrowRightOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";

const { Title, Text } = Typography;

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [businessPhone, setBusinessPhone] = useState("");
  const [businessName, setBusinessName] = useState("My Business");
  const [summaryModalOpen, setSummaryModalOpen] = useState(false);
  const [summaryPhone, setSummaryPhone] = useState("");
  const [sendingSummary, setSendingSummary] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [ordRes, prodRes, custRes, leadRes, setRes] = await Promise.all([
        api.get("/api/orders").catch(() => ({ data: { orders: [] } })),
        api.get("/api/products").catch(() => ({ data: { products: [] } })),
        api.get("/api/customers").catch(() => ({ data: { customers: [] } })),
        api.get("/api/leads").catch(() => ({ data: { leads: [] } })),
        api.get("/api/settings").catch(() => ({ data: { business: null } })),
      ]);

      setOrders(ordRes.data?.orders || []);
      setProducts(prodRes.data?.products || []);
      setCustomers(custRes.data?.customers || []);
      setLeads(leadRes.data?.leads || []);
      if (setRes.data?.business) {
        setBusinessName(setRes.data.business.name || "My Business");
        setBusinessPhone(setRes.data.business.phone || "");
        setSummaryPhone(setRes.data.business.phone || "");
      }
    } catch {
      message.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const todayPrefix = new Date().toISOString().slice(0, 10);
  const todayOrders = orders.filter((o) => (o.createdAt || "").startsWith(todayPrefix));
  const todayRevenue = todayOrders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
  const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
  const pendingOrders = orders.filter((o) => o.status === "pending");
  const lowStockProducts = products.filter((p) => Number(p.stock) <= 5);
  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6);

  const handleSendDailySummary = async () => {
    const target = summaryPhone.trim() || businessPhone.trim();
    if (!target) {
      message.warning("Please enter your WhatsApp number to receive the report");
      return;
    }
    setSendingSummary(true);
    try {
      const res = await api.post("/api/settings/daily-summary", { phone: target });
      message.success(res.data?.message || "Daily summary sent on WhatsApp!");
      setSummaryModalOpen(false);
    } catch (err: any) {
      message.error(err.message || "Failed to send daily summary");
    } finally {
      setSendingSummary(false);
    }
  };

  const statusColor = (s: string) => {
    switch (s) {
      case "pending":
        return "orange";
      case "confirmed":
        return "blue";
      case "shipped":
        return "purple";
      case "delivered":
        return "green";
      default:
        return "default";
    }
  };

  return (
    <AppLayout>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <Title level={3} style={{ margin: 0 }}>
            {businessName} — Business Dashboard
          </Title>
          <Text type="secondary">Real-time overview of sales, pending orders, low stock &amp; leads</Text>
        </div>

        <Space>
          <Button icon={<ReloadOutlined />} onClick={loadDashboardData} loading={loading}>
            Refresh
          </Button>
          <Button
            type="primary"
            icon={<WhatsAppOutlined />}
            style={{ background: "#25D366", borderColor: "#25D366" }}
            onClick={() => setSummaryModalOpen(true)}
          >
            Send Daily Report on WhatsApp
          </Button>
        </Space>
      </div>

      {lowStockProducts.length > 0 && (
        <Alert
          type="warning"
          showIcon
          icon={<WarningOutlined />}
          style={{ marginBottom: 20, borderRadius: 10 }}
          message={`${lowStockProducts.length} product(s) running low on stock (5 or fewer left)`}
          description={lowStockProducts
            .slice(0, 4)
            .map((p) => `${p.name} (${p.stock} ${p.unit || "units"})`)
            .join(" • ")}
          action={
            <Button size="small" type="primary" onClick={() => router.push("/products")}>
              Restock Now
            </Button>
          }
        />
      )}

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading} style={{ borderRadius: 12 }}>
            <Statistic
              title="Total Revenue"
              value={totalRevenue}
              prefix="₹"
              valueStyle={{ color: "#16a34a", fontWeight: 700 }}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>
              Today: ₹{todayRevenue.toLocaleString("en-IN")} ({todayOrders.length} orders)
            </Text>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading} style={{ borderRadius: 12 }}>
            <Statistic
              title="Pending Orders"
              value={pendingOrders.length}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: pendingOrders.length > 0 ? "#d97706" : "#16a34a", fontWeight: 700 }}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>
              Out of {orders.length} total orders
            </Text>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading} style={{ borderRadius: 12 }}>
            <Statistic
              title="Active Customers"
              value={customers.length}
              prefix={<TeamOutlined />}
              valueStyle={{ color: "#2563eb", fontWeight: 700 }}
            />
            <Button
              type="link"
              size="small"
              style={{ padding: 0, marginTop: 4 }}
              onClick={() => router.push("/customers")}
            >
              View Customers <ArrowRightOutlined />
            </Button>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading} style={{ borderRadius: 12 }}>
            <Statistic
              title="Saved B2B Leads"
              value={leads.length}
              prefix={<SearchOutlined />}
              valueStyle={{ color: "#7c3aed", fontWeight: 700 }}
            />
            <Button
              type="link"
              size="small"
              style={{ padding: 0, marginTop: 4 }}
              onClick={() => router.push("/leads")}
            >
              Launch Campaign <ArrowRightOutlined />
            </Button>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card
            title={
              <Space>
                <ShoppingOutlined />
                <span>Recent Orders</span>
              </Space>
            }
            extra={
              <Button type="link" onClick={() => router.push("/orders")}>
                All Orders
              </Button>
            }
            style={{ borderRadius: 12 }}
          >
            <Table
              dataSource={recentOrders}
              rowKey="id"
              loading={loading}
              pagination={false}
              size="small"
              columns={[
                {
                  title: "Customer",
                  dataIndex: "customerName",
                  key: "customerName",
                  render: (name: string) => <Text strong>{name}</Text>,
                },
                {
                  title: "Amount",
                  dataIndex: "totalAmount",
                  key: "totalAmount",
                  render: (amt: number) => <Text strong>₹{Number(amt || 0).toLocaleString("en-IN")}</Text>,
                },
                {
                  title: "Status",
                  dataIndex: "status",
                  key: "status",
                  render: (s: string) => <Tag color={statusColor(s)}>{(s || "pending").toUpperCase()}</Tag>,
                },
                {
                  title: "Date",
                  dataIndex: "createdAt",
                  key: "createdAt",
                  render: (d: string) => (
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {d ? new Date(d).toLocaleDateString() : "-"}
                    </Text>
                  ),
                },
              ]}
            />
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          <Card
            title={
              <Space>
                <WarningOutlined style={{ color: "#d97706" }} />
                <span>Low Stock Alerts (≤ 5)</span>
              </Space>
            }
            extra={
              <Button type="link" onClick={() => router.push("/products")}>
                Catalog
              </Button>
            }
            style={{ borderRadius: 12 }}
          >
            <Table
              dataSource={lowStockProducts}
              rowKey="id"
              loading={loading}
              pagination={false}
              size="small"
              locale={{ emptyText: "All catalog products have healthy stock!" }}
              columns={[
                {
                  title: "Product",
                  dataIndex: "name",
                  key: "name",
                  render: (name: string) => <Text strong>{name}</Text>,
                },
                {
                  title: "Stock Left",
                  dataIndex: "stock",
                  key: "stock",
                  render: (stock: number, record: any) => (
                    <Tag color={Number(stock) === 0 ? "red" : "orange"}>
                      {stock} {record.unit || "units"}
                    </Tag>
                  ),
                },
                {
                  title: "Price",
                  dataIndex: "price",
                  key: "price",
                  render: (p: number) => `₹${p}`,
                },
              ]}
            />
          </Card>
        </Col>
      </Row>

      <Modal
        title="Send Daily Summary via Official Support (+91 9279259690)"
        open={summaryModalOpen}
        onOk={handleSendDailySummary}
        confirmLoading={sendingSummary}
        onCancel={() => setSummaryModalOpen(false)}
        okText="Send WhatsApp Report"
      >
        <p style={{ color: "#666", marginBottom: 12 }}>
          GinieSpace Official Support WhatsApp will send today&apos;s revenue, pending orders, customer count, and low stock items directly to this number:
        </p>
        <Input
          placeholder="e.g. +91 9876543210"
          value={summaryPhone}
          onChange={(e) => setSummaryPhone(e.target.value)}
        />
      </Modal>
    </AppLayout>
  );
}
