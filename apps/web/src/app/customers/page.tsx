"use client";

import React, { useState, useEffect } from "react";
import { AppLayout } from "../../components/AppLayout";
import {
  Card,
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  InputNumber,
  Typography,
  message,
  Popconfirm,
  Upload,
  Tag,
  Alert,
  Select,
  Progress,
  Drawer,
  Statistic,
  Row,
  Col,
} from "antd";
import {
  PlusOutlined,
  MessageOutlined,
  DeleteOutlined,
  SyncOutlined,
  DollarOutlined,
  DownloadOutlined,
  SearchOutlined,
  EditOutlined,
  UploadOutlined,
  WhatsAppOutlined,
  AccountBookOutlined,
  CopyOutlined,
  CheckCircleFilled,
  CreditCardOutlined,
} from "@ant-design/icons";
import { Segmented } from "antd";
import { api } from "../../lib/api";
import { downloadCsv, parseCsv } from "../../lib/csv";
import { useRouter } from "next/navigation";

const { Title, Text } = Typography;

interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  notes?: string;
  tags?: string;
  createdAt: string;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [upiId, setUpiId] = useState("");
  const [businessName, setBusinessName] = useState("Our Store");
  const [reminderTarget, setReminderTarget] = useState<Customer | null>(null);
  const [reminderAmount, setReminderAmount] = useState<number | null>(null);
  const [reminderNote, setReminderNote] = useState("");
  const [sendingReminder, setSendingReminder] = useState(false);
  const [reminderQrUrl, setReminderQrUrl] = useState<string | null>(null);
  const [reminderUpiUri, setReminderUpiUri] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const [tagFilter, setTagFilter] = useState<string>("all");
  const [selectedCustomerKeys, setSelectedCustomerKeys] = useState<React.Key[]>([]);
  const [broadcastModalOpen, setBroadcastModalOpen] = useState(false);
  const [broadcastTemplate, setBroadcastTemplate] = useState(
    "Namaste {name} ji! Hamare store par aaj naye offers aur fresh stock available hai. Order karne ke liye reply karein!"
  );
  const [sendingBroadcast, setSendingBroadcast] = useState(false);
  const [broadcastProgress, setBroadcastProgress] = useState({ sent: 0, failed: 0, total: 0 });
  const router = useRouter();

  useEffect(() => {
    if (!reminderTarget || !upiId || !upiId.includes("@")) {
      setReminderQrUrl(null);
      setReminderUpiUri(null);
      return;
    }
    api
      .get("/api/storefront/upi-qr", {
        params: {
          pa: upiId,
          pn: businessName,
          am: reminderAmount || undefined,
          tn: reminderNote.trim() || `Payment from ${reminderTarget.name}`,
        },
      })
      .then((res) => {
        setReminderQrUrl(res.data?.qrDataUrl || null);
        setReminderUpiUri(res.data?.upiUri || null);
      })
      .catch(() => {});
  }, [reminderTarget, reminderAmount, reminderNote, upiId, businessName]);

  const [dueByPhone, setDueByPhone] = useState<Record<string, number>>({});
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [csvModalOpen, setCsvModalOpen] = useState(false);
  const [importingCsv, setImportingCsv] = useState(false);
  const [ledgerOpen, setLedgerOpen] = useState(false);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [ledgerData, setLedgerData] = useState<{
    customer: Customer;
    orders: any[];
    summary: { totalOrders: number; totalSpent: number; totalPaid: number; pendingDue: number };
  } | null>(null);

  // Feature 1: Digital Udhaar & Khata Book State
  const [viewMode, setViewMode] = useState<"all" | "khata">("all");
  const [settleCustomer, setSettleCustomer] = useState<Customer | null>(null);
  const [settleAmount, setSettleAmount] = useState<number>(0);
  const [settlePaymentMode, setSettlePaymentMode] = useState<string>("cash");
  const [settleNotes, setSettleNotes] = useState<string>("");
  const [settling, setSettling] = useState<boolean>(false);
  const [settleReceipt, setSettleReceipt] = useState<{
    customer: Customer;
    settledAmount: number;
    remainingDue: number;
    updatedOrdersCount: number;
    date: string;
  } | null>(null);

  const handleSettleDues = async () => {
    if (!settleCustomer) return;
    if (settleAmount <= 0) {
      message.warning("Please enter a valid amount greater than 0 to settle");
      return;
    }
    setSettling(true);
    try {
      const res = await api.post(`/api/customers/${settleCustomer.id}/settle-dues`, {
        settleAmount,
        paymentMode: settlePaymentMode,
        notes: settleNotes,
      });
      message.success(res.data?.message || `Settled ₹${settleAmount} successfully!`);
      const targetPhoneNorm = normalizePhone(settleCustomer.phone);
      const prevDue = dueByPhone[targetPhoneNorm] || 0;
      const remaining = Math.max(0, prevDue - settleAmount);
      setSettleReceipt({
        customer: settleCustomer,
        settledAmount: Number(res.data?.settledAmount) || settleAmount,
        remainingDue: remaining,
        updatedOrdersCount: Number(res.data?.updatedOrdersCount) || 1,
        date: new Date().toLocaleDateString("en-IN"),
      });
      setSettleCustomer(null);
      loadCustomers();
      if (ledgerOpen && ledgerData && ledgerData.customer.id === settleCustomer.id) {
        openCustomerLedger(settleCustomer);
      }
    } catch (err: any) {
      message.error(err.response?.data?.error || err.message || "Failed to settle customer dues");
    } finally {
      setSettling(false);
    }
  };

  const openCustomerLedger = async (cust: Customer) => {
    setLedgerOpen(true);
    setLedgerLoading(true);
    try {
      const res = await api.get(`/api/customers/${cust.id}/ledger`);
      setLedgerData(res.data);
    } catch {
      message.error("Could not load customer Khata ledger");
      setLedgerOpen(false);
    } finally {
      setLedgerLoading(false);
    }
  };

  const normalizePhone = (p?: string) => String(p || "").replace(/[^0-9]/g, "").slice(-10);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const [custRes, setRes, ordRes] = await Promise.all([
        api.get("/api/customers"),
        api.get("/api/settings").catch(() => ({ data: { business: null } })),
        api.get("/api/orders").catch(() => ({ data: { orders: [] } })),
      ]);
      setCustomers(custRes.data.customers || []);

      const dueMap: Record<string, number> = {};
      for (const ord of ordRes.data?.orders || []) {
        if (ord.status === "cancelled" || ord.paymentStatus === "paid") continue;
        const total = Number(ord.totalAmount) || 0;
        const paid = Number(ord.paidAmount) || 0;
        const rem = Math.max(0, total - paid);
        const key = normalizePhone(ord.customerPhone);
        if (rem > 0 && key) {
          dueMap[key] = (dueMap[key] || 0) + rem;
        }
      }
      setDueByPhone(dueMap);

      const b = setRes.data?.business;
      if (b) {
        if (b.name) setBusinessName(b.name);
        if (b.settingsJson) {
          try {
            const parsed = JSON.parse(b.settingsJson);
            if (parsed.upiId) setUpiId(parsed.upiId);
          } catch {}
        }
      }
    } catch {
      message.error("Could not load customers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const handleSaveCustomer = async (values: any) => {
    try {
      if (editingCustomer) {
        await api.put(`/api/customers/${editingCustomer.id}`, values);
        message.success("Customer updated successfully!");
      } else {
        await api.post("/api/customers", values);
        message.success("Customer added successfully!");
      }
      setModalVisible(false);
      setEditingCustomer(null);
      form.resetFields();
      loadCustomers();
    } catch (err: any) {
      message.error(err.message || "Failed to save customer");
    }
  };

  const openAddCustomer = () => {
    setEditingCustomer(null);
    form.resetFields();
    setModalVisible(true);
  };

  const openEditCustomer = (record: Customer) => {
    setEditingCustomer(record);
    form.setFieldsValue({
      name: record.name,
      phone: record.phone,
      email: record.email || "",
      tags: record.tags || "",
      notes: record.notes || "",
    });
    setModalVisible(true);
  };

  const handleBulkCustomerCsv = async (file: File) => {
    try {
      setImportingCsv(true);
      const text = await file.text();
      const rows = parseCsv(text);
      if (rows.length < 2) {
        message.error("CSV must contain a header row and at least 1 customer row");
        return Upload.LIST_IGNORE;
      }
      const header = rows[0].map((h) => h.trim().toLowerCase());
      const nameIdx = header.findIndex((h) => h.includes("name"));
      const phoneIdx = header.findIndex((h) => h.includes("phone") || h.includes("whatsapp") || h.includes("mobile"));
      const emailIdx = header.findIndex((h) => h.includes("email"));
      const tagsIdx = header.findIndex((h) => h.includes("tag"));
      const notesIdx = header.findIndex((h) => h.includes("note"));

      if (nameIdx === -1 || phoneIdx === -1) {
        message.error("CSV header must include 'Name' and 'Phone' columns");
        return Upload.LIST_IGNORE;
      }

      let imported = 0;
      for (const cols of rows.slice(1)) {
        const name = (cols[nameIdx] || "").trim();
        const phone = (cols[phoneIdx] || "").trim();
        if (!name || !phone) continue;
        await api.post("/api/customers", {
          name,
          phone,
          email: emailIdx >= 0 ? (cols[emailIdx] || "").trim() : "",
          tags: tagsIdx >= 0 ? (cols[tagsIdx] || "").trim() : "",
          notes: notesIdx >= 0 ? (cols[notesIdx] || "").trim() : "",
        });
        imported++;
      }

      message.success(`Imported ${imported} customers!`);
      setCsvModalOpen(false);
      loadCustomers();
    } catch (err: any) {
      message.error(err.message || "Failed to import customers CSV");
    } finally {
      setImportingCsv(false);
    }
    return false;
  };

  const handleDeleteCustomer = async (id: string) => {
    try {
      await api.delete(`/api/customers/${id}`);
      message.success("Customer removed");
      loadCustomers();
    } catch {
      message.error("Failed to delete customer");
    }
  };

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (name: string, record: Customer) => (
        <div>
          <a onClick={() => openCustomerLedger(record)} style={{ fontWeight: 600, color: "#15803d" }}>
            {name}
          </a>
          {record.tags && <div><Text type="secondary" style={{ fontSize: 11 }}>{record.tags}</Text></div>}
        </div>
      ),
    },
    {
      title: "Phone (WhatsApp)",
      dataIndex: "phone",
      key: "phone",
      render: (phone: string) => <Text strong>{phone ? `+${String(phone).replace(/^\+/, "")}` : "-"}</Text>,
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      render: (email: string) => email || "-",
    },
    {
      title: "Notes",
      dataIndex: "notes",
      key: "notes",
      render: (notes: string) => notes || "-",
    },
    {
      title: "Udhaar / Due",
      key: "due",
      render: (_: any, record: Customer) => {
        const due = dueByPhone[normalizePhone(record.phone)] || 0;
        return due > 0 ? (
          <Tag color="red">₹{due.toLocaleString("en-IN")} Due</Tag>
        ) : (
          <Tag color="green">Settled</Tag>
        );
      },
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: Customer) => {
        const due = dueByPhone[normalizePhone(record.phone)] || 0;
        return (
          <Space wrap size="small">
            {due > 0 && (
              <Button
                type="primary"
                icon={<CreditCardOutlined />}
                size="small"
                onClick={() => {
                  setSettleCustomer(record);
                  setSettleAmount(due);
                  setSettlePaymentMode("cash");
                  setSettleNotes("");
                }}
                style={{ background: "#059669", borderColor: "#059669", fontWeight: 600 }}
              >
                Settle
              </Button>
            )}
            <Button
              type="primary"
              icon={<MessageOutlined />}
              size="small"
              onClick={() => router.push(`/inbox?phone=${encodeURIComponent(record.phone || "")}`)}
              style={{ background: "#25D366", borderColor: "#25D366" }}
            >
              Chat
            </Button>
            <Button
              icon={<AccountBookOutlined />}
              size="small"
              onClick={() => openCustomerLedger(record)}
            >
              Ledger
            </Button>
            <Button
              icon={<EditOutlined />}
              size="small"
              onClick={() => openEditCustomer(record)}
            >
              Edit
            </Button>
            <Button
              icon={<DollarOutlined />}
              size="small"
              onClick={() => {
                setReminderTarget(record);
                setReminderAmount(due > 0 ? due : null);
                setReminderNote("");
              }}
            >
              Remind
            </Button>
            <Popconfirm
              title="Remove customer?"
              description="Are you sure you want to delete this customer record?"
              onConfirm={() => handleDeleteCustomer(record.id)}
              okText="Yes, delete"
              cancelText="Cancel"
            >
              <Button icon={<DeleteOutlined />} size="small" danger />
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  const uniqueTags = Array.from(
    new Set(
      customers
        .flatMap((c) => String(c.tags || "").split(",").map((t) => t.trim()))
        .filter(Boolean)
    )
  );

  const totalMarketDue = Object.values(dueByPhone).reduce((acc, v) => acc + (Number(v) || 0), 0);
  const customersWithDueCount = customers.filter((c) => (dueByPhone[normalizePhone(c.phone)] || 0) > 0).length;

  const filteredCustomers = customers
    .filter((c) => {
      const due = dueByPhone[normalizePhone(c.phone)] || 0;
      if (viewMode === "khata" && due <= 0) return false;
      const matchesTag =
        tagFilter === "all" ||
        String(c.tags || "")
          .split(",")
          .map((t) => t.trim().toLowerCase())
          .includes(tagFilter.toLowerCase());
      if (!matchesTag) return false;
      const q = searchText.trim().toLowerCase();
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        (c.phone || "").toLowerCase().includes(q) ||
        (c.tags || "").toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      if (viewMode === "khata") {
        const dueA = dueByPhone[normalizePhone(a.phone)] || 0;
        const dueB = dueByPhone[normalizePhone(b.phone)] || 0;
        return dueB - dueA;
      }
      return 0;
    });

  return (
    <AppLayout>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>Customer Directory &amp; Digital Khata</Title>
          <Text type="secondary">Manage customer relations, pending Udhaar balances, and 1-click WhatsApp collection</Text>
        </div>
        <Space wrap>
          <Button
            icon={<WhatsAppOutlined />}
            disabled={selectedCustomerKeys.length === 0}
            type={selectedCustomerKeys.length > 0 ? "primary" : "default"}
            style={selectedCustomerKeys.length > 0 ? { background: "#25D366", borderColor: "#25D366" } : undefined}
            onClick={() => {
              setBroadcastProgress({ sent: 0, failed: 0, total: selectedCustomerKeys.length });
              setBroadcastModalOpen(true);
            }}
          >
            Broadcast ({selectedCustomerKeys.length})
          </Button>
          <Button icon={<UploadOutlined />} onClick={() => setCsvModalOpen(true)}>
            Import CSV
          </Button>
          <Button
            icon={<DownloadOutlined />}
            onClick={() =>
              downloadCsv(
                "giniespace-customers.csv",
                ["ID", "Name", "Phone", "Email", "Tags", "Notes", "CreatedAt"],
                filteredCustomers.map((c) => [c.id, c.name, c.phone, c.email, c.tags, c.notes, c.createdAt])
              )
            }
          >
            Export CSV
          </Button>
          <Button icon={<SyncOutlined />} onClick={loadCustomers} loading={loading}>
            Refresh
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={openAddCustomer}
            style={{ background: "#25D366", borderColor: "#25D366" }}
          >
            Add Customer
          </Button>
        </Space>
      </div>

      {/* Feature 1: Market Udhaar / Khata Metrics Strip */}
      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={8}>
          <Card size="small" style={{ borderRadius: 10, background: "#fef2f2", border: "1px solid #fecaca" }}>
            <Statistic
              title={<span style={{ color: "#991b1b", fontWeight: 600 }}>Total Market Udhaar / Due</span>}
              value={totalMarketDue}
              prefix="₹"
              valueStyle={{ color: "#dc2626", fontWeight: 800 }}
            />
            <div style={{ fontSize: 11, color: "#b91c1c", marginTop: 2 }}>
              Across {customersWithDueCount} customer(s) with pending balance
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={8}>
          <Card size="small" style={{ borderRadius: 10, background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
            <Statistic
              title={<span style={{ color: "#166534", fontWeight: 600 }}>Total Customer Directory</span>}
              value={customers.length}
              valueStyle={{ color: "#15803d", fontWeight: 800 }}
            />
            <div style={{ fontSize: 11, color: "#16a34a", marginTop: 2 }}>
              Active buyers and WhatsApp contacts
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={8}>
          <Card size="small" style={{ borderRadius: 10, background: "#f8fafc", border: "1px solid #e2e8f0" }}>
            <Statistic
              title={<span style={{ color: "#334155", fontWeight: 600 }}>Settled / Zero-Due Customers</span>}
              value={Math.max(0, customers.length - customersWithDueCount)}
              valueStyle={{ color: "#059669", fontWeight: 800 }}
            />
            <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
              100% payments cleared on time
            </div>
          </Card>
        </Col>
      </Row>

      <Card style={{ borderRadius: 12 }}>
        <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap", justifyContent: "space-between", alignItems: "center" }}>
          <Segmented
            value={viewMode}
            onChange={(val: any) => setViewMode(val)}
            options={[
              { label: `👥 All Directory (${customers.length})`, value: "all" },
              { label: `📒 Digital Khata / Udhaar (${customersWithDueCount})`, value: "khata" },
            ]}
            style={{ fontWeight: 600 }}
          />

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Input
              prefix={<SearchOutlined style={{ color: "#94a3b8" }} />}
              placeholder="Search by customer name, phone, or tags..."
              allowClear
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 280 }}
            />
            <Select
              value={tagFilter}
              onChange={setTagFilter}
              style={{ width: 170 }}
              options={[
                { value: "all", label: "All Customer Tags" },
                ...uniqueTags.map((t) => ({ value: t, label: t })),
              ]}
            />
          </div>
        </div>
        <Table
          dataSource={filteredCustomers}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 850 }}
          rowSelection={{
            selectedRowKeys: selectedCustomerKeys,
            onChange: (keys) => setSelectedCustomerKeys(keys),
            getCheckboxProps: (record: Customer) => ({
              disabled: !record.phone,
            }),
          }}
        />
      </Card>

      <Modal
        title={editingCustomer ? "Edit Customer" : "Add New Customer"}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingCustomer(null);
        }}
        footer={null}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSaveCustomer}>
          <Form.Item
            name="name"
            label="Customer Name"
            rules={[{ required: true, message: "Please enter customer name" }]}
          >
            <Input placeholder="e.g. Anjali Sharma" />
          </Form.Item>

          <Form.Item
            name="phone"
            label="WhatsApp Phone Number (with Country Code)"
            rules={[{ required: true, message: "Please enter phone number" }]}
          >
            <Input placeholder="e.g. 919876543210" />
          </Form.Item>

          <Form.Item name="email" label="Email Address">
            <Input placeholder="anjali@example.com" />
          </Form.Item>

          <Form.Item name="tags" label="Tags / Group">
            <Input placeholder="e.g. VIP, Wholesale Buyer, Local Retailer" />
          </Form.Item>

          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={2} placeholder="Preferences, order schedule, delivery notes..." />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              block
              style={{ background: "#25D366", borderColor: "#25D366", fontWeight: 600 }}
            >
              Save Customer
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`Send Payment Reminder — ${reminderTarget?.name || ""}`}
        open={Boolean(reminderTarget)}
        onCancel={() => setReminderTarget(null)}
        confirmLoading={sendingReminder}
        okText="Send Reminder on WhatsApp"
        onOk={async () => {
          if (!reminderTarget) return;
          setSendingReminder(true);
          try {
            const amtLine = reminderAmount ? `\n💰 *Pending Balance:* ₹${reminderAmount.toLocaleString("en-IN")}` : "";
            const noteLine = reminderNote.trim() ? `\n📝 *Ref / Note:* ${reminderNote.trim()}` : "";
            const upiLine = upiId
              ? `\n💳 *Pay via UPI:* ${upiId}${reminderUpiUri ? `\n🔗 *Instant Pay Link:* ${reminderUpiUri}` : ""}`
              : "";
            const msgText =
              `🙏 *Payment Reminder — ${businessName}*\n\n` +
              `Namaste *${reminderTarget.name}*,\n` +
              `Aapka payment balance clear karne ke liye ek gentle reminder hai.${amtLine}${noteLine}${upiLine}\n\n` +
              `Payment karne ke baad screenshot share kar dein. Dhanyavaad!`;

            await api.post("/api/whatsapp/send", {
              recipientPhone: reminderTarget.phone,
              messageText: msgText,
              contactName: reminderTarget.name,
            });
            message.success(`Payment reminder sent to ${reminderTarget.name}!`);
            setReminderTarget(null);
          } catch (err: any) {
            message.error(err.message || "Could not send reminder. Ensure WhatsApp is connected.");
          } finally {
            setSendingReminder(false);
          }
        }}
      >
        <Space direction="vertical" style={{ width: "100%" }} size={12}>
          <div>
            <Text type="secondary">Pending Amount (₹) — Optional:</Text>
            <InputNumber
              style={{ width: "100%", marginTop: 4 }}
              min={1}
              placeholder="e.g. 1500"
              value={reminderAmount ?? undefined}
              onChange={(val) => setReminderAmount(val)}
            />
          </div>
          <div>
            <Text type="secondary">Reference / Invoice Note — Optional:</Text>
            <Input
              style={{ marginTop: 4 }}
              placeholder="e.g. Invoice #1042"
              value={reminderNote}
              onChange={(e) => setReminderNote(e.target.value)}
            />
          </div>
          {upiId ? (
            <div style={{ textAlign: "center", background: "#f0fdf4", padding: 12, borderRadius: 8 }}>
              <Text type="success" strong style={{ display: "block" }}>
                Merchant UPI ID ({upiId}) &amp; Payment Link will be attached automatically.
              </Text>
              {reminderQrUrl && (
                <div style={{ marginTop: 10 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={reminderQrUrl}
                    alt="Scannable UPI QR"
                    style={{ width: 150, height: 150, background: "#fff", padding: 6, borderRadius: 8 }}
                  />
                </div>
              )}
            </div>
          ) : (
            <Text type="warning">Tip: Set your UPI ID in Settings to auto-attach payment link.</Text>
          )}
        </Space>
      </Modal>

      <Modal
        title="Bulk Import Customers (CSV)"
        open={csvModalOpen}
        onCancel={() => setCsvModalOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Space direction="vertical" style={{ width: "100%" }} size={14}>
          <Alert
            type="info"
            showIcon
            message="Expected CSV Columns: Name, Phone, Email, Tags, Notes"
            description="Example: Ramesh Traders, 919876543210, ramesh@shop.com, Wholesale, Weekly buyer"
          />
          <Space>
            <Button
              icon={<DownloadOutlined />}
              onClick={() =>
                downloadCsv(
                  "giniespace-customers-template.csv",
                  ["Name", "Phone", "Email", "Tags", "Notes"],
                  [
                    ["Anjali Sharma", "919876543210", "anjali@example.com", "VIP", "Prefers evening delivery"],
                    ["Ramesh Traders", "919811223344", "", "Wholesale", "Net 7 days"],
                  ]
                )
              }
            >
              Download Sample CSV
            </Button>
            <Upload accept=".csv,text/csv" showUploadList={false} beforeUpload={handleBulkCustomerCsv}>
              <Button
                type="primary"
                icon={<UploadOutlined />}
                loading={importingCsv}
                style={{ background: "#25D366", borderColor: "#25D366", fontWeight: 600 }}
              >
                Upload &amp; Import CSV
              </Button>
            </Upload>
          </Space>
        </Space>
      </Modal>

      <Modal
        title={`Bulk Customer Broadcast (${selectedCustomerKeys.length} selected)`}
        open={broadcastModalOpen}
        onCancel={() => {
          if (!sendingBroadcast) setBroadcastModalOpen(false);
        }}
        closable={!sendingBroadcast}
        maskClosable={!sendingBroadcast}
        footer={[
          <Button key="close" disabled={sendingBroadcast} onClick={() => setBroadcastModalOpen(false)}>
            Close
          </Button>,
          <Button
            key="send"
            type="primary"
            icon={<WhatsAppOutlined />}
            loading={sendingBroadcast}
            style={{ background: "#25D366", borderColor: "#25D366", fontWeight: 600 }}
            onClick={async () => {
              const targets = customers.filter((c) => selectedCustomerKeys.includes(c.id) && c.phone);
              if (targets.length === 0) return;
              setSendingBroadcast(true);
              setBroadcastProgress({ sent: 0, failed: 0, total: targets.length });
              let sentCount = 0;
              let failedCount = 0;

              for (let i = 0; i < targets.length; i++) {
                const cust = targets[i];
                const personalized = broadcastTemplate.replace(/\{name\}/gi, cust.name);
                try {
                  await api.post("/api/whatsapp/send", {
                    recipientPhone: cust.phone,
                    messageText: personalized,
                    contactName: cust.name,
                  });
                  sentCount++;
                } catch {
                  failedCount++;
                }
                setBroadcastProgress({ sent: sentCount, failed: failedCount, total: targets.length });
                if (i < targets.length - 1) {
                  await new Promise((r) => setTimeout(r, 3000));
                }
              }

              setSendingBroadcast(false);
              setSelectedCustomerKeys([]);
              if (failedCount === 0) {
                message.success(`Broadcast sent to ${sentCount} customers!`);
              } else {
                message.warning(`Sent: ${sentCount}, Failed: ${failedCount}. Check WhatsApp connection.`);
              }
            }}
          >
            Start Safe Broadcast (3s Delay)
          </Button>,
        ]}
      >
        <Space direction="vertical" style={{ width: "100%" }} size={12}>
          <Text type="secondary">
            Use <Text code>{"{name}"}</Text> to automatically insert customer names in your WhatsApp broadcast:
          </Text>
          <Input.TextArea
            rows={4}
            value={broadcastTemplate}
            onChange={(e) => setBroadcastTemplate(e.target.value)}
            disabled={sendingBroadcast}
          />
          {broadcastProgress.total > 0 && (sendingBroadcast || broadcastProgress.sent + broadcastProgress.failed > 0) && (
            <div>
              <Progress
                percent={Math.round(((broadcastProgress.sent + broadcastProgress.failed) / broadcastProgress.total) * 100)}
                status={sendingBroadcast ? "active" : broadcastProgress.failed > 0 ? "exception" : "success"}
              />
              <Text type="secondary" style={{ fontSize: 12 }}>
                Sent: {broadcastProgress.sent} | Failed: {broadcastProgress.failed} | Total: {broadcastProgress.total}
              </Text>
            </div>
          )}
        </Space>
      </Modal>

      <Drawer
        title={
          <Space>
            <AccountBookOutlined style={{ color: "#15803d" }} />
            <span>Khata Ledger — {ledgerData?.customer?.name || "Customer"}</span>
          </Space>
        }
        open={ledgerOpen}
        onClose={() => setLedgerOpen(false)}
        width={620}
      >
        {ledgerLoading || !ledgerData ? (
          <Card loading style={{ border: 0 }} />
        ) : (
          <Space direction="vertical" style={{ width: "100%" }} size={16}>
            <Row gutter={[12, 12]}>
              <Col span={6}>
                <Card size="small">
                  <Statistic title="Orders" value={ledgerData.summary.totalOrders} />
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small">
                  <Statistic title="Total Billed" value={ledgerData.summary.totalSpent} prefix="₹" />
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small">
                  <Statistic title="Paid" value={ledgerData.summary.totalPaid} prefix="₹" valueStyle={{ color: "#16a34a" }} />
                </Card>
              </Col>
              <Col span={6}>
                <Card size="small">
                  <Statistic
                    title="Pending Due"
                    value={ledgerData.summary.pendingDue}
                    prefix="₹"
                    valueStyle={{ color: ledgerData.summary.pendingDue > 0 ? "#ef4444" : "#16a34a" }}
                  />
                </Card>
              </Col>
            </Row>

            <Space wrap>
              <Button
                icon={<CopyOutlined />}
                onClick={() => {
                  const text =
                    `Khata Statement — ${businessName}\nCustomer: ${ledgerData.customer.name} (${ledgerData.customer.phone})\n` +
                    `Total Billed: ₹${ledgerData.summary.totalSpent} | Paid: ₹${ledgerData.summary.totalPaid} | Pending Due: ₹${ledgerData.summary.pendingDue}`;
                  navigator.clipboard?.writeText(text);
                  message.success("Khata statement copied!");
                }}
              >
                Copy Khata Summary
              </Button>
              {ledgerData.summary.pendingDue > 0 && (
                <>
                  <Button
                    type="primary"
                    icon={<CreditCardOutlined />}
                    style={{ background: "#059669", borderColor: "#059669", fontWeight: 600 }}
                    onClick={() => {
                      setSettleCustomer(ledgerData.customer);
                      setSettleAmount(ledgerData.summary.pendingDue);
                      setSettlePaymentMode("cash");
                      setSettleNotes("Khata Settlement");
                    }}
                  >
                    Record Payment / Settle
                  </Button>
                  <Button
                    type="primary"
                    icon={<WhatsAppOutlined />}
                    style={{ background: "#25D366", borderColor: "#25D366" }}
                    onClick={() => {
                      setReminderTarget(ledgerData.customer);
                      setReminderAmount(ledgerData.summary.pendingDue);
                      setReminderNote("Complete Khata Balance");
                    }}
                  >
                    Send ₹{ledgerData.summary.pendingDue.toLocaleString("en-IN")} Reminder
                  </Button>
                </>
              )}
            </Space>

            <Table
              dataSource={ledgerData.orders}
              rowKey="id"
              size="small"
              pagination={{ pageSize: 6 }}
              locale={{ emptyText: "No orders recorded yet for this customer." }}
              columns={[
                {
                  title: "Order",
                  dataIndex: "id",
                  key: "id",
                  render: (id: string, o: any) => (
                    <div>
                      <Text strong>#{String(id || "").slice(-6).toUpperCase()}</Text>
                      <div style={{ fontSize: 11, color: "#8c8c8c" }}>{String(o.createdAt || "").slice(0, 10)}</div>
                    </div>
                  ),
                },
                {
                  title: "Total",
                  dataIndex: "totalAmount",
                  key: "totalAmount",
                  render: (v: number) => `₹${Number(v || 0).toLocaleString("en-IN")}`,
                },
                {
                  title: "Payment",
                  key: "payment",
                  render: (_: any, o: any) => {
                    const tot = Number(o.totalAmount) || 0;
                    const paid = o.paymentStatus === "paid" ? tot : Math.min(tot, Number(o.paidAmount) || 0);
                    const rem = Math.max(0, tot - paid);
                    return (
                      <div>
                        <Tag color={o.paymentStatus === "paid" ? "green" : o.paymentStatus === "partial" ? "orange" : "red"}>
                          {(o.paymentStatus || "unpaid").toUpperCase()}
                        </Tag>
                        {rem > 0 && <div style={{ fontSize: 11, color: "#ef4444" }}>Due: ₹{rem.toLocaleString("en-IN")}</div>}
                      </div>
                    );
                  },
                },
                {
                  title: "Status",
                  dataIndex: "status",
                  key: "status",
                  render: (s: string) => <Tag>{String(s || "pending").toUpperCase()}</Tag>,
                },
              ]}
            />
          </Space>
        )}
      </Drawer>

      {/* Feature 1: Settle Customer Dues Modal */}
      <Modal
        title={
          <Space>
            <CreditCardOutlined style={{ color: "#059669" }} />
            <span>Record Payment / Settle Khata — {settleCustomer?.name}</span>
          </Space>
        }
        open={Boolean(settleCustomer)}
        onCancel={() => setSettleCustomer(null)}
        confirmLoading={settling}
        okText="Confirm & Settle Dues"
        okButtonProps={{ style: { background: "#059669", borderColor: "#059669", fontWeight: 700 } }}
        onOk={handleSettleDues}
        destroyOnClose
      >
        {settleCustomer && (
          <Space direction="vertical" style={{ width: "100%" }} size={14}>
            <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "12px 14px", borderRadius: 8 }}>
              <div style={{ fontSize: 12, color: "#166534" }}>Customer:</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>
                {settleCustomer.name} (+{String(settleCustomer.phone || "").replace(/^\+/, "")})
              </div>
              <div style={{ fontSize: 13, color: "#b91c1c", fontWeight: 700, marginTop: 4 }}>
                Current Outstanding Udhaar: ₹{(dueByPhone[normalizePhone(settleCustomer.phone)] || 0).toLocaleString("en-IN")}
              </div>
            </div>

            <div>
              <Text strong style={{ display: "block", marginBottom: 4 }}>
                Amount to Settle (₹):
              </Text>
              <InputNumber
                style={{ width: "100%" }}
                min={1}
                max={Math.max(1, dueByPhone[normalizePhone(settleCustomer.phone)] || 99999999)}
                value={settleAmount}
                onChange={(val) => setSettleAmount(Number(val) || 0)}
              />
              <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>
                Will automatically clear and mark oldest unpaid orders as PAID or PARTIAL.
              </div>
            </div>

            <div>
              <Text strong style={{ display: "block", marginBottom: 4 }}>
                Payment Received Via:
              </Text>
              <Select
                value={settlePaymentMode}
                onChange={setSettlePaymentMode}
                style={{ width: "100%" }}
                options={[
                  { value: "cash", label: "💵 Cash in Hand" },
                  { value: "upi", label: "📱 UPI (GPay / PhonePe / Paytm)" },
                  { value: "bank_transfer", label: "🏦 Bank Transfer / NEFT / IMPS" },
                  { value: "cheque", label: "📜 Cheque" },
                ]}
              />
            </div>

            <div>
              <Text type="secondary" style={{ display: "block", marginBottom: 4 }}>
                Reference / Receipt Note (Optional):
              </Text>
              <Input
                placeholder="e.g. Received via GPay cash counter"
                value={settleNotes}
                onChange={(e) => setSettleNotes(e.target.value)}
              />
            </div>
          </Space>
        )}
      </Modal>

      {/* Feature 1: Settlement Receipt & WhatsApp Share Modal */}
      <Modal
        title={
          <Space>
            <CheckCircleFilled style={{ color: "#16a34a" }} />
            <span>Khata Settlement Receipt</span>
          </Space>
        }
        open={Boolean(settleReceipt)}
        onCancel={() => setSettleReceipt(null)}
        footer={[
          <Button key="close" onClick={() => setSettleReceipt(null)}>
            Close
          </Button>,
          <Button
            key="wa"
            type="primary"
            icon={<WhatsAppOutlined />}
            style={{ background: "#25D366", borderColor: "#25D366", fontWeight: 700 }}
            onClick={() => {
              if (!settleReceipt) return;
              const phone = settleReceipt.customer.phone.replace(/\D/g, "");
              const receiptText =
                `🧾 *Payment Receipt — ${businessName}*\n\n` +
                `Namaste *${settleReceipt.customer.name}* ji,\n` +
                `Aapka Udhaar Khata payment successfully update ho gaya hai:\n\n` +
                `✅ *Amount Paid:* ₹${settleReceipt.settledAmount.toLocaleString("en-IN")}\n` +
                `📉 *Remaining Due:* ₹${settleReceipt.remainingDue.toLocaleString("en-IN")}\n` +
                `📅 *Date:* ${settleReceipt.date}\n\n` +
                `Dhanyavaad for your business! 🙏`;
              window.open(`https://wa.me/${phone}?text=${encodeURIComponent(receiptText)}`, "_blank");
            }}
          >
            Send Receipt on WhatsApp
          </Button>,
        ]}
      >
        {settleReceipt && (
          <div style={{ textAlign: "center", padding: "10px 0" }}>
            <div style={{ fontSize: 13, color: "#64748b" }}>Payment Received from</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", margin: "2px 0 8px" }}>
              {settleReceipt.customer.name}
            </div>
            <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 12, padding: "16px", margin: "12px 0" }}>
              <div style={{ fontSize: 12, color: "#15803d", fontWeight: 600 }}>Amount Settled</div>
              <div style={{ fontSize: 32, fontWeight: 900, color: "#16a34a" }}>
                ₹{settleReceipt.settledAmount.toLocaleString("en-IN")}
              </div>
              <div style={{ fontSize: 12, color: "#059669", marginTop: 4 }}>
                Applied across {settleReceipt.updatedOrdersCount} unpaid order(s)
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "8px 12px", background: "#f8fafc", borderRadius: 8 }}>
              <span>Remaining Balance:</span>
              <strong style={{ color: settleReceipt.remainingDue > 0 ? "#dc2626" : "#16a34a" }}>
                {settleReceipt.remainingDue > 0 ? `₹${settleReceipt.remainingDue.toLocaleString("en-IN")}` : "✓ All Settled (₹0)"}
              </strong>
            </div>
          </div>
        )}
      </Modal>
    </AppLayout>
  );
}