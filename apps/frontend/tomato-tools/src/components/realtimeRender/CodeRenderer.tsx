"use client";

import React, { useEffect } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { ConsoleLog } from "./ConsolePanel";

interface CodeRendererProps {
  code: string;
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
  renderKey: number;
  onConsoleLog?: (log: ConsoleLog) => void;
}

const CodeRenderer: React.FC<CodeRendererProps> = ({
  code,
  iframeRef,
  renderKey,
  onConsoleLog,
}) => {
  const { isDarkMode } = useTheme();

  useEffect(() => {
    // 如果iframe不存在就退出
    if (!iframeRef.current) return;

    // 设置消息监听器来接收console日志
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === "console-log" && onConsoleLog) {
        onConsoleLog(event.data.data);
      }
    };

    window.addEventListener("message", handleMessage);

    const renderCode = () => {
      // 获取iframe实例 如果iframe不存在就退出
      const iframe = iframeRef.current;
      console.log("CodeRenderer useEffect执行了:", iframe);
      if (!iframe) return;

      // 获取iframe的document 获取不到就退出
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      console.log("CodeRenderer doc:", doc);
      if (!doc) return;

      // 转义用户代码中的特殊字符
      const escapedCode = code
        .replace(/\\/g, "\\\\")
        .replace(/`/g, "\\`")
        .replace(/\${/g, "\\${");

      const htmlContent = `
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Preview</title>
          <style>
            body {
              margin: 0;
              padding: 0;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
              background-color: ${isDarkMode ? "#1F2937" : "#ffffff"};
              color: ${isDarkMode ? "#ffffff" : "#000000"};
            }
            * {
              box-sizing: border-box;
            }
            .loading {
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              font-size: 16px;
              color: #666;
            }
            .error {
              padding: 20px;
              color: #e74c3c;
              font-family: monospace;
              white-space: pre-wrap;
              background-color: #fdf2f2;
              border: 1px solid #e74c3c;
              border-radius: 4px;
              margin: 20px;
            }
          </style>
        </head>
        <body>
          <div id="root">
            <div class="loading">正在加载...</div>
          </div>
          
          <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
          <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
          <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
          
          <script>
            // 设置console日志捕获
            (function() {
              const originalConsole = {
                log: console.log,
                warn: console.warn,
                error: console.error,
                info: console.info
              };
              
              function sendLogToParent(type, args) {
                try {
                  const message = args.map(arg => {
                    if (typeof arg === 'object') {
                      try {
                        return JSON.stringify(arg, null, 2);
                      } catch {
                        return String(arg);
                      }
                    }
                    return String(arg);
                  }).join(' ');
                  
                  window.parent.postMessage({
                    type: 'console-log',
                    data: {
                      id: Date.now() + '-' + Math.random().toString(36).substr(2, 9),
                      type: type,
                      message: message,
                      timestamp: Date.now(),
                      args: args
                    }
                  }, '*');
                } catch (error) {
                  // 静默处理错误，避免无限循环
                }
              }
              
              // 重写console方法
              console.log = function(...args) {
                originalConsole.log.apply(console, args);
                sendLogToParent('log', args);
              };
              
              console.warn = function(...args) {
                originalConsole.warn.apply(console, args);
                sendLogToParent('warn', args);
              };
              
              console.error = function(...args) {
                originalConsole.error.apply(console, args);
                sendLogToParent('error', args);
              };
              
              console.info = function(...args) {
                originalConsole.info.apply(console, args);
                sendLogToParent('info', args);
              };
              
              // 捕获未处理的错误
              window.addEventListener('error', function(event) {
                sendLogToParent('error', [event.message + ' at ' + event.filename + ':' + event.lineno]);
              });
              
              // 捕获未处理的Promise拒绝
              window.addEventListener('unhandledrejection', function(event) {
                sendLogToParent('error', ['Unhandled Promise Rejection:', event.reason]);
              });
            })();
            
            // 等待所有库加载完成
            function waitForLibraries() {
              return new Promise((resolve) => {
                const checkLibraries = () => {
                  if (window.React && window.ReactDOM && window.Babel) {
                    console.log('所有库已加载完成');
                    resolve();
                  } else {
                    console.log('等待库加载...', {
                      React: !!window.React,
                      ReactDOM: !!window.ReactDOM,
                      Babel: !!window.Babel
                    });
                    setTimeout(checkLibraries, 100);
                  }
                };
                checkLibraries();
              });
            }
            
            waitForLibraries().then(() => {
              try {
                console.log('开始编译用户代码...');
                
                // 用户代码
                const userCode = \`${escapedCode}\`;
                
                // 使用Babel转换JSX - 添加插件处理import语句
                const transformedCode = Babel.transform(userCode, {
                  presets: [['react', { runtime: 'classic' }]],
                  plugins: [
                    // 自定义插件处理import和export语句
                     function removeImportsAndExports() {
                       return {
                         visitor: {
                           ImportDeclaration(path) {
                             path.remove();
                           },
                           ExportDefaultDeclaration(path) {
                             // 将 export default 转换为普通声明
                             const declaration = path.node.declaration;
                             path.replaceWith(declaration);
                           },
                           ExportNamedDeclaration(path) {
                             // 移除 export 关键字，保留声明
                             if (path.node.declaration) {
                               path.replaceWith(path.node.declaration);
                             } else {
                               path.remove();
                             }
                           }
                         }
                       };
                     }
                  ]
                }).code;
                
                console.log('代码编译成功，开始执行...');
                // console.log('转换后的代码:', transformedCode);
                
                // 创建一个安全的执行环境
                const React = window.React;
                const ReactDOM = window.ReactDOM;
                const { useState, useEffect, useRef, useCallback, useMemo } = React;
                
                // 执行转换后的代码
                const executeCode = new Function(
                  'React', 
                  'ReactDOM', 
                  'useState', 
                  'useEffect', 
                  'useRef', 
                  'useCallback', 
                  'useMemo',
                  transformedCode + '; return typeof App !== "undefined" ? App : null;'
                );
                
                // 执行代码并获取App组件
                const App = executeCode(React, ReactDOM, useState, useEffect, useRef, useCallback, useMemo);
                
                if (typeof App !== 'function') {
                  throw new Error('App 必须是一个 React 组件函数，请确保导出了 App 组件');
                }
                
                console.log('App组件创建成功，开始渲染...');
                
                // 渲染组件
                const container = document.getElementById('root');
                if (container) {
                  const root = ReactDOM.createRoot(container);
                  root.render(React.createElement(App));
                  console.log('渲染完成');
                } else {
                  throw new Error('找不到根容器元素');
                }
              } catch (error) {
                console.error('渲染错误:', error);
                const container = document.getElementById('root');
                if (container) {
                  container.innerHTML = \`
                    <div class="error">
                      <h3 style="margin-top: 0; color: #c0392b;">渲染错误:</h3>
                      <pre>\${error.toString()}</pre>
                      <details style="margin-top: 10px;">
                        <summary style="cursor: pointer; color: #c0392b;">错误详情</summary>
                        <pre style="margin-top: 10px; font-size: 12px;">\${error.stack || '无堆栈信息'}</pre>
                      </details>
                    </div>
                  \`;
                }
              }
            });
          </script>
        </body>
      `;

      doc.open();
      doc.write(htmlContent);
      doc.close();
    };

    console.log("CodeRenderer 开始渲染,renderKey:", renderKey);

    // 延迟渲染，确保iframe完全加载
    const timer = setTimeout(renderCode, 100);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("message", handleMessage);
    };
  }, [code, renderKey, isDarkMode, onConsoleLog, iframeRef]);

  return null; // 这是一个逻辑组件，不渲染任何UI
};

export default CodeRenderer;
