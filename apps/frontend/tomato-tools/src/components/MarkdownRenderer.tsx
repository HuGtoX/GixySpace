"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import rehypeRaw from "rehype-raw";
import { Button, message } from "antd";
import { CopyOutlined } from "@ant-design/icons";
import "./MarkdownRenderer.css";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export default function MarkdownRenderer({
  content,
  className = "",
}: MarkdownRendererProps) {
  // 复制代码功能
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      message.success("代码已复制到剪贴板");
    });
  };

  return (
    <div className={`markdown-renderer ${className}`}>
      {(ReactMarkdown as any)({
        remarkPlugins: [remarkGfm],
        rehypePlugins: [rehypeHighlight, rehypeRaw],
        children: content,
        components: {
          // 自定义代码块渲染
          code({ inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || "");
            const language = match ? match[1] : "";
            const codeString = String(children).replace(/\n$/, "");

            return !inline && match ? (
              <div className="relative">
                <div className="flex items-center justify-between rounded-t-md bg-gray-800 px-4 py-2">
                  <span className="text-sm text-gray-300">{language}</span>
                  <Button
                    type="text"
                    size="small"
                    icon={<CopyOutlined />}
                    onClick={() => handleCopyCode(codeString)}
                    className="text-gray-300 hover:text-white"
                  >
                    复制
                  </Button>
                </div>
              </div>
            ) : (
              <code
                className="rounded bg-gray-100 px-1 py-0.5 text-sm dark:bg-gray-700"
                {...props}
              >
                {children}
              </code>
            );
          },
        },
      })}
    </div>
  );
}
