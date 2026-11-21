"use client";

import React, { useState, useEffect } from "react";
import { Form, Input, Button, Card, Typography, Alert, Radio, Space, message, Row, Col } from "antd";
import {
  UserOutlined,
  WhatsAppOutlined,
  ShopOutlined,
  SkinOutlined,
  CoffeeOutlined,
  HomeOutlined,
  ToolOutlined,
  AppstoreOutlined,
  ArrowLeftOutlined,
  RocketOutlined,
} from "@ant-design/icons";
import { useAuth, BusinessType } from "../../context/AuthContext";
import { api } from "../../lib/api";
import { useRouter } from "next/navigation";
import Link from "next/link";

const { Title, Text, Paragraph } = Typography;

export default function SignupPage() {
  const { signupWithOtp } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState<"details" | "otp">("details");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [businessType, setBusinessType] = useState<BusinessType>("retail");
  const [otp, setOtp] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [timer, setTimer] = useState(0);

  // 60-second OTP Resend Countdown
  useEffect(() => {
    let interval: any = null;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  // Request WhatsApp OTP for Signup
  const handleRequestOtp = async () => {
    if (!name.trim()) {
      setErrorMsg("Kripya apna naam ya dukan ka naam enter karein.");
      return;
    }
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
        purpose: "signup",
      });

      message.success(res.data?.message || "WhatsApp par 6-digit OTP bhej diya gaya hai!");
      setStep("otp");
      setTimer(60);
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || "OTP bhejne me samasya aayi. Kripya check karein.";
      setErrorMsg(msg);
      if (err.response?.data?.alreadyRegistered) {
        message.info("Aapka account pehle se bana hua hai. Kripya Sign In karein.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP & Launch Store
  const handleVerifySignup = async () => {
    const cleanDigits = phone.replace(/\D/g, "").slice(-10);
    const cleanOtp = otp.trim();

    if (!cleanOtp || cleanOtp.length < 6) {
      setErrorMsg("Kripya 6-digit ka WhatsApp OTP code dalein.");
      return;
    }

    try {
      setLoading(true);
      setErrorMsg(null);
      await signupWithOtp(cleanDigits, cleanOtp, name.trim(), businessType);
      message.success("Badhai ho! Aapka digital store activate ho gaya hai.");
      router.push("/dashboard");
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || err.message || "Galat OTP! Kripya dobara check karein.");
    } finally {
      setLoading(false);
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
        padding: "24px 16px",
      }}
    >
      <Card
        style={{
          width: "100%",
          maxWidth: 540,
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
            Start Your Digital Dukan
          </Title>
          <Text type="secondary" style={{ fontSize: 13 }}>
            100% Free Lifetime Platform · WhatsApp OTP Verification
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

        {step === "details" ? (
          <div>
            <div style={{ marginBottom: 14 }}>
              <Text strong style={{ fontSize: 13, color: "#334155", display: "block", marginBottom: 6 }}>
                Your Name or Shop Name (दुकान / व्यापारी का नाम)
              </Text>
              <Input
                size="large"
                prefix={<UserOutlined style={{ color: "#94a3b8" }} />}
                placeholder="उदा. Ramesh Gupta ya Gupta General Store"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{ borderRadius: 8 }}
                autoFocus
              />
            </div>

            <div style={{ marginBottom: 18 }}>
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
                onPressEnter={handleRequestOtp}
                style={{ borderRadius: 8, fontSize: 16 }}
              />
              <Text type="secondary" style={{ fontSize: 11, marginTop: 4, display: "block" }}>
                GinieSpace isi number par instant verification code aur dukan ka link bhejega.
              </Text>
            </div>

            <div style={{ marginBottom: 22 }}>
              <Text strong style={{ fontSize: 13, color: "#334155", display: "block", marginBottom: 8 }}>
                Select Business Category (व्यापार का प्रकार)
              </Text>
              <Radio.Group
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
                style={{ width: "100%" }}
              >
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <Radio.Button
                    value="retail"
                    style={{
                      width: "100%",
                      height: "auto",
                      padding: "10px 12px",
                      borderRadius: 8,
                      borderColor: businessType === "retail" ? "#16a34a" : undefined,
                    }}
                  >
                    <Space direction="vertical" size={2} style={{ width: "100%", textAlign: "left" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <ShopOutlined style={{ fontSize: 16, color: "#16a34a" }} />
                        <span style={{ fontWeight: 600, fontSize: 12 }}>Retail & Kirana</span>
                      </div>
                      <div style={{ fontSize: 10, color: "#64748b" }}>Daily grocery, dairy & general items</div>
                    </Space>
                  </Radio.Button>

                  <Radio.Button
                    value="garments"
                    style={{
                      width: "100%",
                      height: "auto",
                      padding: "10px 12px",
                      borderRadius: 8,
                      borderColor: businessType === "garments" ? "#16a34a" : undefined,
                    }}
                  >
                    <Space direction="vertical" size={2} style={{ width: "100%", textAlign: "left" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <SkinOutlined style={{ fontSize: 16, color: "#ec4899" }} />
                        <span style={{ fontWeight: 600, fontSize: 12 }}>Garments & Wear</span>
                      </div>
                      <div style={{ fontSize: 10, color: "#64748b" }}>Clothes, shoes & fashion accessories</div>
                    </Space>
                  </Radio.Button>

                  <Radio.Button
                    value="wholesale"
                    style={{
                      width: "100%",
                      height: "auto",
                      padding: "10px 12px",
                      borderRadius: 8,
                      borderColor: businessType === "wholesale" ? "#16a34a" : undefined,
                    }}
                  >
                    <Space direction="vertical" size={2} style={{ width: "100%", textAlign: "left" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <AppstoreOutlined style={{ fontSize: 16, color: "#2563eb" }} />
                        <span style={{ fontWeight: 600, fontSize: 12 }}>Wholesale & B2B</span>
                      </div>
                      <div style={{ fontSize: 10, color: "#64748b" }}>Bulk carton pricing & distributors</div>
                    </Space>
                  </Radio.Button>

                  <Radio.Button
                    value="restaurant"
                    style={{
                      width: "100%",
                      height: "auto",
                      padding: "10px 12px",
                      borderRadius: 8,
                      borderColor: businessType === "restaurant" ? "#16a34a" : undefined,
                    }}
                  >
                    <Space direction="vertical" size={2} style={{ width: "100%", textAlign: "left" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <CoffeeOutlined style={{ fontSize: 16, color: "#ea580c" }} />
                        <span style={{ fontWeight: 600, fontSize: 12 }}>Cafe & Sweets</span>
                      </div>
                      <div style={{ fontSize: 10, color: "#64748b" }}>Food delivery, mithai & bakery</div>
                    </Space>
                  </Radio.Button>

                  <Radio.Button
                    value="services"
                    style={{
                      width: "100%",
                      height: "auto",
                      padding: "10px 12px",
                      borderRadius: 8,
                      borderColor: businessType === "services" ? "#16a34a" : undefined,
                    }}
                  >
                    <Space direction="vertical" size={2} style={{ width: "100%", textAlign: "left" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <ToolOutlined style={{ fontSize: 16, color: "#0891b2" }} />
                        <span style={{ fontWeight: 600, fontSize: 12 }}>Services & Salon</span>
                      </div>
                      <div style={{ fontSize: 10, color: "#64748b" }}>Repairs, salons, beauty & clinic</div>
                    </Space>
                  </Radio.Button>

                  <Radio.Button
                    value="hotel"
                    style={{
                      width: "100%",
                      height: "auto",
                      padding: "10px 12px",
                      borderRadius: 8,
                      borderColor: businessType === "hotel" ? "#16a34a" : undefined,
                    }}
                  >
                    <Space direction="vertical" size={2} style={{ width: "100%", textAlign: "left" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <HomeOutlined style={{ fontSize: 16, color: "#7c3aed" }} />
                        <span style={{ fontWeight: 600, fontSize: 12 }}>Hotel & Rooms</span>
                      </div>
                      <div style={{ fontSize: 10, color: "#64748b" }}>Room booking & guest house</div>
                    </Space>
                  </Radio.Button>
                </div>
              </Radio.Group>
            </div>

            <Button
              type="primary"
              size="large"
              block
              icon={<WhatsAppOutlined />}
              loading={loading}
              onClick={handleRequestOtp}
              style={{
                background: "#25D366",
                borderColor: "#25D366",
                fontWeight: 600,
                height: 48,
                fontSize: 15,
                borderRadius: 8,
              }}
            >
              Get WhatsApp OTP
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
                  Verification Code Sent to WhatsApp:
                </Text>
                <Text strong style={{ color: "#166534", fontSize: 14 }}>
                  {displayMasked} ({name})
                </Text>
              </div>
              <Button
                size="small"
                type="link"
                icon={<ArrowLeftOutlined />}
                onClick={() => {
                  setStep("details");
                  setOtp("");
                  setErrorMsg(null);
                }}
                style={{ padding: 0, color: "#15803d" }}
              >
                Edit
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
                onPressEnter={handleVerifySignup}
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
              icon={<RocketOutlined />}
              loading={loading}
              onClick={handleVerifySignup}
              disabled={otp.length < 6}
              style={{
                background: "#25D366",
                borderColor: "#25D366",
                fontWeight: 600,
                height: 48,
                fontSize: 15,
                borderRadius: 8,
                marginBottom: 12,
              }}
            >
              Verify & Launch My Digital Store 🚀
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
                  onClick={handleRequestOtp}
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
            Pehle se account bana hua hai?{" "}
            <Link href="/login" style={{ color: "#16a34a", fontWeight: 700 }}>
              Sign In Karein ↗
            </Link>
          </Text>
        </div>
      </Card>
    </div>
  );
}
