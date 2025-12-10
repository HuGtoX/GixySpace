import React, { useState, useEffect } from "react";
import {
  FaSync,
  FaMapPin,
  FaCloud,
  FaRobot,
  FaInfoCircle,
  FaWind,
  FaTint,
} from "react-icons/fa";
import { Button, Spin } from "antd";
import SectionCard from "@/components/ui/SectionCard";
import MarkdownRenderer from "@/components/ui/MarkdownRenderer";
import type { ApiResponse, WeatherDailyInfoResponse } from "@/app/api/types";
import "qweather-icons/font/qweather-icons.css"; // 引入天气图标样式
import "./styles.css"; // 引入天气组件专用样式
import {
  getCachedData,
  updateCachedData,
  clearCachedData,
} from "@/lib/sessionCache";
import DetailModal from "./DetailModal";
import type { CityData } from "./CitySearch";

// 城市数据 - 扩展更多城市
const cities: CityData[] = [{ name: "广东省-深圳", locationID: 101280601 }];

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

// 本地存储键名
const LAST_CITY_KEY = "weather_last_city";

// 从本地存储获取上次查询的城市
const getLastCity = (): CityData | null => {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(LAST_CITY_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // 验证数据结构是否完整
      if (parsed && parsed.name && parsed.locationID) {
        return {
          name: parsed.name,
          locationID: parsed.locationID,
        };
      }
    }
  } catch (error) {
    console.error("获取上次查询城市失败:", error);
    // 清除无效的缓存数据
    localStorage.removeItem(LAST_CITY_KEY);
  }
  return null;
};

// 保存城市到本地存储
const saveLastCity = (city: CityData) => {
  if (typeof window === "undefined") return;
  try {
    // 确保只保存必要的字段
    const cityToSave: CityData = {
      name: city.name,
      locationID: city.locationID,
    };
    localStorage.setItem(LAST_CITY_KEY, JSON.stringify(cityToSave));
  } catch (error) {
    console.error("保存城市到本地存储失败:", error);
  }
};

export default function Weather() {
  const [weatherData, setWeatherData] =
    useState<WeatherDailyInfoResponse | null>(null);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [showAiSummary, setShowAiSummary] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false); // 控制模态框显示
  // 初始化时从本地存储读取上次查询的城市，如果没有则使用默认城市
  const [selectedCity, setSelectedCity] = useState<CityData>(
    getLastCity() || cities[0],
  );
  // 用于触发历史列表刷新的时间戳
  const [historyRefreshTrigger, setHistoryRefreshTrigger] = useState<number>(0);

  // 缓存过期时间（分钟）
  const CACHE_EXPIRE_MINUTES = 15;

  const fetchWeather = async () => {
    try {
      setIsLoading(true);

      // 检查缓存，使用城市名称作为缓存键的一部分以区分不同城市的数据
      const cacheKey = `weatherDailyData_${selectedCity.name}`;
      const timestampKey = `weatherDailyTimestamp_${selectedCity.name}`;
      const cachedWeatherData = getCachedData<WeatherDailyInfoResponse>(
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
        return;
      }

      // 缓存不存在或已过期，从API获取新数据
      const response = await fetch(
        `/api/weather/daily?location=${selectedCity.locationID}&days=7`,
      );
      if (!response.ok)
        throw new Error(
          `网络请求失败: ${response.status} ${response.statusText}`,
        );

      const apiResponse: ApiResponse<WeatherDailyInfoResponse> =
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
      updateCachedData<WeatherDailyInfoResponse>(
        cacheKey,
        timestampKey,
        apiResponse.data,
      );

      setWeatherData(apiResponse.data);
      setError(null);
      setErrorCode(null);

      // 不自动获取AI总结，等待用户手动触发
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

  const fetchAiSummary = async (weatherData: WeatherDailyInfoResponse) => {
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
    // 记录城市访问
    const recordCityVisit = async (city: CityData) => {
      try {
        await fetch("/api/weather/history", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            cityName: city.name,
            cityNameEn: city.name,
            locationId: city.locationID,
          }),
        });
      } catch (error) {
        console.error("记录城市访问失败:", error);
        // 静默失败，不影响主流程
      }
    };

    fetchWeather();
    recordCityVisit(selectedCity).then(() => {
      // 记录成功后，触发历史列表刷新
      setHistoryRefreshTrigger(Date.now());
    }); // 记录访问
    saveLastCity(selectedCity); // 保存到本地存储
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCity]);

  // 添加清除缓存的辅助方法
  const clearWeatherCache = () => {
    const cacheKey = `weatherDailyData_${selectedCity.name}`;
    const timestampKey = `weatherDailyTimestamp_${selectedCity.name}`;
    clearCachedData(cacheKey, timestampKey);

    fetchWeather(); // 清除缓存后立即获取新数据
  };

  // 手动触发AI助手
  const handleAiAssistant = () => {
    if (!weatherData) return;

    if (!showAiSummary) {
      setShowAiSummary(true);
      if (!aiSummary && !isSummaryLoading) {
        fetchAiSummary(weatherData);
      }
    } else {
      setShowAiSummary(false);
    }
  };

  return (
    <SectionCard
      title="今日天气"
      right={
        <div className="flex items-center space-x-1">
          <Button
            type="text"
            size="small"
            icon={<FaRobot />}
            onClick={handleAiAssistant}
            disabled={!weatherData || isLoading}
            className="text-gray-500 transition-colors hover:text-purple-500 dark:text-gray-400 dark:hover:text-purple-400"
            title="AI天气助手"
          />
          <Button
            type="text"
            size="small"
            icon={<FaSync className={isLoading ? "animate-spin" : ""} />}
            loading={false}
            onClick={clearWeatherCache}
            disabled={isLoading}
            className="text-gray-500 transition-colors hover:text-blue-500 dark:text-gray-400 dark:hover:text-blue-400"
            title="刷新数据"
          />
        </div>
      }
    >
      <div
        className="flex w-full flex-col items-center p-2"
        style={{ minHeight: "140px", justifyContent: "center" }}
      >
        {weatherData ? (
          <div className="animate-fadeIn mx-auto w-full max-w-sm">
            <div className="flex items-center justify-between">
              {/* 左侧：天气图标和状态 */}
              <div className="flex items-center space-x-2.5">
                <i
                  className={`qi-${weatherData.weather.now.icon} text-4xl ${getWeatherIconColor(weatherData.weather.now.text)}`}
                />
                <div>
                  <div className="flex items-center space-x-1">
                    <FaMapPin
                      size={11}
                      className="text-gray-500 dark:text-gray-400"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {selectedCity.name.split("-").slice(1).join("-")}
                    </span>
                  </div>
                  <div className="mt-0.5 text-sm font-medium text-gray-600 dark:text-gray-400">
                    {weatherData.weather.now.text}
                  </div>
                </div>
              </div>

              {/* 右侧：温度 */}
              <div className="text-right">
                <div className="text-3xl font-bold leading-none text-gray-900 dark:text-white">
                  {weatherData.weather.now.temp}
                  <span className="text-xl text-gray-500">°</span>
                </div>
                <div className="mt-1 flex items-center justify-end space-x-1.5 text-xs">
                  <span className="font-semibold text-blue-500 dark:text-blue-400">
                    {weatherData.forecast.daily[0]?.tempMin}°
                  </span>
                  <span className="text-gray-400 dark:text-gray-500">~</span>
                  <span className="font-semibold text-red-500 dark:text-red-400">
                    {weatherData.forecast.daily[0]?.tempMax}°
                  </span>
                </div>
              </div>
            </div>

            {/* 快速信息栏 */}
            <div className="mt-2 flex items-center justify-between rounded-md bg-gray-50 px-3 py-1.5 dark:bg-gray-800/50">
              <div className="flex items-center space-x-1 text-xs">
                <FaTint
                  size={10}
                  className="text-blue-500 dark:text-blue-400"
                />
                <span className="text-gray-600 dark:text-gray-400">
                  {weatherData.weather.now.humidity}%
                </span>
              </div>
              <div className="flex items-center space-x-1 text-xs">
                <FaWind
                  size={10}
                  className="text-gray-500 dark:text-gray-400"
                />
                <span className="text-gray-600 dark:text-gray-400">
                  {weatherData.weather.now.windSpeed}m/s
                </span>
              </div>
              {weatherData.air && (
                <div className="flex items-center space-x-1 text-xs">
                  <div
                    className={`h-1.5 w-1.5 rounded-full ${getAqiColor(Number(weatherData.air.now.aqi)).split(" ")[0]}`}
                  ></div>
                  <span className="text-gray-600 dark:text-gray-400">
                    AQI {weatherData.air.now.aqi}
                  </span>
                </div>
              )}
            </div>

            {/* 查看详情提示 - 优化后的友好交互 */}
            <div
              className="group mt-2 flex cursor-pointer items-center justify-center space-x-1.5 rounded-lg border border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50 py-2 text-xs font-medium text-gray-600 shadow-sm transition-all hover:border-blue-300 hover:from-blue-100 hover:to-purple-100 hover:shadow-md dark:border-gray-700 dark:from-gray-800 dark:to-gray-800/80 dark:text-gray-300 dark:hover:border-blue-600 dark:hover:from-gray-700 dark:hover:to-gray-700/80"
              onClick={() => setIsModalVisible(true)}
            >
              <FaInfoCircle
                size={12}
                className="text-blue-500 transition-transform group-hover:scale-110 dark:text-blue-400"
              />
              <span>展开查看7日天气预报</span>
              <svg
                className="h-3 w-3 transition-transform group-hover:translate-x-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>

            {/* AI总结区域 - 手动触发显示 */}
            {showAiSummary && (
              <div className="animate-fadeIn mt-2 rounded-md border border-gray-200 bg-gray-50 p-2.5 dark:border-gray-700 dark:bg-gray-800/50">
                <div className="mb-1.5 flex items-center justify-between">
                  <div className="flex items-center space-x-1.5">
                    <FaRobot
                      size={12}
                      className="text-purple-500 dark:text-purple-400"
                    />
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                      AI天气助手
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowAiSummary(false);
                    }}
                    className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    收起
                  </button>
                </div>

                {isSummaryLoading ? (
                  <div className="flex items-center justify-center py-3">
                    <Spin size="small" />
                    <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                      正在分析...
                    </span>
                  </div>
                ) : summaryError ? (
                  <div className="rounded bg-red-50 p-2 text-xs text-red-600 dark:bg-red-900/20 dark:text-red-400">
                    {summaryError}
                  </div>
                ) : aiSummary ? (
                  <div className="text-xs leading-relaxed text-gray-600 dark:text-gray-400">
                    <MarkdownRenderer content={aiSummary} />
                  </div>
                ) : (
                  <div className="py-2 text-center text-xs text-gray-400">
                    暂无数据
                  </div>
                )}
              </div>
            )}
          </div>
        ) : isLoading ? (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="mb-3 h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-blue-500 dark:border-gray-700 dark:border-t-blue-400"></div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              加载中...
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 dark:bg-red-900/20">
              <FaCloud size={24} className="text-red-500 dark:text-red-400" />
            </div>
            <div className="text-center">
              <div className="mb-1 text-sm text-gray-700 dark:text-gray-300">
                {error}
              </div>
              {errorCode && (
                <div className="text-xs text-gray-400">
                  错误代码: {errorCode}
                </div>
              )}
            </div>
            <Button
              onClick={fetchWeather}
              type="link"
              size="small"
              className="mt-2"
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
        selectedCity={selectedCity}
        onCityChange={setSelectedCity}
        historyRefreshTrigger={historyRefreshTrigger}
      />
    </SectionCard>
  );
}
