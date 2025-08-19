"use client";

import React, { useState, useEffect } from "react";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { ConfigProvider, theme, App as AntApp } from "antd";
import { useTheme } from "@/contexts/ThemeContext";
import zhCN from "antd/locale/zh_CN";
import dayjs from "dayjs";
import "dayjs/locale/zh-cn";

// 确保dayjs使用正确的语言环境
if (typeof window !== "undefined") {
  dayjs.locale("zh-cn");
}

interface AntdProviderProps {
  children: React.ReactNode;
}
// 结构化颜色配置
export const themeColors = {
  dark: {
    bg: "#1F2937",
    bodyBg: "#111827",
    inputBg: "rgba(0, 0, 0, 0.3)",
  },
  light: {
    bg: "#FFFFFF",
    bodyBg: "#F9FAFB",
    inputBg: "#F3F4F6",
  },
};

const componentsTheme = (isDarkMode: boolean) => ({
  Button: {
    borderRadius: 8,
    controlHeight: 40,
  },
  Input: {
    borderRadius: 8,
    controlHeight: 40,
  },
  Layout: {
    bodyBg: isDarkMode ? themeColors.dark.bodyBg : themeColors.light.bodyBg, // gray-900 : gray-50
    headerBg: isDarkMode ? themeColors.dark.bg : themeColors.light.bg,
    siderBg: isDarkMode ? themeColors.dark.bg : themeColors.light.bg,
    headerPadding: "0 20px",
  },
  Card: {
    borderRadius: 12,
    boxShadow: isDarkMode
      ? "0 4px 6px -1px rgba(0, 0, 0, 0.3)"
      : "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
  },
  Modal: {
    borderRadius: 12,
  },
  Drawer: {
    borderRadius: 12,
  },
});

const AntdProvider = ({ children }: AntdProviderProps) => {
  const { isDarkMode } = useTheme();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // 确保在客户端执行
    setIsClient(true);
  }, []);

  // 服务端渲染时使用默认浅色主题
  const themeConfig = isClient
    ? {
        algorithm: isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: "#FF6347",
          colorBgSpotlight: "rgba(0,0,0,0.7)",
          colorBgContainer: isDarkMode
            ? themeColors.dark.inputBg
            : themeColors.light.inputBg,
        },
        components: componentsTheme(isDarkMode),
      }
    : {
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: "#FF6347",
          colorBgSpotlight: "rgba(0,0,0,0.7)",
        },
        components: componentsTheme(false),
      };

  return (
    <AntdRegistry>
      <ConfigProvider locale={zhCN} theme={themeConfig}>
        <AntApp>
          <div>{children}</div>
        </AntApp>
      </ConfigProvider>
    </AntdRegistry>
  );
};

export default AntdProvider;
