import React from "react";
import { otherToolsMenu } from "@/config/tools";
import IconWrapper from "@/components/ui/IconWrapper";
import GModal from "@/components/ui/Modal";

interface ToolsModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function ToolsModal({ visible, onClose }: ToolsModalProps) {
  const handleToolClick = (url: string) => {
    if (url) {
      window.location.href = url;
    }
    onClose();
  };

  return (
    <GModal
      visible={visible}
      onClose={onClose}
      title="更多工具"
      footer={null}
      width={500}
      isMacOSStyle
      style={{
        borderRadius: "12px",
        boxShadow: "0 10px 30px rgba(0, 0, 0, 0.15)",
        overflow: "hidden",
      }}
    >
      <div className="p-6">
        <div className="grid grid-cols-2 gap-4">
          {otherToolsMenu.map((item) => (
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
    </GModal>
  );
}
