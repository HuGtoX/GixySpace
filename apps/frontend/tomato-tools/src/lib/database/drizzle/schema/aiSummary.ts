import {
  pgTable,
  text,
  timestamp,
  uuid,
  pgEnum,
  integer,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { user } from "./schema";

// AI总结类型枚举
export const aiSummaryTypeEnum = pgEnum("ai_summary_type", [
  "day",
  "week",
  "month",
  "all",
]);

// AI总结状态枚举
export const aiSummaryStatusEnum = pgEnum("ai_summary_status", [
  "generating",
  "completed",
  "failed",
]);

// AI总结表
export const aiSummary = pgTable("ai_summary", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .references(() => user.id, { onDelete: "cascade" })
    .notNull(),
  title: text("title").notNull(), // 总结标题，如"2024年1月15日工作总结"
  content: text("content"), // AI生成的总结内容
  summaryType: aiSummaryTypeEnum("summary_type").notNull(), // 总结类型：日/周/月/全部
  period: text("period").notNull(), // 时间周期，如"2024-01-15"或"2024-W03"
  todoCount: integer("todo_count").default(0).notNull(), // 包含的任务数量
  status: aiSummaryStatusEnum("status").default("generating").notNull(), // 生成状态
  prompt: text("prompt"), // 生成时使用的提示词（可选，用于调试）
  errorMessage: text("error_message"), // 错误信息（如果生成失败）
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// 关系定义
export const aiSummaryRelations = relations(aiSummary, ({ one }) => ({
  user: one(user, {
    fields: [aiSummary.userId],
    references: [user.id],
  }),
}));

// 类型导出
export type AiSummary = typeof aiSummary.$inferSelect;
export type NewAiSummary = typeof aiSummary.$inferInsert;
