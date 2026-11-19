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
  Segmented,
  Row,
  Col,
  Statistic,
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
  CalendarOutlined,
  CarOutlined,
  SendOutlined,
  ClockCircleOutlined,
  CheckCircleFilled,
  ExclamationCircleFilled,
  ShareAltOutlined,
  ReloadOutlined,
  AudioOutlined,
} from "@ant-design/icons";
import { api } from "../../lib/api";
import { getSocket } from "../../lib/socket";
import { downloadCsv } from "../../lib/csv";
import { InvoiceModal } from "../../components/InvoiceModal";
import { useAuth } from "../../context/AuthContext";

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
  discountAmount?: number;
  deliveryCharge?: number;
  couponCode?: string;
  deliveryAddress?: string;
  bookingDate?: string;
  timeSlot?: string;
  assignedStaff?: string;
  serviceMode?: string;
  nextRenewalDate?: string;
  notes?: string;
  createdAt: string;
}

interface CatalogProduct {
  id: string;
  name: string;
  price: number;
  unit: string;
  stock: number;
  itemType?: "product" | "service";
  duration?: string;
}

const BOOKING_TIME_SLOTS = [
  "09:00 AM - 11:00 AM",
  "11:00 AM - 01:00 PM",
  "02:00 PM - 04:00 PM",
  "04:00 PM - 06:00 PM",
  "06:00 PM - 08:00 PM",
];

const SERVICE_MODE_NAMES: Record<string, string> = {
  home_visit: "Home Visit",
  at_store: "At Store / Clinic",
  online: "Online / Video",
  any: "Flexible",
};

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
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [staffNames, setStaffNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [form] = Form.useForm();
  const [bookingForm] = Form.useForm();
  const [bookingModalOrder, setBookingModalOrder] = useState<Order | null>(null);
  const [savingBooking, setSavingBooking] = useState(false);
  const [scheduleFilter, setScheduleFilter] = useState<"all" | "today" | "upcoming" | "renewals">("all");
  const [lineItems, setLineItems] = useState<OrderLineItem[]>([]);
  const [pickerProductId, setPickerProductId] = useState<string | undefined>(undefined);
  const [pickerQty, setPickerQty] = useState<number>(1);
  const [isListeningVoice, setIsListeningVoice] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState("");

  const handleVoiceBilling = () => {
    if (typeof window === "undefined") return;
    const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionClass) {
      message.warning("Voice Recognition aapke browser me supported nahi hai. Google Chrome use karein.");
      return;
    }

    if (isListeningVoice) {
      setIsListeningVoice(false);
      return;
    }

    try {
      const recognition = new SpeechRecognitionClass();
      recognition.lang = "hi-IN";
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListeningVoice(true);
        setVoiceTranscript("बोलिए... जैसे: '2 किलो चावल' या '5 पैकेट दूध'");
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results?.[0]?.[0]?.transcript || "";
        setVoiceTranscript(transcript);

        if (!transcript.trim()) {
          setIsListeningVoice(false);
          return;
        }

        const hindiNumbers: Record<string, number> = {
          ek: 1, do: 2, teen: 3, char: 4, paanch: 5, chhe: 6, saat: 7, aath: 8, nau: 9, dus: 10,
          "एक": 1, "दो": 2, "तीन": 3, "चार": 4, "पांच": 5, "छह": 6, "सात": 7, "आठ": 8, "नौ": 9, "दस": 10,
        };

        let parsedQty = 1;
        const matchNum = transcript.match(/\b\d+\b/);
        if (matchNum) {
          parsedQty = parseInt(matchNum[0], 10);
        } else {
          for (const [w, n] of Object.entries(hindiNumbers)) {
            const re = new RegExp(`\\b${w}\\b`, "i");
            if (re.test(transcript)) {
              parsedQty = n;
              break;
            }
          }
        }

        const cleanText = transcript
          .replace(/\b\d+\b/g, "")
          .replace(/kilo|kg|packet|pack|piece|pcs|l|litre|लीटर|किलो|पैकेट/gi, "")
          .trim()
          .toLowerCase();

        const words = cleanText.split(/\s+/).filter((w: string) => w.length >= 2);
        let matchedProduct = products.find((p) => {
          const pName = p.name.toLowerCase();
          return pName.includes(cleanText) || cleanText.includes(pName);
        });

        if (!matchedProduct && words.length > 0) {
          matchedProduct = products.find((p) => {
            const pName = p.name.toLowerCase();
            return words.some((w: string) => pName.includes(w));
          });
        }

        if (matchedProduct) {
          setLineItems((prev) => {
            const exists = prev.find((item) => item.productId === matchedProduct!.id);
            if (exists) {
              return prev.map((item) =>
                item.productId === matchedProduct!.id
                  ? { ...item, quantity: item.quantity + parsedQty }
                  : item
              );
            }
            return [
              ...prev,
              {
                productId: matchedProduct!.id,
                name: matchedProduct!.name,
                price: Number(matchedProduct!.price) || 0,
                quantity: parsedQty,
                unit: matchedProduct!.unit || "pcs",
              },
            ];
          });
          message.success(`🎙️ Added: ${parsedQty} × ${matchedProduct.name}`);
        } else {
          message.info(`सुना: "${transcript}". कृपया ड्रॉपडाउन से चुनें।`);
        }

        setIsListeningVoice(false);
      };

      recognition.onerror = () => {
        setIsListeningVoice(false);
      };

      recognition.onend = () => {
        setIsListeningVoice(false);
      };

      recognition.start();
    } catch {
      setIsListeningVoice(false);
    }
  };
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

  // Feature 2: Incomplete & Abandoned Carts State
  const [activeTab, setActiveTab] = useState<"orders" | "abandoned">("orders");
  const [abandonedCarts, setAbandonedCarts] = useState<any[]>([]);
  const [loadingAbandoned, setLoadingAbandoned] = useState(false);
  const [storeSlug, setStoreSlug] = useState("");

  // Feature 5: Hyperlocal Delivery Rider Dispatch State
  const [dispatchOrder, setDispatchOrder] = useState<Order | null>(null);
  const [dispatchForm] = Form.useForm();
  const [dispatching, setDispatching] = useState(false);
  const [dispatchResult, setDispatchResult] = useState<any | null>(null);

  const loadAbandonedCarts = async (overrideSlug?: string) => {
    try {
      setLoadingAbandoned(true);
      const target = overrideSlug || storeSlug || user?.id;
      if (!target) return;
      const res = await api.get(`/api/storefront/${target}/abandoned-carts`);
      setAbandonedCarts(res.data?.abandonedCarts || []);
      if (res.data?.storeSlug) setStoreSlug(res.data.storeSlug);
    } catch {
    } finally {
      setLoadingAbandoned(false);
    }
  };

  const [resendingTask, setResendingTask] = useState(false);

  const handleDispatchDelivery = async (values: any) => {
    if (!dispatchOrder) return;
    try {
      setDispatching(true);
      const res = await api.post(`/api/orders/${dispatchOrder.id}/dispatch-delivery`, {
        deliveryBoyName: values.riderName,
        deliveryBoyPhone: values.riderPhone,
      });
      message.success(res.data?.message || `Delivery dispatched to ${values.riderName}!`);
      setDispatchResult(res.data);
      setOrders((prev) =>
        prev.map((o) =>
          o.id === dispatchOrder.id
            ? { ...o, status: "dispatched", assignedStaff: String(values.riderName).trim() }
            : o
        )
      );
    } catch (err: any) {
      message.error(err.response?.data?.error || err.message || "Failed to dispatch delivery");
    } finally {
      setDispatching(false);
    }
  };

  const handleResendRiderTask = async () => {
    if (!dispatchOrder || !dispatchResult?.riderPhone) return;
    try {
      setResendingTask(true);
      const res = await api.post(`/api/orders/${dispatchOrder.id}/resend-delivery-task`, {
        deliveryBoyName: dispatchResult.riderName,
        deliveryBoyPhone: dispatchResult.riderPhone,
      });
      message.success(res.data?.message || "Task re-sent to rider successfully!");
    } catch (err: any) {
      message.error(err.response?.data?.error || err.message || "Failed to send delivery task");
    } finally {
      setResendingTask(false);
    }
  };

  const handleDownloadPdf = async (order: Order) => {
    try {
      message.loading({ content: "Generating Tax Invoice PDF...", key: "pdf-dl" });
      const res = await api.get(`/api/orders/${order.id}/invoice-pdf`, { responseType: "blob" });
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Invoice-${order.id.slice(-6).toUpperCase()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      message.success({ content: "Invoice PDF downloaded!", key: "pdf-dl" });
    } catch (err: any) {
      message.error({ content: err.message || "Failed to download invoice PDF", key: "pdf-dl" });
    }
  };

  const handleSendWhatsAppBill = async (order: Order) => {
    try {
      setSendingBillId(order.id);
      message.loading({ content: `Sending PDF bill to ${order.customerName} on WhatsApp...`, key: "wa-bill" });
      const res = await api.post(`/api/orders/${order.id}/send-invoice-whatsapp`);
      message.success({ content: res.data?.message || `PDF Invoice sent to ${order.customerName}!`, key: "wa-bill" });
    } catch (err: any) {
      try {
        let itemsSummary = "";
        try {
          const parsed = JSON.parse(order.itemsJson || "[]");
          if (Array.isArray(parsed) && parsed.length > 0) {
            itemsSummary = "\n📋 *Items:*\n" + parsed.map((i: any) => `• ${i.name} x ${i.quantity} = ₹${i.price * i.quantity}`).join("\n");
          }
        } catch {}

        const scheduleLine =
          order.bookingDate || order.assignedStaff || order.nextRenewalDate
            ? `${order.bookingDate ? `\n📅 *Scheduled Date:* ${order.bookingDate}${order.timeSlot ? ` (${order.timeSlot})` : ""}` : ""}${order.assignedStaff ? `\n👷 *Assigned Staff:* ${order.assignedStaff}` : ""}${order.nextRenewalDate ? `\n🔔 *Next Renewal:* ${order.nextRenewalDate}` : ""}`
            : "";
        const upiLine = upiId ? `\n💳 *Pay via UPI:* ${upiId}` : "";
        const billText = `🧾 *Order / Booking Invoice #${order.id.slice(-6)}*\n\nNamaste *${order.customerName}*,\nAapki details neeche di gayi hain:${itemsSummary}${scheduleLine}\n\n💰 *Total Amount:* ₹${order.totalAmount}\n📌 *Status:* ${order.status.toUpperCase()}${order.notes ? `\n📝 *Note:* ${order.notes}` : ""}${upiLine}\n📅 *Bill Date:* ${new Date(order.createdAt).toLocaleDateString()}\n\nThank you for your business! 🙏`;

        await api.post("/api/whatsapp/send", {
          recipientPhone: order.customerPhone,
          messageText: billText,
          contactName: order.customerName,
        });
        message.success({ content: `WhatsApp text bill sent to ${order.customerName}!`, key: "wa-bill" });
      } catch (fallbackErr: any) {
        message.error({ content: err.response?.data?.error || fallbackErr.message || "Could not send bill. Please ensure WhatsApp is connected.", key: "wa-bill" });
      }
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
      if (user?.role !== "staff") {
        api.get("/api/settings/staff")
          .then((r) => setStaffNames((r.data?.staff || []).map((s: any) => s.name).filter(Boolean)))
          .catch(() => {});
      }
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
          if (b.slug) {
            setStoreSlug(b.slug);
            loadAbandonedCarts(b.slug);
          } else {
            loadAbandonedCarts();
          }
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
        loadAbandonedCarts();
      });

      socket.on("cart_session:updated", () => {
        loadAbandonedCarts();
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
        socket.off("cart_session:updated");
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
        discountAmount: Number(values.discountAmount) || 0,
        deliveryCharge: Number(values.deliveryCharge) || 0,
        deliveryAddress: values.deliveryAddress || "",
        bookingDate: values.bookingDate || "",
        timeSlot: values.timeSlot || "",
        assignedStaff: values.assignedStaff || "",
        serviceMode: values.serviceMode || "",
        nextRenewalDate: values.nextRenewalDate || "",
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

  const handleSaveBookingUpdate = async (values: any) => {
    if (!bookingModalOrder) return;
    try {
      setSavingBooking(true);
      const res = await api.put(`/api/orders/${bookingModalOrder.id}/booking`, {
        bookingDate: values.bookingDate || "",
        timeSlot: values.timeSlot || "",
        assignedStaff: values.assignedStaff || "",
        serviceMode: values.serviceMode || "",
        nextRenewalDate: values.nextRenewalDate || "",
        notifyCustomer: Boolean(values.notifyCustomer),
      });
      if (res.data?.order) {
        setOrders((prev) => prev.map((o) => (o.id === bookingModalOrder.id ? res.data.order : o)));
      }
      message.success("Booking schedule & technician updated!");
      setBookingModalOrder(null);
    } catch (err: any) {
      message.error(err.message || "Could not update schedule");
    } finally {
      setSavingBooking(false);
    }
  };

  const handleSendRenewalReminder = async (order: Order) => {
    try {
      const msg =
        `🔔 *Service Due / Renewal Reminder — ${businessProfile.name}*\n\n` +
        `Namaste *${order.customerName}*,\n` +
        `Your next scheduled service / AMC renewal is due on *${order.nextRenewalDate}*.\n` +
        `Reply here to confirm your convenient time slot!`;
      await api.post("/api/whatsapp/send", {
        recipientPhone: order.customerPhone,
        messageText: msg,
        contactName: order.customerName,
      });
      message.success(`Renewal reminder sent to ${order.customerName}!`);
    } catch (err: any) {
      message.error(err.response?.data?.error || err.message || "Connect WhatsApp first to send reminder");
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
        const utrMatch = record.notes?.match(/UTR:\s*(\d{12})/i)?.[1];
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
            {utrMatch && (
              <div style={{ fontSize: 11, color: "#059669", fontWeight: 600, marginTop: 3, fontFamily: "monospace" }}>
                UTR: {utrMatch}
              </div>
            )}
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
      title: "Notes & Schedule",
      dataIndex: "notes",
      key: "notes",
      render: (notes: string, record: Order) => (
        <div style={{ fontSize: 12 }}>
          {record.bookingDate && (
            <div>
              <Tag color="geekblue">
                {record.bookingDate} {record.timeSlot ? `• ${record.timeSlot}` : ""}
              </Tag>
            </div>
          )}
          {record.assignedStaff && (
            <div style={{ color: "#475569", marginTop: 2 }}>
              Staff: <strong>{record.assignedStaff}</strong>
              {record.serviceMode ? ` (${SERVICE_MODE_NAMES[record.serviceMode] || record.serviceMode})` : ""}
            </div>
          )}
          {record.nextRenewalDate && (
            <div style={{ color: "#7c3aed", marginTop: 2 }}>
              Renewal Due: <strong>{record.nextRenewalDate}</strong>
            </div>
          )}
          <div>{notes || (!record.bookingDate ? "-" : "")}</div>
        </div>
      ),
    },
    {
      title: "Action",
      key: "action",
      render: (_: any, record: Order) => (
        <Space size="small" wrap>
          {record.status !== "cancelled" && (
            <Button
              size="small"
              icon={<CarOutlined />}
              style={{ color: "#0284c7", borderColor: "#7dd3fc", fontWeight: 600 }}
              onClick={() => {
                setDispatchOrder(record);
                setDispatchResult(null);
                dispatchForm.setFieldsValue({
                  riderName: record.assignedStaff || "",
                  riderPhone: "",
                });
              }}
            >
              Rider
            </Button>
          )}
          <Button
            size="small"
            icon={<CalendarOutlined />}
            onClick={() => {
              setBookingModalOrder(record);
              bookingForm.setFieldsValue({
                bookingDate: record.bookingDate || "",
                timeSlot: record.timeSlot || undefined,
                assignedStaff: record.assignedStaff || "",
                serviceMode: record.serviceMode || "any",
                nextRenewalDate: record.nextRenewalDate || "",
                notifyCustomer: true,
              });
            }}
          >
            Schedule
          </Button>
          {record.nextRenewalDate && (
            <Button size="small" onClick={() => handleSendRenewalReminder(record)} style={{ color: "#7c3aed", borderColor: "#c4b5fd" }}>
              Renewal WA
            </Button>
          )}
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

  const todayStr = new Date().toISOString().slice(0, 10);
  const filteredOrders = orders.filter((o) => {
    const matchesStatus = statusFilter === "all" || o.status === statusFilter;
    const matchesSchedule =
      scheduleFilter === "all" ||
      (scheduleFilter === "today" && String(o.bookingDate || "") === todayStr) ||
      (scheduleFilter === "upcoming" && Boolean(o.bookingDate) && String(o.bookingDate) >= todayStr) ||
      (scheduleFilter === "renewals" && Boolean(o.nextRenewalDate));
    const q = searchText.trim().toLowerCase();
    const matchesSearch =
      !q ||
      o.customerName.toLowerCase().includes(q) ||
      o.customerPhone.toLowerCase().includes(q) ||
      (o.assignedStaff || "").toLowerCase().includes(q) ||
      o.id.toLowerCase().includes(q);
    return matchesStatus && matchesSchedule && matchesSearch;
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
      ${order.deliveryAddress ? `<div><strong>Address:</strong> ${order.deliveryAddress}</div>` : ""}
      ${order.bookingDate ? `<div><strong>Booking Schedule:</strong> ${order.bookingDate}${order.timeSlot ? ` (${order.timeSlot})` : ""}${order.serviceMode ? ` • ${SERVICE_MODE_NAMES[order.serviceMode] || order.serviceMode}` : ""}</div>` : ""}
      ${order.assignedStaff ? `<div><strong>Assigned Staff:</strong> ${order.assignedStaff}</div>` : ""}
      ${order.nextRenewalDate ? `<div><strong>Next Renewal Date:</strong> ${order.nextRenewalDate}</div>` : ""}
      <table><thead><tr><th>#</th><th>Item</th><th style="text-align:right">Qty</th><th style="text-align:right">Rate</th><th style="text-align:right">Total</th></tr></thead><tbody>${itemRows}</tbody></table>
      <div class="totals">
        ${Number(order.discountAmount) > 0 ? `<div><span>Discount${order.couponCode ? ` (${order.couponCode})` : ""}:</span><span>-₹${Number(order.discountAmount).toFixed(2)}</span></div>` : ""}
        ${Number(order.deliveryCharge) > 0 ? `<div><span>Delivery Charge:</span><span>+₹${Number(order.deliveryCharge).toFixed(2)}</span></div>` : ""}
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
                ["OrderID", "Customer", "Phone", "Amount", "Status", "PaymentStatus", "PaidAmount", "BookingDate", "TimeSlot", "AssignedStaff", "ServiceMode", "NextRenewalDate", "Notes", "Date"],
                filteredOrders.map((o) => [
                  o.id,
                  o.customerName,
                  o.customerPhone,
                  o.totalAmount,
                  o.status,
                  o.paymentStatus || "unpaid",
                  o.paidAmount || 0,
                  o.bookingDate || "",
                  o.timeSlot || "",
                  o.assignedStaff || "",
                  o.serviceMode || "",
                  o.nextRenewalDate || "",
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

      {/* Feature 2: Segmented Switcher for Orders vs Abandoned Carts */}
      <div style={{ marginBottom: 14 }}>
        <Segmented
          value={activeTab}
          onChange={(val: any) => {
            setActiveTab(val);
            if (val === "abandoned") loadAbandonedCarts();
          }}
          options={[
            { label: `🛍️ Orders & Sales (${orders.length})`, value: "orders" },
            { label: `🛒 Incomplete & Abandoned Carts (${abandonedCarts.length})`, value: "abandoned" },
          ]}
          style={{ fontWeight: 600 }}
        />
      </div>

      {activeTab === "abandoned" ? (
        <Card style={{ borderRadius: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
            <div>
              <Title level={5} style={{ margin: 0 }}>
                🛒 Incomplete Checkouts &amp; Abandoned Carts ({abandonedCarts.length})
              </Title>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Shoppers who entered contact details but did not complete order. Send 1-click WhatsApp recovery nudge!
              </Text>
            </div>
            <Button icon={<SyncOutlined />} onClick={() => loadAbandonedCarts()} loading={loadingAbandoned}>
              Refresh Carts
            </Button>
          </div>

          <Table
            dataSource={abandonedCarts}
            rowKey={(r) => `${r.customerPhone}_${r.updatedAt}`}
            loading={loadingAbandoned}
            pagination={{ pageSize: 8 }}
            columns={[
              {
                title: "Shopper",
                key: "customer",
                render: (_: any, r: any) => (
                  <div>
                    <div style={{ fontWeight: 600 }}>{r.customerName || "Online Visitor"}</div>
                    <Text type="secondary" style={{ fontSize: 12 }}>+{String(r.customerPhone || "").replace(/^\+/, "")}</Text>
                    {r.deliveryAddress && (
                      <div style={{ fontSize: 11, color: "#64748b" }}>{r.deliveryAddress}</div>
                    )}
                  </div>
                ),
              },
              {
                title: "Incomplete Items",
                key: "items",
                render: (_: any, r: any) => (
                  <div>
                    {Array.isArray(r.items) && r.items.map((it: any, idx: number) => (
                      <div key={idx} style={{ fontSize: 12 }}>
                        • <strong>{it.name}</strong> × {it.quantity} {it.unit || ""} (₹{it.price * it.quantity})
                      </div>
                    ))}
                  </div>
                ),
              },
              {
                title: "Cart Value",
                dataIndex: "totalAmount",
                key: "totalAmount",
                render: (val: number) => (
                  <Text strong style={{ color: "#059669", fontSize: 14 }}>
                    ₹{Number(val || 0).toLocaleString("en-IN")}
                  </Text>
                ),
              },
              {
                title: "Active",
                dataIndex: "updatedAt",
                key: "updatedAt",
                render: (dt: string) => {
                  const d = new Date(dt);
                  const minsAgo = Math.round((Date.now() - d.getTime()) / 60000);
                  const timeText = minsAgo < 60 ? `${minsAgo} mins ago` : `${Math.round(minsAgo / 60)} hrs ago`;
                  return (
                    <div>
                      <Tag color="orange">{timeText}</Tag>
                      <div style={{ fontSize: 11, color: "#8c8c8c" }}>{d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                  );
                },
              },
              {
                title: "Action",
                key: "action",
                render: (_: any, r: any) => {
                  const cleanPhone = String(r.customerPhone || "").replace(/\D/g, "");
                  const storeUrl = `${typeof window !== "undefined" ? window.location.origin : "https://app.ginie.space"}/shop/${storeSlug || user?.id}`;
                  const itemsList = Array.isArray(r.items)
                    ? r.items.map((it: any) => `• ${it.name} x ${it.quantity} (₹${it.price * it.quantity})`).join("\n")
                    : "";
                  const nudgeMsg =
                    `🙏 *Namaste ${r.customerName || "ji"}! — ${businessProfile.name}*\n\n` +
                    `Aapke cart mein items wait kar rahe hain:\n${itemsList}\n\n` +
                    `💰 *Cart Total:* ₹${r.totalAmount}\n\n` +
                    `Order complete karne ke liye direct link par tap karein:\n👉 ${storeUrl}\n\n` +
                    `Kisi bhi sahayata ke liye reply karein. Dhanyavaad!`;

                  return (
                    <Button
                      type="primary"
                      icon={<WhatsAppOutlined />}
                      style={{ background: "#25D366", borderColor: "#25D366", fontWeight: 600 }}
                      size="small"
                      href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(nudgeMsg)}`}
                      target="_blank"
                    >
                      Recovery Nudge
                    </Button>
                  );
                },
              },
            ]}
          />
        </Card>
      ) : (
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
          <Select
            value={scheduleFilter}
            onChange={setScheduleFilter}
            style={{ width: 185 }}
            options={[
              { value: "all", label: "All Orders & Bookings" },
              { value: "today", label: "Today's Schedule" },
              { value: "upcoming", label: "Upcoming Bookings" },
              { value: "renewals", label: "Upcoming Renewals" },
            ]}
          />
        </div>
        <Table
          dataSource={filteredOrders}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 1000 }}
        />
      </Card>
      )}

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
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, flexWrap: "wrap", gap: 8 }}>
            <Text strong style={{ fontSize: 13 }}>
              <ShoppingCartOutlined /> Add Catalog Items
            </Text>
            <Button
              size="small"
              icon={<AudioOutlined style={{ color: isListeningVoice ? "#ef4444" : "#059669" }} />}
              onClick={handleVoiceBilling}
              style={{
                borderRadius: 16,
                fontWeight: 600,
                fontSize: 12,
                borderColor: isListeningVoice ? "#ef4444" : "#10b981",
                background: isListeningVoice ? "#fef2f2" : "#f0fdf4",
                color: isListeningVoice ? "#b91c1c" : "#15803d",
              }}
            >
              {isListeningVoice ? "🎙️ बोल रहे हैं... (Listening)" : "🎙️ आवाज़ से जोड़ें (Voice Add)"}
            </Button>
          </div>

          {isListeningVoice && (
            <div style={{ marginBottom: 10, padding: "6px 10px", background: "#fef2f2", border: "1px dashed #ef4444", borderRadius: 6, fontSize: 12, color: "#991b1b" }}>
              🎙️ <strong>माइक्रोफोन चालू है:</strong> {voiceTranscript || "जैसे बोलें: '2 किलो चावल' या '5 पैकेट दूध'"}
            </div>
          )}
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

        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateOrder}
          initialValues={{ status: "pending", paymentStatus: "unpaid", paidAmount: 0, discountAmount: 0, deliveryCharge: 0 }}
          onValuesChange={(changed) => {
            if ((changed.discountAmount !== undefined || changed.deliveryCharge !== undefined) && lineItems.length > 0) {
              const itemsSum = lineItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
              const disc = Number(form.getFieldValue("discountAmount")) || 0;
              const deliv = Number(form.getFieldValue("deliveryCharge")) || 0;
              form.setFieldValue("totalAmount", Math.max(0, itemsSum - disc + deliv));
            }
          }}
        >
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
            <Form.Item name="discountAmount" label="Discount (₹)" style={{ flex: 1, minWidth: 140 }}>
              <InputNumber style={{ width: "100%" }} min={0} placeholder="0" />
            </Form.Item>
            <Form.Item name="deliveryCharge" label="Delivery Charge (₹)" style={{ flex: 1, minWidth: 140 }}>
              <InputNumber style={{ width: "100%" }} min={0} placeholder="0" />
            </Form.Item>
          </div>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Form.Item
              name="totalAmount"
              label="Final Total Amount (₹)"
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

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Form.Item name="bookingDate" label="Appointment / Visit Date (Services)">
              <Input type="date" />
            </Form.Item>
            <Form.Item name="timeSlot" label="Time Slot">
              <Select
                allowClear
                placeholder="Select slot"
                options={BOOKING_TIME_SLOTS.map((s) => ({ value: s, label: s }))}
              />
            </Form.Item>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <Form.Item name="serviceMode" label="Service Mode">
              <Select
                allowClear
                placeholder="Mode"
                options={[
                  { value: "home_visit", label: "Home Visit" },
                  { value: "at_store", label: "At Store / Clinic" },
                  { value: "online", label: "Online / Video" },
                ]}
              />
            </Form.Item>
            <Form.Item name="assignedStaff" label="Assign Technician / Staff">
              <Input
                list="staff-datalist"
                placeholder="e.g. Raju Tech"
              />
            </Form.Item>
            <Form.Item name="nextRenewalDate" label="Next Renewal / AMC Date">
              <Input type="date" />
            </Form.Item>
          </div>
          <datalist id="staff-datalist">
            {staffNames.map((n) => (
              <option key={n} value={n} />
            ))}
          </datalist>

          <Form.Item name="deliveryAddress" label="Delivery / Visit Address &amp; Pincode (Optional)">
            <Input placeholder="Shop/House No, Area, City, Pincode..." />
          </Form.Item>

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
      <InvoiceModal
        open={Boolean(invoiceOrder)}
        onClose={() => setInvoiceOrder(null)}
        order={invoiceOrder}
        store={{
          name: businessProfile.name,
          phone: businessProfile.phone,
          address: businessProfile.address,
          gstin: businessProfile.gstin,
          gstRate: Number(businessProfile.gstRate) || 0,
          upiId: upiId,
          businessType: user?.businessType || "retail",
        }}
      />
      {/* Schedule / Technician Assignment Modal */}
      <Modal
        title={`Booking Schedule & Technician — #${bookingModalOrder ? bookingModalOrder.id.slice(-6).toUpperCase() : ""}`}
        open={Boolean(bookingModalOrder)}
        onCancel={() => setBookingModalOrder(null)}
        footer={null}
        destroyOnClose
      >
        <Form form={bookingForm} layout="vertical" onFinish={handleSaveBookingUpdate}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Form.Item name="bookingDate" label="Appointment Date">
              <Input type="date" />
            </Form.Item>
            <Form.Item name="timeSlot" label="Time Slot">
              <Select
                allowClear
                placeholder="Choose time slot"
                options={BOOKING_TIME_SLOTS.map((s) => ({ value: s, label: s }))}
              />
            </Form.Item>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Form.Item name="assignedStaff" label="Assigned Staff / Technician">
              <Input list="staff-datalist" placeholder="e.g. Suresh Electrician" />
            </Form.Item>
            <Form.Item name="serviceMode" label="Service Mode">
              <Select
                options={[
                  { value: "home_visit", label: "Home Visit" },
                  { value: "at_store", label: "At Store / Clinic" },
                  { value: "online", label: "Online / Video" },
                  { value: "any", label: "Flexible" },
                ]}
              />
            </Form.Item>
          </div>
          <Form.Item name="nextRenewalDate" label="Next Service Due / AMC Renewal Date">
            <Input type="date" />
          </Form.Item>
          <Form.Item name="notifyCustomer" valuePropName="checked">
            <Checkbox>Notify customer on WhatsApp with updated schedule</Checkbox>
          </Form.Item>
          <Button type="primary" htmlType="submit" block loading={savingBooking} style={{ background: "#25D366", borderColor: "#25D366", fontWeight: 600 }}>
            Save Schedule
          </Button>
        </Form>
      </Modal>

      {/* Feature 5: Hyperlocal Delivery Rider Dispatch Modal */}
      <Modal
        title={
          <Space>
            <CarOutlined style={{ color: "#0284c7" }} />
            <span>Dispatch Delivery Rider — #{dispatchOrder?.id.slice(-6).toUpperCase()}</span>
          </Space>
        }
        open={Boolean(dispatchOrder)}
        onCancel={() => {
          setDispatchOrder(null);
          setDispatchResult(null);
        }}
        footer={null}
        destroyOnClose
      >
        {dispatchOrder && (
          <Space direction="vertical" style={{ width: "100%" }} size={14}>
            <div style={{ background: "#f0f9ff", border: "1px solid #bae6fd", padding: "12px 14px", borderRadius: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#0369a1" }}>
                Delivery Address:
              </div>
              <div style={{ fontSize: 14, color: "#0f172a", marginTop: 2 }}>
                {dispatchOrder.deliveryAddress || "Self store delivery"}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 12 }}>
                <span>Customer: <strong>{dispatchOrder.customerName}</strong></span>
                <span>Phone: <strong>+{dispatchOrder.customerPhone.replace(/^\+/, "")}</strong></span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: 12 }}>
                <span>Order Total: <strong>₹{dispatchOrder.totalAmount}</strong></span>
                <span>Payment: <Tag color={dispatchOrder.paymentStatus === "paid" ? "green" : "volcano"}>{(dispatchOrder.paymentStatus || "unpaid").toUpperCase()}</Tag></span>
              </div>
            </div>

            <Form form={dispatchForm} layout="vertical" onFinish={handleDispatchDelivery}>
              <Form.Item
                name="riderName"
                label="Delivery Rider / Boy Name"
                rules={[{ required: true, message: "Please enter rider name" }]}
              >
                <Input placeholder="e.g. Raju Kumar (Rider)" />
              </Form.Item>

              <Form.Item
                name="riderPhone"
                label="Rider WhatsApp Mobile Number"
                rules={[{ required: true, message: "Please enter rider mobile number" }]}
              >
                <Input placeholder="e.g. 919876543210" />
              </Form.Item>

              <Button
                type="primary"
                htmlType="submit"
                block
                loading={dispatching}
                style={{ background: "#0284c7", borderColor: "#0284c7", fontWeight: 700, height: 40 }}
              >
                Confirm Dispatch &amp; Generate Task Slip
              </Button>
            </Form>

            {dispatchResult && (
              <div
                style={{
                  background: dispatchResult.whatsappDirectSent || dispatchResult.whatsappConnected ? "#f0fdf4" : "#fffbeb",
                  border: `1px solid ${dispatchResult.whatsappDirectSent || dispatchResult.whatsappConnected ? "#bbf7d0" : "#fde68a"}`,
                  padding: 14,
                  borderRadius: 8,
                  marginTop: 12,
                }}
              >
                {dispatchResult.whatsappDirectSent || dispatchResult.whatsappConnected ? (
                  <>
                    <div style={{ color: "#15803d", fontWeight: 700, display: "flex", alignItems: "center", gap: 6, fontSize: 14 }}>
                      <CheckCircleFilled style={{ color: "#16a34a" }} /> Task Sent Directly via Connected WhatsApp!
                    </div>
                    <div style={{ fontSize: 13, color: "#166534", marginTop: 4, lineHeight: 1.5 }}>
                      Delivery details, customer address, and task slip were automatically sent to <strong>{dispatchResult.riderName}</strong> (+{dispatchResult.riderPhone}) directly from your linked WhatsApp ({dispatchResult.connectedPhone || "Connected"}).
                    </div>
                    <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                      <Button
                        type="primary"
                        icon={<ReloadOutlined />}
                        loading={resendingTask}
                        onClick={handleResendRiderTask}
                        style={{ background: "#16a34a", borderColor: "#16a34a", fontWeight: 600, flex: 1, minWidth: 200 }}
                      >
                        Resend Task via Connected WhatsApp
                      </Button>
                      <Button
                        icon={<ShareAltOutlined />}
                        onClick={() => {
                          const text = dispatchResult.riderWhatsappText || "";
                          const url = `https://wa.me/${dispatchResult.riderPhone}?text=${encodeURIComponent(text)}`;
                          window.open(url, "_blank");
                        }}
                        style={{ fontWeight: 500 }}
                      >
                        Open WhatsApp Web (Manual)
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ color: "#b45309", fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
                      <ExclamationCircleFilled style={{ color: "#d97706" }} /> Dispatch Confirmed (WhatsApp Not Connected)
                    </div>
                    <div style={{ fontSize: 12, color: "#92400e", marginTop: 4 }}>
                      Connect your WhatsApp in Settings to send automatically without leaving GinieSpace, or click below to send manually:
                    </div>
                    <Button
                      type="primary"
                      icon={<WhatsAppOutlined />}
                      block
                      style={{ background: "#25D366", borderColor: "#25D366", fontWeight: 700, marginTop: 10 }}
                      href={`https://wa.me/${dispatchResult.riderPhone}?text=${encodeURIComponent(dispatchResult.riderWhatsappText)}`}
                      target="_blank"
                    >
                      Send Task via WhatsApp Web
                    </Button>
                  </>
                )}
              </div>
            )}
          </Space>
        )}
      </Modal>
    </AppLayout>
  );
}