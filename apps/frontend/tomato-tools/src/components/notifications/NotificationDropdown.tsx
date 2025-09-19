"use client";

import React, { useState, useEffect } from "react";
import {
  Dropdown,
  Badge,
  Button,
  List,
  Typography,
  Empty,
  Spin,
  message,
  Divider,
  Tag,
  Avatar,
} from "antd";
import {
  FaBell,
  FaCheckDouble,
  FaExternalLinkAlt,
  FaGithub,
  FaExclamationTriangle,
  FaCog,
  FaRocket,
  FaTools,
} from "react-icons/fa";
import { useAuth } from "@/contexts/AuthContext";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/zh-cn";

// 配置 dayjs
dayjs.extend(relativeTime);
dayjs.locale("zh-cn");

const { Text, Title } = Typography;

// 通知类型图标映射
const typeIcons = {
  system: <FaCog className="text-blue-500 dark:text-blue-400" />,
  github: <FaGithub className="text-gray-800 dark:text-gray-200" />,
  update: <FaRocket className="text-green-500 dark:text-green-400" />,
  security: (
    <FaExclamationTriangle className="text-red-500 dark:text-red-400" />
  ),
  feature: <FaRocket className="text-purple-500 dark:text-purple-400" />,
  maintenance: <FaTools className="text-orange-500 dark:text-orange-400" />,
};

// 优先级颜色映射
const priorityColors = {
  low: "default",
  normal: "blue",
  high: "orange",
  urgent: "red",
} as const;

interface NotificationItem {
  id: string;
  userId: string;
  notificationId: string;
  isRead: boolean;
  isArchived: boolean;
  isFavorite: boolean;
  readAt: string | null;
  archivedAt: string | null;
  createdAt: string;
  notification: {
    id: string;
    title: string;
    content: string;
    type: keyof typeof typeIcons;
    priority: keyof typeof priorityColors;
    actionUrl: string | null;
    iconUrl: string | null;
    metadata: any;
    createdAt: string;
  };
}

interface NotificationResponse {
  notifications: NotificationItem[];
  total: number;
  unreadCount: number;
  page: number;
  pageSize: number;
}

const NotificationDropdown: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  // 获取通知列表
  const fetchNotifications = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const response = await fetch(
        `/api/notifications/user/${user.id}?pageSize=10`,
      );
      const result = await response.json();

      if (result.success) {
        const data: NotificationResponse = result.data;
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      } else {
        console.error("Failed to fetch notifications:", result.error);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  // 标记单个通知为已读
  const markAsRead = async (notificationId: string) => {
    if (!user?.id) return;

    try {
      const response = await fetch(`/api/notifications/user/${user.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          notificationId,
        }),
      });

      const result = await response.json();
      if (result.success) {
        // 更新本地状态
        setNotifications((prev) =>
          prev.map((item) =>
            item.notificationId === notificationId
              ? { ...item, isRead: true, readAt: new Date().toISOString() }
              : item,
          ),
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } else {
        message.error("标记失败");
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
      message.error("标记失败");
    }
  };

  // 标记所有通知为已读
  const markAllAsRead = async () => {
    if (!user?.id) return;

    try {
      const response = await fetch(`/api/notifications/user/${user.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          markAll: true,
        }),
      });

      const result = await response.json();
      if (result.success) {
        // 更新本地状态
        setNotifications((prev) =>
          prev.map((item) => ({
            ...item,
            isRead: true,
            readAt: new Date().toISOString(),
          })),
        );
        setUnreadCount(0);
        message.success("已标记所有通知为已读");
      } else {
        message.error("标记失败");
      }
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      message.error("标记失败");
    }
  };

  // 处理通知点击
  const handleNotificationClick = (item: NotificationItem) => {
    // 如果未读，标记为已读
    if (!item.isRead) {
      markAsRead(item.notificationId);
    }

    // 如果有链接，打开链接
    if (item.notification.actionUrl) {
      window.open(item.notification.actionUrl, "_blank");
    }
  };

  // 组件挂载时获取通知
  useEffect(() => {
    if (user?.id) {
      fetchNotifications();
    }
  }, [user?.id]);

  // 定期刷新通知
  useEffect(() => {
    if (!user?.id) return;

    const interval = setInterval(() => {
      fetchNotifications();
    }, 60000); // 30秒刷新一次

    return () => clearInterval(interval);
  }, [user?.id]);

  // 渲染通知列表
  const notificationList = (
    <div className="max-h-96 w-80 overflow-hidden rounded-lg bg-white shadow-lg dark:bg-gray-800 dark:shadow-gray-900/20">
      <div className="flex items-center justify-between border-b border-gray-200 p-3 dark:border-gray-700">
        <Title level={5} className="m-0 text-gray-900 dark:text-gray-100">
          通知
        </Title>
        {unreadCount > 0 && (
          <Button
            type="link"
            size="small"
            icon={<FaCheckDouble />}
            onClick={markAllAsRead}
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            全部已读
          </Button>
        )}
      </div>

      <div className="max-h-80 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center p-4">
            <Spin />
          </div>
        ) : notifications.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="暂无通知"
            className="py-8 text-gray-500 dark:text-gray-400"
          />
        ) : (
          <List
            dataSource={notifications}
            renderItem={(item) => (
              <List.Item
                className={`cursor-pointer border-b border-gray-100 px-4 py-3 transition-colors last:border-b-0 hover:bg-gray-50 dark:border-gray-700/50 dark:hover:bg-gray-700/50 ${
                  !item.isRead ? "bg-blue-50 dark:bg-blue-900/20" : ""
                }`}
                onClick={() => handleNotificationClick(item)}
              >
                <div className="flex w-full items-start gap-1 px-3">
                  <div className="mt-1 flex-shrink-0">
                    {item.notification.iconUrl ? (
                      <Avatar
                        src={item.notification.iconUrl}
                        size={24}
                        className="bg-gray-100 dark:bg-gray-700"
                      />
                    ) : (
                      <div className="dark:[&>svg]:brightness-125">
                        {typeIcons[item.notification.type] || typeIcons.system}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <Text
                        strong={!item.isRead}
                        className={`text-sm ${
                          !item.isRead
                            ? "text-gray-900 dark:text-gray-100"
                            : "text-gray-600 dark:text-gray-300"
                        }`}
                      >
                        {item.notification.title}
                      </Text>
                      {!item.isRead && (
                        <div className="ml-2 h-2 w-2 flex-shrink-0 rounded-full bg-blue-500 dark:bg-blue-400" />
                      )}
                    </div>

                    <Text
                      className={`mt-1 block text-xs ${
                        !item.isRead
                          ? "text-gray-700 dark:text-gray-200"
                          : "text-gray-500 dark:text-gray-400"
                      }`}
                    >
                      {item.notification.content.length > 60
                        ? `${item.notification.content.substring(0, 60)}...`
                        : item.notification.content}
                    </Text>

                    <div className="mt-2 flex items-center justify-between">
                      <Tag
                        color={priorityColors[item.notification.priority]}
                        className="dark:border-gray-600"
                      >
                        {item.notification.type}
                      </Tag>

                      <div className="flex items-center space-x-2">
                        <Text className="text-xs text-gray-400 dark:text-gray-500">
                          {dayjs(item.notification.createdAt).fromNow()}
                        </Text>
                        {item.notification.actionUrl && (
                          <FaExternalLinkAlt className="text-xs text-gray-400 dark:text-gray-500" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </List.Item>
            )}
          />
        )}
      </div>

      {notifications.length > 0 && (
        <>
          <Divider className="m-0 border-gray-200 dark:border-gray-700" />
          <div className="bg-gray-50 p-3 text-center dark:bg-gray-800/50">
            <Button
              type="link"
              size="small"
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              查看全部通知
            </Button>
          </div>
        </>
      )}
    </div>
  );

  return (
    <Dropdown
      dropdownRender={() => notificationList}
      trigger={["click"]}
      open={open}
      onOpenChange={setOpen}
      placement="bottomRight"
    >
      <Badge count={unreadCount} size="small" offset={[-2, 2]}>
        <Button
          shape="circle"
          icon={<FaBell className="text-gray-600 dark:text-gray-300" />}
          className="relative border-gray-200 bg-white transition-colors hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700"
        />
      </Badge>
    </Dropdown>
  );
};

export default NotificationDropdown;
