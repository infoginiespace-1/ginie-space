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
  Typography,
  message,
  Popconfirm,
} from "antd";
import { PlusOutlined, MessageOutlined, DeleteOutlined, SyncOutlined } from "@ant-design/icons";
import { api } from "../../lib/api";
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
  const router = useRouter();

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/customers");
      setCustomers(res.data.customers || []);
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
      render: (phone: string) => <Text strong>+{phone}</Text>,
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
            onClick={() => router.push("/inbox")}
            style={{ background: "#25D366", borderColor: "#25D366" }}
          >
            Chat
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

  return (
    <AppLayout>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>Customer Directory</Title>
          <Text type="secondary">Manage your clients, direct phone numbers, and WhatsApp conversations</Text>
        </div>
        <Space>
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
        <Table
          dataSource={customers}
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
    </AppLayout>
  );
}