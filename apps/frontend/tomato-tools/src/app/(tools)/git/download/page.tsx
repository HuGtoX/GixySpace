"use client";

import { Container } from "@/components/toolsLayout/ToolsLayout";
import {
  DownloadOutlined,
  GithubOutlined,
  KeyOutlined,
} from "@ant-design/icons";
import {
  Alert,
  Button,
  Card,
  Col,
  Form,
  Input,
  message,
  Row,
  Space,
  Spin,
  Typography,
} from "antd";
import { useState } from "react";

const { Title, Text } = Typography;

// 使用说明内容
const instructionsContent = [
  "输入GitHub地址：支持仓库主页、目录页面或文件页面的完整URL。",
  "• 仓库主页：https://github.com/user/repo（下载整个仓库）",
  "• 目录页面：https://github.com/user/repo/tree/main/src（下载指定目录）",
  "• 文件页面：https://github.com/user/repo/blob/main/src/index.js（下载文件所在目录）",
  "访问令牌（可选）：服务端已配置默认令牌，通常无需填写。仅在访问私有仓库时需要提供个人令牌。",
  "开始下载：点击'开始下载'按钮，系统将自动识别并下载对应内容。",
];

interface DownloadForm {
  gitUrl: string;
  token?: string;
}

export default function GitDownloadPage() {
  const [form] = Form.useForm<DownloadForm>();
  const [loading, setLoading] = useState(false);
  const [downloadHistory, setDownloadHistory] = useState<
    Array<{
      id: string;
      url: string;
      timestamp: Date;
      status: "success" | "error";
      error?: string;
    }>
  >([]);

  const handleDownload = async (values: DownloadForm) => {
    setLoading(true);
    const downloadId = Date.now().toString();

    try {
      const response = await fetch("/api/git-download", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "下载失败");
      }

      // 获取文件名
      const contentDisposition = response.headers.get("Content-Disposition");
      const fileNameMatch = contentDisposition?.match(/filename="(.+)"/)?.[1];
      const fileName = fileNameMatch || "download.zip";

      // 下载文件
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // 添加到下载历史
      setDownloadHistory((prev) => [
        {
          id: downloadId,
          url: values.gitUrl,
          timestamp: new Date(),
          status: "success",
        },
        ...prev.slice(0, 4),
      ]); // 只保留最近5条记录

      message.success("下载成功！");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "下载失败";

      // 添加到下载历史
      setDownloadHistory((prev) => [
        {
          id: downloadId,
          url: values.gitUrl,
          timestamp: new Date(),
          status: "error",
          error: errorMessage,
        },
        ...prev.slice(0, 4),
      ]);

      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Container
      title="Git仓库下载"
      instructions={{
        tips: "支持下载GitHub公开仓库的完整代码或指定目录",
        content: instructionsContent,
      }}
    >
      <Row gutter={[24, 24]}>
        {/* 左侧 - 下载表单 */}
        <Col xs={24} sm={24} md={12} lg={12} xl={12}>
          <Card
            title={
              <Space>
                <GithubOutlined />
                <span>仓库信息</span>
              </Space>
            }
            className="h-full"
          >
            <Form
              form={form}
              layout="vertical"
              onFinish={handleDownload}
              disabled={loading}
            >
              <Form.Item
                label="GitHub地址"
                name="gitUrl"
                rules={[
                  { required: true, message: "请输入GitHub地址" },
                  {
                    pattern: /github\.com\/[^/]+\/[^/]+/,
                    message: "请输入有效的GitHub地址",
                  },
                ]}
                help="支持仓库主页、目录页面或文件页面的完整URL"
              >
                <Input
                  prefix={<GithubOutlined />}
                  placeholder="https://github.com/user/repo 或 https://github.com/user/repo/tree/main/src"
                  size="large"
                />
              </Form.Item>

              <Form.Item
                label="访问令牌（可选）"
                name="token"
                help="用于访问私有仓库或提高API限制"
              >
                <Input.Password
                  prefix={<KeyOutlined />}
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                  size="large"
                />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  loading={loading}
                  icon={<DownloadOutlined />}
                  block
                >
                  {loading ? "下载中..." : "开始下载"}
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        {/* 右侧 - 下载历史和说明 */}
        <Col xs={24} sm={24} md={12} lg={12} xl={12}>
          <Space direction="vertical" size="large" className="w-full">
            {/* 功能说明 */}
            <Card title="功能特点" size="small">
              <Space direction="vertical" size="small">
                <Text>
                  <GithubOutlined /> 支持GitHub公开和私有仓库
                </Text>
                <Text>
                  <DownloadOutlined /> 智能识别URL自动下载对应内容
                </Text>
                <Text>
                  <DownloadOutlined /> 自动打包为ZIP文件
                </Text>
              </Space>
            </Card>

            {/* 下载历史 */}
            {downloadHistory.length > 0 && (
              <Card title="下载历史" size="small">
                <Space direction="vertical" size="small" className="w-full">
                  {downloadHistory.map((item) => (
                    <div
                      key={item.id}
                      className="border-b border-gray-100 pb-2 last:border-b-0"
                    >
                      <div className="flex items-center justify-between">
                        <Text
                          className="text-sm font-medium"
                          ellipsis={{ tooltip: item.url }}
                        >
                          {item.url.split("/").slice(-2).join("/")}
                        </Text>
                        <Text
                          type={
                            item.status === "success" ? "success" : "danger"
                          }
                          className="text-xs"
                        >
                          {item.status === "success" ? "成功" : "失败"}
                        </Text>
                      </div>

                      <div className="mt-1 flex items-center justify-between">
                        <Text type="secondary" className="text-xs">
                          {formatTimestamp(item.timestamp)}
                        </Text>
                        {item.error && (
                          <Text
                            type="danger"
                            className="text-xs"
                            ellipsis={{ tooltip: item.error }}
                          >
                            {item.error}
                          </Text>
                        )}
                      </div>
                    </div>
                  ))}
                </Space>
              </Card>
            )}

            {/* 注意事项 */}
            <Alert
              message="注意事项"
              description={
                <ul className="mt-2 space-y-1 text-sm">
                  <li>• 大型仓库下载可能需要较长时间</li>
                  <li>• 私有仓库需要提供有效的访问令牌</li>
                  <li>• 服务端已配置默认令牌，避免频率限制问题</li>
                  <li>• 仅支持GitHub仓库，不支持其他Git托管平台</li>
                </ul>
              }
              type="info"
              showIcon
            />
          </Space>
        </Col>
      </Row>

      {/* 加载遮罩 */}
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <Card className="text-center">
            <Spin size="large" />
            <div className="mt-4">
              <Title level={4}>正在下载...</Title>
              <Text type="secondary">请稍候，正在从GitHub获取文件并打包</Text>
            </div>
          </Card>
        </div>
      )}
    </Container>
  );
}
