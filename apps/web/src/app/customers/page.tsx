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
} from "@ant-design/icons";
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
      render: (_: any, record: Customer) => (
        <Space>
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
              const due = dueByPhone[normalizePhone(record.phone)] || 0;
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
      ),
    },
  ];

  const uniqueTags = Array.from(
    new Set(
      customers
        .flatMap((c) => String(c.tags || "").split(",").map((t) => t.trim()))
        .filter(Boolean)
    )
  );

  const filteredCustomers = customers.filter((c) => {
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
  });

  return (
    <AppLayout>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>Customer Directory</Title>
          <Text type="secondary">Manage your clients, Udhaar/Khata balance, tags, and bulk WhatsApp broadcasts</Text>
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

      <Card style={{ borderRadius: 12 }}>
        <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
          <Input
            prefix={<SearchOutlined style={{ color: "#94a3b8" }} />}
            placeholder="Search by customer name, phone, or tags..."
            allowClear
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ maxWidth: 340 }}
          />
          <Select
            value={tagFilter}
            onChange={setTagFilter}
            style={{ width: 180 }}
            options={[
              { value: "all", label: "All Customer Tags" },
              ...uniqueTags.map((t) => ({ value: t, label: t })),
            ]}
          />
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
                  Send ₹{ledgerData.summary.pendingDue.toLocaleString("en-IN")} Due Reminder
                </Button>
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
    </AppLayout>
  );
}