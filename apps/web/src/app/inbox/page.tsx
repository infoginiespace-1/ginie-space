"use client";

import React, { useState, useEffect, useRef } from "react";
import { AppLayout } from "../../components/AppLayout";
import { Card, Input, Button, List, Avatar, Typography, Badge, Space, Empty, message } from "antd";
import { SendOutlined, UserOutlined, WhatsAppOutlined } from "@ant-design/icons";
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
  phone: string;
  name: string;
  lastMessage: string;
  timestamp: string;
  messages: ChatMessage[];
}

export default function InboxPage() {
  const [conversations, setConversations] = useState<Map<string, Conversation>>(new Map());
  const [activePhone, setActivePhone] = useState<string | null>(null);
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initial fetch of customers to populate conversations
    api.get("/api/customers").then((res) => {
      const custs = res.data.customers || [];
      const map = new Map<string, Conversation>();
      for (const c of custs) {
        if (c.phone) {
          map.set(c.phone, {
            phone: c.phone,
            name: c.name,
            lastMessage: "No recent messages",
            timestamp: c.createdAt || new Date().toISOString(),
            messages: [],
          });
        }
      }
      setConversations(new Map(map));
      if (custs.length > 0 && !activePhone) {
        setActivePhone(custs[0].phone);
      }
    }).catch(() => {});

    // Listen to real-time WhatsApp incoming/outgoing messages
    const socket = getSocket();
    if (socket) {
      socket.on("whatsapp:message", (event: any) => {
        const cleanPhone = event.senderJid.replace(/[^0-9]/g, "");
        const newMsg: ChatMessage = {
          id: event.messageId,
          senderPhone: cleanPhone,
          senderName: event.senderName,
          text: event.messageText,
          timestamp: event.timestamp,
          fromMe: event.fromMe,
        };

        setConversations((prev) => {
          const next = new Map(prev);
          const existing = next.get(cleanPhone) || {
            phone: cleanPhone,
            name: event.senderName || cleanPhone,
            lastMessage: event.messageText,
            timestamp: event.timestamp,
            messages: [],
          };

          existing.lastMessage = event.messageText;
          existing.timestamp = event.timestamp;
          existing.messages = [...existing.messages, newMsg];
          next.set(cleanPhone, existing);
          return next;
        });
      });
    }

    return () => {
      if (socket) {
        socket.off("whatsapp:message");
      }
    };
  }, [activePhone]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversations, activePhone]);

  const handleSendMessage = async () => {
    if (!activePhone || !inputText.trim()) return;

    const messageText = inputText.trim();
    setInputText("");
    setSending(true);

    try {
      await api.post("/api/whatsapp/send", {
        recipientPhone: activePhone,
        messageText,
      });

      const outbound: ChatMessage = {
        id: Date.now().toString(),
        senderPhone: activePhone,
        text: messageText,
        timestamp: new Date().toISOString(),
        fromMe: true,
      };

      setConversations((prev) => {
        const next = new Map(prev);
        const existing = next.get(activePhone);
        if (existing) {
          existing.lastMessage = messageText;
          existing.timestamp = outbound.timestamp;
          existing.messages = [...existing.messages, outbound];
          next.set(activePhone, existing);
        }
        return next;
      });
    } catch (err: any) {
      message.error(err.message || "Failed to send message. Please ensure WhatsApp is linked.");
    } finally {
      setSending(false);
    }
  };

  const activeConv = activePhone ? conversations.get(activePhone) : null;
  const conversationList = Array.from(conversations.values());

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
            <Text type="secondary" style={{ fontSize: 12 }}>Real-time WhatsApp messages</Text>
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
                  onClick={() => setActivePhone(item.phone)}
                  style={{
                    padding: "12px 16px",
                    cursor: "pointer",
                    background: activePhone === item.phone ? "#f0fdf4" : "transparent",
                    borderLeft: activePhone === item.phone ? "3px solid #25D366" : "3px solid transparent",
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
                    <Text type="secondary">Send a message to start conversation</Text>
                  </div>
                ) : (
                  activeConv.messages.map((m, idx) => (
                    <div
                      key={idx}
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
                <Space orientation="horizontal" style={{ width: "100%" }}>
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
                </Space>
              </div>
            </>
          ) : (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Empty description="Select a customer conversation to start messaging" />
            </div>
          )}
        </Card>
      </div>
    </AppLayout>
  );
}