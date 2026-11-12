"use client";

import React, { useState, useEffect } from "react";
import { AppLayout } from "../../components/AppLayout";
import {
  Card,
  Table,
  Button,
  Tag,
  Space,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Typography,
  message,
  Checkbox,
} from "antd";
import { PlusOutlined, ShoppingCartOutlined, SyncOutlined, WhatsAppOutlined } from "@ant-design/icons";
import { api } from "../../lib/api";
import { getSocket } from "../../lib/socket";

const { Title, Text } = Typography;

interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  itemsJson: string;
  totalAmount: number;
  status: "pending" | "confirmed" | "dispatched" | "delivered" | "cancelled";
  notes?: string;
  createdAt: string;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [statusUpdating, setStatusUpdating] = useState<string | null>(null);
  const [sendingBillId, setSendingBillId] = useState<string | null>(null);
  const [upiId, setUpiId] = useState("");

  const handleSendWhatsAppBill = async (order: Order) => {
    try {
      setSendingBillId(order.id);
      let itemsSummary = "";
      try {
        const parsed = JSON.parse(order.itemsJson || "[]");
        if (Array.isArray(parsed) && parsed.length > 0) {
          itemsSummary = "\n📋 *Items:*\n" + parsed.map((i: any) => `• ${i.name} x ${i.quantity} = ₹${i.price * i.quantity}`).join("\n");
        }
      } catch {}

      const upiLine = upiId ? `\n💳 *Pay via UPI:* ${upiId}` : "";
      const billText = `🧾 *Order Invoice / Bill #${order.id.slice(-6)}*\n\nNamaste *${order.customerName}*,\nAapka order detail neeche diya gaya hai:${itemsSummary}\n\n💰 *Total Amount:* ₹${order.totalAmount}\n📌 *Status:* ${order.status.toUpperCase()}${order.notes ? `\n📝 *Note:* ${order.notes}` : ""}${upiLine}\n📅 *Date:* ${new Date(order.createdAt).toLocaleDateString()}\n\nThank you for your business! 🙏`;

      await api.post("/api/whatsapp/send", {
        recipientPhone: order.customerPhone,
        messageText: billText,
        contactName: order.customerName,
      });
      message.success(`WhatsApp bill sent to ${order.customerName}!`);
    } catch (err: any) {
      message.error(err.response?.data?.error || err.message || "Could not send bill. Please ensure WhatsApp is connected.");
    } finally {
      setSendingBillId(null);
    }
  };

  const loadOrders = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/orders");
      setOrders(res.data.orders || []);
    } catch {
      message.error("Could not load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
    api.get("/api/settings")
      .then((res) => {
        const sj = res.data?.business?.settingsJson;
        if (sj) {
          try {
            const parsed = JSON.parse(sj);
            if (parsed.upiId) setUpiId(parsed.upiId);
          } catch {}
        }
      })
      .catch(() => {});

    const socket = getSocket();
    if (socket) {
      socket.on("order:created", (newOrder: Order) => {
        setOrders((prev) => [newOrder, ...prev]);
        message.info(`New order received from ${newOrder.customerName}`);
      });

      socket.on("order:updated", (updatedOrder: Order) => {
        setOrders((prev) => prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o)));
      });

      socket.on("order:deleted", ({ id }: { id: string }) => {
        setOrders((prev) => prev.filter((o) => o.id !== id));
      });
    }

    return () => {
      if (socket) {
        socket.off("order:created");
        socket.off("order:updated");
        socket.off("order:deleted");
      }
    };
  }, []);

  const handleStatusChange = async (id: string, status: string, notifyCustomer = true) => {
    try {
      setStatusUpdating(id);
      await api.put(`/api/orders/${id}/status`, { status, notifyCustomer });
      message.success(`Order status updated to ${status}`);
    } catch (err: any) {
      message.error(err.message || "Failed to update order status");
    } finally {
      setStatusUpdating(null);
    }
  };

  const handleCreateOrder = async (values: any) => {
    try {
      await api.post("/api/orders", values);
      message.success("Order created successfully!");
      setCreateModalVisible(false);
      form.resetFields();
    } catch (err: any) {
      message.error(err.message || "Could not create order");
    }
  };

  const statusColors: Record<string, string> = {
    pending: "orange",
    confirmed: "blue",
    dispatched: "purple",
    delivered: "green",
    cancelled: "red",
  };

  const columns = [
    {
      title: "Order ID",
      dataIndex: "id",
      key: "id",
      render: (id: string) => <Text code>#{id.slice(-6)}</Text>,
    },
    {
      title: "Customer",
      dataIndex: "customerName",
      key: "customerName",
      render: (name: string, record: Order) => (
        <div>
          <div style={{ fontWeight: 600 }}>{name}</div>
          <Text type="secondary" style={{ fontSize: 12 }}>+{record.customerPhone.replace(/^\+/, "")}</Text>
        </div>
      ),
    },
    {
      title: "Amount",
      dataIndex: "totalAmount",
      key: "totalAmount",
      render: (amt: number) => <Text strong>₹{amt.toLocaleString()}</Text>,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string, record: Order) => (
        <Select
          value={status}
          style={{ width: 140 }}
          loading={statusUpdating === record.id}
          onChange={(val) => handleStatusChange(record.id, val)}
          options={[
            { value: "pending", label: <Tag color="orange">Pending</Tag> },
            { value: "confirmed", label: <Tag color="blue">Confirmed</Tag> },
            { value: "dispatched", label: <Tag color="purple">Dispatched</Tag> },
            { value: "delivered", label: <Tag color="green">Delivered</Tag> },
            { value: "cancelled", label: <Tag color="red">Cancelled</Tag> },
          ]}
        />
      ),
    },
    {
      title: "Date",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: "Notes",
      dataIndex: "notes",
      key: "notes",
      render: (notes: string) => notes || "-",
    },
    {
      title: "Action",
      key: "action",
      render: (_: any, record: Order) => (
        <Button
          size="small"
          type="primary"
          icon={<WhatsAppOutlined />}
          loading={sendingBillId === record.id}
          onClick={() => handleSendWhatsAppBill(record)}
          style={{ background: "#25D366", borderColor: "#25D366" }}
        >
          Send Bill
        </Button>
      ),
    },
  ];

  return (
    <AppLayout>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>Orders & Sales</Title>
          <Text type="secondary">Manage customer orders and automatic WhatsApp delivery updates</Text>
        </div>
        <Space>
          <Button icon={<SyncOutlined />} onClick={loadOrders} loading={loading}>
            Refresh
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setCreateModalVisible(true)}
            style={{ background: "#25D366", borderColor: "#25D366" }}
          >
            New Order
          </Button>
        </Space>
      </div>

      <Card style={{ borderRadius: 12 }}>
        <Table
          dataSource={orders}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* Create Order Modal */}
      <Modal
        title="Create New Order"
        open={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleCreateOrder} initialValues={{ status: "pending" }}>
          <Form.Item
            name="customerName"
            label="Customer Name"
            rules={[{ required: true, message: "Please enter customer name" }]}
          >
            <Input placeholder="e.g. Ramesh Kumar" />
          </Form.Item>

          <Form.Item
            name="customerPhone"
            label="Customer WhatsApp Phone Number"
            rules={[{ required: true, message: "Please enter phone number" }]}
          >
            <Input placeholder="e.g. 919876543210" />
          </Form.Item>

          <Form.Item
            name="totalAmount"
            label="Total Amount (₹)"
            rules={[{ required: true, message: "Please enter total amount" }]}
          >
            <InputNumber style={{ width: "100%" }} min={0} placeholder="1500" />
          </Form.Item>

          <Form.Item name="notes" label="Order Details / Notes">
            <Input.TextArea rows={3} placeholder="e.g. 5 boxes of cotton shirts, delivery before Monday" />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              block
              style={{ background: "#25D366", borderColor: "#25D366", fontWeight: 600 }}
            >
              Save Order
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </AppLayout>
  );
}