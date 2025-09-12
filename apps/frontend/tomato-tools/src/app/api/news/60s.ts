import { NextResponse } from "next/server";
import { SixtySecondsData } from "@gixy/types";
import { getCache, setCache, generateNewsCacheKey } from "@/lib/redis-cache";

export async function GET() {
  try {
    const cacheKey = generateNewsCacheKey('60s');
    
    // 检查缓存
    const cachedData = await getCache<SixtySecondsData>(cacheKey);
    if (cachedData) {
      return NextResponse.json({
        success: true,
        data: cachedData,
        cached: true
      });
    }

    const response = await fetch('https://60s.viki.moe/v2/60s');
    
    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status}`);
    }
    
    const data: SixtySecondsData = await response.json();
    
    // 设置缓存
    await setCache(cacheKey, data);
    
    return NextResponse.json({
      success: true,
      data,
      cached: false
    });
  } catch (error) {
    console.error('获取60秒新闻失败:', error);
    return NextResponse.json(
      { success: false, message: '获取60秒新闻失败' },
      { status: 500 }
    );
  }
}