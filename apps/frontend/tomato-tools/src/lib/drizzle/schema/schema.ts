import {
  pgTable,
  text,
  timestamp,
  uuid,
  boolean,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { todo } from "./todo";
import { aiSummary } from "./aiSummary";
import { notification, userNotification } from "./notification";
import { aiUsageLogs, aiUsageStatistics } from "./aiUsage";
import { aiChatSession } from "./aiChat";
// 用户角色枚举
export const userRoleEnum = pgEnum("user_role", ["user", "admin", "anonymous"]);

// 用户表（扩展Supabase auth.users）
export const user = pgTable("user", {
  id: uuid("id").primaryKey(), // 对应 auth.users.id
  email: text("email").notNull().unique(),
  fullName: text("full_name"),
  avatarUrl: text("avatar_url"),
  role: userRoleEnum("role").default("user").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  isAnonymous: boolean("is_anonymous").default(false).notNull(), // 标识匿名用户
  anonymousCreatedAt: timestamp("anonymous_created_at", { withTimezone: true }), // 匿名用户创建时间
  expiresAt: timestamp("expires_at", { withTimezone: true }), // 过期时间（可选）
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// 用户配置表
export const userProfile = pgTable("user_profile", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .references(() => user.id, { onDelete: "cascade" })
    .notNull(),
  bio: text("bio"),
  website: text("website"),
  location: text("location"),
  preferences: text("preferences"), // JSON字符串存储用户偏好
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// 用户会话日志表
export const userSession = pgTable("user_session", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .references(() => user.id, { onDelete: "cascade" })
    .notNull(),
  sessionId: text("session_id").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  loginAt: timestamp("login_at", { withTimezone: true }).defaultNow().notNull(),
  logoutAt: timestamp("logout_at", { withTimezone: true }),
  isActive: boolean("is_active").default(true).notNull(),
});

// 密码重置令牌表
export const passwordResetToken = pgTable("password_reset_token", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .references(() => user.id, { onDelete: "cascade" })
    .notNull(),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// 邮箱验证码表（已废弃，改用 Supabase Email OTP）
// 保留定义以便需要时回滚，可在确认稳定后删除
// export const emailVerification = pgTable("email_verification", {
//   id: uuid("id").primaryKey().defaultRandom(),
//   email: text("email").notNull(),
//   code: text("code").notNull(),
//   expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
//   createdAt: timestamp("created_at", { withTimezone: true })
//     .defaultNow()
//     .notNull(),
// });

// 关系定义
export const userRelations = relations(user, ({ one, many }) => ({
  profile: one(userProfile, {
    fields: [user.id],
    references: [userProfile.userId],
  }),
  sessions: many(userSession),
  passwordResetTokens: many(passwordResetToken),
  todos: many(todo),
  aiSummaries: many(aiSummary),
  notifications: many(userNotification),
  createdNotifications: many(notification),
  aiUsageLogs: many(aiUsageLogs),
  aiUsageStatistics: many(aiUsageStatistics),
  aiChatSessions: many(aiChatSession),
}));

export const userProfileRelations = relations(userProfile, ({ one }) => ({
  user: one(user, {
    fields: [userProfile.userId],
    references: [user.id],
  }),
}));

export const userSessionRelations = relations(userSession, ({ one }) => ({
  user: one(user, {
    fields: [userSession.userId],
    references: [user.id],
  }),
}));

export const passwordResetTokenRelations = relations(
  passwordResetToken,
  ({ one }) => ({
    user: one(user, {
      fields: [passwordResetToken.userId],
      references: [user.id],
    }),
  }),
);

// 导出表
export { aiSummary } from "./aiSummary";
export {
  notification,
  userNotification,
  notificationStats,
  notificationRelations,
  userNotificationRelations,
  notificationStatsRelations,
} from "./notification";
export {
  aiUsageLogs,
  aiUsageStatistics,
  aiUsageLogsRelations,
  aiUsageStatisticsRelations,
} from "./aiUsage";
export {
  aiChatSession,
  aiChatMessage,
  aiChatSessionRelations,
  aiChatMessageRelations,
} from "./aiChat";

// 类型导出
export type User = typeof user.$inferSelect;
export type NewUser = typeof user.$inferInsert;
export type UserProfile = typeof userProfile.$inferSelect;
export type NewUserProfile = typeof userProfile.$inferInsert;
export type UserSession = typeof userSession.$inferSelect;
export type NewUserSession = typeof userSession.$inferInsert;
export type PasswordResetToken = typeof passwordResetToken.$inferSelect;
export type NewPasswordResetToken = typeof passwordResetToken.$inferInsert;
// 已废弃：改用 Supabase Email OTP
// export type EmailVerification = typeof emailVerification.$inferSelect;
// export type NewEmailVerification = typeof emailVerification.$inferInsert;

// 导出通知相关类型
export type {
  Notification,
  NewNotification,
  UserNotification,
  NewUserNotification,
  NotificationStats,
  NewNotificationStats,
  NotificationWithStats,
  UserNotificationWithDetails,
} from "./notification";

// 导出AI使用记录相关类型
export type {
  AiUsageLog,
  NewAiUsageLog,
  AiUsageStatistic,
  NewAiUsageStatistic,
  AiUsageLogWithUser,
  AiUsageStatisticWithUser,
} from "./aiUsage";

// 导出AI聊天相关类型
export type {
  AiChatSession,
  NewAiChatSession,
  AiChatMessage,
  NewAiChatMessage,
  AiChatSessionWithMessages,
  AiChatSessionWithUser,
} from "./aiChat";
