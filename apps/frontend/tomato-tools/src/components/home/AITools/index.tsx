"use client";

import { useState } from "react";
import { Button, Spin } from "antd";
import { FaComment, FaImage } from "react-icons/fa";
import SectionCard from "@/components/ui/SectionCard";
import dynamic from "next/dynamic";

const AiChatModal = dynamic(() => import("@/components/home/AiChatModal"), {
  loading: () => <Spin />,
  ssr: false,
});

interface AIToolStatus {
  text: string;
  tagColor: string;
  date: string;
}

interface AIToolItemProps {
  icon: React.ReactNode;
  name: string;
  description: string;
  buttonText?: string | null;
  status?: AIToolStatus | null;
  bgColor: string;
  onClick?: () => void;
}

/**
 * AI工具项组件
 */
const AIToolItem = ({
  icon,
  name,
  description,
  buttonText,
  status,
  bgColor,
  onClick,
}: AIToolItemProps) => {
  return (
    <div className="flex items-center justify-between p-2">
      <div className="flex items-center space-x-3">
        <div
          className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${bgColor}`}
        >
          {icon}
        </div>
        <div>
          <h4 className="font-medium text-gray-900 dark:text-white">{name}</h4>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {description}
          </p>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        {buttonText && (
          <Button type="primary" size="small" onClick={onClick}>
            {buttonText}
          </Button>
        )}
        {status && (
          <div className="text-right">
            <span
              className={`inline-block rounded-full px-2 py-1 text-xs ${status.tagColor}`}
            >
              {status.text}
            </span>
            <p className="mt-1 text-xs text-gray-400">{status.date}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default function AISection() {
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);

  const handleChatClick = () => {
    setIsChatModalOpen(true);
  };

  const handleCloseChatModal = () => {
    setIsChatModalOpen(false);
  };

  return (
    <SectionCard title="AI助手">
      <div className="space-y-3">
        <AIToolItem
          icon={<FaComment className="text-indigo-500" />}
          name="智能问答"
          description="获取问题的智能答案和建议"
          buttonText="打开会话"
          status={null}
          bgColor="bg-indigo-100"
          onClick={handleChatClick}
        />
        <AIToolItem
          icon={<FaImage className="text-gray-400" />}
          name="图像生成"
          description="根据文本描述创建高质量图像"
          buttonText={null}
          status={{
            text: "开发中",
            tagColor: "bg-gray-400/10 text-gray-600",
            date: "预计2025年Q3上线",
          }}
          bgColor="bg-gray-100"
        />
      </div>

      {/* AI聊天Modal */}
      <AiChatModal
        open={isChatModalOpen}
        onClose={handleCloseChatModal}
        model="deepseek-chat"
        width={1200}
        height={680}
      />
    </SectionCard>
  );
}
