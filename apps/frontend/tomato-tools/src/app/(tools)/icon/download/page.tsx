"use client";

import React, { useState } from "react";
import {
  Button,
  Input,
  message,
  List,
  Card,
  Spin,
  Divider,
  Avatar,
} from "antd";
import {
  DownloadOutlined,
  LinkOutlined,
  SearchOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import Container from "@/components/layout/ToolsLayout/Container";
import axios from "@/lib/axios";
import { useTheme } from "@/contexts/ThemeContext";
import { IconInfo } from "@gixy/types";

const IconDownloader = () => {
  const [url, setUrl] = useState("");
  const [icons, setIcons] = useState<IconInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { isDarkMode } = useTheme();

  // 获取图标
  const fetchIcons = async () => {
    if (!url.trim()) {
      message.error("请输入有效的URL地址");
      return;
    }

    setLoading(true);
    setError("");
    setIcons([]);

    try {
      // 构建基础URL
      const baseUrl = url.startsWith("http") ? url : `https://${url}`;
      const baseDomain = new URL(baseUrl).origin;
      const response = await axios.get<IconInfo[]>(
        `/api/icon/get?url=${baseDomain}`,
      );

      // 存储找到的图标
      const foundIcons = response || [];

      setIcons(foundIcons);
      message.success(`成功找到 ${foundIcons.length} 个图标`);
    } catch (err) {
      setError("获取图标失败，请检查URL是否有效");
      message.error("获取图标失败，请检查URL是否有效");
      console.error("Error fetching icons:", err);
    } finally {
      setLoading(false);
    }
  };

  // 下载图标
  const downloadIcon = async (iconUrl: string, size: string) => {
    try {
      const fileName = `favicon-${size}.${iconUrl.split(".").pop() || "png"}`;
      // 先将图标转换为Blob
      const response = await fetch(iconUrl);
      if (!response.ok) throw new Error("网络响应错误");
      const blob = await response.blob();
      // 创建ObjectURL
      const objectUrl = URL.createObjectURL(blob);
      // 创建下载链接并触发下载
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();

      // 清理
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(objectUrl);
      }, 0);

      message.success("图标下载成功");
    } catch (error) {
      message.error("图标下载失败");
      console.error("下载失败:", error);
    }
  };

  return (
    <Container
      title="URL图标下载器"
      instructions={{
        title: "使用说明",
        content: [
          "输入网站URL地址",
          "点击'获取图标'按钮",
          "查看找到的图标列表",
          "点击下载按钮保存图标",
        ],
        tips: [
          "支持自动识别常见的图标路径",
          "如网站没有提供图标，将尝试使用第三方服务获取",
        ],
      }}
    >
      <div
        className={`rounded-lg p-6 ${isDarkMode ? "bg-gray-800" : "bg-white"} shadow-sm`}
      >
        <div className="mb-6">
          <h3 className="mb-3 text-lg font-medium">输入URL地址</h3>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input
              placeholder="例如: https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              prefix={<LinkOutlined />}
              className="flex-1"
            />
            <Button
              type="primary"
              onClick={fetchIcons}
              loading={loading}
              icon={<SearchOutlined />}
              className="whitespace-nowrap"
            >
              获取图标
            </Button>
          </div>
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/30">
            <CheckCircleOutlined className="text-red-500 dark:text-red-400" />
            <span className="text-red-700 dark:text-red-300">{error}</span>
          </div>
        )}

        <Divider />

        <div className="mt-6">
          <h3 className="mb-3 text-lg font-medium">找到的图标</h3>
          {loading ? (
            <div className="flex justify-center py-10">
              <Spin size="large" />
            </div>
          ) : icons.length > 0 ? (
            <List
              grid={{ gutter: 16, column: 2, md: 3, lg: 4 }}
              dataSource={icons}
              renderItem={(item) => (
                <List.Item>
                  <Card
                    hoverable
                    cover={
                      <div
                        style={{ display: "flex" }}
                        className="justify-center bg-gray-50 p-4 dark:bg-gray-900"
                      >
                        <Avatar
                          src={item.url}
                          alt={`Icon ${item.size}`}
                          size={64}
                        />
                      </div>
                    }
                    actions={[
                      <Button
                        key={`download`}
                        type="primary"
                        icon={<DownloadOutlined />}
                        onClick={() => downloadIcon(item.url, item.size)}
                        size="small"
                      >
                        下载
                      </Button>,
                    ]}
                  >
                    <Card.Meta
                      title={`尺寸: ${item.size}`}
                      description={`格式: ${item.format}`}
                    />
                  </Card>
                </List.Item>
              )}
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-gray-500 dark:text-gray-400">
              <div className="mb-3 text-4xl">🔍</div>
              <p>{`尚未获取图标，请输入URL并点击'获取图标'按钮`}</p>
            </div>
          )}
        </div>
      </div>
    </Container>
  );
};

export default IconDownloader;
