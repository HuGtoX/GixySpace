"use client";

import React, { useState, useEffect } from "react";
import { StyleProvider } from "@ant-design/cssinjs";
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
    bodyBg: "#F8FAFC",
    inputBg: "#FFFFFF",
    cardBg: "#FFFFFF",
    hoverBg: "#F1F5F9",
  },
};

const componentsTheme = (isDarkMode: boolean) => ({
  Button: {
    borderRadius: 8,
    controlHeight: 40,
    boxShadow: isDarkMode ? "none" : "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
    primaryShadow: isDarkMode ? "none" : "0 1px 2px 0 rgba(255, 99, 71, 0.2)",
  },
  Input: {
    borderRadius: 8,
    controlHeight: 40,
    colorBgContainer: isDarkMode
      ? themeColors.dark.inputBg
      : themeColors.light.inputBg,
    colorBorder: isDarkMode ? "#374151" : "#E2E8F0",
    activeBorderColor: isDarkMode ? "#FF6347" : "#FF6347",
    hoverBorderColor: isDarkMode ? "#4B5563" : "#CBD5E1",
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
      : "0 1px 3px 0 rgba(0, 0, 0, 0.08), 0 1px 2px -1px rgba(0, 0, 0, 0.08)",
    colorBgContainer: isDarkMode
      ? themeColors.dark.bg
      : themeColors.light.cardBg,
    colorBorderSecondary: isDarkMode ? "#374151" : "#E2E8F0",
  },
  Modal: {
    borderRadius: 12,
    contentBg: isDarkMode ? themeColors.dark.bg : themeColors.light.bg,
    headerBg: isDarkMode ? themeColors.dark.bg : themeColors.light.bg,
  },
  Drawer: {
    borderRadius: 12,
    colorBgElevated: isDarkMode ? themeColors.dark.bg : themeColors.light.bg,
  },
  Table: {
    colorBgContainer: isDarkMode ? themeColors.dark.bg : themeColors.light.bg,
    colorBorderSecondary: isDarkMode ? "#374151" : "#E2E8F0",
    headerBg: isDarkMode ? "#374151" : "#F8FAFC",
    rowHoverBg: isDarkMode ? "rgba(255, 255, 255, 0.05)" : "#F8FAFC",
  },
  Select: {
    colorBgContainer: isDarkMode
      ? themeColors.dark.inputBg
      : themeColors.light.inputBg,
    colorBgElevated: isDarkMode ? themeColors.dark.bg : themeColors.light.bg,
  },
  DatePicker: {
    colorBgContainer: isDarkMode
      ? themeColors.dark.inputBg
      : themeColors.light.inputBg,
    colorBgElevated: isDarkMode ? themeColors.dark.bg : themeColors.light.bg,
  },
  Popover: {
    colorBgElevated: isDarkMode ? themeColors.dark.bg : themeColors.light.bg,
  },
  Dropdown: {
    colorBgElevated: isDarkMode ? themeColors.dark.bg : themeColors.light.bg,
  },
});

function AntdProvider({ children }: AntdProviderProps) {
  const { isDarkMode, isLoading: themeLoading } = useTheme();
  const [isClient, setIsClient] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // 确保在客户端执行
    setIsClient(true);

    // 添加一个小延迟确保所有组件都准备就绪
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // 移除loading检查，让AppProvider统一处理

  // 服务端渲染时使用默认浅色主题
  const themeConfig = isClient
    ? {
        algorithm: isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: "#FF6347",
          colorBgSpotlight: "rgba(0,0,0,0.7)",
          colorBgContainer: isDarkMode
            ? themeColors.dark.bg
            : themeColors.light.bg,
          colorBgLayout: isDarkMode
            ? themeColors.dark.bodyBg
            : themeColors.light.bodyBg,
          colorBgElevated: isDarkMode
            ? themeColors.dark.bg
            : themeColors.light.bg,
          colorBorder: isDarkMode ? "#374151" : "#E2E8F0",
          colorBorderSecondary: isDarkMode ? "#374151" : "#E2E8F0",
          colorText: isDarkMode ? "#F9FAFB" : "#1E293B",
          colorTextSecondary: isDarkMode ? "#D1D5DB" : "#64748B",
          colorTextTertiary: isDarkMode ? "#9CA3AF" : "#94A3B8",
          colorTextQuaternary: isDarkMode ? "#6B7280" : "#CBD5E1",
          colorFillSecondary: isDarkMode
            ? "rgba(255, 255, 255, 0.08)"
            : "#F1F5F9",
          colorFillTertiary: isDarkMode
            ? "rgba(255, 255, 255, 0.04)"
            : "#F8FAFC",
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
    <StyleProvider hashPriority="high">
      <ConfigProvider locale={zhCN} theme={themeConfig}>
        <AntApp>
          <div>{children}</div>
        </AntApp>
      </ConfigProvider>
    </StyleProvider>
  );
}

export default AntdProvider;
