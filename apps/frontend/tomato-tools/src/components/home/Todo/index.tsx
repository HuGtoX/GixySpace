import { useState, useEffect } from "react";
import { message, Spin, Button, Divider } from "antd";
import { FaPlus, FaHistory } from "react-icons/fa";
import SectionCard from "@/components/SectionCard";
import { Todo } from "@/lib/drizzle/schema/todo";
import TodoModal from "./TodoModal";
import HistoryTodoModal from "./HistoryTodoModal";
import axios from "@/lib/axios";
import TodoItem from "./TodoItem";
import ConfirmModal from "@/components/ConfirmModal";

const TodoList = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentTodoId, setCurrentTodoId] = useState<string | null>(null);
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
      const response = await axios.get<Todo[]>("/api/todo");
      setTodos(response);
    } catch (err) {
      console.error("Failed to fetch todos:", err);
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

  const deleteTodo = (id: string) => {
    setCurrentTodoId(id);
    setDeleteConfirmVisible(true);
  };

  const handleClose = () => {
    setTodoModalVisible(false);
    setEditingTodo(null);
  };

  const onDeleteClose = () => {
    setCurrentTodoId(null);
    setDeleteConfirmVisible(false);
    fetchTodos();
  };

  // 切换任务完成状态
  const toggleComplete = async (id: string, completed: boolean) => {
    try {
      await axios.put(`/api/todo?id=${id}`, {
        status: completed ? "completed" : "pending",
      });
      message.success(completed ? "任务已完成" : "任务已恢复");
      fetchTodos();
    } catch (error) {
      console.error("更新任务状态失败:", error);
      message.error("更新任务状态失败");
    }
  };

  // 删除待办事项
  const deleteHandle = async () => {
    if (!currentTodoId) return;
    await axios.delete(`/api/todo?id=${currentTodoId}`);
    setDeleteConfirmVisible(false);
    message.success("删除成功");
  };

  useEffect(() => {
    fetchTodos();
  }, []);

  return (
    <SectionCard
      title="待办事项"
      right={
        <div className="flex gap-3">
          <Button type="text" icon={<FaHistory />} onClick={openHistoryModal}></Button>
        </div>
      }
    >
      <ConfirmModal
        zIndex={1001}
        title="确认删除"
        message="确定要删除此任务吗？此操作不可撤销。"
        visible={deleteConfirmVisible}
        onClose={onDeleteClose}
        onConfirm={deleteHandle}
        confirmText="删除"
        cancelText="取消"
        confirmDanger={true}
      />

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
                  deleteTodo={deleteTodo}
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
                    deleteTodo={deleteTodo}
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
