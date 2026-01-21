import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createRequestLogger, generateCorrelationId } from "@/lib/logger";

export async function GET(request: NextRequest) {
  const correlationId =
    request.headers.get("x-correlation-id") || generateCorrelationId();
  const logger = createRequestLogger(correlationId, "auth/callback");

  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";
  const type = searchParams.get("type"); // Supabase自动添加的认证类型参数
  if (code) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (!error) {
        // 判断是否为密码重置场景
        const isPasswordReset =
          next.includes("/auth/reset-password") || type === "recovery";

        if (isPasswordReset) {
          logger.info("Password reset code exchange successful");
        } else {
          logger.info("Email confirmation successful");
        }

        // 构建重定向URL，保留type参数
        let redirectUrl = `${next}?type=recovery`;
        const forwardedHost = request.headers.get("x-forwarded-host");
        const isLocalEnv = process.env.NODE_ENV === "development";

        if (isLocalEnv) {
          return NextResponse.redirect(`${origin}${redirectUrl}`);
        } else if (forwardedHost) {
          return NextResponse.redirect(
            `https://${forwardedHost}${redirectUrl}`,
          );
        } else {
          return NextResponse.redirect(`${origin}${redirectUrl}`);
        }
      } else {
        logger.error({ error: error.message }, "Email confirmation failed");
        return NextResponse.redirect(`${origin}/auth/auth-code-error`);
      }
    } catch (error) {
      logger.error({ error }, "Auth callback error");
      return NextResponse.redirect(`${origin}/auth/auth-code-error`);
    }
  }

  logger.warn("No auth code provided in callback");
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
