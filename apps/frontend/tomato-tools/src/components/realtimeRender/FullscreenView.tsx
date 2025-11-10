"use client";

import React from "react";
import { Splitter } from "antd";
import { useDeviceDetect } from "@/hooks/useDeviceDetect";
import CodeEditor from "./CodeEditor";
import PreviewPanel, { RenderStatus } from "./PreviewPanel";
import CodeRenderer from "./CodeRenderer";
import { ConsoleLog } from "./ConsolePanel";

interface FullscreenViewProps {
  code: string;
  onChange: (value: string) => void;
  onRun: () => void;
  onCopy: () => void;
  onRefresh: () => void;
  onToggleFullscreen: () => void;
  onToggleShortcutHelp: () => void;
  showShortcutHelp: boolean;
  renderKey: number;
  status: RenderStatus;
  logs: ConsoleLog[];
  onClearLogs: () => void;
  onIframeLoad: () => void;
  onConsoleLog: (log: ConsoleLog) => void;
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
}

const FullscreenView: React.FC<FullscreenViewProps> = ({
  code,
  onChange,
  onRun,
  onCopy,
  onRefresh,
  onToggleFullscreen,
  onToggleShortcutHelp,
  showShortcutHelp,
  renderKey,
  status,
  logs,
  onClearLogs,
  onIframeLoad,
  onConsoleLog,
  iframeRef,
}) => {
  const { isMobile } = useDeviceDetect();

  if (isMobile) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-gray-900">
        <div className="flex-1 p-4">
          <CodeEditor
            code={code}
            onChange={onChange}
            onRun={onRun}
            onCopy={onCopy}
            onRefresh={onRefresh}
            onToggleFullscreen={onToggleFullscreen}
            onToggleShortcutHelp={onToggleShortcutHelp}
            isFullscreen={true}
            showShortcutHelp={showShortcutHelp}
          />
        </div>
        <div className="flex-1 p-4 pt-0">
          <PreviewPanel
            iframeRef={iframeRef}
            status={status}
            logs={logs}
            onClearLogs={onClearLogs}
            onIframeLoad={onIframeLoad}
          />
          <CodeRenderer
            code={code}
            iframeRef={iframeRef}
            renderKey={renderKey}
            onConsoleLog={onConsoleLog}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-white dark:bg-gray-900">
      <div className="h-full p-4">
        <Splitter className="h-full">
          <Splitter.Panel size="50%" min="30%">
            <CodeEditor
              code={code}
              onChange={onChange}
              onRun={onRun}
              onCopy={onCopy}
              onRefresh={onRefresh}
              onToggleFullscreen={onToggleFullscreen}
              onToggleShortcutHelp={onToggleShortcutHelp}
              isFullscreen={true}
              showShortcutHelp={showShortcutHelp}
            />
          </Splitter.Panel>

          <Splitter.Panel>
            <PreviewPanel
              iframeRef={iframeRef}
              status={status}
              logs={logs}
              onClearLogs={onClearLogs}
              onIframeLoad={onIframeLoad}
            />
            <CodeRenderer
              code={code}
              iframeRef={iframeRef}
              renderKey={renderKey}
              onConsoleLog={onConsoleLog}
            />
          </Splitter.Panel>
        </Splitter>
      </div>
    </div>
  );
};

export default FullscreenView;
