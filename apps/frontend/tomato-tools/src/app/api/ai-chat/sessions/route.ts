import { NextRequest, NextResponse } from "next/server";
import { createModuleLogger, generateCorrelationId } from "@/lib/logger";
import { AiChatService } from "@/modules/ai-chat/ai-chat.service";
import { AuthService } from "@/modules/auth/auth.service";
import type { ApiErrorResponse } from "@/types/api";

const log = createModuleLogger("api-ai-chat-sessions");

/**
 * GET /api/ai-chat/sessions
 * 获取用户的所有聊天会话
 */
export async function GET(request: NextRequest) {
  const correlationId = generateCorrelationId();
  const logger = log.child({ correlationId });

  try {
    // 验证用户身份
    const authService = new AuthService(correlationId);
    const { user, error } = await authService.getCurrentUser();

    if (error || !user) {
      logger.warn("Unauthorized access attempt");
      return NextResponse.json(
        { error: "Unauthorized" } satisfies ApiErrorResponse,
        { status: 401 },
      );
    }

    // 获取用户的所有会话
    const aiChatService = new AiChatService(correlationId);
    const sessions = await aiChatService.getUserSessions(user.id);

    return NextResponse.json(
      { success: true, sessions },
      {
        status: 200,
        headers: { "x-correlation-id": correlationId },
      },
    );
  } catch (error) {
    logger.error({ error }, "Failed to fetch chat sessions");
    return NextResponse.json(
      { error: "Failed to fetch chat sessions" } satisfies ApiErrorResponse,
      { status: 500 },
    );
  }
}

/**
 * POST /api/ai-chat/sessions
 * 创建新的聊天会话
 */
export async function POST(request: NextRequest) {
  const correlationId = generateCorrelationId();
  const logger = log.child({ correlationId });

  try {
    // 验证用户身份
    const authService = new AuthService(correlationId);
    const { user, error } = await authService.getCurrentUser();

    if (error || !user) {
      logger.warn("Unauthorized access attempt");
      return NextResponse.json(
        { error: "Unauthorized" } satisfies ApiErrorResponse,
        { status: 401 },
      );
    }

    // 解析请求体
    const body = await request.json();

    const { title, model, isOnlineSearch } = body;

    // 创建新会话
    const aiChatService = new AiChatService(correlationId);
    const session = await aiChatService.createSession({
      userId: user.id,
      title: title || "新对话",
      model,
      isOnlineSearch: isOnlineSearch || false,
    });

    if (!session) {
      return NextResponse.json(
        { error: "Failed to create session" } satisfies ApiErrorResponse,
        { status: 500 },
      );
    }

    return NextResponse.json(
      { success: true, session },
      {
        status: 201,
        headers: { "x-correlation-id": correlationId },
      },
    );
  } catch (error) {
    logger.error({ error }, "Failed to create chat session");
    return NextResponse.json(
      { error: "Failed to create chat session" } satisfies ApiErrorResponse,
      { status: 500 },
    );
  }
}
