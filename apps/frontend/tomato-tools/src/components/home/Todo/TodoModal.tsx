import { useState } from "react";
import { Button, Input, Select, Form } from "antd";
import { PlusCircleOutlined } from "@ant-design/icons";
import { todoStatusEnum, todoPriorityEnum } from "@/lib/drizzle/schema/todo";

type TodoItem = {
  id: string;
  title: string;
  description: string;
  status: (typeof todoStatusEnum.enumValues)[number];
  priority: (typeof todoPriorityEnum.enumValues)[number];
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
};

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  in_progress: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-gray-100 text-gray-800",
};

const priorityColors: Record<string, string> = {
  low: "bg-gray-100 text-gray-800",
  medium: "bg-blue-100 text-blue-800",
  high: "bg-orange-100 text-orange-800",
  urgent: "bg-red-100 text-red-800",
};

export default function Todo() {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [editingTodo, setEditingTodo] = useState<TodoItem | null>(null);
  const [form] = Form.useForm();

  const handleAddTodo = () => {
    form.validateFields().then((values) => {
      const newTodo: TodoItem = {
        id: Date.now().toString(),
        title: values.title,
        description: values.description || "",
        status: "pending",
        priority: values.priority || "medium",
        dueDate: values.dueDate,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setTodos([...todos, newTodo]);
      form.resetFields();
    });
  };
  const handleUpdateTodo = () => {
    if (!editingTodo) return;

    form.validateFields().then((values) => {
      const updatedTodo = {
        ...editingTodo,
        title: values.title,
        description: values.description || "",
        priority: values.priority || "medium",
        dueDate: values.dueDate,
        updatedAt: new Date().toISOString(),
      };

      setTodos(todos.map((t) => (t.id === updatedTodo.id ? updatedTodo : t)));
      setEditingTodo(null);
      form.resetFields();
    });
  };

  return (
    <div className="space-y-6 rounded-xl bg-white p-4 shadow-sm dark:bg-gray-800">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold">待办事项</h2>
        <Button
          type="primary"
          icon={<PlusCircleOutlined />}
          onClick={() => setEditingTodo(null)}
        >
          {editingTodo ? "取消编辑" : "添加任务"}
        </Button>
      </div>

      {/* 表单区域 */}
      <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-700">
        <Form form={form} layout="vertical" className="space-y-3">
          <Form.Item
            name="title"
            rules={[{ required: true, message: "请输入任务标题" }]}
            label="任务标题"
          >
            <Input placeholder="输入任务标题" />
          </Form.Item>

          <Form.Item name="description" label="任务描述">
            <Input.TextArea rows={3} placeholder="输入任务描述" />
          </Form.Item>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Form.Item name="priority" label="优先级">
              <Select
                defaultValue="medium"
                options={[
                  { value: "low", label: "低" },
                  { value: "medium", label: "中" },
                  { value: "high", label: "高" },
                  { value: "urgent", label: "紧急" },
                ]}
              />
            </Form.Item>

            <Form.Item name="dueDate" label="截止日期">
              <Input type="date" />
            </Form.Item>
          </div>

          <Form.Item>
            <Button
              type="primary"
              block
              onClick={editingTodo ? handleUpdateTodo : handleAddTodo}
            >
              {editingTodo ? "更新任务" : "添加任务"}
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
}
