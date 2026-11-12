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
  Divider,
  Popconfirm,
} from "antd";
import {
  PlusOutlined,
  ShoppingCartOutlined,
  SyncOutlined,
  WhatsAppOutlined,
  DownloadOutlined,
  PrinterOutlined,
  SearchOutlined,
  DeleteOutlined,
  MinusCircleOutlined,
} from "@ant-design/icons";
import { api } from "../../lib/api";
import { getSocket } from "../../lib/socket";
import { downloadCsv } from "../../lib/csv";

const { Title, Text } = Typography;

interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  itemsJson: string;
  totalAmount: number;
  status: "pending" | "confirmed" | "dispatched" | "delivered" | "cancelled";
  paymentStatus?: "unpaid" | "partial" | "paid";
  paidAmount?: number;
  notes?: string;
  createdAt: string;
}

interface CatalogProduct {
  id: string;
  name: string;
  price: number;
  unit: string;
  stock: number;
}

interface CustomerOption {
  id: string;
  name: string;
  phone: string;
}

interface OrderLineItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  unit?: string;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [form] = Form.useForm();
  const [lineItems, setLineItems] = useState<OrderLineItem[]>([]);
  const [pickerProductId, setPickerProductId] = useState<string | undefined>(undefined);
  const [pickerQty, setPickerQty] = useState<number>(1);
  const [statusUpdating, setStatusUpdating] = useState<string | null>(null);
  const [paymentUpdating, setPaymentUpdating] = useState<string | null>(null);
  const [partialModalOrder, setPartialModalOrder] = useState<Order | null>(null);
  const [partialPaidInput, setPartialPaidInput] = useState<number>(0);
  const [sendingBillId, setSendingBillId] = useState<string | null>(null);
  const [upiId, setUpiId] = useState("");
  const [businessProfile, setBusinessProfile] = useState<{
    name: string;
    phone?: string;
    address?: string;
    gstin?: string;
    gstRate?: number;
  }>({ name: "GinieSpace Store" });
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [invoiceOrder, setInvoiceOrder] = useState<Order | null>(null);
  const [invoiceQrUrl, setInvoiceQrUrl] = useState<string | null>(null);

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
      const [ordRes, prodRes, custRes] = await Promise.all([
        api.get("/api/orders"),
        api.get("/api/products").catch(() => ({ data: { products: [] } })),
        api.get("/api/customers").catch(() => ({ data: { customers: [] } })),
      ]);
      setOrders(ordRes.data.orders || []);
      setProducts(prodRes.data.products || []);
      setCustomers(custRes.data.customers || []);
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
        const b = res.data?.business;
        if (b) {
          let parsed: any = {};
          if (b.settingsJson) {
            try {
              parsed = JSON.parse(b.settingsJson);
            } catch {}
          }
          if (parsed.upiId) setUpiId(parsed.upiId);
          setBusinessProfile({
            name: b.name || "GinieSpace Store",
            phone: b.phone || "",
            address: b.address || "",
            gstin: parsed.gstin || "",
            gstRate: Number(parsed.gstRate) || 0,
          });
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

  const handleAddLineItem = () => {
    if (!pickerProductId) {
      message.warning("Select a product from catalog first");
      return;
    }
    const prod = products.find((p) => p.id === pickerProductId);
    if (!prod) return;
    const qty = Math.max(1, Number(pickerQty) || 1);

    setLineItems((prev) => {
      const existing = prev.find((i) => i.productId === prod.id);
      const next = existing
        ? prev.map((i) => (i.productId === prod.id ? { ...i, quantity: i.quantity + qty } : i))
        : [...prev, { productId: prod.id, name: prod.name, price: Number(prod.price) || 0, quantity: qty, unit: prod.unit }];

      const sum = next.reduce((acc, item) => acc + item.price * item.quantity, 0);
      form.setFieldsValue({ totalAmount: sum });
      return next;
    });
    setPickerProductId(undefined);
    setPickerQty(1);
  };

  const handleRemoveLineItem = (productId: string) => {
    setLineItems((prev) => {
      const next = prev.filter((i) => i.productId !== productId);
      const sum = next.reduce((acc, item) => acc + item.price * item.quantity, 0);
      if (next.length > 0) {
        form.setFieldsValue({ totalAmount: sum });
      }
      return next;
    });
  };

  const handleCreateOrder = async (values: any) => {
    try {
      setCreatingOrder(true);
      const total = Number(values.totalAmount) || 0;
      const paymentStatus = values.paymentStatus || "unpaid";
      const paidAmount =
        paymentStatus === "paid"
          ? total
          : paymentStatus === "partial"
            ? Number(values.paidAmount) || 0
            : 0;

      await api.post("/api/orders", {
        customerName: values.customerName,
        customerPhone: values.customerPhone,
        totalAmount: total,
        items: lineItems.length > 0 ? lineItems : undefined,
        notes: values.notes || "",
        paymentStatus,
        paidAmount,
      });
      message.success("Order created successfully!");
      setCreateModalVisible(false);
      setLineItems([]);
      form.resetFields();
      loadOrders();
    } catch (err: any) {
      message.error(err.message || "Could not create order");
    } finally {
      setCreatingOrder(false);
    }
  };

  const handlePaymentUpdate = async (order: Order, nextStatus: "unpaid" | "partial" | "paid", customPaidAmount?: number) => {
    if (nextStatus === "partial" && customPaidAmount === undefined) {
      setPartialModalOrder(order);
      setPartialPaidInput(Number(order.paidAmount) || Math.round(Number(order.totalAmount || 0) / 2));
      return;
    }
    try {
      setPaymentUpdating(order.id);
      const paid =
        nextStatus === "paid"
          ? Number(order.totalAmount) || 0
          : nextStatus === "partial"
            ? Number(customPaidAmount || 0)
            : 0;
      const res = await api.put(`/api/orders/${order.id}/payment`, {
        paymentStatus: nextStatus,
        paidAmount: paid,
      });
      if (res.data?.order) {
        setOrders((prev) => prev.map((o) => (o.id === order.id ? res.data.order : o)));
      }
      message.success(`Payment marked as ${nextStatus.toUpperCase()}`);
      setPartialModalOrder(null);
    } catch (err: any) {
      message.error(err.message || "Could not update payment status");
    } finally {
      setPaymentUpdating(null);
    }
  };

  const handleDeleteOrder = async (id: string) => {
    try {
      await api.delete(`/api/orders/${id}`);
      setOrders((prev) => prev.filter((o) => o.id !== id));
      message.success("Order deleted");
    } catch (err: any) {
      message.error(err.message || "Could not delete order");
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
      render: (amt: number, record: Order) => {
        let count = 0;
        try {
          const arr = JSON.parse(record.itemsJson || "[]");
          if (Array.isArray(arr)) count = arr.length;
        } catch {}
        return (
          <div>
            <Text strong>₹{Number(amt || 0).toLocaleString("en-IN")}</Text>
            {count > 0 && (
              <div>
                <Text type="secondary" style={{ fontSize: 11 }}>{count} item(s)</Text>
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string, record: Order) => (
        <Select
          value={status}
          style={{ width: 135 }}
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
      title: "Payment / Khata",
      dataIndex: "paymentStatus",
      key: "paymentStatus",
      render: (pStatus: "unpaid" | "partial" | "paid" | undefined, record: Order) => {
        const currentStatus = pStatus || "unpaid";
        const total = Number(record.totalAmount) || 0;
        const paid = currentStatus === "paid" ? total : Number(record.paidAmount) || 0;
        const due = Math.max(0, total - paid);
        return (
          <div>
            <Select
              size="small"
              value={currentStatus}
              style={{ width: 120 }}
              loading={paymentUpdating === record.id}
              onChange={(val) => handlePaymentUpdate(record, val)}
              options={[
                { value: "unpaid", label: <Tag color="red">Unpaid</Tag> },
                { value: "partial", label: <Tag color="orange">Partial</Tag> },
                { value: "paid", label: <Tag color="green">Paid</Tag> },
              ]}
            />
            {currentStatus !== "paid" && due > 0 && record.status !== "cancelled" && (
              <div style={{ fontSize: 11, color: "#b91c1c", marginTop: 2 }}>
                Due: ₹{due.toLocaleString("en-IN")}
              </div>
            )}
          </div>
        );
      },
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
        <Space size="small">
          <Button
            size="small"
            icon={<PrinterOutlined />}
            onClick={async () => {
              setInvoiceOrder(record);
              setInvoiceQrUrl(null);
              if (upiId && upiId.includes("@")) {
                try {
                  const qrRes = await api.get("/api/storefront/upi-qr", {
                    params: {
                      pa: upiId,
                      pn: businessProfile.name,
                      am: record.totalAmount,
                      tn: `Order #${record.id.slice(-6)}`,
                    },
                  });
                  setInvoiceQrUrl(qrRes.data?.qrDataUrl || null);
                } catch {}
              }
            }}
          >
            Invoice
          </Button>
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
          <Popconfirm
            title="Delete order?"
            description="Remove this order permanently?"
            onConfirm={() => handleDeleteOrder(record.id)}
            okText="Delete"
            cancelText="Cancel"
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const filteredOrders = orders.filter((o) => {
    const matchesStatus = statusFilter === "all" || o.status === statusFilter;
    const q = searchText.trim().toLowerCase();
    const matchesSearch =
      !q ||
      o.customerName.toLowerCase().includes(q) ||
      o.customerPhone.toLowerCase().includes(q) ||
      o.id.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  const handlePrintInvoiceWindow = (order: Order) => {
    const win = window.open("", "_blank", "width=820,height=900");
    if (!win) {
      message.warning("Please allow popups to print/save PDF invoice");
      return;
    }

    let items: Array<{ name: string; price: number; quantity: number }> = [];
    try {
      const parsed = JSON.parse(order.itemsJson || "[]");
      if (Array.isArray(parsed)) items = parsed;
    } catch {}

    const gstRate = Number(businessProfile.gstRate) || 0;
    const grandTotal = Number(order.totalAmount) || 0;
    const baseAmount = gstRate > 0 ? grandTotal / (1 + gstRate / 100) : grandTotal;
    const gstAmount = gstRate > 0 ? grandTotal - baseAmount : 0;

    const itemRows =
      items.length > 0
        ? items
            .map(
              (item, idx) =>
                `<tr>
                  <td>${idx + 1}</td>
                  <td>${item.name}</td>
                  <td style="text-align:right">${item.quantity}</td>
                  <td style="text-align:right">₹${Number(item.price).toFixed(2)}</td>
                  <td style="text-align:right">₹${(Number(item.price) * Number(item.quantity)).toFixed(2)}</td>
                </tr>`
            )
            .join("")
        : `<tr><td>1</td><td>Order Items (${order.notes || "Summary"})</td><td style="text-align:right">1</td><td style="text-align:right">₹${baseAmount.toFixed(2)}</td><td style="text-align:right">₹${baseAmount.toFixed(2)}</td></tr>`;

    win.document.write(`<!DOCTYPE html><html><head><title>Invoice #${order.id.slice(-6)}</title>
      <style>
        body { font-family: Arial, sans-serif; color: #1e293b; padding: 32px; max-width: 760px; margin: 0 auto; }
        .header { display: flex; justify-content: space-between; border-bottom: 2px solid #25D366; padding-bottom: 16px; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; margin: 18px 0; }
        th, td { border: 1px solid #e2e8f0; padding: 10px; font-size: 13px; text-align: left; }
        th { background: #f8fafc; }
        .totals { width: 280px; margin-left: auto; font-size: 14px; }
        .totals div { display: flex; justify-content: space-between; padding: 4px 0; }
        .grand { font-size: 17px; font-weight: bold; border-top: 2px solid #0f172a; padding-top: 8px; margin-top: 6px; }
      </style></head><body>
      <div class="header">
        <div>
          <h2 style="margin:0;color:#0f172a">${businessProfile.name}</h2>
          ${businessProfile.address ? `<div>${businessProfile.address}</div>` : ""}
          ${businessProfile.phone ? `<div>Phone: ${businessProfile.phone}</div>` : ""}
          ${businessProfile.gstin ? `<div><strong>GSTIN:</strong> ${businessProfile.gstin}</div>` : ""}
        </div>
        <div style="text-align:right">
          <h3 style="margin:0;color:#16a34a">TAX INVOICE</h3>
          <div><strong>Invoice #:</strong> ${order.id.slice(-6).toUpperCase()}</div>
          <div><strong>Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</div>
          <div><strong>Status:</strong> ${order.status.toUpperCase()}</div>
        </div>
      </div>
      <div><strong>Billed To:</strong> ${order.customerName} (+${order.customerPhone.replace(/^\+/, "")})</div>
      <table><thead><tr><th>#</th><th>Item</th><th style="text-align:right">Qty</th><th style="text-align:right">Rate</th><th style="text-align:right">Total</th></tr></thead><tbody>${itemRows}</tbody></table>
      <div class="totals">
        <div><span>Subtotal:</span><span>₹${baseAmount.toFixed(2)}</span></div>
        ${gstRate > 0 ? `<div><span>GST (${gstRate}%):</span><span>₹${gstAmount.toFixed(2)}</span></div>` : ""}
        <div class="grand"><span>Grand Total:</span><span>₹${grandTotal.toFixed(2)}</span></div>
        <div><span>Paid (${(order.paymentStatus || "unpaid").toUpperCase()}):</span><span>₹${(order.paymentStatus === "paid" ? grandTotal : Number(order.paidAmount) || 0).toFixed(2)}</span></div>
        ${order.paymentStatus !== "paid" ? `<div style="color:#b91c1c;font-weight:bold"><span>Balance Due:</span><span>₹${Math.max(0, grandTotal - (Number(order.paidAmount) || 0)).toFixed(2)}</span></div>` : ""}
      </div>
      ${upiId ? `<div style="margin-top:24px;padding:12px;border:1px solid #bbf7d0;background:#f0fdf4;display:inline-block"><strong>Pay via UPI:</strong> ${upiId}${invoiceQrUrl ? `<br/><img src="${invoiceQrUrl}" style="width:130px;height:130px;margin-top:8px"/>` : ""}</div>` : ""}
      <script>window.onload = function() { window.print(); };</script>
      </body></html>`);
    win.document.close();
  };

  return (
    <AppLayout>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>Orders &amp; Sales</Title>
          <Text type="secondary">Manage customer orders, GST invoices, and automatic WhatsApp delivery updates</Text>
        </div>
        <Space wrap>
          <Button
            icon={<DownloadOutlined />}
            onClick={() =>
              downloadCsv(
                "giniespace-orders.csv",
                ["OrderID", "Customer", "Phone", "Amount", "Status", "PaymentStatus", "PaidAmount", "Notes", "Date"],
                filteredOrders.map((o) => [
                  o.id,
                  o.customerName,
                  o.customerPhone,
                  o.totalAmount,
                  o.status,
                  o.paymentStatus || "unpaid",
                  o.paidAmount || 0,
                  o.notes,
                  o.createdAt,
                ])
              )
            }
          >
            Export CSV
          </Button>
          <Button icon={<SyncOutlined />} onClick={loadOrders} loading={loading}>
            Refresh
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setLineItems([]);
              form.resetFields();
              form.setFieldsValue({ status: "pending", paymentStatus: "unpaid", paidAmount: 0 });
              setCreateModalVisible(true);
            }}
            style={{ background: "#25D366", borderColor: "#25D366" }}
          >
            New Order
          </Button>
        </Space>
      </div>

      <Card style={{ borderRadius: 12 }}>
        <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
          <Input
            prefix={<SearchOutlined style={{ color: "#94a3b8" }} />}
            placeholder="Search by customer name, phone, or order #..."
            allowClear
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ maxWidth: 320 }}
          />
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: 160 }}
            options={[
              { value: "all", label: "All Statuses" },
              { value: "pending", label: "Pending" },
              { value: "confirmed", label: "Confirmed" },
              { value: "dispatched", label: "Dispatched" },
              { value: "delivered", label: "Delivered" },
              { value: "cancelled", label: "Cancelled" },
            ]}
          />
        </div>
        <Table
          dataSource={filteredOrders}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* Create Order Modal */}
      <Modal
        title="Create New Order (Itemized + Stock Deduction)"
        open={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        footer={null}
        destroyOnClose
        width={600}
      >
        {customers.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 4 }}>
              Quick Fill from Existing Customers (Optional):
            </Text>
            <Select
              showSearch
              allowClear
              placeholder="Search saved customer by name or phone..."
              optionFilterProp="label"
              style={{ width: "100%" }}
              onChange={(custId) => {
                const c = customers.find((item) => item.id === custId);
                if (c) {
                  form.setFieldsValue({ customerName: c.name, customerPhone: c.phone });
                }
              }}
              options={customers.map((c) => ({
                value: c.id,
                label: `${c.name} (+${String(c.phone).replace(/^\+/, "")})`,
              }))}
            />
          </div>
        )}

        <div style={{ marginBottom: 16, padding: 12, background: "#f8fafc", borderRadius: 8, border: "1px solid #e2e8f0" }}>
          <Text strong style={{ display: "block", marginBottom: 8, fontSize: 13 }}>
            <ShoppingCartOutlined /> Add Catalog Items (Optional — auto-calculates total &amp; deducts stock)
          </Text>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Select
              showSearch
              placeholder="Choose product from catalog..."
              optionFilterProp="label"
              value={pickerProductId}
              onChange={setPickerProductId}
              style={{ flex: 1, minWidth: 210 }}
              options={products.map((p) => ({
                value: p.id,
                label: `${p.name} — ₹${p.price}/${p.unit || "pcs"} (Stock: ${p.stock})`,
              }))}
            />
            <InputNumber
              min={1}
              value={pickerQty}
              onChange={(v) => setPickerQty(Number(v) || 1)}
              style={{ width: 75 }}
            />
            <Button icon={<PlusOutlined />} onClick={handleAddLineItem}>
              Add
            </Button>
          </div>
          {lineItems.length > 0 && (
            <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
              {lineItems.map((item) => (
                <div
                  key={item.productId}
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13, background: "#fff", padding: "6px 10px", borderRadius: 6 }}
                >
                  <span>
                    <strong>{item.name}</strong> × {item.quantity} {item.unit || ""} = <strong>₹{(item.price * item.quantity).toLocaleString("en-IN")}</strong>
                  </span>
                  <Button
                    type="text"
                    size="small"
                    danger
                    icon={<MinusCircleOutlined />}
                    onClick={() => handleRemoveLineItem(item.productId)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <Form form={form} layout="vertical" onFinish={handleCreateOrder} initialValues={{ status: "pending", paymentStatus: "unpaid", paidAmount: 0 }}>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Form.Item
              name="customerName"
              label="Customer Name"
              rules={[{ required: true, message: "Please enter customer name" }]}
              style={{ flex: 1, minWidth: 200 }}
            >
              <Input placeholder="e.g. Ramesh Kumar" />
            </Form.Item>

            <Form.Item
              name="customerPhone"
              label="Customer WhatsApp Phone Number"
              rules={[{ required: true, message: "Please enter phone number" }]}
              style={{ flex: 1, minWidth: 200 }}
            >
              <Input placeholder="e.g. 919876543210" />
            </Form.Item>
          </div>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Form.Item
              name="totalAmount"
              label="Total Amount (₹)"
              rules={[{ required: true, message: "Please enter total amount" }]}
              style={{ flex: 1, minWidth: 160 }}
            >
              <InputNumber style={{ width: "100%" }} min={0} placeholder="1500" />
            </Form.Item>

            <Form.Item name="paymentStatus" label="Payment Status" style={{ width: 160 }}>
              <Select
                options={[
                  { value: "unpaid", label: "Unpaid / Udhaar" },
                  { value: "partial", label: "Partial Paid" },
                  { value: "paid", label: "Paid (Full)" },
                ]}
              />
            </Form.Item>

            <Form.Item name="paidAmount" label="Paid Now (₹ if Partial)" style={{ width: 160 }}>
              <InputNumber style={{ width: "100%" }} min={0} placeholder="0" />
            </Form.Item>
          </div>

          <Form.Item name="notes" label="Order Details / Notes">
            <Input.TextArea rows={2} placeholder="e.g. delivery before Monday" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0 }}>
            <Button
              type="primary"
              htmlType="submit"
              block
              loading={creatingOrder}
              style={{ background: "#25D366", borderColor: "#25D366", fontWeight: 600 }}
            >
              Save Order
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Partial Payment Amount Modal */}
      <Modal
        title={`Record Partial Payment — #${partialModalOrder ? partialModalOrder.id.slice(-6).toUpperCase() : ""}`}
        open={Boolean(partialModalOrder)}
        onCancel={() => setPartialModalOrder(null)}
        confirmLoading={paymentUpdating === partialModalOrder?.id}
        okText="Save Partial Payment"
        onOk={() => {
          if (partialModalOrder) {
            handlePaymentUpdate(partialModalOrder, "partial", partialPaidInput);
          }
        }}
      >
        {partialModalOrder && (
          <Space direction="vertical" style={{ width: "100%" }} size={10}>
            <div>
              Order Total: <strong>₹{Number(partialModalOrder.totalAmount || 0).toLocaleString("en-IN")}</strong>
            </div>
            <div>
              <Text type="secondary">Amount Received So Far (₹):</Text>
              <InputNumber
                style={{ width: "100%", marginTop: 4 }}
                min={0}
                max={Number(partialModalOrder.totalAmount) || 99999999}
                value={partialPaidInput}
                onChange={(val) => setPartialPaidInput(Number(val) || 0)}
              />
            </div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Remaining Udhaar / Due: <strong>₹{Math.max(0, Number(partialModalOrder.totalAmount || 0) - partialPaidInput).toLocaleString("en-IN")}</strong>
            </Text>
          </Space>
        )}
      </Modal>

      {/* Printable Invoice & UPI QR Modal */}
      <Modal
        title={`Invoice #${invoiceOrder ? invoiceOrder.id.slice(-6).toUpperCase() : ""}`}
        open={Boolean(invoiceOrder)}
        onCancel={() => setInvoiceOrder(null)}
        width={620}
        footer={[
          <Button key="close" onClick={() => setInvoiceOrder(null)}>Close</Button>,
          <Button
            key="print"
            type="primary"
            icon={<PrinterOutlined />}
            style={{ background: "#25D366", borderColor: "#25D366" }}
            onClick={() => invoiceOrder && handlePrintInvoiceWindow(invoiceOrder)}
          >
            Print / Save as PDF
          </Button>,
        ]}
      >
        {invoiceOrder && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
              <div>
                <Title level={5} style={{ margin: 0 }}>{businessProfile.name}</Title>
                {businessProfile.address && <Text type="secondary" style={{ display: "block" }}>{businessProfile.address}</Text>}
                {businessProfile.gstin && <Text strong style={{ fontSize: 12 }}>GSTIN: {businessProfile.gstin}</Text>}
              </div>
              <div style={{ textAlign: "right" }}>
                <Text strong>Date:</Text> {new Date(invoiceOrder.createdAt).toLocaleDateString()}
                <div><Tag color={statusColors[invoiceOrder.status]}>{invoiceOrder.status.toUpperCase()}</Tag></div>
              </div>
            </div>
            <Divider />
            <div style={{ marginBottom: 12 }}>
              <Text strong>Customer:</Text> {invoiceOrder.customerName} (+{invoiceOrder.customerPhone.replace(/^\+/, "")})
            </div>
            {(() => {
              let parsedItems: any[] = [];
              try {
                parsedItems = JSON.parse(invoiceOrder.itemsJson || "[]");
              } catch {}
              const gstRate = Number(businessProfile.gstRate) || 0;
              const grand = Number(invoiceOrder.totalAmount) || 0;
              const base = gstRate > 0 ? grand / (1 + gstRate / 100) : grand;
              const tax = gstRate > 0 ? grand - base : 0;

              return (
                <>
                  {Array.isArray(parsedItems) && parsedItems.length > 0 && (
                    <Table
                      size="small"
                      pagination={false}
                      dataSource={parsedItems}
                      rowKey={(r, i) => `${r.name}_${i}`}
                      columns={[
                        { title: "Item", dataIndex: "name" },
                        { title: "Qty", dataIndex: "quantity", align: "right" as const },
                        { title: "Rate", dataIndex: "price", render: (p: number) => `₹${p}`, align: "right" as const },
                        { title: "Amount", render: (_: any, r: any) => `₹${(Number(r.price) * Number(r.quantity)).toFixed(2)}`, align: "right" as const },
                      ]}
                      style={{ marginBottom: 14 }}
                    />
                  )}
                  <div style={{ textAlign: "right" }}>
                    {gstRate > 0 && (
                      <>
                        <div>Subtotal: ₹{base.toFixed(2)}</div>
                        <div>GST ({gstRate}%): ₹{tax.toFixed(2)}</div>
                      </>
                    )}
                      <Title level={4} style={{ margin: "6px 0", color: "#16a34a" }}>
                        Grand Total: ₹{grand.toLocaleString("en-IN")}
                      </Title>
                      <div>
                        <Text type="secondary">
                          Payment: <strong>{(invoiceOrder.paymentStatus || "unpaid").toUpperCase()}</strong> (Paid: ₹{(invoiceOrder.paymentStatus === "paid" ? grand : Number(invoiceOrder.paidAmount) || 0).toLocaleString("en-IN")})
                        </Text>
                      </div>
                      {invoiceOrder.paymentStatus !== "paid" && (
                        <div>
                          <Text type="danger" strong>
                            Balance Due: ₹{Math.max(0, grand - (Number(invoiceOrder.paidAmount) || 0)).toLocaleString("en-IN")}
                          </Text>
                        </div>
                      )}
                  </div>
                </>
              );
            })()}
            {upiId && (
              <Card size="small" style={{ marginTop: 12, background: "#f0fdf4", textAlign: "center" }}>
                <Text strong>Pay via UPI:</Text> <Text code>{upiId}</Text>
                {invoiceQrUrl && (
                  <div style={{ marginTop: 10 }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={invoiceQrUrl} alt="Invoice UPI QR" style={{ width: 150, height: 150, background: "#fff", padding: 6, borderRadius: 8 }} />
                  </div>
                )}
              </Card>
            )}
          </div>
        )}
      </Modal>
    </AppLayout>
  );
}