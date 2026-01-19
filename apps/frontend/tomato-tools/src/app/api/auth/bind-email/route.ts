import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createModuleLogger } from "@/lib/logger";
import { authorization } from "@/lib/api/authorization";
import { AnonymousService } from "@/modules/auth/anonymous.service";
import { createClient } from "@/lib/clients/supabase/server";

const log = createModuleLogger("api-auth-bind-email");

// 绑定邮箱验证schema
const bindEmailSchema = z.object({
  email: z.string().email("无效的邮箱地址"),
  code: z.string().length(6, "验证码必须是6位数"),
  password: z.string().min(6, "密码至少需要6个字符"),
  fullName: z.string().optional(),
});

/**
 * POST /api/auth/bind-email
 * 绑定邮箱升级匿名用户
 *
 * 流程
 * 1. 验证当前用户是否为匿名用户
 * 2. 使用 Supabase 验证 Email OTP
 * 3. 将匿名用户转换为正式用户（绑定邮箱和密码）
 * 4. 保留原有数据（用户ID不变）
 */
export async function POST(request: NextRequest) {
  try {
    // 验证用户身份
    const currentUser = await authorization();

    if (!currentUser.is_anonymous) {
      return NextResponse.json(
        {
          success: false,
          error: "当前用户不是匿名用户",
        },
        { status: 400 },
      );
    }

    const body = await request.json();
    const { email, code, password, fullName } = bindEmailSchema.parse(body);

    log.info("Binding email to anonymous user", {
      userId: currentUser.id,
      email,
    });

    const supabase = await createClient();

    // 使用 Supabase 验证 Email OTP
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: code.toString(),
      type: "email",
    });

    if (verifyError) {
      log.warn("Invalid or expired OTP", { email, error: verifyError.message });
      return NextResponse.json(
        {
          success: false,
          error: "验证码无效或已过期",
          details: verifyError.message,
        },
        { status: 400 },
      );
    }

    // 转换为正式用户（绑定邮箱�?
    const anonymousService = new AnonymousService();
    const result = await anonymousService.convertToRegularUser(
      currentUser.id,
      email,
      password,
      fullName,
    );

    if (!result.success) {
      log.error("Failed to convert anonymous user", { error: result.error });
      return NextResponse.json(
        {
          success: false,
          error: result.error || "绑定邮箱失败",
        },
        { status: 500 },
      );
    }

    log.info("Email bound successfully", {
      userId: currentUser.id,
      email,
    });

    return NextResponse.json({
      success: true,
      message: "邮箱绑定成功！您的账号已升级为正式用户",
      note: "您的所有数据已自动保留",
    });
  } catch (error) {
    log.error("Failed to bind email", { error });

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
        error: "绑定邮箱失败",
        details: error instanceof Error ? error.message : "未知错误",
      },
      { status: 500 },
    );
  }
}
