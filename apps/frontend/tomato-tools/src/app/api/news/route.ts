import { NextResponse } from "next/server";
import { GET as getDouyinNews } from "./douyin";
import { GET as getWeiboNews } from "./weibo";
import { GET as getZhihuNews } from "./zhihu";
import { GET as get60sNews } from "./60s";
import { GET as getXueqiuNews } from "./xueqiu";
import { GET as getJuejinNews } from "./juejin";
import { GET as getToutiaoNews } from "./toutiao";

// 新闻API路由处理
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const source = searchParams.get("source") || "douyin";

  switch (source) {
    case "douyin":
      return getDouyinNews();
    case "weibo":
      return getWeiboNews();
    case "zhihu":
      return getZhihuNews();
    case "60s":
      return get60sNews();
    case "xueqiu":
      return getXueqiuNews();
    case "juejin":
      return getJuejinNews();
    case "toutiao":
      return getToutiaoNews();
    default:
      return NextResponse.json(
        { success: false, message: "不支持的新闻源" },
        { status: 400 },
      );
  }
}
