"use client";

import React, { useState } from "react";
import { Form, Input, Button, Alert, Card } from "antd";
import { UserOutlined, LockOutlined, MailOutlined } from "@ant-design/icons";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "@/lib/clients/http";

interface RegisterFormData {
  email: string;
  code: string;
  password: string;
  confirmPassword: string;
  fullName?: string;
}

interface RegisterFormProps {
  onSuccess?: () => void;
}

export default function RegisterForm({ onSuccess }: RegisterFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const router = useRouter();
  const [form] = Form.useForm();

  const handleSubmit = async (values: RegisterFormData) => {
    setLoading(true);
    setError(null);

    try {
      // 解构数据，移除confirmPassword字段
      const { confirmPassword, ...registerData } = values;

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(registerData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Registration failed");
      }

      // 注册成功
      setSuccess(true);
      if (onSuccess) {
        onSuccess();
      } else {
        // 延迟跳转到登录页�?
        setTimeout(() => {
          router.push("/auth/login");
        }, 2000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  // 发送验证码
  const handleSendCode = async () => {
    try {
      const email = form.getFieldValue("email");
      if (!email) {
        form.validateFields(["email"]);
        return;
      }

      setSendingCode(true);
      setError(null);

      const response = await axios.post<any>(
        "/api/auth/send-verification-code",
        JSON.stringify({ email }),
      );

      console.log("-- [ response ] --", response);
      if (!response.success) {
        throw new Error(response.error);
      }

      setCodeSent(true);
      setCountdown(60); // 60秒倒计�?

      // 倒计时逻辑
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to send verification code",
      );
    } finally {
      setSendingCode(false);
    }
  };

  if (success) {
    return (
      <Card title="注册成功" className="mx-auto w-full max-w-md">
        <Alert
          message="注册成功�?
          description="您的账户已创建成功。正在跳转到登录页面..."
          type="success"
          showIcon
        />
      </Card>
    );
  }

  return (
    <Card title="注册" className="mx-auto w-full max-w-md">
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
        name="register"
        onFinish={handleSubmit}
        layout="vertical"
        size="large"
      >
        <Form.Item name="fullName" label="用户�?>
          <Input
            prefix={<UserOutlined />}
            placeholder="请输入昵�?
            autoComplete="name"
          />
        </Form.Item>

        <Form.Item
          name="email"
          label="邮箱"
          rules={[
            { required: true, message: "请输入邮�? },
            { type: "email", message: "请输入有效的邮箱地址" },
          ]}
        >
          <Input
            prefix={<MailOutlined />}
            placeholder="请输入邮�?
            autoComplete="email"
            disabled={codeSent}
          />
        </Form.Item>

        <Form.Item
          name="code"
          label="验证�?
          rules={[
            { required: true, message: "请输入验证码" },
            { min: 6, message: "验证码至少需�?�? },
          ]}
        >
          <div className="flex gap-2">
            <Input
              prefix={<LockOutlined />}
              placeholder="请输入邮箱验证码"
              maxLength={6}
            />
            <Button
              type="default"
              onClick={handleSendCode}
              loading={sendingCode}
              disabled={countdown > 0}
              className="min-w-[100px]"
            >
              {countdown > 0
                ? `${countdown}s`
                : codeSent
                  ? "重新发�?
                  : "发送验证码"}
            </Button>
          </div>
        </Form.Item>

        <Form.Item
          name="password"
          label="密码"
          rules={[
            { required: true, message: "请输入密�? },
            { min: 6, message: "密码至少需�?个字�? },
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
            { required: true, message: "请确认密�? },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue("password") === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error("两次输入的密码不一�?));
              },
            }),
          ]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="请再次输入密�?
            autoComplete="new-password"
          />
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            className="w-full"
          >
            注册
          </Button>
        </Form.Item>

        <div className="text-center">
          已有账号？{" "}
          <Link
            href="/auth/login"
            className="text-blue-600 hover:text-blue-800"
          >
            立即登录
          </Link>
        </div>
      </Form>
    </Card>
  );
}
