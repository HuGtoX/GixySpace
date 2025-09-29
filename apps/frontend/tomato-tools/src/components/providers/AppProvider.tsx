"use client";

import React, { useState, useEffect } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import LoadingScreen from "@/components/ui/LoadingScreen";

interface AppProviderProps {
  children: React.ReactNode;
}

function AppProvider({ children }: AppProviderProps) {
  const { isLoading: themeLoading } = useTheme();
  const { loading: authLoading } = useAuth();
  const [isClientReady, setIsClientReady] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("正在初始化应用...");

  useEffect(() => {
    // 客户端准备就绪，添加小延迟确保所有组件都准备好
    const timer = setTimeout(() => {
      setIsClientReady(true);
    }, 200);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // 根据不同的loading状态更新消息
    if (!isClientReady) {
      setLoadingMessage("正在初始化客户端...");
    } else if (themeLoading) {
      setLoadingMessage("正在加载主题配置...");
    } else if (authLoading) {
      setLoadingMessage("正在验证用户身份...");
    } else {
      setLoadingMessage("即将完成...");
    }
  }, [themeLoading, authLoading, isClientReady]);

  // 检查是否所有必要的初始化都完成了
  const isAppReady = isClientReady && !themeLoading && !authLoading;

  if (!isAppReady) {
    return <LoadingScreen message={loadingMessage} />;
  }

  return <>{children}</>;
}

export default AppProvider;
