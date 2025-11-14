import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/modules/auth/auth.service";
import { UserService } from "@/modules/user/user.service";
import { createRequestLogger, generateCorrelationId } from "@/lib/logger";

export async function GET(request: NextRequest) {
  const correlationId =
    request.headers.get("x-correlation-id") || generateCorrelationId();
  const logger = createRequestLogger(correlationId, "auth/me");

  logger.info("Get current user request received");

  try {
    // 创建认证服务实例
    const authService = new AuthService(correlationId);
    const userService = new UserService(correlationId);

    // 获取当前用户或自动创建匿名用户
    const result = await authService.getCurrentUserOrAnonymous();

    if (result.error || !result.user) {
      logger.error({ error: result.error }, "Failed to get or create user");
      return NextResponse.json(
        { error: result.error || "Failed to get user" },
        { status: 500 },
      );
    }

    // 获取用户详细信息和配置
    const [userDetails, userProfile] = await Promise.all([
      userService.getUserById(result.user.id),
      userService.getUserProfile(result.user.id),
    ]);

    logger.info(
      { userId: result.user.id, isAnonymous: result.isAnonymous },
      "Current user retrieved successfully",
    );

    return NextResponse.json(
      {
        user: {
          id: result.user.id,
          email: result.user.email,
          emailConfirmed: result.user.email_confirmed_at !== null,
          fullName: userDetails?.fullName || null,
          avatarUrl: userDetails?.avatarUrl || null,
          role: userDetails?.role || "user",
          isActive: userDetails?.isActive ?? true,
          isAnonymous: userDetails?.isAnonymous ?? false,
          createdAt: userDetails?.createdAt || null,
          profile: userProfile
            ? {
                bio: userProfile.bio,
                website: userProfile.website,
                location: userProfile.location,
                preferences: userProfile.preferences
                  ? JSON.parse(userProfile.preferences)
                  : null,
              }
            : null,
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
    logger.error({ error }, "Get current user endpoint error");
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
