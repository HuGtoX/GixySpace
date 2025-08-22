import { NextResponse } from "next/server";
import { SixtySecondsData } from "@gixy/types";

export async function GET() {
  try {
    const response = await fetch('https://60s.viki.moe/v2/60s');
    
    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status}`);
    }
    
    const data: SixtySecondsData = await response.json();
    
    return NextResponse.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('获取60秒新闻失败:', error);
    return NextResponse.json(
      { success: false, message: '获取60秒新闻失败' },
      { status: 500 }
    );
  }
}