import { fetchNewsWithCache } from "@/lib/cache/redis";
import {
  handleApiError,
  createSuccessResponse,
  InternalServerError,
} from "@/lib/errors/handler";

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
    const data = await fetchNewsWithCache(
      "xueqiu",
      async () => {
        const url =
          "https://stock.xueqiu.com/v5/stock/hot_stock/list.json?size=30&_type=10&type=10";

        // 获取cookie
        const cookieResponse = await fetch("https://xueqiu.com/hq");
        const cookie = cookieResponse.headers.getSetCookie();

        // 请求股票数据
        const response = await fetch(url, {
          headers: {
            cookie: cookie?.join("; ") || "",
          },
        });

        if (!response.ok) {
          throw new InternalServerError(
            `Failed to fetch Xueqiu hot stocks: ${response.status}`,
          );
        }

        const res: StockRes = await response.json();

        // 格式化结果
        return res.data.items
          .filter((item) => !item.ad)
          .map((item) => ({
            id: item.code,
            title: item.name,
            url: `https://xueqiu.com/s/${item.code}`,
            extra: {
              info: `${item.percent}% ${item.exchange}`,
            },
          }));
      },
      300, // 缓存5分钟
    );

    return createSuccessResponse(data);
  } catch (error) {
    return handleApiError(error, undefined, "/api/news?source=xueqiu");
  }
}
