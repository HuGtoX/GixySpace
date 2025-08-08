"use client";

import React, { useState, createContext, useContext, useEffect } from "react";

// 定义主题上下文类型
interface ThemeContextType {
  isDarkMode: boolean;
  toggleTheme: () => void;
}

// 主题上下文，提供明确的类型定义
const ThemeContext = createContext<ThemeContextType>({
  isDarkMode: false,
  toggleTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

interface ThemeProviderProps {
  children: React.ReactNode;
}

const ThemeProvider = ({ children }: ThemeProviderProps) => {
  // 使用函数初始化形式，确保在组件初始化时就确定主题
  // 服务端和客户端保持一致的初始值
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  // 在客户端水合完成后，再从localStorage加载用户的主题偏好
  useEffect(() => {
    setIsHydrated(true);
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem("isDarkMode");
      if (savedTheme !== null) {
        setIsDarkMode(JSON.parse(savedTheme));
      }
    }
  }, []);

  // 只在水合完成后设置文档类名，避免水合过程中主题切换导致的className不匹配
  useEffect(() => {
    if (isHydrated) {
      document.documentElement.classList.toggle("dark", isDarkMode);
    }
  }, [isDarkMode, isHydrated]);

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    localStorage.setItem("isDarkMode", JSON.stringify(newTheme));
    document.documentElement.classList.toggle("dark", newTheme);
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;
