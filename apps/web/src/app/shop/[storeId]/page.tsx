"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  Card,
  Row,
  Col,
  Button,
  Tag,
  Typography,
  Input,
  Badge,
  Drawer,
  Form,
  Space,
  Empty,
  Spin,
  Result,
  message,
  Divider,
  Select,
  Modal,
  Alert,
  Segmented,
  Tooltip,
} from "antd";
import {
  ShopOutlined,
  ShoppingCartOutlined,
  PlusOutlined,
  MinusOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  CheckCircleOutlined,
  WhatsAppOutlined,
  SearchOutlined,
  ShareAltOutlined,
  StarFilled,
  SafetyCertificateFilled,
  ThunderboltFilled,
  ClockCircleOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import { api } from "../../../lib/api";

const { Title, Text } = Typography;

interface StoreInfo {
  id: string;
  slug?: string;
  name: string;
  phone?: string;
  address?: string;
  businessType?: string;
  upiId?: string;
  deliveryFee?: number;
  coupons?: Array<{ code: string; discountPercent: number }>;
  logoUrl?: string;
  isOpen?: boolean;
  closedMessage?: string;
}

interface StoreProduct {
  id: string;
  name: string;
  description?: string;
  price: number;
  unit: string;
  stock: number;
  imageUrl?: string;
  category?: string;
  minOrderQty?: number;
  itemType?: "product" | "service";
  duration?: string;
  serviceMode?: "at_store" | "home_visit" | "online" | "any";
}

const STORE_TIME_SLOTS = [
  "09:00 AM - 11:00 AM",
  "11:00 AM - 01:00 PM",
  "02:00 PM - 04:00 PM",
  "04:00 PM - 06:00 PM",
  "06:00 PM - 08:00 PM",
];

const STORE_SERVICE_MODE_TEXT: Record<string, string> = {
  home_visit: "Home Visit",
  at_store: "At Store / Clinic",
  online: "Online / Remote",
  any: "Store or Home Visit",
};

export default function PublicStorefrontPage() {
  const params = useParams();
  const storeId = String(params?.storeId || "");

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [store, setStore] = useState<StoreInfo | null>(null);
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"featured" | "low" | "high">("featured");
  const [cart, setCart] = useState<Record<string, number>>({});
  const [cartOpen, setCartOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountPercent: number } | null>(null);
  const [trackOpen, setTrackOpen] = useState(false);
  const [trackPhone, setTrackPhone] = useState("");
  const [trackOrderId, setTrackOrderId] = useState("");
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackedOrders, setTrackedOrders] = useState<any[] | null>(null);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [selectedBookingDate, setSelectedBookingDate] = useState<string>("");

  // Professional Upgrades State
  const [quickViewProduct, setQuickViewProduct] = useState<StoreProduct | null>(null);
  const [fulfillmentType, setFulfillmentType] = useState<"delivery" | "pickup">("delivery");
  const [paymentMethod, setPaymentMethod] = useState<"upi" | "cod" | "whatsapp">("upi");

  const [orderResult, setOrderResult] = useState<{
    orderId: string;
    totalAmount: number;
    upiUri?: string;
    qrDataUrl?: string;
    paymentMethod?: string;
  } | null>(null);

  const [form] = Form.useForm();

  // Load store details
  useEffect(() => {
    if (!storeId) return;
    setLoading(true);
    api
      .get(`/api/storefront/${storeId}`)
      .then((res) => {
        setStore(res.data.store);
        setProducts(res.data.products || []);
      })
      .catch(() => {
        setNotFound(true);
      })
      .finally(() => setLoading(false));
  }, [storeId]);

  // Auto-restore customer contact info from local storage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("ginie_storefront_cust");
      if (saved) {
        const parsed = JSON.parse(saved);
        form.setFieldsValue({
          customerName: parsed.customerName || "",
          customerPhone: parsed.customerPhone || "",
          deliveryAddress: parsed.deliveryAddress || "",
        });
      }
    } catch {}
  }, [form]);

  // Load booked slots when booking date changes
  useEffect(() => {
    if (!storeId || !selectedBookingDate) {
      setBookedSlots([]);
      return;
    }
    api
      .get(`/api/storefront/${storeId}/booked-slots`, { params: { date: selectedBookingDate } })
      .then((res) => setBookedSlots(res.data?.bookedSlots || []))
      .catch(() => setBookedSlots([]));
  }, [storeId, selectedBookingDate]);

  const updateQty = (productId: string, delta: number, maxStock: number, minOrderQty = 1) => {
    const moq = Math.max(1, Number(minOrderQty) || 1);
    setCart((prev) => {
      const current = prev[productId] || 0;
      let next = current + delta;
      if (current === 0 && delta > 0) {
        next = maxStock > 0 ? Math.min(maxStock, moq) : moq;
      } else if (delta < 0 && next < moq) {
        next = 0;
      } else {
        next = Math.max(0, maxStock > 0 ? Math.min(maxStock, next) : next);
      }
      const copy = { ...prev };
      if (next === 0) {
        delete copy[productId];
      } else {
        copy[productId] = next;
      }
      return copy;
    });
  };

  const cartItems = products
    .filter((p) => (cart[p.id] || 0) > 0)
    .map((p) => ({
      productId: p.id,
      name: p.name,
      price: Number(p.price) || 0,
      unit: p.unit || "pcs",
      quantity: cart[p.id],
      itemType: p.itemType || "product",
    }));

  const hasServiceInCart = cartItems.some((it) => it.itemType === "service") || store?.businessType === "services";

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const cartSubtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discountAmount = appliedCoupon ? Math.round((cartSubtotal * appliedCoupon.discountPercent) / 100) : 0;
  const effectiveDeliveryFee = fulfillmentType === "pickup" ? 0 : cartItems.length > 0 ? Number(store?.deliveryFee) || 0 : 0;
  const cartTotal = Math.max(0, cartSubtotal - discountAmount + effectiveDeliveryFee);

  const categories = ["all", ...Array.from(new Set(products.map((p) => p.category || "General")))];

  const filteredProducts = products
    .filter((p) => {
      const matchesCat = selectedCategory === "all" || (p.category || "General") === selectedCategory;
      if (!matchesCat) return false;
      const q = searchTerm.trim().toLowerCase();
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        (p.description || "").toLowerCase().includes(q) ||
        (p.category || "").toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      if (sortBy === "low") return Number(a.price) - Number(b.price);
      if (sortBy === "high") return Number(b.price) - Number(a.price);
      return 0;
    });

  const handleCheckout = async (values: any) => {
    if (cartItems.length === 0) return;
    setSubmitting(true);

    // Save customer info locally for future visits
    try {
      localStorage.setItem(
        "ginie_storefront_cust",
        JSON.stringify({
          customerName: values.customerName,
          customerPhone: values.customerPhone,
          deliveryAddress: values.deliveryAddress,
        })
      );
    } catch {}

    try {
      const deliveryNote =
        fulfillmentType === "pickup"
          ? `[Self Pickup at Store] ${values.notes || ""}`.trim()
          : `[Delivery: ${values.deliveryAddress || "N/A"}] ${values.notes || ""}`.trim();

      const res = await api.post(`/api/storefront/${storeId}/orders`, {
        customerName: values.customerName,
        customerPhone: values.customerPhone,
        deliveryAddress: fulfillmentType === "pickup" ? "Self Pickup at Store" : values.deliveryAddress,
        bookingDate: values.bookingDate,
        timeSlot: values.timeSlot,
        serviceMode: values.serviceMode,
        items: cartItems,
        notes: `${deliveryNote} (Payment: ${paymentMethod.toUpperCase()})`,
        couponCode: appliedCoupon?.code,
      });

      const orderId = res.data.order.id;
      const totalAmount = res.data.order.totalAmount;

      // WhatsApp direct message checkout option
      if (paymentMethod === "whatsapp" && store?.phone) {
        const orderSummaryText =
          `Namaste ${store.name}!\nI would like to place an order:\n\n` +
          cartItems.map((i) => `• ${i.name} (${i.quantity} ${i.unit}) — ₹${i.price * i.quantity}`).join("\n") +
          `\n\nSubtotal: ₹${cartSubtotal}\n` +
          (discountAmount > 0 ? `Coupon Discount: -₹${discountAmount}\n` : "") +
          (effectiveDeliveryFee > 0 ? `Delivery Fee: +₹${effectiveDeliveryFee}\n` : "") +
          `*Total Payable: ₹${totalAmount}*\n\n` +
          `Customer: ${values.customerName} (${values.customerPhone})\n` +
          `Fulfillment: ${fulfillmentType === "pickup" ? "Self Store Pickup" : `Home Delivery to ${values.deliveryAddress}`}\n` +
          `Order Reference: #${orderId.slice(-6).toUpperCase()}`;

        const waUrl = `https://wa.me/${store.phone.replace(/\D/g, "")}?text=${encodeURIComponent(orderSummaryText)}`;
        window.open(waUrl, "_blank");
      }

      setOrderResult({
        orderId,
        totalAmount,
        upiUri: res.data.upiUri,
        qrDataUrl: res.data.qrDataUrl,
        paymentMethod,
      });
      setCart({});
      setAppliedCoupon(null);
      setCouponInput("");
      message.success("Order placed successfully!");
    } catch (err: any) {
      message.error(err.message || "Could not place order");
    } finally {
      setSubmitting(false);
    }
  };

  const handleTrackOrder = async () => {
    if (!trackPhone.trim()) {
      message.warning("Please enter your WhatsApp mobile number");
      return;
    }
    try {
      setTrackingLoading(true);
      const res = await api.get(`/api/storefront/${storeId}/track`, {
        params: {
          phone: trackPhone.trim(),
          orderId: trackOrderId.trim() || undefined,
        },
      });
      setTrackedOrders(res.data?.orders || []);
    } catch (err: any) {
      message.error(err.message || "Could not look up orders");
    } finally {
      setTrackingLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Spin size="large" />
      </div>
    );
  }

  if (notFound || !store) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <Result status="404" title="Store Not Found" subTitle="This GinieSpace digital storefront link is invalid or unavailable." />
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", paddingBottom: 100 }}>
      {/* Top Announcement Bar */}
      <div
        style={{
          background: "linear-gradient(90deg, #065f46 0%, #047857 50%, #059669 100%)",
          color: "#fff",
          padding: "7px 16px",
          fontSize: 12,
          fontWeight: 500,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          textAlign: "center",
          flexWrap: "wrap",
        }}
      >
        <span>🎉 <strong>Special Online Offer:</strong> Free Local Delivery on orders above ₹499!</span>
        {store.coupons && store.coupons.length > 0 && (
          <Tag
            color="gold"
            style={{
              cursor: "pointer",
              fontWeight: 700,
              margin: 0,
              padding: "0 8px",
              borderRadius: 6,
            }}
            onClick={() => {
              const c = store.coupons![0];
              setCouponInput(c.code);
              setAppliedCoupon(c);
              message.success(`Coupon ${c.code} (${c.discountPercent}% OFF) ready for cart!`);
            }}
          >
            Use Code {store.coupons[0].code} ({store.coupons[0].discountPercent}% OFF) ⚡
          </Tag>
        )}
      </div>

      {/* Store Cover Banner Header */}
      <div
        style={{
          background: "linear-gradient(135deg, #064e3b 0%, #047857 50%, #059669 100%)",
          color: "#fff",
          padding: "26px 20px 22px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 16,
            flexWrap: "wrap",
            position: "relative",
            zIndex: 2,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {store.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={store.logoUrl}
                alt={store.name}
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: 14,
                  objectFit: "cover",
                  border: "2px solid #fff",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                }}
              />
            ) : (
              <div
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: 14,
                  background: "rgba(255, 255, 255, 0.2)",
                  backdropFilter: "blur(4px)",
                  border: "2px solid rgba(255, 255, 255, 0.3)",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 26,
                }}
              >
                <ShopOutlined />
              </div>
            )}

            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <Title level={3} style={{ margin: 0, color: "#fff", fontWeight: 800 }}>
                  {store.name}
                </Title>
                <Tag
                  color="success"
                  style={{
                    margin: 0,
                    fontWeight: 700,
                    borderRadius: 6,
                    fontSize: 11,
                    background: "#ecfdf5",
                    color: "#065f46",
                    border: "1px solid #a7f3d0",
                  }}
                >
                  <SafetyCertificateFilled style={{ marginRight: 4 }} /> Verified Merchant
                </Tag>
                <Tag color="gold" style={{ margin: 0, fontWeight: 700, borderRadius: 6, fontSize: 11 }}>
                  ★ 4.9 (180+ Orders)
                </Tag>
                {store.isOpen === false ? (
                  <Tag color="error">CLOSED</Tag>
                ) : (
                  <Tag color="cyan" style={{ margin: 0, fontWeight: 600 }}>● Open (9 AM – 9 PM)</Tag>
                )}
              </div>

              <div style={{ fontSize: 12, color: "#d1fae5", marginTop: 6, display: "flex", gap: 14, flexWrap: "wrap" }}>
                {store.phone && (
                  <span>
                    <PhoneOutlined /> {store.phone}
                  </span>
                )}
                {store.address && (
                  <span>
                    <EnvironmentOutlined /> {store.address}
                  </span>
                )}
                <span>
                  🏷️{" "}
                  {store.businessType === "wholesale"
                    ? "Wholesale Hub"
                    : store.businessType === "services"
                    ? "Services & Booking Hub"
                    : "Retail Store"}
                </span>
              </div>
            </div>
          </div>

          <Space size="middle">
            <Button
              size="large"
              icon={<SearchOutlined />}
              style={{
                background: "rgba(255, 255, 255, 0.15)",
                color: "#fff",
                borderColor: "rgba(255, 255, 255, 0.3)",
                backdropFilter: "blur(4px)",
                fontWeight: 600,
              }}
              onClick={() => {
                setTrackedOrders(null);
                setTrackOpen(true);
              }}
            >
              Track Order
            </Button>

            <Badge count={cartCount} showZero={false}>
              <Button
                type="primary"
                size="large"
                icon={<ShoppingCartOutlined />}
                style={{
                  background: "#fff",
                  color: "#065f46",
                  borderColor: "#fff",
                  fontWeight: 700,
                  boxShadow: "0 4px 10px rgba(0, 0, 0, 0.15)",
                }}
                onClick={() => {
                  setOrderResult(null);
                  setCartOpen(true);
                }}
              >
                Cart {cartTotal > 0 ? `(₹${cartTotal.toLocaleString("en-IN")})` : ""}
              </Button>
            </Badge>
          </Space>
        </div>
      </div>

      {/* Trust & Guarantee Strip */}
      <div style={{ background: "#ffffff", borderBottom: "1px solid #e2e8f0", padding: "12px 20px" }}>
        <div
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 16,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: "#ecfdf5",
                color: "#059669",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 16,
              }}
            >
              <ThunderboltFilled />
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#1e293b" }}>Instant WhatsApp Confirm</div>
              <div style={{ fontSize: 11, color: "#64748b" }}>Live updates direct to phone</div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: "#ecfdf5",
                color: "#059669",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 16,
              }}
            >
              <SafetyCertificateFilled />
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#1e293b" }}>0% Convenience Fee</div>
              <div style={{ fontSize: 11, color: "#64748b" }}>Direct UPI GPay / PhonePe</div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: "#ecfdf5",
                color: "#059669",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 16,
              }}
            >
              <StarFilled />
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#1e293b" }}>100% Genuine Quality</div>
              <div style={{ fontSize: 11, color: "#64748b" }}>Verified merchant partner</div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: "#ecfdf5",
                color: "#059669",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 16,
              }}
            >
              <ClockCircleOutlined />
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#1e293b" }}>Fast Delivery &amp; Pickup</div>
              <div style={{ fontSize: 11, color: "#64748b" }}>Doorstep or store takeaway</div>
            </div>
          </div>
        </div>
      </div>

      {/* Product Catalog */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 20px" }}>
        {store.isOpen === false && (
          <Alert
            type="error"
            showIcon
            style={{ marginBottom: 16, borderRadius: 10 }}
            message="Store is Currently Closed"
            description={store.closedMessage || "This store is temporarily closed and not accepting new orders right now."}
          />
        )}

        <div
          style={{
            marginBottom: 14,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <Input
            prefix={<SearchOutlined style={{ color: "#94a3b8" }} />}
            placeholder="Search products in this store..."
            allowClear
            size="large"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ maxWidth: 380 }}
          />
          <Space wrap>
            <Select
              value={sortBy}
              onChange={setSortBy}
              style={{ width: 175 }}
              options={[
                { value: "featured", label: "Sort: Featured" },
                { value: "low", label: "Price: Low to High" },
                { value: "high", label: "Price: High to Low" },
              ]}
            />
            <Text type="secondary">Showing {filteredProducts.length} item(s)</Text>
          </Space>
        </div>

        {categories.length > 2 && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
            {categories.map((cat) => (
              <Button
                key={cat}
                size="small"
                type={selectedCategory === cat ? "primary" : "default"}
                style={selectedCategory === cat ? { background: "#047857", borderColor: "#047857" } : undefined}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat === "all" ? "All Categories" : cat}
              </Button>
            ))}
          </div>
        )}

        {filteredProducts.length === 0 ? (
          <Card style={{ borderRadius: 12, textAlign: "center", padding: 32 }}>
            <Empty description="No products available right now" />
          </Card>
        ) : (
          <Row gutter={[16, 16]}>
            {filteredProducts.map((p) => {
              const qty = cart[p.id] || 0;
              const isService = p.itemType === "service";
              const outOfStock = !isService && Number(p.stock) <= 0;
              const effectiveMax = isService ? 999 : Number(p.stock);
              const benchmarkMrp = Math.round(Number(p.price) * 1.25);
              const discountPercent = Math.round(((benchmarkMrp - Number(p.price)) / benchmarkMrp) * 100);

              return (
                <Col xs={24} sm={12} md={8} key={p.id}>
                  <Card
                    hoverable
                    style={{ borderRadius: 12, height: "100%", display: "flex", flexDirection: "column" }}
                    styles={{
                      body: { flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" },
                    }}
                  >
                    <div>
                      {p.imageUrl && (
                        <div
                          style={{
                            marginBottom: 12,
                            position: "relative",
                            cursor: "pointer",
                            overflow: "hidden",
                            borderRadius: 8,
                          }}
                          onClick={() => setQuickViewProduct(p)}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={p.imageUrl}
                            alt={p.name}
                            style={{
                              width: "100%",
                              height: 170,
                              objectFit: "cover",
                              borderRadius: 8,
                              border: "1px solid #f1f5f9",
                              transition: "transform 0.3s ease",
                            }}
                          />
                          <div
                            style={{
                              position: "absolute",
                              bottom: 8,
                              right: 8,
                              background: "rgba(0, 0, 0, 0.65)",
                              color: "#fff",
                              padding: "2px 8px",
                              borderRadius: 6,
                              fontSize: 11,
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                            }}
                          >
                            <EyeOutlined /> Quick View
                          </div>
                        </div>
                      )}

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                        <div>
                          <Title
                            level={5}
                            style={{ margin: 0, cursor: "pointer" }}
                            onClick={() => setQuickViewProduct(p)}
                          >
                            {p.name}
                          </Title>
                          <Space size={4} style={{ marginTop: 4 }} wrap>
                            {isService && <Tag color="geekblue" style={{ fontSize: 11 }}>Service</Tag>}
                            {p.duration && <Tag color="cyan" style={{ fontSize: 11 }}>{p.duration}</Tag>}
                            {isService && p.serviceMode && (
                              <Tag color="purple" style={{ fontSize: 11 }}>
                                {STORE_SERVICE_MODE_TEXT[p.serviceMode] || p.serviceMode}
                              </Tag>
                            )}
                            {p.category && p.category !== "General" && (
                              <Tag color="blue" style={{ fontSize: 11 }}>{p.category}</Tag>
                            )}
                            {!isService && Number(p.stock) > 0 && Number(p.stock) <= 4 && (
                              <Tag color="orange" style={{ fontSize: 11 }}>⚡ Only {p.stock} left</Tag>
                            )}
                            {Number(p.minOrderQty) > 1 && (
                              <Tag color="purple" style={{ fontSize: 11 }}>Min Qty: {p.minOrderQty}</Tag>
                            )}
                          </Space>
                        </div>
                        <Tag color={isService ? "purple" : outOfStock ? "red" : "green"}>
                          {isService ? "Available" : outOfStock ? "Out of Stock" : `${p.stock} ${p.unit} left`}
                        </Tag>
                      </div>

                      <Text
                        type="secondary"
                        style={{ display: "block", marginTop: 6, minHeight: 36, fontSize: 13, cursor: "pointer" }}
                        onClick={() => setQuickViewProduct(p)}
                      >
                        {p.description || (isService ? "Book appointment online via WhatsApp" : "Available for quick WhatsApp order")}
                      </Text>
                    </div>

                    <div
                      style={{
                        marginTop: 16,
                        paddingTop: 12,
                        borderTop: "1px solid #f1f5f9",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                          <Text delete style={{ fontSize: 12, color: "#94a3b8" }}>
                            ₹{benchmarkMrp.toLocaleString("en-IN")}
                          </Text>
                          <Text strong style={{ fontSize: 17, color: "#0f172a" }}>
                            ₹{Number(p.price).toLocaleString("en-IN")}
                          </Text>
                          <Tag
                            color="success"
                            style={{
                              fontSize: 10,
                              padding: "0 4px",
                              lineHeight: "16px",
                              fontWeight: 700,
                              margin: 0,
                            }}
                          >
                            {discountPercent}% OFF
                          </Tag>
                        </div>
                        <Text type="secondary" style={{ fontSize: 11 }}> / {p.unit}</Text>
                      </div>

                      <Space size="small">
                        <Tooltip title="Share on WhatsApp">
                          <Button
                            size="small"
                            icon={<ShareAltOutlined />}
                            onClick={() => {
                              const shareText = `Check out ${p.name} (₹${p.price}) on ${store.name}: ${typeof window !== "undefined" ? window.location.href : ""}`;
                              window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, "_blank");
                            }}
                          />
                        </Tooltip>

                        {qty === 0 ? (
                          <Button
                            type="primary"
                            disabled={outOfStock}
                            icon={<PlusOutlined />}
                            style={!outOfStock ? { background: "#047857", borderColor: "#047857" } : undefined}
                            onClick={() => updateQty(p.id, 1, effectiveMax, Number(p.minOrderQty) || 1)}
                          >
                            {isService ? "Book" : Number(p.minOrderQty) > 1 ? `Add (${p.minOrderQty})` : "Add"}
                          </Button>
                        ) : (
                          <Space>
                            <Button
                              icon={<MinusOutlined />}
                              size="small"
                              onClick={() => updateQty(p.id, -1, effectiveMax, Number(p.minOrderQty) || 1)}
                            />
                            <Text strong>{qty}</Text>
                            <Button
                              icon={<PlusOutlined />}
                              size="small"
                              disabled={qty >= effectiveMax}
                              onClick={() => updateQty(p.id, 1, effectiveMax, Number(p.minOrderQty) || 1)}
                            />
                          </Space>
                        )}
                      </Space>
                    </div>
                  </Card>
                </Col>
              );
            })}
          </Row>
        )}
      </div>

      {/* Product Quick View Modal */}
      <Modal
        open={Boolean(quickViewProduct)}
        onCancel={() => setQuickViewProduct(null)}
        footer={null}
        centered
        width={520}
        destroyOnClose
      >
        {quickViewProduct && (
          <div style={{ padding: "6px 0" }}>
            {quickViewProduct.imageUrl ? (
              <div style={{ marginBottom: 16, textAlign: "center" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={quickViewProduct.imageUrl}
                  alt={quickViewProduct.name}
                  style={{
                    width: "100%",
                    maxHeight: 250,
                    objectFit: "contain",
                    borderRadius: 12,
                    background: "#f8fafc",
                  }}
                />
              </div>
            ) : null}

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
              <div>
                <Title level={4} style={{ margin: 0 }}>{quickViewProduct.name}</Title>
                <Space size={4} style={{ marginTop: 6 }} wrap>
                  {quickViewProduct.itemType === "service" && <Tag color="geekblue">Service</Tag>}
                  {quickViewProduct.duration && <Tag color="cyan">{quickViewProduct.duration}</Tag>}
                  {quickViewProduct.category && <Tag color="blue">{quickViewProduct.category}</Tag>}
                  <Tag color="green">100% Genuine</Tag>
                </Space>
              </div>
              <Tag color={quickViewProduct.itemType === "service" ? "purple" : Number(quickViewProduct.stock) > 0 ? "green" : "red"}>
                {quickViewProduct.itemType === "service"
                  ? "Available"
                  : Number(quickViewProduct.stock) > 0
                  ? `${quickViewProduct.stock} ${quickViewProduct.unit} in stock`
                  : "Out of Stock"}
              </Tag>
            </div>

            <div style={{ margin: "14px 0", padding: "10px 14px", background: "#f8fafc", borderRadius: 10 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                <Text delete style={{ fontSize: 13, color: "#94a3b8" }}>
                  ₹{Math.round(Number(quickViewProduct.price) * 1.25).toLocaleString("en-IN")}
                </Text>
                <Text strong style={{ fontSize: 22, color: "#0f172a" }}>
                  ₹{Number(quickViewProduct.price).toLocaleString("en-IN")}
                </Text>
                <Text type="secondary" style={{ fontSize: 12 }}>/ {quickViewProduct.unit}</Text>
                <Tag color="success" style={{ fontWeight: 700, borderRadius: 6 }}>20% SAVINGS</Tag>
              </div>
            </div>

            <Text type="secondary" style={{ display: "block", fontSize: 13, lineHeight: 1.6, marginBottom: 18 }}>
              {quickViewProduct.description || "Fresh and verified quality item provided directly by the store."}
            </Text>

            <div style={{ display: "flex", gap: 10 }}>
              <Button
                type="primary"
                size="large"
                icon={<ShoppingCartOutlined />}
                style={{ flex: 1, background: "#047857", borderColor: "#047857", fontWeight: 700 }}
                disabled={quickViewProduct.itemType !== "service" && Number(quickViewProduct.stock) <= 0}
                onClick={() => {
                  updateQty(
                    quickViewProduct.id,
                    1,
                    quickViewProduct.itemType === "service" ? 999 : Number(quickViewProduct.stock),
                    Number(quickViewProduct.minOrderQty) || 1
                  );
                  setQuickViewProduct(null);
                  message.success(`Added ${quickViewProduct.name} to cart!`);
                }}
              >
                {cart[quickViewProduct.id] ? `In Cart (${cart[quickViewProduct.id]}) • Add More` : "Add to Cart"}
              </Button>

              {store?.phone && (
                <Button
                  size="large"
                  icon={<WhatsAppOutlined />}
                  style={{ color: "#25D366", borderColor: "#25D366" }}
                  href={`https://wa.me/?text=${encodeURIComponent(
                    `Check out ${quickViewProduct.name} (₹${quickViewProduct.price}) on ${store.name}: ${typeof window !== "undefined" ? window.location.href : ""}`
                  )}`}
                  target="_blank"
                >
                  Share
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Mobile-First Sticky Floating Cart Bar */}
      {cartCount > 0 && !cartOpen && (
        <div
          style={{
            position: "fixed",
            bottom: 16,
            left: 0,
            right: 0,
            zIndex: 99,
            display: "flex",
            justifyContent: "center",
            padding: "0 16px",
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              pointerEvents: "auto",
              width: "100%",
              maxWidth: 520,
              background: "#047857",
              color: "#fff",
              borderRadius: 14,
              padding: "10px 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              boxShadow: "0 10px 25px -5px rgba(4, 120, 87, 0.4), 0 8px 10px -6px rgba(4, 120, 87, 0.3)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  background: "rgba(255, 255, 255, 0.2)",
                  borderRadius: 8,
                  padding: "4px 8px",
                  fontWeight: 700,
                  fontSize: 13,
                }}
              >
                🛒 {cartCount} {cartCount === 1 ? "Item" : "Items"}
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800 }}>₹{cartTotal.toLocaleString("en-IN")}</div>
                <div style={{ fontSize: 11, opacity: 0.85 }}>
                  {fulfillmentType === "pickup" ? "Store Pickup" : "Plus delivery if applicable"}
                </div>
              </div>
            </div>

            <Button
              type="primary"
              size="middle"
              style={{
                background: "#fff",
                color: "#047857",
                borderColor: "#fff",
                fontWeight: 700,
                borderRadius: 8,
              }}
              onClick={() => {
                setOrderResult(null);
                setCartOpen(true);
              }}
            >
              View Cart →
            </Button>
          </div>
        </div>
      )}

      {/* Floating WhatsApp Chat Help Bubble */}
      {store?.phone && (
        <a
          href={`https://wa.me/${store.phone.replace(/\D/g, "")}?text=${encodeURIComponent(
            `Hi ${store.name}, I am browsing your online store (${typeof window !== "undefined" ? window.location.href : ""}) and have a question.`
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            position: "fixed",
            bottom: cartCount > 0 ? 82 : 20,
            right: 20,
            zIndex: 90,
            width: 52,
            height: 52,
            borderRadius: "50%",
            background: "#25D366",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 28,
            boxShadow: "0 4px 14px rgba(37, 211, 102, 0.45)",
            transition: "all 0.3s ease",
          }}
          title="Chat with Store Owner on WhatsApp"
        >
          <WhatsAppOutlined />
        </a>
      )}

      {/* Cart & Checkout Drawer */}
      <Drawer
        title={orderResult ? "Order Confirmed!" : `Your Cart (${cartCount} items)`}
        placement="right"
        width={440}
        open={cartOpen}
        onClose={() => setCartOpen(false)}
      >
        {orderResult ? (
          <div style={{ textAlign: "center", padding: "12px 0" }}>
            <CheckCircleOutlined style={{ fontSize: 48, color: "#25D366", marginBottom: 12 }} />
            <Title level={4}>Order #{orderResult.orderId.slice(-6).toUpperCase()} Placed!</Title>
            <Text type="secondary">
              Total Payable: <Text strong>₹{Number(orderResult.totalAmount).toLocaleString("en-IN")}</Text>
            </Text>

            {orderResult.paymentMethod === "cod" ? (
              <Alert
                type="success"
                showIcon
                style={{ marginTop: 20, textAlign: "left", borderRadius: 10 }}
                message="Cash on Delivery Confirmed"
                description="Your order is registered. Please keep exact cash or UPI ready when receiving delivery or visiting the store."
              />
            ) : orderResult.qrDataUrl ? (
              <Card size="small" style={{ marginTop: 20, borderRadius: 12, background: "#f0fdf4" }}>
                <Text strong style={{ display: "block", marginBottom: 8 }}>Scan &amp; Pay via any UPI App</Text>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={orderResult.qrDataUrl}
                  alt="UPI Payment QR"
                  style={{
                    width: 200,
                    height: 200,
                    margin: "0 auto",
                    display: "block",
                    borderRadius: 8,
                    background: "#fff",
                    padding: 6,
                  }}
                />
                {orderResult.upiUri && (
                  <Button
                    type="primary"
                    href={orderResult.upiUri}
                    style={{ marginTop: 12, background: "#16a34a", borderColor: "#16a34a" }}
                    block
                  >
                    Pay Now via UPI App
                  </Button>
                )}
              </Card>
            ) : null}

            {store.phone && (
              <Button
                icon={<WhatsAppOutlined />}
                block
                style={{ marginTop: 16 }}
                href={`https://wa.me/${store.phone.replace(/\D/g, "")}?text=${encodeURIComponent(
                  `Hi ${store.name}, I just placed Order #${orderResult.orderId.slice(-6).toUpperCase()} for ₹${orderResult.totalAmount}.`
                )}`}
                target="_blank"
              >
                Message Store on WhatsApp
              </Button>
            )}
          </div>
        ) : cartItems.length === 0 ? (
          <Empty description="Your cart is empty. Add products from the catalog." />
        ) : (
          <div>
            {/* Fulfillment Type Toggle */}
            <div style={{ marginBottom: 14 }}>
              <Text strong style={{ display: "block", marginBottom: 6, fontSize: 13 }}>
                Delivery Preference:
              </Text>
              <Segmented
                block
                value={fulfillmentType}
                onChange={(val: any) => setFulfillmentType(val)}
                options={[
                  { label: "🛵 Home Delivery", value: "delivery" },
                  { label: "🏪 Store Self-Pickup", value: "pickup" },
                ]}
              />
            </div>

            {/* Cart Items List */}
            <div style={{ maxHeight: 240, overflowY: "auto", paddingRight: 4 }}>
              {cartItems.map((item) => (
                <div
                  key={item.productId}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "8px 0",
                    borderBottom: "1px solid #f1f5f9",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{item.name}</div>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      ₹{item.price} x {item.quantity} {item.unit}
                    </Text>
                  </div>
                  <Text strong>₹{(item.price * item.quantity).toLocaleString("en-IN")}</Text>
                </div>
              ))}
            </div>

            <Divider style={{ margin: "12px 0" }} />

            {/* Coupon / Promo code */}
            {Array.isArray(store.coupons) && store.coupons.length > 0 && (
              <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                <Input
                  placeholder="Promo / Coupon Code"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                />
                {appliedCoupon ? (
                  <Button danger onClick={() => { setAppliedCoupon(null); setCouponInput(""); }}>
                    Remove
                  </Button>
                ) : (
                  <Button
                    onClick={() => {
                      const code = couponInput.trim().toUpperCase();
                      const match = store.coupons?.find((c) => c.code.toUpperCase() === code);
                      if (!match) {
                        message.error("Invalid coupon code");
                        return;
                      }
                      setAppliedCoupon(match);
                      message.success(`Coupon ${match.code} (${match.discountPercent}% off) applied!`);
                    }}
                  >
                    Apply
                  </Button>
                )}
              </div>
            )}

            {/* Price Breakdown */}
            <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <Text type="secondary">Subtotal</Text>
                <Text>₹{cartSubtotal.toLocaleString("en-IN")}</Text>
              </div>
              {discountAmount > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#16a34a" }}>
                  <span>Coupon ({appliedCoupon?.code})</span>
                  <span>-₹{discountAmount.toLocaleString("en-IN")}</span>
                </div>
              )}
              {effectiveDeliveryFee > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                  <Text type="secondary">Delivery Charge</Text>
                  <Text>+₹{effectiveDeliveryFee.toLocaleString("en-IN")}</Text>
                </div>
              )}
              {fulfillmentType === "pickup" && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#059669" }}>
                  <span>Store Pickup</span>
                  <span>FREE</span>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                <Title level={5} style={{ margin: 0 }}>Grand Total</Title>
                <Title level={4} style={{ margin: 0, color: "#16a34a" }}>₹{cartTotal.toLocaleString("en-IN")}</Title>
              </div>
            </div>

            {/* Checkout Form */}
            <Form form={form} layout="vertical" onFinish={handleCheckout}>
              <Form.Item
                name="customerName"
                label="Your Full Name"
                rules={[{ required: true, message: "Please enter your name" }]}
                style={{ marginBottom: 12 }}
              >
                <Input placeholder="e.g. Amit Verma" />
              </Form.Item>

              <Form.Item
                name="customerPhone"
                label="WhatsApp Mobile Number"
                rules={[{ required: true, message: "Please enter your WhatsApp mobile number" }]}
                style={{ marginBottom: 12 }}
              >
                <Input placeholder="e.g. 9876543210" />
              </Form.Item>

              {hasServiceInCart && (
                <div style={{ padding: 12, background: "#f0fdf4", borderRadius: 8, marginBottom: 14, border: "1px solid #bbf7d0" }}>
                  <Text strong style={{ display: "block", marginBottom: 8, color: "#15803d" }}>
                    Schedule Your Appointment / Service Slot
                  </Text>
                  <Form.Item
                    name="bookingDate"
                    label="Preferred Date"
                    rules={[{ required: true, message: "Please select appointment date" }]}
                    style={{ marginBottom: 10 }}
                  >
                    <Input
                      type="date"
                      min={new Date().toISOString().slice(0, 10)}
                      onChange={(e) => setSelectedBookingDate(e.target.value)}
                    />
                  </Form.Item>
                  <Form.Item
                    name="timeSlot"
                    label="Available Time Slot"
                    rules={[{ required: true, message: "Please select a time slot" }]}
                    style={{ marginBottom: 10 }}
                  >
                    <Select
                      placeholder="Choose slot"
                      options={STORE_TIME_SLOTS.map((s) => ({
                        value: s,
                        label: bookedSlots.includes(s) ? `${s} (Already Booked)` : s,
                        disabled: bookedSlots.includes(s),
                      }))}
                    />
                  </Form.Item>
                  <Form.Item name="serviceMode" label="Service Preference" initialValue="home_visit" style={{ marginBottom: 0 }}>
                    <Select
                      options={[
                        { value: "home_visit", label: "Home / On-Site Visit" },
                        { value: "at_store", label: "Visit Store / Clinic" },
                        { value: "online", label: "Online / Video Call" },
                      ]}
                    />
                  </Form.Item>
                </div>
              )}

              {fulfillmentType === "delivery" ? (
                <Form.Item
                  name="deliveryAddress"
                  label={hasServiceInCart ? "Service / Visit Address & Pincode" : "Delivery Address & Pincode"}
                  rules={[{ required: true, message: "Please enter your delivery address" }]}
                  style={{ marginBottom: 12 }}
                >
                  <Input.TextArea rows={2} placeholder="House/Flat No, Landmark, Area, City, Pincode..." />
                </Form.Item>
              ) : (
                <Alert
                  type="info"
                  showIcon
                  style={{ marginBottom: 12, borderRadius: 8 }}
                  message="Self Pickup at Store"
                  description={store.address ? `Pickup Address: ${store.address}` : "You can collect your items directly from the merchant."}
                />
              )}

              {/* Payment Method Switcher */}
              <div style={{ marginBottom: 14 }}>
                <Text strong style={{ display: "block", marginBottom: 6, fontSize: 13 }}>
                  Payment Method:
                </Text>
                <Segmented
                  block
                  value={paymentMethod}
                  onChange={(val: any) => setPaymentMethod(val)}
                  options={[
                    { label: "💳 Pay via UPI", value: "upi" },
                    { label: "💵 Cash on Delivery", value: "cod" },
                    { label: "📲 WhatsApp Chat", value: "whatsapp" },
                  ]}
                />
              </div>

              <Form.Item name="notes" label="Special Instructions (Optional)" style={{ marginBottom: 16 }}>
                <Input placeholder="Preferred timing or specific note..." />
              </Form.Item>

              <Button
                type="primary"
                htmlType="submit"
                size="large"
                block
                disabled={store.isOpen === false}
                loading={submitting}
                style={{ background: "#047857", borderColor: "#047857", fontWeight: 700 }}
              >
                {hasServiceInCart
                  ? `Confirm Booking (₹${cartTotal.toLocaleString("en-IN")})`
                  : paymentMethod === "whatsapp"
                  ? `Order on WhatsApp (₹${cartTotal.toLocaleString("en-IN")}) 📲`
                  : `Place Order (₹${cartTotal.toLocaleString("en-IN")})`}
              </Button>
            </Form>

            {/* Trust Footer */}
            <div
              style={{
                marginTop: 14,
                padding: "8px 12px",
                background: "#f8fafc",
                borderRadius: 8,
                border: "1px solid #e2e8f0",
                fontSize: 11,
                color: "#64748b",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <SafetyCertificateFilled style={{ color: "#059669", fontSize: 16 }} />
              <span>
                <strong>100% Safe Checkout:</strong> Direct to store with zero convenience fee.
              </span>
            </div>
          </div>
        )}
      </Drawer>

      {/* Public Order Tracker Modal */}
      <Modal
        title="Track Your Order Status"
        open={trackOpen}
        onCancel={() => setTrackOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Space direction="vertical" style={{ width: "100%" }} size={12}>
          <Input
            placeholder="Your WhatsApp Mobile Number (e.g. 9876543210)"
            value={trackPhone}
            onChange={(e) => setTrackPhone(e.target.value)}
            onPressEnter={handleTrackOrder}
          />
          <Input
            placeholder="Optional Order ID (e.g. #A1B2C3)"
            value={trackOrderId}
            onChange={(e) => setTrackOrderId(e.target.value)}
            onPressEnter={handleTrackOrder}
          />
          <Button
            type="primary"
            block
            loading={trackingLoading}
            onClick={handleTrackOrder}
            style={{ background: "#047857", borderColor: "#047857", fontWeight: 600 }}
          >
            Check Live Order Status
          </Button>

          {trackedOrders !== null && (
            trackedOrders.length === 0 ? (
              <Empty description="No matching orders found for this phone number" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 340, overflowY: "auto" }}>
                {trackedOrders.map((ord) => (
                  <Card key={ord.id} size="small" style={{ borderRadius: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <Text strong>Order #{ord.id.slice(-6).toUpperCase()}</Text>
                      <Tag color={ord.status === "delivered" ? "green" : ord.status === "cancelled" ? "red" : "blue"}>
                        {String(ord.status || "pending").toUpperCase()}
                      </Tag>
                    </div>
                    <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
                      {new Date(ord.createdAt).toLocaleString()} • Total: <strong>₹{Number(ord.totalAmount || 0).toLocaleString("en-IN")}</strong> • Payment:{" "}
                      <Tag color={ord.paymentStatus === "paid" ? "green" : "orange"} style={{ marginLeft: 4 }}>
                        {String(ord.paymentStatus || "unpaid").toUpperCase()}
                      </Tag>
                    </div>
                  </Card>
                ))}
              </div>
            )
          )}
        </Space>
      </Modal>
    </div>
  );
}