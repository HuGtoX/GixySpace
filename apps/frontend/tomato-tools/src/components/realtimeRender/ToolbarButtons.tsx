"use client";

import React from "react";
import { Button, Tooltip } from "antd";
import {
  PlayCircleOutlined,
  CopyOutlined,
  ReloadOutlined,
  FormatPainterOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
  QuestionCircleOutlined,
} from "@ant-design/icons";
import { useDeviceDetect } from "@/hooks/useDeviceDetect";

interface ToolbarButtonsProps {
  onRun: () => void;
  onCopy: () => void;
  onRefresh: () => void;
  onToggleFullscreen: () => void;
  onToggleShortcutHelp?: () => void;
  onFormat?: () => void;
  isFullscreen: boolean;
}

const ToolbarButtons: React.FC<ToolbarButtonsProps> = ({
  onRun,
  onCopy,
  onRefresh,
  onToggleFullscreen,
  onToggleShortcutHelp,
  onFormat,
  isFullscreen,
}) => {
  const { isMobile } = useDeviceDetect();

  return (
    <div className="flex items-center gap-2">
      <Tooltip title="运行代码 (Ctrl/Cmd+Enter)">
        <Button
          type="primary"
          size="small"
          icon={<PlayCircleOutlined />}
          onClick={onRun}
        >
          运行
        </Button>
      </Tooltip>

      <Tooltip title="复制代码">
        <Button size="small" icon={<CopyOutlined />} onClick={onCopy}>
          复制
        </Button>
      </Tooltip>

      <Tooltip title="刷新预览">
        <Button size="small" icon={<ReloadOutlined />} onClick={onRefresh}>
          刷新
        </Button>
      </Tooltip>

      {onFormat && (
        <Tooltip title="格式化代码">
          <Button
            size="small"
            icon={<FormatPainterOutlined />}
            onClick={onFormat}
          >
            格式化
          </Button>
        </Tooltip>
      )}

      <Tooltip title={isFullscreen ? "退出全屏" : "全屏模式"}>
        <Button
          size="small"
          icon={
            isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />
          }
          onClick={onToggleFullscreen}
        >
          {isFullscreen ? "退出全屏" : "全屏"}
        </Button>
      </Tooltip>

      {onToggleShortcutHelp && !isMobile && (
        <Tooltip title="快捷键帮助">
          <Button
            size="small"
            icon={<QuestionCircleOutlined />}
            onClick={onToggleShortcutHelp}
          >
            帮助
          </Button>
        </Tooltip>
      )}
    </div>
  );
};

export default ToolbarButtons;
