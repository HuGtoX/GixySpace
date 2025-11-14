"use client";

import Container from "@/components/toolsLayout/Container";
import Footer from "@/components/toolsLayout/Footer";
import Header from "@/components/toolsLayout/Header";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import AnonymousUserBanner from "@/components/auth/AnonymousUserBanner";
import {
  BellOutlined,
  EyeOutlined,
  GlobalOutlined,
  SaveOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Divider,
  Form,
  message,
  Select,
  Spin,
  Switch,
} from "antd";
import { useRouter } from "next/navigation";
import React, { useState } from "react";

interface SettingsFormData {
  emailNotifications: boolean;
  pushNotifications: boolean;
  language: string;
  timezone: string;
  privacy: string;
}

export default function SettingsPage() {
  const { user, loading } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  // 如果未登录，重定向到登录页
  React.useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login");
    }
  }, [user, loading, router]);

  // 初始化表单数据
  React.useEffect(() => {
    if (user?.profile?.preferences) {
      form.setFieldsValue({
        emailNotifications: user.profile.preferences.emailNotifications ?? true,
        pushNotifications: user.profile.preferences.pushNotifications ?? true,
        language: user.profile.preferences.language ?? "zh-CN",
        timezone: user.profile.preferences.timezone ?? "Asia/Shanghai",
        privacy: user.profile.preferences.privacy ?? "public",
      });
    }
  }, [user, form]);

  const handleSave = async (values: SettingsFormData) => {
    setSaving(true);
    try {
      const response = await fetch("/api/user/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
        credentials: "include",
      });

      if (response.ok) {
        message.success("设置保存成功");
      } else {
        const data = await response.json();
        message.error(data.error || "保存失败");
      }
    } catch (error) {
      console.log(error, "保存失败，请稍后重试");
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
              设置
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              管理您的账户设置和偏好
            </p>
          </div>

          <div className="space-y-6">
            {/* 外观设置 */}
            <Card
              title={
                <>
                  <EyeOutlined className="mr-2" />
                  外观设置
                </>
              }
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-base font-medium text-gray-900 dark:text-white">
                      深色模式
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      切换到深色主题以减少眼部疲劳
                    </p>
                  </div>
                  <Switch
                    checked={isDarkMode}
                    onChange={toggleTheme}
                    checkedChildren="开"
                    unCheckedChildren="关"
                  />
                </div>
              </div>
            </Card>

            {/* 通知设置 */}
            <Card
              title={
                <>
                  <BellOutlined className="mr-2" />
                  通知设置
                </>
              }
            >
              <Form form={form} layout="vertical" onFinish={handleSave}>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-base font-medium text-gray-900 dark:text-white">
                        邮件通知
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        接收重要更新和活动的邮件通知
                      </p>
                    </div>
                    <Form.Item
                      name="emailNotifications"
                      valuePropName="checked"
                      className="mb-0"
                    >
                      <Switch checkedChildren="开" unCheckedChildren="关" />
                    </Form.Item>
                  </div>

                  <Divider className="my-4" />

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-base font-medium text-gray-900 dark:text-white">
                        推送通知
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        接收浏览器推送通知
                      </p>
                    </div>
                    <Form.Item
                      name="pushNotifications"
                      valuePropName="checked"
                      className="mb-0"
                    >
                      <Switch checkedChildren="开" unCheckedChildren="关" />
                    </Form.Item>
                  </div>
                </div>
              </Form>
            </Card>

            {/* 语言和地区设置 */}
            <Card
              title={
                <>
                  <GlobalOutlined className="mr-2" />
                  语言和地区
                </>
              }
            >
              <Form form={form} layout="vertical" onFinish={handleSave}>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Form.Item name="language" label="语言">
                    <Select
                      options={[
                        { label: "简体中文", value: "zh-CN" },
                        { label: "繁體中文", value: "zh-TW" },
                        { label: "English", value: "en-US" },
                        { label: "日本語", value: "ja-JP" },
                      ]}
                    />
                  </Form.Item>

                  <Form.Item name="timezone" label="时区">
                    <Select
                      options={[
                        { label: "北京时间 (UTC+8)", value: "Asia/Shanghai" },
                        { label: "东京时间 (UTC+9)", value: "Asia/Tokyo" },
                        {
                          label: "纽约时间 (UTC-5)",
                          value: "America/New_York",
                        },
                        { label: "伦敦时间 (UTC+0)", value: "Europe/London" },
                      ]}
                    />
                  </Form.Item>
                </div>
              </Form>
            </Card>

            {/* 隐私设置 */}
            <Card
              title={
                <>
                  <SettingOutlined className="mr-2" />
                  隐私设置
                </>
              }
            >
              <Form form={form} layout="vertical" onFinish={handleSave}>
                <Form.Item
                  name="privacy"
                  label="个人资料可见性"
                  help="控制其他用户是否可以查看您的个人资料"
                >
                  <Select
                    options={[
                      { label: "公开 - 所有人可见", value: "public" },
                      { label: "仅好友可见", value: "friends" },
                      { label: "私密 - 仅自己可见", value: "private" },
                    ]}
                  />
                </Form.Item>

                <div className="mt-6">
                  <Button
                    type="primary"
                    icon={<SaveOutlined />}
                    loading={saving}
                    onClick={() => form.submit()}
                    size="large"
                  >
                    保存设置
                  </Button>
                </div>
              </Form>
            </Card>

            {/* 账户管理 */}
            <Card
              title="账户管理"
              className="border-red-200 dark:border-red-800"
            >
              <div className="space-y-4">
                <div>
                  <h4 className="text-base font-medium text-red-600 dark:text-red-400">
                    危险操作
                  </h4>
                  <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                    以下操作将对您的账户产生重大影响，请谨慎操作
                  </p>
                </div>

                <div className="space-y-3">
                  <Button
                    type="default"
                    onClick={() => router.push("/auth/reset-password")}
                  >
                    修改密码
                  </Button>

                  <Button
                    danger
                    onClick={() => {
                      message.warning("此功能暂未开放");
                    }}
                  >
                    删除账户
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </Container>
  );
}
