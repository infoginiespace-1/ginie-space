"use client";

import React, { useState, useEffect } from "react";
import { Form, Input, Button, Card, Typography, Alert, Modal, message, Space, Tag } from "antd";
import { PhoneOutlined, LockOutlined, WhatsAppOutlined, ArrowLeftOutlined, KeyOutlined, UserOutlined } from "@ant-design/icons";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../lib/api";
import { useRouter } from "next/navigation";
import Link from "next/link";

const { Title, Text, Paragraph } = Typography;

export default function LoginPage() {
  const { loginWithOtp, login } = useAuth();
  const router = useRouter();

  // Primary WhatsApp OTP State
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [timer, setTimer] = useState(0);

  // Emergency Admin Password Login State
  const [emergencyOpen, setEmergencyOpen] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPass, setAdminPass] = useState("");
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState<string | null>(null);

  // Countdown timer for OTP resend
  useEffect(() => {
    let interval: any = null;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  // Request WhatsApp OTP
  const handleSendOtp = async () => {
    const cleanDigits = phone.replace(/\D/g, "").slice(-10);
    if (!cleanDigits || cleanDigits.length < 10) {
      setErrorMsg("Kripya 10-digit ka valid WhatsApp mobile number dalein.");
      return;
    }

    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await api.post("/api/auth/send-otp", {
        phone: cleanDigits,
        purpose: "login",
      });

      message.success(res.data?.message || "WhatsApp par 6-digit OTP bhej diya gaya hai!");
      setStep("otp");
      setTimer(60);
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || "OTP bhejne me dikkat aayi. Kripya number check karein.";
      setErrorMsg(msg);
      if (err.response?.data?.notRegistered) {
        message.info("Aapka account nahi mila. Naya store banane ke liye Sign Up karein.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Verify WhatsApp OTP & Instant Sign In
  const handleVerifyOtp = async () => {
    const cleanDigits = phone.replace(/\D/g, "").slice(-10);
    const cleanOtp = otp.trim();

    if (!cleanOtp || cleanOtp.length < 6) {
      setErrorMsg("Kripya 6-digit ka OTP enter karein.");
      return;
    }

    try {
      setLoading(true);
      setErrorMsg(null);
      await loginWithOtp(cleanDigits, cleanOtp);
      message.success("Login Successful! GinieSpace me aapka swagat hai.");
      router.push("/dashboard");
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || err.message || "Galat OTP! Kripya apna WhatsApp check karein.");
    } finally {
      setLoading(false);
    }
  };

  // Emergency Admin Password Login Handler
  const handleEmergencyAdminLogin = async () => {
    if (!adminEmail.trim() || !adminPass.trim()) {
      setAdminError("Please enter both Admin Email and Password.");
      return;
    }
    try {
      setAdminLoading(true);
      setAdminError(null);
      await login(adminEmail.trim(), adminPass.trim());
      message.success("Welcome back, Master Admin!");
      setEmergencyOpen(false);
      router.push("/admin");
    } catch (err: any) {
      setAdminError(err.response?.data?.error || err.message || "Invalid Admin credentials.");
    } finally {
      setAdminLoading(false);
    }
  };

  const maskedPhone = phone.replace(/\D/g, "").slice(-10);
  const displayMasked = maskedPhone.length >= 10 ? `+91 ${maskedPhone.slice(0, 2)}******${maskedPhone.slice(-2)}` : phone;

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #f0fdf4 0%, #e2e8f0 100%)",
        padding: 20,
      }}
    >
      <Card
        style={{
          width: "100%",
          maxWidth: 440,
          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)",
          borderRadius: 16,
          border: "1px solid #e2e8f0",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <picture>
            <source type="image/webp" srcSet="/logo-sm.webp" />
            <img
              src="/logo-sm.webp"
              alt="GinieSpace Logo"
              width={52}
              height={52}
              style={{
                width: 52,
                height: 52,
                borderRadius: 12,
                objectFit: "contain",
                margin: "0 auto 12px",
                display: "block",
              }}
            />
          </picture>
          <Title level={3} style={{ margin: 0, color: "#0f172a", fontSize: 22 }}>
            Welcome to GinieSpace
          </Title>
          <Text type="secondary" style={{ fontSize: 13 }}>
            Apne WhatsApp Mobile Number se turant sign in karein
          </Text>
        </div>

        {errorMsg && (
          <Alert
            message={errorMsg}
            type="error"
            showIcon
            closable
            onClose={() => setErrorMsg(null)}
            style={{ marginBottom: 18 }}
          />
        )}

        {step === "phone" ? (
          <div>
            <div style={{ marginBottom: 16 }}>
              <Text strong style={{ fontSize: 13, color: "#334155", display: "block", marginBottom: 6 }}>
                WhatsApp Mobile Number
              </Text>
              <Input
                size="large"
                prefix={<span style={{ fontWeight: 600, color: "#16a34a", marginRight: 4 }}>+91</span>}
                placeholder="10-digit WhatsApp number"
                maxLength={10}
                value={phone}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "");
                  setPhone(val);
                }}
                onPressEnter={handleSendOtp}
                autoFocus
                style={{ borderRadius: 8, fontSize: 16 }}
              />
              <Text type="secondary" style={{ fontSize: 11, marginTop: 4, display: "block" }}>
                Hum aapke isi WhatsApp number par 6-digit ka login OTP bhejenge.
              </Text>
            </div>

            <Button
              type="primary"
              size="large"
              block
              icon={<WhatsAppOutlined />}
              loading={loading}
              onClick={handleSendOtp}
              style={{
                background: "#25D366",
                borderColor: "#25D366",
                fontWeight: 600,
                height: 46,
                fontSize: 15,
                borderRadius: 8,
              }}
            >
              Send WhatsApp OTP
            </Button>
          </div>
        ) : (
          <div>
            <div
              style={{
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                borderRadius: 10,
                padding: "12px 14px",
                marginBottom: 18,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <Text type="secondary" style={{ fontSize: 11, display: "block" }}>
                  OTP Sent via WhatsApp to:
                </Text>
                <Text strong style={{ color: "#166534", fontSize: 14 }}>
                  {displayMasked}
                </Text>
              </div>
              <Button
                size="small"
                type="link"
                icon={<ArrowLeftOutlined />}
                onClick={() => {
                  setStep("phone");
                  setOtp("");
                  setErrorMsg(null);
                }}
                style={{ padding: 0, color: "#15803d" }}
              >
                Change Number
              </Button>
            </div>

            <div style={{ marginBottom: 18 }}>
              <Text strong style={{ fontSize: 13, color: "#334155", display: "block", marginBottom: 6 }}>
                Enter 6-Digit OTP Code
              </Text>
              <Input
                size="large"
                placeholder="• • • • • •"
                maxLength={6}
                value={otp}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "");
                  setOtp(val);
                }}
                onPressEnter={handleVerifyOtp}
                autoFocus
                style={{
                  borderRadius: 8,
                  fontSize: 22,
                  textAlign: "center",
                  letterSpacing: 10,
                  fontWeight: 700,
                  color: "#065f46",
                }}
              />
            </div>

            <Button
              type="primary"
              size="large"
              block
              loading={loading}
              onClick={handleVerifyOtp}
              disabled={otp.length < 6}
              style={{
                background: "#25D366",
                borderColor: "#25D366",
                fontWeight: 600,
                height: 46,
                fontSize: 15,
                borderRadius: 8,
                marginBottom: 12,
              }}
            >
              Verify & Sign In
            </Button>

            <div style={{ textAlign: "center" }}>
              {timer > 0 ? (
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Resend OTP in <span style={{ fontWeight: 600, color: "#065f46" }}>{timer}s</span>
                </Text>
              ) : (
                <Button
                  type="link"
                  size="small"
                  onClick={handleSendOtp}
                  loading={loading}
                  style={{ color: "#15803d", fontWeight: 600 }}
                >
                  Resend WhatsApp OTP
                </Button>
              )}
            </div>
          </div>
        )}

        <div style={{ textAlign: "center", marginTop: 22, borderTop: "1px solid #f1f5f9", paddingTop: 16 }}>
          <Text type="secondary" style={{ fontSize: 13 }}>
            Nayi digital dukan shuru karna chahte hain?{" "}
            <Link href="/signup" style={{ color: "#16a34a", fontWeight: 700 }}>
              Free Sign Up Karein ↗
            </Link>
          </Text>
        </div>

        {/* Discreet Emergency Admin Access */}
        <div style={{ textAlign: "center", marginTop: 12 }}>
          <Button
            type="link"
            size="small"
            icon={<KeyOutlined />}
            onClick={() => {
              setAdminError(null);
              setEmergencyOpen(true);
            }}
            style={{ fontSize: 11, color: "#94a3b8" }}
          >
            Admin Emergency Access
          </Button>
        </div>
      </Card>

      {/* Emergency Admin Login Modal */}
      <Modal
        title={
          <Space>
            <KeyOutlined style={{ color: "#d97706" }} />
            <span>Master Admin Emergency Access</span>
          </Space>
        }
        open={emergencyOpen}
        onCancel={() => setEmergencyOpen(false)}
        footer={null}
        width={400}
        centered
        destroyOnClose
      >
        <div style={{ padding: "8px 0" }}>
          <Paragraph type="secondary" style={{ fontSize: 12, marginBottom: 14 }}>
            Agar Official WhatsApp bot offline ho to Master Admin password se access le sakte hain.
          </Paragraph>

          {adminError && (
            <Alert message={adminError} type="error" showIcon style={{ marginBottom: 12 }} />
          )}

          <div style={{ marginBottom: 12 }}>
            <Text strong style={{ fontSize: 12, display: "block", marginBottom: 4 }}>
              Admin Email
            </Text>
            <Input
              prefix={<UserOutlined />}
              placeholder="info.giniespace@gmail.com"
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <Text strong style={{ fontSize: 12, display: "block", marginBottom: 4 }}>
              Master Password
            </Text>
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="••••••••"
              value={adminPass}
              onChange={(e) => setAdminPass(e.target.value)}
              onPressEnter={handleEmergencyAdminLogin}
            />
          </div>

          <Button
            type="primary"
            block
            loading={adminLoading}
            onClick={handleEmergencyAdminLogin}
            style={{ background: "#0f172a", borderColor: "#0f172a", fontWeight: 600 }}
          >
            Sign In As Admin
          </Button>
        </div>
      </Modal>
    </div>
  );
}
