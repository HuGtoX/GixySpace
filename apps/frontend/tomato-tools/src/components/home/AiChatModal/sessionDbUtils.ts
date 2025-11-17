import axios from "@/lib/axios";
import type { ChatSession, ChatMessage } from "@/types/ai-chat";
import type { ApiResponse } from "@/types";
import {
  type AiChatSession,
  type AiChatMessage,
} from "@/lib/drizzle/schema/schema";

// 生成会话标题
export function generateSessionTitle(messages: ChatMessage[]): string {
  const firstUserMessage = messages.find((msg) => msg.role === "user");
  if (firstUserMessage) {
    const content = firstUserMessage.content.trim();
    return content.length > 20 ? content.slice(0, 20) + "..." : content;
  }
  return "新对话";
}

/**
 * 从数据库获取用户的所有会话
 */
export async function fetchSessions(): Promise<ChatSession[]> {
  try {
    const response = await axios.get<any>("/api/ai-chat/sessions");
    if (response.success && response.sessions) {
      // 转换日期字符串为Date对象
      return response.sessions.map((session: AiChatSession) => ({
        ...session,
        createdAt: new Date(session.createdAt),
        updatedAt: new Date(session.updatedAt),
        messages: [], // 消息按需加载
      }));
    }
    return [];
  } catch (error) {
    console.error("获取会话列表失败:", error);
    return [];
  }
}

/**
 * 从数据库获取会话详情（包含消息）
 */
export async function fetchSessionWithMessages(
  sessionId: string,
): Promise<ChatSession | null> {
  try {
    const response = await axios.get<any>(`/api/ai-chat/sessions/${sessionId}`);
    if (response.success && response.session) {
      const session = response.session;
      return {
        ...session,
        createdAt: new Date(session.createdAt),
        updatedAt: new Date(session.updatedAt),
        messages: session.messages.map((msg: AiChatMessage) => ({
          id: msg.id,
          content: msg.content,
          role: msg.role,
          timestamp: new Date(msg.createdAt),
          metadata: msg.metadata,
        })),
      };
    }
    return null;
  } catch (error) {
    console.error("获取会话详情失败:", error);
    return null;
  }
}

/**
 * 创建新会话
 */
export async function createSession(
  model: string,
  isOnlineSearch: boolean = false,
): Promise<ChatSession | null> {
  try {
    const requestBody: any = {
      title: "新对话",
      model,
      isOnlineSearch,
    };
    const response = await axios.post<any>(
      "/api/ai-chat/sessions",
      requestBody,
    );
    if (response.success && response.session) {
      const session = response.session;
      return {
        ...session,
        createdAt: new Date(session.createdAt),
        updatedAt: new Date(session.updatedAt),
        messages: [],
      };
    }
    return null;
  } catch (error) {
    console.error("创建会话失败:", error);
    return null;
  }
}

/**
 * 更新会话信息
 */
export async function updateSession(
  sessionId: string,
  updates: any,
): Promise<boolean> {
  try {
    const response = await axios.patch<ApiResponse>(
      `/api/ai-chat/sessions/${sessionId}`,
      updates,
    );
    return true;
  } catch (error) {
    console.error("更新会话失败:", error);
    return false;
  }
}

/**
 * 删除会话
 */
export async function deleteSession(sessionId: string): Promise<boolean> {
  try {
    const response = await axios.delete<ApiResponse>(
      `/api/ai-chat/sessions/${sessionId}`,
    );
    return true;
  } catch (error) {
    console.error("删除会话失败:", error);
    return false;
  }
}

/**
 * 添加消息到会话
 */
export async function addMessage(
  sessionId: string,
  content: string,
  role: "user" | "assistant",
  metadata?: Record<string, any>,
): Promise<ChatMessage | null> {
  try {
    console.log("[sessionDbUtils] 开始添加消息:", {
      sessionId,
      role,
      contentLength: content.length,
    });
    const requestBody: any = {
      content,
      role,
      metadata,
    };
    const response = await axios.post<any>(
      `/api/ai-chat/sessions/${sessionId}/messages`,
      requestBody,
    );
    console.log("[sessionDbUtils] 添加消息响应:", {
      success: response.success,
      hasMessage: !!response.message,
    });
    if (response.success && response.message) {
      const msg = response.message;
      return {
        id: msg.id,
        content: msg.content,
        role: msg.role,
        timestamp: new Date(msg.createdAt),
        metadata: msg.metadata,
      };
    }
    console.warn(
      "[sessionDbUtils] 添加消息失败: response.success=false 或 response.message 为空",
    );
    return null;
  } catch (error) {
    console.error("[sessionDbUtils] 添加消息异常:", error);
    return null;
  }
}

// 本地存储的当前会话ID（用于记住用户最后选择的会话）
const CURRENT_SESSION_KEY = "ai-chat-current-session";

export function saveCurrentSessionId(sessionId: string | null): void {
  try {
    if (sessionId) {
      localStorage.setItem(CURRENT_SESSION_KEY, sessionId);
    } else {
      localStorage.removeItem(CURRENT_SESSION_KEY);
    }
  } catch (error) {
    console.error("保存当前会话ID失败:", error);
  }
}

export function loadCurrentSessionId(): string | null {
  try {
    return localStorage.getItem(CURRENT_SESSION_KEY);
  } catch (error) {
    console.error("加载当前会话ID失败:", error);
    return null;
  }
}

/**
 * 删除单条消息
 */
export async function deleteMessage(
  sessionId: string,
  messageId: string,
): Promise<boolean> {
  try {
    console.log("[sessionDbUtils] 开始删除消息:", {
      sessionId,
      messageId,
    });
    const response = await axios.delete<ApiResponse>(
      `/api/ai-chat/sessions/${sessionId}/messages/${messageId}`,
    );
    console.log("[sessionDbUtils] 删除消息响应:", {
      success: response,
    });
    return true;
  } catch (error) {
    console.error("[sessionDbUtils] 删除消息异常:", error);
    return false;
  }
}
