import { NextRequest, NextResponse } from "next/server";
import { AnonymousService } from "@/modules/auth/anonymous.service";
import { createModuleLogger, generateCorrelationId } from "@/lib/logger";

const logger = createModuleLogger("api-auth-anonymous");

/**
 * POST /api/auth/anonymous
 * 创建匿名用户
 */
export async function POST(request: NextRequest) {
  const correlationId = generateCorrelationId();

  try {
    const anonymousService = new AnonymousService(correlationId);
    const result = await anonymousService.createAnonymousUser();

    if (result.error || !result.user) {
      logger.error({ error: result.error }, "Failed to create anonymous user");
      return NextResponse.json(
        { error: result.error || "Failed to create anonymous user" },
        { status: 500 },
      );
    }

    logger.info(
      { userId: result.user.id },
      "Anonymous user created successfully",
    );

    return NextResponse.json(
      {
        user: {
          id: result.user.id,
          isAnonymous: true,
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
    logger.error({ error }, "Create anonymous user error");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
