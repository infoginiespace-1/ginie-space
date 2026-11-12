"use client";

import React, { useState } from "react";
import { Form, Input, Button, Card, Typography, Alert, Radio, Space } from "antd";
import { UserOutlined, LockOutlined, MailOutlined, ShopOutlined, PhoneOutlined } from "@ant-design/icons";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";

const { Title, Text } = Typography;

export default function SignupPage() {
  const { signup } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);
      setErrorMsg(null);
      await signup(values.name, values.email, values.password, values.businessType, values.phone);
      router.push("/dashboard");
    } catch (err: any) {
      setErrorMsg(err.message || "Could not register your account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #f0fdf4 0%, #e2e8f0 100%)",
        padding: 24,
      }}
    >
      <Card
        style={{
          width: "100%",
          maxWidth: 480,
          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)",
          borderRadius: 16,
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: "#25D366",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 24,
              fontWeight: 800,
              margin: "0 auto 12px",
            }}
          >
            G
          </div>
          <Title level={3} style={{ margin: 0, color: "#0f172a" }}>Get Started with GinieSpace</Title>
          <Text type="secondary">Create your automated WhatsApp business workspace</Text>
        </div>

        {errorMsg && (
          <Alert
            message={errorMsg}
            type="error"
            showIcon
            closable
            onClose={() => setErrorMsg(null)}
            style={{ marginBottom: 20 }}
          />
        )}

        <Form layout="vertical" onFinish={handleSubmit} size="large" initialValues={{ businessType: "retail" }}>
          <Form.Item
            name="name"
            label="Your Name or Business Name"
            rules={[{ required: true, message: "Please tell us your name" }]}
          >
            <Input prefix={<UserOutlined style={{ color: "#94a3b8" }} />} placeholder="e.g. Acme Enterprises" />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email Address"
            rules={[
              { required: true, message: "Please enter your email" },
              { type: "email", message: "Please enter a valid email address" },
            ]}
          >
            <Input prefix={<MailOutlined style={{ color: "#94a3b8" }} />} placeholder="name@company.com" />
          </Form.Item>

          <Form.Item
            name="phone"
            label="WhatsApp Mobile Number"
            rules={[{ required: true, message: "Please enter your WhatsApp number" }]}
            extra="Used for Official GinieSpace Support alerts & password recovery OTP"
          >
            <Input prefix={<PhoneOutlined style={{ color: "#94a3b8" }} />} placeholder="e.g. 9876543210" />
          </Form.Item>

          <Form.Item
            name="password"
            label="Create Password"
            rules={[
              { required: true, message: "Please create a password" },
              { min: 6, message: "Password must be at least 6 characters" },
            ]}
          >
            <Input.Password prefix={<LockOutlined style={{ color: "#94a3b8" }} />} placeholder="••••••••" />
          </Form.Item>

          <Form.Item
            name="businessType"
            label="What best describes your business?"
            rules={[{ required: true, message: "Please select your business type" }]}
          >
            <Radio.Group style={{ width: "100%" }}>
              <Space direction="vertical" style={{ width: "100%" }}>
                <Radio.Button value="retail" style={{ width: "100%", height: "auto", padding: "12px 16px", borderRadius: 8 }}>
                  <Space direction="horizontal" size="middle">
                    <ShopOutlined style={{ fontSize: 20, color: "#25D366" }} />
                    <div style={{ textAlign: "left" }}>
                      <div style={{ fontWeight: 600 }}>Retail Business</div>
                      <div style={{ fontSize: 12, color: "#64748b" }}>Direct to customer store, shop, or service provider</div>
                    </div>
                  </Space>
                </Radio.Button>

                <Radio.Button value="wholesale" style={{ width: "100%", height: "auto", padding: "12px 16px", borderRadius: 8 }}>
                  <Space direction="horizontal" size="middle">
                    <ShopOutlined style={{ fontSize: 20, color: "#0284c7" }} />
                    <div style={{ textAlign: "left" }}>
                      <div style={{ fontWeight: 600 }}>Wholesale & B2B</div>
                      <div style={{ fontSize: 12, color: "#64748b" }}>Manufacturer, supplier, or bulk distributor</div>
                    </div>
                  </Space>
                </Radio.Button>
              </Space>
            </Radio.Group>
          </Form.Item>

          <Form.Item style={{ marginTop: 24 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              style={{ background: "#25D366", borderColor: "#25D366", fontWeight: 600 }}
            >
              Create My Workspace
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: "center", marginTop: 16 }}>
          <Text type="secondary">
            Already have an account?{" "}
            <Link href="/login" style={{ color: "#25D366", fontWeight: 600 }}>
              Sign In
            </Link>
          </Text>
        </div>
      </Card>
    </div>
  );
}