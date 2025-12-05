"use client";

import { useRef, useEffect, useState } from "react";
import { Avatar, Spin, Button, message, Popconfirm } from "antd";
import {
  RobotOutlined,
  CopyOutlined,
  CheckOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { useAuth } from "@/contexts/AuthContext";
import MarkdownRenderer from "@/components/ui/MarkdownRenderer";

interface ChatMessage {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
}

interface ChatComponentProps {
  className?: string;
  loading: boolean;
  messages: ChatMessage[];
  model: string;
  streamingMessage?: string; // 流式消息内容
  isStreaming?: boolean; // 是否正在流式输出
  onMessageDelete?: (messageId: string) => void; // 删除消息回调
}

export default function ChatComponent({
  loading,
  messages,
  model,
  streamingMessage,
  isStreaming,
  onMessageDelete,
}: ChatComponentProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  // 自动滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingMessage]);

  // 复制消息内容
  const handleCopyMessage = async (messageId: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(messageId);
      message.success("消息已复制到剪贴板");

      // 2秒后重置复制状态
      setTimeout(() => {
        setCopiedMessageId(null);
      }, 2000);
    } catch (error) {
      message.error("复制失败，请手动复制");
    }
  };

  return (
    <div className="flex flex-1 flex-col overflow-auto">
      {/* 消息列表 */}
      <div className="flex-1 space-y-4 overflow-y-auto bg-gray-50 p-4 dark:bg-gray-800">
        {messages.length === 0 ? (
          <div className="flex h-full flex-1 items-center justify-center">
            <div className="text-center text-gray-500 dark:text-gray-400">
              <h3 className="mb-2 text-lg font-medium">欢迎使用番茄智能助手</h3>
              <p className="text-sm">我是基于{model}模型的番茄助手</p>
              <p className="mt-1 text-sm">
                你可以问我任何问题，我会尽力为你解答
              </p>
              <div className="mt-4 text-xs text-gray-400">
                <p>💡 支持多轮对话</p>
                <p>🚀 快速响应</p>
                <p>🎯 智能理解</p>
              </div>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`message-bubble group flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`flex max-w-[80%] gap-3 ${
                  message.role === "user" ? "flex-row-reverse" : "flex-row"
                }`}
              >
                <Avatar
                  className={`${
                    message.role === "user" ? "ml-3" : "mr-3"
                  } flex-shrink-0`}
                  icon={
                    message.role === "user" ? (
                      <img
                        draggable={false}
                        src={user?.avatarUrl || "/avatar/a5.png"}
                        alt="avatar"
                      />
                    ) : (
                      <RobotOutlined />
                    )
                  }
                  style={{
                    backgroundColor:
                      message.role === "user" ? "#1890ff" : "#52c41a",
                  }}
                />
                <div className="flex flex-col gap-1">
                  <div
                    className={`rounded-lg px-4 py-2 ${
                      message.role === "user"
                        ? "bg-blue-500 text-white"
                        : "bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white"
                    }`}
                  >
                    <div className="text-sm leading-relaxed">
                      {message.role === "assistant" ? (
                        <MarkdownRenderer content={message.content} />
                      ) : (
                        <div className="whitespace-pre-wrap break-words">
                          {message.content}
                        </div>
                      )}
                    </div>
                    <div
                      className={`mt-1 flex items-center justify-between text-xs opacity-70 ${
                        message.role === "user"
                          ? "text-blue-100"
                          : "text-gray-500"
                      }`}
                    >
                      <span>{message.timestamp.toLocaleTimeString()}</span>
                    </div>
                  </div>

                  {/* 消息工具组 */}
                  <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button
                      type="text"
                      size="small"
                      icon={
                        copiedMessageId === message.id ? (
                          <CheckOutlined />
                        ) : (
                          <CopyOutlined />
                        )
                      }
                      onClick={() =>
                        handleCopyMessage(message.id, message.content)
                      }
                      className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                      title="复制消息"
                    />
                    {onMessageDelete && (
                      <Popconfirm
                        title="删除消息"
                        description="确定要删除这条消息吗？"
                        onConfirm={() => onMessageDelete(message.id)}
                        okText="确定"
                        cancelText="取消"
                      >
                        <Button
                          type="text"
                          size="small"
                          icon={<DeleteOutlined />}
                          className="text-gray-400 hover:text-red-600 dark:text-gray-500 dark:hover:text-red-400"
                          title="删除消息"
                        />
                      </Popconfirm>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}

        {/* 流式消息显示 */}
        {isStreaming && (
          <div className="group flex justify-start">
            <div className="flex max-w-[80%] gap-3">
              <Avatar
                className="mr-3 flex-shrink-0"
                icon={<RobotOutlined />}
                style={{ backgroundColor: "#52c41a" }}
              />
              <div className="flex flex-col gap-1">
                <div className="rounded-lg bg-white px-4 py-2 text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white">
                  <div className="text-sm leading-relaxed">
                    {streamingMessage && (
                      <MarkdownRenderer content={streamingMessage} />
                    )}
                  </div>
                  <div className="mt-1 flex items-center text-xs text-gray-500">
                    <Spin size="small" className="mr-1" />
                    正在输出中...
                  </div>
                </div>

                {/* 流式消息工具组 */}
                <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <Button
                    type="text"
                    size="small"
                    icon={
                      copiedMessageId === "streaming" ? (
                        <CheckOutlined />
                      ) : (
                        <CopyOutlined />
                      )
                    }
                    onClick={() =>
                      handleCopyMessage("streaming", streamingMessage || "")
                    }
                    className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                    title="复制消息"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 加载状态 */}
        {loading && !!messages.length && messages.at(-1)?.role === "user" && (
          <div className="flex justify-start">
            <div className="flex gap-3">
              <Avatar
                className="mr-3 flex-shrink-0"
                icon={<RobotOutlined />}
                style={{ backgroundColor: "#52c41a" }}
              />
              <div className="rounded-lg bg-white px-4 py-2 shadow-sm dark:bg-gray-700">
                <Spin size="small" />
                <span className="ml-2 text-gray-600 dark:text-gray-300">
                  番茄小助理正在思考中...
                </span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
