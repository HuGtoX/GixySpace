import { Spin } from "antd";
import { FaBrain } from "react-icons/fa";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface AISummarySectionProps {
  summaryLoading: boolean;
  aiSummary: string;
}

export default function AISummarySection({
  summaryLoading,
  aiSummary,
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
      <div className="mb-2 flex items-center gap-2 font-medium text-blue-600 dark:text-blue-400">
        <FaBrain size={16} />
        <span>AI 总结报告</span>
      </div>
      <div className="prose prose-sm max-w-none text-gray-700 dark:prose-invert dark:text-gray-300">
        {/* @ts-expect-error - ReactMarkdown 类型与 React 19 暂时不兼容 */}
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{aiSummary}</ReactMarkdown>
      </div>
    </div>
  );
}
