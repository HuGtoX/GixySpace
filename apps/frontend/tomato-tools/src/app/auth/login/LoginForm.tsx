"use client";

import React, { useState, useEffect } from "react";
import { Form, Input, Button, Alert, Card, Tabs, message } from "antd";
import { UserOutlined, LockOutlined, MailOutlined } from "@ant-design/icons";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

interface LoginFormData {
  email: string;
  password: string;
}

interface BindEmailFormData {
  email: string;
  code: string;
  password: string;
  confirmPassword: string;
  fullName?: string;
}

interface LoginFormProps {
  onSuccess?: () => void;
}

export default function LoginForm({ onSuccess }: LoginFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sendingCode, setSendingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loginForm] = Form.useForm();
  const [bindForm] = Form.useForm();
  const { login, user, loading: authLoading, bindEmailUpgrade } = useAuth();

  // 根据URL参数判断是否为升级模式
  const isUpgradeMode = searchParams.get("mode") === "upgrade";
  const [activeTab, setActiveTab] = useState(isUpgradeMode ? "bind" : "login");

  // 检查用户是否已登录
  useEffect(() => {
    if (!authLoading && user && !user.isAnonymous) {
      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/");
      }
    }
  }, [user, authLoading, router, onSuccess]);

  // 倒计时效果
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // 处理登录
  const handleLogin = async (values: LoginFormData) => {
    setLoading(true);
    setError(null);

    try {
      await login(values.email, values.password);
      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "登录失败");
    } finally {
      setLoading(false);
    }
  };

  // 发送验证码
  const handleSendCode = async () => {
    try {
      const email = bindForm.getFieldValue("email");
      if (!email) {
        message.error("请先输入邮箱");
        return;
      }

      // 验证邮箱格式
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        message.error("请输入有效的邮箱地址");
        return;
      }

      setSendingCode(true);
      const response = await fetch("/api/auth/send-verification-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "发送验证码失败");
      }

      message.success("验证码已发送到您的邮箱，请查收");
      setCountdown(60);
    } catch (err) {
      message.error(err instanceof Error ? err.message : "发送验证码失败");
    } finally {
      setSendingCode(false);
    }
  };

  // 处理绑定邮箱升级
  const handleBindEmail = async (values: BindEmailFormData) => {
    setLoading(true);
    setError(null);

    try {
      await bindEmailUpgrade(
        values.email,
        values.code,
        values.password,
        values.fullName,
      );

      message.success("绑定成功！您的账号已升级为正式用户");

      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "绑定失败");
    } finally {
      setLoading(false);
    }
  };

  // 如果正在检查认证状态，显示加载状态
  if (authLoading) {
    return (
      <Card className="mx-auto w-full max-w-md">
        <div className="py-8 text-center">
          <div className="text-gray-500 dark:text-gray-400">
            检查登录状态...
          </div>
        </div>
      </Card>
    );
  }

  // 如果用户已登录且不是匿名用户，不显示登录表单
  if (user && !user.isAnonymous) {
    return null;
  }

  // 如果是匿名用户，显示升级界面
  if (user?.isAnonymous) {
    return (
      <Card
        title={
          activeTab === "bind" && (
            <div className="flex items-center gap-2">
              <span className="rounded bg-orange-500 px-2 py-1 text-xs text-white">
                临时账号
              </span>
              <span>升级为正式用户</span>
            </div>
          )
        }
        className="mx-auto w-full max-w-md"
      >
        {error && (
          <Alert
            message={error}
            type="error"
            showIcon
            closable
            onClose={() => setError(null)}
            className="mb-4"
          />
        )}

        {activeTab === "bind" && (
          <Alert
            title="升级优势"
            description={
              <ul className="mt-2 list-inside list-disc space-y-1">
                <li>数据永久保存，不会过期</li>
                <li>解锁更多高级功能</li>
                <li>多设备同步使用</li>
              </ul>
            }
            type="info"
            showIcon
            className="mb-4"
          />
        )}

        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: "bind",
              label: "绑定邮箱升级",
              children: (
                <Form
                  form={bindForm}
                  name="bind-email"
                  onFinish={handleBindEmail}
                  layout="vertical"
                  size="large"
                >
                  <Form.Item
                    name="email"
                    label="邮箱"
                    rules={[
                      { required: true, message: "请输入邮箱" },
                      { type: "email", message: "请输入有效的邮箱地址" },
                    ]}
                  >
                    <Input
                      prefix={<MailOutlined />}
                      placeholder="请输入邮箱"
                      autoComplete="email"
                    />
                  </Form.Item>

                  <Form.Item
                    name="code"
                    label="验证码"
                    rules={[
                      { required: true, message: "请输入验证码" },
                      { len: 6, message: "验证码必须是6位" },
                    ]}
                  >
                    <div className="flex gap-2">
                      <Input
                        placeholder="请输入邮箱收到的6位验证码"
                        maxLength={6}
                        style={{ flex: 1 }}
                      />
                      <Button
                        onClick={handleSendCode}
                        loading={sendingCode}
                        disabled={countdown > 0}
                      >
                        {countdown > 0 ? `${countdown}秒后重试` : "发送验证码"}
                      </Button>
                    </div>
                  </Form.Item>

                  <Form.Item
                    name="password"
                    label="设置密码"
                    rules={[
                      { required: true, message: "请输入密码" },
                      { min: 6, message: "密码至少需要6个字符" },
                    ]}
                  >
                    <Input.Password
                      prefix={<LockOutlined />}
                      placeholder="请输入密码（至少6个字符）"
                      autoComplete="new-password"
                    />
                  </Form.Item>

                  <Form.Item
                    name="confirmPassword"
                    label="确认密码"
                    dependencies={["password"]}
                    rules={[
                      { required: true, message: "请确认密码" },
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          if (!value || getFieldValue("password") === value) {
                            return Promise.resolve();
                          }
                          return Promise.reject(
                            new Error("两次输入的密码不一致"),
                          );
                        },
                      }),
                    ]}
                  >
                    <Input.Password
                      prefix={<LockOutlined />}
                      placeholder="请再次输入密码"
                      autoComplete="new-password"
                    />
                  </Form.Item>

                  <Form.Item name="fullName" label="用户名">
                    <Input
                      prefix={<UserOutlined />}
                      placeholder="请输入昵称"
                      autoComplete="name"
                    />
                  </Form.Item>

                  <Form.Item>
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={loading}
                      className="w-full"
                    >
                      确认升级
                    </Button>
                  </Form.Item>

                  <div className="text-center text-sm text-gray-500 dark:text-gray-400">
                    已有正式账号？{" "}
                    <span
                      className="cursor-pointer text-blue-600 hover:text-blue-800 dark:text-blue-400"
                      onClick={() => setActiveTab("login")}
                    >
                      直接登录
                    </span>
                  </div>
                </Form>
              ),
            },
            {
              key: "login",
              label: "登录已有账号",
              children: (
                <Form
                  form={loginForm}
                  name="login"
                  onFinish={handleLogin}
                  layout="vertical"
                  size="large"
                >
                  <Form.Item
                    name="email"
                    label="邮箱"
                    rules={[
                      { required: true, message: "请输入邮箱" },
                      { type: "email", message: "请输入有效的邮箱地址" },
                    ]}
                  >
                    <Input
                      prefix={<UserOutlined />}
                      placeholder="请输入邮箱"
                      autoComplete="email"
                    />
                  </Form.Item>

                  <Form.Item
                    name="password"
                    label="密码"
                    rules={[{ required: true, message: "请输入密码" }]}
                  >
                    <Input.Password
                      prefix={<LockOutlined />}
                      placeholder="请输入密码"
                      autoComplete="current-password"
                    />
                  </Form.Item>

                  <Form.Item>
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={loading}
                      className="w-full"
                    >
                      登录
                    </Button>
                  </Form.Item>

                  <div className="space-y-2 text-center text-sm">
                    <div>
                      <Link
                        href="/auth/reset-password"
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
                      >
                        忘记密码？
                      </Link>
                    </div>
                  </div>
                </Form>
              ),
            },
          ]}
        />
      </Card>
    );
  }

  // 普通登录界面（未登录用户）
  return (
    <Card title="登录" className="mx-auto w-full max-w-md">
      {error && (
        <Alert
          message={error}
          type="error"
          showIcon
          closable
          onClose={() => setError(null)}
          className="mb-4"
        />
      )}

      <Form
        form={loginForm}
        name="login"
        onFinish={handleLogin}
        layout="vertical"
        size="large"
      >
        <Form.Item
          name="email"
          label="邮箱"
          rules={[
            { required: true, message: "请输入邮箱" },
            { type: "email", message: "请输入有效的邮箱地址" },
          ]}
        >
          <Input
            prefix={<UserOutlined />}
            placeholder="请输入邮箱"
            autoComplete="email"
          />
        </Form.Item>

        <Form.Item
          name="password"
          label="密码"
          rules={[{ required: true, message: "请输入密码" }]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="请输入密码"
            autoComplete="current-password"
          />
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            className="w-full"
          >
            登录
          </Button>
        </Form.Item>

        <div className="space-y-2 text-center">
          <div>
            <Link
              href="/auth/reset-password"
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
            >
              忘记密码？
            </Link>
          </div>
          <div>
            还没有账号？{" "}
            <Link
              href="/auth/register"
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
            >
              立即注册
            </Link>
          </div>
        </div>
      </Form>
    </Card>
  );
}
