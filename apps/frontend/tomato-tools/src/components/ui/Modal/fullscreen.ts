/**
 * 全屏功能模块统一导出
 *
 * @module Fullscreen
 * @description 提供完整的全屏功能解决方案，包括状态管理、UI组件和布局容器
 */

// Hooks
export {
  useFullscreen,
  useNativeFullscreen,
  type FullscreenOptions,
  type FullscreenControls,
} from "@/hooks/useFullscreen";

// Components
export {
  FullscreenButton,
  type FullscreenButtonProps,
} from "@/components/ui/Modal/FullscreenButton";
