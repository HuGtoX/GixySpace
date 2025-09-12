/**
 * AI响应相关的TypeScript类型定义
 * 对应302.ai API的响应结构
 */

export interface AIChoice {
  message: AIMessage;
  finish_reason: string;
  index: number;
  logprobs: null;
}

export interface AIMessage {
  role: "assistant";
  content: string;
}

export interface AIUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface AIResponse {
  choices: AIChoice[];
  object: "chat.completion";
  usage: AIUsage;
  created: number;
  system_fingerprint: null;
  model: string;
  id: string;
}

export interface AISummaryResponseData {
  data: AIResponse;
}

/**
 * 任务报告中的任务项接口
 */
export interface ReportTask {
  title: string;
  description: string;
  status: "已完成";
  priority: "高" | "中";
  completed_at: string;
}

/**
 * 日报总结的JSON结构接口
 */
export interface DailyReport {
  report_type: "day";
  report_date_range: string;
  author: string;
  department: null;
  tasks: ReportTask[];
}

/**
 * AI生成总结的完整响应接口
 */
export interface AISummaryCompleteResponse {
  success: boolean;
  summary: {
    raw: AIResponse;
    parsed?: DailyReport;
    content: string;
  };
  prompt?: string;
  error?: string;
}
