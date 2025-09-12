import { Redis } from "@upstash/redis";

// 初始化Redis客户端
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// 缓存时间（3分钟）
const CACHE_TTL = 180;

/**
 * 获取缓存数据
 * @param key 缓存键
 * @returns 缓存数据或null
 */
export async function getCache<T>(key: string): Promise<T | null> {
  try {
    const cached = await redis.get(key);
    return cached as T;
  } catch (error) {
    console.error("Redis缓存获取失败:", error);
    return null;
  }
}

/**
 * 设置缓存数据
 * @param key 缓存键
 * @param data 要缓存的数据
 * @param ttl 缓存时间（秒），默认为3分钟
 */
export async function setCache(
  key: string,
  data: any,
  ttl: number = CACHE_TTL,
): Promise<void> {
  try {
    await redis.setex(key, ttl, data);
  } catch (error) {
    console.error("Redis缓存设置失败:", error);
  }
}

/**
 * 生成新闻API的缓存键
 * @param source 新闻源
 * @returns 缓存键
 */
export function generateNewsCacheKey(source: string): string {
  return `news:${source}`;
}
