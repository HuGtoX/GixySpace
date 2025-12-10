import { NextRequest, NextResponse } from "next/server";
import type { CitySearchResponse, ApiResponse } from "../../types";
import fs from "fs/promises";
import path from "path";

// 构建public目录下文件的完整路径
const getPublicFilePath = (filename: string) => {
  return path.join(process.cwd(), "public", "static", filename);
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get("name");

    // 读取public/static目录下的JSON文件
    const filePath = getPublicFilePath("China-City-List-latest.json");
    const fileContent = await fs.readFile(filePath, "utf-8");
    const cityData = JSON.parse(fileContent);

    // 模糊匹配城市
    const cities = name
      ? cityData.filter(
          (city: any) =>
            city.field2.includes(name) ||
            city.field3.includes(name) ||
            city.field8.includes(name) ||
            city.field10.includes(name),
        )
      : cityData;

    // 返回符合文档规范的响应
    const response: ApiResponse<CitySearchResponse> = {
      success: true,
      data: cities,
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
