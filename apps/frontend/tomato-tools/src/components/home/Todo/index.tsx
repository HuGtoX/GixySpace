import { useState, useEffect } from "react";
import { message, Spin, Button, Divider } from "antd";
import { FaPlus, FaHistory } from "react-icons/fa";
import SectionCard from "@/components/SectionCard";
import { Todo } from "@/lib/drizzle/schema/todo";
import type { PaginationResponse } from "@/types";
import TodoModal from "./EditModal";
import HistoryTodoModal from "./HistoryModal";
import axios from "@/lib/axios";
import TodoItem from "./TodoItem";

// 优先级排序权重
const priorityWeight = {
  urgent: 4,
  high: 3,
  medium: 2,
  low: 1,
};

const TodoList = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [todoModalVisible, setTodoModalVisible] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [historyModalVisible, setHistoryModalVisible] = useState(false);

  const openHistoryModal = () => {
    setHistoryModalVisible(true);
  };

  const closeHistoryModal = () => {
    setHistoryModalVisible(false);
  };

  // 获取待办事项列表
  const fetchTodos = async () => {
    setLoading(true);
    try {
      const response = await axios.get<PaginationResponse<Todo>>("/api/todo");
      // 按紧急程度排序：urgent > high > medium > low
      const sortedTodos = response.data.sort((a, b) => {
        const weightA =
          priorityWeight[a.priority as keyof typeof priorityWeight] || 0;
        const weightB =
          priorityWeight[b.priority as keyof typeof priorityWeight] || 0;
        return weightB - weightA;
      });
      setTodos(sortedTodos);
    } finally {
      setLoading(false);
    }
  };

  const addTodo = () => {
    setEditingTodo(null);
    setTodoModalVisible(true);
  };

  // 编辑待办事项
  const editTodo = (todo: Todo) => {
    setEditingTodo(todo);
    setTodoModalVisible(true);
  };

  const handleClose = () => {
    setTodoModalVisible(false);
    setEditingTodo(null);
  };

  // 切换任务完成状态
  const toggleComplete = async (id: string, completed: boolean) => {
    try {
      setLoading(true);
      await axios.put(`/api/todo?id=${id}`, {
        status: completed ? "completed" : "pending",
      });
      message.success(completed ? "任务已完成" : "任务已恢复");
      await fetchTodos();
    } catch (error) {
      message.error("更新任务状态失败");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodos();
  }, []);

  return (
    <SectionCard
      title="待办事项"
      right={
        <div className="flex gap-3">
          <Button type="text" icon={<FaHistory />} onClick={openHistoryModal} />
        </div>
      }
    >
      <TodoModal
        visible={todoModalVisible}
        onClose={handleClose}
        refresh={fetchTodos}
        initialData={editingTodo}
      />

      <HistoryTodoModal
        visible={historyModalVisible}
        onClose={closeHistoryModal}
      />

      <div className="max-h-[300px] space-y-2 overflow-auto pr-1">
        <Spin spinning={loading} tip="加载中...">
          {todos.filter((todo) => todo.status !== "completed").length === 0 ? (
            <div className="py-8 text-center text-gray-500 dark:text-gray-400">
              <div className="mb-2 text-4xl">📝</div>
              <p>暂无待办事项</p>
              <p className="mt-1 text-sm">添加任务开始创建</p>
            </div>
          ) : (
            todos
              .filter((todo) => todo.status !== "completed")
              .map((todo) => (
                <TodoItem
                  key={todo.id}
                  todo={todo}
                  refresh={fetchTodos}
                  onEdit={editTodo}
                  onToggleComplete={toggleComplete}
                />
              ))
          )}
        </Spin>
      </div>

      <div className="mt-4 flex gap-2">
        <Button onClick={addTodo} block type="primary">
          <FaPlus /> 添加任务
        </Button>
        <Button onClick={() => setShowCompleted(!showCompleted)} block>
          {showCompleted ? "隐藏已完成任务" : "显示已完成任务"}
        </Button>
      </div>

      {showCompleted && (
        <div className="mt-6">
          <Divider orientation="left">今日已完成任务</Divider>
          <div className="max-h-[200px] space-y-2 overflow-auto pr-1">
            {todos.filter(
              (todo) =>
                todo.status === "completed" &&
                new Date(todo.updatedAt).toDateString() ===
                  new Date().toDateString(),
            ).length === 0 ? (
              <div className="py-6 text-center text-gray-500 dark:text-gray-400">
                <p>暂无已完成任务</p>
              </div>
            ) : (
              todos
                .filter(
                  (todo) =>
                    todo.status === "completed" &&
                    new Date(todo.updatedAt).toDateString() ===
                      new Date().toDateString(),
                )
                .map((todo) => (
                  <TodoItem
                    key={todo.id}
                    todo={todo}
                    refresh={fetchTodos}
                    onEdit={editTodo}
                    onToggleComplete={toggleComplete}
                  />
                ))
            )}
          </div>
        </div>
      )}
    </SectionCard>
  );
};

export default TodoList;
