import { useState } from "react";
import { Button, Input, Select, Form, DatePicker } from "antd";
import { Todo, AddTodo } from "@/lib/drizzle/schema/todo";
import GModal from "@/components/Modal";
import axios from "@/lib/axios";

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

interface TodoModalProps {
  visible: boolean;
  onClose: () => void;
}
export default function TodoModal(props: TodoModalProps) {
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [form] = Form.useForm();

  const handleAddTodo = async () => {
    form.validateFields().then(async (values) => {
      const newTodo: AddTodo = {
        title: values.title,
        description: values.description || "",
        status: "pending",
        priority: values.priority || "medium",
        dueDate: values.dueDate,
      };

      console.log("-- [ newTodo ] --", newTodo);
      await axios.post("/api/todo", newTodo);
      // form.resetFields();
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
      form.resetFields();
    });
  };

  return (
    <GModal {...props}>
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
            <DatePicker format="YYYY-MM-DD" />
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
    </GModal>
  );
}
