"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { message } from "antd";
import { useDeviceDetect } from "@/hooks/useDeviceDetect";
import CodeEditor from "@/components/realtimeRender/CodeEditor";
import PreviewPanel, {
  RenderStatus,
} from "@/components/realtimeRender/PreviewPanel";
import CodeRenderer from "@/components/realtimeRender/CodeRenderer";
import FullscreenView from "@/components/realtimeRender/FullscreenView";
import { ConsoleLog } from "@/components/realtimeRender/ConsolePanel";

const defaultCode = `import React, { useState, useEffect } from 'react';

function App() {
  const [count, setCount] = useState(0);
  const [text, setText] = useState('Hello World!');

  // 组件挂载时输出日志
  useEffect(() => {
    console.log('🚀 App组件已挂载');
    console.info('这是一个信息日志');
    console.warn('这是一个警告日志');
    
    return () => {
      console.log('👋 App组件即将卸载');
    };
  }, []);

  // 监听count变化
  useEffect(() => {
    if (count > 0) {
      console.log('📊 计数器更新:', count);
      if (count === 5) {
        console.warn('⚠️ 计数器达到5次了！');
      }
      if (count >= 10) {
        console.error('❌ 计数器超过10次，建议重置！');
      }
    }
  }, [count]);

  const handleIncrement = () => {
    const newCount = count + 1;
    console.log('➕ 点击增加按钮，新值:', newCount);
    setCount(newCount);
  };

  const handleReset = () => {
    console.log('🔄 重置计数器');
    setCount(0);
  };

  const handleTextChange = (e) => {
    const newText = e.target.value;
    console.log('✏️ 文本变更:', { from: text, to: newText });
    setText(newText);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ color: '#FF6347', marginBottom: '20px' }}>{text}</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <input 
          type="text" 
          value={text} 
          onChange={handleTextChange}
          style={{
            padding: '8px 12px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            marginRight: '10px',
            fontSize: '14px'
          }}
        />
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={handleIncrement}
          style={{
            padding: '8px 16px',
            backgroundColor: '#FF6347',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginRight: '10px'
          }}
        >
          点击次数: {count}
        </button>
        
        <button 
          onClick={handleReset}
          style={{
            padding: '8px 16px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          重置
        </button>
      </div>
      
      <div style={{
        padding: '15px',
        backgroundColor: '#f8f9fa',
        border: '1px solid #dee2e6',
        borderRadius: '4px',
        fontSize: '14px'
      }}>
        <p><strong>当前计数:</strong> {count}</p>
        <p><strong>当前文本:</strong> {text}</p>
        <p><strong>时间:</strong> {new Date().toLocaleTimeString()}</p>
      </div>
    </div>
  );
}

export default App;`;

export default function RealTimeRenderPage() {
  const { isMobile } = useDeviceDetect();
  const [code, setCode] = useState<string>(defaultCode);
  const [renderKey, setRenderKey] = useState<number>(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [renderStatus, setRenderStatus] = useState<RenderStatus>("idle");
  const [logs, setLogs] = useState<ConsoleLog[]>([]);
  const [showShortcutHelp, setShowShortcutHelp] = useState<boolean>(false);

  // 防抖渲染
  const debouncedRender = useCallback(() => {
    setRenderStatus("compiling");
    setTimeout(() => {
      setRenderStatus("rendering");
      setRenderKey((prev) => prev + 1);
    }, 300);
  }, []);

  const debouncedRenderWithDelay = useCallback(
    debounce(debouncedRender, 1000),
    [debouncedRender],
  );

  // 代码变化时自动渲染
  useEffect(() => {
    if (code.trim()) {
      debouncedRenderWithDelay();
    }
  }, [code, debouncedRenderWithDelay]);

  // 复制代码
  const handleCopyCode = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      message.success("代码已复制到剪贴板");
    } catch {
      message.error("复制失败，请手动复制");
    }
  }, [code]);

  // 运行/刷新预览
  const handleRunRefresh = useCallback(() => {
    setRenderStatus("compiling");
    setTimeout(() => {
      setRenderStatus("rendering");
      setRenderKey((prev) => prev + 1);
    }, 100);
  }, []);

  // 切换全屏
  const handleToggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => !prev);
  }, []);

  // 切换快捷键帮助
  const handleToggleShortcutHelp = useCallback(() => {
    setShowShortcutHelp((prev) => !prev);
  }, []);

  // iframe加载完成
  const handleIframeLoad = useCallback(() => {
    setRenderStatus("completed");
  }, []);

  // 添加控制台日志
  const handleConsoleLog = useCallback((log: ConsoleLog) => {
    setLogs((prev) => [...prev, log]);
  }, []);

  // 清空控制台日志
  const handleClearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  // 全屏模式
  if (isFullscreen) {
    return (
      <FullscreenView
        code={code}
        onChange={setCode}
        onRun={handleRunRefresh}
        onCopy={handleCopyCode}
        onRefresh={handleRunRefresh}
        onToggleFullscreen={handleToggleFullscreen}
        onToggleShortcutHelp={handleToggleShortcutHelp}
        showShortcutHelp={showShortcutHelp}
        renderKey={renderKey}
        status={renderStatus}
        logs={logs}
        onClearLogs={handleClearLogs}
        onIframeLoad={handleIframeLoad}
        onConsoleLog={handleConsoleLog}
        iframeRef={iframeRef}
      />
    );
  }

  // 移动端显示提示 - 现在移动端也支持编辑
  // if (isMobile) {
  //   return (
  //     <ToolLayout>
  //       <div className="mx-auto max-w-4xl py-12 text-center">
  //         <h2 className="mb-4 text-2xl font-bold">📱 移动端提示</h2>
  //         <p className="mb-6 text-gray-600 dark:text-gray-300">
  //           为了更好的编码体验，建议在桌面端使用实时编辑渲染功能。
  //         </p>
  //       </div>
  //     </ToolLayout>
  //   );
  // }

  // 桌面端布局
  return (
    <div className="h-full">
      <div className="mb-4">
        <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
          实时代码渲染
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          在左侧编辑 React 代码，右侧实时查看渲染效果。支持 JSX 语法和 React
          Hooks。
        </p>
      </div>

      <div
        className={`h-[calc(100vh-200px)] ${
          isMobile ? "flex flex-col gap-4" : "grid grid-cols-2 gap-4"
        }`}
      >
        {/* 代码编辑区 */}
        <CodeEditor
          code={code}
          onChange={setCode}
          onRun={handleRunRefresh}
          onCopy={handleCopyCode}
          onRefresh={handleRunRefresh}
          onToggleFullscreen={handleToggleFullscreen}
          onToggleShortcutHelp={handleToggleShortcutHelp}
          isFullscreen={false}
          showShortcutHelp={showShortcutHelp}
        />

        {/* 预览区 */}
        <PreviewPanel
          iframeRef={iframeRef}
          status={renderStatus}
          logs={logs}
          onClearLogs={handleClearLogs}
          onIframeLoad={handleIframeLoad}
        />
        <CodeRenderer
          code={code}
          iframeRef={iframeRef}
          renderKey={renderKey}
          onConsoleLog={handleConsoleLog}
        />
      </div>

      {/* 移动端提示 */}
      {isMobile && (
        <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/20">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            💡
            提示：在移动端，代码编辑器在上方，预览区域在下方。你可以滚动查看完整内容。
          </p>
        </div>
      )}
    </div>
  );
}

// 防抖函数
function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
