"use client";

import React from "react";
import { Spin } from "antd";

interface LoadingScreenProps {
  message?: string;
}

function LoadingScreen({
  message = "正在初始化应用...",
}: LoadingScreenProps): React.ReactElement {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white dark:bg-gray-900">
      <div className="text-center">
        {/* 番茄Logo */}
        <div className="mb-8">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-orange-500 shadow-lg">
            <span className="text-2xl">🍅</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            番茄工具
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            实用在线工具集合
          </p>
        </div>

        {/* 加载动画 */}
        <div className="mb-4">
          <Spin size="large" />
        </div>

        {/* 加载消息 */}
        <p className="animate-pulse text-sm text-gray-500 dark:text-gray-400">
          {message}
        </p>
      </div>
    </div>
  );
}

export default LoadingScreen;
