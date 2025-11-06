import { ChatSession, ChatMessage } from "./types";

// 生成唯一ID
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// 创建新会话
export function createNewSession(
  model: string,
  isOnlineSearch?: boolean,
): ChatSession {
  const now = new Date();
  return {
    id: generateId(),
    title: "新对话",
    messages: [],
    model,
    createdAt: now,
    updatedAt: now,
    isOnlineSearch: isOnlineSearch || false,
  };
}

// 更新会话
export function updateSession(
  sessions: ChatSession[],
  sessionId: string,
  updates: Partial<ChatSession>,
): ChatSession[] {
  return sessions.map((session) =>
    session.id === sessionId
      ? { ...session, ...updates, updatedAt: new Date() }
      : session,
  );
}

// 删除会话
export function deleteSession(
  sessions: ChatSession[],
  sessionId: string,
): ChatSession[] {
  return sessions.filter((session) => session.id !== sessionId);
}

// 添加消息到会话
export function addMessageToSession(
  sessions: ChatSession[],
  sessionId: string,
  message: ChatMessage,
): ChatSession[] {
  return updateSession(sessions, sessionId, {
    messages: [
      ...(sessions.find((s) => s.id === sessionId)?.messages || []),
      message,
    ],
  });
}

// 清空会话消息
export function clearSessionMessages(
  sessions: ChatSession[],
  sessionId: string,
): ChatSession[] {
  return updateSession(sessions, sessionId, {
    messages: [],
  });
}
