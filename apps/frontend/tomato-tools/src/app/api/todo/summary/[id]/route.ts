import { NextRequest, NextResponse } from "next/server";
import { authorization } from "../../../authorization";
import { createDbClient } from "@/lib/drizzle/client";
import { aiSummary } from "@/lib/drizzle/schema/aiSummary";
import { eq, and } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const user = await authorization();

  try {
    const summaryId = params.id;

    if (!summaryId) {
      return NextResponse.json({ error: "总结ID不能为空" }, { status: 400 });
    }

    const dbClient = createDbClient();

    // 查询总结详情
    const summaryDetail = await dbClient.db
      .select()
      .from(aiSummary)
      .where(and(eq(aiSummary.id, summaryId), eq(aiSummary.userId, user.id)))
      .limit(1);

    if (summaryDetail.length === 0) {
      return NextResponse.json(
        { error: "总结不存在或无权访问" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: summaryDetail[0],
    });
  } catch (error: any) {
    console.error("获取总结详情失败:", error);
    return NextResponse.json(
      { error: "获取总结详情时发生错误", details: error.message },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const user = await authorization();

  try {
    const summaryId = params.id;

    if (!summaryId) {
      return NextResponse.json({ error: "总结ID不能为空" }, { status: 400 });
    }

    const dbClient = createDbClient();

    // 删除总结
    const deletedSummary = await dbClient.db
      .delete(aiSummary)
      .where(and(eq(aiSummary.id, summaryId), eq(aiSummary.userId, user.id)))
      .returning();

    if (deletedSummary.length === 0) {
      return NextResponse.json(
        { error: "总结不存在或无权删除" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "总结删除成功",
    });
  } catch (error: any) {
    console.error("删除总结失败:", error);
    return NextResponse.json(
      { error: "删除总结时发生错误", details: error.message },
      { status: 500 },
    );
  }
}
