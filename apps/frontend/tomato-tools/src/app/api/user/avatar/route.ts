import { NextRequest, NextResponse } from "next/server";
import { authorization } from "@/app/api/authorization";
import { UserService } from "@/modules/user/user.service";
import { createRequestLogger, generateCorrelationId } from "@/lib/logger";
import { z } from "zod";

// 定义更新头像的schema
const updateAvatarSchema = z.object({
  avatarUrl: z.string().min(1, "头像URL不能为空"),
  isSystemAvatar: z.boolean().default(false),
});

export async function PUT(request: NextRequest) {
  const correlationId =
    request.headers.get("x-correlation-id") || generateCorrelationId();
  const logger = createRequestLogger(correlationId, "user/avatar");

  logger.info("Update user avatar request received");

  try {
    // 验证用户身份
    const user = await authorization();

    if (!user) {
      logger.warn("Unauthorized access attempt");
      return NextResponse.json({ error: "未授权访问" }, { status: 401 });
    }

    // 解析请求体
    const body = await request.json();

    // 验证数据
    const validationResult = updateAvatarSchema.safeParse(body);
    if (!validationResult.success) {
      logger.warn(
        { errors: validationResult.error.message },
        "Validation failed",
      );
      return NextResponse.json(
        { error: "数据验证失败", details: validationResult.error.message },
        { status: 400 },
      );
    }

    const { avatarUrl, isSystemAvatar } = validationResult.data;
    const userService = new UserService(correlationId);

    // 如果是系统头像，直接使用URL
    // 如果是自定义头像（base64），这里可以选择：
    // 1. 直接存储base64（简单但数据库占用大）
    // 2. 上传到对象存储服务（推荐，但需要配置）

    // 这里我们先使用简单方案，直接存储
    // 在生产环境中，建议上传到Supabase Storage或其他对象存储服务

    await userService.updateUser(user.id, {
      avatarUrl: avatarUrl,
    });

    logger.info(
      { userId: user.id, isSystemAvatar },
      "User avatar updated successfully",
    );

    return NextResponse.json(
      {
        message: "头像更新成功",
        avatarUrl: avatarUrl,
      },
      {
        status: 200,
        headers: {
          "x-correlation-id": correlationId,
        },
      },
    );
  } catch (error: any) {
    logger.error({ error }, "Update user avatar error");
    return NextResponse.json(
      { error: error.message || "更新失败" },
      {
        status: 500,
        headers: {
          "x-correlation-id": correlationId,
        },
      },
    );
  }
}
