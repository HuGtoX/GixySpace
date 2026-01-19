import { NextRequest, NextResponse } from "next/server";
import { AnonymousService } from "@/modules/auth/anonymous.service";
import { authorization } from "@/lib/api/authorization";
import { createModuleLogger, generateCorrelationId } from "@/lib/logger";
import { z } from "zod";

const logger = createModuleLogger("api-auth-convert");

const convertSchema = z.object({
  email: z.string().email("无效的邮箱地址"),
  password: z.string().min(6, "密码至少6个字符"),
  fullName: z.string().optional(),
});

/**
 * POST /api/auth/convert
 * 将匿名用户转换为正式用户（注册绑定）
 *
 * 流程：
 * 1. 验证当前用户是否为匿名用户
 * 2. 检查邮箱是否已被注册
 * 3. 更新Supabase Auth用户信息
 * 4. 更新本地数据库用户信息
 * 5. 所有数据自动保留（因为用户ID不变）
 */
export async function POST(request: NextRequest) {
  const correlationId = generateCorrelationId();

  try {
    // 验证用户登录
    const authUser = await authorization();

    logger.info({ userId: authUser.id }, "Starting anonymous user conversion");

    // 解析请求体
    const body = await request.json();
    const validatedData = convertSchema.parse(body);

    const anonymousService = new AnonymousService(correlationId);

    // 检查是否为匿名用户
    const isAnonymous = await anonymousService.isAnonymousUser(authUser.id);
    if (!isAnonymous) {
      logger.warn({ userId: authUser.id }, "User is not anonymous");
      return NextResponse.json(
        { error: "当前用户不是临时用户" },
        { status: 400 },
      );
    }

    logger.info(
      { userId: authUser.id, email: validatedData.email },
      "Converting anonymous user to regular user",
    );

    // 转换用户
    const result = await anonymousService.convertToRegularUser(
      authUser.id,
      validatedData.email,
      validatedData.password,
      validatedData.fullName,
    );

    if (!result.success) {
      logger.error(
        { error: result.error, userId: authUser.id },
        "Failed to convert anonymous user",
      );

      // 提供更友好的错误信息
      let errorMessage = result.error || "转换失败";
      if (
        result.error?.includes("already registered") ||
        result.error?.includes("already exists")
      ) {
        errorMessage = "该邮箱已被注册，请使用其他邮箱或选择登录绑定";
      }

      return NextResponse.json({ error: errorMessage }, { status: 500 });
    }

    logger.info(
      { userId: authUser.id, email: validatedData.email },
      "Anonymous user converted successfully, all data preserved",
    );

    return NextResponse.json(
      {
        success: true,
        message: "升级成功！请查收邮箱验证邮件",
        note: "您的所有数据已自动保留",
      },
      {
        status: 200,
        headers: {
          "x-correlation-id": correlationId,
        },
      },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    logger.error({ error }, "Convert anonymous user error");
    return NextResponse.json(
      { error: "服务器内部错误，请稍后重试" },
      { status: 500 },
    );
  }
}
