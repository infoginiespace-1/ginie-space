"use client";

import React, { useState, useEffect } from "react";
import { Modal, Switch, Slider, Segmented, Button, Space, Typography, Tag, Card, Divider } from "antd";
import { SoundOutlined, CheckCircleFilled, PlayCircleOutlined, SettingOutlined } from "@ant-design/icons";
import { getSoundboxSettings, saveSoundboxSettings, SoundboxSettings, announceOrderSoundbox } from "../lib/soundbox";

const { Text, Title, Paragraph } = Typography;

interface SoundboxModalProps {
  open: boolean;
  onClose: () => void;
}

export function SoundboxModal({ open, onClose }: SoundboxModalProps) {
  const [settings, setSettings] = useState<SoundboxSettings>({
    enabled: true,
    language: "hi",
    volume: 1.0,
    announceAmount: true,
  });
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    if (open) {
      setSettings(getSoundboxSettings());
    }
  }, [open]);

  const updateSettings = (patch: Partial<SoundboxSettings>) => {
    const updated = { ...settings, ...patch };
    setSettings(updated);
    saveSoundboxSettings(updated);
  };

  const handleTestSoundbox = () => {
    setTesting(true);
    announceOrderSoundbox(250);
    setTimeout(() => {
      setTesting(false);
    }, 2800);
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={[
        <Button key="close" type="primary" onClick={onClose} style={{ background: "#059669", borderColor: "#059669" }}>
          Done (सेव करें)
        </Button>,
      ]}
      width={480}
      title={
        <Space align="center">
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              background: "#dcfce7",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <SoundOutlined style={{ fontSize: 18, color: "#15803d" }} />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>
              Audio Soundbox (फ़ोन बनेगा साउंडबॉक्स)
            </div>
            <div style={{ fontSize: 11, color: "#64748b" }}>Counter Voice Payment & Order Alerts</div>
          </div>
        </Space>
      }
    >
      <div style={{ padding: "8px 0" }}>
        {/* Banner */}
        <Card
          size="small"
          style={{
            marginBottom: 16,
            borderRadius: 10,
            background: settings.enabled ? "#f0fdf4" : "#f8fafc",
            border: settings.enabled ? "1px solid #86efac" : "1px solid #e2e8f0",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <Text strong style={{ fontSize: 14, color: settings.enabled ? "#166534" : "#475569" }}>
                {settings.enabled ? "🔊 Soundbox Active (चालू है)" : "🔇 Soundbox Muted (बंद है)"}
              </Text>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                {settings.enabled
                  ? "नया ऑर्डर या पेमेंट आने पर फोन स्पीकर से वॉइस अलर्ट आएगा"
                  : "वॉइस अलर्ट म्यूट कर दिया गया है"}
              </div>
            </div>
            <Switch
              checked={settings.enabled}
              onChange={(enabled) => updateSettings({ enabled })}
              style={{ background: settings.enabled ? "#10b981" : undefined }}
            />
          </div>
        </Card>

        {/* Controls */}
        <Space direction="vertical" size={14} style={{ width: "100%" }}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <Text strong style={{ fontSize: 13 }}>वॉइस की भाषा (Voice Language):</Text>
              <Tag color="cyan">{settings.language === "hi" ? "हिन्दी (Indian Voice)" : "English (Indian Accent)"}</Tag>
            </div>
            <Segmented
              block
              value={settings.language}
              onChange={(val) => updateSettings({ language: val as "hi" | "en" })}
              options={[
                { label: "🇮🇳 हिन्दी (Hindi)", value: "hi" },
                { label: "🌐 English", value: "en" },
              ]}
              disabled={!settings.enabled}
            />
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <Text strong style={{ fontSize: 13 }}>साउंड वॉल्यूम (Volume):</Text>
              <Text type="secondary" style={{ fontSize: 12 }}>{Math.round(settings.volume * 100)}%</Text>
            </div>
            <Slider
              min={0.1}
              max={1.0}
              step={0.1}
              value={settings.volume}
              onChange={(volume) => updateSettings({ volume })}
              disabled={!settings.enabled}
            />
          </div>

          <Divider style={{ margin: "8px 0" }} />

          {/* Test Soundbox Button */}
          <div
            style={{
              background: "#fafafa",
              padding: 14,
              borderRadius: 10,
              border: "1px dashed #cbd5e1",
              textAlign: "center",
            }}
          >
            <Paragraph style={{ margin: "0 0 10px", fontSize: 12, color: "#64748b" }}>
              चेक करें कि आपके फोन/कंप्यूटर के स्पीकर से आवाज ठीक से आ रही है:
            </Paragraph>
            <Button
              type="primary"
              icon={<PlayCircleOutlined />}
              loading={testing}
              onClick={handleTestSoundbox}
              disabled={!settings.enabled}
              style={{
                background: "#059669",
                borderColor: "#059669",
                height: 40,
                fontWeight: 600,
                borderRadius: 20,
                padding: "0 24px",
              }}
            >
              🔊 Test Soundbox (साउंड टेस्ट करें)
            </Button>
          </div>
        </Space>
      </div>
    </Modal>
  );
}
