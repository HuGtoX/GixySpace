import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createModuleLogger } from "@/lib/logger";
import { createClient } from "@/lib/supabase/server";

const log = createModuleLogger("api-auth-verify-code");

// 验证码验证请求schema
const verifyCodeSchema = z.object({
  email: z.string().email("无效的邮箱地址"),
  code: z.string().min(6, "验证码至少需要6位"),
});

/**
 * POST /api/auth/verify-code
 * 验证邮箱验证码
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, code } = verifyCodeSchema.parse(body);

    log.info("Verifying email code", { email });

    const supabase = await createClient();

    // 使用 Supabase 验证 OTP
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: "email",
    });

    if (error) {
      log.error("Failed to verify email code", {
        error: error.message,
        email,
      });

      return NextResponse.json(
        {
          success: false,
          error: "验证码错误或已过期",
          details: error.message,
        },
        { status: 400 },
      );
    }

    log.info("Email code verified successfully", { email });

    return NextResponse.json({
      success: true,
      message: "验证码验证成功",
    });
  } catch (error) {
    log.error("Failed to verify code", { error });

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
        error: "验证失败",
        details: error instanceof Error ? error.message : "未知错误",
      },
      { status: 500 },
    );
  }
}
