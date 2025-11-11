import { NextResponse } from "next/server";
import { SixtySecondsData, HistoryTodayData } from "@gixy/types";
import axios from "@/lib/axios";
import { fetchNewsWithCache } from "@/lib/redisCache";

export interface SixtySecondsResponse {
  sixty: SixtySecondsData;
  history: HistoryTodayData;
}

export async function GET() {
  try {
    const data = await fetchNewsWithCache(
      "60s",
      async () => {
        const sixtyResult = await axios.get<SixtySecondsData>(
          "https://60s.viki.moe/v2/60s",
        );
        const historyResult = await axios.get<SixtySecondsData>(
          "https://60s.viki.moe/v2/today_in_history",
        );

        return {
          sixty: sixtyResult.data,
          history: historyResult.data,
        };
      },
      1200, // 缓存20分钟
    );

    return NextResponse.json(data);
  } catch (error) {
    console.error("获取60秒新闻失败:", error);
    return NextResponse.json(
      { success: false, message: "获取60秒新闻失败" },
      { status: 500 },
    );
  }
}
