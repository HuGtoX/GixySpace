import React from "react";
import { Tooltip, Badge, Checkbox } from "antd";
import { FaTrash, FaClock, FaEdit } from "react-icons/fa";
import { Todo } from "@/lib/drizzle/schema/todo";
import classNames from "classnames";

interface TodoItemProps {
  todo: Todo;
  isHistory?: boolean;
  onEdit: (todo: Todo) => void;
  deleteTodo: (id: string) => void;
  onToggleComplete: (id: string, completed: boolean) => void;
}

// 优先级样式映射
const priorityStyles: Record<
  string,
  "default" | "processing" | "warning" | "error"
> = {
  low: "default",
  medium: "processing",
  high: "warning",
  urgent: "error",
};

const priorityText = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

export default function TodoItem(props: TodoItemProps) {
  const { todo, onEdit, deleteTodo, onToggleComplete, isHistory } = props;

  return (
    <div
      key={todo.id}
      className={classNames(
        "group",
        "flex",
        "flex-1",
        "flex-col",
        "rounded-md",
        "p-3",
        "hover:bg-gray-100",
        "dark:hover:bg-gray-700",
        { "opacity-70": todo.status === "completed" && !isHistory },
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-1 items-start gap-2">
          <Checkbox
            checked={todo.status === "completed"}
            onChange={(e) => onToggleComplete(todo.id, e.target.checked)}
          />
          <div className="min-w-0 flex-1">
            {todo.title}
            {todo.description && (
              <p
                className={classNames(
                  "mt-1 truncate text-xs text-gray-500 transition-opacity duration-200 group-hover:block dark:text-gray-400",
                  { hidden: !isHistory },
                )}
              >
                {todo.description}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-1">
          <Badge
            key={todo.priority}
            status={priorityStyles[todo.priority]}
            text={priorityText[todo.priority] || todo.priority}
          />
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
              onClick={() => onEdit(todo)}
            >
              <FaEdit size={14} />
            </button>
          </Tooltip>
          <Tooltip title="删除" placement="top">
            <button
              onClick={() => deleteTodo(todo.id)}
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
