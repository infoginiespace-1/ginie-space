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
  Progress,
  Tooltip,
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
  BarChartOutlined,
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
      case "dispatched":
      case "shipped":
        return "purple";
      case "delivered":
        return "green";
      case "cancelled":
        return "red";
      default:
        return "default";
    }
  };

  // Compute last 7 days revenue chart data
  const last7Days = Array.from({ length: 7 }, (_, idx) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - idx));
    const dateKey = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
    const dayOrders = orders.filter((o) => (o.createdAt || "").startsWith(dateKey));
    const revenue = dayOrders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
    return { dateKey, label, revenue, count: dayOrders.length };
  });
  const maxDayRevenue = Math.max(1, ...last7Days.map((d) => d.revenue));

  const statusBreakdown = [
    { key: "pending", label: "Pending", color: "#f59e0b" },
    { key: "confirmed", label: "Confirmed", color: "#3b82f6" },
    { key: "dispatched", label: "Dispatched", color: "#8b5cf6" },
    { key: "delivered", label: "Delivered", color: "#16a34a" },
    { key: "cancelled", label: "Cancelled", color: "#ef4444" },
  ].map((s) => {
    const count = orders.filter((o) => o.status === s.key).length;
    const pct = orders.length > 0 ? Math.round((count / orders.length) * 100) : 0;
    return { ...s, count, pct };
  });

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

      {/* Sales Revenue Trend + Order Status Breakdown Charts */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={14}>
          <Card
            loading={loading}
            title={
              <Space>
                <BarChartOutlined style={{ color: "#16a34a" }} />
                <span>7-Day Sales Revenue Trend</span>
              </Space>
            }
            style={{ borderRadius: 12, height: "100%" }}
          >
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", height: 180, gap: 10, paddingTop: 18 }}>
              {last7Days.map((day) => {
                const heightPct = day.revenue > 0 ? Math.max(10, Math.round((day.revenue / maxDayRevenue) * 100)) : 4;
                return (
                  <Tooltip
                    key={day.dateKey}
                    title={`${day.label}: ₹${day.revenue.toLocaleString("en-IN")} (${day.count} orders)`}
                  >
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", height: "100%", justifyContent: "flex-end" }}>
                      <Text type="secondary" style={{ fontSize: 10, marginBottom: 4 }}>
                        {day.revenue > 0 ? `₹${day.revenue >= 1000 ? `${(day.revenue / 1000).toFixed(1)}k` : day.revenue}` : "-"}
                      </Text>
                      <div
                        style={{
                          width: "100%",
                          maxWidth: 42,
                          height: `${heightPct}%`,
                          background: day.revenue > 0 ? "linear-gradient(180deg, #25D366 0%, #16a34a 100%)" : "#e2e8f0",
                          borderRadius: "6px 6px 2px 2px",
                          transition: "height 0.3s ease",
                        }}
                      />
                      <Text type="secondary" style={{ fontSize: 11, marginTop: 6 }}>{day.label}</Text>
                    </div>
                  </Tooltip>
                );
              })}
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          <Card
            loading={loading}
            title="Order Pipeline Breakdown"
            style={{ borderRadius: 12, height: "100%" }}
          >
            <Space direction="vertical" style={{ width: "100%" }} size={10}>
              {statusBreakdown.map((item) => (
                <div key={item.key}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 2 }}>
                    <Text strong>{item.label}</Text>
                    <Text type="secondary">{item.count} orders ({item.pct}%)</Text>
                  </div>
                  <Progress percent={item.pct} showInfo={false} strokeColor={item.color} size="small" />
                </div>
              ))}
            </Space>
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
