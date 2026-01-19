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

/**
 * 生成天气AI总结的缓存键
 * @param location 地区名称
 * @returns 缓存键
 */
export function generateWeatherSummaryCacheKey(location: string): string {
  return `weather:summary:${location}`;
}

// 天气AI总结缓存时间（2小时）
export const WEATHER_SUMMARY_CACHE_TTL = 7200;

// 获取数据并缓存
export async function fetchNewsWithCache(
  source: string,
  fetchFn: () => Promise<any>,
  cacheTTL: number = 300,
) {
  const cacheKey = generateNewsCacheKey(source);
  const cached = await getCache<any>(cacheKey);

  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {
      return cached;
    }
  }
  const data = await fetchFn();
  await setCache(cacheKey, JSON.stringify(data), cacheTTL);
  return data;
}
