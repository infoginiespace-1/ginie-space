"use client";

import React, { useState, useEffect } from "react";
import { AppLayout } from "../../components/AppLayout";
import {
  Card,
  Table,
  Tag,
  Typography,
  message,
  Statistic,
  Row,
  Col,
  Tabs,
  Button,
  Modal,
  Space,
  Input,
  Form,
  Switch,
  Alert,
  Popconfirm,
  Spin,
  Divider,
} from "antd";
import {
  UserOutlined,
  ShopOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined,
  QrcodeOutlined,
  SendOutlined,
  PhoneOutlined,
  SafetyCertificateOutlined,
  BellOutlined,
} from "@ant-design/icons";
import { api } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";
import { getSocket } from "../../lib/socket";

const { Title, Text, Paragraph } = Typography;

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: "admin" | "user";
  businessType: "retail" | "wholesale";
  createdAt: string;
}

export default function AdminPage() {
  const { user } = useAuth();
  const router = useRouter();

  // Users Management State
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  // WhatsApp Support Bot State
  const [supportStatus, setSupportStatus] = useState<"disconnected" | "connecting" | "connected">("disconnected");
  const [supportPhone, setSupportPhone] = useState<string>("919279259690");
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  // Test Message Sender State
  const [testForm] = Form.useForm();
  const [sendingTest, setSendingTest] = useState(false);

  // Notification Rules State
  const [rules, setRules] = useState({
    newUserWelcome: true,
    orderPlacedAlert: true,
    leadConvertedAlert: true,
    supportAutoReply: true,
  });
  const [savingRules, setSavingRules] = useState(false);

  useEffect(() => {
    if (user && user.role !== "admin") {
      router.replace("/inbox");
      return;
    }

    // 1. Load Registered Users
    api.get("/api/settings/users")
      .then((res) => setUsers(res.data.users || []))
      .catch(() => message.error("Could not load users list"))
      .finally(() => setLoadingUsers(false));

    // 2. Load Support WhatsApp Status
    api.get("/api/admin/whatsapp/status")
      .then((res) => {
        const s = res.data.session;
        setSupportStatus(s.status);
        if (s.phoneNumber) setSupportPhone(s.phoneNumber);
        if (s.qrCode) setQrCode(s.qrCode);
      })
      .catch(() => {});

    // 3. Load Notification Rules
    api.get("/api/admin/whatsapp/rules")
      .then((res) => {
        if (res.data.rules) setRules(res.data.rules);
      })
      .catch(() => {});

    // 4. Real-time WebSocket Listeners
    const socket = getSocket();
    if (socket) {
      socket.on("admin:whatsapp:status", (data: any) => {
        setSupportStatus(data.status);
        if (data.phoneNumber) setSupportPhone(data.phoneNumber);
        if (data.status === "connected") {
          setQrModalVisible(false);
          setQrCode(null);
          message.success("Official Support WhatsApp (+91 9279259690) connected & synced to cloud!");
        }
      });

      socket.on("admin:whatsapp:qr", (data: any) => {
        setQrCode(data.qrCode);
        setSupportStatus("connecting");
        setQrModalVisible(true);
      });
    }

    return () => {
      if (socket) {
        socket.off("admin:whatsapp:status");
        socket.off("admin:whatsapp:qr");
      }
    };
  }, [user, router]);

  // Connect Support WhatsApp
  const handleConnectSupport = async () => {
    try {
      setConnecting(true);
      const res = await api.post("/api/admin/whatsapp/connect");
      if (res.data.session?.qrCode) {
        setQrCode(res.data.session.qrCode);
      }
      setQrModalVisible(true);
    } catch (err: any) {
      message.error(err.response?.data?.error || err.message || "Failed to start support connection");
    } finally {
      setConnecting(false);
    }
  };

  // Disconnect Support WhatsApp (Strictly Admin Action)
  const handleDisconnectSupport = async () => {
    try {
      setDisconnecting(true);
      await api.post("/api/admin/whatsapp/disconnect");
      setSupportStatus("disconnected");
      setQrCode(null);
      message.warning("Official Support WhatsApp disconnected and cloud credentials cleared");
    } catch (err: any) {
      message.error(err.response?.data?.error || err.message || "Failed to disconnect support WhatsApp");
    } finally {
      setDisconnecting(false);
    }
  };

  // Send Test Alert from 9279259690
  const handleSendTest = async (values: any) => {
    try {
      setSendingTest(true);
      await api.post("/api/admin/whatsapp/send-test", {
        recipientPhone: values.phone,
        messageText: values.message,
      });
      message.success(`Test alert sent successfully to ${values.phone}!`);
      testForm.resetFields();
    } catch (err: any) {
      message.error(err.response?.data?.error || err.message || "Failed to send test message");
    } finally {
      setSendingTest(false);
    }
  };

  // Toggle Notification Rule
  const handleRuleToggle = async (ruleKey: string, checked: boolean) => {
    const updated = { ...rules, [ruleKey]: checked };
    setRules(updated);
    try {
      setSavingRules(true);
      await api.post("/api/admin/whatsapp/rules", { rules: updated });
      message.success("Notification setting saved");
    } catch {
      message.error("Failed to update notification setting");
    } finally {
      setSavingRules(false);
    }
  };

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (name: string) => <Text strong>{name}</Text>,
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Business Type",
      dataIndex: "businessType",
      key: "businessType",
      render: (type: string) => (
        <Tag color={type === "wholesale" ? "blue" : "green"}>
          {type?.toUpperCase() || "RETAIL"}
        </Tag>
      ),
    },
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
      render: (role: string) => (
        <Tag color={role === "admin" ? "purple" : "default"}>
          {role?.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: "Joined On",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
  ];

  const totalUsers = users.length;
  const retailUsers = users.filter((u) => u.businessType === "retail").length;
  const wholesaleUsers = users.filter((u) => u.businessType === "wholesale").length;

  return (
    <AppLayout>
      <div style={{ marginBottom: 20 }}>
        <Title level={4} style={{ margin: 0 }}>Platform Administration</Title>
        <Text type="secondary">Central control for GinieSpace Official Bot (+91 9279259690), notifications, and user workspaces</Text>
      </div>

      <Tabs
        defaultActiveKey="whatsapp"
        items={[
          {
            key: "whatsapp",
            label: (
              <span>
                <PhoneOutlined /> Official Support WhatsApp (+91 9279259690)
              </span>
            ),
            children: (
              <div>
                <Alert
                  type="info"
                  showIcon
                  message="GinieSpace Central Support & Notification Engine"
                  description="Ye helpline (+91 9279259690) poore system ke notifications, naye users ke alerts, order confirmations, aur customer queries ke liye use hoti hai. Cloud Session Sync ke kaaran server restart hone par bhi ye kabhi disconnect nahi hoga."
                  style={{ marginBottom: 20, borderRadius: 8 }}
                />

                <Row gutter={[20, 20]}>
                  {/* Connection Status Card */}
                  <Col xs={24} lg={12}>
                    <Card
                      title={
                        <Space>
                          <SafetyCertificateOutlined style={{ color: "#25D366", fontSize: 20 }} />
                          <span>Support Bot Connection Status</span>
                        </Space>
                      }
                      style={{ borderRadius: 12, height: "100%" }}
                    >
                      <div style={{ marginBottom: 20 }}>
                        <Text type="secondary" style={{ display: "block", marginBottom: 6 }}>Current Status:</Text>
                        {supportStatus === "connected" ? (
                          <Tag icon={<CheckCircleOutlined />} color="success" style={{ padding: "6px 14px", fontSize: 14 }}>
                            WhatsApp Connected (+91 9279259690)
                          </Tag>
                        ) : supportStatus === "connecting" ? (
                          <Tag icon={<SyncOutlined spin />} color="warning" style={{ padding: "6px 14px", fontSize: 14 }}>
                            Connecting... Scan QR Code
                          </Tag>
                        ) : (
                          <Tag icon={<CloseCircleOutlined />} color="error" style={{ padding: "6px 14px", fontSize: 14 }}>
                            Disconnected
                          </Tag>
                        )}
                      </div>

                      <div style={{ marginBottom: 16 }}>
                        <Text strong>Configured Support Number: </Text>
                        <Tag color="cyan">+91 9279259690</Tag>
                      </div>

                      <div style={{ marginBottom: 16 }}>
                        <Text strong>Session Persistence: </Text>
                        <Tag color="purple">Cloud State Synced (Auto-restores on restart)</Tag>
                      </div>

                      <Paragraph type="secondary" style={{ fontSize: 13 }}>
                        ⚠️ Ye session tab tak active rahega jab tak admin khud niche diye gaye <strong>Disconnect</strong> button se log out na kare ya phone ke WhatsApp app me jakar Linked Devices se remove na kare.
                      </Paragraph>

                      <Divider />

                      <Space wrap>
                        {supportStatus === "connected" ? (
                          <Popconfirm
                            title="Disconnect Official Support WhatsApp?"
                            description="Disconnect karne par 9279259690 se system alerts aur notifications pause ho jayenge jab tak dobara QR scan na kiya jaye."
                            onConfirm={handleDisconnectSupport}
                            okText="Yes, Disconnect"
                            cancelText="Cancel"
                            okButtonProps={{ danger: true }}
                          >
                            <Button danger loading={disconnecting}>
                              Disconnect Session
                            </Button>
                          </Popconfirm>
                        ) : (
                          <Button
                            type="primary"
                            icon={<QrcodeOutlined />}
                            loading={connecting}
                            onClick={handleConnectSupport}
                            style={{ background: "#25D366", borderColor: "#25D366", fontWeight: 600 }}
                          >
                            Link Support WhatsApp (+91 9279259690)
                          </Button>
                        )}

                        {supportStatus === "connecting" && (
                          <Button onClick={() => setQrModalVisible(true)} icon={<QrcodeOutlined />}>
                            View QR Code
                          </Button>
                        )}
                      </Space>
                    </Card>
                  </Col>

                  {/* Send Test Alert Card */}
                  <Col xs={24} lg={12}>
                    <Card
                      title={
                        <Space>
                          <SendOutlined style={{ color: "#1677ff", fontSize: 18 }} />
                          <span>Direct Test Notification</span>
                        </Space>
                      }
                      style={{ borderRadius: 12, height: "100%" }}
                    >
                      <Paragraph type="secondary" style={{ fontSize: 13 }}>
                        Official support number (+91 9279259690) se kisi bhi mobile number par test WhatsApp message bhej kar verify karein:
                      </Paragraph>

                      <Form form={testForm} layout="vertical" onFinish={handleSendTest}>
                        <Form.Item
                          name="phone"
                          label="Recipient Mobile Number"
                          rules={[{ required: true, message: "Enter recipient phone number (e.g. 918797186001)" }]}
                        >
                          <Input placeholder="e.g. 918797186001 or +91 87971 86001" />
                        </Form.Item>

                        <Form.Item
                          name="message"
                          label="Message Content"
                          initialValue="Hello! This is a verified test notification from GinieSpace Official Support (+91 9279259690)."
                          rules={[{ required: true, message: "Enter message text" }]}
                        >
                          <Input.TextArea rows={3} />
                        </Form.Item>

                        <Button
                          type="primary"
                          htmlType="submit"
                          icon={<SendOutlined />}
                          loading={sendingTest}
                          disabled={supportStatus !== "connected"}
                          style={{ background: supportStatus === "connected" ? "#25D366" : undefined, borderColor: supportStatus === "connected" ? "#25D366" : undefined }}
                        >
                          {supportStatus === "connected" ? "Send Test Alert" : "Connect WhatsApp First"}
                        </Button>
                      </Form>
                    </Card>
                  </Col>

                  {/* Automated Platform Notification Rules */}
                  <Col xs={24}>
                    <Card
                      title={
                        <Space>
                          <BellOutlined style={{ color: "#faad14", fontSize: 20 }} />
                          <span>Automated Platform Notification Rules (Via +91 9279259690)</span>
                        </Space>
                      }
                      style={{ borderRadius: 12 }}
                    >
                      <Row gutter={[24, 24]}>
                        <Col xs={24} sm={12} md={6}>
                          <Card type="inner" style={{ borderRadius: 8, height: "100%" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                              <Text strong>New User Welcome</Text>
                              <Switch
                                checked={rules.newUserWelcome}
                                onChange={(c) => handleRuleToggle("newUserWelcome", c)}
                                loading={savingRules}
                              />
                            </div>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              Naye user ke register hote hi onboarding greeting aur support links bhejna.
                            </Text>
                          </Card>
                        </Col>

                        <Col xs={24} sm={12} md={6}>
                          <Card type="inner" style={{ borderRadius: 8, height: "100%" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                              <Text strong>Order Placed Alerts</Text>
                              <Switch
                                checked={rules.orderPlacedAlert}
                                onChange={(c) => handleRuleToggle("orderPlacedAlert", c)}
                                loading={savingRules}
                              />
                            </div>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              Naya order aane par customer ko order confirmation message bhejna.
                            </Text>
                          </Card>
                        </Col>

                        <Col xs={24} sm={12} md={6}>
                          <Card type="inner" style={{ borderRadius: 8, height: "100%" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                              <Text strong>Lead Converted Alerts</Text>
                              <Switch
                                checked={rules.leadConvertedAlert}
                                onChange={(c) => handleRuleToggle("leadConvertedAlert", c)}
                                loading={savingRules}
                              />
                            </div>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              Lead ke customer me convert hone par merchant ko instant confirmation alert.
                            </Text>
                          </Card>
                        </Col>

                        <Col xs={24} sm={12} md={6}>
                          <Card type="inner" style={{ borderRadius: 8, height: "100%" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                              <Text strong>Support Auto-Responder</Text>
                              <Switch
                                checked={rules.supportAutoReply}
                                onChange={(c) => handleRuleToggle("supportAutoReply", c)}
                                loading={savingRules}
                              />
                            </div>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              Jab koi user 9279259690 par text kare to automatic support menu bhejna.
                            </Text>
                          </Card>
                        </Col>
                      </Row>
                    </Card>
                  </Col>
                </Row>
              </div>
            ),
          },
          {
            key: "users",
            label: (
              <span>
                <UserOutlined /> User & Business Management
              </span>
            ),
            children: (
              <div>
                <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                  <Col xs={24} sm={8}>
                    <Card style={{ borderRadius: 12 }}>
                      <Statistic
                        title="Total Business Accounts"
                        value={totalUsers}
                        prefix={<UserOutlined style={{ color: "#25D366" }} />}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Card style={{ borderRadius: 12 }}>
                      <Statistic
                        title="Retail Businesses"
                        value={retailUsers}
                        prefix={<ShopOutlined style={{ color: "#16a34a" }} />}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={8}>
                    <Card style={{ borderRadius: 12 }}>
                      <Statistic
                        title="Wholesale Businesses"
                        value={wholesaleUsers}
                        prefix={<ShopOutlined style={{ color: "#0284c7" }} />}
                      />
                    </Card>
                  </Col>
                </Row>

                <Card title="Registered Business Users" style={{ borderRadius: 12 }}>
                  <Table
                    dataSource={users}
                    columns={columns}
                    rowKey="id"
                    loading={loadingUsers}
                    pagination={{ pageSize: 10 }}
                  />
                </Card>
              </div>
            ),
          },
        ]}
      />

      {/* QR Code Modal for Official Support WhatsApp */}
      <Modal
        title={
          <Space>
            <SafetyCertificateOutlined style={{ color: "#25D366" }} />
            <span>Link Official Support WhatsApp (+91 9279259690)</span>
          </Space>
        }
        open={qrModalVisible}
        onCancel={() => setQrModalVisible(false)}
        footer={null}
        centered
        width={420}
      >
        <div style={{ textAlign: "center", padding: "16px 0" }}>
          <Paragraph style={{ color: "#595959", marginBottom: 18 }}>
            Phone me WhatsApp open karein (<strong>9279259690</strong> wala SIM) $\rightarrow$ <strong>Settings / 3-dots</strong> $\rightarrow$ <strong>Linked Devices</strong> $\rightarrow$ <strong>Link a Device</strong> aur camera se is QR code ko scan karein.
          </Paragraph>

          {qrCode ? (
            <div style={{ display: "inline-block", padding: 12, border: "2px solid #25D366", borderRadius: 12, background: "#fff" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrCode} alt="WhatsApp QR Code" style={{ width: 250, height: 250, display: "block" }} />
            </div>
          ) : (
            <div style={{ height: 250, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
              <Spin size="large" />
              <Text type="secondary">Generating secure QR code for +91 9279259690...</Text>
            </div>
          )}

          <div style={{ marginTop: 20 }}>
            <Button onClick={handleConnectSupport} icon={<SyncOutlined />} loading={connecting}>
              Refresh QR Code
            </Button>
          </div>
        </div>
      </Modal>
    </AppLayout>
  );
}
