import { useState, useEffect } from "react";
import { Button, Input, Select, Form, DatePicker, message } from "antd";
import { Todo, AddTodo } from "@/lib/drizzle/schema/todo";
import GModal from "@/components/Modal";
import axios from "@/lib/axios";
import dayjs from "dayjs";

interface TodoModalProps {
  visible: boolean;
  onClose: () => void;
  refresh: () => void;
  initialData?: Todo | null;
}
export default function TodoModal(props: TodoModalProps) {
  const { initialData, onClose, refresh } = props;
  const [loading, setLoading] = useState(false);

  const [form] = Form.useForm();

  useEffect(() => {
    if (initialData) {
      form.setFieldsValue({
        title: initialData.title,
        description: initialData.description,
        priority: initialData.priority,
        dueDate: initialData.dueDate ? dayjs(initialData.dueDate) : undefined,
      });
    } else {
      form.resetFields();
    }
  }, [initialData, form]);

  const handleSubmit = async () => {
    form.validateFields().then(async (values) => {
      setLoading(true);
      const newTodo: AddTodo = {
        title: values.title,
        description: values.description || "",
        status: "pending",
        priority: values.priority || "medium",
        dueDate: values.dueDate || undefined,
      };
      try {
        if (!initialData?.id) {
          await axios.post("/api/todo", newTodo);
          message.success("任务添加成功");
        } else {
          await axios.put(`/api/todo?id=${initialData.id}`, newTodo);
          message.success("任务更新成功");
        }
        form.resetFields();
        refresh();
      } finally {
        setLoading(false);
        onClose();
      }
    });
  };

  return (
    <GModal {...props}>
      <Form
        form={form}
        layout="vertical"
        className="space-y-3"
        initialValues={{ priority: "medium" }}
      >
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
              options={[
                { value: "low", label: "低" },
                { value: "medium", label: "中" },
                { value: "high", label: "高" },
                { value: "urgent", label: "紧急" },
              ]}
            />
          </Form.Item>

          <Form.Item name="dueDate" label="截止日期">
            <DatePicker />
          </Form.Item>
        </div>

        <Form.Item>
          <Button type="primary" block onClick={handleSubmit} loading={loading}>
            {initialData?.id ? "更新任务" : "添加任务"}
          </Button>
        </Form.Item>
      </Form>
    </GModal>
  );
}
