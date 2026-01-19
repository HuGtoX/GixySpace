/**
 * 天气API工具函数
 * 提供可复用的天气数据获取功能
 */

import type {
  WeatherNowResponse,
  WeatherForecastResponse,
  AirNowResponse,
  CitySearchResponse,
  LocationInfo,
  Language,
  Unit,
} from "../types";

const baseUrl = process.env.HF_BASEURL || "https://devapi.qweather.com";
const key = process.env.QWEATHER_KEY;

/**
 * 验证位置参数格式
 */
export function validateLocationParam(location: string): {
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
 * 根据经纬度获取位置信息
 */
export async function getLocationInfo(
  lat: string,
  lon: string,
  apiKey: string,
  lang: Language = "zh",
): Promise<LocationInfo> {
  if (!apiKey) {
    throw new Error("API密钥未配置");
  }

  const geoRes = await fetch(
    `${baseUrl}/geo/v2/city/lookup?location=${lon},${lat}&key=${apiKey}&lang=${lang}`,
  );

  if (!geoRes.ok) {
    throw new Error(
      `地理编码 API 请求失败: ${geoRes.status} ${geoRes.statusText}`,
    );
  }

  const geoData = await geoRes.json();

  if (geoData.code !== "200" || !geoData.location?.[0]) {
    throw new Error(`无法获取该坐标的位置信息: ${geoData.code}`);
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
 * 获取实时天气数据
 */
export async function getCurrentWeather(
  locationId: string,
  apiKey: string,
  lang: Language = "zh",
  unit: Unit = "m",
): Promise<WeatherNowResponse> {
  if (!apiKey) {
    throw new Error("API密钥未配置");
  }

  const params = new URLSearchParams({
    location: locationId,
    key: apiKey,
    lang: lang,
    unit: unit,
  });

  const response = await fetch(
    `${baseUrl}/v7/weather/now?${params.toString()}`,
  );

  if (!response.ok) {
    throw new Error(
      `天气 API 请求失败: ${response.status} ${response.statusText}`,
    );
  }

  const data: WeatherNowResponse = await response.json();

  if (data.code !== "200") {
    throw new Error(`天气数据获取失败: ${data.code}`);
  }

  return data;
}

/**
 * 获取天气预报数据
 */
export async function getWeatherForecast(
  locationId: string,
  days: number,
  apiKey: string,
  lang: Language = "zh",
  unit: Unit = "m",
): Promise<WeatherForecastResponse> {
  if (!apiKey) {
    throw new Error("API密钥未配置");
  }

  if (days < 1 || days > 15) {
    throw new Error("预报天数必须在1-15之间");
  }

  const params = new URLSearchParams({
    location: locationId,
    key: apiKey,
    lang: lang,
    unit: unit,
  });

  // 根据天数选择合适的API端点
  let endpoint: string;
  if (days <= 3) {
    endpoint = `${baseUrl}/v7/weather/3d?${params.toString()}`;
  } else if (days <= 7) {
    endpoint = `${baseUrl}/v7/weather/7d?${params.toString()}`;
  } else if (days <= 10) {
    endpoint = `${baseUrl}/v7/weather/10d?${params.toString()}`;
  } else {
    endpoint = `${baseUrl}/v7/weather/15d?${params.toString()}`;
  }

  const response = await fetch(endpoint);

  if (!response.ok) {
    throw new Error(
      `天气预报 API 请求失败: ${response.status} ${response.statusText}`,
    );
  }

  const data: WeatherForecastResponse = await response.json();

  if (data.code !== "200") {
    throw new Error(`天气预报数据获取失败: ${data.code}`);
  }

  // 如果请求的天数少于返回的数据，截取对应天数
  if (data.daily && data.daily.length > days) {
    data.daily = data.daily.slice(0, days);
  }

  return data;
}

/**
 * 获取空气质量数据
 */
export async function getAirQuality(
  locationId: string,
  apiKey: string,
  lang: Language = "zh",
): Promise<AirNowResponse | null> {
  if (!apiKey) {
    throw new Error("API密钥未配置");
  }

  try {
    const params = new URLSearchParams({
      location: locationId,
      key: apiKey,
      lang: lang,
    });

    const response = await fetch(`${baseUrl}/v7/air/now?${params.toString()}`);

    if (!response.ok) {
      console.warn(
        `空气质量 API 请求失败: ${response.status} ${response.statusText}`,
      );
      return null;
    }

    const data: AirNowResponse = await response.json();

    if (data.code !== "200") {
      console.warn(`空气质量数据获取失败: ${data.code}`);
      return null;
    }

    return data;
  } catch (error) {
    console.warn("获取空气质量数据失败:", error);
    return null;
  }
}

/**
 * 搜索城市信息
 */
export async function searchCities(
  cityName: string,
  apiKey: string,
  number: number = 10,
  lang: Language = "zh",
): Promise<CitySearchResponse> {
  if (!apiKey) {
    throw new Error("API密钥未配置");
  }

  if (!cityName || cityName.trim() === "") {
    throw new Error("城市名称不能为空");
  }

  if (number < 1 || number > 20) {
    throw new Error("返回结果数量必须在1-20之间");
  }

  const params = new URLSearchParams({
    location: cityName.trim(),
    key: apiKey,
    lang: lang,
    number: number.toString(),
  });

  const response = await fetch(
    `${baseUrl}/geo/v2/city/lookup?${params.toString()}`,
  );

  if (!response.ok) {
    throw new Error(
      `城市搜索 API 请求失败: ${response.status} ${response.statusText}`,
    );
  }

  const data: CitySearchResponse = await response.json();

  if (data.code !== "200") {
    throw new Error(`城市搜索失败: ${data.code}`);
  }

  return data;
}

/**
 * 批量搜索城市信息
 */
export async function batchSearchCities(
  cityNames: string[],
  apiKey: string,
  number: number = 10,
  lang: Language = "zh",
): Promise<
  Array<{
    query: string;
    success: boolean;
    data: CitySearchResponse | null;
    error: string | null;
  }>
> {
  if (!apiKey) {
    throw new Error("API密钥未配置");
  }

  if (!cityNames || cityNames.length === 0) {
    throw new Error("城市名称数组不能为空");
  }

  if (cityNames.length > 10) {
    throw new Error("一次最多只能搜索10个城市");
  }

  const searchPromises = cityNames.map(async (cityName) => {
    try {
      const data = await searchCities(cityName, apiKey, number, lang);
      return {
        query: cityName,
        success: true,
        data: data,
        error: null,
      };
    } catch (error) {
      return {
        query: cityName,
        success: false,
        data: null,
        error: error instanceof Error ? error.message : "未知错误",
      };
    }
  });

  return Promise.all(searchPromises);
}

/**
 * 根据IP地址获取地理位置信息（用于服务端）
 */
export async function getLocationFromIP(ip?: string): Promise<{
  lat: string;
  lon: string;
  city: string;
  country: string;
}> {
  try {
    // 如果是本地IP，返回默认位置（北京）
    if (
      !ip ||
      ip === "127.0.0.1" ||
      ip === "::1" ||
      ip.startsWith("192.168.")
    ) {
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
 * 获取完整的天气信息（实时天气 + 空气质量）
 */
export async function getCompleteWeatherInfo(
  locationParam: string,
  apiKey: string,
  lang: Language = "zh",
  unit: Unit = "m",
): Promise<{
  location: LocationInfo;
  weather: WeatherNowResponse;
  air: AirNowResponse | null;
}> {
  if (!key) {
    throw new Error("API密钥未配置");
  }

  const validation = validateLocationParam(locationParam);

  if (!validation.isValid) {
    throw new Error("位置参数格式错误");
  }

  let locationInfo: LocationInfo;
  let finalLocationId: string;

  if (validation.type === "coordinate" && validation.lat && validation.lon) {
    // 坐标格式，需要获取LocationID和城市信息
    locationInfo = await getLocationInfo(
      validation.lat,
      validation.lon,
      apiKey,
      lang,
    );
    finalLocationId = locationInfo.id!;
  } else {
    // LocationID格式，直接使用
    finalLocationId = locationParam;
    locationInfo = {
      id: locationParam,
      latitude: "0",
      longitude: "0",
      city: "未知城市",
      country: "未知国家",
    };
  }

  // 并行获取天气和空气质量数据
  const [weather, air] = await Promise.all([
    getCurrentWeather(finalLocationId, apiKey, lang, unit),
    getAirQuality(finalLocationId, apiKey, lang),
  ]);

  return {
    location: locationInfo,
    weather: weather,
    air: air,
  };
}

/**
 * 天气图标映射
 */
export const WEATHER_ICONS = {
  // 晴天
  "100": "☀️", // 晴

  // 多云
  "101": "🌤️", // 多云
  "102": "⛅", // 少云
  "103": "☁️", // 晴间多云

  // 阴天
  "104": "☁️", // 阴

  // 雨天
  "300": "🌦️", // 阵雨
  "301": "🌧️", // 强阵雨
  "302": "⛈️", // 雷阵雨
  "303": "⛈️", // 强雷阵雨
  "304": "⛈️", // 雷阵雨伴有冰雹
  "305": "🌦️", // 小雨
  "306": "🌧️", // 中雨
  "307": "🌧️", // 大雨
  "308": "🌧️", // 极端降雨
  "309": "🌦️", // 毛毛雨/细雨
  "310": "🌧️", // 暴雨
  "311": "🌧️", // 大暴雨
  "312": "🌧️", // 特大暴雨
  "313": "🌨️", // 冻雨

  // 雪天
  "400": "🌨️", // 小雪
  "401": "❄️", // 中雪
  "402": "❄️", // 大雪
  "403": "❄️", // 暴雪
  "404": "🌨️", // 雨夹雪
  "405": "🌨️", // 雨雪天气
  "406": "🌨️", // 阵雨夹雪
  "407": "❄️", // 阵雪

  // 雾霾等
  "500": "🌫️", // 薄雾
  "501": "🌫️", // 雾
  "502": "🌫️", // 霾
  "503": "💨", // 扬沙
  "504": "💨", // 浮尘
  "507": "💨", // 沙尘暴
  "508": "💨", // 强沙尘暴
  "509": "🌫️", // 浓雾
  "510": "🌫️", // 强浓雾
  "511": "🌫️", // 中度霾
  "512": "🌫️", // 重度霾
  "513": "🌫️", // 严重霾

  // 其他
  "900": "🌡️", // 热
  "901": "🥶", // 冷
  "999": "❓", // 未知
} as const;

/**
 * 获取天气图标
 */
export function getWeatherIcon(iconCode: string): string {
  return WEATHER_ICONS[iconCode as keyof typeof WEATHER_ICONS] || "❓";
}

/**
 * 格式化温度显示
 */
export function formatTemperature(temp: string, unit: Unit = "m"): string {
  const tempNum = parseFloat(temp);
  if (isNaN(tempNum)) return temp;

  const unitSymbol = unit === "i" ? "°F" : "°C";
  return `${tempNum}${unitSymbol}`;
}

/**
 * 格式化风速显示
 */
export function formatWindSpeed(speed: string, unit: Unit = "m"): string {
  const speedNum = parseFloat(speed);
  if (isNaN(speedNum)) return speed;

  const unitSymbol = unit === "i" ? "mph" : "km/h";
  return `${speedNum} ${unitSymbol}`;
}

/**
 * 格式化降水量显示
 */
export function formatPrecipitation(precip: string, unit: Unit = "m"): string {
  const precipNum = parseFloat(precip);
  if (isNaN(precipNum)) return precip;

  const unitSymbol = unit === "i" ? "in" : "mm";
  return `${precipNum} ${unitSymbol}`;
}
