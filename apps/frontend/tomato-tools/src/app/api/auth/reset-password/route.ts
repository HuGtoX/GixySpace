import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/modules/auth/auth.service";
import { createRequestLogger, generateCorrelationId } from "@/lib/logger";
import { z } from "zod";

// 密码重置请求验证schema
const resetPasswordSchema = z.object({
  redirectUrl: z.string("Invalid redirect URL"),
  email: z.string("Invalid email format"),
});

// 更新密码请求验证schema
const updatePasswordSchema = z.object({
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
});

// 发送密码重置邮件
export async function POST(request: NextRequest) {
  const correlationId =
    request.headers.get("x-correlation-id") || generateCorrelationId();
  const logger = createRequestLogger(correlationId, "auth/reset-password");

  logger.info("Password reset request received");

  try {
    // 解析请求体
    const body = await request.json();

    // 验证请求数据
    const validationResult = resetPasswordSchema.safeParse(body);
    if (!validationResult.success) {
      logger.warn(
        { errors: validationResult.error.issues },
        "Invalid reset password data",
      );
      return NextResponse.json(
        {
          error: "Invalid input data",
          details: validationResult.error.issues,
        },
        { status: 400 },
      );
    }

    const { email, redirectUrl } = validationResult.data;

    // 创建认证服务实例
    const authService = new AuthService(correlationId);

    // 发送密码重置邮件
    const result = await authService.sendPasswordResetEmail({
      email,
      redirectUrl,
    });

    if (result.error) {
      logger.error(
        { error: result.error, email },
        "Password reset email failed",
      );
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    logger.info({ email }, "Password reset email sent successfully");

    return NextResponse.json(
      { message: "Password reset email sent successfully" },
      {
        status: 200,
        headers: {
          "x-correlation-id": correlationId,
        },
      },
    );
  } catch (error) {
    logger.error({ error }, "Password reset endpoint error");
    return NextResponse.json(
      { error: "Internal server error" },
      {
        status: 500,
        headers: {
          "x-correlation-id": correlationId,
        },
      },
    );
  }
}

// 更新密码
export async function PUT(request: NextRequest) {
  const correlationId =
    request.headers.get("x-correlation-id") || generateCorrelationId();
  const logger = createRequestLogger(correlationId, "auth/update-password");

  logger.info("Password update request received");

  try {
    // 解析请求体
    const body = await request.json();

    // 验证请求数据
    const validationResult = updatePasswordSchema.safeParse(body);
    if (!validationResult.success) {
      logger.warn(
        { errors: validationResult.error.issues },
        "Invalid update password data",
      );
      return NextResponse.json(
        {
          error: "Invalid input data",
          details: validationResult.error.issues,
        },
        { status: 400 },
      );
    }

    const { newPassword } = validationResult.data;

    // 创建认证服务实例
    const authService = new AuthService(correlationId);

    // 更新密码（使用当前session）
    const result = await authService.updatePasswordWithSession({ newPassword });

    if (result.error) {
      logger.error({ error: result.error }, "Password update failed");
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    logger.info("Password updated successfully");

    return NextResponse.json(
      { message: "Password updated successfully" },
      {
        status: 200,
        headers: {
          "x-correlation-id": correlationId,
        },
      },
    );
  } catch (error) {
    logger.error({ error }, "Password update endpoint error");
    return NextResponse.json(
      { error: "Internal server error" },
      {
        status: 500,
        headers: {
          "x-correlation-id": correlationId,
        },
      },
    );
  }
}
