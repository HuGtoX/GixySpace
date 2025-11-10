import { useState, useEffect } from "react";
import {
  FaSync,
  FaMapPin,
  FaWind,
  FaSun,
  FaCloud,
  FaTint,
  FaRobot,
} from "react-icons/fa";
import { Button, Spin } from "antd";
import SectionCard from "@/components/ui/SectionCard";
import MarkdownRenderer from "@/components/ui/MarkdownRenderer";
import type { ApiResponse, WeatherInfoResponse } from "@/app/api/types";
import "qweather-icons/font/qweather-icons.css"; // 引入天气图标样式
import {
  getCachedData,
  updateCachedData,
  clearCachedData,
} from "@/lib/sessionCache";
import DetailModal from "./DetailModal";

// 城市数据
const cities = [
  { name: "深圳", lat: 22.56, lon: 113.91 },
  { name: "北京", lat: 39.9, lon: 116.4 },
  { name: "上海", lat: 31.23, lon: 121.47 },
  { name: "广州", lat: 23.13, lon: 113.26 },
  { name: "成都", lat: 30.57, lon: 104.06 },
];

// 根据AQI值获取对应的颜色
const getAqiColor = (aqi: number) => {
  if (aqi <= 50) return "bg-green-100 text-green-600";
  if (aqi <= 100) return "bg-yellow-100 text-yellow-600";
  if (aqi <= 150) return "bg-orange-100 text-orange-600";
  if (aqi <= 200) return "bg-red-100 text-red-600";
  if (aqi <= 300) return "bg-purple-100 text-purple-600";
  return "bg-brown-100 text-brown-600";
};

// 获取天气图标颜色
const getWeatherIconColor = (weatherText: string) => {
  if (weatherText.includes("晴")) return "text-yellow-500";
  if (weatherText.includes("雨")) return "text-blue-500";
  if (weatherText.includes("阴") || weatherText.includes("云"))
    return "text-gray-500";
  return "text-gray-600";
};

export default function Weather() {
  const [weatherData, setWeatherData] = useState<WeatherInfoResponse | null>(
    null,
  );
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false); // 控制模态框显示
  const [selectedCity, setSelectedCity] = useState<(typeof cities)[0]>(
    cities[0],
  );

  // 缓存过期时间（分钟）
  const CACHE_EXPIRE_MINUTES = 15;

  const fetchWeather = async () => {
    try {
      setIsLoading(true);

      // 检查缓存，使用城市名称作为缓存键的一部分以区分不同城市的数据
      const cacheKey = `weatherData_${selectedCity.name}`;
      const timestampKey = `weatherTimestamp_${selectedCity.name}`;
      const cachedWeatherData = getCachedData<WeatherInfoResponse>(
        cacheKey,
        timestampKey,
        CACHE_EXPIRE_MINUTES,
      );

      // 如果缓存存在且未过期，则使用缓存数据
      if (cachedWeatherData) {
        setWeatherData(cachedWeatherData);
        setError(null);
        setErrorCode(null);
        setIsLoading(false);

        // 获取AI总结
        if (cachedWeatherData) {
          fetchAiSummary(cachedWeatherData);
        }
        return;
      }

      // 缓存不存在或已过期，从API获取新数据
      const response = await fetch(
        `/api/weather?location=${selectedCity.lon},${selectedCity.lat}`,
      );
      if (!response.ok)
        throw new Error(
          `网络请求失败: ${response.status} ${response.statusText}`,
        );

      const apiResponse: ApiResponse<WeatherInfoResponse> =
        await response.json();

      // 检查API响应是否成功
      if (!apiResponse.success) {
        const errorMsg = apiResponse.error || "获取天气数据失败";
        const errorWithCode = apiResponse.code
          ? `${errorMsg} (${apiResponse.code})`
          : errorMsg;
        throw new Error(errorWithCode);
      }

      if (!apiResponse.data) {
        throw new Error("API返回数据为空");
      }

      // 更新缓存
      updateCachedData<WeatherInfoResponse>(
        cacheKey,
        timestampKey,
        apiResponse.data,
      );

      setWeatherData(apiResponse.data);
      setError(null);
      setErrorCode(null);

      // 获取AI总结
      fetchAiSummary(apiResponse.data);
    } catch (err) {
      let errorMessage = "获取天气数据失败";
      let code = null;

      if (err instanceof Error) {
        errorMessage = err.message;

        // 尝试解析网络错误中的状态码
        const statusMatch = err.message.match(/(\d{3})/);
        if (statusMatch) {
          code = statusMatch[1];
        }
      }

      setError(errorMessage);
      setErrorCode(code);
      setWeatherData(null);
      setAiSummary(null);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAiSummary = async (weatherData: WeatherInfoResponse) => {
    try {
      setIsSummaryLoading(true);
      setSummaryError(null);

      // 构建请求数据
      const summaryRequest = {
        location: selectedCity.name,
        temperature: weatherData.weather.now.temp,
        weather: weatherData.weather.now.text,
        humidity: weatherData.weather.now.humidity,
        windSpeed: weatherData.weather.now.windSpeed,
        windDirection: weatherData.weather.now.windDir,
        aqi: weatherData.air?.now.aqi,
        aqiCategory: weatherData.air?.now.category,
      };

      const response = await fetch("/api/weather/summary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(summaryRequest),
      });

      if (!response.ok) {
        throw new Error(`获取AI总结失败: ${response.status}`);
      }

      const apiResponse: ApiResponse<{
        summary: { success: boolean; content?: string; error?: string };
      }> = await response.json();

      if (!apiResponse.success || !apiResponse.data) {
        throw new Error(apiResponse.error || "获取AI总结失败");
      }

      // 检查AI响应是否成功
      if (!apiResponse.data.summary.success) {
        throw new Error(apiResponse.data.summary.error || "AI总结生成失败");
      }

      setAiSummary(apiResponse.data.summary.content || null);
    } catch (err) {
      console.error("获取AI总结失败:", err);
      setSummaryError(err instanceof Error ? err.message : "获取AI总结失败");
      setAiSummary(null);
    } finally {
      setIsSummaryLoading(false);
    }
  };

  // 城市切换时获取天气数据
  useEffect(() => {
    fetchWeather();
  }, [selectedCity]);

  // 添加清除缓存的辅助方法
  const clearWeatherCache = () => {
    const cacheKey = `weatherData_${selectedCity.name}`;
    const timestampKey = `weatherTimestamp_${selectedCity.name}`;
    clearCachedData(cacheKey, timestampKey);

    fetchWeather(); // 清除缓存后立即获取新数据
  };

  return (
    <SectionCard
      title="今日天气"
      right={
        <div className="flex items-center">
          <Button
            type="text"
            size="small"
            icon={<FaSync />}
            loading={isLoading}
            onClick={clearWeatherCache}
            className="text-gray-500 hover:text-gray-700"
            title="刷新数据（清除缓存）"
          />
        </div>
      }
    >
      <div
        className="flex w-full cursor-pointer flex-col items-center p-2"
        onClick={() => weatherData && setIsModalVisible(true)}
        style={{ minHeight: "220px", justifyContent: "center" }}
      >
        {weatherData ? (
          <div className="mx-auto w-full max-w-md">
            <div className="mb-4 flex items-center justify-between px-2">
              <div className="flex items-center">
                <FaMapPin size={16} className="mr-1 text-gray-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {selectedCity.name}
                </span>
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {new Date().toLocaleDateString("zh-CN", { weekday: "long" })}
              </span>
            </div>

            <div className="mb-4 flex justify-center">
              <div className="flex flex-col items-center text-5xl">
                <i
                  className={`qi-${weatherData.weather.now.icon} ${getWeatherIconColor(weatherData.weather.now.text)}`}
                />
                <span className="mt-1 text-lg text-gray-600 dark:text-gray-300">
                  {weatherData.weather.now.text}
                </span>
              </div>
              <div className="ml-6 flex flex-col justify-center">
                <div className="text-4xl font-bold text-gray-800 dark:text-white">
                  {weatherData.weather.now.temp}°C
                </div>
                <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  体感: {weatherData.weather.now.feelsLike}°C
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 px-2 text-center">
              <div className="rounded-lg bg-gray-50 p-2 shadow-sm dark:bg-gray-800">
                <div className="mb-1 flex justify-center">
                  <FaTint size={16} className="text-blue-500" />
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  湿度
                </div>
                <div className="text-sm font-medium">
                  {weatherData.weather.now.humidity}%
                </div>
              </div>
              <div className="rounded-lg bg-gray-50 p-2 shadow-sm dark:bg-gray-800">
                <div className="mb-1 flex justify-center">
                  <FaWind size={16} className="text-gray-500" />
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  风向风速
                </div>
                <div className="text-sm font-medium">
                  {weatherData.weather.now.windDir}{" "}
                  {weatherData.weather.now.windSpeed}m/s
                </div>
              </div>
              <div className="rounded-lg bg-gray-50 p-2 shadow-sm dark:bg-gray-800">
                <div className="mb-1 flex justify-center">
                  <FaSun
                    size={16}
                    className={`${weatherData.air ? getAqiColor(Number(weatherData.air.now.aqi)).split(" ")[1] : "text-gray-500"}`}
                  />
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  空气质量
                </div>
                <div className="text-sm font-medium">
                  {weatherData.air ? (
                    <>
                      {weatherData.air.now.category} (AQI:{" "}
                      {weatherData.air.now.aqi})
                    </>
                  ) : (
                    "暂无数据"
                  )}
                </div>
              </div>
            </div>

            {/* AI总结区域 */}
            <div className="mt-4 border-t border-gray-200 pt-4 dark:border-gray-700">
              <div className="mb-2 flex items-center">
                <FaRobot
                  size={16}
                  className="mr-2 text-blue-500 dark:text-blue-400"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  天气小助手
                </span>
              </div>

              {isSummaryLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Spin size="small" />
                  <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                    正在生成今日天气分析...
                  </span>
                </div>
              ) : summaryError ? (
                <div className="rounded bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                  {summaryError}
                </div>
              ) : aiSummary ? (
                <div className="rounded bg-gray-50 p-3 text-sm text-gray-600 dark:bg-gray-700/50 dark:text-gray-200">
                  <MarkdownRenderer content={aiSummary} />
                </div>
              ) : (
                <div className="text-sm italic text-gray-500 dark:text-gray-400">
                  暂无数据
                </div>
              )}
            </div>
          </div>
        ) : isLoading ? (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="mb-3 h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-blue-500"></div>
            <div className="text-gray-500">加载天气数据中...</div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-red-500">
            <FaCloud size={32} className="mb-3" />
            <div className="text-center">
              <div className="mb-2">{error}</div>
              {errorCode && (
                <div className="text-xs text-gray-500">
                  错误代码: {errorCode}
                </div>
              )}
            </div>
            <Button
              onClick={fetchWeather}
              type="text"
              className="mt-3 text-sm text-blue-500"
            >
              重试
            </Button>
          </div>
        )}
      </div>

      {/* 详情模态框 */}
      <DetailModal
        isModalVisible={isModalVisible}
        setIsModalVisible={setIsModalVisible}
        weatherData={weatherData}
      />
    </SectionCard>
  );
}
