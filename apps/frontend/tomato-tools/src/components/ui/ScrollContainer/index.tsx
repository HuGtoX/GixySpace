"use client";

import React, { useState, useRef } from "react";
import { Skeleton } from "antd";

interface ScrollContainerProps {
  children?: React.ReactNode;
  className?: string;
  scrollbarType?: "default" | "primary";
  /** 是否始终显示滚动条 */
  alwaysShow?: boolean;
  style?: React.CSSProperties;
  onScroll?: (e: React.UIEvent<HTMLDivElement>) => void;
  skeleton?: boolean;
  loading?: boolean;
}

/**
 * 自定义滚动容器组件
 *
 * 特性：
 * - 鼠标悬停时显示滚动条
 * - 支持自定义滚动条样式
 * - 兼容深色模式
 * - 支持移动端触摸滑动
 */
function ScrollContainer({
  children,
  className,
  scrollbarType = "default",
  alwaysShow = false,
  skeleton,
  loading,
  style,
  onScroll,
}: ScrollContainerProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isTouching, setIsTouching] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // 处理触摸事件（移动端）
  const handleTouchStart = () => {
    setIsTouching(true);
  };

  const handleTouchEnd = () => {
    // 延迟隐藏，让用户看到滚动效果
    setTimeout(() => {
      setIsTouching(false);
    }, 1000);
  };

  // 判断是否应该显示滚动条
  const shouldShowScrollbar = alwaysShow || isHovered || isTouching;

  // 构建 CSS 类名
  const scrollbarClassName = alwaysShow
    ? scrollbarType === "primary"
      ? "custom-scrollbar primary-scrollbar"
      : "custom-scrollbar"
    : scrollbarType === "primary"
      ? "hover-scrollbar primary-scrollbar"
      : "hover-scrollbar";

  const showScrollbarClass = shouldShowScrollbar ? "show-scrollbar" : "";

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${scrollbarClassName} ${showScrollbarClass} ${className || ""}`}
      style={style}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onScroll={onScroll}
    >
      {skeleton && loading ? ScrollContainerSkeleton() : children}
    </div>
  );
}

function ScrollContainerSkeleton() {
  return Array(5)
    .fill(0)
    .map((_, index) => (
      <div key={index} className="flex items-center gap-3 p-2">
        <Skeleton.Button shape="circle" size="small" className="h-6 w-6" />
        <Skeleton.Button shape="circle" size="small" className="h-4 w-4" />
        <Skeleton.Input style={{ flex: 1 }} active />
      </div>
    ));
}

export default ScrollContainer;
