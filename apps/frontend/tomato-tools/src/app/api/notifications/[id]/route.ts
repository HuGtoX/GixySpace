import { NextRequest, NextResponse } from "next/server";
import { NotificationService } from "@/lib/services/notification";
import { createModuleLogger } from "@/lib/logger";
import { authorization } from "@/app/api/authorization";
import { z } from "zod";
const log = createModuleLogger("notification-detail-api");

// 更新通知的验证schema
const updateNotificationSchema = z.object({
  title: z
    .string()
    .min(1, "标题不能为空")
    .max(200, "标题不能超过200字符")
    .optional(),
  content: z
    .string()
    .min(1, "内容不能为空")
    .max(2000, "内容不能超过2000字符")
    .optional(),
  type: z
    .enum(["system", "github", "update", "security", "feature", "maintenance"])
    .optional(),
  priority: z.enum(["low", "normal", "high", "urgent"]).optional(),
  status: z.enum(["draft", "published", "archived"]).optional(),
  actionUrl: z.string().url().optional().or(z.literal("")),
  iconUrl: z.string().url().optional().or(z.literal("")),
  metadata: z.record(z.string(), z.any()).optional(),
  sendEmail: z.boolean().optional(),
  sendPush: z.boolean().optional(),
  scheduledAt: z.string().datetime().optional(),
  expiresAt: z.string().datetime().optional(),
});

/**
 * GET /api/notifications/[id] - 获取通知详情
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "通知ID不能为空",
        },
        { status: 400 },
      );
    }

    log.info("Getting notification detail", { id });

    const notification = await NotificationService.getNotificationById(id);

    if (!notification) {
      return NextResponse.json(
        {
          success: false,
          error: "通知不存在",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: notification,
    });
  } catch (error) {
    log.error("Failed to get notification detail", { error });

    return NextResponse.json(
      {
        success: false,
        error: "获取通知详情失败",
      },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/notifications/[id] - 更新通知
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // 验证用户身份和管理员权限
    const user = await authorization();
    if (user.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          error: "权限不足，只有管理员才能更新通知",
        },
        { status: 403 },
      );
    }

    const { id } = await params;
    const body = await request.json();
    const validatedData = updateNotificationSchema.parse(body);

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "通知ID不能为空",
        },
        { status: 400 },
      );
    }

    log.info("Updating notification", { id });

    // 检查通知是否存在
    const existingNotification =
      await NotificationService.getNotificationById(id);
    if (!existingNotification) {
      return NextResponse.json(
        {
          success: false,
          error: "通知不存在",
        },
        { status: 404 },
      );
    }

    // 更新通知
    const updateData: any = {};

    if (validatedData.title !== undefined)
      updateData.title = validatedData.title;
    if (validatedData.content !== undefined)
      updateData.content = validatedData.content;
    if (validatedData.type !== undefined) updateData.type = validatedData.type;
    if (validatedData.priority !== undefined)
      updateData.priority = validatedData.priority;
    if (validatedData.status !== undefined)
      updateData.status = validatedData.status;
    if (validatedData.actionUrl !== undefined)
      updateData.actionUrl = validatedData.actionUrl || null;
    if (validatedData.iconUrl !== undefined)
      updateData.iconUrl = validatedData.iconUrl || null;
    if (validatedData.metadata !== undefined)
      updateData.metadata = validatedData.metadata;
    if (validatedData.sendEmail !== undefined)
      updateData.sendEmail = validatedData.sendEmail;
    if (validatedData.sendPush !== undefined)
      updateData.sendPush = validatedData.sendPush;
    if (validatedData.scheduledAt !== undefined) {
      updateData.scheduledAt = validatedData.scheduledAt
        ? new Date(validatedData.scheduledAt)
        : null;
    }
    if (validatedData.expiresAt !== undefined) {
      updateData.expiresAt = validatedData.expiresAt
        ? new Date(validatedData.expiresAt)
        : null;
    }

    const updatedNotification = await NotificationService.updateNotification(
      id,
      updateData,
    );

    return NextResponse.json({
      success: true,
      data: updatedNotification,
    });
  } catch (error) {
    log.error("Failed to update notification", { error });

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
        error: "更新通知失败",
      },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/notifications/[id] - 删除通知
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // 验证用户身份和管理员权限
    const user = await authorization();
    if (user.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          error: "权限不足，只有管理员才能删除通知",
        },
        { status: 403 },
      );
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "通知ID不能为空",
        },
        { status: 400 },
      );
    }

    log.info("Deleting notification", { id });

    // 检查通知是否存在
    const existingNotification =
      await NotificationService.getNotificationById(id);
    if (!existingNotification) {
      return NextResponse.json(
        {
          success: false,
          error: "通知不存在",
        },
        { status: 404 },
      );
    }

    await NotificationService.deleteNotification(id);

    return NextResponse.json({
      success: true,
      message: "通知删除成功",
    });
  } catch (error) {
    log.error("Failed to delete notification", { error });

    return NextResponse.json(
      {
        success: false,
        error: "删除通知失败",
      },
      { status: 500 },
    );
  }
}
