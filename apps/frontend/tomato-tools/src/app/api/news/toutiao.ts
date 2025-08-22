import { NextResponse } from "next/server";

export interface ImageInfo {
  uri: string;
  url: string;
  width: number;
  height: number;
  url_list: Array<{ url: string }>;
  image_type: number;
}

export interface ToutiaoNewsItem {
  ClusterId: number;
  Title: string;
  LabelUrl: string;
  LabelUri: ImageInfo;
  Label: string;
  Url: string;
  HotValue: string;
  Schema: string;
  ClusterIdStr: string;
  ClusterType: number;
  QueryWord: string;
  InterestCategory: string[];
  LabelDesc: string;
}

export async function GET() {
  try {
    const response = await fetch(
      "https://www.toutiao.com/hot-event/hot-board/?origin=toutiao_pc&_signature=_02B4Z6wo00f0184sOpAAAIDAkbkxXJU36PPOCD4AAJs3d7YHjB8DOmdGv0uwdv1c4pMCrsFdXAa-GSelGuXGuyJYrPvkql3.wfHxUPJvf2HaQaKf8VP3KlstrfLD0Oc9MGM9OaPl9bqDfpuwd0",
      {
        headers: {
          accept: "application/json, text/plain, */*",
          "accept-language": "zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6",
          priority: "u=1, i",
          "sec-ch-ua":
            '"Not;A=Brand";v="99", "Microsoft Edge";v="139", "Chromium";v="139"',
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": '"Windows"',
          "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "same-origin",
        },
        referrer: "https://www.toutiao.com/",
        body: null,
        method: "GET",
        mode: "cors",
        credentials: "include",
      },
    );

    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status}`);
    }
    const resp: { data: ToutiaoNewsItem[] } = await response.json();
    const data = resp.data;

    return NextResponse.json({
      success: true,
      data: data.map((item) => ({
        id: item.ClusterId,
        title: item.QueryWord,
        url: item.Url,
        extra: {
          icon: item.LabelUri.url
            ? {
                url: item.LabelUri.url,
                scale: 1.2,
              }
            : undefined,
          hotValue: item.HotValue,
        },
      })),
    });
  } catch (error) {
    console.error("获取60秒新闻失败:", error);
    return NextResponse.json(
      { success: false, message: "获取60秒新闻失败" },
      { status: 500 },
    );
  }
}
