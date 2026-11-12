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
} from "antd";
import {
  PlusOutlined,
  MessageOutlined,
  DeleteOutlined,
  SyncOutlined,
  DollarOutlined,
  DownloadOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { api } from "../../lib/api";
import { downloadCsv } from "../../lib/csv";
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

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const [custRes, setRes] = await Promise.all([
        api.get("/api/customers"),
        api.get("/api/settings").catch(() => ({ data: { business: null } })),
      ]);
      setCustomers(custRes.data.customers || []);
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

  const handleCreateCustomer = async (values: any) => {
    try {
      await api.post("/api/customers", values);
      message.success("Customer added successfully!");
      setModalVisible(false);
      form.resetFields();
      loadCustomers();
    } catch (err: any) {
      message.error(err.message || "Failed to add customer");
    }
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
          <div style={{ fontWeight: 600 }}>{name}</div>
          {record.tags && <Text type="secondary" style={{ fontSize: 11 }}>{record.tags}</Text>}
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
            icon={<DollarOutlined />}
            size="small"
            onClick={() => {
              setReminderTarget(record);
              setReminderAmount(null);
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

  const filteredCustomers = customers.filter((c) => {
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
          <Text type="secondary">Manage your clients, direct phone numbers, and WhatsApp conversations</Text>
        </div>
        <Space wrap>
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
            onClick={() => setModalVisible(true)}
            style={{ background: "#25D366", borderColor: "#25D366" }}
          >
            Add Customer
          </Button>
        </Space>
      </div>

      <Card style={{ borderRadius: 12 }}>
        <div style={{ marginBottom: 16 }}>
          <Input
            prefix={<SearchOutlined style={{ color: "#94a3b8" }} />}
            placeholder="Search by customer name, phone, or tags..."
            allowClear
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ maxWidth: 340 }}
          />
        </div>
        <Table
          dataSource={filteredCustomers}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title="Add New Customer"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleCreateCustomer}>
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
    </AppLayout>
  );
}