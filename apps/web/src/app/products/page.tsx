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
  Segmented,
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
  ThunderboltOutlined,
  CrownOutlined,
  WhatsAppOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { Radio } from "antd";
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
  itemType?: "product" | "service";
  duration?: string;
  serviceMode?: "at_store" | "home_visit" | "online" | "any";
  dietary?: "veg" | "non_veg" | "egg";
  sizes?: string;
  colors?: string;
  roomType?: string;
}

const SERVICE_UNITS = ["session", "visit", "hour", "day", "month", "year", "project"] as const;

const SERVICE_MODE_LABELS: Record<string, string> = {
  home_visit: "Home Visit",
  at_store: "At Store / Clinic",
  online: "Online / Remote",
  any: "Store or Home Visit",
};

const TRENDING_PACK_META = [
  { key: "ac_repair", title: "AC, RO & Appliance Repair", desc: "Split AC Foam-Jet, Gas Refill, RO Service & Annual AMC (4 services)" },
  { key: "salon", title: "Salon, Spa & Bridal Makeup", desc: "Haircut & Styling, Bridal HD Makeup & Hydra Facial (3 services)" },
  { key: "clinic", title: "Clinic, Dental & Diagnostics", desc: "Doctor Consult, Dental Scaling & Home Blood Test (3 services)" },
  { key: "auto", title: "Car & Two-Wheeler Workshop", desc: "Periodic Car Service, Foam Wash & Bike Tune-Up (3 services)" },
  { key: "agency", title: "Digital Agency & CA/GST Services", desc: "Website Setup, Meta Ads Retainer & Monthly GST Filing (3 services)" },
  { key: "coaching", title: "Coaching, Fitness & Classes", desc: "1-on-1 Live Session & Monthly Batch Plan (2 services)" },
];

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
  if (["pcs", "gram", "kg", "pack", "carton", "jar", "plate", "portion", "dish", "bowl", "cup", "night", "set", "pair", ...SERVICE_UNITS].includes(lower)) {
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
  const [typeFilter, setTypeFilter] = useState<"all" | "product" | "service">("all");
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [importingPack, setImportingPack] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [storeSlug, setStoreSlug] = useState<string>("");
  const [form] = Form.useForm();

  // Feature 7: Low Stock Alerts & Supplier WhatsApp PO State
  const [stockFilter, setStockFilter] = useState<"all" | "low_stock">("all");
  const [poProduct, setPoProduct] = useState<Product | null>(null);
  const [poQty, setPoQty] = useState<number>(10);
  const [poSupplierPhone, setPoSupplierPhone] = useState<string>("");
  const [poNotes, setPoNotes] = useState<string>("");
  const [bulkPoModalOpen, setBulkPoModalOpen] = useState<boolean>(false);
  const [bulkPoSupplierPhone, setBulkPoSupplierPhone] = useState<string>("");
  const [businessName, setBusinessName] = useState<string>("Our Store");
  const [businessAddress, setBusinessAddress] = useState<string>("");

  const watchedItemType = Form.useWatch("itemType", form) || "product";
  const watchedUnitType = Form.useWatch("unitType", form) || "pcs";
  const watchedPackQty = Form.useWatch("packQty", form);
  const watchedPackSubUnit = Form.useWatch("packSubUnit", form) || "pcs";
  const watchedPrice = Form.useWatch("price", form);
  const watchedStock = Form.useWatch("stock", form);
  const isServiceForm = watchedItemType === "service";
  const containerEnabled = !isServiceForm && isContainerUnit(watchedUnitType);

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
    api.get("/api/settings")
      .then((res) => {
        const b = res.data?.business;
        if (b) {
          if (b.name) setBusinessName(b.name);
          if (b.address) setBusinessAddress(b.address);
          if (b.slug) setStoreSlug(String(b.slug));
        }
      })
      .catch(() => {});
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
        stock: values.itemType === "service" ? 999999 : values.stock !== undefined ? Number(values.stock) : 0,
        imageUrl: imagePreview || "",
        category: values.category ? String(values.category).trim() : values.itemType === "service" ? "Services" : "General",
        minOrderQty: values.minOrderQty ? Math.max(1, Number(values.minOrderQty) || 1) : 1,
        itemType: values.itemType === "service" ? "service" : "product",
        duration: values.duration ? String(values.duration).trim() : undefined,
        serviceMode: values.itemType === "service" ? values.serviceMode || "any" : undefined,
        dietary: values.dietary || undefined,
        sizes: values.sizes ? String(values.sizes).trim() : undefined,
        colors: values.colors ? String(values.colors).trim() : undefined,
        roomType: values.roomType ? String(values.roomType).trim() : undefined,
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
      const errMsg = err.response?.data?.error || err.message || "Failed to save item";
      message.error(errMsg);
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
      const typeIdx = header.findIndex((h) => h.includes("type"));
      const durIdx = header.findIndex((h) => h.includes("dur"));
      const modeIdx = header.findIndex((h) => h.includes("mode"));

      if (nameIdx === -1 || priceIdx === -1) {
        message.error("CSV header must include 'Name' and 'Price' columns");
        return Upload.LIST_IGNORE;
      }

      const itemsToUpload = [];
      for (const cols of rows.slice(1)) {
        const name = (cols[nameIdx] || "").trim();
        const price = Number(cols[priceIdx]);
        if (!name || Number.isNaN(price)) continue;
        const itemTypeVal = typeIdx >= 0 && cols[typeIdx]?.trim().toLowerCase() === "service" ? "service" : "product";
        itemsToUpload.push({
          name,
          description: descIdx >= 0 ? (cols[descIdx] || "").trim() : "",
          price,
          unit: unitIdx >= 0 && cols[unitIdx]?.trim() ? cols[unitIdx].trim() : itemTypeVal === "service" ? "session" : "pcs",
          stock: stockIdx >= 0 && !Number.isNaN(Number(cols[stockIdx])) ? Number(cols[stockIdx]) : itemTypeVal === "service" ? 999999 : 10,
          category: catIdx >= 0 && cols[catIdx]?.trim() ? cols[catIdx].trim() : itemTypeVal === "service" ? "Services" : "General",
          minOrderQty: moqIdx >= 0 && Number(cols[moqIdx]) > 1 ? Number(cols[moqIdx]) : 1,
          itemType: itemTypeVal,
          duration: durIdx >= 0 ? (cols[durIdx] || "").trim() || undefined : undefined,
          serviceMode: modeIdx >= 0 ? (cols[modeIdx] || "").trim() || undefined : undefined,
        });
      }

      if (itemsToUpload.length === 0) {
        message.warning("No valid product rows found in CSV");
        return Upload.LIST_IGNORE;
      }

      const res = await api.post("/api/products/bulk", { items: itemsToUpload });
      message.success(res.data?.message || `Successfully imported ${res.data?.createdCount} products!`);
      setCsvModalOpen(false);
      loadProducts();
    } catch (err: any) {
      message.error(err.message || "Failed to import CSV products");
    } finally {
      setImportingCsv(false);
    }
    return false;
  };

  const handleImportPack = async (packKey: string) => {
    try {
      setImportingPack(packKey);
      const res = await api.post("/api/products/service-templates", { pack: packKey });
      message.success(res.data?.message || "Service pack imported!");
      setTemplateModalOpen(false);
      loadProducts();
    } catch (err: any) {
      const errMsg = err.response?.data?.error || err.message || "Could not import service pack";
      message.error(errMsg);
    } finally {
      setImportingPack(null);
    }
  };

  const openAddModal = () => {
    const bType = user?.businessType || "retail";
    const defaultService = bType === "services";
    const defaultUnit =
      bType === "services"
        ? "session"
        : bType === "restaurant"
        ? "plate"
        : bType === "hotel"
        ? "night"
        : bType === "wholesale"
        ? "pack"
        : "pcs";
    const defaultCategory =
      bType === "services"
        ? "Services"
        : bType === "restaurant"
        ? "Main Course"
        : bType === "garments"
        ? "Clothing"
        : bType === "hotel"
        ? "Room Stay"
        : "General";

    setEditingProduct(null);
    setImagePreview("");
    form.resetFields();
    form.setFieldsValue({
      itemType: defaultService ? "service" : "product",
      unitType: defaultUnit,
      packQty: bType === "wholesale" ? 10 : undefined,
      packSubUnit: "pcs",
      stock: defaultService ? 999999 : bType === "hotel" ? 5 : 10,
      category: defaultCategory,
      minOrderQty: bType === "wholesale" ? 5 : 1,
      duration: defaultService ? "60 mins" : undefined,
      serviceMode: defaultService ? "any" : undefined,
      dietary: bType === "restaurant" ? "veg" : undefined,
      sizes: bType === "garments" ? "S, M, L, XL" : undefined,
      colors: bType === "garments" ? "Black, White, Navy Blue" : undefined,
      roomType: bType === "hotel" ? "Deluxe AC Room" : undefined,
    });
    setModalVisible(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    const parsedUnit = parseUnitField(product.unit);
    setImagePreview(product.imageUrl || "");
    form.setFieldsValue({
      itemType: product.itemType || "product",
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
      duration: product.duration || "",
      serviceMode: product.serviceMode || "any",
      dietary: product.dietary,
      sizes: product.sizes || "",
      colors: product.colors || "",
      roomType: product.roomType || "",
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
              {record.itemType === "service" && (
                <Tag color="geekblue" style={{ fontSize: 11 }}>Service</Tag>
              )}
              {record.category && record.category !== "General" && (
                <Tag color="blue" style={{ fontSize: 11 }}>{record.category}</Tag>
              )}
              {record.duration && (
                <Tag color="cyan" style={{ fontSize: 11 }}>{record.duration}</Tag>
              )}
              {record.itemType === "service" && record.serviceMode && (
                <Tag color="purple" style={{ fontSize: 11 }}>{SERVICE_MODE_LABELS[record.serviceMode] || record.serviceMode}</Tag>
              )}
              {Number(record.minOrderQty) > 1 && (
                <Tag color="purple" style={{ fontSize: 11 }}>MOQ: {record.minOrderQty}</Tag>
              )}
              {record.dietary === "veg" && (
                <Tag color="success" style={{ fontSize: 11, fontWeight: 700 }}>🟢 Pure Veg</Tag>
              )}
              {record.dietary === "non_veg" && (
                <Tag color="error" style={{ fontSize: 11, fontWeight: 700 }}>🔴 Non-Veg</Tag>
              )}
              {record.dietary === "egg" && (
                <Tag color="warning" style={{ fontSize: 11, fontWeight: 700 }}>🟡 Egg</Tag>
              )}
              {record.sizes && (
                <Tag color="magenta" style={{ fontSize: 11 }}>Sizes: {record.sizes}</Tag>
              )}
              {record.colors && (
                <Tag color="volcano" style={{ fontSize: 11 }}>Colors: {record.colors}</Tag>
              )}
              {record.roomType && (
                <Tag color="cyan" style={{ fontSize: 11 }}>Room: {record.roomType}</Tag>
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
      title: "Available Stock / Slots",
      dataIndex: "stock",
      key: "stock",
      render: (stock: number, record: Product) =>
        record.itemType === "service" ? (
          <Tag color="purple">Service / On Demand</Tag>
        ) : Number(stock) <= 5 ? (
          <Tag color="red" style={{ fontWeight: 700 }}>
            ⚠️ {Number(stock) <= 0 ? "Out of Stock" : `Low Stock: ${stock} left`}
          </Tag>
        ) : (
          <Tag color={stock > 10 ? "green" : "orange"}>
            {stock} ({record.unit || "pcs"})
          </Tag>
        ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: Product) => (
        <Space wrap size="small">
          {record.itemType !== "service" && Number(record.stock) <= 5 && (
            <Button
              size="small"
              icon={<WhatsAppOutlined />}
              style={{ color: "#ea580c", borderColor: "#fed7aa", fontWeight: 600 }}
              onClick={() => {
                setPoProduct(record);
                setPoQty(Math.max(10, (record.minOrderQty || 1) * 5));
                setPoSupplierPhone("");
                setPoNotes("");
              }}
            >
              Supplier PO
            </Button>
          )}
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
          <Button
            icon={<ThunderboltOutlined />}
            onClick={() => setTemplateModalOpen(true)}
            style={{ borderColor: "#7c3aed", color: "#6d28d9" }}
          >
            Trending Service Packs
          </Button>
          <Button icon={<UploadOutlined />} onClick={() => setCsvModalOpen(true)}>
            Import CSV
          </Button>
          <Button
            icon={<DownloadOutlined />}
            onClick={() =>
              downloadCsv(
                "giniespace-catalog.csv",
                ["ID", "ItemType", "Name", "Category", "Description", "Price", "CostPrice", "Unit", "Duration", "ServiceMode", "Stock", "MinOrderQty"],
                products.map((p) => [
                  p.id,
                  p.itemType || "product",
                  p.name,
                  p.category || "General",
                  p.description,
                  p.price,
                  p.costPrice ?? "",
                  p.unit,
                  p.duration || "",
                  p.serviceMode || "",
                  p.stock,
                  p.minOrderQty || 1,
                ])
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
              <Text code>{`https://app.ginie.space/shop/${storeSlug || user.id}`}</Text>
            </div>
            <Space>
              <Button
                size="small"
                icon={<CopyOutlined />}
                onClick={() => {
                  const url = `${window.location.origin}/shop/${storeSlug || user.id}`;
                  navigator.clipboard?.writeText(url);
                  message.success("Storefront link copied!");
                }}
              >
                Copy Link
              </Button>
              <Button
                size="small"
                icon={<WhatsAppOutlined style={{ color: "#25D366" }} />}
                onClick={() => {
                  const url = `${window.location.origin}/shop/${storeSlug || user.id}`;
                  const text = `Namaste! Aap hamara digital catalog live prices ke sath yahan dekh sakte hain aur direct WhatsApp order kar sakte hain:\n\n👉 ${url}`;
                  window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank");
                }}
              >
                Share on WhatsApp
              </Button>
              <Button size="small" type="primary" href={`/shop/${storeSlug || user.id}`} target="_blank">
                Preview Store
              </Button>
            </Space>
          </div>
        </Card>
      )}

      <Card style={{ borderRadius: 12 }}>
        <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <Segmented
              value={stockFilter}
              onChange={(val: any) => setStockFilter(val)}
              options={[
                { label: `All Items (${products.length})`, value: "all" },
                {
                  label: `⚠️ Low Stock Alerts (${products.filter((p) => p.itemType !== "service" && Number(p.stock) <= 5).length})`,
                  value: "low_stock",
                },
              ]}
              style={{ fontWeight: 600 }}
            />
            {products.filter((p) => p.itemType !== "service" && Number(p.stock) <= 5).length > 0 && (
              <Button
                icon={<WhatsAppOutlined />}
                style={{ color: "#ea580c", borderColor: "#fed7aa", fontWeight: 600 }}
                onClick={() => {
                  setBulkPoSupplierPhone("");
                  setBulkPoModalOpen(true);
                }}
              >
                Bulk Supplier PO ({products.filter((p) => p.itemType !== "service" && Number(p.stock) <= 5).length})
              </Button>
            )}
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Input
              placeholder="Search products or services..."
              allowClear
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: 240 }}
            />
            <Select
              value={typeFilter}
              onChange={setTypeFilter}
              style={{ width: 155 }}
              options={[
                { value: "all", label: "All Types" },
                { value: "product", label: "Products Only" },
                { value: "service", label: "Services Only" },
              ]}
            />
            <Select
              value={categoryFilter}
              onChange={setCategoryFilter}
              style={{ width: 170 }}
              options={[
                { value: "all", label: "All Categories" },
                ...Array.from(new Set(products.map((p) => p.category || "General"))).map((cat) => ({
                  value: cat,
                  label: cat,
                })),
              ]}
            />
          </div>
        </div>
        <Table
          dataSource={products.filter((p) => {
            const matchesStock =
              stockFilter === "all" || (p.itemType !== "service" && Number(p.stock) <= 5);
            const matchesType =
              typeFilter === "all" || (p.itemType || "product") === typeFilter;
            const matchesCat = categoryFilter === "all" || (p.category || "General") === categoryFilter;
            const q = searchTerm.trim().toLowerCase();
            const matchesSearch =
              !q ||
              p.name.toLowerCase().includes(q) ||
              (p.description || "").toLowerCase().includes(q) ||
              (p.category || "").toLowerCase().includes(q);
            return matchesStock && matchesType && matchesCat && matchesSearch;
          })}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 850 }}
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
          initialValues={{ itemType: "product", unitType: "pcs", packSubUnit: "pcs", stock: 10 }}
        >
          <Form.Item name="itemType" label="Offering Type (Hybrid Mode)">
            <Radio.Group
              optionType="button"
              buttonStyle="solid"
              onChange={(e) => {
                if (e.target.value === "service") {
                  form.setFieldsValue({
                    unitType: "session",
                    packQty: undefined,
                    category: "Services",
                    serviceMode: "any",
                    duration: form.getFieldValue("duration") || "60 mins",
                  });
                } else {
                  form.setFieldsValue({
                    unitType: "pcs",
                    category: "General",
                    stock: 10,
                  });
                }
              }}
            >
              <Radio.Button value="product">Physical Product</Radio.Button>
              <Radio.Button value="service">Service / Appointment / AMC</Radio.Button>
            </Radio.Group>
          </Form.Item>

          <Form.Item
            name="name"
            label={isServiceForm ? "Service / Package Name" : "Item / Product Name"}
            rules={[{ required: true, message: "Please enter name" }]}
          >
            <Input placeholder={isServiceForm ? "e.g. Split AC Deep Foam Service" : "e.g. Soan Papdi — Bharat Gold"} />
          </Form.Item>

          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
            <Form.Item name="category" label="Category">
              <Select
                showSearch
                placeholder="Select or type category"
                options={[
                  { value: "General", label: "General" },
                  { value: "Services", label: "Services" },
                  { value: "AC & Appliance Repair", label: "AC & Appliance Repair" },
                  { value: "Salon & Grooming", label: "Salon & Grooming" },
                  { value: "Medical Consultation", label: "Medical & Clinic" },
                  { value: "Car & Bike Care", label: "Car & Bike Care" },
                  { value: "Digital & Web", label: "Digital & Agency" },
                  { value: "Coaching & Classes", label: "Coaching & Classes" },
                  { value: "AMC & Maintenance", label: "AMC & Maintenance" },
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
            <Form.Item name="minOrderQty" label="Min Qty (MOQ)">
              <InputNumber style={{ width: "100%" }} min={1} placeholder="1" />
            </Form.Item>
          </div>

          <Form.Item name="description" label="Short Description">
            <Input.TextArea rows={2} placeholder={isServiceForm ? "What is included in this service or package..." : "Flavour, brand, specs, or packaging details..."} />
          </Form.Item>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <Form.Item
              name="price"
              label={isServiceForm ? "Service Fee (₹)" : "Selling Price (₹)"}
              rules={[{ required: true, message: "Please enter price" }]}
            >
              <InputNumber style={{ width: "100%" }} min={0} placeholder="499" />
            </Form.Item>

            <Form.Item name="costPrice" label={isServiceForm ? "Tech Cost (₹)" : "Cost / Buy Rate (₹)"}>
              <InputNumber style={{ width: "100%" }} min={0} placeholder="250" />
            </Form.Item>

            <Form.Item
              name="unitType"
              label={isServiceForm ? "Billing Unit" : "Unit"}
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
                options={
                  isServiceForm
                    ? [
                        { value: "session", label: "Per Session" },
                        { value: "visit", label: "Per Visit" },
                        { value: "hour", label: "Per Hour" },
                        { value: "day", label: "Per Day" },
                        { value: "month", label: "Per Month" },
                        { value: "year", label: "Per Year (AMC)" },
                        { value: "project", label: "Per Project" },
                      ]
                    : [
                        { value: "pcs", label: "Pcs (Pieces)" },
                        { value: "plate", label: "Plate (Food / Restaurant)" },
                        { value: "portion", label: "Portion / Dish" },
                        { value: "bowl", label: "Bowl / Cup" },
                        { value: "night", label: "Per Night (Hotel Stay)" },
                        { value: "day", label: "Per Day (Stay / Rental)" },
                        { value: "set", label: "Set / Pair (Fashion)" },
                        { value: "gram", label: "Gram (g)" },
                        { value: "kg", label: "Kg (Kilogram)" },
                        { value: "pack", label: "Pack" },
                        { value: "carton", label: "Carton (Box)" },
                        { value: "jar", label: "Jar" },
                      ]
                }
              />
            </Form.Item>
          </div>

          {/* Dynamic Category Specific Fields */}
          {!isServiceForm && user?.businessType === "restaurant" && (
            <Form.Item name="dietary" label="Dietary Preference (Food Type)">
              <Radio.Group buttonStyle="solid">
                <Radio.Button value="veg" style={{ color: "#16a34a", fontWeight: 600 }}>🟢 Pure Veg</Radio.Button>
                <Radio.Button value="non_veg" style={{ color: "#dc2626", fontWeight: 600 }}>🔴 Non-Veg</Radio.Button>
                <Radio.Button value="egg" style={{ color: "#d97706", fontWeight: 600 }}>🟡 Contains Egg</Radio.Button>
              </Radio.Group>
            </Form.Item>
          )}

          {!isServiceForm && user?.businessType === "garments" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Form.Item name="sizes" label="Available Sizes" extra="e.g. S, M, L, XL, XXL or Free Size">
                <Input placeholder="e.g. S, M, L, XL, XXL" />
              </Form.Item>
              <Form.Item name="colors" label="Color Options" extra="e.g. Black, White, Navy Blue">
                <Input placeholder="e.g. Black, White, Navy Blue" />
              </Form.Item>
            </div>
          )}

          {!isServiceForm && user?.businessType === "hotel" && (
            <Form.Item name="roomType" label="Room / Accommodation Category" extra="e.g. Deluxe AC, Suite, Standard Single">
              <Input placeholder="e.g. Deluxe AC Room (King Bed + Breakfast)" />
            </Form.Item>
          )}

          {!isServiceForm && !["restaurant", "garments", "hotel", "services"].includes(user?.businessType || "") && (
            <div style={{ padding: "10px 14px", background: "#f8fafc", borderRadius: 8, marginBottom: 16, border: "1px dashed #cbd5e1" }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 8 }}>
                Optional Category Details (Food Dietary / Fashion Size / Room Type)
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <Form.Item name="dietary" label="Dietary (Food)" style={{ marginBottom: 0 }}>
                  <Select
                    allowClear
                    placeholder="Select if Food item"
                    options={[
                      { value: "veg", label: "🟢 Pure Veg" },
                      { value: "non_veg", label: "🔴 Non-Veg" },
                      { value: "egg", label: "🟡 Contains Egg" },
                    ]}
                  />
                </Form.Item>
                <Form.Item name="sizes" label="Sizes (Fashion)" style={{ marginBottom: 0 }}>
                  <Input placeholder="e.g. S, M, L, XL" />
                </Form.Item>
              </div>
            </div>
          )}

          {isServiceForm ? (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Form.Item name="duration" label="Duration / Validity">
                <Input placeholder="e.g. 60 mins or 12 Months" />
              </Form.Item>
              <Form.Item name="serviceMode" label="Delivery Mode">
                <Select
                  options={[
                    { value: "home_visit", label: "Home / On-Site Visit" },
                    { value: "at_store", label: "At Store / Clinic / Garage" },
                    { value: "online", label: "Online / Video / Remote" },
                    { value: "any", label: "Both Home & Store" },
                  ]}
                />
              </Form.Item>
            </div>
          ) : (
            <>
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
          </>
          )}

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

              <Space direction="vertical" size={6} style={{ flex: 1, minWidth: 220 }}>
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
                <Input
                  size="small"
                  placeholder="Or paste external image URL (https://...)"
                  value={!imagePreview.startsWith("data:") ? imagePreview : ""}
                  onChange={(e) => setImagePreview(e.target.value)}
                />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Allowed format: <strong>.jpg / .jpeg</strong> (Max <strong>60 KB</strong>) or direct HTTPS image link
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
      <Modal
        title="1-Click Trending Service Templates"
        open={templateModalOpen}
        onCancel={() => setTemplateModalOpen(false)}
        footer={null}
        width={620}
      >
        <Text type="secondary" style={{ display: "block", marginBottom: 14 }}>
          Select your industry below to instantly populate ready-to-book Indian services with realistic pricing &amp; durations.
        </Text>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {TRENDING_PACK_META.map((pack) => (
            <Card key={pack.key} size="small" style={{ borderRadius: 10 }}>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>{pack.title}</div>
              <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 10 }}>
                {pack.desc}
              </Text>
              <Button
                type="primary"
                size="small"
                loading={importingPack === pack.key}
                onClick={() => handleImportPack(pack.key)}
                style={{ background: "#25D366", borderColor: "#25D366" }}
              >
                Import Pack
              </Button>
            </Card>
          ))}
        </div>
      </Modal>


      {/* Feature 7: Single Product Supplier PO Modal */}
      <Modal
        title={
          <Space>
            <WhatsAppOutlined style={{ color: "#25D366" }} />
            <span>Supplier Purchase Order (WhatsApp) — {poProduct?.name}</span>
          </Space>
        }
        open={Boolean(poProduct)}
        onCancel={() => setPoProduct(null)}
        footer={null}
        destroyOnClose
      >
        {poProduct && (
          <Space direction="vertical" style={{ width: "100%" }} size={14}>
            <div style={{ background: "#fff7ed", border: "1px solid #fed7aa", padding: "12px 14px", borderRadius: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#9a3412" }}>
                Current Stock Alert:
              </div>
              <div style={{ fontSize: 14, color: "#0f172a", marginTop: 2 }}>
                <strong>{poProduct.name}</strong> — Only <strong>{poProduct.stock} {poProduct.unit}</strong> remaining in store!
              </div>
              {poProduct.costPrice && (
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                  Last Recorded Cost Price: ₹{poProduct.costPrice} / {poProduct.unit}
                </div>
              )}
            </div>

            <div>
              <Text strong style={{ display: "block", marginBottom: 4 }}>
                Reorder Quantity ({poProduct.unit || "pcs"}):
              </Text>
              <InputNumber
                style={{ width: "100%" }}
                min={1}
                value={poQty}
                onChange={(val) => setPoQty(Number(val) || 1)}
              />
            </div>

            <div>
              <Text strong style={{ display: "block", marginBottom: 4 }}>
                Supplier WhatsApp Mobile Number:
              </Text>
              <Input
                placeholder="e.g. 919876543210 (with country code)"
                value={poSupplierPhone}
                onChange={(e) => setPoSupplierPhone(e.target.value)}
              />
            </div>

            <div>
              <Text type="secondary" style={{ display: "block", marginBottom: 4 }}>
                Special PO Note / Quality Requirements:
              </Text>
              <Input
                placeholder="e.g. urgent delivery by tomorrow evening"
                value={poNotes}
                onChange={(e) => setPoNotes(e.target.value)}
              />
            </div>

            <Button
              type="primary"
              icon={<WhatsAppOutlined />}
              block
              style={{ background: "#25D366", borderColor: "#25D366", fontWeight: 700, height: 42 }}
              onClick={() => {
                const cleanPhone = poSupplierPhone.replace(/\D/g, "");
                const poMsg =
                  `📦 *Purchase Order (PO) — ${businessName}*\n\n` +
                  `Namaste Supplier Ji,\n` +
                  `Hamare store ke liye naya stock required hai:\n\n` +
                  `• *Item:* ${poProduct.name}\n` +
                  `• *Required Quantity:* ${poQty} ${poProduct.unit || "pcs"}\n` +
                  (poNotes ? `• *Note:* ${poNotes}\n` : "") +
                  `📍 *Delivery Address:* ${businessAddress || "Store counter"}\n\n` +
                  `Kripya bill amount aur dispatch timeline confirm karein. Dhanyavaad! 🙏`;

                if (cleanPhone) {
                  window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(poMsg)}`, "_blank");
                } else {
                  window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(poMsg)}`, "_blank");
                }
                setPoProduct(null);
              }}
            >
              Send Purchase Order on WhatsApp
            </Button>
          </Space>
        )}
      </Modal>

      {/* Feature 7: Bulk Supplier Purchase Order Modal */}
      <Modal
        title={
          <Space>
            <WhatsAppOutlined style={{ color: "#25D366" }} />
            <span>Bulk Supplier Reorder (All Low Stock Items)</span>
          </Space>
        }
        open={bulkPoModalOpen}
        onCancel={() => setBulkPoModalOpen(false)}
        footer={null}
        width={580}
        destroyOnClose
      >
        <Space direction="vertical" style={{ width: "100%" }} size={14}>
          <div style={{ background: "#fff7ed", border: "1px solid #fed7aa", padding: "10px 14px", borderRadius: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#9a3412" }}>
              ⚠️ {products.filter((p) => p.itemType !== "service" && Number(p.stock) <= 5).length} Items with Low Stock (≤ 5 units)
            </span>
          </div>

          <div style={{ maxHeight: 220, overflowY: "auto", border: "1px solid #e2e8f0", borderRadius: 8, padding: 8 }}>
            {products
              .filter((p) => p.itemType !== "service" && Number(p.stock) <= 5)
              .map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "6px 8px",
                    borderBottom: "1px solid #f1f5f9",
                    fontSize: 13,
                  }}
                >
                  <span>
                    <strong>{item.name}</strong> (Stock: <span style={{ color: "#dc2626" }}>{item.stock}</span>)
                  </span>
                  <Tag color="orange">Suggested Reorder: {Math.max(10, (item.minOrderQty || 1) * 5)} {item.unit}</Tag>
                </div>
              ))}
          </div>

          <div>
            <Text strong style={{ display: "block", marginBottom: 4 }}>
              Wholesale Supplier WhatsApp Number:
            </Text>
            <Input
              placeholder="e.g. 919876543210 (with country code)"
              value={bulkPoSupplierPhone}
              onChange={(e) => setBulkPoSupplierPhone(e.target.value)}
            />
          </div>

          <Button
            type="primary"
            icon={<WhatsAppOutlined />}
            block
            style={{ background: "#25D366", borderColor: "#25D366", fontWeight: 700, height: 42 }}
            onClick={() => {
              const cleanPhone = bulkPoSupplierPhone.replace(/\D/g, "");
              const lowItems = products.filter((p) => p.itemType !== "service" && Number(p.stock) <= 5);
              const itemsText = lowItems
                .map((p) => `• *${p.name}:* ${Math.max(10, (p.minOrderQty || 1) * 5)} ${p.unit} (Current Stock: ${p.stock})`)
                .join("\n");

              const bulkPoMsg =
                `📦 *Bulk Purchase Order (PO) — ${businessName}*\n\n` +
                `Namaste Supplier Ji,\n` +
                `Hamare store ke liye urgent stock replenishment required hai:\n\n` +
                `${itemsText}\n\n` +
                `📍 *Delivery Address:* ${businessAddress || "Store address"}\n\n` +
                `Kripya bill amount aur dispatch delivery confirmation share karein. Dhanyavaad! 🙏`;

              if (cleanPhone) {
                window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(bulkPoMsg)}`, "_blank");
              } else {
                window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(bulkPoMsg)}`, "_blank");
              }
              setBulkPoModalOpen(false);
            }}
          >
            Send Bulk Purchase Order on WhatsApp
          </Button>
        </Space>
      </Modal>
    </AppLayout>
  );
}
