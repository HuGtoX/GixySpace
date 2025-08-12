import { Button } from "antd";
import { FaComment, FaImage } from "react-icons/fa";
import SectionCard from "@/components/SectionCard";
import Tool from "./Tool";
import Todo from "./Todo";

const AIToolItem = ({
  icon,
  name,
  description,
  buttonText,
  status,
  bgColor,
}: {
  icon: React.ReactNode;
  name: string;
  description: string;
  buttonText?: string | null;
  status?: {
    text: string;
    tagColor: string;
    date: string;
  } | null;
  bgColor: string;
}) => {
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
          <Button type="primary" size="small">
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
    </section>
  );
}
