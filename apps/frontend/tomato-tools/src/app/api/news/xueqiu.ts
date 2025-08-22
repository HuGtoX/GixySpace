import { NextResponse } from "next/server";

interface StockRes {
  data: {
    items: {
      code: string;
      name: string;
      percent: number;
      exchange: string;
      ad: number;
    }[];
  };
}

export async function GET() {
  try {
    const url = 'https://stock.xueqiu.com/v5/stock/hot_stock/list.json?size=30&_type=10&type=10';
    
    // 获取cookie
    const cookieResponse = await fetch('https://xueqiu.com/hq');
    const cookie = cookieResponse.headers.getSetCookie();
    
    // 请求股票数据
    const response = await fetch(url, {
      headers: {
        cookie: cookie?.join('; ') || ''
      }
    });
    
    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status}`);
    }
    
    const res: StockRes = await response.json();
    
    // 格式化结果
    const result = res.data.items
      .filter((item) => !item.ad)
      .map((item) => ({
        id: item.code,
        title: item.name,
        url: `https://xueqiu.com/s/${item.code}`,
        extra: {
          info: `${item.percent}% ${item.exchange}`
        }
      }));
    
    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('获取雪球股票热点失败:', error);
    return NextResponse.json(
      { success: false, message: '获取雪球股票热点失败' },
      { status: 500 }
    );
  }
}