import React from "react";
import { FullscreenButton } from "./FullscreenButton";
import { CloseOutlined } from "@ant-design/icons";

interface IBtnMenusProps {
  showFullscreen?: boolean;
  isFullscreen: boolean;
  toggleFullscreen: () => void;
  onClose: () => void;
}

// Modal右上角工具组件
function BtnMenus(props: IBtnMenusProps) {
  const { isFullscreen, toggleFullscreen, showFullscreen, onClose } = props;

  return (
    <div className="flex items-center gap-2">
      {showFullscreen && (
        <FullscreenButton
          isFullscreen={isFullscreen}
          onClick={toggleFullscreen}
        />
      )}
      <button
        onClick={onClose}
        className="flex h-6 w-6 items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
        aria-label="关闭"
      >
        <CloseOutlined className="text-sm" />
      </button>
    </div>
  );
}

export default BtnMenus;
