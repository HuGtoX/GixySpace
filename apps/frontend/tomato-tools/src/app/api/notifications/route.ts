import { NextRequest, NextResponse } from "next/server";
import { NotificationService } from "@/lib/services/notification";
import { createModuleLogger } from "@/lib/logger";
import { authorization } from "@/app/api/authorization";
import { z } from "zod";
const log = createModuleLogger("notification-api");

// 创建通知的验证schema
const createNotificationSchema = z.object({
  title: z.string().min(1, "标题不能为空").max(200, "标题不能超过200字符"),
  content: z.string().min(1, "内容不能为空").max(2000, "内容不能超过2000字符"),
  type: z.enum([
    "system",
    "github",
    "update",
    "security",
    "feature",
    "maintenance",
  ]),
  priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
  status: z.enum(["draft", "published", "archived"]).default("published"),
  actionUrl: z.string().url().optional().or(z.literal("")),
  iconUrl: z.string().url().optional().or(z.literal("")),
  metadata: z.record(z.any(), z.any()).optional(),
  sendEmail: z.boolean().default(false),
  sendPush: z.boolean().default(true),
  scheduledAt: z.string().datetime().optional(),
  expiresAt: z.string().datetime().optional(),
  sendToAll: z.boolean().default(true),
  userIds: z.array(z.string().uuid()).optional(),
});

// 更新通知的验证schema
const updateNotificationSchema = createNotificationSchema.partial();

// 查询参数验证schema
const querySchema = z.object({
  page: z.string().transform(Number).pipe(z.number().min(1)).default(1),
  pageSize: z
    .string()
    .transform(Number)
    .pipe(z.number().min(1).max(100))
    .default(20),
  type: z.string().optional(),
  status: z.string().optional(),
  isRead: z
    .string()
    .transform((val) => val === "true")
    .optional(),
});

/**
 * GET /api/notifications - 获取通知列表
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = querySchema.parse(Object.fromEntries(searchParams));

    log.info("Getting notifications", { query });

    const result = await NotificationService.getNotifications({
      page: query.page,
      pageSize: query.pageSize,
      type: query.type,
      status: query.status,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    log.error("Failed to get notifications", { error });

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "参数验证失败",
          details: error.message,
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "获取通知列表失败",
      },
      { status: 500 },
    );
  }
}

/**
 * POST /api/notifications - 创建通知
 */
export async function POST(request: NextRequest) {
  try {
    // 验证用户身份和管理员权限
    const user = await authorization();
    if (user.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          error: "权限不足，只有管理员才能创建通知",
        },
        { status: 403 },
      );
    }

    const body = await request.json();
    const validatedData = createNotificationSchema.parse(body);

    log.info("Creating notification", { title: validatedData.title });

    // 创建通知
    const notification = await NotificationService.createNotification({
      title: validatedData.title,
      content: validatedData.content,
      type: validatedData.type,
      priority: validatedData.priority,
      status: validatedData.status,
      actionUrl: validatedData.actionUrl || null,
      iconUrl: validatedData.iconUrl || null,
      metadata: validatedData.metadata || null,
      sendEmail: validatedData.sendEmail,
      sendPush: validatedData.sendPush,
      scheduledAt: validatedData.scheduledAt
        ? new Date(validatedData.scheduledAt)
        : null,
      expiresAt: validatedData.expiresAt
        ? new Date(validatedData.expiresAt)
        : null,
      createdBy: user.id,
    });

    // 发送通知给用户
    if (validatedData.status === "published") {
      if (validatedData.sendToAll) {
        await NotificationService.sendToAllUsers(notification.id);
      } else if (validatedData.userIds && validatedData.userIds.length > 0) {
        await NotificationService.sendToUsers(
          notification.id,
          validatedData.userIds,
        );
      }
    }

    return NextResponse.json({
      success: true,
      data: notification,
    });
  } catch (error) {
    log.error("Failed to create notification", { error });

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "参数验证失败",
          details: error.message,
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "创建通知失败",
      },
      { status: 500 },
    );
  }
}
