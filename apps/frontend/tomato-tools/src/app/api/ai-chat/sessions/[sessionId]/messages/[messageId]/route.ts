import { NextRequest, NextResponse } from "next/server";
import { createModuleLogger, generateCorrelationId } from "@/lib/logger";
import { AiChatService } from "@/modules/ai-chat/ai-chat.service";
import { AuthService } from "@/modules/auth/auth.service";

const log = createModuleLogger("api-ai-chat-message");

/**
 * DELETE /api/ai-chat/sessions/[sessionId]/messages/[messageId]
 * 删除单条消息
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string; messageId: string }> },
) {
  const correlationId = generateCorrelationId();
  const logger = log.child({ correlationId });

  try {
    const { sessionId, messageId } = await params;

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

    // 检查消息所有权（通过会话）
    const aiChatService = new AiChatService(correlationId);
    const isOwner = await aiChatService.isMessageOwnedByUser(
      messageId,
      user.id,
    );

    if (!isOwner) {
      logger.warn({ messageId, userId: user.id }, "Access denied to message");
      return NextResponse.json(
        { success: false, error: "Access denied" },
        { status: 403 },
      );
    }

    // 删除消息
    const success = await aiChatService.deleteMessage(messageId);

    if (!success) {
      return NextResponse.json(
        { success: false, error: "Failed to delete message" },
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
    logger.error({ error }, "Failed to delete message");
    return NextResponse.json(
      { success: false, error: "Failed to delete message" },
      { status: 500 },
    );
  }
}
