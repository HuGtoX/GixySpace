"use client";

import React, { useState, useRef } from "react";

interface ScrollContainerProps {
  children?: React.ReactNode;
  className?: string;
  /** 滚动条类型：default(灰色) | primary(主题色) */
  scrollbarType?: "default" | "primary";
  /** 是否始终显示滚动条 */
  alwaysShow?: boolean;
  /** 滚动条宽度 */
  scrollbarWidth?: number;
  /** 自定义样式 */
  style?: React.CSSProperties;
  /** 滚动事件回调 */
  onScroll?: (e: React.UIEvent<HTMLDivElement>) => void;
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
  scrollbarWidth = 6,
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
      {children}
    </div>
  );
}

export default ScrollContainer;
