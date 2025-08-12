import React from "react";
import { motion } from "framer-motion";
import { Modal } from "antd";
import { useTheme } from "@/contexts/ThemeContext";
import { FaDownload } from "react-icons/fa";
import IconWrapper from "@/components/IconWrapper";

interface ToolsModalProps {
  visible: boolean;
  onClose: () => void;
}

// 定义其他工具菜单数据
const otherTools = [
  {
    id: 6,
    name: "URL图标下载",
    url: "/icon/download",
    background: "bg-purple-500/10 dark:bg-purple-500/10",
    icon: <FaDownload className="text-purple-500 dark:text-purple-400" />,
    description: "获取网站图标并下载",
  },
];

export default function ToolsModal({ visible, onClose }: ToolsModalProps) {
  const { isDarkMode } = useTheme();

  // 处理工具项点击
  const handleToolClick = (url: string) => {
    if (url) {
      window.location.href = url;
    }
    onClose();
  };

  return (
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
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.3 }}
      >
        {/* 标题栏 - 仿MacOS风格 */}
        <div className="flex h-8 items-center justify-between border-b border-gray-200 bg-gray-50 px-4 dark:border-gray-700 dark:bg-gray-800">
          <div className="flex space-x-2">
            <div className="h-3 w-3 rounded-full bg-red-500"></div>
            <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
            <div className="h-3 w-3 rounded-full bg-green-500"></div>
          </div>
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
            更多工具
          </div>
          <div className="w-12"></div>
        </div>

        {/* 内容区域 */}
        <div className="p-6">
          <div className="grid grid-cols-2 gap-4">
            {otherTools.map((item) => (
              <div
                key={item.id}
                className="tool-icon ripple pixel-grow cursor-pointer rounded-xl bg-white p-4 text-center shadow-sm hover:shadow-md dark:bg-gray-800"
                onClick={() => handleToolClick(item.url)}
              >
                <IconWrapper
                  size={12}
                  background={item.background}
                  icon={item.icon}
                />
                <span className="mb-1 text-sm font-medium">{item.name}</span>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {item.description || ""}
                </p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </Modal>
  );
}
