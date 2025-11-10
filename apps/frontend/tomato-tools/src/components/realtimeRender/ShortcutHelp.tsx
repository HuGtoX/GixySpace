'use client';

import React from "react";
import { Modal, Typography, Space, Divider } from "antd";
import { useDeviceDetect } from "@/hooks/useDeviceDetect";

const { Title, Text } = Typography;

interface ShortcutHelpProps {
  visible: boolean;
  onClose: () => void;
}

const ShortcutHelp: React.FC<ShortcutHelpProps> = ({ visible, onClose }) => {
  const { isMobile } = useDeviceDetect();

  const shortcuts = [
    {
      category: "代码执行",
      items: [
        { key: "Ctrl/Cmd + Enter", description: "运行代码" },
        { key: "Ctrl/Cmd + S", description: "运行代码（保存快捷键）" },
      ],
    },
    {
      category: "编辑器操作",
      items: [
        { key: "Ctrl/Cmd + /", description: "切换注释" },
        { key: "Ctrl/Cmd + D", description: "选择下一个相同单词" },
        { key: "Ctrl/Cmd + F", description: "查找" },
        { key: "Ctrl/Cmd + H", description: "查找替换" },
        { key: "Alt + ↑/↓", description: "移动行" },
        { key: "Shift + Alt + ↑/↓", description: "复制行" },
        { key: "Ctrl/Cmd + Shift + K", description: "删除行" },
      ],
    },
    {
      category: "代码格式化",
      items: [
        { key: "Shift + Alt + F", description: "格式化文档" },
        { key: "Ctrl/Cmd + K, Ctrl/Cmd + F", description: "格式化选中代码" },
      ],
    },
    {
      category: "导航",
      items: [
        { key: "Ctrl/Cmd + G", description: "跳转到行" },
        { key: "Ctrl/Cmd + P", description: "快速打开" },
        { key: "F12", description: "跳转到定义" },
        { key: "Alt + F12", description: "查看定义" },
      ],
    },
  ];

  return (
    <Modal
      title="快捷键帮助"
      open={visible}
      onCancel={onClose}
      footer={null}
      width={isMobile ? "90%" : 600}
      centered
    >
      <div className="max-h-96 overflow-y-auto">
        {shortcuts.map((category, index) => (
          <div key={category.category}>
            <Title level={5} className="mb-3 text-primary">
              {category.category}
            </Title>
            <Space direction="vertical" size="small" className="w-full mb-4">
              {category.items.map((item, itemIndex) => (
                <div
                  key={itemIndex}
                  className="flex justify-between items-center py-1"
                >
                  <Text className="flex-1">{item.description}</Text>
                  <Text
                    code
                    className="ml-4 text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded"
                  >
                    {item.key}
                  </Text>
                </div>
              ))}
            </Space>
            {index < shortcuts.length - 1 && <Divider className="my-4" />}
          </div>
        ))}
      </div>
      
      <Divider className="my-4" />
      
      <div className="text-center">
        <Text type="secondary" className="text-sm">
          💡 提示：在编辑器中按 F1 可查看更多快捷键
        </Text>
      </div>
    </Modal>
  );
};

export default ShortcutHelp;