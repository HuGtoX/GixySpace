import { useState, useEffect, useCallback, useRef } from "react";

/**
 * 全屏配置选项
 */
export interface FullscreenOptions {
  /** 默认是否全屏 */
  defaultFullscreen?: boolean;
  /** 是否启用快捷键（F11或Esc） */
  enableHotkey?: boolean;
  /** 自定义快捷键 */
  hotkey?: string;
  /** 全屏状态变化回调 */
  onFullscreenChange?: (isFullscreen: boolean) => void;
  /** 进入全屏前的回调 */
  onBeforeEnter?: () => boolean | void;
  /** 退出全屏前的回调 */
  onBeforeExit?: () => boolean | void;
}

/**
 * 全屏控制返回值
 */
export interface FullscreenControls {
  /** 当前是否全屏 */
  isFullscreen: boolean;
  /** 进入全屏 */
  enterFullscreen: () => void;
  /** 退出全屏 */
  exitFullscreen: () => void;
  /** 切换全屏状态 */
  toggleFullscreen: () => void;
  /** 设置全屏状态 */
  setFullscreen: (value: boolean) => void;
}

/**
 * 全屏控制Hook
 *
 * @example
 * ```tsx
 * const { isFullscreen, toggleFullscreen } = useFullscreen({
 *   defaultFullscreen: false,
 *   enableHotkey: true,
 *   onFullscreenChange: (isFullscreen) => {
 *     console.log('全屏状态:', isFullscreen);
 *   }
 * });
 * ```
 */
export function useFullscreen(
  options: FullscreenOptions = {},
): FullscreenControls {
  const {
    defaultFullscreen = false,
    enableHotkey = false,
    hotkey = "F11",
    onFullscreenChange,
    onBeforeEnter,
    onBeforeExit,
  } = options;

  const [isFullscreen, setIsFullscreen] = useState(defaultFullscreen);
  const isFullscreenRef = useRef(isFullscreen);

  // 同步ref和state
  useEffect(() => {
    isFullscreenRef.current = isFullscreen;
  }, [isFullscreen]);

  // 进入全屏
  const enterFullscreen = useCallback(() => {
    // 执行进入前的回调
    if (onBeforeEnter) {
      const result = onBeforeEnter();
      if (result === false) return;
    }

    setIsFullscreen(true);
    onFullscreenChange?.(true);
  }, [onBeforeEnter, onFullscreenChange]);

  // 退出全屏
  const exitFullscreen = useCallback(() => {
    // 执行退出前的回调
    if (onBeforeExit) {
      const result = onBeforeExit();
      if (result === false) return;
    }

    setIsFullscreen(false);
    onFullscreenChange?.(false);
  }, [onBeforeExit, onFullscreenChange]);

  // 切换全屏状态
  const toggleFullscreen = useCallback(() => {
    if (isFullscreenRef.current) {
      exitFullscreen();
    } else {
      enterFullscreen();
    }
  }, [enterFullscreen, exitFullscreen]);

  // 快捷键处理
  useEffect(() => {
    if (!enableHotkey) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // 支持F11快捷键
      if (hotkey === "F11" && event.key === "F11") {
        event.preventDefault();
        toggleFullscreen();
        return;
      }

      // 支持Esc退出全屏
      if (event.key === "Escape" && isFullscreenRef.current) {
        event.preventDefault();
        exitFullscreen();
        return;
      }

      // 支持自定义快捷键
      if (hotkey && event.key === hotkey) {
        event.preventDefault();
        toggleFullscreen();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [enableHotkey, hotkey, toggleFullscreen, exitFullscreen]);

  return {
    isFullscreen,
    enterFullscreen,
    exitFullscreen,
    toggleFullscreen,
    setFullscreen: setIsFullscreen,
  };
}
