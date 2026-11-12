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
  Tag,
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  SyncOutlined,
  DownloadOutlined,
  ShopOutlined,
  CopyOutlined,
} from "@ant-design/icons";
import { api } from "../../lib/api";
import { downloadCsv } from "../../lib/csv";
import { useAuth } from "../../context/AuthContext";

const { Title, Text } = Typography;

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  unit: string;
  stock: number;
  imageUrl?: string;
}

export default function ProductsPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form] = Form.useForm();

  const loadProducts = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/products");
      setProducts(res.data.products || []);
    } catch {
      message.error("Could not load items");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleSaveProduct = async (values: any) => {
    try {
      if (editingProduct) {
        await api.put(`/api/products/${editingProduct.id}`, values);
        message.success("Item updated successfully!");
      } else {
        await api.post("/api/products", values);
        message.success("Item added to catalog!");
      }
      setModalVisible(false);
      setEditingProduct(null);
      form.resetFields();
      loadProducts();
    } catch (err: any) {
      message.error(err.message || "Failed to save item");
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      await api.delete(`/api/products/${id}`);
      message.success("Item removed from catalog");
      loadProducts();
    } catch {
      message.error("Failed to delete item");
    }
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    form.setFieldsValue(product);
    setModalVisible(true);
  };

  const columns = [
    {
      title: "Item Name",
      dataIndex: "name",
      key: "name",
      render: (name: string, record: Product) => (
        <div>
          <div style={{ fontWeight: 600 }}>{name}</div>
          <Text type="secondary" style={{ fontSize: 12 }}>{record.description || "No description"}</Text>
        </div>
      ),
    },
    {
      title: "Price",
      dataIndex: "price",
      key: "price",
      render: (price: number, record: Product) => (
        <Text strong>₹{price.toLocaleString()} / {record.unit || "unit"}</Text>
      ),
    },
    {
      title: "Available Stock",
      dataIndex: "stock",
      key: "stock",
      render: (stock: number) => (
        <Tag color={stock > 10 ? "green" : stock > 0 ? "orange" : "red"}>
          {stock > 0 ? `${stock} in stock` : "Out of stock"}
        </Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: Product) => (
        <Space>
          <Button icon={<EditOutlined />} size="small" onClick={() => openEditModal(record)}>
            Edit
          </Button>
          <Popconfirm
            title="Remove item?"
            description="Are you sure you want to remove this item from your catalog?"
            onConfirm={() => handleDeleteProduct(record.id)}
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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>Catalog &amp; Items</Title>
          <Text type="secondary">Manage your product offerings, pricing, and available stock</Text>
        </div>
        <Space wrap>
          <Button
            icon={<DownloadOutlined />}
            onClick={() =>
              downloadCsv(
                "giniespace-catalog.csv",
                ["ID", "Name", "Description", "Price", "Unit", "Stock"],
                products.map((p) => [p.id, p.name, p.description, p.price, p.unit, p.stock])
              )
            }
          >
            Export CSV
          </Button>
          <Button icon={<SyncOutlined />} onClick={loadProducts} loading={loading}>
            Refresh
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingProduct(null);
              form.resetFields();
              setModalVisible(true);
            }}
            style={{ background: "#25D366", borderColor: "#25D366" }}
          >
            Add Item
          </Button>
        </Space>
      </div>

      {user?.id && (
        <Card size="small" style={{ marginBottom: 16, borderRadius: 12, background: "#f0fdf4", borderColor: "#bbf7d0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <div>
              <Text strong style={{ color: "#15803d" }}>
                <ShopOutlined /> Shareable Public Catalog Link:
              </Text>{" "}
              <Text code>{`https://app.ginie.space/shop/${user.id}`}</Text>
            </div>
            <Space>
              <Button
                size="small"
                icon={<CopyOutlined />}
                onClick={() => {
                  const url = `${window.location.origin}/shop/${user.id}`;
                  navigator.clipboard?.writeText(url);
                  message.success("Storefront link copied!");
                }}
              >
                Copy Link
              </Button>
              <Button size="small" type="primary" href={`/shop/${user.id}`} target="_blank">
                Preview Store
              </Button>
            </Space>
          </div>
        </Card>
      )}

      <Card style={{ borderRadius: 12 }}>
        <Table
          dataSource={products}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title={editingProduct ? "Edit Item" : "Add New Item"}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingProduct(null);
        }}
        footer={null}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSaveProduct} initialValues={{ unit: "pcs", stock: 10 }}>
          <Form.Item
            name="name"
            label="Item / Product Name"
            rules={[{ required: true, message: "Please enter item name" }]}
          >
            <Input placeholder="e.g. Premium Cotton Shirt" />
          </Form.Item>

          <Form.Item name="description" label="Short Description">
            <Input.TextArea rows={2} placeholder="Material, specs, or pack sizes..." />
          </Form.Item>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Form.Item
              name="price"
              label="Price (₹)"
              rules={[{ required: true, message: "Please enter price" }]}
            >
              <InputNumber style={{ width: "100%" }} min={0} placeholder="499" />
            </Form.Item>

            <Form.Item name="unit" label="Unit">
              <Input placeholder="e.g. pcs, kg, box, meter" />
            </Form.Item>
          </div>

          <Form.Item name="stock" label="Stock Quantity">
            <InputNumber style={{ width: "100%" }} min={0} placeholder="50" />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              block
              style={{ background: "#25D366", borderColor: "#25D366", fontWeight: 600 }}
            >
              {editingProduct ? "Save Changes" : "Add to Catalog"}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </AppLayout>
  );
}