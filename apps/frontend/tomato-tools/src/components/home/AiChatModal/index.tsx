"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Button, Input, message, Switch, Tooltip } from "antd";
import { SendOutlined, RobotOutlined, GlobalOutlined } from "@ant-design/icons";
import ChatComponent from "./ChatComponent";
import SessionSidebar from "./SessionSidebar";
import GModal from "@/components/ui/Modal";
import { createContextMemoryManager } from "@/lib/contextMemory";
import "./styles.css";
import type { ChatSession, AiChatModalProps, ChatApiRequest } from "./types";
import {
  fetchSessions,
  fetchSessionWithMessages,
  createSession,
  updateSession,
  deleteSession,
  addMessage,
  deleteMessage,
  generateSessionTitle,
  saveCurrentSessionId,
  loadCurrentSessionId,
} from "./sessionDbUtils";

export default function AiChatModal({
  open,
  onClose,
  title = "番茄智能助手",
  model = "deepseek-chat",
  width = 1200,
  height = 600,
}: AiChatModalProps) {
  // 会话管理状态
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // 聊天状态
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isOnlineSearch, setIsOnlineSearch] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 上下文记忆管理器
  const memoryManager = useMemo(
    () =>
      createContextMemoryManager({
        maxMessages: 20, // 最多保留20条消息作为上下文
        maxTokens: 4000, // 最多4000个token
        enableSummary: false,
        keepSystemMessages: true,
      }),
    [],
  );

  // 获取当前会话
  const currentSession = sessions.find(
    (session) => session.id === currentSessionId,
  );
  const messages = currentSession?.messages || [];

  // 初始化会话数据
  useEffect(() => {
    if (open) {
      const initSessions = async () => {
        const savedSessions = await fetchSessions();
        const savedCurrentSessionId = loadCurrentSessionId();

        if (savedSessions.length === 0) {
          // 如果没有保存的会话，创建一个新会话
          const newSession = await createSession(model, isOnlineSearch);
          if (newSession) {
            setSessions([newSession]);
            setCurrentSessionId(newSession.id);
            saveCurrentSessionId(newSession.id);
          }
        } else {
          setSessions(savedSessions);
          // 检查保存的当前会话ID是否有效
          const validSessionId = savedSessions.find(
            (s) => s.id === savedCurrentSessionId,
          )
            ? savedCurrentSessionId
            : savedSessions[0].id;
          setCurrentSessionId(validSessionId);
          saveCurrentSessionId(validSessionId);

          // 加载当前会话的消息
          if (validSessionId) {
            const sessionWithMessages =
              await fetchSessionWithMessages(validSessionId);
            if (sessionWithMessages) {
              setSessions((prev) =>
                prev.map((s) =>
                  s.id === validSessionId ? sessionWithMessages : s,
                ),
              );
            }
          }
        }
      };

      initSessions();
    }
  }, [open, model]);

  // 自动滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 发送消息
  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading || isStreaming || !currentSessionId)
      return;

    const userMessageContent = inputValue.trim();
    setIsLoading(true);
    setStreamingMessage("");

    try {
      // 先添加用户消息到数据库
      console.log("[AiChatModal] 正在保存用户消息到数据库...");
      const userMessage = await addMessage(
        currentSessionId,
        userMessageContent,
        "user",
      );

      if (!userMessage) {
        console.error("[AiChatModal] 保存用户消息失败，返回null");
        message.error("发送消息失败");
        setIsLoading(false);
        return;
      }

      // 更新本地状态
      setSessions((prev) =>
        prev.map((s) =>
          s.id === currentSessionId
            ? { ...s, messages: [...s.messages, userMessage] }
            : s,
        ),
      );
      setInputValue("");

      // 如果是第一条消息，更新会话标题和联网查询状态
      if (messages.length === 0) {
        const title = generateSessionTitle([userMessage]);
        await updateSession(currentSessionId, {
          title,
          isOnlineSearch,
        });
        setSessions((prev) =>
          prev.map((s) =>
            s.id === currentSessionId ? { ...s, title, isOnlineSearch } : s,
          ),
        );
      } else {
        // 更新会话的联网查询状态
        await updateSession(currentSessionId, {
          isOnlineSearch,
        });
        setSessions((prev) =>
          prev.map((s) =>
            s.id === currentSessionId ? { ...s, isOnlineSearch } : s,
          ),
        );
      }

      setIsLoading(false);
      setIsStreaming(true);

      // 构建上下文历史（不包括刚添加的用户消息，因为会在API中作为当前消息）
      const conversationHistory = memoryManager.buildContextHistory(
        messages, // 使用当前会话的历史消息
      );

      console.log(
        `[AiChatModal] 发送请求，上下文消息数: ${conversationHistory.length}`,
      );

      // 发送流式请求
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userMessageContent,
          model: currentSession?.model || model,
          isOnlineSearch,
          stream: true, // 启用流式输出
          conversationHistory, // 传递对话历史上下文
          maxContextMessages: 20, // 最大上下文消息数
        } as ChatApiRequest),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error("响应体为空");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";

      try {
        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            break;
          }

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);

              if (data === "[DONE]") {
                // 流式输出完成
                setIsStreaming(false);

                // 保存完整的AI回复到数据库
                if (fullContent.trim()) {
                  const assistantMessage = await addMessage(
                    currentSessionId,
                    fullContent.trim(),
                    "assistant",
                  );

                  if (assistantMessage) {
                    // 更新本地状态
                    setSessions((prev) =>
                      prev.map((s) =>
                        s.id === currentSessionId
                          ? {
                              ...s,
                              messages: [...s.messages, assistantMessage],
                            }
                          : s,
                      ),
                    );
                  }
                }
                setStreamingMessage("");
                return;
              }

              try {
                const parsed = JSON.parse(data);
                if (parsed.content) {
                  fullContent += parsed.content;
                  setStreamingMessage(fullContent);
                }
              } catch (e) {
                // 忽略解析错误
                console.warn("解析流式数据失败:", e);
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    } catch (error: any) {
      console.error("[AiChatModal] 发送消息失败:", {
        error,
        message: error.message,
        response: error.response,
        stack: error.stack,
      });
      const errorMessage =
        error.response?.error || error.message || "发送消息失败，请稍后重试";
      message.error(errorMessage);
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
      setStreamingMessage("");
    }
  };

  // 处理回车发送
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // 会话管理函数
  const handleSessionSelect = async (sessionId: string) => {
    setCurrentSessionId(sessionId);
    saveCurrentSessionId(sessionId);
    const session = sessions.find((s) => s.id === sessionId);
    if (session) {
      setIsOnlineSearch(session.isOnlineSearch || false);
      // 如果会话没有加载消息，则加载
      if (session.messages.length === 0) {
        const sessionWithMessages = await fetchSessionWithMessages(sessionId);
        if (sessionWithMessages) {
          setSessions((prev) =>
            prev.map((s) => (s.id === sessionId ? sessionWithMessages : s)),
          );
        }
      }
    }
  };

  const handleSessionCreate = async () => {
    const newSession = await createSession(model, isOnlineSearch);
    if (newSession) {
      const updatedSessions = [newSession, ...sessions];
      setSessions(updatedSessions);
      setCurrentSessionId(newSession.id);
      saveCurrentSessionId(newSession.id);
      message.success("已创建新会话");
    } else {
      message.error("创建会话失败");
    }
  };

  const handleSessionDelete = async (sessionId: string) => {
    const success = await deleteSession(sessionId);
    if (!success) {
      message.error("删除会话失败");
      return;
    }

    const updatedSessions = sessions.filter((s) => s.id !== sessionId);
    setSessions(updatedSessions);

    // 如果删除的是当前会话，切换到其他会话或创建新会话
    if (currentSessionId === sessionId) {
      if (updatedSessions.length > 0) {
        setCurrentSessionId(updatedSessions[0].id);
        saveCurrentSessionId(updatedSessions[0].id);
        // 加载新选中会话的消息
        const sessionWithMessages = await fetchSessionWithMessages(
          updatedSessions[0].id,
        );
        if (sessionWithMessages) {
          setSessions((prev) =>
            prev.map((s) =>
              s.id === updatedSessions[0].id ? sessionWithMessages : s,
            ),
          );
        }
      } else {
        const newSession = await createSession(model, isOnlineSearch);
        if (newSession) {
          setSessions([newSession]);
          setCurrentSessionId(newSession.id);
          saveCurrentSessionId(newSession.id);
        }
      }
    }
    message.success("会话已删除");
  };

  const handleSessionRename = async (sessionId: string, newTitle: string) => {
    const success = await updateSession(sessionId, { title: newTitle });
    if (success) {
      setSessions((prev) =>
        prev.map((s) => (s.id === sessionId ? { ...s, title: newTitle } : s)),
      );
      message.success("会话已重命名");
    } else {
      message.error("重命名失败");
    }
  };

  const handleToggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  // 删除消息
  const handleMessageDelete = async (messageId: string) => {
    if (!currentSessionId) return;

    const success = await deleteMessage(currentSessionId, messageId);
    if (success) {
      // 更新本地状态，移除已删除的消息
      setSessions((prev) =>
        prev.map((s) =>
          s.id === currentSessionId
            ? {
                ...s,
                messages: s.messages.filter((msg) => msg.id !== messageId),
              }
            : s,
        ),
      );
      message.success("消息已删除");
    } else {
      message.error("删除消息失败");
    }
  };

  // 关闭Modal时的处理
  const handleClose = () => {
    onClose();
  };

  return (
    <GModal
      title={
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <RobotOutlined className="text-blue-500" />
            <span>{title}</span>
            <span className="text-xs text-gray-500">
              ({currentSession?.model || model})
            </span>
          </div>
          <div className="flex flex-1 items-center justify-center space-x-2">
            {currentSession && (
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {currentSession.title}
              </span>
            )}
          </div>
        </div>
      }
      visible={open}
      onClose={handleClose}
      width={width}
      height={height}
      showFullscreen={true}
      styles={{
        body: {
          padding: 0,
          display: "flex",
          flexDirection: "row",
        },
      }}
      destroyOnHidden={false}
      maskClosable={false}
      className="ai-chat-modal"
    >
      <div className="flex h-[100%] overflow-hidden">
        <SessionSidebar
          sessions={sessions}
          currentSessionId={currentSessionId}
          collapsed={sidebarCollapsed}
          onSessionSelect={handleSessionSelect}
          onSessionCreate={handleSessionCreate}
          onSessionDelete={handleSessionDelete}
          onSessionRename={handleSessionRename}
          onToggleCollapse={handleToggleSidebar}
        />

        <div className="flex flex-1 flex-col">
          <ChatComponent
            model={currentSession?.model || model}
            messages={messages}
            loading={isLoading}
            streamingMessage={streamingMessage}
            isStreaming={isStreaming}
            onMessageDelete={handleMessageDelete}
          />

          {/* 输入区域 */}
          <div className="border-t bg-white p-4 dark:border-gray-600 dark:bg-gray-900">
            <div className="flex space-x-3">
              <Input.TextArea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="输入你的问题... (Enter发送，Shift+Enter换行)"
                autoSize={{ minRows: 1, maxRows: 3 }}
                disabled={isLoading || isStreaming}
                className="flex-1"
                style={{ resize: "none" }}
              />
              <Button
                icon={<SendOutlined />}
                onClick={handleSendMessage}
                disabled={
                  !inputValue.trim() ||
                  isLoading ||
                  isStreaming ||
                  !currentSessionId
                }
                size="large"
                className="flex-shrink-0"
              >
                {isStreaming ? "输出中..." : "发送"}
              </Button>
            </div>

            {/* 底部控制栏 */}
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Tooltip title="开启后AI将能够搜索最新信息">
                  <div className="flex items-center space-x-2">
                    <GlobalOutlined className="text-gray-500 dark:text-gray-400" />
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      联网查询
                    </span>
                    <Switch
                      size="small"
                      checked={isOnlineSearch}
                      onChange={setIsOnlineSearch}
                      disabled={isLoading || isStreaming}
                    />
                  </div>
                </Tooltip>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  基于 {currentSession?.model || model} 模型提供服务
                </span>
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                按 Enter 发送，Shift + Enter 换行
              </span>
            </div>
          </div>
        </div>
      </div>
    </GModal>
  );
}
