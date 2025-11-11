import axios, { AxiosResponse } from "axios";
import {
  recordSuccessfulAiCall,
  recordFailedAiCall,
  type AiUsageScene,
  type AiConversationCategory,
} from "@/lib/services/aiUsageService";

/**
 * AI消息接口
 */
interface AIMessage {
  /** 消息内容 */
  content: string;
  /** 推理内容（可选） */
  reasoning_content?: string;
  /** 角色 */
  role: "assistant" | "user" | "system";
}

/**
 * AI选择项接口
 */
interface AIChoice {
  /** 完成原因 */
  finish_reason: "stop" | "length" | "content_filter" | null;
  /** 索引 */
  index: number;
  /** 日志概率（可选） */
  logprobs: any;
  /** 消息 */
  message: AIMessage;
}

/**
 * Token使用详情接口
 */
interface TokenDetails {
  /** 缓存的token数量 */
  cached_tokens?: number;
  /** 推理token数量 */
  reasoning_tokens?: number;
}

/**
 * Token使用统计接口
 */
interface TokenUsage {
  /** 完成token数量 */
  completion_tokens: number;
  /** 提示token数量 */
  prompt_tokens: number;
  /** 总token数量 */
  total_tokens: number;
  /** 提示token详情 */
  prompt_tokens_details?: TokenDetails;
  /** 完成token详情 */
  completion_tokens_details?: TokenDetails;
}

/**
 * AI响应接口
 */
interface AIResponse {
  /** 选择项列表 */
  choices: AIChoice[];
  /** 创建时间戳 */
  created: number;
  /** 响应ID */
  id: string;
  /** 使用的模型 */
  model: string;
  /** 服务层级 */
  service_tier?: string;
  /** 对象类型 */
  object: string;
  /** Token使用统计 */
  usage: TokenUsage;
}

// 302.ai API配置
const AI_API_URL = "https://api.302.ai/v1/chat/completions";

/**
 * AI请求参数接口
 */
export interface AIRequestOptions {
  /** 请求内容 - 必填 */
  content: string | string[];
  /** API密钥 - 必填 */
  apiKey: string;
  /** AI模型名称 - 可选，默认为通用模型 */
  model?: string;
  /** 请求超时时间（毫秒） - 可选，默认30秒 */
  timeout?: number;
  /** 自定义请求头 - 可选 */
  headers?: Record<string, string>;
  /** 是否打开联网搜索*/
  "web-search"?: boolean;
  /** 是否启用流式输出 - 可选，默认为false */
  stream?: boolean;
  /** 对话历史上下文 - 可选，用于多轮对话记忆 */
  conversationHistory?: Array<{
    role: "user" | "assistant" | "system";
    content: string;
  }>;
  /** 最大上下文消息数量 - 可选，默认为10 */
  maxContextMessages?: number;
  /** 系统提示词 - 可选，用于设置AI行为 */
  systemPrompt?: string;
  // ===== 使用记录相关参数 =====
  /** 用户ID - 可选，如果提供则记录使用情况 */
  userId?: string;
  /** 使用场景 - 可选，默认为"other" */
  scene?: AiUsageScene;
  /** 对话分类 - 可选 */
  conversationCategory?: AiConversationCategory;
  /** 对话标签 - 可选 */
  conversationTags?: string[];
  /** 场景描述 - 可选 */
  sceneDescription?: string;
  /** IP地址 - 可选 */
  ipAddress?: string;
  /** 用户代理 - 可选 */
  userAgent?: string;
  /** 是否记录使用情况 - 可选，默认为true（当提供userId时） */
  enableUsageTracking?: boolean;
}

/**
 * AI请求响应接口
 */
export interface AIRequestResponse {
  /** 是否成功 */
  success: boolean;
  /** AI生成的内容 */
  content?: string;
  /** 完整的AI响应数据 */
  data?: AIResponse;
  /** 错误信息 */
  error?: string;
  /** 错误详情 */
  details?: string;
}

/**
 * 流式AI请求响应接口
 */
export interface AIStreamResponse {
  /** 是否成功 */
  success: boolean;
  /** 流式响应的ReadableStream */
  stream?: ReadableStream<Uint8Array>;
  /** 错误信息 */
  error?: string;
  /** 错误详情 */
  details?: string;
}

/**
 * 构建消息数组（包含上下文历史）
 * @param content 当前消息内容
 * @param conversationHistory 对话历史
 * @param systemPrompt 系统提示词
 * @param maxContextMessages 最大上下文消息数量
 * @returns 构建好的消息数组
 */
function buildMessagesWithContext(
  content: string | string[],
  conversationHistory?: Array<{
    role: "user" | "assistant" | "system";
    content: string;
  }>,
  systemPrompt?: string,
  maxContextMessages: number = 10,
): Array<{ role: string; content: string }> {
  const messages: Array<{ role: string; content: string }> = [];

  // 1. 添加系统提示词（如果有）
  if (systemPrompt) {
    messages.push({ role: "system", content: systemPrompt });
  }

  // 2. 添加对话历史（限制数量）
  if (conversationHistory && conversationHistory.length > 0) {
    // 只保留最近的N条消息作为上下文
    const recentHistory = conversationHistory.slice(-maxContextMessages);
    messages.push(...recentHistory);
  }

  // 3. 添加当前消息
  if (Array.isArray(content)) {
    content.forEach((item) => messages.push({ role: "user", content: item }));
  } else {
    messages.push({ role: "user", content });
  }

  return messages;
}

/**
 * 流式AI请求函数
 * @param options 请求选项
 * @returns Promise<AIStreamResponse>
 */
export async function requestAIStream(
  options: AIRequestOptions,
): Promise<AIStreamResponse> {
  const {
    content,
    apiKey,
    model = "302-agent-todo-summary-gixy",
    timeout = 60000,
    headers = {},
    conversationHistory,
    maxContextMessages = 10,
    systemPrompt,
  } = options;

  // 参数验证
  if (!content || (Array.isArray(content) && content.length === 0)) {
    return {
      success: false,
      error: "请求内容不能为空",
    };
  }

  // 构建包含上下文的消息数组
  const messages = buildMessagesWithContext(
    content,
    conversationHistory,
    systemPrompt,
    maxContextMessages,
  );

  const realModel = !!options["web-search"] ? `${model}-web-search` : model;

  try {
    // 构建请求数据
    const requestData = {
      model: realModel,
      messages,
      stream: true, // 启用流式输出
      "web-search": !!options["web-search"],
    };

    // 构建请求头
    const requestHeaders = {
      Accept: "text/event-stream",
      Authorization: `Bearer ${apiKey}`,
      "User-Agent": AI_API_URL,
      "Content-Type": "application/json",
      ...headers,
    };

    // 发送流式请求
    const response = await fetch(AI_API_URL, {
      method: "POST",
      headers: requestHeaders,
      body: JSON.stringify(requestData),
      signal: AbortSignal.timeout(timeout),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    if (!response.body) {
      throw new Error("响应体为空");
    }

    return {
      success: true,
      stream: response.body,
    };
  } catch (error: any) {
    console.error("AI流式请求失败:", error);

    // 处理不同类型的错误
    if (error.name === "AbortError") {
      return {
        success: false,
        error: "请求超时，请稍后再试",
        details: error.message,
      };
    } else {
      return {
        success: false,
        error: "AI请求发生错误",
        details: error.message || "未知错误",
      };
    }
  }
}

/**
 * 通用AI请求函数
 * @param options 请求选项
 * @returns Promise<AIRequestResponse>
 */
export async function requestAI(
  options: AIRequestOptions,
): Promise<AIRequestResponse> {
  const {
    content,
    apiKey,
    model = "302-agent-todo-summary-gixy",
    timeout = 60000,
    headers = {},
    userId,
    scene = "other",
    conversationCategory,
    conversationTags,
    sceneDescription,
    ipAddress,
    userAgent,
    enableUsageTracking = true,
    conversationHistory,
    maxContextMessages = 10,
    systemPrompt,
  } = options;

  // 参数验证
  if (!content || (Array.isArray(content) && content.length === 0)) {
    return {
      success: false,
      error: "请求内容不能为空",
    };
  }

  // 记录开始时间（用于计算耗时）
  const startTime = Date.now();

  // 构建包含上下文的消息数组
  const messages = buildMessagesWithContext(
    content,
    conversationHistory,
    systemPrompt,
    maxContextMessages,
  );

  const realModel = !!options["web-search"] ? `${model}-web-search` : model;

  try {
    // 构建请求数据
    const requestData = {
      model: realModel,
      messages,
      "web-search": !!options["web-search"],
    };

    // 构建请求头
    const requestHeaders = {
      Accept: "application/json",
      Authorization: `Bearer ${apiKey}`,
      "User-Agent": AI_API_URL,
      "Content-Type": "application/json",
      ...headers,
    };

    // 发送请求
    const response: AxiosResponse<AIResponse> = await axios.post(
      AI_API_URL,
      requestData,
      {
        headers: requestHeaders,
        timeout,
      },
    );

    const aiResponse = response.data;
    const aiContent = aiResponse.choices?.[0]?.message?.content;

    if (!aiContent) {
      return {
        success: false,
        error: "AI响应内容为空",
        data: aiResponse,
      };
    }

    // 计算请求耗时
    const duration = Date.now() - startTime;

    // 记录成功的AI调用（如果提供了userId且启用了追踪）
    if (userId && enableUsageTracking) {
      recordSuccessfulAiCall(userId, scene, requestData, aiResponse, {
        conversationCategory,
        conversationTags,
        sceneDescription,
        ipAddress,
        userAgent,
        duration,
      }).catch((error) => {
        // 记录失败不影响主流程，只打印错误日志
        console.error("Failed to record AI usage:", error);
      });
    }

    return {
      success: true,
      content: aiContent,
      data: aiResponse,
    };
  } catch (error: any) {
    console.error("AI请求失败:", error);

    // 计算请求耗时
    const duration = Date.now() - startTime;

    // 记录失败的AI调用（如果提供了userId且启用了追踪）
    if (userId && enableUsageTracking) {
      recordFailedAiCall(
        userId,
        scene,
        { model, messages: [{ role: "user", content }] },
        error,
        {
          conversationCategory,
          conversationTags,
          sceneDescription,
          ipAddress,
          userAgent,
          duration,
        },
      ).catch((err) => {
        // 记录失败不影响主流程，只打印错误日志
        console.error("Failed to record failed AI usage:", err);
      });
    }

    // 处理不同类型的错误
    if (error.response) {
      const status = error.response.status;
      const statusText = error.response.statusText;

      switch (status) {
        case 401:
          return {
            success: false,
            error: "服务认证失败，请检查API密钥配置",
            details: `HTTP ${status}: ${statusText}`,
          };
        case 429:
          return {
            success: false,
            error: "请求过于频繁，请稍后再试",
            details: `HTTP ${status}: ${statusText}`,
          };
        default:
          return {
            success: false,
            error: "服务暂时不可用，请稍后再试",
            details: `HTTP ${status}: ${statusText}`,
          };
      }
    } else if (error.code === "ECONNABORTED") {
      return {
        success: false,
        error: "请求超时，请稍后再试",
        details: error.message,
      };
    } else if (error.code === "ENOTFOUND" || error.code === "ECONNREFUSED") {
      return {
        success: false,
        error: "网络连接失败，请检查网络连接",
        details: error.message,
      };
    } else {
      return {
        success: false,
        error: "AI请求发生未知错误",
        details: error.message || "未知错误",
      };
    }
  }
}

/**
 * 从环境变量获取默认API密钥的辅助函数
 * @param envKey 环境变量键名，默认为 'TD_AGENT_API_KEY'
 * @returns API密钥或空字符串
 */
export function getDefaultApiKey(envKey: string = "TD_AGENT_API_KEY"): string {
  const apiKey = process.env[envKey];
  if (!apiKey) {
    console.warn(`${envKey}环境变量未设置，请确保已配置API密钥`);
    return "";
  }
  return apiKey;
}

/**
 * 使用默认API密钥的便捷函数
 * @param content 请求内容
 * @param model 可选的模型名称
 * @param envKey 可选的环境变量键名
 * @returns Promise<AIRequestResponse>
 */
export async function requestAIWithDefaultKey(
  content: string,
  model?: string,
  envKey?: string,
): Promise<AIRequestResponse> {
  const apiKey = getDefaultApiKey(envKey);

  if (!apiKey) {
    return {
      success: false,
      error: "未找到有效的API密钥，请检查环境变量配置",
    };
  }

  return requestAI({
    content,
    apiKey,
    model,
  });
}
