"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import rehypeRaw from "rehype-raw";
import { Button, message } from "antd";
import { CopyOutlined } from "@ant-design/icons";
import "highlight.js/styles/atom-one-dark.css"; // 深色主题
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
              <div className="code-block-wrapper my-4">
                <div className="flex items-center justify-between rounded-t-lg border-b border-slate-700/50 bg-slate-800/50 px-3 py-2 backdrop-blur-sm dark:border-slate-600/50 dark:bg-slate-900/50">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-300 dark:text-slate-400">
                    {language}
                  </span>
                  <Button
                    type="text"
                    size="small"
                    icon={<CopyOutlined />}
                    onClick={() => handleCopyCode(codeString)}
                    className="copy-button text-slate-400 transition-colors hover:text-slate-100 dark:text-slate-500 dark:hover:text-slate-200"
                  >
                    复制
                  </Button>
                </div>
                <pre className="!mt-0 !rounded-t-none">
                  <code className={className} {...props}>
                    {children}
                  </code>
                </pre>
              </div>
            ) : (
              <code
                className="rounded bg-slate-100 px-1.5 py-0.5 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-300"
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
