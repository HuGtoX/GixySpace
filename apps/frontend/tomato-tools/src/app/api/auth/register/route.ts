import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/modules/auth/auth.service";
import { createRequestLogger, generateCorrelationId } from "@/lib/logger";
import { z } from "zod";

// 注册请求验证schema
const registerSchema = z.object({
  email: z.email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  fullName: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const correlationId =
    request.headers.get("x-correlation-id") || generateCorrelationId();
  const logger = createRequestLogger(correlationId, "auth/register");

  logger.info("Registration request received");

  try {
    // 解析请求体
    const body = await request.json();

    // 验证请求数据
    const validationResult = registerSchema.safeParse(body);
    if (!validationResult.success) {
      logger.warn(
        { errors: validationResult.error.issues },
        "Invalid registration data",
      );
      return NextResponse.json(
        {
          error: "Invalid input data",
          details: validationResult.error.issues,
        },
        { status: 400 },
      );
    }

    const { email, password, fullName } = validationResult.data;

    // 创建认证服务实例
    const authService = new AuthService(correlationId);
    logger.info("authService 创建成功");

    // 执行注册
    const result = await authService.register({
      email,
      password,
      fullName,
    });

    logger.info("执行注册响应成功");

    if (result.error) {
      logger.error({ error: result.error, email }, "Registration failed");

      // 检查是否是邮件发送相关的错误
      if (
        result.error.includes("email") ||
        result.error.includes("confirmation")
      ) {
        return NextResponse.json(
          { error: "Error sending confirmation email" },
          { status: 400 },
        );
      }

      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    logger.info(
      { email, userId: result.user?.id },
      "User registered successfully",
    );

    return NextResponse.json(
      {
        message: "Registration successful",
        user: {
          id: result.user?.id,
          email: result.user?.email,
          emailConfirmed: result.user?.email_confirmed_at !== null,
        },
      },
      {
        status: 201,
        headers: {
          "x-correlation-id": correlationId,
        },
      },
    );
  } catch (error) {
    logger.error({ error }, "Registration endpoint error");
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
