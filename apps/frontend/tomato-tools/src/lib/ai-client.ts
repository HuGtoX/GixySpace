import axios, { AxiosResponse } from "axios";

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
  content: string;
  /** API密钥 - 必填 */
  apiKey: string;
  /** AI模型名称 - 可选，默认为通用模型 */
  model?: string;
  /** 请求超时时间（毫秒） - 可选，默认30秒 */
  timeout?: number;
  /** 自定义请求头 - 可选 */
  headers?: Record<string, string>;
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
    timeout = 30000,
    headers = {},
  } = options;

  // 参数验证
  if (!content || content.trim() === "") {
    return {
      success: false,
      error: "请求内容不能为空",
    };
  }

  if (!apiKey || apiKey.trim() === "") {
    return {
      success: false,
      error: "API密钥不能为空",
    };
  }

  try {
    // 构建请求数据
    const requestData = {
      model,
      messages: [
        {
          role: "user" as const,
          content: content.trim(),
        },
      ],
    };

    // 构建请求头
    const requestHeaders = {
      Accept: "application/json",
      Authorization: `Bearer ${apiKey}`,
      "User-Agent": AI_API_URL,
      "Content-Type": "application/json",
      ...headers, // 允许覆盖默认头部
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

    return {
      success: true,
      content: aiContent,
      data: aiResponse,
    };
  } catch (error: any) {
    console.error("AI请求失败:", error);

    // 处理不同类型的错误
    if (error.response) {
      const status = error.response.status;
      const statusText = error.response.statusText;

      switch (status) {
        case 401:
          return {
            success: false,
            error: "AI服务认证失败，请检查API密钥配置",
            details: `HTTP ${status}: ${statusText}`,
          };
        case 429:
          return {
            success: false,
            error: "请求过于频繁，请稍后再试",
            details: `HTTP ${status}: ${statusText}`,
          };
        case 400:
          return {
            success: false,
            error: "请求参数错误",
            details: `HTTP ${status}: ${statusText}`,
          };
        case 500:
        case 502:
        case 503:
        case 504:
          return {
            success: false,
            error: "AI服务暂时不可用，请稍后再试",
            details: `HTTP ${status}: ${statusText}`,
          };
        default:
          return {
            success: false,
            error: "AI请求失败",
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
