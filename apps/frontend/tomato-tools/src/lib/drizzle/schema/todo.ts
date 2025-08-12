import { pgTable, text, timestamp, uuid, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { user } from "./schema";

// 任务状态枚举
export const todoStatusEnum = pgEnum("todo_status", [
  "pending",
  "in_progress",
  "completed",
  "cancelled",
]);

// 任务优先级枚举
export const todoPriorityEnum = pgEnum("todo_priority", [
  "low",
  "medium",
  "high",
  "urgent",
]);

// 任务表
export const todo = pgTable("todo", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .references(() => user.id, { onDelete: "cascade" })
    .notNull(),
  title: text("title").notNull(),
  description: text("description"),
  status: todoStatusEnum("status").default("pending").notNull(),
  priority: todoPriorityEnum("priority").default("medium").notNull(),
  dueDate: timestamp("due_date", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// 关系定义
export const todoRelations = relations(todo, ({ one }) => ({
  user: one(user, {
    fields: [todo.userId],
    references: [user.id],
  }),
}));

// 类型导出
export type Todo = typeof todo.$inferSelect;
export type NewTodo = typeof todo.$inferInsert;
