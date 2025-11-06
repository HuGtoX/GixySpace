/**
 * AI使用记录服务示例
 * 展示如何记录和查询AI使用情况
 */

import { db } from "@/lib/drizzle/client";
import {
  aiUsageLogs,
  aiUsageStatistics,
  type NewAiUsageLog,
} from "@/lib/drizzle/schema/aiUsage";
import { eq, and, gte, lte, desc, sql } from "drizzle-orm";

/**
 * 记录AI使用日志
 * @param data AI使用日志数据
 * @returns 创建的日志记录
 */
export async function createAiUsageLog(data: NewAiUsageLog) {
  const [log] = await db.insert(aiUsageLogs).values(data).returning();
  return log;
}

/**
 * 记录302.ai API调用示例
 * @param userId 用户ID
 * @param scene 使用场景
 * @param requestData 请求数据
 * @param responseData 响应数据
 * @param options 额外选项
 */
export async function recordAiApiCall(
  userId: string,
  scene:
    | "chat"
    | "summary"
    | "translation"
    | "code_generation"
    | "text_optimization"
    | "question_answer"
    | "other",
  requestData: any,
  responseData: any,
  options?: {
    conversationCategory?:
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
    conversationTags?: string[];
    sceneDescription?: string;
    ipAddress?: string;
    userAgent?: string;
    duration?: number;
  },
) {
  try {
    // 从响应中提取tokens信息
    const usage = responseData.usage || {};
    const promptTokens = usage.prompt_tokens || 0;
    const completionTokens = usage.completion_tokens || 0;
    const totalTokens = usage.total_tokens || 0;

    // 计算预估成本（根据302.ai的定价）
    // 这里需要根据实际的定价表来计算
    const estimatedCost = calculateCost(
      requestData.model,
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
      model: requestData.model,
      promptTokens,
      completionTokens,
      totalTokens,
      estimatedCost: estimatedCost.toString(),
      requestData,
      responseData,
      status: "success",
      duration: options?.duration,
      ipAddress: options?.ipAddress,
      userAgent: options?.userAgent,
      requestId: responseData.id,
    });

    // 更新统计数据
    await updateDailyStatistics(userId, new Date());

    return log;
  } catch (error) {
    console.error("Failed to record AI API call:", error);
    throw error;
  }
}

/**
 * 记录失败的AI API调用
 */
export async function recordFailedAiApiCall(
  userId: string,
  scene:
    | "chat"
    | "summary"
    | "translation"
    | "code_generation"
    | "text_optimization"
    | "question_answer"
    | "other",
  requestData: any,
  error: any,
  options?: {
    conversationCategory?:
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
    conversationTags?: string[];
    sceneDescription?: string;
    ipAddress?: string;
    userAgent?: string;
    duration?: number;
  },
) {
  try {
    const log = await createAiUsageLog({
      userId,
      scene,
      sceneDescription: options?.sceneDescription,
      conversationCategory: options?.conversationCategory,
      conversationTags: options?.conversationTags,
      model: requestData.model,
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
      requestData,
      status: "failed",
      errorMessage: error.message || "Unknown error",
      errorCode: error.code,
      duration: options?.duration,
      ipAddress: options?.ipAddress,
      userAgent: options?.userAgent,
    });

    // 更新统计数据
    await updateDailyStatistics(userId, new Date());

    return log;
  } catch (err) {
    console.error("Failed to record failed AI API call:", err);
    throw err;
  }
}

/**
 * 计算AI调用成本
 * 根据302.ai的定价表计算（需要根据实际定价调整）
 */
function calculateCost(
  model: string,
  promptTokens: number,
  completionTokens: number,
): number {
  // 示例定价（需要根据实际情况调整）
  const pricing: Record<string, { input: number; output: number }> = {
    "deepseek-chat": { input: 0.0001, output: 0.0002 }, // 每1K tokens的价格
    "deepseek-v3": { input: 0.00015, output: 0.0003 },
    "deepseek-reasoner": { input: 0.0002, output: 0.0004 },
  };

  const modelPricing = pricing[model] || pricing["deepseek-chat"];
  const inputCost = (promptTokens / 1000) * modelPricing.input;
  const outputCost = (completionTokens / 1000) * modelPricing.output;

  return inputCost + outputCost;
}

/**
 * 更新每日统计数据
 */
export async function updateDailyStatistics(userId: string, date: Date) {
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
        totalCost: stats.totalCost.toString(),
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
      totalCost: stats.totalCost.toString(),
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
    scene?: string;
    limit?: number;
    offset?: number;
  },
) {
  let query = db
    .select()
    .from(aiUsageLogs)
    .where(eq(aiUsageLogs.userId, userId))
    .orderBy(desc(aiUsageLogs.createdAt));

  if (options?.startDate) {
    query = query.where(gte(aiUsageLogs.createdAt, options.startDate));
  }

  if (options?.endDate) {
    query = query.where(lte(aiUsageLogs.createdAt, options.endDate));
  }

  if (options?.scene) {
    query = query.where(eq(aiUsageLogs.scene, options.scene as any));
  }

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
  let query = db
    .select()
    .from(aiUsageStatistics)
    .where(eq(aiUsageStatistics.userId, userId))
    .orderBy(desc(aiUsageStatistics.date));

  if (options?.startDate) {
    query = query.where(gte(aiUsageStatistics.date, options.startDate));
  }

  if (options?.endDate) {
    query = query.where(lte(aiUsageStatistics.date, options.endDate));
  }

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
      totalRequests: sql<number>`SUM(${aiUsageStatistics.totalRequests})`,
      successRequests: sql<number>`SUM(${aiUsageStatistics.successRequests})`,
      failedRequests: sql<number>`SUM(${aiUsageStatistics.failedRequests})`,
      totalTokens: sql<number>`SUM(${aiUsageStatistics.totalTokens})`,
      totalCost: sql<number>`SUM(${aiUsageStatistics.totalCost})`,
    })
    .from(aiUsageStatistics)
    .where(eq(aiUsageStatistics.userId, userId));

  return result[0];
}
