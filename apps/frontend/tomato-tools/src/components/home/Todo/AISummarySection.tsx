import { Spin, Button } from "antd";
import { FaBrain } from "react-icons/fa";
import { IoClose } from "react-icons/io5";
import MarkdownRenderer from "@/components/MarkdownRenderer";

interface AISummarySectionProps {
  summaryLoading: boolean;
  aiSummary: string;
  onClose?: () => void;
}

export default function AISummarySection({
  summaryLoading,
  aiSummary,
  onClose,
}: AISummarySectionProps) {
  if (summaryLoading) {
    return (
      <div className="mb-4 rounded-md border border-gray-200 bg-blue-50 p-4 dark:border-gray-700 dark:bg-blue-900/20">
        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
          <Spin size="small" />
          <span>AI正在生成总结中...</span>
        </div>
      </div>
    );
  }

  if (!aiSummary) {
    return null;
  }

  return (
    <div className="mb-4 max-h-full overflow-auto rounded-md border border-gray-200 bg-blue-50 p-4 dark:border-gray-700 dark:bg-blue-900/20">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2 font-medium text-blue-600 dark:text-blue-400">
          <FaBrain size={16} />
          <span>AI 总结报告</span>
        </div>
        {onClose && (
          <Button
            type="text"
            size="small"
            icon={<IoClose size={18} />}
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            title="关闭总结"
          />
        )}
      </div>
      <MarkdownRenderer content={aiSummary} />
    </div>
  );
}
