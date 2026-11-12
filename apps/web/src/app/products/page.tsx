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
  Select,
  Typography,
  message,
  Popconfirm,
  Tag,
  Upload,
  Alert,
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  SyncOutlined,
  DownloadOutlined,
  ShopOutlined,
  CopyOutlined,
  UploadOutlined,
  PictureOutlined,
} from "@ant-design/icons";
import { api } from "../../lib/api";
import { downloadCsv, parseCsv } from "../../lib/csv";
import { useAuth } from "../../context/AuthContext";

const { Title, Text } = Typography;

const CONTAINER_UNITS = ["pack", "carton", "jar"] as const;
const MAX_IMAGE_BYTES = 60 * 1024; // Strict 60 KB upload limit
const MAX_SHEETS_DATAURL_CHARS = 46000; // Fits safely inside Google Sheets 50k cell limit

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  unit: string;
  stock: number;
  imageUrl?: string;
  category?: string;
  minOrderQty?: number;
  costPrice?: number;
}

function isContainerUnit(unit?: string): boolean {
  return CONTAINER_UNITS.includes((unit || "").toLowerCase() as any);
}

function parseUnitField(rawUnit?: string): {
  unitType: string;
  packQty?: number;
  packSubUnit: string;
} {
  const val = (rawUnit || "pcs").trim();
  const match = val.match(/^(pack|carton|cartoon|jar)\s*\(\s*(\d+(?:\.\d+)?)\s+([a-zA-Z]+)\s*\)$/i);
  if (match) {
    const normalizedType = match[1].toLowerCase() === "cartoon" ? "carton" : match[1].toLowerCase();
    return {
      unitType: normalizedType,
      packQty: Number(match[2]),
      packSubUnit: match[3].toLowerCase(),
    };
  }
  const lower = val.toLowerCase();
  if (["pcs", "gram", "kg", "pack", "carton", "jar"].includes(lower)) {
    return { unitType: lower, packQty: isContainerUnit(lower) ? 10 : undefined, packSubUnit: "pcs" };
  }
  if (lower === "cartoon") {
    return { unitType: "carton", packQty: 10, packSubUnit: "pcs" };
  }
  return { unitType: "pcs", packQty: undefined, packSubUnit: "pcs" };
}

function formatUnitField(unitType: string, packQty?: number, packSubUnit?: string): string {
  const base = (unitType || "pcs").toLowerCase();
  if (isContainerUnit(base) && packQty && Number(packQty) > 0) {
    return `${base} (${Number(packQty)} ${(packSubUnit || "pcs").toLowerCase()})`;
  }
  return base;
}

async function readAndFitJpgForSheets(file: File): Promise<string> {
  const rawDataUrl: string = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Could not read selected image"));
    reader.readAsDataURL(file);
  });

  if (rawDataUrl.length <= MAX_SHEETS_DATAURL_CHARS) {
    return rawDataUrl;
  }

  // Re-encode JPEG slightly on canvas if base64 overhead exceeds Google Sheets single-cell cap
  const img: HTMLImageElement = await new Promise((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error("Invalid JPEG image file"));
    el.src = rawDataUrl;
  });

  let maxDim = 480;
  let quality = 0.82;
  let fitted = rawDataUrl;

  for (let attempt = 0; attempt < 6 && fitted.length > MAX_SHEETS_DATAURL_CHARS; attempt++) {
    const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
    const width = Math.max(1, Math.round(img.width * scale));
    const height = Math.max(1, Math.round(img.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) break;
    ctx.drawImage(img, 0, 0, width, height);
    fitted = canvas.toDataURL("image/jpeg", quality);
    quality = Math.max(0.45, quality - 0.12);
    maxDim = Math.round(maxDim * 0.82);
  }

  return fitted;
}

export default function ProductsPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [csvModalOpen, setCsvModalOpen] = useState(false);
  const [importingCsv, setImportingCsv] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [form] = Form.useForm();

  const watchedUnitType = Form.useWatch("unitType", form) || "pcs";
  const watchedPackQty = Form.useWatch("packQty", form);
  const watchedPackSubUnit = Form.useWatch("packSubUnit", form) || "pcs";
  const watchedPrice = Form.useWatch("price", form);
  const watchedStock = Form.useWatch("stock", form);
  const containerEnabled = isContainerUnit(watchedUnitType);

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

  const handleBeforeImageUpload = async (file: File) => {
    const lowerName = (file.name || "").toLowerCase();
    const isJpgMime = file.type === "image/jpeg" || file.type === "image/jpg";
    const isJpgExt = lowerName.endsWith(".jpg") || lowerName.endsWith(".jpeg");

    if (!isJpgMime || !isJpgExt) {
      message.error("Sirf JPG / JPEG (.jpg, .jpeg) format image hi upload kar sakte hain!");
      return Upload.LIST_IGNORE;
    }

    if (file.size > MAX_IMAGE_BYTES) {
      const kb = (file.size / 1024).toFixed(1);
      message.error(`Image size ${kb} KB hai. 60 KB se kam size ka JPG image upload karein!`);
      return Upload.LIST_IGNORE;
    }

    try {
      const fittedDataUrl = await readAndFitJpgForSheets(file);
      if (fittedDataUrl.length > MAX_SHEETS_DATAURL_CHARS) {
        message.error("Image data zyada bada hai. Kripya chhota JPG image choose karein (<= 60 KB).");
        return Upload.LIST_IGNORE;
      }
      setImagePreview(fittedDataUrl);
      message.success(`JPG image attached (${(file.size / 1024).toFixed(1)} KB)`);
    } catch (err: any) {
      message.error(err.message || "Could not process image");
    }

    return false; // Prevent automatic HTTP upload by AntD Upload
  };

  const handleSaveProduct = async (values: any) => {
    try {
      setSaving(true);
      const formattedUnit = formatUnitField(values.unitType, values.packQty, values.packSubUnit);
      const payload = {
        name: values.name,
        description: values.description || "",
        price: Number(values.price) || 0,
        costPrice: values.costPrice !== undefined && values.costPrice !== null ? Number(values.costPrice) : undefined,
        unit: formattedUnit,
        stock: values.stock !== undefined ? Number(values.stock) : 0,
        imageUrl: imagePreview || "",
        category: values.category ? String(values.category).trim() : "General",
        minOrderQty: values.minOrderQty ? Math.max(1, Number(values.minOrderQty) || 1) : 1,
      };

      if (editingProduct) {
        await api.put(`/api/products/${editingProduct.id}`, payload);
        message.success("Item updated successfully!");
      } else {
        await api.post("/api/products", payload);
        message.success("Item added to catalog!");
      }
      setModalVisible(false);
      setEditingProduct(null);
      setImagePreview("");
      form.resetFields();
      loadProducts();
    } catch (err: any) {
      message.error(err.message || "Failed to save item");
    } finally {
      setSaving(false);
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

  const handleBulkCsvFile = async (file: File) => {
    try {
      setImportingCsv(true);
      const text = await file.text();
      const rows = parseCsv(text);
      if (rows.length < 2) {
        message.error("CSV must contain a header row and at least 1 product row");
        return Upload.LIST_IGNORE;
      }
      const header = rows[0].map((h) => h.trim().toLowerCase());
      const nameIdx = header.findIndex((h) => h.includes("name"));
      const descIdx = header.findIndex((h) => h.includes("desc"));
      const priceIdx = header.findIndex((h) => h.includes("price") || h.includes("rate"));
      const unitIdx = header.findIndex((h) => h.includes("unit"));
      const stockIdx = header.findIndex((h) => h.includes("stock") || h.includes("qty"));
      const catIdx = header.findIndex((h) => h.includes("cat"));
      const moqIdx = header.findIndex((h) => h.includes("moq") || h.includes("min"));

      if (nameIdx === -1 || priceIdx === -1) {
        message.error("CSV header must include 'Name' and 'Price' columns");
        return Upload.LIST_IGNORE;
      }

      let imported = 0;
      for (const cols of rows.slice(1)) {
        const name = (cols[nameIdx] || "").trim();
        const price = Number(cols[priceIdx]);
        if (!name || Number.isNaN(price)) continue;
        await api.post("/api/products", {
          name,
          description: descIdx >= 0 ? (cols[descIdx] || "").trim() : "",
          price,
          unit: unitIdx >= 0 && cols[unitIdx]?.trim() ? cols[unitIdx].trim() : "pcs",
          stock: stockIdx >= 0 && !Number.isNaN(Number(cols[stockIdx])) ? Number(cols[stockIdx]) : 10,
          category: catIdx >= 0 && cols[catIdx]?.trim() ? cols[catIdx].trim() : "General",
          minOrderQty: moqIdx >= 0 && Number(cols[moqIdx]) > 1 ? Number(cols[moqIdx]) : 1,
        });
        imported++;
      }

      message.success(`Imported ${imported} products into catalog!`);
      setCsvModalOpen(false);
      loadProducts();
    } catch (err: any) {
      message.error(err.message || "Failed to import CSV products");
    } finally {
      setImportingCsv(false);
    }
    return false;
  };

  const openAddModal = () => {
    setEditingProduct(null);
    setImagePreview("");
    form.resetFields();
    form.setFieldsValue({
      unitType: "pcs",
      packQty: undefined,
      packSubUnit: "pcs",
      stock: 10,
      category: "General",
      minOrderQty: 1,
    });
    setModalVisible(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    const parsedUnit = parseUnitField(product.unit);
    setImagePreview(product.imageUrl || "");
    form.setFieldsValue({
      name: product.name,
      description: product.description,
      price: product.price,
      costPrice: product.costPrice,
      stock: product.stock,
      unitType: parsedUnit.unitType,
      packQty: parsedUnit.packQty,
      category: product.category || "General",
      minOrderQty: product.minOrderQty || 1,
      packSubUnit: parsedUnit.packSubUnit,
    });
    setModalVisible(true);
  };

  const columns = [
    {
      title: "Product",
      dataIndex: "name",
      key: "name",
      render: (name: string, record: Product) => (
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {record.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={record.imageUrl}
              alt={name}
              style={{
                width: 48,
                height: 48,
                objectFit: "cover",
                borderRadius: 8,
                border: "1px solid #e2e8f0",
                flexShrink: 0,
              }}
            />
          ) : (
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 8,
                background: "#f1f5f9",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#94a3b8",
                flexShrink: 0,
              }}
            >
              <PictureOutlined style={{ fontSize: 18 }} />
            </div>
          )}
          <div>
            <div style={{ fontWeight: 600 }}>
              {name}{" "}
              {record.category && record.category !== "General" && (
                <Tag color="blue" style={{ fontSize: 11 }}>{record.category}</Tag>
              )}
              {Number(record.minOrderQty) > 1 && (
                <Tag color="purple" style={{ fontSize: 11 }}>MOQ: {record.minOrderQty}</Tag>
              )}
            </div>
            <Text type="secondary" style={{ fontSize: 12 }}>{record.description || "No description"}</Text>
          </div>
        </div>
      ),
    },
    {
      title: "Price / Margin",
      dataIndex: "price",
      key: "price",
      render: (price: number, record: Product) => {
        const sell = Number(price || 0);
        const cost = Number(record.costPrice || 0);
        const profit = cost > 0 ? sell - cost : 0;
        const marginPct = cost > 0 && sell > 0 ? Math.round((profit / sell) * 100) : 0;
        return (
          <div>
            <Text strong>₹{sell.toLocaleString()} / {record.unit || "pcs"}</Text>
            {cost > 0 && (
              <div style={{ fontSize: 11, color: profit >= 0 ? "#16a34a" : "#ef4444" }}>
                Cost: ₹{cost.toLocaleString()} • {profit >= 0 ? `+₹${profit.toLocaleString()} (${marginPct}%)` : `-₹${Math.abs(profit).toLocaleString()}`}
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: "Available Stock",
      dataIndex: "stock",
      key: "stock",
      render: (stock: number, record: Product) => (
        <Tag color={stock > 10 ? "green" : stock > 0 ? "orange" : "red"}>
          {stock > 0 ? `${stock} (${record.unit || "pcs"})` : "Out of stock"}
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
          <Text type="secondary">Manage products, pack/carton/jar quantities, pricing, and JPG images</Text>
        </div>
        <Space wrap>
          <Button icon={<UploadOutlined />} onClick={() => setCsvModalOpen(true)}>
            Import CSV
          </Button>
          <Button
            icon={<DownloadOutlined />}
            onClick={() =>
              downloadCsv(
                "giniespace-catalog.csv",
                ["ID", "Name", "Category", "Description", "Price", "CostPrice", "Unit", "Stock", "MinOrderQty"],
                products.map((p) => [p.id, p.name, p.category || "General", p.description, p.price, p.costPrice ?? "", p.unit, p.stock, p.minOrderQty || 1])
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
            onClick={openAddModal}
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
        <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
          <Input
            placeholder="Search products by name or description..."
            allowClear
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ maxWidth: 300 }}
          />
          <Select
            value={categoryFilter}
            onChange={setCategoryFilter}
            style={{ width: 190 }}
            options={[
              { value: "all", label: "All Categories" },
              ...Array.from(new Set(products.map((p) => p.category || "General"))).map((cat) => ({
                value: cat,
                label: cat,
              })),
            ]}
          />
        </div>
        <Table
          dataSource={products.filter((p) => {
            const matchesCat = categoryFilter === "all" || (p.category || "General") === categoryFilter;
            const q = searchTerm.trim().toLowerCase();
            const matchesSearch =
              !q ||
              p.name.toLowerCase().includes(q) ||
              (p.description || "").toLowerCase().includes(q) ||
              (p.category || "").toLowerCase().includes(q);
            return matchesCat && matchesSearch;
          })}
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
          setImagePreview("");
        }}
        footer={null}
        destroyOnClose
        width={540}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSaveProduct}
          initialValues={{ unitType: "pcs", packSubUnit: "pcs", stock: 10 }}
        >
          <Form.Item
            name="name"
            label="Item / Product Name"
            rules={[{ required: true, message: "Please enter item name" }]}
          >
            <Input placeholder="e.g. Soan Papdi — Bharat Gold" />
          </Form.Item>

          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
            <Form.Item name="category" label="Category">
              <Select
                showSearch
                placeholder="Select or type category"
                options={[
                  { value: "General", label: "General" },
                  { value: "Sweets & Snacks", label: "Sweets & Snacks" },
                  { value: "Grocery & FMCG", label: "Grocery & FMCG" },
                  { value: "Clothing & Textile", label: "Clothing & Textile" },
                  { value: "Hardware & Tools", label: "Hardware & Tools" },
                  { value: "Electronics", label: "Electronics" },
                  { value: "Dairy & Bakery", label: "Dairy & Bakery" },
                  { value: "Wholesale Bulk", label: "Wholesale Bulk" },
                ]}
              />
            </Form.Item>
            <Form.Item name="minOrderQty" label="Min Order Qty (MOQ)">
              <InputNumber style={{ width: "100%" }} min={1} placeholder="1" />
            </Form.Item>
          </div>

          <Form.Item name="description" label="Short Description">
            <Input.TextArea rows={2} placeholder="Flavour, brand, specs, or packaging details..." />
          </Form.Item>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <Form.Item
              name="price"
              label="Selling Price (₹)"
              rules={[{ required: true, message: "Please enter price" }]}
            >
              <InputNumber style={{ width: "100%" }} min={0} placeholder="499" />
            </Form.Item>

            <Form.Item name="costPrice" label="Cost / Buy Rate (₹)">
              <InputNumber style={{ width: "100%" }} min={0} placeholder="350" />
            </Form.Item>

            <Form.Item
              name="unitType"
              label="Unit"
              rules={[{ required: true, message: "Select a unit" }]}
            >
              <Select
                onChange={(val) => {
                  if (!isContainerUnit(val)) {
                    form.setFieldValue("packQty", undefined);
                  } else if (!form.getFieldValue("packQty")) {
                    form.setFieldValue("packQty", 10);
                  }
                }}
                options={[
                  { value: "pcs", label: "Pcs (Pieces)" },
                  { value: "gram", label: "Gram (g)" },
                  { value: "kg", label: "Kg (Kilogram)" },
                  { value: "pack", label: "Pack" },
                  { value: "carton", label: "Carton (Box)" },
                  { value: "jar", label: "Jar" },
                ]}
              />
            </Form.Item>
          </div>

          {/* Conditional Container Quantity Row (Enabled ONLY for pack, carton, jar) */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Form.Item
              name="packQty"
              label={
                containerEnabled
                  ? `Qty inside 1 ${watchedUnitType.toUpperCase()}`
                  : "Qty inside Pack / Carton / Jar"
              }
              rules={
                containerEnabled
                  ? [{ required: true, message: `Enter quantity inside 1 ${watchedUnitType}` }]
                  : []
              }
            >
              <InputNumber
                style={{ width: "100%" }}
                min={1}
                disabled={!containerEnabled}
                placeholder={containerEnabled ? "e.g. 12, 24, 500" : "Only for Pack / Carton / Jar"}
              />
            </Form.Item>

            <Form.Item name="packSubUnit" label="Inner Measurement">
              <Select
                disabled={!containerEnabled}
                options={[
                  { value: "pcs", label: "pcs" },
                  { value: "gram", label: "gram" },
                  { value: "kg", label: "kg" },
                  { value: "pack", label: "pack" },
                ]}
              />
            </Form.Item>
          </div>

          {containerEnabled && watchedPackQty > 0 && (
            <Alert
              type="info"
              showIcon
              style={{ marginBottom: 16, borderRadius: 8 }}
              message={
                <span>
                  1 <strong>{watchedUnitType}</strong> ={" "}
                  <strong>{watchedPackQty} {watchedPackSubUnit}</strong>
                  {watchedPrice > 0 && (
                    <> • Rate: <strong>₹{(Number(watchedPrice) / Number(watchedPackQty)).toFixed(2)} / {watchedPackSubUnit}</strong></>
                  )}
                  {watchedStock > 0 && (
                    <> • Total Stock: <strong>{Number(watchedStock) * Number(watchedPackQty)} {watchedPackSubUnit}</strong></>
                  )}
                </span>
              }
            />
          )}

          <Form.Item name="stock" label={`Stock Quantity (${watchedUnitType})`}>
            <InputNumber style={{ width: "100%" }} min={0} placeholder="50" />
          </Form.Item>

          {/* Product JPG Image Upload (Max 60 KB) */}
          <Form.Item label="Product Image (JPG only, Max 60 KB)">
            <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
              {imagePreview ? (
                <div style={{ position: "relative" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imagePreview}
                    alt="Product Preview"
                    style={{
                      width: 84,
                      height: 84,
                      objectFit: "cover",
                      borderRadius: 10,
                      border: "2px solid #25D366",
                    }}
                  />
                </div>
              ) : (
                <div
                  style={{
                    width: 84,
                    height: 84,
                    borderRadius: 10,
                    background: "#f8fafc",
                    border: "1px dashed #cbd5e1",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#94a3b8",
                  }}
                >
                  <PictureOutlined style={{ fontSize: 24 }} />
                </div>
              )}

              <Space direction="vertical" size={6}>
                <Space>
                  <Upload
                    accept=".jpg,.jpeg,image/jpeg"
                    showUploadList={false}
                    beforeUpload={handleBeforeImageUpload}
                  >
                    <Button icon={<UploadOutlined />}>
                      {imagePreview ? "Change JPG" : "Upload JPG (<= 60 KB)"}
                    </Button>
                  </Upload>
                  {imagePreview && (
                    <Button danger size="small" onClick={() => setImagePreview("")}>
                      Remove
                    </Button>
                  )}
                </Space>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Allowed format: <strong>.jpg / .jpeg</strong> • Strict max size: <strong>60 KB</strong>
                </Text>
              </Space>
            </div>
          </Form.Item>

          <Form.Item style={{ marginBottom: 0 }}>
            <Button
              type="primary"
              htmlType="submit"
              block
              loading={saving}
              style={{ background: "#25D366", borderColor: "#25D366", fontWeight: 600 }}
            >
              {editingProduct ? "Save Changes" : "Add to Catalog"}
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Bulk Import Catalog Products (CSV)"
        open={csvModalOpen}
        onCancel={() => setCsvModalOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Space direction="vertical" style={{ width: "100%" }} size={14}>
          <Alert
            type="info"
            showIcon
            message="Expected CSV Columns: Name, Description, Price, Unit, Stock"
            description="Example: Basmati Rice 5kg, Premium aged grain, 480, pack (5 kg), 25"
          />
          <Space>
            <Button
              icon={<DownloadOutlined />}
              onClick={() =>
                downloadCsv(
                  "giniespace-products-template.csv",
                  ["Name", "Description", "Price", "Unit", "Stock"],
                  [
                    ["Cotton Kurti", "Handloom festive kurti", 599, "pcs", 25],
                    ["Soan Papdi Box", "Bharat Gold Sweets", 450, "pack (12 pcs)", 40],
                  ]
                )
              }
            >
              Download Sample CSV
            </Button>
            <Upload accept=".csv,text/csv" showUploadList={false} beforeUpload={handleBulkCsvFile}>
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
    </AppLayout>
  );
}
