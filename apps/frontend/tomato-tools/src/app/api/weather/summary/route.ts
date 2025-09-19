import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/modules/auth/auth.service";
import { createRequestLogger, generateCorrelationId } from "@/lib/logger";
import { requestAI } from "@/lib/ai-client";
import { z } from "zod";
import {
  getCache,
  setCache,
  generateWeatherSummaryCacheKey,
  WEATHER_SUMMARY_CACHE_TTL,
} from "@/lib/redis-cache";
// 请求数据验证schema
const summaryRequestSchema = z.object({
  location: z.string().min(1, "位置不能为空"),
  temperature: z.string(),
  weather: z.string().min(1, "天气描述不能为空"),
  humidity: z.string(),
  windSpeed: z.string(),
  windDirection: z.string(),
  aqi: z.string().optional(),
  aqiCategory: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const correlationId =
    request.headers.get("x-correlation-id") || generateCorrelationId();
  const logger = createRequestLogger(correlationId, "weather/summary");

  try {
    const authService = new AuthService();
    const { session, error } = await authService.getSession();

    if (error || !session || !session.user.id) {
      return NextResponse.json(
        { error: error || "未授权访问" },
        { status: 401 },
      );
    }

    // 验证请求数据
    const body = await request.json();
    console.log("-- [ body ] --", body);
    const validatedData = summaryRequestSchema.parse(body);

    // 检查Redis缓存
    const cacheKey = generateWeatherSummaryCacheKey(validatedData.location);
    const cachedSummary = await getCache<{
      success: boolean;
      content?: string;
      error?: string;
    }>(cacheKey);

    if (cachedSummary) {
      logger.info(
        { location: validatedData.location },
        "Weather summary retrieved from cache",
      );

      return NextResponse.json({
        success: true,
        data: { summary: cachedSummary },
      });
    }

    // 构建天气总结提示
    const weatherSummaryPrompt = `
基于以下天气数据，生成一个简洁的中文天气总结（50-100字），包含天气状况、温度感受、出行建议和健康提醒：

位置：${validatedData.location}
天气：${validatedData.weather}
温度：${validatedData.temperature}°C
湿度：${validatedData.humidity}%
风速：${validatedData.windSpeed}m/s ${validatedData.windDirection}
空气质量：${validatedData.aqiCategory || "未知"} (AQI: ${validatedData.aqi || "无数据"})

要求：
1. 语言简洁自然，避免专业术语
2. 提供实用的出行建议
3. 如有需要，给出健康提醒
4. 整体语气友好亲切
`;

    const summary = await requestAI({
      content: weatherSummaryPrompt,
      apiKey: process.env.TD_AGENT_WEATHAER_KEY!,
      model: "302-agent-weather",
    });

    // 将AI总结结果缓存到Redis（2小时）
    await setCache(cacheKey, summary, WEATHER_SUMMARY_CACHE_TTL);

    logger.info(
      { location: validatedData.location },
      "Weather summary generated and cached",
    );

    return NextResponse.json({
      success: true,
      data: { summary },
    });
  } catch (error) {
    logger.error({ error }, "Generate weather summary error");

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "请求数据格式错误", details: error.message },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "生成天气总结失败" },
      { status: 500 },
    );
  }
}
