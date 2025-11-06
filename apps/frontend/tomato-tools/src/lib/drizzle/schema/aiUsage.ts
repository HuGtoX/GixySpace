import {
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  numeric,
  jsonb,
  index,
  date,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { user } from "./schema";

// AI请求状态枚举
export const aiUsageStatusEnum = pgEnum("ai_usage_status", [
  "success",
  "failed",
  "timeout",
]);

// AI使用场景枚举
export const aiUsageSceneEnum = pgEnum("ai_usage_scene", [
  "chat", // 聊天对话
  "summary", // 内容摘要
  "translation", // 翻译
  "code_generation", // 代码生成
  "text_optimization", // 文本优化
  "question_answer", // 问答
  "weather_report", // 天气播报
  "other", // 其他
]);

// AI对话分类枚举（更细粒度的分类）
export const aiConversationCategoryEnum = pgEnum("ai_conversation_category", [
  // 通用对话类
  "general_chat", // 通用聊天
  "casual_conversation", // 闲聊

  // 工作相关类
  "work_consultation", // 工作咨询
  "technical_support", // 技术支持
  "code_review", // 代码审查
  "debugging_help", // 调试帮助
  "architecture_design", // 架构设计

  // 学习教育类
  "learning_tutorial", // 学习教程
  "concept_explanation", // 概念解释
  "homework_help", // 作业辅导

  // 创作类
  "content_creation", // 内容创作
  "writing_assistance", // 写作辅助
  "brainstorming", // 头脑风暴

  // 数据处理类
  "data_analysis", // 数据分析
  "report_generation", // 报告生成
  "document_summary", // 文档摘要

  // 语言处理类
  "translation_service", // 翻译服务
  "grammar_check", // 语法检查
  "text_polishing", // 文本润色

  // 其他
  "other", // 其他
]);

/**
 * AI使用日志表
 * 记录每次AI API调用的详细信息
 */
export const aiUsageLogs = pgTable(
  "ai_usage_logs",
  {
    // 基础字段
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .references(() => user.id, { onDelete: "cascade" })
      .notNull(),

    // 使用场景和模型
    scene: aiUsageSceneEnum("scene").notNull(),
    sceneDescription: text("scene_description"), // 场景描述（可选）

    // 对话分类（更细粒度的分类）
    conversationCategory: aiConversationCategoryEnum("conversation_category"),
    conversationTags: jsonb("conversation_tags").$type<string[]>(), // 对话标签（如：["urgent", "important"]）

    model: text("model").notNull(), // AI模型名称，如：deepseek-chat

    // Tokens使用量
    promptTokens: integer("prompt_tokens").notNull().default(0), // 输入tokens
    completionTokens: integer("completion_tokens").notNull().default(0), // 输出tokens
    totalTokens: integer("total_tokens").notNull().default(0), // 总tokens

    // 成本相关
    estimatedCost: numeric("estimated_cost", { precision: 10, scale: 6 }), // 预估成本（美元）

    // 请求和响应数据
    requestData: jsonb("request_data"), // 完整的请求数据
    responseData: jsonb("response_data"), // 完整的响应数据

    // 请求状态
    status: aiUsageStatusEnum("status").notNull().default("success"),
    errorMessage: text("error_message"), // 错误信息
    errorCode: text("error_code"), // 错误代码

    // 性能指标
    duration: integer("duration"), // 请求耗时（毫秒）

    // 请求元数据
    ipAddress: text("ip_address"), // 用户IP地址
    userAgent: text("user_agent"), // 用户代理
    requestId: text("request_id"), // 请求ID（用于追踪）

    // 时间戳
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    // 索引优化查询性能
    index("idx_ai_usage_logs_user_id").using(
      "btree",
      table.userId.asc().nullsLast().op("uuid_ops"),
    ),
    index("idx_ai_usage_logs_scene").using(
      "btree",
      table.scene.asc().nullsLast(),
    ),
    index("idx_ai_usage_logs_category").using(
      "btree",
      table.conversationCategory.asc().nullsLast(),
    ),
    index("idx_ai_usage_logs_created_at").using(
      "btree",
      table.createdAt.desc().nullsLast().op("timestamptz_ops"),
    ),
    index("idx_ai_usage_logs_user_created").using(
      "btree",
      table.userId.asc().nullsLast().op("uuid_ops"),
      table.createdAt.desc().nullsLast().op("timestamptz_ops"),
    ),
  ],
);

/**
 * AI使用统计表
 * 按日期统计用户的AI使用情况，便于快速查询和展示
 */
export const aiUsageStatistics = pgTable(
  "ai_usage_statistics",
  {
    // 基础字段
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .references(() => user.id, { onDelete: "cascade" })
      .notNull(),
    date: date("date").notNull(), // 统计日期

    // 请求统计
    totalRequests: integer("total_requests").notNull().default(0), // 总请求次数
    successRequests: integer("success_requests").notNull().default(0), // 成功请求次数
    failedRequests: integer("failed_requests").notNull().default(0), // 失败请求次数

    // Tokens统计
    totalPromptTokens: integer("total_prompt_tokens").notNull().default(0), // 总输入tokens
    totalCompletionTokens: integer("total_completion_tokens")
      .notNull()
      .default(0), // 总输出tokens
    totalTokens: integer("total_tokens").notNull().default(0), // 总tokens

    // 成本统计
    totalCost: numeric("total_cost", { precision: 10, scale: 6 })
      .notNull()
      .default("0"), // 总成本（美元）

    // 场景统计（JSON格式）
    // 示例：{"chat": 10, "summary": 5, "translation": 3}
    sceneStats: jsonb("scene_stats").default({}),

    // 对话分类统计（JSON格式）
    // 示例：{"general_chat": 5, "technical_support": 3, "code_review": 2}
    categoryStats: jsonb("category_stats").default({}),

    // 模型统计（JSON格式）
    // 示例：{"deepseek-chat": 15, "deepseek-v3": 3}
    modelStats: jsonb("model_stats").default({}),

    // 平均性能指标
    avgDuration: integer("avg_duration"), // 平均请求耗时（毫秒）

    // 时间戳
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    // 索引优化查询性能
    index("idx_ai_usage_stats_user_date").using(
      "btree",
      table.userId.asc().nullsLast().op("uuid_ops"),
      table.date.desc().nullsLast().op("date_ops"),
    ),
    index("idx_ai_usage_stats_date").using(
      "btree",
      table.date.desc().nullsLast().op("date_ops"),
    ),
  ],
);

// 关系定义
export const aiUsageLogsRelations = relations(aiUsageLogs, ({ one }) => ({
  user: one(user, {
    fields: [aiUsageLogs.userId],
    references: [user.id],
  }),
}));

export const aiUsageStatisticsRelations = relations(
  aiUsageStatistics,
  ({ one }) => ({
    user: one(user, {
      fields: [aiUsageStatistics.userId],
      references: [user.id],
    }),
  }),
);

// 类型导出
export type AiUsageLog = typeof aiUsageLogs.$inferSelect;
export type NewAiUsageLog = typeof aiUsageLogs.$inferInsert;
export type AiUsageStatistic = typeof aiUsageStatistics.$inferSelect;
export type NewAiUsageStatistic = typeof aiUsageStatistics.$inferInsert;

// 扩展类型：带用户信息的AI使用日志
export type AiUsageLogWithUser = AiUsageLog & {
  user: {
    id: string;
    email: string;
    fullName: string | null;
  };
};

// 扩展类型：带用户信息的AI使用统计
export type AiUsageStatisticWithUser = AiUsageStatistic & {
  user: {
    id: string;
    email: string;
    fullName: string | null;
  };
};
