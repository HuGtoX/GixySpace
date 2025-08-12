import { NextResponse } from "next/server";
import { Wallpaper } from "@gixy/types";
import axios from "@/lib/axios";

export async function GET() {
  const res = await axios.get<Wallpaper>("https://60s.viki.moe/v2/bing");
  return NextResponse.json(res.data);
}
