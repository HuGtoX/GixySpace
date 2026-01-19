import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema/schema";
import { createModuleLogger } from "@/lib/logger";

const log = createModuleLogger("drizzle-client");

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

// 创建数据库连接
const client = postgres(process.env.DATABASE_URL, {
  prepare: false,
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

// 创建Drizzle实例
export const db = drizzle(client, {
  schema,
  casing: "snake_case",
});

// 创建带有日志的数据库客户端
export const createDbClient = (requestId?: string) => {
  const logger = requestId ? log.child({ requestId }) : log;

  return {
    db,
    logger,
    // 执行事务的辅助方法
    async transaction<T>(
      fn: (tx: PostgresJsDatabase<typeof schema>) => Promise<T>,
    ): Promise<T> {
      logger.debug("Starting database transaction");
      try {
        const result = await db.transaction(fn);
        logger.debug("Database transaction completed successfully");
        return result;
      } catch (error) {
        logger.error({ error }, "Database transaction failed");
        throw error;
      }
    },
  };
};

export type DbClient = ReturnType<typeof createDbClient>;
export default db;
