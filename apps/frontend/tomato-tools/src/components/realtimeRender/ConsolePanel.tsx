'use client';

import React, { useEffect, useRef } from "react";
import { Button, Tooltip } from "antd";
import { ClearOutlined, DownloadOutlined } from "@ant-design/icons";
import { useTheme } from "@/contexts/ThemeContext";

export interface ConsoleLog {
  id: string;
  type: "log" | "warn" | "error" | "info";
  message: string;
  timestamp: number;
  args?: unknown[];
}

interface ConsolePanelProps {
  logs: ConsoleLog[];
  onClear: () => void;
}

const ConsolePanel: React.FC<ConsolePanelProps> = ({ logs, onClear }) => {
  const { isDarkMode } = useTheme();
  const scrollRef = useRef<HTMLDivElement>(null);

  // 自动滚动到底部
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  // 导出日志
  const handleExportLogs = () => {
    const logText = logs
      .map((log) => {
        const time = new Date(log.timestamp).toLocaleTimeString();
        return `[${time}] [${log.type.toUpperCase()}] ${log.message}`;
      })
      .join("\n");

    const blob = new Blob([logText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `console-logs-${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 格式化消息
  const formatMessage = (log: ConsoleLog) => {
    try {
      // 如果消息是对象，尝试格式化
      if (log.args && log.args.length > 0) {
        return log.args
          .map((arg) => {
            if (typeof arg === "object") {
              return JSON.stringify(arg, null, 2);
            }
            return String(arg);
          })
          .join(" ");
      }
      return log.message;
    } catch {
      return log.message;
    }
  };

  // 获取日志样式
  const getLogStyle = (type: ConsoleLog["type"]) => {
    const baseStyle = {
      padding: "4px 8px",
      margin: "2px 0",
      borderRadius: "3px",
      fontSize: "12px",
      fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
      lineHeight: "1.4",
      wordBreak: "break-word" as const,
      whiteSpace: "pre-wrap" as const,
    };

    switch (type) {
      case "error":
        return {
          ...baseStyle,
          backgroundColor: isDarkMode ? "#2d1b1b" : "#fef2f2",
          color: isDarkMode ? "#fca5a5" : "#dc2626",
          borderLeft: "3px solid #dc2626",
        };
      case "warn":
        return {
          ...baseStyle,
          backgroundColor: isDarkMode ? "#2d2a1b" : "#fffbeb",
          color: isDarkMode ? "#fbbf24" : "#d97706",
          borderLeft: "3px solid #d97706",
        };
      case "info":
        return {
          ...baseStyle,
          backgroundColor: isDarkMode ? "#1e293b" : "#eff6ff",
          color: isDarkMode ? "#60a5fa" : "#2563eb",
          borderLeft: "3px solid #2563eb",
        };
      default:
        return {
          ...baseStyle,
          backgroundColor: isDarkMode ? "#1f2937" : "#f9fafb",
          color: isDarkMode ? "#d1d5db" : "#374151",
          borderLeft: "3px solid #6b7280",
        };
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* 固定头部 */}
      <div
        style={{
          padding: "12px 16px",
          borderBottom: `1px solid ${isDarkMode ? "#374151" : "#e5e7eb"}`,
          backgroundColor: isDarkMode ? "#1f2937" : "#fafafa",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontSize: "14px",
            fontWeight: 500,
            color: isDarkMode ? "#f9fafb" : "#374151",
          }}
        >
          控制台输出
        </span>
        <div className="flex items-center gap-2">
          <Tooltip title="导出日志">
            <Button
              type="text"
              size="small"
              icon={<DownloadOutlined />}
              onClick={handleExportLogs}
              disabled={logs.length === 0}
            />
          </Tooltip>
          <Tooltip title="清空日志">
            <Button
              type="text"
              size="small"
              icon={<ClearOutlined />}
              onClick={onClear}
              disabled={logs.length === 0}
            />
          </Tooltip>
        </div>
      </div>

      {/* 可滚动内容区域 */}
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflow: "auto",
          padding: "8px 8px 16px 8px", // 底部增加额外padding确保最后一条日志完全可见
          backgroundColor: isDarkMode ? "#111827" : "#ffffff",
        }}
      >
        {logs.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              color: isDarkMode ? "#6b7280" : "#9ca3af",
              fontSize: "12px",
              padding: "20px",
            }}
          >
            暂无控制台输出
          </div>
        ) : (
          <>
            {logs.map((log) => {
              const time = new Date(log.timestamp).toLocaleTimeString();
              return (
                <div key={log.id} style={getLogStyle(log.type)}>
                  <span
                    style={{
                      opacity: 0.7,
                      fontSize: "11px",
                      marginRight: "8px",
                    }}
                  >
                    {time}
                  </span>
                  <span style={{ fontWeight: "bold", marginRight: "8px" }}>
                    [{log.type.toUpperCase()}]
                  </span>
                  <span>{formatMessage(log)}</span>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
};

export default ConsolePanel;