import { GET as getDouyinNews } from "@/lib/api/news/sources/douyin";
import { GET as getWeiboNews } from "@/lib/api/news/sources/weibo";
import { GET as getZhihuNews } from "@/lib/api/news/sources/zhihu";
import { GET as get60sNews } from "@/lib/api/news/sources/60s";
import { GET as getXueqiuNews } from "@/lib/api/news/sources/xueqiu";
import { GET as getJuejinNews } from "@/lib/api/news/sources/juejin";
import { GET as getToutiaoNews } from "@/lib/api/news/sources/toutiao";
import { handleApiError, BadRequestError } from "@/lib/errors/handler";

// 新闻API路由处理
export async function GET(request: Request) {
  try {
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
        throw new BadRequestError(`不支持的新闻源: ${source}`);
    }
  } catch (error) {
    return handleApiError(error, undefined, "/api/news");
  }
}
