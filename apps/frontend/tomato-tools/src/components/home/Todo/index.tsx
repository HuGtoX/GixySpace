import { useState, useEffect } from "react";
import { Tooltip, Modal, message, Spin, Badge, Button } from "antd";
import { FaPlus } from "react-icons/fa";
import SectionCard from "@/components/SectionCard";
import { Todo } from "@/lib/drizzle/schema/todo";
import TodoModal from "./TodoModal";
import axios from "@/lib/axios";
import TodoItem from "./TodoItem";

const TodoList = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentTodoId, setCurrentTodoId] = useState<string | null>(null);
  const [todoModalVisible, setTodoModalVisible] = useState(false);

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

  // 删除待办事项
  const deleteTodo = async () => {
    if (!currentTodoId) return;
    setLoading(true);
    try {
      await axios.delete(`/api/todo/${currentTodoId}`);
      setDeleteConfirmVisible(false);
      message.success("删除成功");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodos();
  }, []);

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

      <TodoModal
        visible={todoModalVisible}
        onClose={() => setTodoModalVisible(false)}
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
              .map((todo) => <TodoItem key={todo.id} todo={todo} />)
          )}
        </Spin>
      </div>

      <div className="mt-4 flex">
        <Button onClick={() => setTodoModalVisible(true)} block type="primary">
          <FaPlus /> 添加任务
        </Button>
      </div>
    </SectionCard>
  );
};

export default TodoList;
