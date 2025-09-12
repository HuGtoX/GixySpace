import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { getTodoSummaryPrompt } from "@/lib/prompts/todoSummary";
import type { TodoSummaryRequest, PaginationResponse } from "@/types";
import { authorization } from "../../authorization";
import { Todo } from "@/lib/drizzle/schema/todo";
import type { AISummaryResponseData } from "@/types/ai-response";
import { generateDateRange, DateRangeType } from "@/lib/date";
import { z } from "zod";

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

export async function POST(request: NextRequest) {
  const user = await authorization();

  try {
    const body = (await request.json()) as TodoSummaryRequest;
    const { period = "day" } = body;

    // 验证请求数据
    const schema = z.object({
      period: z.enum(["day", "week", "month", "all"]).optional(),
    });
    const validatedData = schema.parse(body);

    // 构建查询参数
    const params = new URLSearchParams();
    params.append("status", "completed");

    if (validatedData.period !== "all") {
      const dateRange = generateDateRange(
        validatedData.period as DateRangeType,
      );
      params.append("startDate", dateRange.start);
      params.append("endDate", dateRange.end);
    }
    const resp = await axios.get<PaginationResponse<Todo>>(
      `/api/todo?${params.toString()}`,
    );

    // 生成AI提示词
    const prompt = getTodoSummaryPrompt(period as any, {
      userName: user.user_metadata.name,
      todos: JSON.stringify(
        resp.data.map((todo) => ({
          title: todo.title,
          description: todo.description,
          createdAt: todo.createdAt,
          priority: todo.priority,
        })),
      ),
      completedCount: resp.pagination.total,
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

    const aiResponse = response.data || "无法生成总结";

    const responseData = {
      success: true,
      summary: aiResponse.choices[0].message.content,
      prompt,
    };

    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error("AI总结生成失败:", error);

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

export async function GET() {
  return NextResponse.json(
    { error: "请使用POST方法请求此接口" },
    { status: 405 },
  );
}
