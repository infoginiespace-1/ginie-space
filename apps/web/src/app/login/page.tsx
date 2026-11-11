"use client";

import React, { useState } from "react";
import { Form, Input, Button, Card, Typography, Alert } from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";

const { Title, Text } = Typography;

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);
      setErrorMsg(null);
      await login(values.email, values.password);
      router.push("/inbox");
    } catch (err: any) {
      setErrorMsg(err.message || "Could not sign in. Please check your credentials.");
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
          maxWidth: 420,
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
          <Title level={3} style={{ margin: 0, color: "#0f172a" }}>Welcome to GinieSpace</Title>
          <Text type="secondary">Sign in to your automated WhatsApp business hub</Text>
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

        <Form layout="vertical" onFinish={handleSubmit} size="large">
          <Form.Item
            name="email"
            label="Email Address"
            rules={[
              { required: true, message: "Please enter your email" },
              { type: "email", message: "Please enter a valid email address" },
            ]}
          >
            <Input prefix={<UserOutlined style={{ color: "#94a3b8" }} />} placeholder="name@company.com" />
          </Form.Item>

          <Form.Item
            name="password"
            label="Password"
            rules={[{ required: true, message: "Please enter your password" }]}
          >
            <Input.Password prefix={<LockOutlined style={{ color: "#94a3b8" }} />} placeholder="••••••••" />
          </Form.Item>

          <Form.Item style={{ marginTop: 24 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              style={{ background: "#25D366", borderColor: "#25D366", fontWeight: 600 }}
            >
              Sign In
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: "center", marginTop: 16 }}>
          <Text type="secondary">
            Do not have an account yet?{" "}
            <Link href="/signup" style={{ color: "#25D366", fontWeight: 600 }}>
              Create Account
            </Link>
          </Text>
        </div>
      </Card>
    </div>
  );
}