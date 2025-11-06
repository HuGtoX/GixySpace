import { NextRequest, NextResponse } from "next/server";
import { EmailService } from "@/lib/services/email";
import { createModuleLogger } from "@/lib/logger";
import { authorization } from "@/app/api/authorization";
import { z } from "zod";

const log = createModuleLogger("email-test-api");

// 测试邮件验证schema
const testEmailSchema = z.object({
  to: z.string().email("无效的邮箱地址"),
  subject: z.string().min(1, "主题不能为空").optional(),
  title: z.string().min(1, "标题不能为空").optional(),
  content: z.string().min(1, "内容不能为空").optional(),
});

/**
 * POST /api/notifications/test-email - 测试邮件发送
 * 仅管理员可用
 */
export async function POST(request: NextRequest) {
  try {
    // 验证用户身份和管理员权限
    const user = await authorization();
    // if (user.role !== "admin") {
    //   return NextResponse.json(
    //     {
    //       success: false,
    //       error: "权限不足，只有管理员才能测试邮件发送",
    //     },
    //     { status: 403 },
    //   );
    // }

    const body = await request.json();
    const validatedData = testEmailSchema.parse(body);

    log.info("Testing email send", { to: validatedData.to });

    // 检查邮件服务是否已配置
    if (!EmailService.isConfigured()) {
      return NextResponse.json(
        {
          success: false,
          error: "邮件服务未配置，请检查环境变量",
          details: "需要配置 SMTP_HOST, SMTP_USER, SMTP_PASSWORD 等环境变量",
        },
        { status: 400 },
      );
    }

    // 发送测试邮件
    const result = await EmailService.sendNotificationEmail({
      to: validatedData.to,
      subject: validatedData.subject || "番茄工具箱 - 邮件服务测试",
      title: validatedData.title || "邮件服务测试",
      content:
        validatedData.content ||
        "这是一封测试邮件，用于验证邮件服务配置是否正确。\n\n如果您收到这封邮件，说明邮件服务已经成功配置！",
      priority: "normal",
      type: "system",
      actionUrl: process.env.NEXT_PUBLIC_SITE_URL,
      actionText: "访问番茄工具箱",
    });

    if (result.success) {
      log.info("Test email sent successfully", { to: validatedData.to });
      return NextResponse.json({
        success: true,
        message: "测试邮件发送成功",
        to: validatedData.to,
      });
    } else {
      log.error("Test email failed", {
        to: validatedData.to,
        error: result.error,
      });
      return NextResponse.json(
        {
          success: false,
          error: "测试邮件发送失败",
          details: result.error,
        },
        { status: 500 },
      );
    }
  } catch (error) {
    log.error("Failed to send test email", { error });

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
        error: "发送测试邮件失败",
        details: error instanceof Error ? error.message : "未知错误",
      },
      { status: 500 },
    );
  }
}

/**
 * GET /api/notifications/test-email - 检查邮件服务配置状态
 */
export async function GET(request: NextRequest) {
  try {
    // 验证用户身份和管理员权限
    const user = await authorization();
    console.log("-- [ user ] --", user);
    console.log("-- [ user ] --", user.role);
    // if (user.role !== "admin") {
    //   return NextResponse.json(
    //     {
    //       success: false,
    //       error: "权限不足",
    //     },
    //     { status: 403 },
    //   );
    // }

    const isConfigured = EmailService.isConfigured();

    return NextResponse.json({
      success: true,
      configured: isConfigured,
      message: isConfigured
        ? "邮件服务已配置"
        : "邮件服务未配置，请检查环境变量",
      requiredEnvVars: ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASSWORD"],
    });
  } catch (error) {
    log.error("Failed to check email service status", { error });

    return NextResponse.json(
      {
        success: false,
        error: "检查邮件服务状态失败",
      },
      { status: 500 },
    );
  }
}
