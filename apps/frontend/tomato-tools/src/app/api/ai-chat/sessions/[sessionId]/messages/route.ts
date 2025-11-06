import { NextRequest, NextResponse } from "next/server";
import { createModuleLogger, generateCorrelationId } from "@/lib/logger";
import { AiChatService } from "@/modules/ai-chat/ai-chat.service";
import { AuthService } from "@/modules/auth/auth.service";

const log = createModuleLogger("api-ai-chat-messages");

/**
 * POST /api/ai-chat/sessions/[sessionId]/messages
 * 添加消息到会话
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const correlationId = generateCorrelationId();
  const logger = log.child({ correlationId });

  try {
    const { sessionId } = await params;

    // 验证用户身份
    const authService = new AuthService(correlationId);
    const { user, error } = await authService.getCurrentUser();

    if (error || !user) {
      logger.warn("Unauthorized access attempt");
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    // 检查会话所有权
    const aiChatService = new AiChatService(correlationId);
    const isOwner = await aiChatService.isSessionOwnedByUser(
      sessionId,
      user.id,
    );

    if (!isOwner) {
      logger.warn({ sessionId, userId: user.id }, "Access denied to session");
      return NextResponse.json(
        { success: false, error: "Access denied" },
        { status: 403 },
      );
    }

    // 解析请求体
    const body = await request.json();
    const { content, role, metadata } = body;

    if (!content || !role) {
      return NextResponse.json(
        { success: false, error: "Content and role are required" },
        { status: 400 },
      );
    }

    if (role !== "user" && role !== "assistant") {
      return NextResponse.json(
        { success: false, error: "Invalid role" },
        { status: 400 },
      );
    }

    // 添加消息
    const message = await aiChatService.addMessage({
      sessionId,
      content,
      role,
      metadata: metadata || null,
    });

    if (!message) {
      return NextResponse.json(
        { success: false, error: "Failed to add message" },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { success: true, message },
      {
        status: 201,
        headers: { "x-correlation-id": correlationId },
      },
    );
  } catch (error) {
    logger.error({ error }, "Failed to add message");
    return NextResponse.json(
      { success: false, error: "Failed to add message" },
      { status: 500 },
    );
  }
}

/**
 * GET /api/ai-chat/sessions/[sessionId]/messages
 * 获取会话的所有消息
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const correlationId = generateCorrelationId();
  const logger = log.child({ correlationId });

  try {
    const { sessionId } = await params;

    // 验证用户身份
    const authService = new AuthService(correlationId);
    const { user, error } = await authService.getCurrentUser();

    if (error || !user) {
      logger.warn("Unauthorized access attempt");
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    // 检查会话所有权
    const aiChatService = new AiChatService(correlationId);
    const isOwner = await aiChatService.isSessionOwnedByUser(
      sessionId,
      user.id,
    );

    if (!isOwner) {
      logger.warn({ sessionId, userId: user.id }, "Access denied to session");
      return NextResponse.json(
        { success: false, error: "Access denied" },
        { status: 403 },
      );
    }

    // 获取消息列表
    const messages = await aiChatService.getSessionMessages(sessionId);

    return NextResponse.json(
      { success: true, messages },
      {
        status: 200,
        headers: { "x-correlation-id": correlationId },
      },
    );
  } catch (error) {
    logger.error({ error }, "Failed to fetch messages");
    return NextResponse.json(
      { success: false, error: "Failed to fetch messages" },
      { status: 500 },
    );
  }
}
