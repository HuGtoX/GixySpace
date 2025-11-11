import { fetchNewsWithCache } from "@/lib/redisCache";
import {
  handleApiError,
  createSuccessResponse,
  InternalServerError,
} from "@/lib/errorHandler";

interface Res {
  data: {
    content: {
      title: string;
      content_id: string;
    };
  }[];
}

export async function GET() {
  try {
    const data = await fetchNewsWithCache(
      "juejin",
      async () => {
        const url =
          "https://api.juejin.cn/content_api/v1/content/article_rank?category_id=1&type=hot&spider=0";

        const response = await fetch(url);

        if (!response.ok) {
          throw new InternalServerError(
            `Failed to fetch Juejin hot topics: ${response.status}`,
          );
        }

        const res: Res = await response.json();

        // 格式化结果
        return res.data.map((item) => ({
          id: item.content.content_id,
          title: item.content.title,
          url: `https://juejin.cn/post/${item.content.content_id}`,
        }));
      },
      300, // 缓存5分钟
    );

    return createSuccessResponse(data);
  } catch (error) {
    return handleApiError(error, undefined, "/api/news?source=juejin");
  }
}
