import { NextResponse } from "next/server";

// 60s API 返回的数据结构
export interface SixtySecondsApiResponse {
    code: number;
    message: string;
    data: CurrencyData;
}

export interface CurrencyData {
    base_code: string;
    updated: string;
    updated_at: number;
    next_updated: string;
    next_updated_at: number;
    rates: RateElement[];
}

export interface RateElement {
    currency: string;
    rate: number;
}


// 货币汇率API接口
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const base = searchParams.get("base") || "CNY";

    // 调用60s API的货币汇率接口
    const response = await fetch(
      `https://60s.viki.moe/v2/exchange-rate?base=${base}`,
      {
        headers: {
          "User-Agent": "TomatoTools/1.0",
        },
        // 缓存5分钟
        next: { revalidate: 300 },
      }
    );

    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status}`);
    }

    const apiResponse: SixtySecondsApiResponse = await response.json();

    // 60s API 使用 code: 200 表示成功
    if (apiResponse.code !== 200) {
      throw new Error(apiResponse.message || "获取汇率数据失败");
    }

    return NextResponse.json({
      success: true,
      data: apiResponse.data,
      message: "获取汇率数据成功",
    });
  } catch (error) {
    console.error("Currency API error:", error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "未知错误",
        message: "获取汇率数据失败",
      },
      { status: 500 }
    );
  }
}
