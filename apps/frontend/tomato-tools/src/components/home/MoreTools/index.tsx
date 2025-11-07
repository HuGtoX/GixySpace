import { FaTools, FaChartLine, FaCalendarAlt, FaFileAlt } from "react-icons/fa";
import SectionCard from "@/components/SectionCard";

interface ToolItem {
  name: string;
  icon: React.ReactNode;
  status: "available" | "coming" | "beta";
}

const moreTools: ToolItem[] = [
  {
    name: "文档转换",
    icon: <FaFileAlt className="text-blue-500" />,
    status: "coming"
  },
  {
    name: "数据分析",
    icon: <FaChartLine className="text-green-500" />,
    status: "coming"
  },
  {
    name: "日程管理",
    icon: <FaCalendarAlt className="text-purple-500" />,
    status: "coming"
  },
  {
    name: "更多工具",
    icon: <FaTools className="text-gray-500" />,
    status: "coming"
  }
];

export default function MoreTools() {
  return (
    <SectionCard title="更多工具">
      <div className="space-y-3">
        {moreTools.map((tool) => (
          <div 
            key={tool.name}
            className="flex items-center justify-between rounded-lg bg-gray-50 p-3 dark:bg-gray-700"
          >
            <div className="flex items-center space-x-3">
              <div className="text-lg">{tool.icon}</div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {tool.name}
              </span>
            </div>
            <div>
              {tool.status === "available" ? (
                <span className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-800 dark:bg-green-900 dark:text-green-200">
                  可用
                </span>
              ) : tool.status === "beta" ? (
                <span className="rounded-full bg-yellow-100 px-2 py-1 text-xs text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                  测试中
                </span>
              ) : (
                <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-800 dark:bg-gray-600 dark:text-gray-300">
                  即将推出
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}