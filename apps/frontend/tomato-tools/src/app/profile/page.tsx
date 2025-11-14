"use client";

import React, { useState } from "react";
import {
  Card,
  Avatar,
  Descriptions,
  Button,
  Form,
  Input,
  message,
  Spin,
} from "antd";
import {
  UserOutlined,
  EditOutlined,
  SaveOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import Header from "@/components/toolsLayout/Header";
import Footer from "@/components/toolsLayout/Footer";
import Container from "@/components/toolsLayout/Container";
import AnonymousUserBanner from "@/components/auth/AnonymousUserBanner";

interface ProfileFormData {
  fullName: string;
  bio?: string;
  website?: string;
  location?: string;
}

export default function ProfilePage() {
  const { user, loading, refreshUser } = useAuth();
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  // 如果未登录，重定向到登录页
  React.useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login");
    }
  }, [user, loading, router]);

  const handleEdit = () => {
    setEditing(true);
    form.setFieldsValue({
      fullName: user?.fullName || "",
      bio: user?.profile?.bio || "",
      website: user?.profile?.website || "",
      location: user?.profile?.location || "",
    });
  };

  const handleCancel = () => {
    setEditing(false);
    form.resetFields();
  };

  const handleSave = async (values: ProfileFormData) => {
    setSaving(true);
    try {
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
        credentials: "include",
      });

      if (response.ok) {
        message.success("个人资料更新成功");
        await refreshUser();
        setEditing(false);
      } else {
        const data = await response.json();
        message.error(data.error || "更新失败");
      }
    } catch (error) {
      console.log("更新失败：", error);
      message.error("更新失败，请稍后重试");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Container>
        <Header />
        <div className="flex min-h-screen items-center justify-center">
          <Spin size="large" />
        </div>
        <Footer />
      </Container>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <Container>
      <Header />
      <main className="container mx-auto px-4 py-8 pb-24">
        <div className="mx-auto max-w-4xl">
          {/* 临时账号提示横幅 */}
          <AnonymousUserBanner />

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              个人资料
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              管理您的个人信息和偏好设置
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* 头像和基本信息 */}
            <Card className="lg:col-span-1">
              <div className="flex flex-col items-center space-y-4">
                <Avatar
                  size={120}
                  src={user.avatarUrl}
                  icon={<UserOutlined />}
                  className="border-4 border-orange-500 dark:border-dark-primary"
                />
                <div className="text-center">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {user.fullName || "未设置姓名"}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {user.email}
                  </p>
                  <div className="mt-2">
                    {user.emailConfirmed ? (
                      <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
                        邮箱已验证
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-medium text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                        邮箱待验证
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Card>

            {/* 详细信息 */}
            <Card
              title="详细信息"
              className="lg:col-span-2"
              extra={
                !editing ? (
                  <Button
                    type="primary"
                    icon={<EditOutlined />}
                    onClick={handleEdit}
                  >
                    编辑
                  </Button>
                ) : (
                  <div className="space-x-2">
                    <Button icon={<CloseOutlined />} onClick={handleCancel}>
                      取消
                    </Button>
                    <Button
                      type="primary"
                      icon={<SaveOutlined />}
                      loading={saving}
                      onClick={() => form.submit()}
                    >
                      保存
                    </Button>
                  </div>
                )
              }
            >
              {editing ? (
                <Form form={form} layout="vertical" onFinish={handleSave}>
                  <Form.Item
                    name="fullName"
                    label="姓名"
                    rules={[{ required: true, message: "请输入姓名" }]}
                  >
                    <Input placeholder="请输入您的姓名" />
                  </Form.Item>

                  <Form.Item name="bio" label="个人简介">
                    <Input.TextArea
                      rows={3}
                      placeholder="介绍一下您自己..."
                      maxLength={200}
                      showCount
                    />
                  </Form.Item>

                  <Form.Item
                    name="website"
                    label="个人网站"
                    rules={[{ type: "url", message: "请输入有效的网址" }]}
                  >
                    <Input placeholder="https://example.com" />
                  </Form.Item>

                  <Form.Item name="location" label="所在地">
                    <Input placeholder="请输入您的所在地" />
                  </Form.Item>
                </Form>
              ) : (
                <Descriptions column={1} size="middle">
                  <Descriptions.Item label="姓名">
                    {user.fullName || "未设置"}
                  </Descriptions.Item>
                  <Descriptions.Item label="邮箱">
                    {user.email}
                  </Descriptions.Item>
                  <Descriptions.Item label="个人简介">
                    {user.profile?.bio || "未设置"}
                  </Descriptions.Item>
                  <Descriptions.Item label="个人网站">
                    {user.profile?.website ? (
                      <a
                        href={user.profile.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        {user.profile.website}
                      </a>
                    ) : (
                      "未设置"
                    )}
                  </Descriptions.Item>
                  <Descriptions.Item label="所在地">
                    {user.profile?.location || "未设置"}
                  </Descriptions.Item>
                  <Descriptions.Item label="角色">
                    {user.role === "admin" ? "管理员" : "用户"}
                  </Descriptions.Item>
                  <Descriptions.Item label="账户状态">
                    {user.isActive ? (
                      <span className="text-green-600 dark:text-green-400">
                        活跃
                      </span>
                    ) : (
                      <span className="text-red-600 dark:text-red-400">
                        已禁用
                      </span>
                    )}
                  </Descriptions.Item>
                  <Descriptions.Item label="注册时间">
                    {user.createdAt
                      ? new Date(user.createdAt).toLocaleDateString("zh-CN")
                      : "未知"}
                  </Descriptions.Item>
                </Descriptions>
              )}
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </Container>
  );
}
