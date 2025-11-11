import { useState } from "react";
import { Button, Spin } from "antd";
import { FaComment, FaImage } from "react-icons/fa";
import SectionCard from "@/components/ui/SectionCard";
import Tool from "./Tool";
import Todo from "./Todo";
import dynamic from "next/dynamic";

const AiChatModal = dynamic(() => import("@/components/home/AiChatModal"), {
  loading: () => <Spin />,
  ssr: false,
});

/**
 * AI工具状态信息
 */
interface AIToolStatus {
  /** 状态文本 */
  text: string;
  /** 标签颜色类名 */
  tagColor: string;
  /** 日期信息 */
  date: string;
}

/**
 * AI工具项属性
 */
interface AIToolItemProps {
  /** 图标元素 */
  icon: React.ReactNode;
  /** 工具名称 */
  name: string;
  /** 工具描述 */
  description: string;
  /** 按钮文本，null表示不显示按钮 */
  buttonText?: string | null;
  /** 状态信息，null表示不显示状态 */
  status?: AIToolStatus | null;
  /** 背景颜色类名 */
  bgColor: string;
  /** 点击事件处理函数 */
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
    <div className="flex items-center justify-between rounded-lg bg-white p-4 shadow-sm dark:bg-gray-800">
      <div className="flex items-center space-x-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-lg ${bgColor}`}
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

export default function Tools() {
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);

  const handleChatClick = () => {
    setIsChatModalOpen(true);
  };

  const handleCloseChatModal = () => {
    setIsChatModalOpen(false);
  };

  return (
    <section className="space-y-6 lg:col-span-3">
      {/* 常用工具区块 */}
      <Tool />
      {/* 待办区块 */}
      <Todo />
      {/* AI工具区块 */}
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
      </SectionCard>

      {/* 访问记录卡片 */}
      <SectionCard title="最近访问">
        <div className="py-8 text-center text-gray-500 dark:text-gray-400">
          <p>暂无访问记录</p>
        </div>
      </SectionCard>

      {/* AI聊天Modal */}
      <AiChatModal
        open={isChatModalOpen}
        onClose={handleCloseChatModal}
        model="deepseek-chat"
        width={1200}
        height={680}
      />
    </section>
  );
}
