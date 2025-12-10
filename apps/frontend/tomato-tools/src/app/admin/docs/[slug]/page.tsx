"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  Typography,
  Button,
  Space,
  Tag,
  Spin,
  message,
  Breadcrumb,
  Divider,
  Affix,
} from "antd";
import {
  FaHome,
  FaArrowLeft,
  FaFile,
  FaClock,
  FaTag,
  FaFolder,
} from "react-icons/fa";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import dayjs from "dayjs";
import "dayjs/locale/zh-cn";
import AdminProtected from "@/components/auth/AdminProtected";
import MarkdownRenderer from "@/components/ui/MarkdownRenderer";

dayjs.locale("zh-cn");

const { Title, Text, Paragraph } = Typography;

// 文档详情接口
interface DocDetail {
  slug: string;
  fileName: string;
  title: string;
  description?: string;
  category?: string;
  tags?: string[];
  date?: string;
  size: number;
  modifiedTime: string;
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

export default function DocDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;

  const [doc, setDoc] = useState<DocDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [headings, setHeadings] = useState<
    Array<{ id: string; text: string; level: number }>
  >([]);

  // 获取文档内容
  const fetchDoc = async () => {
    if (!slug) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/docs?slug=${slug}`);
      const result = await response.json();

      if (result.success) {
        setDoc(result.data);
        // 解析标题生成目录
        extractHeadings(result.data.content);
      } else {
        message.error("获取文档内容失败");
        router.push("/admin/docs");
      }
    } catch (error) {
      console.error("Error fetching doc:", error);
      message.error("获取文档内容失败");
      router.push("/admin/docs");
    } finally {
      setLoading(false);
    }
  };

  // 提取标题生成目录
  const extractHeadings = (content: string) => {
    const lines = content.split("\n");
    const headingList: Array<{ id: string; text: string; level: number }> = [];

    lines.forEach((line, index) => {
      const match = line.match(/^(#{1,6})\s+(.+)$/);
      if (match) {
        const level = match[1].length;
        const text = match[2].trim();
        const id = `heading-${index}`;
        headingList.push({ id, text, level });
      }
    });

    setHeadings(headingList);
  };

  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  useEffect(() => {
    fetchDoc();
  }, [slug]);

  if (loading) {
    return (
      <AdminProtected>
        <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
          <Card className="w-96 text-center">
            <Spin size="large" />
            <div className="mt-4 text-gray-600 dark:text-gray-300">
              加载文档中...
            </div>
          </Card>
        </div>
      </AdminProtected>
    );
  }

  if (!doc) {
    return null;
  }

  return (
    <AdminProtected>
      <div className="min-h-screen bg-gray-50 transition-colors duration-200 dark:bg-gray-900">
        {/* 顶部导航栏 */}
        <div className="sticky top-0 z-10 bg-white shadow-sm dark:bg-gray-800">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <Space size="middle">
                <Link href="/admin/docs">
                  <Button icon={<FaArrowLeft />} className="flex items-center">
                    返回列表
                  </Button>
                </Link>
                <Divider type="vertical" />
                <Breadcrumb
                  items={[
                    {
                      title: (
                        <Link href="/">
                          <FaHome className="inline" />
                        </Link>
                      ),
                    },
                    {
                      title: <Link href="/admin/docs">文档管理</Link>,
                    },
                    {
                      title: doc.title,
                    },
                  ]}
                />
              </Space>
              <Link href="/">
                <Button
                  type="default"
                  icon={<FaHome className="text-blue-500 dark:text-blue-400" />}
                  className="flex items-center"
                >
                  返回首页
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* 主内容区域 */}
        <div className="container mx-auto px-6 py-8">
          <div className="flex gap-6">
            {/* 左侧主内容 */}
            <div className="flex-1">
              <Card className="mb-6">
                {/* 文档头部信息 */}
                <div className="mb-6">
                  <Title
                    level={1}
                    className="mb-4 text-gray-900 dark:text-white"
                  >
                    {doc.title}
                  </Title>

                  {doc.description && (
                    <Paragraph className="mb-4 text-lg text-gray-600 dark:text-gray-400">
                      {doc.description}
                    </Paragraph>
                  )}

                  {/* 元信息 */}
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-500">
                    {doc.category && (
                      <Space>
                        <FaFolder className="text-blue-500 dark:text-blue-400" />
                        <Tag color={categoryColors[doc.category]}>
                          {doc.category}
                        </Tag>
                      </Space>
                    )}
                    <Space>
                      <FaFile />
                      <Text className="text-gray-500 dark:text-gray-500">
                        {doc.fileName}
                      </Text>
                    </Space>
                    <Space>
                      <FaTag />
                      <Text className="text-gray-500 dark:text-gray-500">
                        {formatFileSize(doc.size)}
                      </Text>
                    </Space>
                    <Space>
                      <FaClock />
                      <Text className="text-gray-500 dark:text-gray-500">
                        更新于{" "}
                        {dayjs(doc.modifiedTime).format("YYYY-MM-DD HH:mm")}
                      </Text>
                    </Space>
                  </div>
                </div>

                <Divider />

                {/* 文档内容 */}
                <div className="prose prose-lg max-w-none dark:prose-invert">
                  <MarkdownRenderer content={doc.content} />
                </div>
              </Card>
            </div>

            {/* 右侧目录 */}
            {headings.length > 0 && (
              <div className="hidden w-64 lg:block">
                <Affix offsetTop={80}>
                  <Card
                    title={
                      <span className="text-gray-900 dark:text-white">
                        目录
                      </span>
                    }
                    size="small"
                    className="max-h-[calc(100vh-120px)] overflow-y-auto"
                  >
                    <div className="space-y-2">
                      {headings.map((heading, index) => (
                        <a
                          key={index}
                          href={`#${heading.id}`}
                          className={`block text-sm transition-colors hover:text-blue-500 dark:hover:text-blue-400 ${
                            heading.level === 1
                              ? "font-semibold text-gray-900 dark:text-white"
                              : heading.level === 2
                                ? "pl-3 text-gray-700 dark:text-gray-300"
                                : "pl-6 text-gray-600 dark:text-gray-400"
                          }`}
                          style={{
                            paddingLeft: `${(heading.level - 1) * 12}px`,
                          }}
                        >
                          {heading.text}
                        </a>
                      ))}
                    </div>
                  </Card>
                </Affix>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminProtected>
  );
}
