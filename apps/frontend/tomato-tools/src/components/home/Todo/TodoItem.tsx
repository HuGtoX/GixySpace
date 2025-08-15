import React from "react";
import { Tooltip, Modal, message, Spin, Badge, Checkbox } from "antd";
import { FaTrash, FaHistory, FaClock, FaEdit } from "react-icons/fa";
import { Todo } from "@/lib/drizzle/schema/todo";

interface TodoItemProps {
  todo: Todo;
}

// 优先级样式映射
const priorityStyles: Record<string, string> = {
  low: "bg-gray-100 text-gray-800",
  medium: "bg-blue-100 text-blue-800",
  high: "bg-orange-100 text-orange-800",
  urgent: "bg-red-100 text-red-800",
};

const priorityText = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

export default function TodoItem(props: TodoItemProps) {
  const { todo } = props;

  return (
    <div
      key={todo.id}
      className={`group flex flex-col rounded-md p-3 transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-700 ${todo.status === "completed" ? "opacity-70" : ""}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-1 items-start gap-2">
          <Checkbox />
          <div className="min-w-0 flex-1">
            {todo.title}
            {todo.description && (
              <p className="mt-1 hidden truncate text-xs text-gray-500 transition-opacity duration-200 group-hover:block dark:text-gray-400">
                {todo.description}
              </p>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          {todo.priority && (
            <Badge
              className={`text-xs ${priorityStyles[todo.priority]}`}
              text={priorityText[todo.priority] || todo.priority}
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
      <div className="mt-2 hidden items-center justify-between gap-2 text-xs text-gray-500 duration-200 group-hover:flex dark:text-gray-400">
        <span>创建时间：{new Date(todo.createdAt).toLocaleDateString()}</span>
        <div className="flex gap-1">
          <Tooltip title="编辑" placement="top">
            <button
              className="p-1 text-gray-400 hover:text-blue-500"
              aria-label="编辑任务"
            >
              <FaEdit size={14} />
            </button>
          </Tooltip>
          <Tooltip title="删除" placement="top">
            <button
              className="p-1 text-gray-400 hover:text-red-500"
              aria-label="删除任务"
            >
              <FaTrash size={14} />
            </button>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}
