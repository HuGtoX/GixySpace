"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  Input,
  Select,
  Tag,
  Space,
  Typography,
  Row,
  Col,
  Statistic,
  Button,
  Modal,
  Empty,
  Spin,
  message,
  List,
  Badge,
} from "antd";
import {
  FaSearch,
  FaFilter,
  FaFile,
  FaFolder,
  FaEye,
  FaHome,
  FaClock,
  FaTag,
} from "react-icons/fa";
import Link from "next/link";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/zh-cn";
import AdminProtected from "@/components/auth/AdminProtected";
import MarkdownRenderer from "@/components/ui/MarkdownRenderer";

// 配置 dayjs
dayjs.extend(relativeTime);
dayjs.locale("zh-cn");

const { Title, Text, Paragraph } = Typography;
const { Search } = Input;
const { Option } = Select;

// 文档信息接口
interface DocInfo {
  slug: string;
  fileName: string;
  title: string;
  description?: string;
  category?: string;
  tags?: string[];
  date?: string;
  size: number;
  modifiedTime: string;
}

// 文档详情接口
interface DocDetail extends DocInfo {
  content: string;
}

// 分类颜色映射
const categoryColors: Record<string, string> = {
  快速开始: "blue",
  API文档: "green",
  使用指南: "purple",
  实现文档: "orange",
  功能总结: "cyan",
  数据库: "red",
  架构设计: "magenta",
  其他: "default",
};

export default function DocsManagement() {
  const [docs, setDocs] = useState<DocInfo[]>([]);
  const [filteredDocs, setFilteredDocs] = useState<DocInfo[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<DocDetail | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // 获取文档列表
  const fetchDocs = async (search?: string, category?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (category && category !== "all") params.append("category", category);

      const response = await fetch(`/api/docs?${params.toString()}`);
      const result = await response.json();

      if (result.success) {
        setDocs(result.data.docs);
        setFilteredDocs(result.data.docs);
        setCategories(result.data.categories);
      } else {
        message.error("获取文档列表失败");
      }
    } catch (error) {
      console.error("Error fetching docs:", error);
      message.error("获取文档列表失败");
    } finally {
      setLoading(false);
    }
  };

  // 搜索文档
  const handleSearch = (value: string) => {
    setSearchText(value);
    fetchDocs(value, selectedCategory);
  };

  // 筛选分类
  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
    fetchDocs(searchText, value);
  };

  // 预览文档
  const handlePreview = async (slug: string) => {
    setPreviewVisible(true);
    setPreviewLoading(true);
    setPreviewDoc(null);

    try {
      const response = await fetch(`/api/docs?slug=${slug}`);
      const result = await response.json();

      if (result.success) {
        setPreviewDoc(result.data);
      } else {
        message.error("获取文档内容失败");
      }
    } catch (error) {
      console.error("Error fetching doc content:", error);
      message.error("获取文档内容失败");
    } finally {
      setPreviewLoading(false);
    }
  };

  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // 组件挂载时获取数据
  useEffect(() => {
    fetchDocs();
  }, []);

  // 按分类分组文档
  const groupedDocs = filteredDocs.reduce(
    (acc, doc) => {
      const category = doc.category || "其他";
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(doc);
      return acc;
    },
    {} as Record<string, DocInfo[]>,
  );

  return (
    <AdminProtected>
      <div className="min-h-screen bg-gray-50 p-6 transition-colors duration-200 dark:bg-gray-900">
        {/* 页面头部 */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <Title level={2} className="text-gray-900 dark:text-white">
                文档管理
              </Title>
              <Text
                type="secondary"
                className="text-gray-600 dark:text-gray-400"
              >
                浏览和管理项目文档
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
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="文档总数"
                value={docs.length}
                prefix={<FaFile className="text-blue-500 dark:text-blue-400" />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="分类数量"
                value={categories.length}
                prefix={
                  <FaFolder className="text-green-500 dark:text-green-400" />
                }
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="总大小"
                value={formatFileSize(
                  docs.reduce((sum, doc) => sum + doc.size, 0),
                )}
                prefix={
                  <FaTag className="text-purple-500 dark:text-purple-400" />
                }
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="最近更新"
                value={
                  docs.length > 0 ? dayjs(docs[0].modifiedTime).fromNow() : "无"
                }
                prefix={
                  <FaClock className="text-orange-500 dark:text-orange-400" />
                }
              />
            </Card>
          </Col>
        </Row>

        {/* 搜索和筛选 */}
        <Card className="mb-4">
          <Space direction="vertical" size="middle" className="w-full">
            <Row gutter={16}>
              <Col xs={24} md={16}>
                <Search
                  placeholder="搜索文档标题、描述或文件名..."
                  allowClear
                  enterButton={
                    <Button type="primary" icon={<FaSearch />}>
                      搜索
                    </Button>
                  }
                  size="large"
                  onSearch={handleSearch}
                  onChange={(e) => {
                    if (!e.target.value) {
                      handleSearch("");
                    }
                  }}
                />
              </Col>
              <Col xs={24} md={8}>
                <Select
                  value={selectedCategory}
                  onChange={handleCategoryChange}
                  size="large"
                  className="w-full"
                  suffixIcon={<FaFilter />}
                >
                  <Option value="all">全部分类</Option>
                  {categories.map((category) => (
                    <Option key={category} value={category}>
                      {category}
                    </Option>
                  ))}
                </Select>
              </Col>
            </Row>
          </Space>
        </Card>

        {/* 文档列表 */}
        {loading ? (
          <Card>
            <div className="flex items-center justify-center py-12">
              <Spin size="large" tip="加载中..." />
            </div>
          </Card>
        ) : filteredDocs.length === 0 ? (
          <Card>
            <Empty
              description="没有找到文档"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedDocs).map(([category, categoryDocs]) => (
              <Card
                key={category}
                title={
                  <div className="flex items-center space-x-2">
                    <FaFolder className="text-blue-500 dark:text-blue-400" />
                    <span className="text-gray-900 dark:text-white">
                      {category}
                    </span>
                    <Badge
                      count={categoryDocs.length}
                      style={{ backgroundColor: "#52c41a" }}
                    />
                  </div>
                }
              >
                <List
                  dataSource={categoryDocs}
                  renderItem={(doc) => (
                    <List.Item
                      key={doc.slug}
                      className="cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
                      actions={[
                        <Button
                          key="preview"
                          type="link"
                          icon={<FaEye />}
                          onClick={() => handlePreview(doc.slug)}
                        >
                          预览
                        </Button>,
                        <Link
                          key="view"
                          href={`/admin/docs/${doc.slug}`}
                          target="_blank"
                        >
                          <Button type="link">查看详情</Button>
                        </Link>,
                      ]}
                    >
                      <List.Item.Meta
                        title={
                          <div className="flex items-center space-x-2">
                            <Text
                              strong
                              className="text-base text-gray-900 dark:text-white"
                            >
                              {doc.title}
                            </Text>
                            <Tag color={categoryColors[doc.category || "其他"]}>
                              {doc.category}
                            </Tag>
                          </div>
                        }
                        description={
                          <div className="space-y-1">
                            {doc.description && (
                              <Paragraph
                                ellipsis={{ rows: 2 }}
                                className="mb-1 text-gray-600 dark:text-gray-400"
                              >
                                {doc.description}
                              </Paragraph>
                            )}
                            <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-500">
                              <span>📄 {doc.fileName}</span>
                              <span>📦 {formatFileSize(doc.size)}</span>
                              <span>
                                🕒 {dayjs(doc.modifiedTime).fromNow()}
                              </span>
                            </div>
                          </div>
                        }
                      />
                    </List.Item>
                  )}
                />
              </Card>
            ))}
          </div>
        )}

        {/* 预览模态框 */}
        <Modal
          title={
            <div className="flex items-center space-x-2">
              <FaEye className="text-blue-500 dark:text-blue-400" />
              <span className="text-gray-900 dark:text-white">
                {previewDoc?.title || "文档预览"}
              </span>
            </div>
          }
          open={previewVisible}
          onCancel={() => {
            setPreviewVisible(false);
            setPreviewDoc(null);
          }}
          footer={[
            <Button
              key="close"
              onClick={() => {
                setPreviewVisible(false);
                setPreviewDoc(null);
              }}
            >
              关闭
            </Button>,
            previewDoc && (
              <Link
                key="view"
                href={`/admin/docs/${previewDoc.slug}`}
                target="_blank"
              >
                <Button type="primary">查看完整文档</Button>
              </Link>
            ),
          ]}
          width={900}
          className="dark:bg-gray-800"
          style={{ top: 20 }}
        >
          {previewLoading ? (
            <div className="flex items-center justify-center py-12">
              <Spin size="large" tip="加载中..." />
            </div>
          ) : previewDoc ? (
            <div className="space-y-4">
              {/* 文档元信息 */}
              <div className="border-b border-gray-200 pb-4 dark:border-gray-700">
                <Space direction="vertical" size="small" className="w-full">
                  {previewDoc.description && (
                    <Text className="text-gray-600 dark:text-gray-400">
                      {previewDoc.description}
                    </Text>
                  )}
                  <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-500">
                    <span>📄 {previewDoc.fileName}</span>
                    <span>📦 {formatFileSize(previewDoc.size)}</span>
                    <span>
                      🕒 更新于{" "}
                      {dayjs(previewDoc.modifiedTime).format(
                        "YYYY-MM-DD HH:mm",
                      )}
                    </span>
                  </div>
                </Space>
              </div>

              {/* 文档内容 */}
              <div
                className="max-h-[600px] overflow-y-auto"
                style={{ scrollbarWidth: "thin" }}
              >
                <MarkdownRenderer content={previewDoc.content} />
              </div>
            </div>
          ) : (
            <Empty description="无法加载文档内容" />
          )}
        </Modal>
      </div>
    </AdminProtected>
  );
}
