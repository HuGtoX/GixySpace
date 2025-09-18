import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { getTodoSummaryPrompt } from "@/lib/prompts/todoSummary";
import type { TodoSummaryRequest } from "@/types";
import { authorization } from "../../authorization";
import { todo } from "@/lib/drizzle/schema/todo";
import { aiSummary } from "@/lib/drizzle/schema/aiSummary";
import type { AISummaryResponseData } from "@/types/ai-response";
import { generateDateRange, DateRangeType } from "@/lib/date";
import { z } from "zod";
import { createDbClient } from "@/lib/drizzle/client";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import dayjs from "dayjs";
// 302.ai API配置
const AI_API_URL = "https://api.302.ai/v1/chat/completions";

// 从环境变量获取API密钥
const getApiKey = () => {
  const apiKey = process.env.TD_AGENT_API_KEY;
  if (!apiKey) {
    console.warn("TD_AGENT_API_KEY环境变量未设置，使用默认密钥（可能受限）");
    return "";
  }
  return apiKey;
};

// 生成总结标题的辅助函数
const generateSummaryTitle = (
  period: string,
  dateRange?: { start: string; end: string },
) => {
  const now = dayjs();
  switch (period) {
    case "day":
      return `${now.format("YYYY年MM月DD日")}工作总结`;
    case "week":
      return `${now.format("YYYY年第w周")}工作总结`;
    case "month":
      return `${now.format("YYYY年MM月")}工作总结`;
    case "all":
      return "全部任务工作总结";
    default:
      return "工作总结";
  }
};

// 生成时间周期标识的辅助函数
const generatePeriodIdentifier = (
  period: string,
  dateRange?: { start: string; end: string },
) => {
  const now = dayjs();
  switch (period) {
    case "day":
      return now.format("YYYY-MM-DD");
    case "week":
      return now.format("YYYY-[W]w");
    case "month":
      return now.format("YYYY-MM");
    case "all":
      return "all-time";
    default:
      return now.format("YYYY-MM-DD");
  }
};

export async function POST(request: NextRequest) {
  const user = await authorization();
  let summaryId: string | null = null;

  try {
    const body = (await request.json()) as TodoSummaryRequest;

    // 验证请求数据
    const schema = z.object({
      period: z.enum(["day", "week", "month", "all"]).optional(),
    });
    const validatedData = schema.parse(body);
    const period = validatedData.period || "day";

    // 直接从数据库查询已完成的待办事项
    const dbClient = createDbClient();

    // 构建查询条件
    const conditions = [eq(todo.userId, user.id), eq(todo.status, "completed")];
    let dateRange: { start: string; end: string } | undefined;

    // 根据时间周期添加日期范围条件
    if (period !== "all") {
      dateRange = generateDateRange(period as DateRangeType);

      // 使用更精确的日期范围计算
      const startDate = dayjs(dateRange.start).startOf("day").toDate();
      const endDate = dayjs(dateRange.end).endOf("day").toDate();

      // 添加时间范围过滤条件
      conditions.push(gte(todo.updatedAt, startDate));
      conditions.push(lte(todo.updatedAt, endDate));
    }

    // 查询已完成的待办事项
    const completedTodos = await dbClient.db
      .select()
      .from(todo)
      .where(and(...conditions))
      .orderBy(todo.updatedAt);

    console.log(`查询到 ${completedTodos.length} 个已完成的任务 (${period})`);

    // 生成总结标题和周期标识
    const title = generateSummaryTitle(period, dateRange);
    const periodIdentifier = generatePeriodIdentifier(period, dateRange);

    // 创建新记录
    const summaryRecord = await dbClient.db
      .insert(aiSummary)
      .values({
        userId: user.id,
        title,
        summaryType: period as any,
        period: periodIdentifier,
        todoCount: completedTodos.length,
        status: "generating",
      })
      .returning();
    summaryId = summaryRecord[0].id;

    // 如果没有找到已完成的任务，更新状态并返回
    if (completedTodos.length === 0) {
      const periodLabels = {
        day: "今日",
        week: "本周",
        month: "本月",
        all: "全部时间",
      };
      const periodLabel =
        periodLabels[period as keyof typeof periodLabels] || "指定时间";
      const emptyMessage = `${periodLabel}暂无已完成的任务，继续加油！💪`;

      return NextResponse.json({
        success: true,
        summary: emptyMessage,
        summaryId,
        isEmpty: true,
      });
    }

    // 生成AI提示词
    const prompt = getTodoSummaryPrompt(period as any, {
      userName: user.user_metadata.name || "用户",
      todos: JSON.stringify(
        completedTodos.map((todoItem) => ({
          title: todoItem.title,
          description: todoItem.description,
          createdAt: todoItem.createdAt,
          updatedAt: todoItem.updatedAt,
          priority: todoItem.priority,
        })),
      ),
      completedCount: completedTodos.length,
    });

    // 调用302.ai API
    const response = await axios.post<AISummaryResponseData>(
      AI_API_URL,
      {
        model: "302-agent-todo-summary-gixy",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      },
      {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${getApiKey()}`,
          "User-Agent": AI_API_URL,
          "Content-Type": "application/json",
        },
      },
    );

    const aiResponse = response.data;
    const summaryContent = aiResponse.choices[0].message.content;

    // 更新总结记录为完成状态
    await dbClient.db
      .update(aiSummary)
      .set({
        content: summaryContent,
        status: "completed",
        prompt: process.env.NODE_ENV === "development" ? prompt : null, // 仅开发环境保存提示词
        updatedAt: new Date(),
      })
      .where(eq(aiSummary.id, summaryId));

    return NextResponse.json({
      success: true,
      summary: summaryContent,
      summaryId,
      prompt: process.env.NODE_ENV === "development" ? prompt : undefined,
    });
  } catch (error: any) {
    console.error("AI总结生成失败:", error);

    // 如果有summaryId，更新错误状态
    if (summaryId) {
      try {
        const dbClient = createDbClient();
        await dbClient.db
          .update(aiSummary)
          .set({
            status: "failed",
            errorMessage: error.message,
            updatedAt: new Date(),
          })
          .where(eq(aiSummary.id, summaryId));
      } catch (updateError) {
        console.error("更新总结错误状态失败:", updateError);
      }
    }

    // 返回友好的错误信息
    if (error.response?.status === 401) {
      return NextResponse.json(
        { error: "AI服务认证失败，请检查API密钥配置" },
        { status: 500 },
      );
    }

    if (error.response?.status === 429) {
      return NextResponse.json(
        { error: "请求过于频繁，请稍后再试" },
        { status: 429 },
      );
    }

    return NextResponse.json(
      { error: "生成AI总结时发生错误", details: error.message },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  const user = await authorization();

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");
    const summaryType = searchParams.get("type") as
      | "day"
      | "week"
      | "month"
      | "all"
      | null;

    const dbClient = createDbClient();

    // 构建查询条件
    const conditions = [eq(aiSummary.userId, user.id)];
    if (summaryType) {
      conditions.push(eq(aiSummary.summaryType, summaryType));
    }

    // 查询总结列表
    const summaries = await dbClient.db
      .select({
        id: aiSummary.id,
        title: aiSummary.title,
        summaryType: aiSummary.summaryType,
        period: aiSummary.period,
        todoCount: aiSummary.todoCount,
        status: aiSummary.status,
        createdAt: aiSummary.createdAt,
        updatedAt: aiSummary.updatedAt,
      })
      .from(aiSummary)
      .where(and(...conditions))
      .orderBy(desc(aiSummary.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    // 查询总数
    const totalCountResult = await dbClient.db
      .select()
      .from(aiSummary)
      .where(and(...conditions));

    const totalCount = totalCountResult.length;

    return NextResponse.json({
      success: true,
      data: summaries,
      pagination: {
        page,
        pageSize,
        total: totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
      },
    });
  } catch (error: any) {
    console.error("获取总结列表失败:", error);
    return NextResponse.json(
      { error: "获取总结列表时发生错误", details: error.message },
      { status: 500 },
    );
  }
}
