import { eq, desc, and, count, sql, or, isNull } from "drizzle-orm";
import { db } from "@/lib/database/drizzle/client";
import {
  notification,
  userNotification,
  notificationStats,
  user,
  type Notification,
  type NewNotification,
  type NotificationWithStats,
  type UserNotificationWithDetails,
} from "@/lib/database/drizzle/schema/schema";
import { createModuleLogger } from "@/lib/logger";
import { EmailService } from "@/lib/services/email";

const log = createModuleLogger("notification-service");

export class NotificationService {
  /**
   * 创建通知
   */
  static async createNotification(
    data: NewNotification,
  ): Promise<Notification> {
    log.info("Creating notification", { title: data.title, type: data.type });

    const [newNotification] = await db
      .insert(notification)
      .values(data)
      .returning();

    // 创建统计记录
    await db.insert(notificationStats).values({
      notificationId: newNotification.id,
      totalSent: 0,
      totalRead: 0,
      totalClicked: 0,
    });

    log.info("Notification created successfully", { id: newNotification.id });
    return newNotification;
  }

  /**
   * 获取通知列表（管理员用）
   */
  static async getNotifications(
    params: {
      page?: number;
      pageSize?: number;
      type?: string;
      status?: string;
    } = {},
  ): Promise<{
    notifications: NotificationWithStats[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const { page = 1, pageSize = 20, type, status } = params;
    const offset = (page - 1) * pageSize;

    // 构建查询条件
    const conditions = [];
    if (type) {
      conditions.push(eq(notification.type, type as any));
    }
    if (status) {
      conditions.push(eq(notification.status, status as any));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // 获取通知列表
    const notifications = await db
      .select({
        id: notification.id,
        title: notification.title,
        content: notification.content,
        type: notification.type,
        priority: notification.priority,
        status: notification.status,
        actionUrl: notification.actionUrl,
        iconUrl: notification.iconUrl,
        metadata: notification.metadata,
        sendEmail: notification.sendEmail,
        sendPush: notification.sendPush,
        scheduledAt: notification.scheduledAt,
        expiresAt: notification.expiresAt,
        createdBy: notification.createdBy,
        createdAt: notification.createdAt,
        updatedAt: notification.updatedAt,
        stats: {
          totalSent: notificationStats.totalSent,
          totalRead: notificationStats.totalRead,
          totalClicked: notificationStats.totalClicked,
        },
      })
      .from(notification)
      .leftJoin(
        notificationStats,
        eq(notification.id, notificationStats.notificationId),
      )
      .where(whereClause)
      .orderBy(desc(notification.createdAt))
      .limit(pageSize)
      .offset(offset);

    // 获取总数
    const [{ total }] = await db
      .select({ total: count() })
      .from(notification)
      .where(whereClause);

    return {
      notifications: notifications as NotificationWithStats[],
      total,
      page,
      pageSize,
    };
  }

  /**
   * 获取用户通知列表
   */
  static async getUserNotifications(
    userId: string,
    params: {
      page?: number;
      pageSize?: number;
      isRead?: boolean;
      type?: string;
    } = {},
  ): Promise<{
    notifications: UserNotificationWithDetails[];
    total: number;
    unreadCount: number;
    page: number;
    pageSize: number;
  }> {
    const { page = 1, pageSize = 20, isRead, type } = params;
    const offset = (page - 1) * pageSize;

    // 构建查询条件
    const conditions = [eq(userNotification.userId, userId)];

    if (isRead !== undefined) {
      conditions.push(eq(userNotification.isRead, isRead));
    }
    if (type) {
      conditions.push(eq(notification.type, type as any));
    }

    // 添加通知状态和过期时间的条件
    conditions.push(eq(notification.status, "published"));
    conditions.push(
      or(
        isNull(notification.expiresAt),
        sql`${notification.expiresAt} > NOW()`,
      )!,
    );

    const whereClause = and(...conditions);

    // 获取用户通知列表
    const notifications = await db
      .select({
        id: userNotification.id,
        userId: userNotification.userId,
        notificationId: userNotification.notificationId,
        isRead: userNotification.isRead,
        isArchived: userNotification.isArchived,
        isFavorite: userNotification.isFavorite,
        readAt: userNotification.readAt,
        archivedAt: userNotification.archivedAt,
        createdAt: userNotification.createdAt,
        notification: {
          id: notification.id,
          title: notification.title,
          content: notification.content,
          type: notification.type,
          priority: notification.priority,
          actionUrl: notification.actionUrl,
          iconUrl: notification.iconUrl,
          metadata: notification.metadata,
          createdAt: notification.createdAt,
        },
      })
      .from(userNotification)
      .innerJoin(
        notification,
        eq(userNotification.notificationId, notification.id),
      )
      .where(whereClause)
      .orderBy(desc(userNotification.createdAt))
      .limit(pageSize)
      .offset(offset);

    // 获取总数
    const [{ total }] = await db
      .select({ total: count() })
      .from(userNotification)
      .innerJoin(
        notification,
        eq(userNotification.notificationId, notification.id),
      )
      .where(whereClause);

    // 获取未读数量
    const [{ unreadCount }] = await db
      .select({ unreadCount: count() })
      .from(userNotification)
      .innerJoin(
        notification,
        eq(userNotification.notificationId, notification.id),
      )
      .where(
        and(
          eq(userNotification.userId, userId),
          eq(userNotification.isRead, false),
          eq(notification.status, "published"),
          or(
            isNull(notification.expiresAt),
            sql`${notification.expiresAt} > NOW()`!,
          ),
        ),
      );

    return {
      notifications: notifications as UserNotificationWithDetails[],
      total,
      unreadCount,
      page,
      pageSize,
    };
  }

  /**
   * 标记通知为已读
   */
  static async markAsRead(
    userId: string,
    notificationId: string,
  ): Promise<void> {
    log.info("Marking notification as read", { userId, notificationId });

    await db
      .update(userNotification)
      .set({
        isRead: true,
        readAt: new Date(),
      })
      .where(
        and(
          eq(userNotification.userId, userId),
          eq(userNotification.notificationId, notificationId),
        ),
      );

    // 更新统计
    await this.updateNotificationStats(notificationId, "read");
  }

  /**
   * 批量标记为已读
   */
  static async markAllAsRead(userId: string): Promise<void> {
    log.info("Marking all notifications as read", { userId });

    const unreadNotifications = await db
      .select({ notificationId: userNotification.notificationId })
      .from(userNotification)
      .where(
        and(
          eq(userNotification.userId, userId),
          eq(userNotification.isRead, false),
        ),
      );

    if (unreadNotifications.length === 0) return;

    await db
      .update(userNotification)
      .set({
        isRead: true,
        readAt: new Date(),
      })
      .where(
        and(
          eq(userNotification.userId, userId),
          eq(userNotification.isRead, false),
        ),
      );

    // 批量更新统计
    for (const { notificationId } of unreadNotifications) {
      await this.updateNotificationStats(notificationId, "read");
    }
  }

  /**
   * 发送通知给所有用户
   */
  static async sendToAllUsers(notificationId: string): Promise<void> {
    log.info("Sending notification to all users", { notificationId });

    // 获取通知详情
    const notificationData = await this.getNotificationById(notificationId);
    if (!notificationData) {
      log.error("Notification not found", { notificationId });
      return;
    }

    // 获取所有活跃用户
    const users = await db
      .select({
        id: user.id,
        email: user.email,
        fullName: user.fullName,
      })
      .from(user)
      .where(eq(user.isActive, true));

    // 批量创建用户通知记录
    const userNotifications = users.map((u) => ({
      userId: u.id,
      notificationId,
    }));

    if (userNotifications.length > 0) {
      await db.insert(userNotification).values(userNotifications);

      // 更新发送统计
      await db
        .update(notificationStats)
        .set({
          totalSent: sql`${notificationStats.totalSent} + ${userNotifications.length}`,
        })
        .where(eq(notificationStats.notificationId, notificationId));

      // 如果需要发送邮件
      if (notificationData.sendEmail) {
        await this.sendEmailsToUsers(notificationData, users);
      }
    }

    log.info("Notification sent to all users", {
      notificationId,
      userCount: userNotifications.length,
    });
  }

  /**
   * 发送通知给特定用户
   */
  static async sendToUsers(
    notificationId: string,
    userIds: string[],
  ): Promise<void> {
    log.info("Sending notification to specific users", {
      notificationId,
      userIds,
    });

    // 获取通知详情
    const notificationData = await this.getNotificationById(notificationId);
    if (!notificationData) {
      log.error("Notification not found", { notificationId });
      return;
    }

    const userNotifications = userIds.map((userId) => ({
      userId,
      notificationId,
    }));

    await db.insert(userNotification).values(userNotifications);

    // 更新发送统计
    await db
      .update(notificationStats)
      .set({
        totalSent: sql`${notificationStats.totalSent} + ${userIds.length}`,
      })
      .where(eq(notificationStats.notificationId, notificationId));

    // 如果需要发送邮件
    if (notificationData.sendEmail) {
      // 获取用户信息
      const users = await db
        .select({
          id: user.id,
          email: user.email,
          fullName: user.fullName,
        })
        .from(user)
        .where(sql`${user.id} = ANY(${userIds})`);

      await this.sendEmailsToUsers(notificationData, users);
    }

    log.info("Notification sent to users", {
      notificationId,
      userCount: userIds.length,
    });
  }

  /**
   * 更新通知统计
   */
  private static async updateNotificationStats(
    notificationId: string,
    action: "read" | "click",
  ): Promise<void> {
    const field = action === "read" ? "totalRead" : "totalClicked";

    await db
      .update(notificationStats)
      .set({
        [field]: sql`${notificationStats[field]} + 1`,
      })
      .where(eq(notificationStats.notificationId, notificationId));
  }

  /**
   * 删除通知
   */
  static async deleteNotification(id: string): Promise<void> {
    log.info("Deleting notification", { id });

    await db.delete(notification).where(eq(notification.id, id));

    log.info("Notification deleted successfully", { id });
  }

  /**
   * 更新通知
   */
  static async updateNotification(
    id: string,
    data: Partial<NewNotification>,
  ): Promise<Notification> {
    log.info("Updating notification", { id });

    const [updatedNotification] = await db
      .update(notification)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(notification.id, id))
      .returning();

    log.info("Notification updated successfully", { id });
    return updatedNotification;
  }

  /**
   * 获取通知详情
   */
  static async getNotificationById(
    id: string,
  ): Promise<NotificationWithStats | null> {
    const result = await db
      .select({
        id: notification.id,
        title: notification.title,
        content: notification.content,
        type: notification.type,
        priority: notification.priority,
        status: notification.status,
        actionUrl: notification.actionUrl,
        iconUrl: notification.iconUrl,
        metadata: notification.metadata,
        sendEmail: notification.sendEmail,
        sendPush: notification.sendPush,
        scheduledAt: notification.scheduledAt,
        expiresAt: notification.expiresAt,
        createdBy: notification.createdBy,
        createdAt: notification.createdAt,
        updatedAt: notification.updatedAt,
        stats: {
          totalSent: notificationStats.totalSent,
          totalRead: notificationStats.totalRead,
          totalClicked: notificationStats.totalClicked,
        },
      })
      .from(notification)
      .leftJoin(
        notificationStats,
        eq(notification.id, notificationStats.notificationId),
      )
      .where(eq(notification.id, id))
      .limit(1);

    return (result[0] as NotificationWithStats) || null;
  }

  /**
   * 发送邮件给用户列表
   */
  private static async sendEmailsToUsers(
    notificationData: NotificationWithStats,
    users: Array<{ id: string; email: string | null; fullName: string | null }>,
  ): Promise<void> {
    log.info("Sending notification emails", {
      notificationId: notificationData.id,
      userCount: users.length,
    });

    // 过滤出有邮箱的用户
    const usersWithEmail = users.filter((u) => u.email);

    if (usersWithEmail.length === 0) {
      log.warn("No users with email found");
      return;
    }

    // 构建邮件数据
    const emailData = usersWithEmail.map((u) => ({
      to: u.email!,
      subject: `[${this.getTypeLabel(notificationData.type)}] ${notificationData.title}`,
      title: notificationData.title,
      content: notificationData.content,
      actionUrl: notificationData.actionUrl || undefined,
      actionText: "查看详情",
      priority: notificationData.priority,
      type: notificationData.type,
    }));

    // 批量发送邮件
    const result = await EmailService.sendBatchNotificationEmails(emailData);

    log.info("Notification emails sent", {
      notificationId: notificationData.id,
      total: usersWithEmail.length,
      success: result.successCount,
      failed: result.failCount,
    });

    if (result.errors.length > 0) {
      log.error("Some emails failed to send", { errors: result.errors });
    }
  }

  /**
   * 获取通知类型标签
   */
  private static getTypeLabel(type: string): string {
    const typeLabels: Record<string, string> = {
      system: "系统通知",
      github: "GitHub",
      update: "更新通知",
      security: "安全通知",
      feature: "功能通知",
      maintenance: "维护通知",
    };
    return typeLabels[type] || "通知";
  }
}
