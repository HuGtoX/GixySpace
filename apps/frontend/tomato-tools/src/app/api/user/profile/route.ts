import { NextRequest, NextResponse } from "next/server";
import { authorization } from "@/app/api/authorization";
import { UserService } from "@/modules/user/user.service";
import { createRequestLogger, generateCorrelationId } from "@/lib/logger";
import { z } from "zod";

// 定义更新用户资料的schema
const updateProfileSchema = z.object({
  fullName: z.string().min(1, "姓名不能为空").optional(),
  bio: z.string().max(200, "个人简介不能超过200字").optional(),
  website: z.string().url("请输入有效的网址").optional().or(z.literal("")),
  location: z.string().max(100, "所在地不能超过100字").optional(),
});

export async function PUT(request: NextRequest) {
  const correlationId =
    request.headers.get("x-correlation-id") || generateCorrelationId();
  const logger = createRequestLogger(correlationId, "user/profile");

  logger.info("Update user profile request received");

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
    const validationResult = updateProfileSchema.safeParse(body);
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

    const data = validationResult.data;
    const userService = new UserService(correlationId);

    // 更新用户基本信息
    if (data.fullName !== undefined) {
      await userService.updateUser(user.id, {
        fullName: data.fullName,
      });
    }

    // 更新用户资料
    const profileData: any = {};
    if (data.bio !== undefined) profileData.bio = data.bio;
    if (data.website !== undefined) profileData.website = data.website || null;
    if (data.location !== undefined) profileData.location = data.location;

    if (Object.keys(profileData).length > 0) {
      await userService.updateUser(user.id, profileData);
    }

    logger.info({ userId: user.id }, "User profile updated successfully");

    return NextResponse.json(
      { message: "个人资料更新成功" },
      {
        status: 200,
        headers: {
          "x-correlation-id": correlationId,
        },
      },
    );
  } catch (error: any) {
    logger.error({ error }, "Update user profile error");
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
