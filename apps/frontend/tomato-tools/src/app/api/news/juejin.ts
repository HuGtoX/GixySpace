import { NextResponse } from "next/server";
import { getCache, setCache, generateNewsCacheKey } from "@/lib/redis-cache";

interface Res {
  data: {
    content: {
      title: string;
      content_id: string;
    };
  }[];
}

export async function GET() {
  try {
    const cacheKey = generateNewsCacheKey('juejin');
    
    // 检查缓存
    const cachedData = await getCache(cacheKey);
    if (cachedData) {
      return NextResponse.json({
        success: true,
        data: cachedData,
        cached: true
      });
    }

    const url = 'https://api.juejin.cn/content_api/v1/content/article_rank?category_id=1&type=hot&spider=0';
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status}`);
    }
    
    const res: Res = await response.json();
    
    // 格式化结果
    const result = res.data.map((item) => ({
      id: item.content.content_id,
      title: item.content.title,
      url: `https://juejin.cn/post/${item.content.content_id}`
    }));
   
    // 设置缓存
    await setCache(cacheKey, result);
    
    return NextResponse.json({
      success: true,
      data: result,
      cached: false
    });
  } catch (error) {
    console.error('获取掘金热点失败:', error);
    return NextResponse.json(
      { success: false, message: '获取掘金热点失败' },
      { status: 500 }
    );
  }
}