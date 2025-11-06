/**
 * AI聊天Modal组件相关类型定义
 * 重新导出统一的类型定义，避免重复定义
 */

// 重新导出统一的AI聊天类型
export type {
  ChatMessage,
  ChatSession,
  SupportedModels,
  ChatApiRequest,
  ChatApiResponse,
  CreateSessionParams,
  UpdateSessionParams,
  MessageRole,
} from "@/types/ai-chat";

// AI聊天Modal组件属性
export interface AiChatModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  model?: string;
  width?: number;
  height?: number;
}
