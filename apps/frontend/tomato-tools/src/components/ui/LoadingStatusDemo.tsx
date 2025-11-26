"use client";

import React from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { Card, Badge, Space, Typography } from "antd";

const { Text } = Typography;

function LoadingStatusDemo(): React.ReactElement {
  const { isLoading: themeLoading, isDarkMode } = useTheme();
  const { loading: authLoading, user } = useAuth();

  return (
    <Card title="应用加载状态演示" className="mb-6" size="small">
      <Space direction="vertical" className="w-full">
        <div className="flex items-center justify-between">
          <Text>主题加载状态:</Text>
          <Badge
            status={themeLoading ? "processing" : "success"}
            text={
              themeLoading
                ? "加载中"
                : `已完成 (${isDarkMode ? "暗色" : "亮色"})`
            }
          />
        </div>

        <div className="flex items-center justify-between">
          <Text>认证加载状态:</Text>
          <Badge
            status={authLoading ? "processing" : "success"}
            text={
              authLoading ? "验证中" : `已完成 (${user ? "已登录" : "未登录"})`
            }
          />
        </div>

        <div className="flex items-center justify-between">
          <Text>应用整体状态:</Text>
          <Badge
            status={!themeLoading && !authLoading ? "success" : "processing"}
            text={!themeLoading && !authLoading ? "就绪" : "初始化中"}
          />
        </div>
      </Space>
    </Card>
  );
}

export default LoadingStatusDemo;
