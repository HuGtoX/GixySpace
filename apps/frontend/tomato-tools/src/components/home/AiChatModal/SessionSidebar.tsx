"use client";

import { useState } from "react";
import {
  Button,
  List,
  Typography,
  Tooltip,
  Popconfirm,
  Input,
  Space,
} from "antd";
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from "@ant-design/icons";
import type { ChatSession } from "./types";
import dayjs from "dayjs";

const { Text } = Typography;

interface SessionSidebarProps {
  sessions: ChatSession[];
  currentSessionId: string | null;
  collapsed: boolean;
  onSessionSelect: (sessionId: string) => void;
  onSessionCreate: () => void;
  onSessionDelete: (sessionId: string) => void;
  onSessionRename: (sessionId: string, newTitle: string) => void;
  onToggleCollapse: () => void;
}

export default function SessionSidebar({
  sessions,
  currentSessionId,
  collapsed,
  onSessionSelect,
  onSessionCreate,
  onSessionDelete,
  onSessionRename,
  onToggleCollapse,
}: SessionSidebarProps) {
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");

  // 开始编辑会话标题
  const handleStartEdit = (session: ChatSession) => {
    setEditingSessionId(session.id);
    setEditingTitle(session.title);
  };

  // 确认编辑
  const handleConfirmEdit = () => {
    if (editingSessionId && editingTitle.trim()) {
      onSessionRename(editingSessionId, editingTitle.trim());
    }
    setEditingSessionId(null);
    setEditingTitle("");
  };

  // 取消编辑
  const handleCancelEdit = () => {
    setEditingSessionId(null);
    setEditingTitle("");
  };

  // 生成会话标题
  const getSessionTitle = (session: ChatSession) => {
    if (session.title !== "新对话") {
      return session.title;
    }
    // 如果是默认标题且有消息，使用第一条用户消息作为标题
    const firstUserMessage = session.messages.find(
      (msg) => msg.role === "user",
    );
    if (firstUserMessage) {
      return (
        firstUserMessage.content.slice(0, 20) +
        (firstUserMessage.content.length > 20 ? "..." : "")
      );
    }
    return session.title;
  };

  return (
    <div
      className={`flex h-full flex-col border-r bg-gray-50 transition-all duration-300 dark:border-gray-600 dark:bg-gray-800 ${
        collapsed ? "w-12" : "w-64"
      }`}
    >
      <div className="flex items-center justify-between  p-3 ">
        {!collapsed && (
          <Text className="font-medium text-gray-700 dark:text-gray-300">
            会话列表
          </Text>
        )}
        <Button
          type="text"
          size="small"
          icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={onToggleCollapse}
          className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
        />
      </div>

      <div className="p-3">
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={onSessionCreate}
          className={`w-full ${collapsed ? "px-0" : ""}`}
          size={collapsed ? "small" : "middle"}
        >
          {!collapsed && "新建会话"}
        </Button>
      </div>

      {/* 会话列表 */}
      <div className="flex-1 overflow-y-auto pr-2">
        <List
          dataSource={sessions}
          renderItem={(session) => (
            <List.Item
              className={`cursor-pointer rounded-sm border-none px-3 py-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 ${
                currentSessionId === session.id
                  ? "bg-blue-50 dark:bg-blue-900/30"
                  : ""
              }`}
              onClick={() => onSessionSelect(session.id)}
            >
              <div className="flex w-full items-center justify-between px-2">
                <div className="flex min-w-0 flex-1 items-center space-x-2">
                  {!collapsed && (
                    <div className="min-w-0 flex-1">
                      {editingSessionId === session.id ? (
                        <Input
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          onPressEnter={handleConfirmEdit}
                          onBlur={handleCancelEdit}
                          size="small"
                          autoFocus
                          className="w-full"
                        />
                      ) : (
                        <div>
                          <Text
                            className={`block truncate text-sm ${
                              currentSessionId === session.id
                                ? "font-medium text-blue-600 dark:text-blue-400"
                                : "text-gray-700 dark:text-gray-300"
                            }`}
                          >
                            {getSessionTitle(session)}
                          </Text>
                          <span className="block truncate text-xs text-gray-500 dark:text-gray-400">
                            {dayjs(session.updatedAt).format(
                              "YYYY-MM-DD HH:mm",
                            )}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {!collapsed && currentSessionId === session.id && (
                  <Space size="small" onClick={(e) => e.stopPropagation()}>
                    <Tooltip title="重命名">
                      <Button
                        type="text"
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => handleStartEdit(session)}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                      />
                    </Tooltip>
                    <Popconfirm
                      title="确定删除这个会话吗？"
                      description="删除后无法恢复"
                      onConfirm={() => onSessionDelete(session.id)}
                      okText="确定"
                      cancelText="取消"
                    >
                      <Tooltip title="删除">
                        <Button
                          type="text"
                          size="small"
                          icon={<DeleteOutlined />}
                          className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                        />
                      </Tooltip>
                    </Popconfirm>
                  </Space>
                )}
              </div>
            </List.Item>
          )}
        />
      </div>

      {/* 底部信息 */}
      {!collapsed && (
        <div className="border-t p-3 dark:border-gray-600">
          <Text className="text-xs text-gray-500 dark:text-gray-400">
            共 {sessions.length} 个会话
          </Text>
        </div>
      )}
    </div>
  );
}
