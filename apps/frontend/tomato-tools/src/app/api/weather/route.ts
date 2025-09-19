import { NextRequest, NextResponse } from "next/server";
import type {
  WeatherNowResponse,
  AirNowResponse,
  ApiResponse,
  WeatherInfoResponse,
  LocationInfo,
  Language,
  Unit,
} from "../types";

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
  console.log("-- [ geoRes ] --", geoRes);

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
 * GET /api/weather - 获取实时天气信息
 *
 * 查询参数:
 * - location: LocationID或经纬度坐标（可选，如果不提供则根据IP自动获取）
 * - lang: 多语言设置（可选，默认zh）
 * - unit: 数据单位设置（可选，默认m）
 *
 * 示例:
 * - /api/weather?location=101010100
 * - /api/weather?location=116.41,39.92
 * - /api/weather?location=116.41,39.92&lang=en&unit=i
 * - /api/weather （自动根据IP获取位置）
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const locationParam = searchParams.get("location");
    const lang = (searchParams.get("lang") as Language) || "zh";
    const unit = (searchParams.get("unit") as Unit) || "m";

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

      console.log("-- [ validation ] --", validation);

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
    const weatherParams = new URLSearchParams({
      location: finalLocationParam,
      key: key,
      lang: lang,
      unit: unit,
    });

    const airParams = new URLSearchParams({
      location: finalLocationParam,
      key: key,
      lang: lang,
    });

    // 并行请求天气和空气质量数据
    const [weatherRes, airRes] = await Promise.all([
      fetch(`${baseUrl}/v7/weather/now?${weatherParams.toString()}`),
      fetch(`${baseUrl}/v7/air/now?${airParams.toString()}`),
    ]);

    if (!weatherRes.ok) {
      throw new Error(
        `天气 API 请求失败: ${weatherRes.status} ${weatherRes.statusText}`,
      );
    }

    const weather: WeatherNowResponse = await weatherRes.json();

    // 检查天气API响应状态
    if (weather.code !== "200") {
      return NextResponse.json(
        {
          success: false,
          error: `天气数据获取失败: ${weather.code}`,
          code: weather.code,
        } as ApiResponse,
        { status: 400 },
      );
    }

    let air: AirNowResponse | undefined;
    if (airRes.ok) {
      air = await airRes.json();
      // 如果空气质量数据获取失败，不影响整体响应，只是不返回空气质量数据
      if (air?.code !== "200") {
        air = undefined;
      }
    }

    // 返回符合文档规范的响应
    const response: ApiResponse<WeatherInfoResponse> = {
      success: true,
      data: {
        location: locationInfo,
        weather: weather,
        air: air,
        updateTime: new Date().toISOString(),
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Weather API error:", error);

    const errorResponse: ApiResponse = {
      success: false,
      error: error instanceof Error ? error.message : "未知错误",
      code: "INTERNAL_ERROR",
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}
