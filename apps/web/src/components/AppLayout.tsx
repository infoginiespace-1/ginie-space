"use client";

import React, { useState, useEffect } from "react";
import { Layout, Menu, Button, Modal, Badge, Tag, Space, Typography, Spin, message } from "antd";
import {
  MessageOutlined,
  ShoppingOutlined,
  SearchOutlined,
  TeamOutlined,
  AppstoreOutlined,
  SettingOutlined,
  SafetyCertificateOutlined,
  QrcodeOutlined,
  LogoutOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined,
} from "@ant-design/icons";
import { useAuth } from "../context/AuthContext";
import { usePathname, useRouter } from "next/navigation";
import { getSocket } from "../lib/socket";
import { api } from "../lib/api";

const { Header, Content, Sider } = Layout;
const { Text } = Typography;

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [waStatus, setWaStatus] = useState<"disconnected" | "connecting" | "connected">("disconnected");
  const [waPhone, setWaPhone] = useState<string | undefined>(undefined);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    // Initial fetch of WhatsApp Status
    api.get("/api/whatsapp/status")
      .then((res) => {
        const s = res.data.session;
        setWaStatus(s.status);
        setWaPhone(s.phoneNumber);
        if (s.qrCode) setQrCode(s.qrCode);
      })
      .catch(() => {});

    // Listen to real-time status updates via Socket.io
    const socket = getSocket();
    if (socket) {
      socket.on("whatsapp:status", (data: any) => {
        setWaStatus(data.status);
        if (data.phoneNumber) setWaPhone(data.phoneNumber);
        if (data.status === "connected") {
          setQrModalVisible(false);
          setQrCode(null);
          message.success("WhatsApp connected successfully!");
        }
      });

      socket.on("whatsapp:qr", (data: any) => {
        setQrCode(data.qrCode);
        setWaStatus("connecting");
        setQrModalVisible(true);
      });
    }

    return () => {
      if (socket) {
        socket.off("whatsapp:status");
        socket.off("whatsapp:qr");
      }
    };
  }, []);

  const handleConnectWhatsApp = async () => {
    try {
      setConnecting(true);
      const res = await api.post("/api/whatsapp/connect");
      if (res.data.session?.qrCode) {
        setQrCode(res.data.session.qrCode);
      }
      setQrModalVisible(true);
    } catch (err: any) {
      message.error(err.message || "Could not start WhatsApp connection");
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnectWhatsApp = async () => {
    try {
      await api.post("/api/whatsapp/disconnect");
      setWaStatus("disconnected");
      setWaPhone(undefined);
      setQrCode(null);
      message.info("WhatsApp has been disconnected");
    } catch (err: any) {
      message.error(err.message || "Could not disconnect WhatsApp");
    }
  };

  const menuItems = [
    { key: "/inbox", icon: <MessageOutlined />, label: "Live Inbox" },
    { key: "/orders", icon: <ShoppingOutlined />, label: "Orders & Sales" },
    { key: "/leads", icon: <SearchOutlined />, label: "Find New Leads" },
    { key: "/customers", icon: <TeamOutlined />, label: "Customers" },
    { key: "/products", icon: <AppstoreOutlined />, label: "Catalog & Items" },
    { key: "/settings", icon: <SettingOutlined />, label: "Settings" },
  ];

  if (user?.role === "admin") {
    menuItems.push({ key: "/admin", icon: <SafetyCertificateOutlined />, label: "Admin Panel" });
  }

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider width={240} theme="light" style={{ borderRight: "1px solid #f0f0f0" }}>
        <div style={{ padding: "20px 24px", display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              background: "#25D366",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontWeight: 700,
              fontSize: 18,
            }}
          >
            G
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: "#1f1f1f", lineHeight: 1.2 }}>GinieSpace</div>
            <div style={{ fontSize: 11, color: "#8c8c8c" }}>{user?.businessType === "wholesale" ? "Wholesale Hub" : "Retail Hub"}</div>
          </div>
        </div>

        <Menu
          mode="inline"
          selectedKeys={[pathname]}
          items={menuItems}
          onClick={({ key }) => router.push(key)}
          style={{ borderRight: 0 }}
        />
      </Sider>

      <Layout>
        <Header
          style={{
            background: "#fff",
            padding: "0 24px",
            borderBottom: "1px solid #f0f0f0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Space orientation="horizontal" size="middle">
            {waStatus === "connected" ? (
              <Space>
                <Tag icon={<CheckCircleOutlined />} color="success" style={{ padding: "4px 10px", fontSize: 13 }}>
                  WhatsApp Connected {waPhone ? `(${waPhone})` : ""}
                </Tag>
                <Button size="small" danger onClick={handleDisconnectWhatsApp}>
                  Disconnect
                </Button>
              </Space>
            ) : waStatus === "connecting" ? (
              <Space>
                <Tag icon={<SyncOutlined spin />} color="warning" style={{ padding: "4px 10px", fontSize: 13 }}>
                  Connecting...
                </Tag>
                <Button size="small" type="primary" onClick={() => setQrModalVisible(true)}>
                  Show QR
                </Button>
              </Space>
            ) : (
              <Space>
                <Tag icon={<CloseCircleOutlined />} color="error" style={{ padding: "4px 10px", fontSize: 13 }}>
                  WhatsApp Disconnected
                </Tag>
                <Button
                  size="small"
                  type="primary"
                  icon={<QrcodeOutlined />}
                  loading={connecting}
                  onClick={handleConnectWhatsApp}
                  style={{ background: "#25D366", borderColor: "#25D366" }}
                >
                  Link WhatsApp
                </Button>
              </Space>
            )}
          </Space>

          <Space size="middle">
            <Space orientation="horizontal">
              <Text strong>{user?.name}</Text>
              <Tag color={user?.role === "admin" ? "purple" : "blue"}>
                {user?.role === "admin" ? "Admin" : "Business"}
              </Tag>
            </Space>
            <Button icon={<LogoutOutlined />} onClick={logout}>
              Log out
            </Button>
          </Space>
        </Header>

        <Content style={{ padding: 24, background: "#f8fafc" }}>{children}</Content>
      </Layout>

      {/* WhatsApp QR Modal */}
      <Modal
        title="Link Your WhatsApp"
        open={qrModalVisible}
        onCancel={() => setQrModalVisible(false)}
        footer={null}
        centered
        width={400}
      >
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <p style={{ color: "#595959", marginBottom: 20 }}>
            Open WhatsApp on your phone $\rightarrow$ Settings $\rightarrow$ <strong>Linked Devices</strong> $\rightarrow$ <strong>Link a Device</strong> and point your camera at this QR code.
          </p>
          {qrCode ? (
            <div style={{ display: "inline-block", padding: 12, border: "2px solid #25D366", borderRadius: 12, background: "#fff" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrCode} alt="WhatsApp QR Code" style={{ width: 240, height: 240, display: "block" }} />
            </div>
          ) : (
            <div style={{ height: 240, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
              <Spin size="large" />
              <Text type="secondary">Generating secure QR code...</Text>
            </div>
          )}
          <div style={{ marginTop: 20 }}>
            <Button onClick={handleConnectWhatsApp} icon={<SyncOutlined />} loading={connecting}>
              Refresh QR Code
            </Button>
          </div>
        </div>
      </Modal>
    </Layout>
  );
}