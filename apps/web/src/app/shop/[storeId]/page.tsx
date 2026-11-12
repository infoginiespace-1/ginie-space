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
  name: string;
  phone?: string;
  address?: string;
  businessType?: string;
  upiId?: string;
}

interface StoreProduct {
  id: string;
  name: string;
  description?: string;
  price: number;
  unit: string;
  stock: number;
}

export default function PublicStorefrontPage() {
  const params = useParams();
  const storeId = String(params?.storeId || "");

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [store, setStore] = useState<StoreInfo | null>(null);
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [cart, setCart] = useState<Record<string, number>>({});
  const [cartOpen, setCartOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
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

  const updateQty = (productId: string, delta: number, maxStock: number) => {
    setCart((prev) => {
      const current = prev[productId] || 0;
      const next = Math.max(0, maxStock > 0 ? Math.min(maxStock, current + delta) : current + delta);
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
    }));

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const filteredProducts = products.filter((p) => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return true;
    return (
      p.name.toLowerCase().includes(q) ||
      (p.description || "").toLowerCase().includes(q)
    );
  });

  const handleCheckout = async (values: any) => {
    if (cartItems.length === 0) return;
    setSubmitting(true);
    try {
      const res = await api.post(`/api/storefront/${storeId}/orders`, {
        customerName: values.customerName,
        customerPhone: values.customerPhone,
        items: cartItems,
        notes: values.notes,
      });

      setOrderResult({
        orderId: res.data.order.id,
        totalAmount: res.data.order.totalAmount,
        upiUri: res.data.upiUri,
        qrDataUrl: res.data.qrDataUrl,
      });
      setCart({});
      form.resetFields();
      message.success("Order placed! Confirmation sent.");
    } catch (err: any) {
      message.error(err.message || "Could not place order");
    } finally {
      setSubmitting(false);
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
            <div>
              <Space size="small">
                <Title level={4} style={{ margin: 0 }}>{store.name}</Title>
                <Tag color="green">{store.businessType === "wholesale" ? "Wholesale" : "Retail"}</Tag>
              </Space>
              <div style={{ fontSize: 12, color: "#64748b" }}>
                {store.phone && <span style={{ marginRight: 12 }}><PhoneOutlined /> {store.phone}</span>}
                {store.address && <span><EnvironmentOutlined /> {store.address}</span>}
              </div>
            </div>
          </Space>

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
        </div>
      </div>

      {/* Product Catalog */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 20px" }}>
        <div style={{ marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <Input
            prefix={<SearchOutlined style={{ color: "#94a3b8" }} />}
            placeholder="Search products in this store..."
            allowClear
            size="large"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ maxWidth: 380 }}
          />
          <Text type="secondary">Showing {filteredProducts.length} item(s)</Text>
        </div>

        {filteredProducts.length === 0 ? (
          <Card style={{ borderRadius: 12, textAlign: "center", padding: 32 }}>
            <Empty description="No products available right now" />
          </Card>
        ) : (
          <Row gutter={[16, 16]}>
            {filteredProducts.map((p) => {
              const qty = cart[p.id] || 0;
              const outOfStock = Number(p.stock) <= 0;
              return (
                <Col xs={24} sm={12} md={8} key={p.id}>
                  <Card
                    style={{ borderRadius: 12, height: "100%", display: "flex", flexDirection: "column" }}
                    styles={{ body: { flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" } }}
                  >
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                        <Title level={5} style={{ margin: 0 }}>{p.name}</Title>
                        <Tag color={outOfStock ? "red" : "green"}>
                          {outOfStock ? "Out of Stock" : `${p.stock} ${p.unit} left`}
                        </Tag>
                      </div>
                      <Text type="secondary" style={{ display: "block", marginTop: 6, minHeight: 36, fontSize: 13 }}>
                        {p.description || "Available for quick WhatsApp order"}
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
                          onClick={() => updateQty(p.id, 1, Number(p.stock))}
                        >
                          Add
                        </Button>
                      ) : (
                        <Space>
                          <Button icon={<MinusOutlined />} size="small" onClick={() => updateQty(p.id, -1, Number(p.stock))} />
                          <Text strong>{qty}</Text>
                          <Button
                            icon={<PlusOutlined />}
                            size="small"
                            disabled={qty >= Number(p.stock)}
                            onClick={() => updateQty(p.id, 1, Number(p.stock))}
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
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
              <Title level={5} style={{ margin: 0 }}>Grand Total</Title>
              <Title level={4} style={{ margin: 0, color: "#16a34a" }}>₹{cartTotal.toLocaleString("en-IN")}</Title>
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

              <Form.Item name="notes" label="Delivery Address / Note">
                <Input.TextArea rows={2} placeholder="House/Shop no, landmark, preferred delivery time..." />
              </Form.Item>

              <Button
                type="primary"
                htmlType="submit"
                size="large"
                block
                loading={submitting}
                style={{ background: "#25D366", borderColor: "#25D366", fontWeight: 600 }}
              >
                Place Order (₹{cartTotal.toLocaleString("en-IN")})
              </Button>
            </Form>
          </div>
        )}
      </Drawer>
    </div>
  );
}
