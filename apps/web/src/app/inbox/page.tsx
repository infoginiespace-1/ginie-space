"use client";

import React, { useState, useEffect, useRef } from "react";
import { AppLayout } from "../../components/AppLayout";
import {
  Card,
  Input,
  InputNumber,
  Button,
  List,
  Avatar,
  Typography,
  Badge,
  Space,
  Empty,
  message,
  Modal,
  Tag,
  Form,
  Grid,
  Select,
} from "antd";
import {
  SendOutlined,
  UserOutlined,
  WhatsAppOutlined,
  AppstoreOutlined,
  SearchOutlined,
  ShoppingCartOutlined,
  ArrowLeftOutlined,
  PlusOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { getSocket } from "../../lib/socket";
import { api } from "../../lib/api";

const { Text, Title } = Typography;

interface ChatMessage {
  id: string;
  senderPhone: string;
  senderName?: string;
  text: string;
  timestamp: string;
  fromMe: boolean;
}

interface Conversation {
  key: string;
  phone: string;
  name: string;
  lastMessage: string;
  timestamp: string;
  messages: ChatMessage[];
}

interface ProductItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  unit: string;
  stock: number;
  imageUrl?: string;
}

function normalizePhoneKey(raw: string): string {
  let digits = (raw || "").replace(/[^0-9]/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("0") && digits.length === 11) digits = digits.slice(1);
  if (digits.length === 10) digits = `91${digits}`;
  return digits;
}

export default function InboxPage() {
  const screens = Grid.useBreakpoint();
  const isMobile = screens.md === false;
  const [conversations, setConversations] = useState<Map<string, Conversation>>(new Map());
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const activeKeyRef = useRef<string | null>(null);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  const [catalogModalVisible, setCatalogModalVisible] = useState(false);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [orderForm] = Form.useForm();
  const [orderItems, setOrderItems] = useState<Array<{ productId: string; name: string; price: number; quantity: number; unit?: string }>>([]);
  const [pickerProductId, setPickerProductId] = useState<string | undefined>(undefined);
  const [pickerQty, setPickerQty] = useState<number>(1);
  const [upiId, setUpiId] = useState("");
  const [storeName, setStoreName] = useState("Our Store");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    activeKeyRef.current = activeKey;
    if (activeKey) {
      setUnreadCounts((prev) => {
        if (!prev[activeKey]) return prev;
        const copy = { ...prev };
        delete copy[activeKey];
        return copy;
      });
    }
  }, [activeKey]);

  useEffect(() => {
    Promise.all([
      api.get("/api/customers").catch(() => ({ data: { customers: [] } })),
      api.get("/api/whatsapp/messages").catch(() => ({ data: { messages: [] } })),
      api.get("/api/settings").catch(() => ({ data: { business: null } })),
    ]).then(([custRes, msgRes, setRes]) => {
      const biz = setRes.data?.business;
      if (biz) {
        if (biz.name) setStoreName(biz.name);
        if (biz.settingsJson) {
          try {
            const parsed = JSON.parse(biz.settingsJson);
            if (parsed.upiId) setUpiId(parsed.upiId);
          } catch {}
        }
      }
      const custs = custRes.data.customers || [];
      const savedMsgs = msgRes.data.messages || [];
      const map = new Map<string, Conversation>();

      for (const c of custs) {
        if (c.phone) {
          const key = normalizePhoneKey(c.phone);
          if (!key) continue;
          map.set(key, {
            key,
            phone: c.phone,
            name: c.name,
            lastMessage: "No recent messages",
            timestamp: c.createdAt || new Date().toISOString(),
            messages: [],
          });
        }
      }

      for (const m of savedMsgs) {
        const key = normalizePhoneKey(m.contactPhone || "");
        if (!key) continue;
        const conv: Conversation = map.get(key) || {
          key,
          phone: `+${key}`,
          name: m.contactName || `+${key}`,
          lastMessage: m.text,
          timestamp: m.timestamp,
          messages: [],
        };

        const chatMsg: ChatMessage = {
          id: m.messageId || m.id,
          senderPhone: key,
          senderName: m.contactName,
          text: m.text,
          timestamp: m.timestamp,
          fromMe: m.fromMe === "true" || m.fromMe === true,
        };

        conv.messages.push(chatMsg);
        conv.lastMessage = m.text;
        conv.timestamp = m.timestamp;
        map.set(key, conv);
      }

      setConversations(new Map(map));
      const keys = Array.from(map.keys());
      const phoneParam =
        typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("phone") : null;
      const requestedKey = phoneParam ? normalizePhoneKey(phoneParam) : "";
      if (requestedKey && map.has(requestedKey)) {
        setActiveKey(requestedKey);
      } else if (!isMobile && keys.length > 0 && !activeKey) {
        setActiveKey(keys[0]);
      }
    });

    const socket = getSocket();
    if (socket) {
      const handleIncoming = (event: any) => {
        const key = normalizePhoneKey(event.contactPhone || event.senderJid || "");
        if (!key) return;

        const msgId = event.messageId || Date.now().toString();
        const newMsg: ChatMessage = {
          id: msgId,
          senderPhone: key,
          senderName: event.senderName,
          text: event.messageText,
          timestamp: event.timestamp,
          fromMe: Boolean(event.fromMe),
        };

        setConversations((prev) => {
          const next = new Map(prev);
          const existing = next.get(key) || {
            key,
            phone: `+${key}`,
            name: event.senderName || `+${key}`,
            lastMessage: event.messageText,
            timestamp: event.timestamp,
            messages: [],
          };

          if (existing.messages.some((m) => m.id === msgId)) {
            return prev;
          }

          const updatedConv: Conversation = {
            ...existing,
            lastMessage: event.messageText,
            timestamp: event.timestamp,
            messages: [...existing.messages, newMsg],
          };
          next.set(key, updatedConv);
          return next;
        });

        if (!event.fromMe && activeKeyRef.current !== key) {
          setUnreadCounts((prev) => ({
            ...prev,
            [key]: (prev[key] || 0) + 1,
          }));
        }
      };

      socket.on("whatsapp:message", handleIncoming);
      return () => {
        socket.off("whatsapp:message", handleIncoming);
      };
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversations, activeKey]);

  const sendTextMessage = async (textToSend: string) => {
    if (!activeKey || !textToSend.trim()) return;
    const conv = conversations.get(activeKey);
    const targetPhone = conv?.phone || activeKey;

    setSending(true);
    try {
      const res = await api.post("/api/whatsapp/send", {
        recipientPhone: targetPhone,
        messageText: textToSend.trim(),
        contactName: conv?.name,
      });

      const savedId = res.data?.saved?.messageId || Date.now().toString();
      const now = res.data?.saved?.timestamp || new Date().toISOString();

      const outbound: ChatMessage = {
        id: savedId,
        senderPhone: activeKey,
        text: textToSend.trim(),
        timestamp: now,
        fromMe: true,
      };

      setConversations((prev) => {
        const next = new Map(prev);
        const existing = next.get(activeKey);
        if (existing) {
          next.set(activeKey, {
            ...existing,
            lastMessage: textToSend.trim(),
            timestamp: now,
            messages: [...existing.messages, outbound],
          });
        }
        return next;
      });
    } catch (err: any) {
      message.error(err.response?.data?.error || err.message || "Failed to send message. Please ensure WhatsApp is linked.");
    } finally {
      setSending(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;
    const txt = inputText.trim();
    setInputText("");
    await sendTextMessage(txt);
  };

  const handleOpenCatalog = async () => {
    setCatalogModalVisible(true);
    setLoadingProducts(true);
    try {
      const res = await api.get("/api/products");
      setProducts(res.data.products || []);
    } catch {
      message.error("Could not load catalog items");
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleSendProductQuote = async (p: ProductItem) => {
    const activeConv = activeKey ? conversations.get(activeKey) : null;
    const greeting = activeConv ? `Namaste ${activeConv.name},\n\n` : "";
    const msg = `${greeting}📦 *${p.name}*\n💰 *Price:* ₹${p.price} / ${p.unit}\n📊 *Status:* ${p.stock > 0 ? `In Stock (${p.stock} ${p.unit})` : "Limited Stock"}${p.description ? `\n📝 ${p.description}` : ""}\n\nOrder karne ke liye reply karein!`;
    setCatalogModalVisible(false);
    await sendTextMessage(msg);
  };

  const activeConv = activeKey ? conversations.get(activeKey) : null;
  const conversationList = Array.from(conversations.values())
    .filter((c) => {
      const q = searchTerm.trim().toLowerCase();
      if (!q) return true;
      return c.name.toLowerCase().includes(q) || c.phone.toLowerCase().includes(q);
    })
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const quickReplies = [
    {
      label: "Price List",
      text: `Namaste! Aapka ${storeName} mein swagat hai. Batayein aapko kis item ka wholesale/retail rate chahiye?`,
    },
    {
      label: "UPI Pay Info",
      text: upiId
        ? `💳 *Payment Details (${storeName}):*\nAap hamare UPI ID *${upiId}* par payment karke screenshot share kar sakte hain.`
        : `Payment details ke liye kripya batayein, hum abhi UPI/Bank detail share kar rahe hain.`,
    },
    {
      label: "Order Shipped",
      text: `🚚 Aapka order dispatch ho gaya hai! Delivery milne par zaroor batayein. Dhanyavaad!`,
    },
    {
      label: "Thanks",
      text: `Thank you for connecting with *${storeName}*! Kisi bhi aur order ya help ke liye yahan message karein. 🙏`,
    },
  ];

  const handleOpenOrderModal = async () => {
    setOrderItems([]);
    setPickerProductId(undefined);
    setPickerQty(1);
    orderForm.resetFields();
    orderForm.setFieldsValue({ paymentStatus: "unpaid" });
    setOrderModalOpen(true);
    if (products.length === 0) {
      try {
        const res = await api.get("/api/products");
        setProducts(res.data.products || []);
      } catch {}
    }
  };

  const handleAddQuickOrderItem = () => {
    if (!pickerProductId) return;
    const prod = products.find((p) => p.id === pickerProductId);
    if (!prod) return;
    const qty = Math.max(1, Number(pickerQty) || 1);
    setOrderItems((prev) => {
      const existing = prev.find((i) => i.productId === prod.id);
      const next = existing
        ? prev.map((i) => (i.productId === prod.id ? { ...i, quantity: i.quantity + qty } : i))
        : [...prev, { productId: prod.id, name: prod.name, price: Number(prod.price) || 0, quantity: qty, unit: prod.unit }];
      const sum = next.reduce((acc, item) => acc + item.price * item.quantity, 0);
      orderForm.setFieldsValue({ totalAmount: sum });
      return next;
    });
    setPickerProductId(undefined);
    setPickerQty(1);
  };

  const handleRemoveQuickOrderItem = (productId: string) => {
    setOrderItems((prev) => {
      const next = prev.filter((i) => i.productId !== productId);
      const sum = next.reduce((acc, item) => acc + item.price * item.quantity, 0);
      if (next.length > 0) {
        orderForm.setFieldsValue({ totalAmount: sum });
      }
      return next;
    });
  };

  const handleCreateQuickOrder = async (values: any) => {
    if (!activeConv) return;
    setCreatingOrder(true);
    try {
      const total = Number(values.totalAmount) || 0;
      const paymentStatus = values.paymentStatus || "unpaid";
      await api.post("/api/orders", {
        customerName: activeConv.name,
        customerPhone: activeConv.phone,
        items: orderItems.length > 0 ? orderItems : undefined,
        totalAmount: total,
        notes: values.notes,
        paymentStatus,
        paidAmount: paymentStatus === "paid" ? total : 0,
      });
      message.success(`Order created for ${activeConv.name}!`);
      setOrderModalOpen(false);
      setOrderItems([]);
      orderForm.resetFields();
    } catch (err: any) {
      message.error(err.message || "Could not create order");
    } finally {
      setCreatingOrder(false);
    }
  };

  return (
    <AppLayout>
      <div style={{ display: "flex", gap: 16, height: isMobile ? "calc(100vh - 96px)" : "calc(100vh - 120px)" }}>
        {/* Conversations List */}
        {(!isMobile || !activeKey) && (
        <Card
          style={{ width: isMobile ? "100%" : 340, height: "100%", overflowY: "auto", borderRadius: 12 }}
          styles={{ body: { padding: 0 } }}
        >
          <div style={{ padding: "14px 16px", borderBottom: "1px solid #f0f0f0" }}>
            <Title level={5} style={{ margin: 0 }}>Conversations</Title>
            <Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 10 }}>
              Real-time WhatsApp messages (Cloud Synced)
            </Text>
            <Input
              prefix={<SearchOutlined style={{ color: "#94a3b8" }} />}
              placeholder="Search name or phone..."
              allowClear
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {conversationList.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center" }}>
              <Empty description="No chats match your filter" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            </div>
          ) : (
            <List
              itemLayout="horizontal"
              dataSource={conversationList}
              renderItem={(item) => (
                <List.Item
                  onClick={() => setActiveKey(item.key)}
                  style={{
                    padding: "12px 16px",
                    cursor: "pointer",
                    background: activeKey === item.key ? "#f0fdf4" : "transparent",
                    borderLeft: activeKey === item.key ? "3px solid #25D366" : "3px solid transparent",
                    transition: "all 0.2s",
                  }}
                >
                  <List.Item.Meta
                    avatar={
                      <Badge count={unreadCounts[item.key] || 0} size="small">
                        <Avatar
                          style={{ background: "#25D366" }}
                          icon={<WhatsAppOutlined />}
                        />
                      </Badge>
                    }
                    title={<Text strong>{item.name}</Text>}
                    description={
                      <Text
                        type="secondary"
                        ellipsis
                        style={{ fontSize: 12, maxWidth: 180, display: "inline-block" }}
                      >
                        {item.lastMessage}
                      </Text>
                    }
                  />
                </List.Item>
              )}
            />
          )}
        </Card>
        )}

        {/* Active Conversation Chat Window */}
        {(!isMobile || Boolean(activeKey)) && (
        <Card
          style={{ flex: 1, height: "100%", display: "flex", flexDirection: "column", borderRadius: 12 }}
          styles={{ body: { flex: 1, display: "flex", flexDirection: "column", padding: 0, height: "100%" } }}
        >
          {activeConv ? (
            <>
              {/* Chat Header */}
              <div
                style={{
                  padding: "14px 18px",
                  borderBottom: "1px solid #f0f0f0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 8,
                  flexWrap: "wrap",
                }}
              >
                <Space>
                  {isMobile && (
                    <Button icon={<ArrowLeftOutlined />} size="small" onClick={() => setActiveKey(null)} />
                  )}
                  <Avatar style={{ background: "#25D366" }} icon={<UserOutlined />} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 15 }}>{activeConv.name}</div>
                    <Text type="secondary" style={{ fontSize: 12 }}>+{activeConv.phone.replace(/^\+/, "")}</Text>
                  </div>
                </Space>
                <Space>
                  <Button
                    size="small"
                    icon={<ShoppingCartOutlined />}
                    onClick={handleOpenOrderModal}
                  >
                    Create Order
                  </Button>
                  <Badge status="processing" text="Live" />
                </Space>
              </div>

              {/* Chat Messages */}
              <div style={{ flex: 1, overflowY: "auto", padding: 24, background: "#f8fafc" }}>
                {activeConv.messages.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "60px 0" }}>
                    <Text type="secondary">Send a message or catalog item to start conversation</Text>
                  </div>
                ) : (
                  activeConv.messages.map((m, idx) => (
                    <div
                      key={m.id || idx}
                      style={{
                        display: "flex",
                        justifyContent: m.fromMe ? "flex-end" : "flex-start",
                        marginBottom: 12,
                      }}
                    >
                      <div
                        style={{
                          maxWidth: "65%",
                          padding: "10px 14px",
                          borderRadius: 12,
                          background: m.fromMe ? "#dcf8c6" : "#ffffff",
                          color: "#1f2937",
                          boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
                          whiteSpace: "pre-wrap",
                        }}
                      >
                        <div>{m.text}</div>
                        <div
                          style={{
                            fontSize: 10,
                            color: "#9ca3af",
                            textAlign: "right",
                            marginTop: 4,
                          }}
                        >
                          {new Date(m.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input + Quick Replies */}
              <div style={{ padding: 14, borderTop: "1px solid #f0f0f0", background: "#fff" }}>
                <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
                  {quickReplies.map((qr) => (
                    <Button
                      key={qr.label}
                      size="small"
                      onClick={() => setInputText(qr.text)}
                      style={{ borderRadius: 999, fontSize: 12 }}
                    >
                      ⚡ {qr.label}
                    </Button>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 8, width: "100%" }}>
                  <Button
                    icon={<AppstoreOutlined />}
                    size="large"
                    onClick={handleOpenCatalog}
                    title="Share Product Quote from Catalog"
                  >
                    Catalog
                  </Button>
                  <Input
                    placeholder="Type your WhatsApp message..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onPressEnter={handleSendMessage}
                    size="large"
                    style={{ flex: 1 }}
                  />
                  <Button
                    type="primary"
                    icon={<SendOutlined />}
                    size="large"
                    loading={sending}
                    onClick={handleSendMessage}
                    style={{ background: "#25D366", borderColor: "#25D366" }}
                  >
                    Send
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Empty description="Select a customer conversation to start messaging" />
            </div>
          )}
        </Card>
        )}
      </div>

      {/* Quick Create Order from Chat Modal */}
      <Modal
        title={`Create Order — ${activeConv?.name || ""}`}
        open={orderModalOpen}
        onCancel={() => setOrderModalOpen(false)}
        footer={null}
        destroyOnClose
        width={520}
      >
        <div style={{ marginBottom: 14, padding: 10, background: "#f8fafc", borderRadius: 8, border: "1px solid #e2e8f0" }}>
          <Text strong style={{ display: "block", marginBottom: 6, fontSize: 12 }}>
            Add Catalog Items (Auto-computes Total &amp; Deducts Stock)
          </Text>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Select
              showSearch
              placeholder="Select item from catalog..."
              optionFilterProp="label"
              value={pickerProductId}
              onChange={setPickerProductId}
              style={{ flex: 1, minWidth: 180 }}
              options={products.map((p) => ({
                value: p.id,
                label: `${p.name} — ₹${p.price}/${p.unit || "pcs"} (Stock: ${p.stock})`,
              }))}
            />
            <InputNumber
              min={1}
              value={pickerQty}
              onChange={(v) => setPickerQty(Number(v) || 1)}
              style={{ width: 70 }}
            />
            <Button icon={<PlusOutlined />} onClick={handleAddQuickOrderItem}>
              Add
            </Button>
          </div>
          {orderItems.length > 0 && (
            <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 4 }}>
              {orderItems.map((item) => (
                <div
                  key={item.productId}
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, background: "#fff", padding: "4px 8px", borderRadius: 6 }}
                >
                  <span>
                    {item.name} × {item.quantity} = <strong>₹{(item.price * item.quantity).toLocaleString("en-IN")}</strong>
                  </span>
                  <Button
                    type="text"
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleRemoveQuickOrderItem(item.productId)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <Form form={orderForm} layout="vertical" onFinish={handleCreateQuickOrder} initialValues={{ paymentStatus: "unpaid" }}>
          <div style={{ display: "flex", gap: 12 }}>
            <Form.Item
              name="totalAmount"
              label="Order Total Amount (₹)"
              rules={[{ required: true, message: "Enter amount" }]}
              style={{ flex: 1 }}
            >
              <InputNumber style={{ width: "100%" }} min={1} placeholder="e.g. 2400" />
            </Form.Item>
            <Form.Item name="paymentStatus" label="Payment Status" style={{ width: 170 }}>
              <Select
                options={[
                  { value: "unpaid", label: "Unpaid / Udhaar" },
                  { value: "paid", label: "Paid (Full)" },
                ]}
              />
            </Form.Item>
          </div>
          <Form.Item name="notes" label="Items & Delivery Notes">
            <Input.TextArea rows={2} placeholder="e.g. urgent evening delivery" />
          </Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            block
            loading={creatingOrder}
            style={{ background: "#25D366", borderColor: "#25D366", fontWeight: 600 }}
          >
            Save Order &amp; Notify Customer
          </Button>
        </Form>
      </Modal>

      {/* Quick Product Catalog Share Modal */}
      <Modal
        title="Share Product / Price on WhatsApp"
        open={catalogModalVisible}
        onCancel={() => setCatalogModalVisible(false)}
        footer={null}
        width={500}
      >
        <List
          loading={loadingProducts}
          dataSource={products}
          locale={{ emptyText: "No products in catalog yet. Add items in Catalog & Items tab." }}
          renderItem={(item) => (
            <List.Item
              actions={[
                <Button
                  key="send"
                  type="primary"
                  size="small"
                  icon={<WhatsAppOutlined />}
                  onClick={() => handleSendProductQuote(item)}
                  style={{ background: "#25D366", borderColor: "#25D366" }}
                >
                  Send
                </Button>,
              ]}
            >
              <List.Item.Meta
                avatar={
                  item.imageUrl ? (
                    <Avatar src={item.imageUrl} shape="square" size={44} />
                  ) : (
                    <Avatar icon={<AppstoreOutlined />} shape="square" size={44} style={{ background: "#f0fdf4", color: "#25D366" }} />
                  )
                }
                title={<Text strong>{item.name}</Text>}
                description={
                  <Space size="small">
                    <Tag color="green">₹{item.price} / {item.unit}</Tag>
                    <Text type="secondary" style={{ fontSize: 12 }}>Stock: {item.stock}</Text>
                  </Space>
                }
              />
            </List.Item>
          )}
        />
      </Modal>
    </AppLayout>
  );
}
