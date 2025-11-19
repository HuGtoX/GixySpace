import { config } from "dotenv";
import { join } from "path";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq, sql } from "drizzle-orm";

// 加载 .env.local 文件
config({ path: join(process.cwd(), ".env.local") });

interface DailySentence {
  id: number;
  uuid: string;
  hitokoto: string;
  type: string;
  from: string;
  from_who: string | null;
  creator: string;
  creator_uid: number;
  reviewer: number;
  commit_from: string;
  created_at: string;
  length: number;
}

/**
 * 获取唯一的每日一言内容
 * @param db 数据库实例
 * @param maxRetries 最大重试次数
 * @returns 唯一的每日一言数据
 */
async function fetchUniqueDailySentence(
  db: any,
  maxRetries: number = 10,
): Promise<DailySentence> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      console.log(`第 ${i + 1} 次尝试获取每日一言...`);

      const response = await fetch("https://international.v1.hitokoto.cn?c=k");

      if (!response.ok) {
        throw new Error(`HTTP错误: ${response.status}`);
      }

      const result: DailySentence = await response.json();

      // 检查内容是否已存在
      const existingContent = await db.execute(
        sql`SELECT id FROM daily_sentences WHERE content = ${result.hitokoto} LIMIT 1`,
      );

      if (existingContent.length === 0) {
        console.log(
          `✓ 成功获取到唯一内容: "${result.hitokoto.substring(0, 30)}..."`,
        );
        return result;
      }

      console.log(`✗ 内容已存在，继续重试... (${i + 1}/${maxRetries})`);
    } catch (error) {
      console.error(`第 ${i + 1} 次获取失败:`, error);

      if (i === maxRetries - 1) {
        throw new Error(`获取失败，已达到最大重试次数 (${maxRetries})`);
      }
    }

    // 等待一小段时间再重试，避免请求过快
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  throw new Error("无法获取到唯一的每日一言内容");
}

/**
 * 主函数：执行每日一言获取任务
 */
async function main() {
  console.log("========================================");
  console.log("开始执行每日一言定时任务");
  console.log(
    `执行时间: ${new Date().toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" })}`,
  );
  console.log("========================================\n");

  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL 环境变量未设置");
  }

  const queryClient = postgres(databaseUrl);
  const db = drizzle({ client: queryClient });

  try {
    // 检查今天是否已有数据
    console.log("检查今天是否已有数据...");
    const todayData = await db.execute(
      sql`SELECT id, content FROM daily_sentences WHERE fetch_date = CURRENT_DATE LIMIT 1`,
    );

    if (todayData.length > 0) {
      console.log("✓ 今天已有数据，无需重复获取");
      console.log(
        `内容: "${(todayData[0] as any).content.substring(0, 50)}..."\n`,
      );
      return;
    }

    console.log("今天还没有数据，开始获取...\n");

    // 获取唯一的每日一言
    const result = await fetchUniqueDailySentence(db);

    // 保存到数据库
    console.log("\n保存数据到数据库...");
    await db.execute(
      sql`INSERT INTO daily_sentences (content, source, fetch_data, fetch_date) 
				VALUES (${result.hitokoto}, ${result.from}, ${JSON.stringify(result)}, CURRENT_DATE)`,
    );

    console.log("✓ 数据保存成功！");
    console.log("\n========================================");
    console.log("每日一言详情:");
    console.log(`内容: ${result.hitokoto}`);
    console.log(`来源: ${result.from}`);
    console.log(`作者: ${result.from_who || "未知"}`);
    console.log("========================================\n");
  } catch (error) {
    console.error("\n❌ 任务执行失败:");
    console.error(error);
    process.exit(1);
  } finally {
    await queryClient.end();
    console.log("数据库连接已关闭");
  }
}

// 执行主函数
main()
  .then(() => {
    console.log("\n✓ 定时任务执行完成");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ 定时任务执行失败:", error);
    process.exit(1);
  });
