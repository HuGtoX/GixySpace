import { useState, useEffect } from "react";
import {
  FaSync,
  FaMapPin,
  FaWind,
  FaSun,
  FaCloud,
  FaChevronDown,
  FaTint,
} from "react-icons/fa";
import { Button, Card, Divider, Select } from "antd";
import SectionCard from "@/components/SectionCard";
import type { WeatherData } from "@gixy/types";
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
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
      const cachedWeatherData = getCachedData<WeatherData>(
        cacheKey,
        timestampKey,
        CACHE_EXPIRE_MINUTES,
      );

      // 如果缓存存在且未过期，则使用缓存数据
      if (cachedWeatherData) {
        setWeatherData(cachedWeatherData);
        setError(null);
        setIsLoading(false);
        return;
      }

      // 缓存不存在或已过期，从API获取新数据
      const response = await fetch(
        `/api/hf/weather?lat=${selectedCity.lat}&lon=${selectedCity.lon}`,
      );
      if (!response.ok) throw new Error("网络请求失败");
      const data = await response.json();

      // 更新缓存
      updateCachedData<WeatherData>(cacheKey, timestampKey, data);

      setWeatherData(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "获取天气数据失败");
    } finally {
      setIsLoading(false);
    }
  };

  // 城市切换时获取天气数据
  useEffect(() => {
    fetchWeather();
  }, [selectedCity]);

  useEffect(() => {
    // 每30分钟刷新一次数据
    const interval = setInterval(fetchWeather, 1800000);
    return () => clearInterval(interval);
  }, []);

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
                    className={`${getAqiColor(Number(weatherData.air.now.aqi)).split(" ")[1]}`}
                  />
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  空气质量
                </div>
                <div className="text-sm font-medium">
                  {weatherData.air.now.category} (AQI: {weatherData.air.now.aqi}
                  )
                </div>
              </div>
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
            <div>{error}</div>
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
