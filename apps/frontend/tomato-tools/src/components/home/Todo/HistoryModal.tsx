import { useState, useEffect } from "react";
import { Button, Divider, List, Spin, message } from "antd";
import {
  FaCalendar,
  FaCalendarWeek,
  FaCalendarAlt,
  FaEnvira,
  FaBrain,
  FaCalendarDay,
} from "react-icons/fa";
import GModal from "@/components/Modal";
import { Todo } from "@/lib/drizzle/schema/todo";
import axios from "@/lib/axios";
import type { PaginationResponse } from "@/types";
import TodoItem from "./TodoItem";
import TodoModal from "./EditModal";
import { generateDateRange, DateRangeType } from "@/lib/date";

interface HistoryTodoModalProps {
  visible: boolean;
  onClose: () => void;
}

type CategoriesDateType = DateRangeType | "all";
// 分类选项
const categories: { id: CategoriesDateType; name: string; icon: any }[] = [
  { id: "all", name: "全部", icon: <FaCalendar size={16} /> },
  { id: "day", name: "本日", icon: <FaCalendarDay size={16} /> },
  { id: "week", name: "本周", icon: <FaCalendarWeek size={16} /> },
  { id: "month", name: "本月", icon: <FaCalendarAlt size={16} /> },
];

export default function HistoryTodoModal(props: HistoryTodoModalProps) {
  const { visible } = props;
  const [loading, setLoading] = useState(false);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [selectedCategory, setSelectedCategory] =
    useState<CategoriesDateType>("all");
  const [aiSummary, setAiSummary] = useState<string>("");
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [todoModalVisible, setTodoModalVisible] = useState(false);

  // 获取历史完成任务
  const fetchHistoryTodos = async () => {
    setLoading(true);
    try {
      // 构建查询参数
      const params = new URLSearchParams();
      params.append("status", "completed");

      if (selectedCategory !== "all") {
        const dateRange = generateDateRange(selectedCategory);
        params.append("startDate", dateRange.start);
        params.append("endDate", dateRange.end);
      }

      const response = await axios.get<PaginationResponse<Todo>>(
        `/api/todo?${params.toString()}`,
      );
      setTodos(response.data);
    } catch (err) {
      console.error("Failed to fetch history todos:", err);
    } finally {
      setLoading(false);
    }
  };

  // 生成AI总结
  const generateSummary = async () => {
    setSummaryLoading(true);
    setAiSummary(""); // 清空之前的总结
    try {
      const response = await axios.post<any>("/api/todo/summary", {
        period: "day",
      });

      if (response.success) {
        setAiSummary(response.summary);
        message.success("总结生成成功");
      } else {
        throw new Error(response.data.error || "生成总结失败");
      }
    } catch (error) {
      console.error("生成总结失败:", error);
      message.error("生成总结失败");
    } finally {
      setSummaryLoading(false);
    }
  };

  // 编辑待办事项
  const editTodo = (todo: Todo) => {
    setEditingTodo(todo);
    setTodoModalVisible(true);
  };

  useEffect(() => {
    if (visible) {
      fetchHistoryTodos();
    }
  }, [visible, selectedCategory]);

  // 切换分类
  const handleCategoryChange = (categoryId: CategoriesDateType) => {
    setSelectedCategory(categoryId);
    setAiSummary(""); // 切换分类时清空总结
  };

  return (
    <GModal {...props} title="历史完成任务" width={900}>
      <TodoModal
        visible={todoModalVisible}
        onClose={() => setTodoModalVisible(false)}
        refresh={fetchHistoryTodos}
        initialData={editingTodo}
      />

      <div className="flex h-[500px] gap-4">
        {/* 左侧分类列表 */}
        <div className="w-48 shrink-0 border-r border-gray-200 dark:border-gray-700">
          <div className="p-3 font-medium text-gray-700 dark:text-gray-300">
            分类
          </div>
          <div className="space-y-1 px-2">
            {categories.map((category) => (
              <button
                key={category.id}
                className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left transition-colors ${selectedCategory === category.id ? "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" : "hover:bg-gray-100 dark:hover:bg-gray-800"}`}
                onClick={() => handleCategoryChange(category.id)}
              >
                {category.icon}
                <span>{category.name}</span>
              </button>
            ))}
          </div>

          <Divider className="my-4" />

          <div className="p-3 font-medium text-gray-700 dark:text-gray-300">
            AI 总结
          </div>
          <div className="px-2">
            <Button
              block
              icon={<FaBrain size={16} />}
              onClick={generateSummary}
              loading={summaryLoading}
              className="mb-2"
            >
              生成日报总结
            </Button>
            <Button
              block
              icon={<FaEnvira size={16} />}
              onClick={generateSummary}
              loading={summaryLoading}
            >
              生成周报总结
            </Button>
          </div>
        </div>

        {/* 右侧任务列表和总结区域 */}
        <div className="flex-1 overflow-hidden">
          {/* AI 总结区域 */}
          {summaryLoading ? (
            <div className="mb-4 rounded-md border border-gray-200 bg-blue-50 p-4 dark:border-gray-700 dark:bg-blue-900/20">
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                <Spin size="small" />
                <span>AI正在生成总结中...</span>
              </div>
            </div>
          ) : aiSummary ? (
            <div className="mb-4 max-h-full overflow-auto rounded-md border border-gray-200 bg-blue-50 p-4 dark:border-gray-700 dark:bg-blue-900/20">
              <div className="mb-2 flex items-center gap-2 font-medium text-blue-600 dark:text-blue-400">
                <FaBrain size={16} />
                <span>AI 总结报告</span>
              </div>
              <pre className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">
                {aiSummary}
              </pre>
            </div>
          ) : null}

          {/* 任务列表区域 */}
          <div className="h-full overflow-auto">
            <Spin spinning={loading} tip="加载中...">
              {todos.length === 0 ? (
                <div className="py-12 text-center text-gray-500 dark:text-gray-400">
                  <div className="mb-2 text-4xl">📋</div>
                  <p>暂无完成任务</p>
                </div>
              ) : (
                <List
                  dataSource={todos}
                  renderItem={(todo) => (
                    <List.Item key={todo.id} className="p-0">
                      <TodoItem
                        isHistory={true}
                        todo={todo}
                        onEdit={editTodo}
                        refresh={fetchHistoryTodos}
                      />
                    </List.Item>
                  )}
                  className="divide-y divide-gray-100 dark:divide-gray-800"
                />
              )}
            </Spin>
          </div>
        </div>
      </div>
    </GModal>
  );
}
