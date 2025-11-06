/**
 * AI聊天相关类型定义
 * 统一管理所有AI聊天相关的类型，避免重复定义
 */

// 重新导出数据库类型作为基础类型
export type {
  AiChatSession as DbChatSession,
  NewAiChatSession as NewDbChatSession,
  AiChatMessage as DbChatMessage,
  NewAiChatMessage as NewDbChatMessage,
  AiChatSessionWithMessages as DbChatSessionWithMessages,
  AiChatSessionWithUser as DbChatSessionWithUser,
} from "@/lib/drizzle/schema/aiChat";

// 支持的AI模型类型
export type SupportedModels =
  | "deepseek-chat"
  | "deepseek-reasoner"
  | "deepseek-v3-huoshan"
  | "deepseek-r1-huoshan"
  | "deepseek-v3-baidu"
  | "deepseek-r1-baidu"
  | "deepseek-r1"
  | "deepseek-v3-aliyun"
  | "deepseek-r1-aliyun"
  | "deepseek-r1-302"
  | "deepseek-v3-302"
  | "deepseek-v3-0324"
  | "deepseek-r1-0528"
  | "deepseek-v3.1";

// 消息角色类型
export type MessageRole = "user" | "assistant";

// 前端使用的聊天消息类型（基于数据库类型扩展）
export interface ChatMessage {
  id: string;
  content: string;
  role: MessageRole;
  timestamp: Date; // 前端显示用的时间戳，映射自 createdAt
  metadata?: any; // 可选的元数据
}

// 前端使用的聊天会话类型（基于数据库类型扩展）
export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  model: string;
  createdAt: Date;
  updatedAt: Date;
  isOnlineSearch?: boolean;
}

// API相关类型
export interface ChatApiRequest {
  message: string;
  model: string;
  isOnlineSearch?: boolean;
  stream?: boolean; // 是否启用流式输出
  conversationHistory?: Array<{
    role: "user" | "assistant";
    content: string;
  }>; // 对话历史上下文
  maxContextMessages?: number; // 最大上下文消息数量
  systemPrompt?: string; // 系统提示词
}

export interface ChatApiResponse {
  success: boolean;
  content?: string;
  error?: string;
}

// 会话创建参数
export interface CreateSessionParams {
  title?: string;
  model: SupportedModels;
  isOnlineSearch?: boolean;
}

// 会话更新参数
export interface UpdateSessionParams {
  title?: string;
  isOnlineSearch?: boolean;
}

// 分页查询参数
export interface SessionQueryParams {
  page?: number;
  limit?: number;
  search?: string;
}

// 会话列表响应
export interface SessionListResponse {
  sessions: ChatSession[];
  total: number;
  page: number;
  limit: number;
}
