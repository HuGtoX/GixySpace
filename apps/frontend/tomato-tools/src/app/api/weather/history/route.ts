import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/drizzle/client";
import { generateCorrelationId } from "@/lib/logger";
import { weatherCityHistory } from "@/lib/drizzle/schema/weatherHistory";
import { eq, and, desc, sql } from "drizzle-orm";
import { AuthService } from "@/modules/auth/auth.service";

// 请求参数校验schema
const recordCityVisitSchema = z.object({
  cityName: z.string().min(1, "城市名称不能为空"),
  cityNameEn: z.string().optional(),
  locationId: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  province: z.string().optional(),
});

/**
 * GET /api/weather/history
 * 获取用户的城市切换历史记录
 */
export async function GET(request: NextRequest) {
  try {
    const correlationId = generateCorrelationId();
    const authService = new AuthService(correlationId);
    const { user } = await authService.getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "未登录" },
        { status: 401 },
      );
    }

    // 获取查询参数
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10");

    // 查询用户的历史记录，按最后访问时间倒序
    const histories = await db
      .select()
      .from(weatherCityHistory)
      .where(eq(weatherCityHistory.userId, user.id))
      .orderBy(desc(weatherCityHistory.lastVisitAt))
      .limit(Math.min(limit, 50)); // 最多返回50条

    return NextResponse.json({
      success: true,
      data: histories,
    });
  } catch (error) {
    console.error("获取天气历史记录失败:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "获取历史记录失败",
      },
      { status: 500 },
    );
  }
}

/**
 * POST /api/weather/history
 * 记录用户的城市访问
 */
export async function POST(request: NextRequest) {
  try {
    // 获取当前用户
    const correlationId = generateCorrelationId();
    const authService = new AuthService(correlationId);
    const { user } = await authService.getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "未登录" },
        { status: 401 },
      );
    }

    // 解析请求体
    const body = await request.json();
    const validatedData = recordCityVisitSchema.parse(body);

    // 检查是否已存在该城市的记录
    const existingRecord = await db
      .select()
      .from(weatherCityHistory)
      .where(
        and(
          eq(weatherCityHistory.userId, user.id),
          eq(weatherCityHistory.cityName, validatedData.cityName),
        ),
      )
      .limit(1);

    if (existingRecord.length > 0) {
      // 更新现有记录：增加访问次数，更新最后访问时间
      const updated = await db
        .update(weatherCityHistory)
        .set({
          visitCount: sql`${weatherCityHistory.visitCount} + 1`,
          lastVisitAt: new Date(),
        })
        .where(eq(weatherCityHistory.id, existingRecord[0].id))
        .returning();

      return NextResponse.json({
        success: true,
        data: updated[0],
        message: "更新访问记录成功",
      });
    } else {
      // 创建新记录
      const newRecord = await db
        .insert(weatherCityHistory)
        .values({
          userId: user.id!,
          cityName: validatedData.cityName,
          cityNameEn: validatedData.cityNameEn,
          locationId: validatedData.locationId,
          province: validatedData.province,
          visitCount: 1,
        })
        .returning();

      return NextResponse.json({
        success: true,
        data: newRecord[0],
        message: "创建访问记录成功",
      });
    }
  } catch (error) {
    console.error("记录城市访问失败:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "参数验证失败",
          details: error.message,
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "记录访问失败",
      },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/weather/history?id=xxx
 * 删除指定的历史记录
 */
export async function DELETE(request: NextRequest) {
  try {
    // 获取当前用户
    const correlationId = generateCorrelationId();
    const authService = new AuthService(correlationId);
    const { user } = await authService.getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "未登录" },
        { status: 401 },
      );
    }

    // 获取要删除的记录ID
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "缺少记录ID" },
        { status: 400 },
      );
    }

    // 删除记录（确保只能删除自己的记录）
    const deleted = await db
      .delete(weatherCityHistory)
      .where(
        and(
          eq(weatherCityHistory.id, id),
          eq(weatherCityHistory.userId, user.id!),
        ),
      )
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json(
        { success: false, error: "记录不存在或无权删除" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "删除成功",
    });
  } catch (error) {
    console.error("删除历史记录失败:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "删除失败",
      },
      { status: 500 },
    );
  }
}
