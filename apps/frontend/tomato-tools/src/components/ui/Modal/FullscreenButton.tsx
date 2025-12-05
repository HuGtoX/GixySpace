import React from "react";
import { Tooltip } from "antd";
import type { ButtonProps } from "antd";
import { FullscreenOutlined, FullscreenExitOutlined } from "@ant-design/icons";

/**
 * 全屏按钮组件属性
 */
export interface FullscreenButtonProps extends Omit<ButtonProps, "onClick"> {
  /** 当前是否全屏 */
  isFullscreen: boolean;
  /** 点击回调 */
  onClick: () => void;
  /** 全屏时的提示文本 */
  fullscreenTooltip?: string;
  /** 非全屏时的提示文本 */
  exitFullscreenTooltip?: string;
  /** 是否显示提示 */
  showTooltip?: boolean;
  /** 自定义全屏图标 */
  fullscreenIcon?: React.ReactNode;
  /** 自定义退出全屏图标 */
  exitFullscreenIcon?: React.ReactNode;
}

/**
 * 全屏按钮组件
 *
 * @example
 * ```tsx
 * <FullscreenButton
 *   isFullscreen={isFullscreen}
 *   onClick={toggleFullscreen}
 * />
 * ```
 */
export const FullscreenButton: React.FC<FullscreenButtonProps> = ({
  isFullscreen,
  onClick,
  fullscreenTooltip = "全屏显示",
  exitFullscreenTooltip = "退出全屏",
  showTooltip = true,
  fullscreenIcon,
  exitFullscreenIcon,
}) => {
  // 渲染图标
  const renderIcon = () => {
    if (isFullscreen) {
      return exitFullscreenIcon || <FullscreenExitOutlined />;
    }
    return fullscreenIcon || <FullscreenOutlined />;
  };

  // 渲染按钮
  const button = (
    <button
      onClick={onClick}
      className="flex h-6 w-6 items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
    >
      {renderIcon()}
    </button>
  );

  // 是否显示提示
  if (showTooltip) {
    return (
      <Tooltip title={isFullscreen ? exitFullscreenTooltip : fullscreenTooltip}>
        {button}
      </Tooltip>
    );
  }

  return button;
};

export default FullscreenButton;
