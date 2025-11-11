/**
 * AI对话上下文记忆管理工具
 * 提供智能的对话历史管理、记忆优化和检索功能
 */

import type { ChatMessage } from "@/types/ai-chat";

/**
 * 上下文记忆配置
 */
export interface ContextMemoryConfig {
  /** 最大上下文消息数量 */
  maxMessages?: number;
  /** 最大token数量（估算） */
  maxTokens?: number;
  /** 是否启用智能摘要 */
  enableSummary?: boolean;
  /** 是否保留系统消息 */
  keepSystemMessages?: boolean;
}

/**
 * 记忆统计信息
 */
export interface MemoryStats {
  /** 总消息数 */
  totalMessages: number;
  /** 用户消息数 */
  userMessages: number;
  /** 助手消息数 */
  assistantMessages: number;
  /** 估算的token数量 */
  estimatedTokens: number;
  /** 最早消息时间 */
  earliestMessageTime?: Date;
  /** 最新消息时间 */
  latestMessageTime?: Date;
}

/**
 * 上下文记忆管理器
 */
export class ContextMemoryManager {
  private config: Required<ContextMemoryConfig>;

  constructor(config: ContextMemoryConfig = {}) {
    this.config = {
      maxMessages: config.maxMessages ?? 20,
      maxTokens: config.maxTokens ?? 4000,
      enableSummary: config.enableSummary ?? false,
      keepSystemMessages: config.keepSystemMessages ?? true,
    };
  }

  /**
   * 估算文本的token数量（简单估算：中文1字≈1.5token，英文1词≈1token）
   */
  private estimateTokens(text: string): number {
    // 统计中文字符
    const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
    // 统计英文单词（简单按空格分割）
    const englishWords = text
      .replace(/[\u4e00-\u9fa5]/g, "")
      .split(/\s+/)
      .filter((w) => w.length > 0).length;

    return Math.ceil(chineseChars * 1.5 + englishWords);
  }

  /**
   * 计算消息列表的统计信息
   */
  public getMemoryStats(messages: ChatMessage[]): MemoryStats {
    const stats: MemoryStats = {
      totalMessages: messages.length,
      userMessages: 0,
      assistantMessages: 0,
      estimatedTokens: 0,
    };

    messages.forEach((msg) => {
      if (msg.role === "user") stats.userMessages++;
      if (msg.role === "assistant") stats.assistantMessages++;
      stats.estimatedTokens += this.estimateTokens(msg.content);
    });

    if (messages.length > 0) {
      stats.earliestMessageTime = messages[0].timestamp;
      stats.latestMessageTime = messages[messages.length - 1].timestamp;
    }

    return stats;
  }

  /**
   * 优化上下文消息列表
   * 根据配置限制消息数量和token数量
   */
  public optimizeContext(messages: ChatMessage[]): ChatMessage[] {
    if (messages.length === 0) return [];

    // 1. 按消息数量限制
    const optimized = messages.slice(-this.config.maxMessages);

    // 2. 按token数量限制
    let totalTokens = 0;
    const tokenLimitedMessages: ChatMessage[] = [];

    // 从最新的消息开始往前累加
    for (let i = optimized.length - 1; i >= 0; i--) {
      const msg = optimized[i];
      const msgTokens = this.estimateTokens(msg.content);

      if (totalTokens + msgTokens <= this.config.maxTokens) {
        tokenLimitedMessages.unshift(msg);
        totalTokens += msgTokens;
      } else {
        break;
      }
    }

    // 3. 确保对话完整性（保持用户-助手配对）
    const balanced = this.balanceConversation(tokenLimitedMessages);

    return balanced;
  }

  /**
   * 平衡对话，确保用户消息和助手回复成对出现
   */
  private balanceConversation(messages: ChatMessage[]): ChatMessage[] {
    if (messages.length === 0) return [];

    const balanced: ChatMessage[] = [];
    let expectingRole: "user" | "assistant" = "user";

    for (const msg of messages) {
      if (msg.role === expectingRole) {
        balanced.push(msg);
        expectingRole = expectingRole === "user" ? "assistant" : "user";
      } else if (balanced.length > 0) {
        // 如果角色不匹配，但已有消息，则添加（允许连续的同角色消息）
        balanced.push(msg);
      }
    }

    // 如果最后一条是用户消息但没有助手回复，保留它
    // 如果最后一条是助手消息但没有后续用户消息，也保留
    return balanced;
  }

  /**
   * 构建API请求的上下文历史
   * 将ChatMessage转换为API所需的格式
   */
  public buildContextHistory(
    messages: ChatMessage[],
  ): Array<{ role: "user" | "assistant"; content: string }> {
    const optimized = this.optimizeContext(messages);
    return optimized.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));
  }

  /**
   * 生成对话摘要（用于长期记忆）
   * 简单实现：提取关键信息
   */
  public generateSummary(messages: ChatMessage[]): string {
    if (messages.length === 0) return "";

    const userMessages = messages.filter((m) => m.role === "user");
    const assistantMessages = messages.filter((m) => m.role === "assistant");

    const summary = [
      `对话包含 ${messages.length} 条消息`,
      `用户提问 ${userMessages.length} 次`,
      `AI回复 ${assistantMessages.length} 次`,
    ];

    // 提取第一个和最后一个用户问题
    if (userMessages.length > 0) {
      const firstQuestion = userMessages[0].content.substring(0, 50);
      summary.push(`首个问题: ${firstQuestion}...`);

      if (userMessages.length > 1) {
        const lastQuestion = userMessages[
          userMessages.length - 1
        ].content.substring(0, 50);
        summary.push(`最后问题: ${lastQuestion}...`);
      }
    }

    return summary.join("\n");
  }

  /**
   * 搜索相关记忆
   * 根据关键词在历史消息中搜索相关内容
   */
  public searchRelevantMemories(
    messages: ChatMessage[],
    keywords: string[],
    limit: number = 5,
  ): ChatMessage[] {
    if (keywords.length === 0) return [];

    // 计算每条消息的相关性分数
    const scored = messages.map((msg) => {
      let score = 0;
      const content = msg.content.toLowerCase();

      keywords.forEach((keyword) => {
        const lowerKeyword = keyword.toLowerCase();
        // 计算关键词出现次数
        const matches = content.split(lowerKeyword).length - 1;
        score += matches;
      });

      return { message: msg, score };
    });

    // 按分数排序并返回前N条
    return scored
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((item) => item.message);
  }

  /**
   * 提取对话中的关键词
   */
  public extractKeywords(text: string, limit: number = 5): string[] {
    // 简单实现：分词并过滤常见词
    const commonWords = new Set([
      "的",
      "了",
      "是",
      "在",
      "我",
      "有",
      "和",
      "就",
      "不",
      "人",
      "都",
      "一",
      "个",
      "上",
      "也",
      "很",
      "到",
      "说",
      "要",
      "去",
      "你",
      "会",
      "着",
      "没",
      "看",
      "好",
      "自己",
      "这",
      "那",
      "the",
      "is",
      "are",
      "was",
      "were",
      "be",
      "been",
      "being",
      "have",
      "has",
      "had",
      "do",
      "does",
      "did",
      "will",
      "would",
      "could",
      "should",
      "may",
      "might",
      "can",
      "a",
      "an",
      "and",
      "or",
      "but",
      "in",
      "on",
      "at",
      "to",
      "for",
      "of",
      "with",
      "by",
    ]);

    // 分词（简单按空格和标点分割）
    const words = text
      .toLowerCase()
      .split(/[\s,。，、;；:：!！?？.]+/)
      .filter((w) => w.length > 1 && !commonWords.has(w));

    // 统计词频
    const wordCount = new Map<string, number>();
    words.forEach((word) => {
      wordCount.set(word, (wordCount.get(word) || 0) + 1);
    });

    // 按频率排序并返回前N个
    return Array.from(wordCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map((entry) => entry[0]);
  }

  /**
   * 更新配置
   */
  public updateConfig(config: Partial<ContextMemoryConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * 获取当前配置
   */
  public getConfig(): Required<ContextMemoryConfig> {
    return { ...this.config };
  }
}

/**
 * 创建默认的上下文记忆管理器实例
 */
export function createContextMemoryManager(
  config?: ContextMemoryConfig,
): ContextMemoryManager {
  return new ContextMemoryManager(config);
}

/**
 * 全局默认实例（可选）
 */
export const defaultMemoryManager = createContextMemoryManager({
  maxMessages: 20,
  maxTokens: 4000,
  enableSummary: false,
  keepSystemMessages: true,
});
