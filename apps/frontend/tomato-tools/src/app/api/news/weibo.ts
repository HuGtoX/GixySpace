import { NextResponse } from "next/server";

interface Res {
  ok: number; // 1 is ok
  data: {
    realtime: {
      num: number;
      emoticon: string;
      icon?: string; // 热，新 icon url
      icon_width: number;
      icon_height: number;
      is_ad?: number; // 1
      note: string;
      small_icon_desc: string;
      icon_desc?: string; // 如果是 荐 ,就是广告
      topic_flag: number;
      icon_desc_color: string;
      flag: number;
      word_scheme: string;
      small_icon_desc_color: string;
      realpos: number;
      label_name: string;
      word: string; // 热搜词
      rank: number;
    }[];
  };
}

export async function GET() {
  try {
    const response = await fetch('https://weibo.com/ajax/side/hotSearch', {
      headers: {
        accept: 'application/json, text/plain, */*',
        'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6',
        'client-version': 'v2.47.96',
        priority: 'u=1, i',
        'sec-ch-ua': '"Microsoft Edge";v="137", "Chromium";v="137", "Not/A)Brand";v="24"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin',
        'x-requested-with': 'XMLHttpRequest'
      },
      referrer: 'https://weibo.com/hot/search',
      referrerPolicy: 'strict-origin-when-cross-origin',
      method: 'GET',
      mode: 'cors',
      credentials: 'include'
    });

    const res: Res = await response.json();

    if (res.ok !== 1) {
      throw new Error('微博API返回错误');
    }

    const result = res.data.realtime
      .filter((item) => !item.is_ad)
      .map((item) => {
        const keyword = item.word_scheme ? item.word_scheme : `#${item.word}#`;
        return {
          id: item.word,
          title: item.word,
          url: `https://s.weibo.com/weibo?q=${encodeURIComponent(keyword)}`,
          mobileUrl: `https://m.weibo.cn/search?containerid=231522type%3D1%26q%3D${encodeURIComponent(keyword)}&_T_WM=16922097837&v_p=42`,
          extra: {
            icon: item.icon ? {
              url: item.icon,
              scale: 1.5
            } : undefined,
            rank: item.rank,
            hotValue: item.num
          }
        };
      });

    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('获取微博热点失败:', error);
    return NextResponse.json(
      { success: false, message: '获取微博热点失败' },
      { status: 500 }
    );
  }
}