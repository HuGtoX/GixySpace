import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { z } from "zod";

// 文档元数据接口
interface DocMetadata {
  title: string;
  description?: string;
  category?: string;
  tags?: string[];
  date?: string;
}

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

// 解析Markdown文件的元数据（从文件内容中提取）
function parseMarkdownMetadata(content: string): DocMetadata {
  // 统一处理换行符，避免Windows的\r\n导致问题
  const lines = content.split(/\r?\n/);

  // 提取标题（第一个 # 标题，只匹配一级标题）
  let title = "";
  for (const line of lines) {
    const trimmedLine = line.trim();
    // 使用更精确的正则：^# 后面必须是空格，不能是另一个#
    const match = trimmedLine.match(/^#\s+(.+)$/);
    if (match) {
      title = match[1].trim();
      break;
    }
  }

  // 尝试从文件名生成标题
  if (!title) {
    title = "未命名文档";
  }

  // 提取描述（第一个段落）
  let description = "";
  let foundTitle = false;
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (trimmedLine.match(/^#\s+/)) {
      foundTitle = true;
      continue;
    }
    if (foundTitle && trimmedLine && !trimmedLine.startsWith("#")) {
      description = trimmedLine;
      break;
    }
  }

  // 尝试从文件名推断分类
  const category = inferCategory(title);

  return {
    title,
    description,
    category,
    tags: [],
  };
}

// 从标题推断分类
function inferCategory(title: string): string {
  const lowerTitle = title.toLowerCase();

  if (
    lowerTitle.includes("quick") ||
    lowerTitle.includes("快速") ||
    lowerTitle.includes("start")
  ) {
    return "快速开始";
  }
  if (lowerTitle.includes("api") || lowerTitle.includes("接口")) {
    return "API文档";
  }
  if (
    lowerTitle.includes("guide") ||
    lowerTitle.includes("指南") ||
    lowerTitle.includes("教程")
  ) {
    return "使用指南";
  }
  if (
    lowerTitle.includes("implementation") ||
    lowerTitle.includes("实现") ||
    lowerTitle.includes("开发")
  ) {
    return "实现文档";
  }
  if (lowerTitle.includes("summary") || lowerTitle.includes("总结")) {
    return "功能总结";
  }
  if (
    lowerTitle.includes("database") ||
    lowerTitle.includes("数据库") ||
    lowerTitle.includes("schema")
  ) {
    return "数据库";
  }
  if (lowerTitle.includes("architecture") || lowerTitle.includes("架构")) {
    return "架构设计";
  }

  return "其他";
}

// GET 请求：获取文档列表或单个文档内容
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");

    // 获取docs目录的绝对路径
    const docsDir = path.join(process.cwd(), "docs");

    // 如果指定了slug，返回单个文档内容
    if (slug) {
      const filePath = path.join(docsDir, `${slug}.md`);

      try {
        const content = await fs.readFile(filePath, "utf-8");
        const stats = await fs.stat(filePath);
        const metadata = parseMarkdownMetadata(content);

        return NextResponse.json({
          success: true,
          data: {
            slug,
            fileName: `${slug}.md`,
            content,
            ...metadata,
            size: stats.size,
            modifiedTime: stats.mtime.toISOString(),
          },
        });
      } catch (error) {
        return NextResponse.json(
          {
            success: false,
            error: "文档不存在",
          },
          { status: 404 },
        );
      }
    }

    // 获取所有文档列表
    const files = await fs.readdir(docsDir);
    const mdFiles = files.filter((file) => file.endsWith(".md"));

    // 读取每个文档的元数据
    const docs: DocInfo[] = await Promise.all(
      mdFiles.map(async (fileName) => {
        const filePath = path.join(docsDir, fileName);
        const content = await fs.readFile(filePath, "utf-8");
        const stats = await fs.stat(filePath);
        const metadata = parseMarkdownMetadata(content);
        const slug = fileName.replace(/\.md$/, "");

        return {
          slug,
          fileName,
          ...metadata,
          size: stats.size,
          modifiedTime: stats.mtime.toISOString(),
        };
      }),
    );

    // 按修改时间排序（最新的在前）
    docs.sort((a, b) => {
      return (
        new Date(b.modifiedTime).getTime() - new Date(a.modifiedTime).getTime()
      );
    });

    // 支持搜索和筛选
    const search = searchParams.get("search");
    const category = searchParams.get("category");

    let filteredDocs = docs;

    if (search) {
      const searchLower = search.toLowerCase();
      filteredDocs = filteredDocs.filter(
        (doc) =>
          doc.title.toLowerCase().includes(searchLower) ||
          doc.description?.toLowerCase().includes(searchLower) ||
          doc.fileName.toLowerCase().includes(searchLower),
      );
    }

    if (category && category !== "all") {
      filteredDocs = filteredDocs.filter((doc) => doc.category === category);
    }

    // 获取所有分类
    const categories = Array.from(
      new Set(docs.map((doc) => doc.category).filter(Boolean)),
    );

    return NextResponse.json({
      success: true,
      data: {
        docs: filteredDocs,
        total: filteredDocs.length,
        categories,
      },
    });
  } catch (error) {
    console.error("Error reading docs:", error);
    return NextResponse.json(
      {
        success: false,
        error: "读取文档失败",
      },
      { status: 500 },
    );
  }
}
