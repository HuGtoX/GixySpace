"use client";

import React from "react";
import { Card, Splitter } from "antd";
import { useDeviceDetect } from "@/hooks/useDeviceDetect";
import { useTheme } from "@/contexts/ThemeContext";
import ConsolePanel, { ConsoleLog } from "./ConsolePanel";

export type RenderStatus =
  | "idle"
  | "compiling"
  | "rendering"
  | "completed"
  | "error";

interface PreviewPanelProps {
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
  status: RenderStatus;
  logs: ConsoleLog[];
  onClearLogs: () => void;
  onIframeLoad: () => void;
}

const PreviewPanel: React.FC<PreviewPanelProps> = ({
  iframeRef,
  status,
  logs,
  onClearLogs,
  onIframeLoad,
}) => {
  const { isMobile } = useDeviceDetect();
  const { isDarkMode } = useTheme();

  const getStatusText = () => {
    switch (status) {
      case "idle":
        return "等待运行...";
      case "compiling":
        return "编译中...";
      case "rendering":
        return "渲染中...";
      case "completed":
        return "渲染完成";
      case "error":
        return "渲染出错";
      default:
        return "";
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case "idle":
        return "#6b7280";
      case "compiling":
      case "rendering":
        return "#3b82f6";
      case "completed":
        return "#10b981";
      case "error":
        return "#ef4444";
      default:
        return "#6b7280";
    }
  };

  // 预览区域样式
  const previewStyle = {
    width: "100%",
    height: "100%",
    border: "none",
    borderRadius: "6px",
    backgroundColor: isDarkMode ? "#1F2937" : "#ffffff",
  };

  if (isMobile) {
    return (
      <div className="flex h-full flex-col">
        <Card
          title="实时预览"
          className="mb-4 flex-1"
          extra={
            <span style={{ color: getStatusColor(), fontSize: "12px" }}>
              {getStatusText()}
            </span>
          }
          styles={{
            body: { padding: 0, height: "calc(100% - 57px)" },
          }}
        >
          <iframe
            ref={iframeRef}
            style={previewStyle}
            title="Preview"
            sandbox="allow-scripts allow-same-origin allow-forms allow-modals"
            onLoad={onIframeLoad}
          />
        </Card>

        <Card
          title="控制台"
          size="small"
          className="h-48"
          styles={{
            body: { padding: 0, height: "calc(100% - 57px)" },
          }}
        >
          <ConsolePanel logs={logs} onClear={onClearLogs} />
        </Card>
      </div>
    );
  }

  return (
    <Splitter layout="vertical" className="h-full">
      <Splitter.Panel defaultSize="70%">
        <Card
          title="预览"
          size="small"
          className="h-full"
          extra={
            <span style={{ color: getStatusColor(), fontSize: "12px" }}>
              {getStatusText()}
            </span>
          }
          styles={{
            body: { padding: 0, height: "calc(100% - 57px)" },
          }}
        >
          <iframe
            ref={iframeRef}
            style={previewStyle}
            title="Preview"
            sandbox="allow-scripts allow-same-origin allow-forms allow-modals"
            onLoad={onIframeLoad}
          />
        </Card>
      </Splitter.Panel>

      <Splitter.Panel defaultSize="30%" max="40%" min="20%">
        <Card
          title="控制台"
          size="small"
          className="h-full"
          styles={{
            body: { padding: 0, height: "calc(100% - 57px)" },
          }}
        >
          <ConsolePanel logs={logs} onClear={onClearLogs} />
        </Card>
      </Splitter.Panel>
    </Splitter>
  );
};

export default PreviewPanel;
