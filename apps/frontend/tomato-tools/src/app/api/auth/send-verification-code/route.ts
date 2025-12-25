import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createModuleLogger } from "@/lib/logger";
import { createClient } from "@/lib/supabase/server";

const log = createModuleLogger("api-auth-send-verification-code");

// 验证码请求验证schema
const sendCodeSchema = z.object({
  email: z.string().email("无效的邮箱地址"),
});

/**
 * POST /api/auth/send-verification-code
 * 使用 Supabase Email OTP 发送邮箱验证码
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = sendCodeSchema.parse(body);

    log.info("Sending Supabase Email OTP", { email });

    const supabase = await createClient();

    // 使用 Supabase 发送 Email OTP
    const { error } = await supabase.auth.updateUser({
      email,
    });

    if (error) {
      log.error("Failed to send Supabase Email OTP", {
        error: error.message,
        email,
      });
      let errorMessage = "发送验证码失败";
      if (error.message.includes("rate limit")) {
        errorMessage = "验证码发送过于频繁，请稍后再试";
      }
      if (error.message.includes("already been registered")) {
        errorMessage = "邮箱已存在";
      }
      throw new Error(errorMessage);
    }

    log.info("Supabase Email OTP sent successfully", { email });

    return NextResponse.json({
      success: true,
      message: "验证码已发送到您的邮箱",
    });
  } catch (error) {
    log.error("Failed to send verification code", { error });

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
        error: "发送验证码失败",
        details: error instanceof Error ? error.message : "未知错误",
      },
      { status: 500 },
    );
  }
}
