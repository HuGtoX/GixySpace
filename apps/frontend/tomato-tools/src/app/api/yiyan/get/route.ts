import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { createDbClient } from "@/lib/database/drizzle/client";
import { dailySentences } from "@/lib/database/drizzle/schema/schema";
import { createModuleLogger } from "@/lib/logger";
import { DailySentence } from "@gixy/types";

const log = createModuleLogger("yiyan-api");

/**
 * 每日一言API
 * 从hitokoto API获取每日一言，并存储到数据库中避免重复
 * @returns DailySentence
 */
export async function GET(request: Request) {
  const requestId = crypto.randomUUID();
  const logger = log.child({ requestId });

  try {
    const { db } = createDbClient(requestId);

    // 检查今天是否已有数据
    const existingSentence = await db.query.dailySentences.findFirst({
      where: eq(dailySentences.fetchDate, sql`CURRENT_DATE`),
    });

    if (existingSentence) {
      logger.debug("返回今日已缓存的每日一言");
      return NextResponse.json(JSON.parse(existingSentence.fetchData ?? "{}"));
    }

    // 尝试获取唯一内容，最多重试20次
    const maxRetries = 20;
    let result: DailySentence | null = null;

    for (let i = 0; i < maxRetries; i++) {
      try {
        logger.debug(`第 ${i + 1} 次尝试获取每日一言`);

        const response = await fetch(
          "https://international.v1.hitokoto.cn?c=k",
          {
            headers: {
              "User-Agent": "TomatoTools/1.0",
            },
            // 不缓存，确保每次都是新数据
            cache: "no-store",
          },
        );

        if (!response.ok) {
          throw new Error(`每日一言获取失败: HTTP ${response.status}`);
        }

        const fetchedResult: DailySentence = await response.json();

        // 检查内容是否已存在于数据库中
        const duplicateCheck = await db.query.dailySentences.findFirst({
          where: eq(dailySentences.content, fetchedResult.hitokoto),
        });

        if (!duplicateCheck) {
          // 找到唯一内容，跳出循环
          result = fetchedResult;
          logger.info("成功获取唯一的每日一言");
          break;
        }

        // 如果内容重复，继续下一次尝试
        logger.debug(`第 ${i + 1} 次尝试获取到重复内容，继续重试...`);
      } catch (error) {
        logger.error({ error }, `第 ${i + 1} 次获取失败`);
        // 如果不是最后一次尝试，继续重试
        if (i === maxRetries - 1) {
          throw new Error(
            `每日一言获取失败: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      }
    }

    if (!result) {
      throw new Error("无法获取到唯一的每日一言内容，已达到最大重试次数");
    }

    // 保存到数据库
    await db.insert(dailySentences).values({
      content: result.hitokoto,
      fetchData: JSON.stringify(result),
      source: result.from,
    });

    logger.info("每日一言已保存到数据库");

    return NextResponse.json(result);
  } catch (error) {
    logger.error({ error }, "每日一言API错误");

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "未知错误",
        message: "获取每日一言失败",
      },
      { status: 500 },
    );
  }
}
