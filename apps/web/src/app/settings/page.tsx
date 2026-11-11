"use client";

import React, { useState, useEffect } from "react";
import { AppLayout } from "../../components/AppLayout";
import { Card, Form, Input, Button, Switch, Typography, message, Divider } from "antd";
import { SaveOutlined } from "@ant-design/icons";
import { api } from "../../lib/api";

const { Title, Text } = Typography;

export default function SettingsPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get("/api/settings")
      .then((res) => {
        const b = res.data.business || {};
        let parsedSettings = { autoReply: true, welcomeMessage: "Hello! Welcome to our store." };
        if (b.settingsJson) {
          try {
            parsedSettings = JSON.parse(b.settingsJson);
          } catch {}
        }
        form.setFieldsValue({
          name: b.name || "",
          phone: b.phone || "",
          address: b.address || "",
          autoReply: parsedSettings.autoReply,
          welcomeMessage: parsedSettings.welcomeMessage,
        });
      })
      .catch(() => message.error("Could not load settings"))
      .finally(() => setLoading(false));
  }, [form]);

  const handleSave = async (values: any) => {
    try {
      setSaving(true);
      const settingsJson = JSON.stringify({
        autoReply: values.autoReply,
        welcomeMessage: values.welcomeMessage,
      });

      await api.put("/api/settings/business", {
        name: values.name,
        phone: values.phone,
        address: values.address,
        settingsJson,
      });

      message.success("Settings saved successfully!");
    } catch (err: any) {
      message.error(err.message || "Failed to update settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout>
      <div style={{ marginBottom: 20 }}>
        <Title level={4} style={{ margin: 0 }}>Business Settings</Title>
        <Text type="secondary">Customize your profile, business details, and automated WhatsApp responses</Text>
      </div>

      <Card style={{ maxWidth: 680, borderRadius: 12 }}>
        <Form form={form} layout="vertical" onFinish={handleSave} disabled={loading}>
          <Title level={5}>Business Profile</Title>
          <Form.Item name="name" label="Business Name" rules={[{ required: true, message: "Enter business name" }]}>
            <Input placeholder="e.g. Ginie Retail Store" />
          </Form.Item>

          <Form.Item name="phone" label="Official Support / Contact Phone">
            <Input placeholder="e.g. +91 98765 43210" />
          </Form.Item>

          <Form.Item name="address" label="Store / Office Address">
            <Input.TextArea rows={2} placeholder="Shop 12, Main Market, MG Road..." />
          </Form.Item>

          <Divider />

          <Title level={5}>WhatsApp Automation</Title>
          <Form.Item
            name="autoReply"
            label="Enable Automated Welcome Message"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item
            name="welcomeMessage"
            label="Automated Greeting for First-Time Callers"
          >
            <Input.TextArea
              rows={3}
              placeholder="Hello! Thank you for reaching out to us on WhatsApp. How can we assist you today?"
            />
          </Form.Item>

          <Form.Item style={{ marginTop: 24 }}>
            <Button
              type="primary"
              htmlType="submit"
              icon={<SaveOutlined />}
              loading={saving}
              size="large"
              style={{ background: "#25D366", borderColor: "#25D366", fontWeight: 600 }}
            >
              Save Settings
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </AppLayout>
  );
}