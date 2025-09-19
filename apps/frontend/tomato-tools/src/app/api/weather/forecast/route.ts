import { NextRequest, NextResponse } from "next/server";
import type {
  WeatherForecastResponse,
  ApiResponse,
  WeatherForecastInfoResponse,
  LocationInfo,
  Language,
  Unit,
} from "../../types";

const baseUrl = process.env.HF_BASEURL;
const key = process.env.QWEATHER_KEY;

/**
 * 验证位置参数格式
 */
function validateLocationParam(location: string): {
  isValid: boolean;
  type: "coordinate" | "locationId";
  lat?: string;
  lon?: string;
} {
  // 检查是否为坐标格式 (经度,纬度)
  const coordMatch = location.match(/^(-?\d+\.?\d*),(-?\d+\.?\d*)$/);
  if (coordMatch) {
    const [, lon, lat] = coordMatch;
    const lonNum = parseFloat(lon);
    const latNum = parseFloat(lat);

    // 验证经纬度范围
    if (lonNum >= -180 && lonNum <= 180 && latNum >= -90 && latNum <= 90) {
      return {
        isValid: true,
        type: "coordinate",
        lat: parseFloat(lat).toFixed(2),
        lon: parseFloat(lon).toFixed(2),
      };
    }
  }

  // 检查是否为LocationID格式 (数字)
  if (/^\d+$/.test(location)) {
    return {
      isValid: true,
      type: "locationId",
    };
  }

  return { isValid: false, type: "locationId" };
}

/**
 * 根据经纬度获取位置ID和城市信息
 */
async function getLocationInfo(
  lat: string,
  lon: string,
  key: string,
  lang: Language = "zh",
): Promise<LocationInfo> {
  const geoRes = await fetch(
    `${baseUrl}/geo/v2/city/lookup?location=${lon},${lat}&key=${key}&lang=${lang}`,
  );

  if (!geoRes.ok) {
    throw new Error("地理编码 API 请求失败");
  }

  const geoData = await geoRes.json();

  if (geoData.code !== "200" || !geoData.location?.[0]) {
    throw new Error("无法获取该坐标的位置信息");
  }

  const location = geoData.location[0];
  return {
    id: location.id,
    latitude: lat,
    longitude: lon,
    city: location.name,
    country: location.country,
    address: `${location.country} ${location.adm1} ${location.adm2} ${location.name}`,
  };
}

/**
 * 根据IP地址获取地理位置信息
 */
async function getLocationFromIP(request: NextRequest): Promise<{
  lat: string;
  lon: string;
  city: string;
  country: string;
}> {
  try {
    // 尝试从请求头获取真实IP
    const forwarded = request.headers.get("x-forwarded-for");
    const realIp = request.headers.get("x-real-ip");
    const ip = forwarded?.split(",")[0] || realIp || "127.0.0.1";

    // 如果是本地IP，返回默认位置（北京）
    if (ip === "127.0.0.1" || ip === "::1" || ip.startsWith("192.168.")) {
      return {
        lat: "39.90",
        lon: "116.41",
        city: "北京",
        country: "中国",
      };
    }

    // 使用免费的IP地理位置服务
    const geoRes = await fetch(`http://ip-api.com/json/${ip}?lang=zh-CN`);
    if (geoRes.ok) {
      const geoData = await geoRes.json();
      if (geoData.status === "success") {
        return {
          lat: geoData.lat.toFixed(2),
          lon: geoData.lon.toFixed(2),
          city: geoData.city || "未知城市",
          country: geoData.country || "未知国家",
        };
      }
    }
  } catch (error) {
    console.warn("Failed to get location from IP:", error);
  }

  // 如果获取失败，返回默认位置（北京）
  return {
    lat: "39.90",
    lon: "116.41",
    city: "北京",
    country: "中国",
  };
}

/**
 * GET /api/weather/forecast - 获取天气预报
 *
 * 查询参数:
 * - location: LocationID或经纬度坐标（可选，如果不提供则根据IP自动获取）
 * - days: 预报天数，1-15天（可选，默认7天）
 * - lang: 多语言设置（可选，默认zh）
 * - unit: 数据单位设置（可选，默认m）
 *
 * 示例:
 * - /api/weather/forecast?location=101010100&days=7
 * - /api/weather/forecast?location=116.41,39.92&days=3&lang=en
 * - /api/weather/forecast （自动根据IP获取位置，7天预报）
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const locationParam = searchParams.get("location");
    const daysParam = searchParams.get("days");
    const lang = (searchParams.get("lang") as Language) || "zh";
    const unit = (searchParams.get("unit") as Unit) || "m";

    // 验证预报天数
    let days = 7; // 默认7天
    if (daysParam) {
      const daysNum = parseInt(daysParam, 10);
      if (isNaN(daysNum) || daysNum < 1 || daysNum > 15) {
        return NextResponse.json(
          {
            success: false,
            error: "预报天数必须在1-15之间",
            code: "INVALID_DAYS_PARAM",
          } as ApiResponse,
          { status: 400 },
        );
      }
      days = daysNum;
    }

    let locationInfo: LocationInfo;
    let finalLocationParam: string;

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

    // 处理位置参数
    if (locationParam) {
      const validation = validateLocationParam(locationParam);

      if (!validation.isValid) {
        return NextResponse.json(
          {
            success: false,
            error:
              "位置参数格式错误。请使用LocationID（如：101010100）或经纬度坐标（如：116.41,39.92）",
            code: "INVALID_LOCATION_FORMAT",
          } as ApiResponse,
          { status: 400 },
        );
      }

      if (
        validation.type === "coordinate" &&
        validation.lat &&
        validation.lon
      ) {
        // 坐标格式，需要获取LocationID和城市信息
        locationInfo = await getLocationInfo(
          validation.lat,
          validation.lon,
          key,
          lang,
        );
        finalLocationParam = locationInfo.id!;
      } else {
        // LocationID格式，直接使用
        finalLocationParam = locationParam;
        locationInfo = {
          id: locationParam,
          latitude: "0",
          longitude: "0",
          city: "未知城市",
          country: "未知国家",
        };
      }
    } else {
      // 没有提供位置参数，根据IP自动获取
      const ipLocation = await getLocationFromIP(request);
      locationInfo = await getLocationInfo(
        ipLocation.lat,
        ipLocation.lon,
        key,
        lang,
      );
      finalLocationParam = locationInfo.id!;
    }

    // 构建请求参数
    const forecastParams = new URLSearchParams({
      location: finalLocationParam,
      key: key,
      lang: lang,
      unit: unit,
    });

    // 根据天数选择合适的API端点
    let apiEndpoint: string;
    if (days <= 3) {
      apiEndpoint = `${baseUrl}/v7/weather/3d?${forecastParams.toString()}`;
    } else if (days <= 7) {
      apiEndpoint = `${baseUrl}/v7/weather/7d?${forecastParams.toString()}`;
    } else if (days <= 10) {
      apiEndpoint = `${baseUrl}/v7/weather/10d?${forecastParams.toString()}`;
    } else {
      apiEndpoint = `${baseUrl}/v7/weather/15d?${forecastParams.toString()}`;
    }

    // 请求天气预报数据
    const forecastRes = await fetch(apiEndpoint);

    if (!forecastRes.ok) {
      throw new Error(
        `天气预报 API 请求失败: ${forecastRes.status} ${forecastRes.statusText}`,
      );
    }

    const forecast: WeatherForecastResponse = await forecastRes.json();

    // 检查天气预报API响应状态
    if (forecast.code !== "200") {
      return NextResponse.json(
        {
          success: false,
          error: `天气预报数据获取失败: ${forecast.code}`,
          code: forecast.code,
        } as ApiResponse,
        { status: 400 },
      );
    }

    // 如果请求的天数少于返回的数据，截取对应天数
    if (forecast.daily && forecast.daily.length > days) {
      forecast.daily = forecast.daily.slice(0, days);
    }

    // 返回符合文档规范的响应
    const response: ApiResponse<WeatherForecastInfoResponse> = {
      success: true,
      data: {
        location: locationInfo,
        forecast: forecast,
        updateTime: new Date().toISOString(),
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Weather Forecast API error:", error);

    const errorResponse: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : "未知错误",
      code: "INTERNAL_ERROR",
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}
