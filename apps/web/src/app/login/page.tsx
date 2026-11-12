"use client";

import React, { useState } from "react";
import { Form, Input, Button, Card, Typography, Alert, Modal, message, Space } from "antd";
import { UserOutlined, LockOutlined, WhatsAppOutlined } from "@ant-design/icons";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../lib/api";
import { useRouter } from "next/navigation";
import Link from "next/link";

const { Title, Text } = Typography;

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState<"email" | "otp">("email");
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotOtp, setForgotOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);

  const handleRequestOtp = async () => {
    if (!forgotEmail.trim()) {
      setForgotError("Please enter your registered email address");
      return;
    }
    try {
      setForgotLoading(true);
      setForgotError(null);
      const res = await api.post("/api/auth/forgot-password", { email: forgotEmail.trim() });
      message.success(res.data?.message || "6-digit OTP sent to your registered WhatsApp number!");
      setForgotStep("otp");
    } catch (err: any) {
      setForgotError(err.message || "Could not send password reset OTP");
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!forgotOtp.trim() || newPassword.length < 6) {
      setForgotError("Enter the 6-digit OTP and a new password (min 6 characters)");
      return;
    }
    try {
      setForgotLoading(true);
      setForgotError(null);
      const res = await api.post("/api/auth/reset-password", {
        email: forgotEmail.trim(),
        otp: forgotOtp.trim(),
        newPassword,
      });
      message.success(res.data?.message || "Password reset successfully! Please sign in.");
      setForgotOpen(false);
      setForgotStep("email");
      setForgotOtp("");
      setNewPassword("");
    } catch (err: any) {
      setForgotError(err.message || "Invalid or expired OTP");
    } finally {
      setForgotLoading(false);
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);
      setErrorMsg(null);
      await login(values.email, values.password);
      router.push("/dashboard");
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

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: -10, marginBottom: 12 }}>
            <Button
              type="link"
              size="small"
              style={{ padding: 0, color: "#15803d", fontWeight: 500 }}
              onClick={() => {
                setForgotStep("email");
                setForgotError(null);
                setForgotOpen(true);
              }}
            >
              Forgot Password?
            </Button>
          </div>

          <Form.Item style={{ marginTop: 12 }}>
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

      <Modal
        title={
          <Space>
            <WhatsAppOutlined style={{ color: "#25D366" }} />
            <span>Reset Password via WhatsApp OTP</span>
          </Space>
        }
        open={forgotOpen}
        onCancel={() => setForgotOpen(false)}
        footer={null}
        destroyOnClose
      >
        {forgotError && (
          <Alert message={forgotError} type="error" showIcon style={{ marginBottom: 14 }} />
        )}
        {forgotStep === "email" ? (
          <Space direction="vertical" style={{ width: "100%" }} size={12}>
            <Text type="secondary">
              Apna registered email enter karein. GinieSpace Official Support WhatsApp par 6-digit OTP bhejega.
            </Text>
            <Input
              prefix={<UserOutlined />}
              placeholder="name@business.com"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              onPressEnter={handleRequestOtp}
            />
            <Button
              type="primary"
              block
              loading={forgotLoading}
              onClick={handleRequestOtp}
              style={{ background: "#25D366", borderColor: "#25D366", fontWeight: 600 }}
            >
              Send WhatsApp OTP
            </Button>
          </Space>
        ) : (
          <Space direction="vertical" style={{ width: "100%" }} size={12}>
            <Alert
              type="success"
              showIcon
              message={`OTP sent to WhatsApp linked with ${forgotEmail}`}
            />
            <Input
              placeholder="Enter 6-digit OTP"
              maxLength={6}
              value={forgotOtp}
              onChange={(e) => setForgotOtp(e.target.value)}
            />
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="New password (min 6 characters)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              onPressEnter={handleResetPassword}
            />
            <Space style={{ width: "100%", justifyContent: "space-between" }}>
              <Button onClick={() => setForgotStep("email")}>Back</Button>
              <Button
                type="primary"
                loading={forgotLoading}
                onClick={handleResetPassword}
                style={{ background: "#25D366", borderColor: "#25D366", fontWeight: 600 }}
              >
                Update Password
              </Button>
            </Space>
          </Space>
        )}
      </Modal>
    </div>
  );
}