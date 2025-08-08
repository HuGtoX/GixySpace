/**
 * 通用Session存储工具
 * 提供缓存获取、设置、清除等功能，不涉及具体业务逻辑
 */

/**
 * 从SessionStorage获取缓存数据
 * @param cacheKey 缓存键
 * @param timestampKey 时间戳键
 * @param expireMinutes 过期时间(分钟)
 * @returns 缓存数据，如果不存在或已过期则返回null
 */
export const getCachedData = <T>(
  cacheKey: string,
  timestampKey: string,
  expireMinutes: number
): T | null => {
  const cachedData = sessionStorage.getItem(cacheKey);
  const cachedTimestamp = sessionStorage.getItem(timestampKey);
  const now = Date.now();

  if (cachedData && cachedTimestamp) {
    const cacheAgeMinutes = (now - parseInt(cachedTimestamp)) / (1000 * 60);
    if (cacheAgeMinutes < expireMinutes) {
      return JSON.parse(cachedData) as T;
    }
  }

  return null;
};

/**
 * 更新SessionStorage缓存数据
 * @param cacheKey 缓存键
 * @param timestampKey 时间戳键
 * @param data 要缓存的数据
 */
export const updateCachedData = <T>(
  cacheKey: string,
  timestampKey: string,
  data: T
): void => {
  sessionStorage.setItem(cacheKey, JSON.stringify(data));
  sessionStorage.setItem(timestampKey, Date.now().toString());
};

/**
 * 清除指定的SessionStorage缓存
 * @param cacheKey 缓存键
 * @param timestampKey 时间戳键
 */
export const clearCachedData = (
  cacheKey: string,
  timestampKey: string
): void => {
  sessionStorage.removeItem(cacheKey);
  sessionStorage.removeItem(timestampKey);
};

/**
 * 缓存管理类
 * 提供更面向对象的方式管理缓存
 */
export class SessionCacheManager<T> {
  private cacheKey: string;
  private timestampKey: string;
  private expireMinutes: number;

  /**
   * 构造函数
   * @param cacheKey 缓存键
   * @param timestampKey 时间戳键
   * @param expireMinutes 过期时间(分钟)
   */
  constructor(
    cacheKey: string,
    timestampKey: string,
    expireMinutes: number
  ) {
    this.cacheKey = cacheKey;
    this.timestampKey = timestampKey;
    this.expireMinutes = expireMinutes;
  }

  /**
   * 获取缓存数据
   * @returns 缓存数据，如果不存在或已过期则返回null
   */
  get(): T | null {
    return getCachedData<T>(
      this.cacheKey,
      this.timestampKey,
      this.expireMinutes
    );
  }

  /**
   * 更新缓存数据
   * @param data 要缓存的数据
   */
  set(data: T): void {
    updateCachedData<T>(this.cacheKey, this.timestampKey, data);
  }

  /**
   * 清除缓存
   */
  clear(): void {
    clearCachedData(this.cacheKey, this.timestampKey);
  }
}