import { NextRequest, NextResponse } from "next/server";
import { NotificationService } from "@/lib/services/notification";
import { createModuleLogger } from "@/lib/logger";
import { z } from "zod";

const log = createModuleLogger("user-notifications-api");

// 查询参数验证schema
const querySchema = z.object({
  page: z.string().transform(Number).pipe(z.number().min(1)).default(1),
  pageSize: z
    .string()
    .transform(Number)
    .pipe(z.number().min(1).max(100))
    .default(20),
  type: z.string().optional(),
  isRead: z
    .string()
    .transform((val) => val === "true")
    .optional(),
});

// 标记已读的验证schema
const markReadSchema = z.object({
  notificationId: z.string().uuid().optional(),
  markAll: z.boolean().default(false),
});

/**
 * GET /api/notifications/user/[userId] - 获取用户通知列表
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const { userId } = await params;
    const { searchParams } = new URL(request.url);
    const query = querySchema.parse(Object.fromEntries(searchParams));

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: "用户ID不能为空",
        },
        { status: 400 },
      );
    }

    log.info("Getting user notifications", { userId, query });

    const result = await NotificationService.getUserNotifications(userId, {
      page: query.page,
      pageSize: query.pageSize,
      type: query.type,
      isRead: query.isRead,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.log("-- [ error ] --", error);

    log.error("Failed to get user notifications", {
      error: error.message || error.toString() || String(error),
      stack: error.stack,
      userId: (await params).userId,
    });

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
        error: "获取用户通知失败",
      },
      { status: 500 },
    );
  }
}

/**
 * POST /api/notifications/user/[userId] - 标记通知为已读
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const { userId } = await params;
    const body = await request.json();
    const validatedData = markReadSchema.parse(body);

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: "用户ID不能为空",
        },
        { status: 400 },
      );
    }

    log.info("Marking notifications as read", { userId, data: validatedData });

    if (validatedData.markAll) {
      // 标记所有通知为已读
      await NotificationService.markAllAsRead(userId);
    } else if (validatedData.notificationId) {
      // 标记单个通知为已读
      await NotificationService.markAsRead(
        userId,
        validatedData.notificationId,
      );
    } else {
      return NextResponse.json(
        {
          success: false,
          error: "请指定要标记的通知ID或选择标记全部",
        },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "标记成功",
    });
  } catch (error: any) {
    log.error("Failed to mark notifications as read", {
      error: error.message || error.toString() || String(error),
      stack: error.stack,
      userId: (await params).userId,
    });

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
        error: "标记通知失败",
      },
      { status: 500 },
    );
  }
}
