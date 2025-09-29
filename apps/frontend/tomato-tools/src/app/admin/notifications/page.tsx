"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Switch,
  message,
  Popconfirm,
  Typography,
  Statistic,
  Row,
  Col,
} from "antd";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaEye,
  FaBell,
  FaUsers,
  FaCheckCircle,
  FaHome,
} from "react-icons/fa";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/zh-cn";
import Link from "next/link";
import AdminProtected from "@/components/auth/AdminProtected";
import { useAuth } from "@/contexts/AuthContext";
// 配置 dayjs
dayjs.extend(relativeTime);
dayjs.locale("zh-cn");

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

// 通知类型选项
const notificationTypes = [
  { value: "system", label: "系统通知", color: "blue" },
  { value: "github", label: "GitHub", color: "default" },
  { value: "update", label: "更新通知", color: "green" },
  { value: "security", label: "安全通知", color: "red" },
  { value: "feature", label: "功能通知", color: "purple" },
  { value: "maintenance", label: "维护通知", color: "orange" },
];

// 优先级选项
const priorityOptions = [
  { value: "low", label: "低", color: "default" },
  { value: "normal", label: "普通", color: "blue" },
  { value: "high", label: "高", color: "orange" },
  { value: "urgent", label: "紧急", color: "red" },
];

// 状态选项
const statusOptions = [
  { value: "draft", label: "草稿", color: "default" },
  { value: "published", label: "已发布", color: "green" },
  { value: "archived", label: "已归档", color: "gray" },
];

interface NotificationItem {
  id: string;
  title: string;
  content: string;
  type: string;
  priority: string;
  status: string;
  actionUrl: string | null;
  iconUrl: string | null;
  metadata: any;
  sendEmail: boolean;
  sendPush: boolean;
  scheduledAt: string | null;
  expiresAt: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  stats?: {
    totalSent: number;
    totalRead: number;
    totalClicked: number;
  };
}

interface NotificationResponse {
  notifications: NotificationItem[];
  total: number;
  page: number;
  pageSize: number;
}

const NotificationManagement: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingNotification, setEditingNotification] =
    useState<NotificationItem | null>(null);
  const [form] = Form.useForm();
  const { user } = useAuth();

  // 获取通知列表
  const fetchNotifications = async (page = 1, size = 10) => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/notifications?page=${page}&pageSize=${size}`,
      );
      const result = await response.json();

      if (result.success) {
        const data: NotificationResponse = result.data;
        setNotifications(data.notifications);
        setTotal(data.total);
        setCurrentPage(data.page);
        setPageSize(data.pageSize);
      } else {
        message.error("获取通知列表失败");
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
      message.error("获取通知列表失败");
    } finally {
      setLoading(false);
    }
  };

  // 创建或更新通知
  const handleSubmit = async (values: any) => {
    // 验证管理员权限
    if (!user || user.role !== "admin") {
      message.error("权限不足，只有管理员才能执行此操作");
      return;
    }

    try {
      const url = editingNotification
        ? `/api/notifications/${editingNotification.id}`
        : "/api/notifications";

      const method = editingNotification ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // 包含认证信息
        body: JSON.stringify({
          ...values,
          scheduledAt: values.scheduledAt?.toISOString(),
          expiresAt: values.expiresAt?.toISOString(),
        }),
      });

      const result = await response.json();
      if (result.success) {
        message.success(editingNotification ? "更新成功" : "创建成功");
        setModalVisible(false);
        setEditingNotification(null);
        form.resetFields();
        fetchNotifications(currentPage, pageSize);
      } else {
        message.error(result.error || "操作失败");
      }
    } catch (error) {
      console.error("Error submitting notification:", error);
      message.error("操作失败");
    }
  };

  // 删除通知
  const handleDelete = async (id: string) => {
    // 验证管理员权限
    if (!user || user.role !== "admin") {
      message.error("权限不足，只有管理员才能执行此操作");
      return;
    }

    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: "DELETE",
        credentials: "include", // 包含认证信息
      });

      const result = await response.json();
      if (result.success) {
        message.success("删除成功");
        fetchNotifications(currentPage, pageSize);
      } else {
        message.error(result.error || "删除失败");
      }
    } catch (error) {
      console.error("Error deleting notification:", error);
      message.error("删除失败");
    }
  };

  // 打开编辑模态框
  const handleEdit = (notification: NotificationItem) => {
    setEditingNotification(notification);
    form.setFieldsValue({
      ...notification,
      scheduledAt: notification.scheduledAt
        ? dayjs(notification.scheduledAt)
        : null,
      expiresAt: notification.expiresAt ? dayjs(notification.expiresAt) : null,
    });
    setModalVisible(true);
  };

  // 打开创建模态框
  const handleCreate = () => {
    setEditingNotification(null);
    form.resetFields();
    setModalVisible(true);
  };

  // 表格列定义
  const columns: ColumnsType<NotificationItem> = [
    {
      title: "标题",
      dataIndex: "title",
      key: "title",
      width: 200,
      render: (text: string, record: NotificationItem) => (
        <div>
          <Text strong className="text-gray-900 dark:text-white">
            {text}
          </Text>
          <br />
          <Text
            type="secondary"
            className="text-xs text-gray-500 dark:text-gray-400"
          >
            {record.content.length > 50
              ? `${record.content.substring(0, 50)}...`
              : record.content}
          </Text>
        </div>
      ),
    },
    {
      title: "类型",
      dataIndex: "type",
      key: "type",
      width: 100,
      render: (type: string) => {
        const typeConfig = notificationTypes.find((t) => t.value === type);
        return (
          <Tag color={typeConfig?.color || "default"}>
            {typeConfig?.label || type}
          </Tag>
        );
      },
    },
    {
      title: "优先级",
      dataIndex: "priority",
      key: "priority",
      width: 80,
      render: (priority: string) => {
        const priorityConfig = priorityOptions.find(
          (p) => p.value === priority,
        );
        return (
          <Tag color={priorityConfig?.color || "default"}>
            {priorityConfig?.label || priority}
          </Tag>
        );
      },
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      width: 80,
      render: (status: string) => {
        const statusConfig = statusOptions.find((s) => s.value === status);
        return (
          <Tag color={statusConfig?.color || "default"}>
            {statusConfig?.label || status}
          </Tag>
        );
      },
    },
    {
      title: "统计",
      key: "stats",
      width: 120,
      render: (_, record: NotificationItem) => (
        <div className="text-xs text-gray-600 dark:text-gray-300">
          <div>发送: {record.stats?.totalSent || 0}</div>
          <div>已读: {record.stats?.totalRead || 0}</div>
          <div>点击: {record.stats?.totalClicked || 0}</div>
        </div>
      ),
    },
    {
      title: "创建时间",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 120,
      render: (date: string) => (
        <Text className="text-xs text-gray-500 dark:text-gray-400">
          {dayjs(date).fromNow()}
        </Text>
      ),
    },
    {
      title: "操作",
      key: "actions",
      width: 120,
      render: (_, record: NotificationItem) => (
        <Space size="small">
          <Button
            type="text"
            size="small"
            icon={<FaEdit className="text-blue-500 dark:text-blue-400" />}
            onClick={() => handleEdit(record)}
          />
          <Popconfirm
            title="确定要删除这个通知吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button
              type="text"
              size="small"
              icon={<FaTrash className="text-red-500 dark:text-red-400" />}
              danger
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // 组件挂载时获取数据
  useEffect(() => {
    fetchNotifications();
  }, []);

  return (
    <AdminProtected>
      <div className="min-h-screen bg-gray-50 p-6 transition-colors duration-200 dark:bg-gray-900">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <Title level={2} className="text-gray-900 dark:text-white">
                通知管理
              </Title>
              <Text
                type="secondary"
                className="text-gray-600 dark:text-gray-400"
              >
                管理系统通知，包括创建、编辑和删除通知
              </Text>
            </div>
            <Link href="/">
              <Button
                type="default"
                icon={<FaHome className="text-blue-500 dark:text-blue-400" />}
                size="large"
                className="flex items-center"
              >
                返回首页
              </Button>
            </Link>
          </div>
        </div>

        {/* 统计卡片 */}
        <Row gutter={16} className="mb-6">
          <Col span={6}>
            <Card>
              <Statistic
                title="总通知数"
                value={total}
                prefix={<FaBell className="text-blue-500 dark:text-blue-400" />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="已发布"
                value={
                  notifications.filter((n) => n.status === "published").length
                }
                prefix={
                  <FaCheckCircle className="text-green-500 dark:text-green-400" />
                }
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="总发送数"
                value={notifications.reduce(
                  (sum, n) => sum + (n.stats?.totalSent || 0),
                  0,
                )}
                prefix={
                  <FaUsers className="text-purple-500 dark:text-purple-400" />
                }
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="总阅读数"
                value={notifications.reduce(
                  (sum, n) => sum + (n.stats?.totalRead || 0),
                  0,
                )}
                prefix={
                  <FaEye className="text-orange-500 dark:text-orange-400" />
                }
              />
            </Card>
          </Col>
        </Row>

        {/* 操作栏 */}
        <Card className="mb-4">
          <div className="flex items-center justify-between">
            <Space>
              <Button
                type="primary"
                icon={<FaPlus className="text-white" />}
                onClick={handleCreate}
              >
                创建通知
              </Button>
            </Space>
          </div>
        </Card>

        {/* 通知列表 */}
        <Card>
          <Table
            columns={columns}
            dataSource={notifications}
            rowKey="id"
            loading={loading}
            rowClassName="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            pagination={{
              current: currentPage,
              pageSize: pageSize,
              total: total,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => (
                <span className="text-gray-600 dark:text-gray-300">
                  第 {range[0]}-{range[1]} 条，共 {total} 条
                </span>
              ),
              onChange: (page, size) => {
                fetchNotifications(page, size);
              },
            }}
          />
        </Card>

        {/* 创建/编辑模态框 */}
        <Modal
          title={
            <span className="text-gray-900 dark:text-white">
              {editingNotification ? "编辑通知" : "创建通知"}
            </span>
          }
          open={modalVisible}
          onCancel={() => {
            setModalVisible(false);
            setEditingNotification(null);
            form.resetFields();
          }}
          footer={null}
          width={600}
          className="dark:bg-gray-800"
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            className="dark:text-white"
            initialValues={{
              type: "system",
              priority: "normal",
              status: "published",
              sendEmail: false,
              sendPush: true,
              sendToAll: true,
            }}
          >
            <Form.Item
              name="title"
              label="标题"
              rules={[{ required: true, message: "请输入通知标题" }]}
            >
              <Input placeholder="请输入通知标题" />
            </Form.Item>

            <Form.Item
              name="content"
              label="内容"
              rules={[{ required: true, message: "请输入通知内容" }]}
            >
              <TextArea rows={4} placeholder="请输入通知内容" />
            </Form.Item>

            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  name="type"
                  label="类型"
                  rules={[{ required: true, message: "请选择通知类型" }]}
                >
                  <Select placeholder="请选择通知类型">
                    {notificationTypes.map((type) => (
                      <Option key={type.value} value={type.value}>
                        {type.label}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="priority"
                  label="优先级"
                  rules={[{ required: true, message: "请选择优先级" }]}
                >
                  <Select placeholder="请选择优先级">
                    {priorityOptions.map((priority) => (
                      <Option key={priority.value} value={priority.value}>
                        {priority.label}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="status"
                  label="状态"
                  rules={[{ required: true, message: "请选择状态" }]}
                >
                  <Select placeholder="请选择状态">
                    {statusOptions.map((status) => (
                      <Option key={status.value} value={status.value}>
                        {status.label}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Form.Item name="actionUrl" label="操作链接">
              <Input placeholder="点击通知后跳转的链接（可选）" />
            </Form.Item>

            <Form.Item name="iconUrl" label="图标链接">
              <Input placeholder="通知图标链接（可选）" />
            </Form.Item>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="scheduledAt" label="定时发送">
                  <DatePicker
                    showTime
                    placeholder="选择发送时间（可选）"
                    className="w-full"
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="expiresAt" label="过期时间">
                  <DatePicker
                    showTime
                    placeholder="选择过期时间（可选）"
                    className="w-full"
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  name="sendEmail"
                  label="发送邮件"
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="sendPush"
                  label="推送通知"
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="sendToAll"
                  label="发送给所有用户"
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>
              </Col>
            </Row>

            <div className="flex justify-end space-x-2 border-t border-gray-200 pt-4 dark:border-gray-700">
              <Button
                onClick={() => {
                  setModalVisible(false);
                  setEditingNotification(null);
                  form.resetFields();
                }}
                className="text-gray-600 dark:text-gray-300"
              >
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                {editingNotification ? "更新" : "创建"}
              </Button>
            </div>
          </Form>
        </Modal>
      </div>
    </AdminProtected>
  );
};

export default NotificationManagement;
