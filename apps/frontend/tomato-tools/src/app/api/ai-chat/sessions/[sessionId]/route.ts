import { NextRequest, NextResponse } from "next/server";
import { createModuleLogger, generateCorrelationId } from "@/lib/logger";
import { AiChatService } from "@/modules/ai-chat/ai-chat.service";
import { AuthService } from "@/modules/auth/auth.service";

const log = createModuleLogger("api-ai-chat-session");

/**
 * GET /api/ai-chat/sessions/[sessionId]
 * 获取会话详情（包含所有消息）
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

    // 获取会话详情
    const session = await aiChatService.getSessionWithMessages(sessionId);

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Session not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { success: true, session },
      {
        status: 200,
        headers: { "x-correlation-id": correlationId },
      },
    );
  } catch (error) {
    logger.error({ error }, "Failed to fetch session");
    return NextResponse.json(
      { success: false, error: "Failed to fetch session" },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/ai-chat/sessions/[sessionId]
 * 更新会话信息
 */
export async function PATCH(
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
    const { title, isOnlineSearch } = body;

    // 更新会话
    const updatedSession = await aiChatService.updateSession(sessionId, {
      title,
      isOnlineSearch,
    });

    if (!updatedSession) {
      return NextResponse.json(
        { success: false, error: "Failed to update session" },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { success: true, session: updatedSession },
      {
        status: 200,
        headers: { "x-correlation-id": correlationId },
      },
    );
  } catch (error) {
    logger.error({ error }, "Failed to update session");
    return NextResponse.json(
      { success: false, error: "Failed to update session" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/ai-chat/sessions/[sessionId]
 * 删除会话
 */
export async function DELETE(
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

    // 删除会话
    const success = await aiChatService.deleteSession(sessionId);

    if (!success) {
      return NextResponse.json(
        { success: false, error: "Failed to delete session" },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { success: true },
      {
        status: 200,
        headers: { "x-correlation-id": correlationId },
      },
    );
  } catch (error) {
    logger.error({ error }, "Failed to delete session");
    return NextResponse.json(
      { success: false, error: "Failed to delete session" },
      { status: 500 },
    );
  }
}
