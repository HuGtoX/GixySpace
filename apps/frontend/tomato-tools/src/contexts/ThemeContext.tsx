"use client";

import React, { useState, createContext, useContext, useEffect } from "react";

// 定义主题上下文类型
interface ThemeContextType {
  isDarkMode: boolean;
  toggleTheme: () => void;
  isLoading: boolean;
}

// 主题上下文，提供明确的类型定义
const ThemeContext = createContext<ThemeContextType>({
  isDarkMode: false,
  toggleTheme: () => {},
  isLoading: true,
});

export const useTheme = () => useContext(ThemeContext);

interface ThemeProviderProps {
  children: React.ReactNode;
}

function ThemeProvider({ children }: ThemeProviderProps) {
  // 服务端和客户端都使用相同的初始值，避免水合不匹配
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  // 在客户端水合完成后，同步localStorage的主题设置
  useEffect(() => {
    const initializeTheme = async () => {
      if (typeof window !== "undefined") {
        try {
          const savedTheme = localStorage.getItem("isDarkMode");
          if (savedTheme !== null) {
            const parsedTheme = JSON.parse(savedTheme);
            if (parsedTheme !== isDarkMode) {
              setIsDarkMode(parsedTheme);
            }
          }
        } catch (e) {
          // 解析失败时保持当前状态
          console.warn("Failed to parse theme from localStorage:", e);
        }
      }

      // 添加小延迟确保主题应用完成
      setTimeout(() => {
        setIsLoading(false);
      }, 100);
    };

    initializeTheme();
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    localStorage.setItem("isDarkMode", JSON.stringify(newTheme));
    document.documentElement.classList.toggle("dark", newTheme);
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme, isLoading }}>
      {children}
    </ThemeContext.Provider>
  );
}

export default ThemeProvider;
