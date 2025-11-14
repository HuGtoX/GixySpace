"use client";

import { useAuth } from "@/contexts/AuthContext";
import { Modal, Form, Input, Button, message } from "antd";
import { useState } from "react";

interface ConvertUserModalProps {
  open: boolean;
  onClose: () => void;
}

export default function ConvertUserModal({
  open,
  onClose,
}: ConvertUserModalProps) {
  const { convertToRegularUser } = useAuth();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values: {
    email: string;
    password: string;
    fullName?: string;
  }) => {
    setLoading(true);
    try {
      await convertToRegularUser(
        values.email,
        values.password,
        values.fullName,
      );
      message.success("转换成功！请查收邮箱验证邮件");
      form.resetFields();
      onClose();
    } catch (error) {
      message.error(error instanceof Error ? error.message : "转换失败");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      title="转为正式账号"
      open={open}
      onCancel={handleCancel}
      footer={null}
      destroyOnClose
    >
      <div className="mb-4 text-gray-600 dark:text-gray-400">
        转为正式账号后，您的数据将永久保存，并可以使用更多功能。
      </div>
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        autoComplete="off"
      >
        <Form.Item
          label="邮箱"
          name="email"
          rules={[
            { required: true, message: "请输入邮箱" },
            { type: "email", message: "请输入有效的邮箱地址" },
          ]}
        >
          <Input placeholder="请输入邮箱" />
        </Form.Item>

        <Form.Item
          label="密码"
          name="password"
          rules={[
            { required: true, message: "请输入密码" },
            { min: 6, message: "密码至少6个字符" },
          ]}
        >
          <Input.Password placeholder="请输入密码（至少6个字符）" />
        </Form.Item>

        <Form.Item label="姓名（可选）" name="fullName">
          <Input placeholder="请输入姓名" />
        </Form.Item>

        <Form.Item className="mb-0">
          <div className="flex justify-end gap-2">
            <Button onClick={handleCancel}>取消</Button>
            <Button type="primary" htmlType="submit" loading={loading}>
              确认转换
            </Button>
          </div>
        </Form.Item>
      </Form>
    </Modal>
  );
}
