import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Modal } from "antd";
import { useTheme } from "@/contexts/ThemeContext";

interface GModalProps {
  title?: string;
  children: React.ReactNode;
  visible: boolean;
  onClose: () => void;
  [key: string]: any;
}

function GModal(props: GModalProps) {
  const { title, children, visible, onClose, ...restProps } = props;
  const { isDarkMode } = useTheme();

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3 }}
        >
          <Modal
            open={visible}
            onCancel={onClose}
            footer={null}
            width={500}
            className={`macos-modal ${isDarkMode ? "dark" : ""}`}
            style={{
              borderRadius: "12px",
              boxShadow: "0 10px 30px rgba(0, 0, 0, 0.15)",
              overflow: "hidden",
            }}
            {...restProps}
          >
            {/* 标题栏 - 仿MacOS风格 */}
            <div className="flex h-8 items-center justify-between border-b border-gray-200 bg-gray-50 px-4 dark:border-gray-700 dark:bg-gray-800">
              <div className="flex space-x-2">
                <div className="h-3 w-3 rounded-full bg-red-500"></div>
                <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                <div className="h-3 w-3 rounded-full bg-green-500"></div>
              </div>
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {title}
              </div>
              <div className="w-12"></div>
            </div>

            {/* 内容区域 */}
            <div className="p-4">{children}</div>
          </Modal>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default GModal;
