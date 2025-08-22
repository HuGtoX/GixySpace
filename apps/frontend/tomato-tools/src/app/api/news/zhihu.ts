import { NextResponse } from "next/server";

interface ZhihuRes {
  data: {
    type: 'hot_list_feed';
    style_type: '1';
    feed_specific: {
      answer_count: number;
    };
    target: {
      title_area: {
        text: string;
      };
      excerpt_area: {
        text: string;
      };
      image_area: {
        url: string;
      };
      metrics_area: {
        text: string;
        font_color: string;
        background: string;
        weight: string;
      };
      label_area: {
        type: 'trend';
        trend: number;
        night_color: string;
        normal_color: string;
      };
      link: {
        url: string;
      };
    };
  }[];
}

// 超时控制函数
const withTimeout = <T,>(promise: Promise<T>, timeoutMs = 5000): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('请求超时')), timeoutMs)
    )
  ]);
};

export async function GET() {
  try {
    const url = 'https://www.zhihu.com/api/v3/feed/topstory/hot-list-web?limit=20&desktop=true';
    
    const response = await withTimeout(
      fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
          Referer: 'https://www.zhihu.com/'
        },
        cache: 'no-store'
      })
    );

    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status}`);
    }

    const data: ZhihuRes = await response.json();

    const result = data.data.map((item) => {
      const idMatch = item.target.link.url.match(/(\d+)$/);
      return {
        id: idMatch?.[1] ?? item.target.link.url,
        title: item.target.title_area.text,
        url: item.target.link.url,
        extra: {
          info: item.target.metrics_area.text,
          excerpt: item.target.excerpt_area.text,
          image: item.target.image_area?.url
        }
      };
    });

    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('获取知乎热点失败:', error);
    return NextResponse.json(
      { success: false, message: '获取知乎热点失败' },
      { status: 500 }
    );
  }
}