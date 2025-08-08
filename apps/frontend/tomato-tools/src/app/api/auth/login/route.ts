import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/modules/auth/auth.service";
import { createRequestLogger, generateCorrelationId } from "@/lib/logger";
import { z } from "zod";

// 登录请求验证schema
const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

export async function POST(request: NextRequest) {
  const correlationId =
    request.headers.get("x-correlation-id") || generateCorrelationId();
  const logger = createRequestLogger(correlationId, "auth/login");

  logger.info("Login request received");

  try {
    // 解析请求体
    const body = await request.json();

    // 验证请求数据
    const validationResult = loginSchema.safeParse(body);
    if (!validationResult.success) {
      logger.warn(
        { errors: validationResult.error.issues },
        "Invalid login data",
      );
      return NextResponse.json(
        {
          error: "Invalid input data",
          details: validationResult.error.issues,
        },
        { status: 400 },
      );
    }

    const { email, password } = validationResult.data;

    // 获取客户端信息
    const ipAddress =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";

    // 创建认证服务实例
    const authService = new AuthService(correlationId);

    // 执行登录
    const result = await authService.login(
      { email, password },
      ipAddress,
      userAgent,
    );

    if (result.error) {
      logger.error({ error: result.error, email }, "Login failed");
      return NextResponse.json({ error: result.error }, { status: 401 });
    }

    logger.info(
      { email, userId: result.user?.id },
      "User logged in successfully",
    );

    const { user, session } = result;

    return NextResponse.json(
      {
        message: "Login successful",
        user: {
          id: user?.id,
          email: user?.email,
          emailConfirmed: user?.email_confirmed_at !== null,
        },
        session: {
          access_token: session?.access_token,
          refresh_token: session?.refresh_token,
          token_type: session?.token_type,
          expires_in: session?.expires_in,
          expires_at: session?.expires_at,
        },
      },
      {
        status: 200,
        headers: {
          "x-correlation-id": correlationId,
        },
      },
    );
  } catch (error) {
    logger.error({ error }, "Login endpoint error");
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
