"use client";

import React, { useState, useEffect } from "react";
import { AppLayout } from "../../components/AppLayout";
import { Card, Table, Tag, Typography, message, Statistic, Row, Col } from "antd";
import { UserOutlined, ShopOutlined, CheckCircleOutlined } from "@ant-design/icons";
import { api } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";

const { Title, Text } = Typography;

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
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && user.role !== "admin") {
      router.replace("/inbox");
      return;
    }

    api.get("/api/settings/users")
      .then((res) => setUsers(res.data.users || []))
      .catch(() => message.error("Could not load users list"))
      .finally(() => setLoading(false));
  }, [user, router]);

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
        <Text type="secondary">Overview of all active businesses, users, and system metrics</Text>
      </div>

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
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </AppLayout>
  );
}