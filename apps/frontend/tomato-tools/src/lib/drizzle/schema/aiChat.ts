import {
  pgTable,
  text,
  timestamp,
  uuid,
  boolean,
  pgEnum,
  index,
  jsonb,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { user } from "./schema";

// 消息角色枚举
export const messageRoleEnum = pgEnum("message_role", ["user", "assistant"]);

/**
 * AI聊天会话表
 * 存储用户的聊天会话信息
 */
export const aiChatSession = pgTable(
  "ai_chat_session",
  {
    // 基础字段
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .references(() => user.id, { onDelete: "cascade" })
      .notNull(),

    // 会话信息
    title: text("title").notNull().default("新对话"),
    model: text("model").notNull(), // AI模型名称，如：deepseek-chat
    isOnlineSearch: boolean("is_online_search").notNull().default(false), // 是否启用联网查询

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
    index("idx_ai_chat_session_user_id").using(
      "btree",
      table.userId.asc().nullsLast().op("uuid_ops"),
    ),
    index("idx_ai_chat_session_created_at").using(
      "btree",
      table.createdAt.desc().nullsLast().op("timestamptz_ops"),
    ),
    index("idx_ai_chat_session_user_created").using(
      "btree",
      table.userId.asc().nullsLast().op("uuid_ops"),
      table.createdAt.desc().nullsLast().op("timestamptz_ops"),
    ),
  ],
);

/**
 * AI聊天消息表
 * 存储会话中的所有消息
 */
export const aiChatMessage = pgTable(
  "ai_chat_message",
  {
    // 基础字段
    id: uuid("id").primaryKey().defaultRandom(),
    sessionId: uuid("session_id")
      .references(() => aiChatSession.id, { onDelete: "cascade" })
      .notNull(),

    // 消息内容
    content: text("content").notNull(),
    role: messageRoleEnum("role").notNull(),

    // 扩展信息（可选）
    metadata: jsonb("metadata"), // 存储额外的元数据，如tokens使用量、耗时等

    // 时间戳
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    // 索引优化查询性能
    index("idx_ai_chat_message_session_id").using(
      "btree",
      table.sessionId.asc().nullsLast().op("uuid_ops"),
    ),
    index("idx_ai_chat_message_created_at").using(
      "btree",
      table.createdAt.asc().nullsLast().op("timestamptz_ops"),
    ),
    index("idx_ai_chat_message_session_created").using(
      "btree",
      table.sessionId.asc().nullsLast().op("uuid_ops"),
      table.createdAt.asc().nullsLast().op("timestamptz_ops"),
    ),
  ],
);

// 关系定义
export const aiChatSessionRelations = relations(
  aiChatSession,
  ({ one, many }) => ({
    user: one(user, {
      fields: [aiChatSession.userId],
      references: [user.id],
    }),
    messages: many(aiChatMessage),
  }),
);

export const aiChatMessageRelations = relations(aiChatMessage, ({ one }) => ({
  session: one(aiChatSession, {
    fields: [aiChatMessage.sessionId],
    references: [aiChatSession.id],
  }),
}));

// 类型导出
export type AiChatSession = typeof aiChatSession.$inferSelect;
export type NewAiChatSession = typeof aiChatSession.$inferInsert;
export type AiChatMessage = typeof aiChatMessage.$inferSelect;
export type NewAiChatMessage = typeof aiChatMessage.$inferInsert;

// 扩展类型：带消息的会话
export type AiChatSessionWithMessages = AiChatSession & {
  messages: AiChatMessage[];
};

// 扩展类型：带用户信息的会话
export type AiChatSessionWithUser = AiChatSession & {
  user: {
    id: string;
    email: string;
    fullName: string | null;
  };
};
