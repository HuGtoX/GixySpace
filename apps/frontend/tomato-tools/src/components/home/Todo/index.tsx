import { useState, useEffect } from "react";
import { Tooltip, Modal, message, Spin, Badge, Button } from "antd";
import {
  FaPlus,
  FaTrash,
  FaCheckCircle,
  FaHistory,
  FaClock,
  FaEdit,
} from "react-icons/fa";
import SectionCard from "@/components/SectionCard";
import type { Todo, TodoAddRequest, TodoUpdateRequest } from "@gixy/types";
import axios from "@/lib/axios";

const TodoList = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState<TodoAddRequest>({ title: "" });
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentTodoId, setCurrentTodoId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 获取待办事项列表
  const fetchTodos = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get<Todo[]>("/api/todo");
      setTodos(response);
    } catch (err) {
      setError("获取待办事项失败");
      console.error("Failed to fetch todos:", err);
    } finally {
      setLoading(false);
    }
  };

  // 添加待办事项
  const addTodo = async () => {
    if (!newTodo.title.trim()) {
      message.warning("请输入任务标题");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await axios.post<Todo>("/api/todo", newTodo);
      setTodos([...todos, response]);
      setNewTodo({ title: "" });
      message.success("添加成功");
    } catch (err) {
      setError("添加待办事项失败");
      console.error("Failed to add todo:", err);
    } finally {
      setLoading(false);
    }
  };

  // 更新待办事项
  const updateTodo = async (
    id: string,
    updates: Partial<TodoUpdateRequest>,
  ) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.put<Todo>(`/api/todo/${id}`, updates);
      setTodos(todos.map((todo) => (todo.id === id ? response.data : todo)));
      message.success("更新成功");
    } catch (err) {
      setError("更新待办事项失败");
      console.error("Failed to update todo:", err);
    } finally {
      setLoading(false);
    }
  };

  // 删除待办事项
  const deleteTodo = async () => {
    if (!currentTodoId) return;

    setLoading(true);
    setError(null);
    try {
      await axios.delete(`/api/todo/${currentTodoId}`);
      setTodos(todos.filter((todo) => todo.id !== currentTodoId));
      setDeleteConfirmVisible(false);
      setCurrentTodoId(null);
      message.success("删除成功");
    } catch (err) {
      setError("删除待办事项失败");
      console.error("Failed to delete todo:", err);
    } finally {
      setLoading(false);
    }
  };

  // 切换待办事项状态
  const toggleTodoStatus = (id: string, completed: boolean) => {
    updateTodo(id, { completed, status: completed ? "completed" : "pending" });
  };

  // 归档待办事项
  const archiveTodo = (id: string) => {
    updateTodo(id, { archived: true });
  };

  // 确认删除
  const confirmDelete = (id: string) => {
    setCurrentTodoId(id);
    setDeleteConfirmVisible(true);
  };

  useEffect(() => {
    fetchTodos();
  }, []);

  // 优先级样式映射
  const priorityStyles: Record<string, string> = {
    low: "bg-gray-100 text-gray-800",
    medium: "bg-blue-100 text-blue-800",
    high: "bg-orange-100 text-orange-800",
    urgent: "bg-red-100 text-red-800",
  };

  const renderTodo = (todo: Todo) => (
    <div
      key={todo.id}
      className={`group flex flex-col rounded-md p-3 transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-700 ${todo.archived ? "opacity-70" : ""}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-1 items-start gap-2">
          <input
            type="checkbox"
            checked={todo.completed}
            onChange={() => toggleTodoStatus(todo.id, !todo.completed)}
            className="mt-0.5 h-4 w-4 rounded text-primary dark:text-dark-primary"
          />
          <div className="min-w-0 flex-1">
            <label
              className={`block text-sm font-medium ${todo.completed ? "text-gray-400 line-through" : ""}`}
            >
              {todo.title}
            </label>
            {todo.description && (
              <p className="mt-1 truncate text-xs text-gray-500 dark:text-gray-400">
                {todo.description}
              </p>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          {todo.priority && (
            <Badge
              className={`text-xs ${priorityStyles[todo.priority]}`}
              text={
                todo.priority === "low"
                  ? "低"
                  : todo.priority === "medium"
                    ? "中"
                    : todo.priority === "high"
                      ? "高"
                      : "紧急"
              }
            />
          )}
          {todo.dueDate && (
            <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
              <FaClock size={12} className="mr-1" />
              {new Date(todo.dueDate).toLocaleDateString()}
            </div>
          )}
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between gap-2 text-xs text-gray-500 dark:text-gray-400">
        <span>{new Date(todo.createdAt).toLocaleDateString()}</span>
        <div className="flex gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          <Tooltip title="编辑" placement="top">
            <button
              className="p-1 text-gray-400 hover:text-blue-500"
              aria-label="编辑任务"
              // onClick={() => handleEdit(todo.id)}
            >
              <FaEdit size={14} />
            </button>
          </Tooltip>
          <Tooltip
            title={todo.completed ? "取消完成" : "标记为已完成"}
            placement="top"
          >
            <button
              className={`p-1 ${todo.completed ? "text-green-500" : "text-gray-400 hover:text-green-500"}`}
              aria-label={todo.completed ? "取消完成" : "标记为已完成"}
              onClick={() => toggleTodoStatus(todo.id, !todo.completed)}
            >
              <FaCheckCircle size={14} />
            </button>
          </Tooltip>
          {!todo.archived && (
            <Tooltip title="归档" placement="top">
              <button
                className="p-1 text-gray-400 hover:text-blue-500"
                aria-label="归档任务"
                onClick={() => archiveTodo(todo.id)}
              >
                <FaHistory size={14} />
              </button>
            </Tooltip>
          )}
          <Tooltip title="删除" placement="top">
            <button
              className="p-1 text-gray-400 hover:text-red-500"
              aria-label="删除任务"
              onClick={() => confirmDelete(todo.id)}
            >
              <FaTrash size={14} />
            </button>
          </Tooltip>
        </div>
      </div>
    </div>
  );

  return (
    <SectionCard title="待办事项" right={<div className="flex gap-3"></div>}>
      <Modal
        zIndex={1001}
        title="确认删除"
        open={deleteConfirmVisible}
        onCancel={() => setDeleteConfirmVisible(false)}
        okText="删除"
        cancelText="取消"
        centered
        okButtonProps={{ danger: true }}
        onOk={deleteTodo}
      >
        <p>确定要删除此任务吗？此操作不可撤销。</p>
      </Modal>

      <div className="max-h-[300px] space-y-2 overflow-auto pr-1">
        <Spin spinning={loading} tip="加载中...">
          {todos.filter((todo) => !todo.archived).length === 0 ? (
            <div className="py-8 text-center text-gray-500 dark:text-gray-400">
              <div className="mb-2 text-4xl">📝</div>
              <p>暂无待办事项</p>
              <p className="mt-1 text-sm">添加任务开始创建</p>
            </div>
          ) : (
            todos.filter((todo) => !todo.archived).map(renderTodo)
          )}
        </Spin>
      </div>

      <div className="mt-4 flex">
        <Button block type="primary">
          <FaPlus /> 添加任务
        </Button>
      </div>
    </SectionCard>
  );
};

export default TodoList;
