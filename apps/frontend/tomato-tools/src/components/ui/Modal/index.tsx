import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Modal } from "antd";
import type { ModalProps } from "antd/es/modal";
import { useTheme } from "@/contexts/ThemeContext";
import { useFullscreen } from "@/hooks/useFullscreen";
import BtnMenus from "./BtnMenus";

type GModalProps = {
  title?: string | React.ReactNode;
  children: React.ReactNode;
  visible: boolean;
  onClose: () => void;
  styles?: ModalProps | any;
  isMacOSStyle?: boolean; // 是否启用MacOS风格
  showFullscreen?: boolean; // 是否显示全屏按钮
  defaultFullscreen?: boolean; // 默认是否全屏
  onFullscreenChange?: (isFullscreen: boolean) => void; // 全屏状态变化回调
  destroyOnHidden?: boolean; // 关闭时是否销毁子元素
  maskClosable?: boolean; // 点击蒙层是否允许关闭
  className?: string; // 自定义类名
} & Omit<ModalProps, "title" | "visible" | "onCancel" | "open" | "styles">;

function GModal(props: GModalProps) {
  const {
    title,
    children,
    visible,
    onClose,
    isMacOSStyle = false,
    showFullscreen = false,
    defaultFullscreen = false,
    onFullscreenChange,
    width = 500,
    height,
    style,
    styles,
    destroyOnHidden = false,
    maskClosable = true,
    className = "",
    ...restProps
  } = props;
  const { isDarkMode } = useTheme();

  const { isFullscreen, toggleFullscreen } = useFullscreen({
    defaultFullscreen,
    onFullscreenChange,
  });

  React.useEffect(() => {
    if (!visible) {
      const timer = setTimeout(() => {
        document.body.style.removeProperty("overflow");
      }, 100);
      return () => clearTimeout(timer);
    }
    if (visible) {
      document.body.style.setProperty("overflow", "hidden", "important");
    }
  }, [visible, isFullscreen]);

  const _height = height ? height : "auto";
  const modalWidth = isFullscreen ? "100%" : width;
  const baseBodyStyle = {
    display: "flex",
    flexDirection: "column",
    height: _height,
  };

  const modalStyle = {
    top: isFullscreen ? 0 : 20,
    maxWidth: isFullscreen ? "100%" : undefined,
    paddingBottom: isFullscreen ? 0 : undefined,
    margin: isFullscreen ? 0 : undefined,
    ...(isMacOSStyle && !isFullscreen
      ? {
          borderRadius: "12px",
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.15)",
          overflow: "hidden",
        }
      : {}),
    ...style,
  };

  const modalStyles = {
    ...styles,
    body: {
      ...baseBodyStyle,
      ...styles?.body,
      height: isFullscreen ? "100%" : _height,
    },
    container: {
      ...styles?.container,
      ...(isFullscreen
        ? {
            display: "flex",
            flexDirection: "column",
            height: "100vh",
            overflow: "hidden",
          }
        : {}),
    },
  };

  // 渲染标题栏
  const renderTitle: any = () => {
    if (!isMacOSStyle) {
      return (
        <div className="flex w-full items-center justify-between">
          <div className="flex-1">{title}</div>
          <BtnMenus
            onClose={onClose}
            isFullscreen={isFullscreen}
            showFullscreen={showFullscreen}
            toggleFullscreen={toggleFullscreen}
          />
        </div>
      );
    }
    return null;
  };

  const renderMacOSHeader = () => {
    return (
      <div className="flex h-8 items-center justify-between border-b border-gray-200 px-2 pb-2 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex space-x-2">
          <div className="h-3 w-3 rounded-full bg-red-500"></div>
          <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
          <div className="h-3 w-3 rounded-full bg-green-500"></div>
        </div>
        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {title}
        </div>
        <BtnMenus
          onClose={onClose}
          isFullscreen={isFullscreen}
          showFullscreen={showFullscreen}
          toggleFullscreen={toggleFullscreen}
        />
      </div>
    );
  };

  return (
    <AnimatePresence>
      <Modal
        title={renderTitle()}
        open={visible}
        onCancel={onClose}
        footer={null}
        width={modalWidth}
        closable={false}
        className={`${isMacOSStyle ? "macos-modal" : ""} ${isDarkMode ? "dark" : ""} ${className}`}
        style={modalStyle}
        styles={modalStyles}
        destroyOnHidden={destroyOnHidden}
        maskClosable={maskClosable}
        centered={!isFullscreen}
        {...restProps}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3 }}
          style={{ width: "100%", height: "100%" }}
        >
          <>
            {isMacOSStyle && renderMacOSHeader()}
            {children}
          </>
        </motion.div>
      </Modal>
    </AnimatePresence>
  );
}

export default GModal;
