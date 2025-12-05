import { useState, useEffect } from "react";
import { List, Spin, Button, message, DatePicker } from "antd";
import {
  FaBrain,
  FaCalendarDay,
  FaCalendarWeek,
  FaCalendarAlt,
} from "react-icons/fa";
import GModal from "@/components/ui/Modal";
import { Todo } from "@/lib/drizzle/schema/todo";
import axios from "@/lib/axios";
import type { PaginationResponse } from "@/types";
import TodoItem from "./TodoItem";
import TodoModal from "./EditModal";
import AISummarySection from "./AISummarySection";
import AISummaryList from "./SummaryList";
import dayjs, { Dayjs } from "dayjs";

const { RangePicker } = DatePicker;

interface HistoryTodoModalProps {
  visible: boolean;
  onClose: () => void;
}

type ViewMode = "list" | "ai-summary";

// 快捷日期筛选按钮配置
const quickDateFilters: {
  id: string;
  name: string;
  icon: React.ReactElement;
  getRange: () => [Dayjs, Dayjs];
}[] = [
  {
    id: "day",
    name: "本日",
    icon: <FaCalendarDay size={14} />,
    getRange: () => [dayjs().startOf("day"), dayjs().endOf("day")],
  },
  {
    id: "week",
    name: "本周",
    icon: <FaCalendarWeek size={14} />,
    getRange: () => [dayjs().startOf("week"), dayjs().endOf("week")],
  },
  {
    id: "month",
    name: "本月",
    icon: <FaCalendarAlt size={14} />,
    getRange: () => [dayjs().startOf("month"), dayjs().endOf("month")],
  },
];

export default function HistoryTodoModal(props: HistoryTodoModalProps) {
  const { visible } = props;
  const [loading, setLoading] = useState(false);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [todoModalVisible, setTodoModalVisible] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  // 日期筛选状态
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null);

  // AI总结功能状态
  const [aiSummary, setAiSummary] = useState<string>("");
  const [summaryLoading, setSummaryLoading] = useState(false);

  // 获取历史完成任务
  const fetchHistoryTodos = async () => {
    setLoading(true);
    try {
      // 构建查询参数
      const params = new URLSearchParams();
      params.append("status", "completed");

      // 如果有日期范围筛选
      if (dateRange) {
        params.append("startDate", dateRange[0].format("YYYY-MM-DD"));
        params.append("endDate", dateRange[1].format("YYYY-MM-DD"));
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
          // 生成总结成功后切换到AI总结视图
          setViewMode("ai-summary");
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

  // 快捷日期筛选
  const handleQuickDateFilter = (range: [Dayjs, Dayjs]) => {
    setDateRange(range);
    setViewMode("list");
  };

  // 清空日期筛选
  const handleClearDateFilter = () => {
    setDateRange(null);
  };

  // 编辑待办事项
  const editTodo = (todo: Todo) => {
    setEditingTodo(todo);
    setTodoModalVisible(true);
  };

  // 切换任务完成状态
  const toggleComplete = async (id: string, completed: boolean) => {
    try {
      setLoading(true);
      await axios.put(`/api/todo?id=${id}`, {
        status: completed ? "completed" : "pending",
      });
      message.success(completed ? "任务已完成" : "任务已恢复");
      fetchHistoryTodos();
    } catch (error) {
      message.error("更新任务状态失败");
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible && viewMode === "list") {
      fetchHistoryTodos();
    }
  }, [visible, viewMode, dateRange]);

  return (
    <GModal
      isMacOSStyle
      showFullscreen
      title="历史完成任务"
      width={860}
      {...props}
    >
      <TodoModal
        visible={todoModalVisible}
        onClose={() => setTodoModalVisible(false)}
        refresh={fetchHistoryTodos}
        initialData={editingTodo}
      />

      <div className="flex h-[600px] flex-col gap-4">
        {/* 顶部筛选栏 */}
        <div className="rounded-xl border border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100/50 p-3 shadow-sm dark:border-gray-700 dark:from-gray-800/80 dark:to-gray-800/40">
          <div className="flex flex-col gap-3">
            {/* 第一行：视图切换 */}
            <div className="flex items-center gap-2 rounded-lg bg-white p-1 shadow-sm dark:bg-gray-900/50">
              <Button
                type={viewMode === "list" ? "primary" : "text"}
                onClick={() => setViewMode("list")}
                className="flex-1 transition-all"
              >
                📋 任务列表
              </Button>
              <Button
                type={viewMode === "ai-summary" ? "primary" : "text"}
                onClick={() => setViewMode("ai-summary")}
                className="flex-1 transition-all"
              >
                🤖 总结列表
              </Button>
            </div>

            {/* 第二行：筛选和操作按钮 */}
            {viewMode === "list" && (
              <div className="flex flex-wrap items-center gap-2">
                {/* 快捷日期按钮组 */}
                <div className="flex items-center gap-1.5 rounded-lg bg-white px-2 py-1 shadow-sm dark:bg-gray-900/50">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    快捷:
                  </span>
                  {quickDateFilters.map((filter) => (
                    <Button
                      key={filter.id}
                      size="small"
                      icon={filter.icon}
                      onClick={() => handleQuickDateFilter(filter.getRange())}
                      className="transition-all hover:scale-105"
                    >
                      {filter.name}
                    </Button>
                  ))}
                </div>

                {/* 自定义日期范围选择器 */}
                <div className="flex flex-1 items-center gap-1.5 rounded-lg bg-white px-2 py-1 shadow-sm dark:bg-gray-900/50">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    自定义:
                  </span>
                  <RangePicker
                    value={dateRange}
                    onChange={(dates) => {
                      if (dates) {
                        setDateRange([dates[0]!, dates[1]!]);
                      } else {
                        handleClearDateFilter();
                      }
                    }}
                    placeholder={["开始", "结束"]}
                    format="YYYY-MM-DD"
                    allowClear
                    size="small"
                    className="flex-1"
                  />
                </div>

                {/* 生成总结按钮 */}
                <Button
                  type="primary"
                  icon={<FaBrain size={14} />}
                  size="small"
                  onClick={() => {
                    // 根据当前日期筛选生成对应的总结
                    if (dateRange) {
                      const today = dayjs();
                      const start = dateRange[0];
                      const end = dateRange[1];

                      // 判断是否为本日
                      if (
                        start.isSame(today, "day") &&
                        end.isSame(today, "day")
                      ) {
                        generateSummary("day");
                      }
                      // 判断是否为本周
                      else if (
                        start.isSame(today.startOf("week"), "day") &&
                        end.isSame(today.endOf("week"), "day")
                      ) {
                        generateSummary("week");
                      }
                      // 判断是否为本月
                      else if (
                        start.isSame(today.startOf("month"), "day") &&
                        end.isSame(today.endOf("month"), "day")
                      ) {
                        generateSummary("month");
                      }
                      // 其他自定义日期范围，默认生成全部总结
                      else {
                        generateSummary("all");
                      }
                    } else {
                      // 没有日期筛选时，生成全部总结
                      generateSummary("all");
                    }
                  }}
                  loading={summaryLoading}
                  className="shadow-sm transition-all hover:scale-105"
                >
                  生成总结
                </Button>
              </div>
            )}

            {/* AI总结生成按钮 - 仅在AI总结视图显示 */}
            {viewMode === "ai-summary" && (
              <div className="flex items-center gap-2 rounded-lg bg-white px-3 py-1.5 shadow-sm dark:bg-gray-900/50">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  生成总结:
                </span>
                <div className="flex flex-1 gap-2">
                  <Button
                    size="small"
                    icon={<FaCalendarDay size={14} />}
                    onClick={() => generateSummary("day")}
                    loading={summaryLoading}
                    className="flex-1 transition-all hover:scale-105"
                  >
                    本日
                  </Button>
                  <Button
                    size="small"
                    icon={<FaCalendarWeek size={14} />}
                    onClick={() => generateSummary("week")}
                    loading={summaryLoading}
                    className="flex-1 transition-all hover:scale-105"
                  >
                    本周
                  </Button>
                  <Button
                    size="small"
                    icon={<FaCalendarAlt size={14} />}
                    onClick={() => generateSummary("month")}
                    loading={summaryLoading}
                    className="flex-1 transition-all hover:scale-105"
                  >
                    本月
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 overflow-hidden">
          {/* AI 总结实时生成区域 */}
          {summaryLoading || aiSummary ? (
            <AISummarySection
              summaryLoading={summaryLoading}
              aiSummary={aiSummary}
              onClose={() => setAiSummary("")}
            />
          ) : null}

          {/* 根据视图模式显示不同内容 */}
          {viewMode === "ai-summary" ? (
            <AISummaryList visible={visible} />
          ) : (
            <div className="h-full overflow-auto">
              <Spin spinning={loading} tip="加载中...">
                {todos.length === 0 ? (
                  <div className="py-12 text-center text-gray-500 dark:text-gray-400">
                    <div className="mb-2 text-4xl">📋</div>
                    <p>暂无完成任务</p>
                    {dateRange && (
                      <p className="mt-2 text-sm">
                        当前筛选：{dateRange[0].format("YYYY-MM-DD")} 至{" "}
                        {dateRange[1].format("YYYY-MM-DD")}
                      </p>
                    )}
                  </div>
                ) : (
                  <List
                    dataSource={todos}
                    renderItem={(todo) => (
                      <List.Item key={todo.id} className="p-0">
                        <TodoItem
                          onToggleComplete={toggleComplete}
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
          )}
        </div>
      </div>
    </GModal>
  );
}
