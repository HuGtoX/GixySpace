/**
 * AI使用记录服务
 * 用于记录和统计AI API的使用情况
 */

import { db } from "@/lib/drizzle/client";
import {
  aiUsageLogs,
  aiUsageStatistics,
  type NewAiUsageLog,
} from "@/lib/drizzle/schema/aiUsage";
import { eq, and, desc, sql } from "drizzle-orm";

/**
 * AI使用场景类型
 */
export type AiUsageScene =
  | "chat"
  | "summary"
  | "translation"
  | "code_generation"
  | "text_optimization"
  | "question_answer"
  | "weather_report"
  | "other";

/**
 * AI对话分类类型
 */
export type AiConversationCategory =
  | "general_chat"
  | "casual_conversation"
  | "work_consultation"
  | "technical_support"
  | "code_review"
  | "debugging_help"
  | "architecture_design"
  | "learning_tutorial"
  | "concept_explanation"
  | "homework_help"
  | "content_creation"
  | "writing_assistance"
  | "brainstorming"
  | "data_analysis"
  | "report_generation"
  | "document_summary"
  | "translation_service"
  | "grammar_check"
  | "text_polishing"
  | "other";

/**
 * 记录选项接口
 */
export interface RecordAiUsageOptions {
  /** 对话分类 */
  conversationCategory?: AiConversationCategory;
  /** 对话标签 */
  conversationTags?: string[];
  /** 场景描述 */
  sceneDescription?: string;
  /** IP地址 */
  ipAddress?: string;
  /** 用户代理 */
  userAgent?: string;
  /** 请求耗时（毫秒） */
  duration?: number;
}

/**
 * 记录AI使用日志
 */
async function createAiUsageLog(data: NewAiUsageLog) {
  try {
    const [log] = await db.insert(aiUsageLogs).values(data).returning();
    return log;
  } catch (error) {
    console.error("Failed to create AI usage log:", error);
    throw error;
  }
}

/**
 * 计算AI调用成本
 * 根据302.ai的定价表计算
 */
function calculateCost(
  model: string,
  promptTokens: number,
  completionTokens: number,
): number {
  // 302.ai定价（每1K tokens的价格，单位：美元）
  const pricing: Record<string, { input: number; output: number }> = {
    "deepseek-chat": { input: 0.0001, output: 0.0002 },
    "deepseek-v3": { input: 0.00015, output: 0.0003 },
    "deepseek-reasoner": { input: 0.0002, output: 0.0004 },
    "302-agent-todo-summary-gixy": { input: 0.0001, output: 0.0002 }, // 默认定价
  };

  const modelPricing = pricing[model] || pricing["deepseek-chat"];
  const inputCost = (promptTokens / 1000) * modelPricing.input;
  const outputCost = (completionTokens / 1000) * modelPricing.output;

  return inputCost + outputCost;
}

/**
 * 记录成功的AI API调用
 */
export async function recordSuccessfulAiCall(
  userId: string,
  scene: AiUsageScene,
  requestData: any,
  responseData: any,
  options?: RecordAiUsageOptions,
) {
  try {
    // 从响应中提取tokens信息
    const usage = responseData.usage || {};
    const promptTokens = usage.prompt_tokens || 0;
    const completionTokens = usage.completion_tokens || 0;
    const totalTokens = usage.total_tokens || 0;

    // 计算预估成本
    const estimatedCost = calculateCost(
      requestData.model || responseData.model,
      promptTokens,
      completionTokens,
    );

    // 创建日志记录
    const log = await createAiUsageLog({
      userId,
      scene,
      sceneDescription: options?.sceneDescription,
      conversationCategory: options?.conversationCategory,
      conversationTags: options?.conversationTags,
      model: requestData.model || responseData.model,
      promptTokens,
      completionTokens,
      totalTokens,
      estimatedCost: estimatedCost.toFixed(6),
      requestData,
      responseData,
      status: "success",
      duration: options?.duration,
      ipAddress: options?.ipAddress,
      userAgent: options?.userAgent,
      requestId: responseData.id,
    });

    // 异步更新统计数据（不阻塞主流程）
    updateDailyStatistics(userId, new Date()).catch((error) => {
      console.error("Failed to update daily statistics:", error);
    });

    return log;
  } catch (error) {
    console.error("Failed to record successful AI call:", error);
    // 不抛出错误，避免影响主流程
    return null;
  }
}

/**
 * 记录失败的AI API调用
 */
export async function recordFailedAiCall(
  userId: string,
  scene: AiUsageScene,
  requestData: any,
  error: any,
  options?: RecordAiUsageOptions,
) {
  try {
    const log = await createAiUsageLog({
      userId,
      scene,
      sceneDescription: options?.sceneDescription,
      conversationCategory: options?.conversationCategory,
      conversationTags: options?.conversationTags,
      model: requestData.model || "unknown",
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      requestData,
      status: error.code === "ECONNABORTED" ? "timeout" : "failed",
      errorMessage: error.message || error.error || "Unknown error",
      errorCode: error.code || error.status?.toString(),
      duration: options?.duration,
      ipAddress: options?.ipAddress,
      userAgent: options?.userAgent,
    });

    // 异步更新统计数据（不阻塞主流程）
    updateDailyStatistics(userId, new Date()).catch((err) => {
      console.error("Failed to update daily statistics:", err);
    });

    return log;
  } catch (err) {
    console.error("Failed to record failed AI call:", err);
    // 不抛出错误，避免影响主流程
    return null;
  }
}

/**
 * 更新每日统计数据
 */
async function updateDailyStatistics(userId: string, date: Date) {
  const dateStr = date.toISOString().split("T")[0];

  // 查询当天的所有日志
  const logs = await db
    .select()
    .from(aiUsageLogs)
    .where(
      and(
        eq(aiUsageLogs.userId, userId),
        sql`DATE(${aiUsageLogs.createdAt}) = ${dateStr}`,
      ),
    );

  // 计算统计数据
  const stats = logs.reduce(
    (acc, log) => {
      acc.totalRequests++;
      if (log.status === "success") {
        acc.successRequests++;
      } else {
        acc.failedRequests++;
      }
      acc.totalPromptTokens += log.promptTokens;
      acc.totalCompletionTokens += log.completionTokens;
      acc.totalTokens += log.totalTokens;
      acc.totalCost += parseFloat(log.estimatedCost || "0");

      // 场景统计
      const scene = log.scene;
      acc.sceneStats[scene] = (acc.sceneStats[scene] || 0) + 1;

      // 对话分类统计
      if (log.conversationCategory) {
        const category = log.conversationCategory;
        acc.categoryStats[category] = (acc.categoryStats[category] || 0) + 1;
      }

      // 模型统计
      const model = log.model;
      acc.modelStats[model] = (acc.modelStats[model] || 0) + 1;

      // 平均耗时
      if (log.duration) {
        acc.totalDuration += log.duration;
        acc.durationCount++;
      }

      return acc;
    },
    {
      totalRequests: 0,
      successRequests: 0,
      failedRequests: 0,
      totalPromptTokens: 0,
      totalCompletionTokens: 0,
      totalTokens: 0,
      totalCost: 0,
      sceneStats: {} as Record<string, number>,
      categoryStats: {} as Record<string, number>,
      modelStats: {} as Record<string, number>,
      totalDuration: 0,
      durationCount: 0,
    },
  );

  const avgDuration =
    stats.durationCount > 0
      ? Math.round(stats.totalDuration / stats.durationCount)
      : null;

  // 更新或插入统计记录
  const existing = await db
    .select()
    .from(aiUsageStatistics)
    .where(
      and(
        eq(aiUsageStatistics.userId, userId),
        eq(aiUsageStatistics.date, dateStr),
      ),
    )
    .limit(1);

  if (existing.length > 0) {
    // 更新现有记录
    await db
      .update(aiUsageStatistics)
      .set({
        totalRequests: stats.totalRequests,
        successRequests: stats.successRequests,
        failedRequests: stats.failedRequests,
        totalPromptTokens: stats.totalPromptTokens,
        totalCompletionTokens: stats.totalCompletionTokens,
        totalTokens: stats.totalTokens,
        totalCost: stats.totalCost.toFixed(6),
        sceneStats: stats.sceneStats,
        categoryStats: stats.categoryStats,
        modelStats: stats.modelStats,
        avgDuration,
        updatedAt: new Date(),
      })
      .where(eq(aiUsageStatistics.id, existing[0].id));
  } else {
    // 创建新记录
    await db.insert(aiUsageStatistics).values({
      userId,
      date: dateStr,
      totalRequests: stats.totalRequests,
      successRequests: stats.successRequests,
      failedRequests: stats.failedRequests,
      totalPromptTokens: stats.totalPromptTokens,
      totalCompletionTokens: stats.totalCompletionTokens,
      totalTokens: stats.totalTokens,
      totalCost: stats.totalCost.toFixed(6),
      sceneStats: stats.sceneStats,
      categoryStats: stats.categoryStats,
      modelStats: stats.modelStats,
      avgDuration,
    });
  }
}

/**
 * 查询用户的AI使用日志
 */
export async function getUserAiUsageLogs(
  userId: string,
  options?: {
    startDate?: Date;
    endDate?: Date;
    scene?: AiUsageScene;
    limit?: number;
    offset?: number;
  },
) {
  const conditions = [eq(aiUsageLogs.userId, userId)];

  if (options?.startDate) {
    conditions.push(sql`${aiUsageLogs.createdAt} >= ${options.startDate}`);
  }

  if (options?.endDate) {
    conditions.push(sql`${aiUsageLogs.createdAt} <= ${options.endDate}`);
  }

  if (options?.scene) {
    conditions.push(eq(aiUsageLogs.scene, options.scene));
  }

  let query = db
    .select()
    .from(aiUsageLogs)
    .where(and(...conditions))
    .orderBy(desc(aiUsageLogs.createdAt))
    .$dynamic();

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  if (options?.offset) {
    query = query.offset(options.offset);
  }

  return await query;
}

/**
 * 查询用户的AI使用统计
 */
export async function getUserAiUsageStatistics(
  userId: string,
  options?: {
    startDate?: string;
    endDate?: string;
    limit?: number;
  },
) {
  const conditions = [eq(aiUsageStatistics.userId, userId)];

  if (options?.startDate) {
    conditions.push(sql`${aiUsageStatistics.date} >= ${options.startDate}`);
  }

  if (options?.endDate) {
    conditions.push(sql`${aiUsageStatistics.date} <= ${options.endDate}`);
  }

  let query = db
    .select()
    .from(aiUsageStatistics)
    .where(and(...conditions))
    .orderBy(desc(aiUsageStatistics.date))
    .$dynamic();

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  return await query;
}

/**
 * 获取用户总的AI使用统计
 */
export async function getUserTotalStatistics(userId: string) {
  const result = await db
    .select({
      totalRequests: sql<number>`COALESCE(SUM(${aiUsageStatistics.totalRequests}), 0)`,
      successRequests: sql<number>`COALESCE(SUM(${aiUsageStatistics.successRequests}), 0)`,
      failedRequests: sql<number>`COALESCE(SUM(${aiUsageStatistics.failedRequests}), 0)`,
      totalTokens: sql<number>`COALESCE(SUM(${aiUsageStatistics.totalTokens}), 0)`,
      totalCost: sql<number>`COALESCE(SUM(CAST(${aiUsageStatistics.totalCost} AS DECIMAL)), 0)`,
    })
    .from(aiUsageStatistics)
    .where(eq(aiUsageStatistics.userId, userId));

  return (
    result[0] || {
      totalRequests: 0,
      successRequests: 0,
      failedRequests: 0,
      totalTokens: 0,
      totalCost: 0,
    }
  );
}
