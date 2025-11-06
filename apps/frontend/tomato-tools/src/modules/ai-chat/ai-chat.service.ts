import { createModuleLogger } from "@/lib/logger";
import { createDbClient } from "@/lib/drizzle/client";
import {
  aiChatSession,
  aiChatMessage,
  type NewAiChatSession,
  type NewAiChatMessage,
  type AiChatSession,
  type AiChatMessage,
  type AiChatSessionWithMessages,
} from "@/lib/drizzle/schema/schema";
import { eq, desc, and } from "drizzle-orm";

const log = createModuleLogger("ai-chat-service");

export class AiChatService {
  private dbClient;
  private logger;

  constructor(requestId?: string) {
    this.dbClient = createDbClient(requestId);
    this.logger = requestId ? log.child({ requestId }) : log;
  }

  /**
   * 创建新的聊天会话
   */
  async createSession(data: NewAiChatSession): Promise<AiChatSession | null> {
    try {
      this.logger.info({ userId: data.userId }, "Creating new chat session");

      const [session] = await this.dbClient.db
        .insert(aiChatSession)
        .values(data)
        .returning();

      this.logger.info(
        { sessionId: session.id, userId: data.userId },
        "Chat session created successfully",
      );

      return session;
    } catch (error) {
      this.logger.error(
        { error, userId: data.userId },
        "Failed to create chat session",
      );
      return null;
    }
  }

  /**
   * 获取用户的所有会话（按创建时间倒序）
   */
  async getUserSessions(userId: string): Promise<AiChatSession[]> {
    try {
      this.logger.debug({ userId }, "Fetching user chat sessions");

      const sessions = await this.dbClient.db
        .select()
        .from(aiChatSession)
        .where(eq(aiChatSession.userId, userId))
        .orderBy(desc(aiChatSession.createdAt));

      this.logger.info(
        { userId, count: sessions.length },
        "User chat sessions fetched successfully",
      );

      return sessions;
    } catch (error) {
      this.logger.error(
        { error, userId },
        "Failed to fetch user chat sessions",
      );
      return [];
    }
  }

  /**
   * 获取会话详情（包含所有消息）
   */
  async getSessionWithMessages(
    sessionId: string,
  ): Promise<AiChatSessionWithMessages | null> {
    try {
      this.logger.debug({ sessionId }, "Fetching session with messages");

      // 获取会话信息
      const [session] = await this.dbClient.db
        .select()
        .from(aiChatSession)
        .where(eq(aiChatSession.id, sessionId));

      if (!session) {
        this.logger.warn({ sessionId }, "Session not found");
        return null;
      }

      // 获取会话的所有消息
      const messages = await this.dbClient.db
        .select()
        .from(aiChatMessage)
        .where(eq(aiChatMessage.sessionId, sessionId))
        .orderBy(aiChatMessage.createdAt);

      this.logger.info(
        { sessionId, messageCount: messages.length },
        "Session with messages fetched successfully",
      );

      return {
        ...session,
        messages,
      };
    } catch (error) {
      this.logger.error(
        { error, sessionId },
        "Failed to fetch session with messages",
      );
      return null;
    }
  }

  /**
   * 更新会话信息
   */
  async updateSession(
    sessionId: string,
    data: Partial<Omit<AiChatSession, "id" | "userId" | "createdAt">>,
  ): Promise<AiChatSession | null> {
    try {
      this.logger.debug({ sessionId, data }, "Updating chat session");

      const [updatedSession] = await this.dbClient.db
        .update(aiChatSession)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(eq(aiChatSession.id, sessionId))
        .returning();

      if (!updatedSession) {
        this.logger.warn({ sessionId }, "Session not found for update");
        return null;
      }

      this.logger.info({ sessionId }, "Chat session updated successfully");

      return updatedSession;
    } catch (error) {
      this.logger.error({ error, sessionId }, "Failed to update chat session");
      return null;
    }
  }

  /**
   * 删除会话（会级联删除所有消息）
   */
  async deleteSession(sessionId: string): Promise<boolean> {
    try {
      this.logger.info({ sessionId }, "Deleting chat session");

      await this.dbClient.db
        .delete(aiChatSession)
        .where(eq(aiChatSession.id, sessionId));

      this.logger.info({ sessionId }, "Chat session deleted successfully");

      return true;
    } catch (error) {
      this.logger.error({ error, sessionId }, "Failed to delete chat session");
      return false;
    }
  }

  /**
   * 添加消息到会话
   */
  async addMessage(data: NewAiChatMessage): Promise<AiChatMessage | null> {
    try {
      this.logger.debug(
        { sessionId: data.sessionId, role: data.role },
        "Adding message to session",
      );

      const [message] = await this.dbClient.db
        .insert(aiChatMessage)
        .values(data)
        .returning();

      // 更新会话的 updatedAt 时间
      await this.dbClient.db
        .update(aiChatSession)
        .set({ updatedAt: new Date() })
        .where(eq(aiChatSession.id, data.sessionId));

      this.logger.info(
        { messageId: message.id, sessionId: data.sessionId },
        "Message added successfully",
      );

      return message;
    } catch (error) {
      this.logger.error(
        { error, sessionId: data.sessionId },
        "Failed to add message",
      );
      return null;
    }
  }

  /**
   * 批量添加消息（用于初始化或同步）
   */
  async addMessages(messages: NewAiChatMessage[]): Promise<AiChatMessage[]> {
    try {
      if (messages.length === 0) return [];

      this.logger.debug(
        { count: messages.length, sessionId: messages[0]?.sessionId },
        "Adding multiple messages to session",
      );

      const insertedMessages = await this.dbClient.db
        .insert(aiChatMessage)
        .values(messages)
        .returning();

      // 更新会话的 updatedAt 时间
      if (messages.length > 0) {
        await this.dbClient.db
          .update(aiChatSession)
          .set({ updatedAt: new Date() })
          .where(eq(aiChatSession.id, messages[0].sessionId));
      }

      this.logger.info(
        { count: insertedMessages.length, sessionId: messages[0]?.sessionId },
        "Multiple messages added successfully",
      );

      return insertedMessages;
    } catch (error) {
      this.logger.error(
        { error, count: messages.length },
        "Failed to add multiple messages",
      );
      return [];
    }
  }

  /**
   * 获取会话的消息列表
   */
  async getSessionMessages(sessionId: string): Promise<AiChatMessage[]> {
    try {
      this.logger.debug({ sessionId }, "Fetching session messages");

      const messages = await this.dbClient.db
        .select()
        .from(aiChatMessage)
        .where(eq(aiChatMessage.sessionId, sessionId))
        .orderBy(aiChatMessage.createdAt);

      this.logger.info(
        { sessionId, count: messages.length },
        "Session messages fetched successfully",
      );

      return messages;
    } catch (error) {
      this.logger.error(
        { error, sessionId },
        "Failed to fetch session messages",
      );
      return [];
    }
  }

  /**
   * 删除单条消息
   */
  async deleteMessage(messageId: string): Promise<boolean> {
    try {
      this.logger.info({ messageId }, "Deleting message");

      await this.dbClient.db
        .delete(aiChatMessage)
        .where(eq(aiChatMessage.id, messageId));

      this.logger.info({ messageId }, "Message deleted successfully");

      return true;
    } catch (error) {
      this.logger.error({ error, messageId }, "Failed to delete message");
      return false;
    }
  }

  /**
   * 检查消息是否属于用户（通过会话）
   */
  async isMessageOwnedByUser(
    messageId: string,
    userId: string,
  ): Promise<boolean> {
    try {
      const [result] = await this.dbClient.db
        .select({
          sessionUserId: aiChatSession.userId,
        })
        .from(aiChatMessage)
        .innerJoin(aiChatSession, eq(aiChatMessage.sessionId, aiChatSession.id))
        .where(eq(aiChatMessage.id, messageId));

      return result?.sessionUserId === userId;
    } catch (error) {
      this.logger.error(
        { error, messageId, userId },
        "Failed to check message ownership",
      );
      return false;
    }
  }

  /**
   * 检查会话是否属于用户
   */
  async isSessionOwnedByUser(
    sessionId: string,
    userId: string,
  ): Promise<boolean> {
    try {
      const [session] = await this.dbClient.db
        .select()
        .from(aiChatSession)
        .where(
          and(
            eq(aiChatSession.id, sessionId),
            eq(aiChatSession.userId, userId),
          ),
        );

      return !!session;
    } catch (error) {
      this.logger.error(
        { error, sessionId, userId },
        "Failed to check session ownership",
      );
      return false;
    }
  }
}
