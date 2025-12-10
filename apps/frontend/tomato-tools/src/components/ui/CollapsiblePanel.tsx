import React from "react";
import { FaChevronLeft } from "react-icons/fa";

interface CollapsiblePanelProps {
  /** 是否折叠状态 */
  collapsed: boolean;
  /** 折叠状态改变回调 */
  onToggleCollapse: () => void;
  /** 子元素内容 */
  children: React.ReactNode;
  /** 折叠时的宽度 */
  collapsedWidth?: string;
  /** 展开时的宽度 */
  expandedWidth?: string;
  /** 面板位置 */
  position?: "left" | "right";
  /** 折叠时显示的文本 */
  collapsedText?: string;
  /** 折叠按钮位置 */
  buttonPosition?: {
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
  };
  /** 自定义容器类名 */
  className?: string;
  /** 自定义按钮类名 */
  buttonClassName?: string;
  /** 折叠提示文本 */
  collapsedTitle?: string;
  /** 展开提示文本 */
  expandedTitle?: string;
}

const CollapsiblePanel: React.FC<CollapsiblePanelProps> = ({
  collapsed,
  onToggleCollapse,
  children,
  collapsedWidth = "w-12",
  expandedWidth = "w-64",
  position = "left",
  collapsedText = "历史",
  buttonPosition,
  className = "",
  buttonClassName = "",
  collapsedTitle = "展开",
  expandedTitle = "收起",
}) => {
  // 默认按钮位置
  const defaultButtonPosition =
    position === "left"
      ? { top: "3.5rem", right: "-0.75rem" }
      : { top: "1rem", left: "-0.75rem" };

  const finalButtonPosition = buttonPosition || defaultButtonPosition;

  // 构建按钮位置样式
  const buttonPositionStyle: React.CSSProperties = {
    top: finalButtonPosition.top,
    right: finalButtonPosition.right,
    left: finalButtonPosition.left,
  };

  // 根据位置确定边框方向
  const borderClass =
    position === "left"
      ? "border-r border-gray-200 dark:border-gray-700"
      : "border-l border-gray-200 dark:border-gray-700";

  // 根据位置确定按钮旋转方向
  const getButtonRotation = () => {
    if (position === "left") {
      return collapsed ? "rotate-180" : "";
    }
    return collapsed ? "" : "rotate-180";
  };

  return (
    <div
      className={`relative flex h-full flex-col bg-gray-50 transition-all duration-300 dark:bg-gray-800/50 ${borderClass} ${
        collapsed ? collapsedWidth : expandedWidth
      } ${className}`}
    >
      {/* 折叠按钮 */}
      <button
        onClick={onToggleCollapse}
        className={`absolute z-10 flex h-6 w-6 items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm transition-all hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 ${buttonClassName}`}
        style={buttonPositionStyle}
        title={collapsed ? collapsedTitle : expandedTitle}
        aria-label={collapsed ? collapsedTitle : expandedTitle}
      >
        <FaChevronLeft
          size={10}
          className={`text-gray-600 transition-transform dark:text-gray-400 ${getButtonRotation()}`}
        />
      </button>

      {/* 内容区域 */}
      <div className={`flex-1 overflow-hidden ${collapsed ? "hidden" : ""}`}>
        {children}
      </div>

      {/* 折叠状态下的提示 */}
      {collapsed && collapsedText && (
        <div className="flex h-full items-center justify-center">
          <div className="rotate-90 whitespace-nowrap text-xs text-gray-400 dark:text-gray-500">
            {collapsedText}
          </div>
        </div>
      )}
    </div>
  );
};

export default CollapsiblePanel;
