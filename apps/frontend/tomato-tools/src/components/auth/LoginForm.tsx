"use client";

import React, { useState, useEffect } from "react";
import { Form, Input, Button, Alert, Card } from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
interface LoginFormData {
  email: string;
  password: string;
}

interface LoginFormProps {
  onSuccess?: () => void;
}

export default function LoginForm({ onSuccess }: LoginFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const [form] = Form.useForm();
  const { login, user, loading: authLoading } = useAuth();

  // 检查用户是否已登录，如果已登录则跳转首页
  useEffect(() => {
    if (!authLoading && user) {
      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/");
      }
    }
  }, [user, authLoading, router, onSuccess]);

  const handleSubmit = async (values: LoginFormData) => {
    setLoading(true);
    setError(null);

    try {
      await login(values.email, values.password);
      // 登录成功
      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  // 如果正在检查认证状态，显示加载状态
  if (authLoading) {
    return (
      <Card title="登录" className="mx-auto w-full max-w-md">
        <div className="py-8 text-center">
          <div className="text-gray-500">检查登录状态...</div>
        </div>
      </Card>
    );
  }

  // 如果用户已登录，不显示登录表单（会在useEffect中跳转）
  if (user) {
    return null;
  }

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
        form={form}
        name="login"
        onFinish={handleSubmit}
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
              className="text-blue-600 hover:text-blue-800"
            >
              忘记密码？
            </Link>
          </div>
          <div>
            还没有账号？{" "}
            <Link
              href="/auth/register"
              className="text-blue-600 hover:text-blue-800"
            >
              立即注册
            </Link>
          </div>
        </div>
      </Form>
    </Card>
  );
}
