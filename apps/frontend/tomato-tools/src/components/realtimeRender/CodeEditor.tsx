"use client";

import React, { useRef } from "react";
import { Card } from "antd";
import Editor, { Monaco } from "@monaco-editor/react";
import { useDeviceDetect } from "@/hooks/useDeviceDetect";
import { useTheme } from "@/contexts/ThemeContext";
import ToolbarButtons from "./ToolbarButtons";
import ShortcutHelp from "./ShortcutHelp";

interface CodeEditorProps {
  code: string;
  onChange: (value: string) => void;
  onRun: () => void;
  onCopy: () => void;
  onRefresh: () => void;
  onToggleFullscreen: () => void;
  onToggleShortcutHelp: () => void;
  isFullscreen: boolean;
  showShortcutHelp: boolean;
}

const CodeEditor: React.FC<CodeEditorProps> = ({
  code,
  onChange,
  onRun,
  onCopy,
  onRefresh,
  onToggleFullscreen,
  onToggleShortcutHelp,
  isFullscreen,
  showShortcutHelp,
}) => {
  const { isMobile } = useDeviceDetect();
  const { isDarkMode } = useTheme();
  const editorRef = useRef<unknown>(null);

  const handleEditorDidMount = (editor: unknown, monaco: Monaco) => {
    editorRef.current = editor;

    // 配置Monaco Editor
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.Latest,
      allowNonTsExtensions: true,
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
      module: monaco.languages.typescript.ModuleKind.CommonJS,
      noEmit: true,
      esModuleInterop: true,
      jsx: monaco.languages.typescript.JsxEmit.React,
      reactNamespace: "React",
      allowJs: true,
      typeRoots: ["node_modules/@types"],
    });

    // 添加React类型定义
    const reactTypes = `
      declare module 'react' {
        export = React;
        export as namespace React;
        namespace React {
          interface Component<P = {}, S = {}, SS = any> {}
          class Component<P, S> {
            constructor(props: Readonly<P> | P);
            setState<K extends keyof S>(
              state: ((prevState: Readonly<S>, props: Readonly<P>) => (Pick<S, K> | S | null)) | (Pick<S, K> | S | null),
              callback?: () => void
            ): void;
            render(): ReactNode;
          }
          
          type ReactNode = ReactChild | ReactFragment | ReactPortal | boolean | null | undefined;
          type ReactChild = ReactElement | ReactText;
          type ReactText = string | number;
          type ReactElement<P = any, T extends string | JSXElementConstructor<any> = string | JSXElementConstructor<any>> = {
            type: T;
            props: P;
            key: Key | null;
          };
          type ReactFragment = {} | ReactNodeArray;
          type ReactPortal = ReactElement;
          interface ReactNodeArray extends Array<ReactNode> {}
          type JSXElementConstructor<P> = ((props: P) => ReactElement | null) | (new (props: P) => Component<P, any>);
          type Key = string | number;
          
          function useState<S>(initialState: S | (() => S)): [S, (value: S | ((prevState: S) => S)) => void];
          function useEffect(effect: () => void | (() => void), deps?: any[]): void;
          function useCallback<T extends (...args: any[]) => any>(callback: T, deps: any[]): T;
          function useMemo<T>(factory: () => T, deps: any[]): T;
          function useRef<T>(initialValue: T): {current: T};
          function useRef<T>(initialValue: T | null): {current: T | null};
          function useRef<T = undefined>(): {current: T | undefined};
          
          interface HTMLAttributes<T> {
            className?: string;
            style?: any;
            onClick?: (event: any) => void;
            onChange?: (event: any) => void;
            onSubmit?: (event: any) => void;
            children?: ReactNode;
          }
          
          interface ButtonHTMLAttributes<T> extends HTMLAttributes<T> {
            disabled?: boolean;
            type?: 'button' | 'submit' | 'reset';
          }
          
          interface InputHTMLAttributes<T> extends HTMLAttributes<T> {
            value?: string | number;
            placeholder?: string;
            type?: string;
          }
          
          namespace JSX {
            interface IntrinsicElements {
              div: HTMLAttributes<HTMLDivElement>;
              span: HTMLAttributes<HTMLSpanElement>;
              p: HTMLAttributes<HTMLParagraphElement>;
              h1: HTMLAttributes<HTMLHeadingElement>;
              h2: HTMLAttributes<HTMLHeadingElement>;
              h3: HTMLAttributes<HTMLHeadingElement>;
              button: ButtonHTMLAttributes<HTMLButtonElement>;
              input: InputHTMLAttributes<HTMLInputElement>;
              form: HTMLAttributes<HTMLFormElement>;
              ul: HTMLAttributes<HTMLUListElement>;
              li: HTMLAttributes<HTMLLIElement>;
              img: HTMLAttributes<HTMLImageElement> & { src?: string; alt?: string; };
              a: HTMLAttributes<HTMLAnchorElement> & { href?: string; target?: string; };
            }
          }
        }
      }
    `;

    monaco.languages.typescript.typescriptDefaults.addExtraLib(
      reactTypes,
      "file:///node_modules/@types/react/index.d.ts",
    );

    // 添加快捷键
    (editor as { addCommand: (keyMod: number, callback: () => void) => void }).addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, onRun);
    (editor as { addCommand: (keyMod: number, callback: (e: { preventDefault: () => void }) => void) => void }).addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, (e: { preventDefault: () => void }) => {
      e.preventDefault();
      onRun();
    });
  };

  const handleFormat = () => {
    if (editorRef.current) {
      (editorRef.current as { getAction: (action: string) => { run: () => void } }).getAction("editor.action.formatDocument").run();
    }
  };

  const editorOptions = {
    minimap: { enabled: !isMobile },
    fontSize: isMobile ? 14 : 16,
    fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
    wordWrap: "on" as const,
    automaticLayout: true,
    tabSize: 2,
    renderLineHighlight: "all" as const,
    cursorStyle: "line" as const,
    folding: true,
    lineNumbers: "on" as const,
    quickSuggestions: {
      other: true,
      comments: true,
      strings: true,
    },
    bracketPairColorization: {
      enabled: true,
    },
    autoIndent: "full" as const,
    find: {
      addExtraSpaceOnTop: false,
    },
  };

  return (
    <>
      <Card
        title="代码编辑器"
        className="h-full"
        extra={
          <ToolbarButtons
            onRun={onRun}
            onCopy={onCopy}
            onRefresh={onRefresh}
            onToggleFullscreen={onToggleFullscreen}
            onToggleShortcutHelp={onToggleShortcutHelp}
            onFormat={handleFormat}
            isFullscreen={isFullscreen}
          />
        }
        styles={{
          body: { padding: 0, height: "calc(100% - 57px)" },
        }}
      >
        <Editor
          height="100%"
          defaultLanguage="typescript"
          value={code}
          onChange={(value) => onChange(value || "")}
          onMount={handleEditorDidMount}
          theme={isDarkMode ? "vs-dark" : "light"}
          options={editorOptions}
        />
      </Card>

      {showShortcutHelp && (
        <ShortcutHelp
          visible={showShortcutHelp}
          onClose={onToggleShortcutHelp}
        />
      )}
    </>
  );
};

export default CodeEditor;
