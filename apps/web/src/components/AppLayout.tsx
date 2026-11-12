"use client";

import React, { useState, useEffect } from "react";
import { Layout, Menu, Button, Modal, Badge, Tag, Space, Typography, Spin, message, Drawer, Grid, Tooltip, Popover, List } from "antd";
import {
  DashboardOutlined,
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
  MenuOutlined,
  WhatsAppOutlined,
  BellOutlined,
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
  const screens = Grid.useBreakpoint();
  const isMobile = screens.md === false;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [waStatus, setWaStatus] = useState<"disconnected" | "connecting" | "connected">("disconnected");
  const [waPhone, setWaPhone] = useState<string | undefined>(undefined);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
  const [lowStockItems, setLowStockItems] = useState<Array<{ id: string; name: string; stock: number; unit?: string }>>([]);
  const [unreadChatsCount, setUnreadChatsCount] = useState(0);

  useEffect(() => {
    Promise.all([
      api.get("/api/orders").catch(() => ({ data: { orders: [] } })),
      api.get("/api/products").catch(() => ({ data: { products: [] } })),
    ]).then(([ordRes, prodRes]) => {
      const ords = ordRes.data?.orders || [];
      setPendingOrdersCount(ords.filter((o: any) => o.status === "pending").length);
      const prods = prodRes.data?.products || [];
      setLowStockItems(prods.filter((p: any) => Number(p.stock) <= 5));
    });

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

      socket.on("order:created", () => {
        setPendingOrdersCount((c) => c + 1);
      });

      socket.on("whatsapp:message", (ev: any) => {
        if (!ev?.fromMe && pathname !== "/inbox") {
          setUnreadChatsCount((c) => c + 1);
        }
      });
    }

    return () => {
      if (socket) {
        socket.off("whatsapp:status");
        socket.off("whatsapp:qr");
        socket.off("order:created");
        socket.off("whatsapp:message");
      }
    };
  }, [pathname]);

  useEffect(() => {
    if (pathname === "/inbox") {
      setUnreadChatsCount(0);
    }
  }, [pathname]);

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

  const allMenuItems = [
    { key: "/dashboard", area: "dashboard", icon: <DashboardOutlined />, label: "Dashboard" },
    {
      key: "/inbox",
      area: "inbox",
      icon: <MessageOutlined />,
      label: unreadChatsCount > 0 ? (
        <Space size={6}><span>Live Inbox</span><Badge count={unreadChatsCount} size="small" /></Space>
      ) : "Live Inbox",
    },
    {
      key: "/orders",
      area: "orders",
      icon: <ShoppingOutlined />,
      label: pendingOrdersCount > 0 ? (
        <Space size={6}><span>Orders &amp; Sales</span><Badge count={pendingOrdersCount} size="small" color="#fa8c16" /></Space>
      ) : "Orders & Sales",
    },
    { key: "/leads", area: "leads", icon: <SearchOutlined />, label: "Find New Leads" },
    { key: "/customers", area: "customers", icon: <TeamOutlined />, label: "Customers" },
    { key: "/products", area: "products", icon: <AppstoreOutlined />, label: "Catalog & Items" },
    { key: "/settings", area: "settings", icon: <SettingOutlined />, label: "Settings" },
  ];

  const menuItems = allMenuItems
    .filter((item) => {
      if (user?.role !== "staff") return true;
      if (item.area === "dashboard") return true;
      if (item.area === "settings") return false;
      return (user.staffPermissions || []).includes(item.area);
    })
    .map(({ area: _area, ...rest }) => rest);

  if (user?.role === "admin") {
    menuItems.push({ key: "/admin", icon: <SafetyCertificateOutlined />, label: "Admin Panel" });
  }

  const sidebarHeader = (
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
  );

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {!isMobile && (
        <Sider className="no-print" width={240} theme="light" style={{ borderRight: "1px solid #f0f0f0" }}>
          {sidebarHeader}
          <Menu
            mode="inline"
            selectedKeys={[pathname]}
            items={menuItems}
            onClick={({ key }) => router.push(key)}
            style={{ borderRight: 0 }}
          />
        </Sider>
      )}

      <Drawer
        title={null}
        placement="left"
        width={250}
        onClose={() => setMobileMenuOpen(false)}
        open={isMobile && mobileMenuOpen}
        styles={{ body: { padding: 0 } }}
      >
        {sidebarHeader}
        <Menu
          mode="inline"
          selectedKeys={[pathname]}
          items={menuItems}
          onClick={({ key }) => {
            setMobileMenuOpen(false);
            router.push(key);
          }}
          style={{ borderRight: 0 }}
        />
      </Drawer>

      <Layout>
        <Header
          className="no-print"
          style={{
            background: "#fff",
            padding: isMobile ? "0 12px" : "0 24px",
            borderBottom: "1px solid #f0f0f0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
            flexWrap: "wrap",
            height: "auto",
            minHeight: 64,
          }}
        >
          <Space direction="horizontal" size="small" wrap>
            {isMobile && (
              <Button
                icon={<MenuOutlined />}
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Open navigation menu"
              />
            )}
            {waStatus === "connected" ? (
              <Space size="small">
                <Tag icon={<CheckCircleOutlined />} color="success" style={{ padding: "4px 10px", fontSize: 12 }}>
                  {isMobile ? "WA Connected" : `WhatsApp Connected ${waPhone ? `(${waPhone})` : ""}`}
                </Tag>
                <Button size="small" danger onClick={handleDisconnectWhatsApp}>
                  Disconnect
                </Button>
              </Space>
            ) : waStatus === "connecting" ? (
              <Space size="small">
                <Tag icon={<SyncOutlined spin />} color="warning" style={{ padding: "4px 10px", fontSize: 12 }}>
                  Connecting...
                </Tag>
                <Button size="small" type="primary" onClick={() => setQrModalVisible(true)}>
                  QR
                </Button>
              </Space>
            ) : (
              <Space size="small">
                <Tag icon={<CloseCircleOutlined />} color="error" style={{ padding: "4px 10px", fontSize: 12 }}>
                  {isMobile ? "WA Offline" : "WhatsApp Disconnected"}
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

          <Space size="small">
            <Popover
              placement="bottomRight"
              trigger="click"
              title="Notifications & Store Alerts"
              content={
                <div style={{ width: 290 }}>
                  <List
                    size="small"
                    dataSource={[
                      ...(pendingOrdersCount > 0
                        ? [{ key: "pending", title: `${pendingOrdersCount} Pending Order(s)`, desc: "Awaiting confirmation/dispatch", href: "/orders" }]
                        : []),
                      ...(unreadChatsCount > 0
                        ? [{ key: "chats", title: `${unreadChatsCount} New WhatsApp Message(s)`, desc: "Reply in Live Inbox", href: "/inbox" }]
                        : []),
                      ...lowStockItems.slice(0, 4).map((p) => ({
                        key: `stock_${p.id}`,
                        title: `Low Stock: ${p.name}`,
                        desc: `Only ${p.stock} ${p.unit || "pcs"} left`,
                        href: "/products",
                      })),
                    ]}
                    locale={{ emptyText: "All caught up! Zero pending alerts." }}
                    renderItem={(item: any) => (
                      <List.Item
                        style={{ cursor: "pointer", padding: "6px 0" }}
                        onClick={() => router.push(item.href)}
                      >
                        <List.Item.Meta title={<Text strong style={{ fontSize: 13 }}>{item.title}</Text>} description={<Text type="secondary" style={{ fontSize: 11 }}>{item.desc}</Text>} />
                      </List.Item>
                    )}
                  />
                </div>
              }
            >
              <Badge count={pendingOrdersCount + unreadChatsCount + lowStockItems.length} size="small">
                <Button size={isMobile ? "small" : "middle"} icon={<BellOutlined />} aria-label="Notifications" />
              </Badge>
            </Popover>
            {!isMobile && (
              <Space direction="horizontal" size={4}>
                <Text strong>{user?.name}</Text>
                <Tag color={user?.role === "admin" ? "purple" : user?.role === "staff" ? "cyan" : "blue"}>
                  {user?.role === "admin" ? "Admin" : user?.role === "staff" ? "Staff" : "Business"}
                </Tag>
                {user?.role !== "admin" && (
                  <Tag color={user?.plan === "pro" ? "gold" : "default"}>
                    {user?.plan === "pro" ? "PRO" : "FREE"}
                  </Tag>
                )}
              </Space>
            )}
            <Button size={isMobile ? "small" : "middle"} icon={<LogoutOutlined />} onClick={logout}>
              {isMobile ? "" : "Log out"}
            </Button>
          </Space>
        </Header>

        <Content style={{ padding: isMobile ? 12 : 24, background: "#f8fafc" }}>{children}</Content>
      </Layout>

      {/* Floating Official GinieSpace WhatsApp Support Button */}
      <Tooltip title="Official GinieSpace Support (+91 9279259690)" placement="left">
        <a
          className="no-print"
          href="https://wa.me/919279259690?text=Hi%20GinieSpace%20Support%2C%20I%20need%20help."
          target="_blank"
          rel="noopener noreferrer"
          style={{
            position: "fixed",
            right: 20,
            bottom: 20,
            zIndex: 999,
            background: "#25D366",
            color: "#fff",
            borderRadius: 999,
            padding: "10px 16px",
            boxShadow: "0 8px 20px rgba(37, 211, 102, 0.35)",
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontWeight: 600,
            fontSize: 13,
            textDecoration: "none",
          }}
        >
          <WhatsAppOutlined style={{ fontSize: 18 }} />
          {!isMobile && <span>Support Help</span>}
        </a>
      </Tooltip>

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