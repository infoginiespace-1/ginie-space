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
  const [orderResult, setOrderResult] = useState<{
    orderId: string;
    totalAmount: number;
    upiUri?: string;
    qrDataUrl?: string;
  } | null>(null);
  const [form] = Form.useForm();

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
  const deliveryFee = cartItems.length > 0 ? Number(store?.deliveryFee) || 0 : 0;
  const cartTotal = Math.max(0, cartSubtotal - discountAmount + deliveryFee);

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
    try {
      const res = await api.post(`/api/storefront/${storeId}/orders`, {
        customerName: values.customerName,
        customerPhone: values.customerPhone,
        deliveryAddress: values.deliveryAddress,
        bookingDate: values.bookingDate,
        timeSlot: values.timeSlot,
        serviceMode: values.serviceMode,
        items: cartItems,
        notes: values.notes,
        couponCode: appliedCoupon?.code,
      });

      setOrderResult({
        orderId: res.data.order.id,
        totalAmount: res.data.order.totalAmount,
        upiUri: res.data.upiUri,
        qrDataUrl: res.data.qrDataUrl,
      });
      setCart({});
      setAppliedCoupon(null);
      setCouponInput("");
      form.resetFields();
      message.success("Order placed! Confirmation sent.");
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
    <div style={{ minHeight: "100vh", background: "#f8fafc", paddingBottom: 80 }}>
      {/* Store Header */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", position: "sticky", top: 0, zIndex: 50 }}>
        <div
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            padding: "14px 20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <Space>
            {store.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={store.logoUrl}
                alt={store.name}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  objectFit: "cover",
                  border: "1px solid #e2e8f0",
                }}
              />
            ) : (
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 10,
                  background: "#25D366",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 20,
                }}
              >
                <ShopOutlined />
              </div>
            )}
            <div>
              <Space size="small">
                <Title level={4} style={{ margin: 0 }}>{store.name}</Title>
                <Tag color="green">{store.businessType === "wholesale" ? "Wholesale" : "Retail"}</Tag>
                {store.isOpen === false && <Tag color="red">CLOSED</Tag>}
              </Space>
              <div style={{ fontSize: 12, color: "#64748b" }}>
                {store.phone && <span style={{ marginRight: 12 }}><PhoneOutlined /> {store.phone}</span>}
                {store.address && <span><EnvironmentOutlined /> {store.address}</span>}
              </div>
            </div>
          </Space>

          <Space>
            <Button
              size="large"
              icon={<SearchOutlined />}
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
                style={{ background: "#25D366", borderColor: "#25D366", fontWeight: 600 }}
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
        <div style={{ marginBottom: 14, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
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
                style={selectedCategory === cat ? { background: "#25D366", borderColor: "#25D366" } : undefined}
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
              return (
                <Col xs={24} sm={12} md={8} key={p.id}>
                  <Card
                    style={{ borderRadius: 12, height: "100%", display: "flex", flexDirection: "column" }}
                    styles={{ body: { flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" } }}
                  >
                    <div>
                      {p.imageUrl && (
                        <div style={{ marginBottom: 12 }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={p.imageUrl}
                            alt={p.name}
                            style={{
                              width: "100%",
                              height: 160,
                              objectFit: "cover",
                              borderRadius: 8,
                              border: "1px solid #f1f5f9",
                            }}
                          />
                        </div>
                      )}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                        <div>
                          <Title level={5} style={{ margin: 0 }}>{p.name}</Title>
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
                            {Number(p.minOrderQty) > 1 && (
                              <Tag color="purple" style={{ fontSize: 11 }}>Min Qty: {p.minOrderQty}</Tag>
                            )}
                          </Space>
                        </div>
                        <Tag color={isService ? "purple" : outOfStock ? "red" : "green"}>
                          {isService ? "Available" : outOfStock ? "Out of Stock" : `${p.stock} ${p.unit} left`}
                        </Tag>
                      </div>
                      <Text type="secondary" style={{ display: "block", marginTop: 6, minHeight: 36, fontSize: 13 }}>
                        {p.description || (isService ? "Book appointment online via WhatsApp" : "Available for quick WhatsApp order")}
                      </Text>
                    </div>

                    <div style={{ marginTop: 16, paddingTop: 12, borderTop: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <Text strong style={{ fontSize: 18, color: "#0f172a" }}>₹{Number(p.price).toLocaleString("en-IN")}</Text>
                        <Text type="secondary" style={{ fontSize: 12 }}> / {p.unit}</Text>
                      </div>

                      {qty === 0 ? (
                        <Button
                          type="primary"
                          disabled={outOfStock}
                          icon={<PlusOutlined />}
                          style={!outOfStock ? { background: "#25D366", borderColor: "#25D366" } : undefined}
                          onClick={() => updateQty(p.id, 1, effectiveMax, Number(p.minOrderQty) || 1)}
                        >
                          {isService ? "Book" : Number(p.minOrderQty) > 1 ? `Add (${p.minOrderQty})` : "Add"}
                        </Button>
                      ) : (
                        <Space>
                          <Button icon={<MinusOutlined />} size="small" onClick={() => updateQty(p.id, -1, effectiveMax, Number(p.minOrderQty) || 1)} />
                          <Text strong>{qty}</Text>
                          <Button
                            icon={<PlusOutlined />}
                            size="small"
                            disabled={qty >= effectiveMax}
                            onClick={() => updateQty(p.id, 1, effectiveMax, Number(p.minOrderQty) || 1)}
                          />
                        </Space>
                      )}
                    </div>
                  </Card>
                </Col>
              );
            })}
          </Row>
        )}
      </div>

      {/* Cart & Checkout Drawer */}
      <Drawer
        title={orderResult ? "Order Confirmed!" : `Your Cart (${cartCount} items)`}
        placement="right"
        width={420}
        open={cartOpen}
        onClose={() => setCartOpen(false)}
      >
        {orderResult ? (
          <div style={{ textAlign: "center", padding: "12px 0" }}>
            <CheckCircleOutlined style={{ fontSize: 48, color: "#25D366", marginBottom: 12 }} />
            <Title level={4}>Order #{orderResult.orderId.slice(-6)} Placed!</Title>
            <Text type="secondary">
              Total Payable: <Text strong>₹{Number(orderResult.totalAmount).toLocaleString("en-IN")}</Text>
            </Text>

            {orderResult.qrDataUrl && (
              <Card size="small" style={{ marginTop: 20, borderRadius: 12, background: "#f0fdf4" }}>
                <Text strong style={{ display: "block", marginBottom: 8 }}>Scan &amp; Pay via any UPI App</Text>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={orderResult.qrDataUrl}
                  alt="UPI Payment QR"
                  style={{ width: 200, height: 200, margin: "0 auto", display: "block", borderRadius: 8, background: "#fff", padding: 6 }}
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
            )}

            {store.phone && (
              <Button
                icon={<WhatsAppOutlined />}
                block
                style={{ marginTop: 16 }}
                href={`https://wa.me/${store.phone.replace(/\D/g, "")}?text=${encodeURIComponent(
                  `Hi ${store.name}, I just placed Order #${orderResult.orderId.slice(-6)} for ₹${orderResult.totalAmount}.`
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
            {cartItems.map((item) => (
              <div
                key={item.productId}
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #f1f5f9" }}
              >
                <div>
                  <div style={{ fontWeight: 600 }}>{item.name}</div>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    ₹{item.price} x {item.quantity} {item.unit}
                  </Text>
                </div>
                <Text strong>₹{(item.price * item.quantity).toLocaleString("en-IN")}</Text>
              </div>
            ))}

            <Divider />
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
              {deliveryFee > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                  <Text type="secondary">Delivery Charge</Text>
                  <Text>+₹{deliveryFee.toLocaleString("en-IN")}</Text>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                <Title level={5} style={{ margin: 0 }}>Grand Total</Title>
                <Title level={4} style={{ margin: 0, color: "#16a34a" }}>₹{cartTotal.toLocaleString("en-IN")}</Title>
              </div>
            </div>

            <Form form={form} layout="vertical" onFinish={handleCheckout}>
              <Form.Item
                name="customerName"
                label="Your Full Name"
                rules={[{ required: true, message: "Please enter your name" }]}
              >
                <Input placeholder="e.g. Amit Verma" />
              </Form.Item>

              <Form.Item
                name="customerPhone"
                label="WhatsApp Number"
                rules={[{ required: true, message: "Please enter your WhatsApp number" }]}
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

              <Form.Item name="deliveryAddress" label={hasServiceInCart ? "Service / Visit Address & Pincode" : "Delivery Address & Pincode"}>
                <Input.TextArea rows={2} placeholder="House/Shop No, Street, Area, City, Pincode..." />
              </Form.Item>

              <Form.Item name="notes" label="Special Instructions (Optional)">
                <Input placeholder="Preferred timing or special note..." />
              </Form.Item>

              <Button
                type="primary"
                htmlType="submit"
                size="large"
                block
                disabled={store.isOpen === false}
                loading={submitting}
                style={{ background: "#25D366", borderColor: "#25D366", fontWeight: 600 }}
              >
                {hasServiceInCart ? `Confirm Booking (₹${cartTotal.toLocaleString("en-IN")})` : `Place Order (₹${cartTotal.toLocaleString("en-IN")})`}
              </Button>
            </Form>
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
            style={{ background: "#25D366", borderColor: "#25D366", fontWeight: 600 }}
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
