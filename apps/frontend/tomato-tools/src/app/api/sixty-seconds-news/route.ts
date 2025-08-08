import { NextRequest, NextResponse } from "next/server";
import { SixtySecondsData, HistoryTodayData } from "@gixy/types";
import axios from "@/lib/axios";

export interface SixtySecondsResponse {
  sixty: SixtySecondsData;
  history: HistoryTodayData;
}

export async function GET(request: NextRequest) {
  const sixtyResult = await axios.get<SixtySecondsData>(
    "https://60s.viki.moe/v2/60s",
  );
  const historyResult = await axios.get<SixtySecondsData>(
    "https://60s.viki.moe/v2/today_in_history",
  );

  const res = sixtyResult.data;
  return NextResponse.json({
    sixty: res,
    history: historyResult.data,
  });
}
