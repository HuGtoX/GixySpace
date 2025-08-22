import { NextResponse } from "next/server";

interface Res {
  data: {
    word_list: {
      sentence_id: string;
      word: string;
      event_time: string;
      hot_value: string;
    }[];
  };
}

export async function GET() {
  try {
    const url = 'https://www.douyin.com/aweme/v1/web/hot/search/list/?device_platform=webapp&aid=6383&channel=channel_pc_web&detail_list=1';
    
    // 获取cookie
    const cookieResponse = await fetch(
      'https://www.douyin.com/passport/general/login_guiding_strategy/?aid=6383'
    );
    const cookie = cookieResponse.headers.getSetCookie();
    
    // 请求热点数据
    const response = await fetch(url, {
      headers: {
        cookie: cookie?.join('; ') || ''
      }
    });
    
    const res: Res = await response.json();
    
    // 格式化结果
    const result = res.data.word_list.map((item) => ({
      id: item.sentence_id,
      title: item.word,
      url: `https://www.douyin.com/hot/${item.sentence_id}`,
      hotValue: item.hot_value,
      eventTime: item.event_time
    }));
    
    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('获取抖音热点失败:', error);
    return NextResponse.json(
      { success: false, message: '获取抖音热点失败' },
      { status: 500 }
    );
  }
}