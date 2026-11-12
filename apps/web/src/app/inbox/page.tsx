"use client";

import React, { useState, useEffect, useRef } from "react";
import { AppLayout } from "../../components/AppLayout";
import {
  Card,
  Input,
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
} from "antd";
import {
  SendOutlined,
  UserOutlined,
  WhatsAppOutlined,
  AppstoreOutlined,
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
}

function normalizePhoneKey(raw: string): string {
  let digits = (raw || "").replace(/[^0-9]/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("0") && digits.length === 11) digits = digits.slice(1);
  if (digits.length === 10) digits = `91${digits}`;
  return digits;
}

export default function InboxPage() {
  const [conversations, setConversations] = useState<Map<string, Conversation>>(new Map());
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  const [catalogModalVisible, setCatalogModalVisible] = useState(false);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.all([
      api.get("/api/customers").catch(() => ({ data: { customers: [] } })),
      api.get("/api/whatsapp/messages").catch(() => ({ data: { messages: [] } })),
    ]).then(([custRes, msgRes]) => {
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
      } else if (keys.length > 0 && !activeKey) {
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
  const conversationList = Array.from(conversations.values()).sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <AppLayout>
      <div style={{ display: "flex", gap: 16, height: "calc(100vh - 120px)" }}>
        {/* Conversations List */}
        <Card
          style={{ width: 340, height: "100%", overflowY: "auto", borderRadius: 12 }}
          bodyStyle={{ padding: 0 }}
        >
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #f0f0f0" }}>
            <Title level={5} style={{ margin: 0 }}>Conversations</Title>
            <Text type="secondary" style={{ fontSize: 12 }}>Real-time WhatsApp messages (Cloud Synced)</Text>
          </div>

          {conversationList.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center" }}>
              <Empty description="No chats yet" image={Empty.PRESENTED_IMAGE_SIMPLE} />
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
                      <Avatar
                        style={{ background: "#25D366" }}
                        icon={<WhatsAppOutlined />}
                      />
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

        {/* Active Conversation Chat Window */}
        <Card
          style={{ flex: 1, height: "100%", display: "flex", flexDirection: "column", borderRadius: 12 }}
          bodyStyle={{ flex: 1, display: "flex", flexDirection: "column", padding: 0, height: "100%" }}
        >
          {activeConv ? (
            <>
              {/* Chat Header */}
              <div
                style={{
                  padding: "16px 24px",
                  borderBottom: "1px solid #f0f0f0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Space>
                  <Avatar style={{ background: "#25D366" }} icon={<UserOutlined />} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 15 }}>{activeConv.name}</div>
                    <Text type="secondary" style={{ fontSize: 12 }}>+{activeConv.phone.replace(/^\+/, "")}</Text>
                  </div>
                </Space>
                <Badge status="processing" text="Live Sync" />
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

              {/* Chat Input */}
              <div style={{ padding: 16, borderTop: "1px solid #f0f0f0", background: "#fff" }}>
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
      </div>

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
