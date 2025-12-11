import { NextRequest, NextResponse } from "next/server";
import { AuthService } from "@/modules/auth/auth.service";
import { createRequestLogger, generateCorrelationId } from "@/lib/logger";
import { z } from "zod";
import { db } from "@/lib/drizzle/client";
import { weatherPoster } from "@/lib/drizzle/schema/weatherPoster";
import { eq, and, sql } from "drizzle-orm";
import type {
  ApiResponse,
  WeatherPosterData,
  WeatherPosterGenerateRequest,
  WeatherPosterGenerateResponse,
} from "@/app/api/types";

// 请求数据验证schema
const posterRequestSchema = z.object({
  city: z.string().min(1, "城市名称不能为空"),
});

/**
 * POST /api/weather/poster - 生成天气画报
 *
 * 请求体:
 * - city: 城市名称
 *
 * 功能:
 * 1. 检查用户今日是否已生成画报
 * 2. 调用第三方 API 生成画报
 * 3. 将画报数据存储到数据库
 */
export async function POST(request: NextRequest) {
  const correlationId = generateCorrelationId();
  const log = createRequestLogger("weather-poster-api", correlationId);

  try {
    log.info("开始处理天气画报生成请求");

    // 1. 身份验证
    const authService = new AuthService();
    const { user } = await authService.getCurrentUser();

    if (!user) {
      log.warn("用户未登录");
      return NextResponse.json(
        {
          success: false,
          error: "请先登录",
          code: "UNAUTHORIZED",
        } as ApiResponse,
        { status: 401 },
      );
    }

    log.info(`用户已认证: ${user.id}`);

    // 2. 解析和验证请求数据
    const body: WeatherPosterGenerateRequest = await request.json();
    const validationResult = posterRequestSchema.safeParse(body);

    if (!validationResult.success) {
      log.warn("请求参数验证失败", {
        errors: validationResult.error.message,
      });
      return NextResponse.json(
        {
          success: false,
          error: validationResult.error.message,
          code: "INVALID_PARAMS",
        } as ApiResponse,
        { status: 400 },
      );
    }

    const { city } = validationResult.data;
    log.info(`请求生成城市画报: ${city}`);

    // 3. 检查今日是否已生成该城市的画报
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD 格式
    const existingPoster = await db
      .select()
      .from(weatherPoster)
      .where(
        and(
          eq(weatherPoster.userId, user.id),
          eq(weatherPoster.city, city),
          sql`${weatherPoster.generatedDate}::text = ${today}`,
        ),
      )
      .limit(1);

    if (existingPoster.length > 0) {
      log.info("用户今日已生成该城市画报，返回缓存数据");
      const cachedPoster = existingPoster[0];
      const posterData: WeatherPosterData = {
        city: cachedPoster.city,
        condition: cachedPoster.condition,
        date: cachedPoster.date,
        img: cachedPoster.imgUrl,
        poetry: cachedPoster.poetry,
        temp_high: cachedPoster.tempHigh,
        temp_low: cachedPoster.tempLow,
      };

      const response: ApiResponse<WeatherPosterGenerateResponse> = {
        success: true,
        data: {
          poster: posterData,
          isFirstToday: false, // 标记为缓存数据
        },
      };

      return NextResponse.json(response);
    }

    // 4. 调用第三方 API 生成画报
    log.info("调用第三方 API 生成画报");
    const cozeResponse = await fetch(
      "https://api.coze.cn/v1/workflow/stream_run",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.COZE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          workflow_id: "7579820957188702248",
          app_id: "7579793955551330356",
          parameters: {
            BOT_USER_INPUT: "",
            city: city,
          },
        }),
      },
    );

    if (!cozeResponse.ok) {
      log.error("第三方 API 调用失败", {
        status: cozeResponse.status,
        statusText: cozeResponse.statusText,
      });
      return NextResponse.json(
        {
          success: false,
          error: "画报生成失败，请稍后重试",
          code: "EXTERNAL_API_ERROR",
        } as ApiResponse,
        { status: 500 },
      );
    }

    // 5. 解析流式响应
    const reader = cozeResponse.body?.getReader();
    const decoder = new TextDecoder();
    let posterData: WeatherPosterData | null = null;

    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data:")) {
            try {
              const jsonStr = line.substring(5).trim();
              const data = JSON.parse(jsonStr);

              // 查找包含最终结果的数据
              if (
                data.node_type === "End" &&
                data.node_is_finish &&
                data.content
              ) {
                const contentData = JSON.parse(data.content);
                posterData = contentData as WeatherPosterData;
                log.info("成功解析画报数据", { city: posterData.city });
                break;
              }
            } catch (e) {
              // 忽略解析错误，继续处理下一行
              continue;
            }
          }
        }

        if (posterData) break;
      }
    }

    if (!posterData) {
      log.error("未能从响应中提取画报数据");
      return NextResponse.json(
        {
          success: false,
          error: "画报数据解析失败",
          code: "PARSE_ERROR",
        } as ApiResponse,
        { status: 500 },
      );
    }

    // 6. 存储到数据库
    log.info("存储画报数据到数据库");
    await db.insert(weatherPoster).values({
      userId: user.id,
      city: posterData.city,
      condition: posterData.condition,
      date: posterData.date,
      generatedDate: today,
      imgUrl: posterData.img,
      poetry: posterData.poetry,
      tempHigh: posterData.temp_high,
      tempLow: posterData.temp_low,
    });

    log.info("画报生成成功");

    // 7. 返回成功响应
    const response: ApiResponse<WeatherPosterGenerateResponse> = {
      success: true,
      data: {
        poster: posterData,
        isFirstToday: true,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    log.error("天气画报生成失败", { error });

    const errorResponse: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : "未知错误",
      code: "INTERNAL_ERROR",
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}

/**
 * GET /api/weather/poster - 获取用户的画报历史
 *
 * 查询参数:
 * - limit: 返回数量，默认10
 */
export async function GET(request: NextRequest) {
  const correlationId = generateCorrelationId();
  const log = createRequestLogger("weather-poster-api", correlationId);

  try {
    log.info("开始处理画报历史查询请求");

    // 1. 身份验证
    const authService = new AuthService();
    const { user } = await authService.getCurrentUser();

    if (!user) {
      log.warn("用户未登录");
      return NextResponse.json(
        {
          success: false,
          error: "请先登录",
          code: "UNAUTHORIZED",
        } as ApiResponse,
        { status: 401 },
      );
    }

    // 2. 获取查询参数
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "10", 10), 50);

    // 3. 查询数据库
    const posters = await db
      .select()
      .from(weatherPoster)
      .where(eq(weatherPoster.userId, user.id))
      .orderBy(sql`${weatherPoster.createdAt} DESC`)
      .limit(limit);

    log.info(`查询到 ${posters.length} 条画报记录`);

    // 4. 返回响应
    const response: ApiResponse<typeof posters> = {
      success: true,
      data: posters,
    };

    return NextResponse.json(response);
  } catch (error) {
    log.error("画报历史查询失败", { error });

    const errorResponse: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : "未知错误",
      code: "INTERNAL_ERROR",
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}
