import {
  pgTable,
  text,
  timestamp,
  uuid,
  boolean,
  pgEnum,
  integer,
  json,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { user } from "./schema";

// 通知类型枚举
export const notificationTypeEnum = pgEnum("notification_type", [
  "system", // 系统通知
  "github", // GitHub相关通知
  "update", // 更新通知
  "security", // 安全通知
  "feature", // 功能通知
  "maintenance", // 维护通知
]);

// 通知优先级枚举
export const notificationPriorityEnum = pgEnum("notification_priority", [
  "low",
  "normal",
  "high",
  "urgent",
]);

// 通知状态枚举
export const notificationStatusEnum = pgEnum("notification_status", [
  "draft", // 草稿
  "published", // 已发布
  "archived", // 已归档
]);

// 通知表
export const notification = pgTable("notification", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  type: notificationTypeEnum("type").notNull(),
  priority: notificationPriorityEnum("priority").default("normal").notNull(),
  status: notificationStatusEnum("status").default("published").notNull(),

  // 可选的链接和图标
  actionUrl: text("action_url"), // 点击通知后跳转的链接
  iconUrl: text("icon_url"), // 通知图标

  // 元数据
  metadata: json("metadata"), // 存储额外的通知数据，如GitHub PR信息等

  // 发送设置
  sendEmail: boolean("send_email").default(false), // 是否发送邮件
  sendPush: boolean("send_push").default(true), // 是否推送通知

  // 定时发送
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }), // 定时发送时间

  // 过期时间
  expiresAt: timestamp("expires_at", { withTimezone: true }), // 通知过期时间

  // 创建者
  createdBy: uuid("created_by").references(() => user.id),

  // 时间戳
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// 用户通知关联表（记录用户的通知状态）
export const userNotification = pgTable("user_notification", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .references(() => user.id, { onDelete: "cascade" })
    .notNull(),
  notificationId: uuid("notification_id")
    .references(() => notification.id, { onDelete: "cascade" })
    .notNull(),

  // 状态
  isRead: boolean("is_read").default(false).notNull(),
  isArchived: boolean("is_archived").default(false).notNull(),
  isFavorite: boolean("is_favorite").default(false).notNull(),

  // 时间戳
  readAt: timestamp("read_at", { withTimezone: true }),
  archivedAt: timestamp("archived_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// 通知统计表（用于统计通知的发送和阅读情况）
export const notificationStats = pgTable("notification_stats", {
  id: uuid("id").primaryKey().defaultRandom(),
  notificationId: uuid("notification_id")
    .references(() => notification.id, { onDelete: "cascade" })
    .notNull()
    .unique(),

  // 统计数据
  totalSent: integer("total_sent").default(0).notNull(),
  totalRead: integer("total_read").default(0).notNull(),
  totalClicked: integer("total_clicked").default(0).notNull(),

  // 时间戳
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// 关系定义
export const notificationRelations = relations(
  notification,
  ({ one, many }) => ({
    creator: one(user, {
      fields: [notification.createdBy],
      references: [user.id],
    }),
    userNotifications: many(userNotification),
    stats: one(notificationStats, {
      fields: [notification.id],
      references: [notificationStats.notificationId],
    }),
  }),
);

export const userNotificationRelations = relations(
  userNotification,
  ({ one }) => ({
    user: one(user, {
      fields: [userNotification.userId],
      references: [user.id],
    }),
    notification: one(notification, {
      fields: [userNotification.notificationId],
      references: [notification.id],
    }),
  }),
);

export const notificationStatsRelations = relations(
  notificationStats,
  ({ one }) => ({
    notification: one(notification, {
      fields: [notificationStats.notificationId],
      references: [notification.id],
    }),
  }),
);

// 类型导出
export type Notification = typeof notification.$inferSelect;
export type NewNotification = typeof notification.$inferInsert;
export type UserNotification = typeof userNotification.$inferSelect;
export type NewUserNotification = typeof userNotification.$inferInsert;
export type NotificationStats = typeof notificationStats.$inferSelect;
export type NewNotificationStats = typeof notificationStats.$inferInsert;

// 扩展类型
export interface NotificationWithStats extends Notification {
  stats?: NotificationStats;
  userNotification?: UserNotification;
}

export interface UserNotificationWithDetails extends UserNotification {
  notification: Notification;
}
