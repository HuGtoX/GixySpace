import { NextRequest, NextResponse } from "next/server";
import type { CitySearchResponse, ApiResponse, Language } from "../../types";

const baseUrl = process.env.HF_BASEURL;
const key = process.env.QWEATHER_KEY;

/**
 * GET /api/weather/cities - 搜索城市信息
 *
 * 查询参数:
 * - location: 城市名称（必选）
 * - number: 返回结果数量，1-20（可选，默认10）
 * - lang: 多语言设置（可选，默认zh）
 *
 * 示例:
 * - /api/weather/cities?location=北京
 * - /api/weather/cities?location=beijing&number=5&lang=en
 * - /api/weather/cities?location=上海&number=20
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const location = searchParams.get("location");
    const numberParam = searchParams.get("number");
    const lang = (searchParams.get("lang") as Language) || "zh";

    // 验证必选参数
    if (!location || location.trim() === "") {
      return NextResponse.json(
        {
          success: false,
          error: "缺少必选参数 location（城市名称）",
          code: "MISSING_LOCATION_PARAM",
        } as ApiResponse,
        { status: 400 },
      );
    }

    // 验证返回结果数量
    let number = 10; // 默认10个结果
    if (numberParam) {
      const numberNum = parseInt(numberParam, 10);
      if (isNaN(numberNum) || numberNum < 1 || numberNum > 20) {
        return NextResponse.json(
          {
            success: false,
            error: "返回结果数量必须在1-20之间",
            code: "INVALID_NUMBER_PARAM",
          } as ApiResponse,
          { status: 400 },
        );
      }
      number = numberNum;
    }

    // 验证API密钥
    if (!key) {
      return NextResponse.json(
        {
          success: false,
          error: "未配置和风天气 API 密钥",
          code: "MISSING_API_KEY",
        } as ApiResponse,
        { status: 500 },
      );
    }

    // 构建请求参数
    const searchParams_api = new URLSearchParams({
      location: location.trim(),
      key: key,
      lang: lang,
      number: number.toString(),
    });

    // 请求城市搜索API
    const cityRes = await fetch(
      `${baseUrl}/geo/v2/city/lookup?${searchParams_api.toString()}`,
    );

    if (!cityRes.ok) {
      throw new Error(
        `城市搜索 API 请求失败: ${cityRes.status} ${cityRes.statusText}`,
      );
    }

    const cityData: CitySearchResponse = await cityRes.json();

    // 检查城市搜索API响应状态
    if (cityData.code !== "200") {
      let errorMessage = "城市搜索失败";
      switch (cityData.code) {
        case "404":
          errorMessage = "未找到匹配的城市";
          break;
        case "400":
          errorMessage = "搜索参数错误";
          break;
        case "401":
          errorMessage = "API密钥认证失败";
          break;
        case "402":
          errorMessage = "超过访问次数或余额不足";
          break;
        case "403":
          errorMessage = "无访问权限";
          break;
        case "429":
          errorMessage = "请求过于频繁";
          break;
        case "500":
          errorMessage = "服务器内部错误";
          break;
        default:
          errorMessage = `城市搜索失败: ${cityData.code}`;
      }

      return NextResponse.json(
        {
          success: false,
          error: errorMessage,
          code: cityData.code,
        } as ApiResponse,
        { status: cityData.code === "404" ? 404 : 400 },
      );
    }

    // 返回符合文档规范的响应
    const response: ApiResponse<CitySearchResponse> = {
      success: true,
      data: cityData,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("City Search API error:", error);

    const errorResponse: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : "未知错误",
      code: "INTERNAL_ERROR",
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}

/**
 * POST /api/weather/cities - 批量搜索城市信息
 *
 * 请求体:
 * {
 *   "locations": ["北京", "上海", "广州"],
 *   "number": 5,
 *   "lang": "zh"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { locations, number = 10, lang = "zh" } = body;

    // 验证必选参数
    if (!locations || !Array.isArray(locations) || locations.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "缺少必选参数 locations（城市名称数组）",
          code: "MISSING_LOCATIONS_PARAM",
        } as ApiResponse,
        { status: 400 },
      );
    }

    // 验证数组长度
    if (locations.length > 10) {
      return NextResponse.json(
        {
          success: false,
          error: "一次最多只能搜索10个城市",
          code: "TOO_MANY_LOCATIONS",
        } as ApiResponse,
        { status: 400 },
      );
    }

    // 验证返回结果数量
    if (typeof number !== "number" || number < 1 || number > 20) {
      return NextResponse.json(
        {
          success: false,
          error: "返回结果数量必须在1-20之间",
          code: "INVALID_NUMBER_PARAM",
        } as ApiResponse,
        { status: 400 },
      );
    }

    // 验证API密钥
    if (!key) {
      return NextResponse.json(
        {
          success: false,
          error: "未配置和风天气 API 密钥",
          code: "MISSING_API_KEY",
        } as ApiResponse,
        { status: 500 },
      );
    }

    // 并行搜索所有城市
    const searchPromises = locations.map(async (location: string) => {
      try {
        const searchParams = new URLSearchParams({
          location: location.trim(),
          key: key,
          lang: lang,
          number: number.toString(),
        });

        const cityRes = await fetch(
          `${baseUrl}/geo/v2/city/lookup?${searchParams.toString()}`,
        );

        if (!cityRes.ok) {
          throw new Error(`城市搜索 API 请求失败: ${cityRes.status}`);
        }

        const cityData: CitySearchResponse = await cityRes.json();

        return {
          query: location,
          success: cityData.code === "200",
          data: cityData.code === "200" ? cityData : null,
          error: cityData.code !== "200" ? `搜索失败: ${cityData.code}` : null,
        };
      } catch (error) {
        return {
          query: location,
          success: false,
          data: null,
          error: error instanceof Error ? error.message : "未知错误",
        };
      }
    });

    const results = await Promise.all(searchPromises);

    // 返回批量搜索结果
    const response: ApiResponse<typeof results> = {
      success: true,
      data: results,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Batch City Search API error:", error);

    const errorResponse: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : "未知错误",
      code: "INTERNAL_ERROR",
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}
