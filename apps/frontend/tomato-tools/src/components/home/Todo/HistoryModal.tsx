import { useState, useEffect } from "react";
import { List, Spin, Button, message, Divider } from "antd";
import {
  FaCalendar,
  FaCalendarWeek,
  FaCalendarAlt,
  FaCalendarDay,
  FaBrain,
  FaTrash,
  FaEye,
  FaEnvira,
} from "react-icons/fa";
import GModal from "@/components/Modal";
import { Todo } from "@/lib/drizzle/schema/todo";
import axios from "@/lib/axios";
import type { PaginationResponse } from "@/types";
import TodoItem from "./TodoItem";
import TodoModal from "./EditModal";
import AISummarySection from "./AISummarySection";
import { generateDateRange, DateRangeType } from "@/lib/date";

interface HistoryTodoModalProps {
  visible: boolean;
  onClose: () => void;
}

type CategoriesDateType = DateRangeType | "all" | "ai-summary";

// AI总结数据类型
interface AISummary {
  id: string;
  title: string;
  content: string;
  period: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

// 分类选项
const categories: { id: CategoriesDateType; name: string; icon: any }[] = [
  { id: "all", name: "全部", icon: <FaCalendar size={16} /> },
  { id: "day", name: "本日", icon: <FaCalendarDay size={16} /> },
  { id: "week", name: "本周", icon: <FaCalendarWeek size={16} /> },
  { id: "month", name: "本月", icon: <FaCalendarAlt size={16} /> },
  { id: "ai-summary", name: "AI总结", icon: <FaBrain size={16} /> },
];

export default function HistoryTodoModal(props: HistoryTodoModalProps) {
  const { visible } = props;
  const [loading, setLoading] = useState(false);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [selectedCategory, setSelectedCategory] =
    useState<CategoriesDateType>("all");
  const [todoModalVisible, setTodoModalVisible] = useState(false);

  // 原有的AI总结功能状态
  const [aiSummary, setAiSummary] = useState<string>("");
  const [summaryLoading, setSummaryLoading] = useState(false);

  // AI总结历史相关状态
  const [aiSummaries, setAiSummaries] = useState<AISummary[]>([]);
  const [selectedSummary, setSelectedSummary] = useState<AISummary | null>(
    null,
  );
  const [summaryDetailVisible, setSummaryDetailVisible] = useState(false);

  // 获取历史完成任务
  const fetchHistoryTodos = async () => {
    setLoading(true);
    try {
      // 构建查询参数
      const params = new URLSearchParams();
      params.append("status", "completed");

      if (selectedCategory !== "all" && selectedCategory !== "ai-summary") {
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

  // 生成AI总结（原有功能）
  const generateSummary = async (
    period: "day" | "week" | "month" | "all" = "day",
  ) => {
    setSummaryLoading(true);
    setAiSummary(""); // 清空之前的总结
    try {
      const response = await axios.post<any>("/api/todo/summary", {
        period: period,
      });

      if (response.success) {
        setAiSummary(response.summary);
        const periodLabels = {
          day: "本日",
          week: "本周",
          month: "本月",
          all: "全部",
        };
        const periodLabel = periodLabels[period] || "指定时间";

        // 如果是空任务提示，显示不同的消息
        if (response.isEmpty) {
          message.info(`${periodLabel}暂无已完成的任务`);
        } else {
          message.success(`${periodLabel}总结生成成功`);
        }
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

  // 获取AI总结历史
  const fetchAISummaries = async () => {
    setLoading(true);
    try {
      const response = await axios.get<PaginationResponse<AISummary>>(
        "/api/todo/summary?page=1&pageSize=20",
      );
      setAiSummaries(response.data);
    } catch (err) {
      console.error("Failed to fetch AI summaries:", err);
      message.error("获取AI总结失败");
    } finally {
      setLoading(false);
    }
  };

  // 删除AI总结
  const deleteSummary = async (id: string) => {
    try {
      await axios.delete(`/api/todo/summary/${id}`);
      message.success("删除成功");
      fetchAISummaries();
    } catch (err) {
      console.error("Failed to delete summary:", err);
      message.error("删除失败");
    }
  };

  // 查看AI总结详情
  const viewSummaryDetail = async (summary: AISummary) => {
    try {
      const response = await axios.get<AISummary>(
        `/api/todo/summary/${summary.id}`,
      );
      setSelectedSummary(response);
      setSummaryDetailVisible(true);
    } catch (err) {
      console.error("Failed to fetch summary detail:", err);
      message.error("获取总结详情失败");
    }
  };

  // 编辑待办事项
  const editTodo = (todo: Todo) => {
    setEditingTodo(todo);
    setTodoModalVisible(true);
  };

  useEffect(() => {
    if (visible) {
      if (selectedCategory === "ai-summary") {
        fetchAISummaries();
      } else {
        fetchHistoryTodos();
      }
    }
  }, [visible, selectedCategory]);

  // 切换分类
  const handleCategoryChange = (categoryId: CategoriesDateType) => {
    setSelectedCategory(categoryId);
    // 重置选中的总结
    setSelectedSummary(null);
    setSummaryDetailVisible(false);
    // 切换分类时清空当前总结
    setAiSummary("");
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
          <div className="space-y-2 px-2">
            <Button
              block
              icon={<FaBrain size={16} />}
              onClick={() => generateSummary("day")}
              loading={summaryLoading}
            >
              生成本日总结
            </Button>
            <Button
              block
              icon={<FaEnvira size={16} />}
              onClick={() => generateSummary("week")}
              loading={summaryLoading}
            >
              生成本周总结
            </Button>
            <Button
              block
              icon={<FaCalendarAlt size={16} />}
              onClick={() => generateSummary("month")}
              loading={summaryLoading}
            >
              生成本月总结
            </Button>
          </div>
        </div>

        {/* 右侧内容区域 */}
        <div className="flex-1 overflow-hidden">
          {selectedCategory === "ai-summary" ? (
            // AI总结历史列表
            <div className="h-full overflow-auto">
              <Spin spinning={loading} tip="加载中...">
                <div className="space-y-4">
                  {summaryDetailVisible && selectedSummary ? (
                    // 总结详情视图
                    <div>
                      <div className="mb-4 flex items-center justify-between">
                        <Button
                          onClick={() => setSummaryDetailVisible(false)}
                          type="link"
                          className="p-0"
                        >
                          ← 返回列表
                        </Button>
                      </div>
                      <AISummarySection
                        summaryLoading={false}
                        aiSummary={selectedSummary.content}
                      />
                    </div>
                  ) : (
                    // 总结列表视图
                    <>
                      {aiSummaries.length === 0 ? (
                        <div className="py-12 text-center text-gray-500 dark:text-gray-400">
                          <div className="mb-2 text-4xl">🤖</div>
                          <p>暂无AI总结记录</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {aiSummaries.map((summary) => (
                            <div
                              key={summary.id}
                              className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800"
                            >
                              <div className="mb-2 flex items-center justify-between">
                                <h3 className="font-medium text-gray-900 dark:text-white">
                                  {summary.title}
                                </h3>
                                <div className="flex items-center gap-2">
                                  <Button
                                    type="text"
                                    size="small"
                                    icon={<FaEye />}
                                    onClick={() => viewSummaryDetail(summary)}
                                  >
                                    查看
                                  </Button>
                                  <Button
                                    type="text"
                                    size="small"
                                    danger
                                    icon={<FaTrash />}
                                    onClick={() => deleteSummary(summary.id)}
                                  >
                                    删除
                                  </Button>
                                </div>
                              </div>
                              <div className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                                时间周期:{" "}
                                {summary.period === "day"
                                  ? "本日"
                                  : summary.period === "week"
                                    ? "本周"
                                    : summary.period === "month"
                                      ? "本月"
                                      : "全部"}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                创建时间:{" "}
                                {new Date(summary.createdAt).toLocaleString()}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </Spin>
            </div>
          ) : (
            // 任务列表和总结区域
            <>
              {/* AI 总结区域 */}
              <AISummarySection
                summaryLoading={summaryLoading}
                aiSummary={aiSummary}
              />

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
            </>
          )}
        </div>
      </div>
    </GModal>
  );
}
