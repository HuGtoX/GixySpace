"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/contexts/ThemeContext";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

interface RouteLoadingProps {
  children: React.ReactNode;
}

export default function RouteLoading({ children }: RouteLoadingProps) {
  const { isDarkMode } = useTheme();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  // 监听路由变化
  useEffect(() => {
    // 路由开始变化时显示加载
    setIsLoading(true);
    setProgress(0);

    // 模拟加载进度
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 5;
      });
    }, 100);

    // 路由变化完成后隐藏加载
    const timer = setTimeout(() => {
      setProgress(100);
      setTimeout(() => setIsLoading(false), 300);
    }, 500);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [pathname, searchParams]);

  return (
    <div className="relative flex min-h-screen flex-col">
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="fixed left-0 right-0 top-0 z-50 overflow-hidden border-b border-gray-200 bg-white shadow-sm transition-colors duration-300 dark:border-gray-700 dark:bg-gray-800"
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.1 }}
              className={`h-1 ${isDarkMode ? "bg-dark-primary" : "bg-primary"}`}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div>{children}</div>
    </div>
  );
}
