"use client";

import React from "react";
import { useState, useEffect } from "react";
import { Spin, message } from "antd";
import { FaMapMarkerAlt, FaTrash, FaTint } from "react-icons/fa";
import type { CityData } from "./CitySearch";
import type { WeatherNowResponse } from "@/app/api/types";
import "qweather-icons/font/qweather-icons.css";

interface HistoryCityListProps {
  selectedCity: CityData;
  onCitySelect: (city: CityData) => void;
  refreshTrigger?: number; // 用于触发刷新的时间戳
}

interface HistoryCity {
  id: number;
  cityName: string;
  cityNameEn: string;
  latitude: string;
  longitude: string;
  province: string;
  locationId: string;
  visitCount: number;
  lastVisitAt: string;
  createdAt: string;
}

interface CityWeatherData {
  temp: string;
  text: string;
  icon: string;
  humidity: string;
  loading: boolean;
  error: boolean;
}

const HistoryCityList = ({
  selectedCity,
  onCitySelect,
  refreshTrigger,
}: HistoryCityListProps) => {
  const [historyCities, setHistoryCities] = useState<HistoryCity[]>([]);
  const [loading, setLoading] = useState(true);
  const [weatherDataMap, setWeatherDataMap] = useState<
    Map<string, CityWeatherData>
  >(new Map());

  const fetchHistoryCities = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/weather/history?limit=10");
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setHistoryCities(result.data || []);
        } else {
          // 如果是未登录错误，静默处理
          if (response.status !== 401) {
            console.error("获取城市失败:", result.error);
          }
        }
      }
    } catch (error) {
      console.error("获取城市失败:", error);
    } finally {
      setLoading(false);
    }
  };

  // 获取单个城市的天气数据
  const fetchCityWeather = async (city: HistoryCity) => {
    const locationId = city.locationId;

    // 设置加载状态
    setWeatherDataMap((prev) => {
      const newMap = new Map(prev);
      newMap.set(locationId, {
        temp: "",
        text: "",
        icon: "",
        humidity: "",
        loading: true,
        error: false,
      });
      return newMap;
    });

    try {
      const response = await fetch(`/api/weather?location=${locationId}`);
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          const weatherData = result.data.weather as WeatherNowResponse;
          setWeatherDataMap((prev) => {
            const newMap = new Map(prev);
            newMap.set(locationId, {
              temp: weatherData.now.temp,
              text: weatherData.now.text,
              icon: weatherData.now.icon,
              humidity: weatherData.now.humidity,
              loading: false,
              error: false,
            });
            return newMap;
          });
        } else {
          throw new Error("获取天气数据失败");
        }
      } else {
        throw new Error("请求失败");
      }
    } catch (error) {
      console.error(`获取城市 ${city.cityName} 天气失败:`, error);
      setWeatherDataMap((prev) => {
        const newMap = new Map(prev);
        newMap.set(locationId, {
          temp: "",
          text: "",
          icon: "",
          humidity: "",
          loading: false,
          error: true,
        });
        return newMap;
      });
    }
  };

  // 批量获取天气数据
  const fetchAllWeather = async (cities: HistoryCity[]) => {
    // 使用 Promise.allSettled 避免单个请求失败影响其他请求
    await Promise.allSettled(cities.map((city) => fetchCityWeather(city)));
  };

  useEffect(() => {
    fetchHistoryCities();
  }, []);

  // 当 refreshTrigger 变化时，重新获取历史城市列表
  useEffect(() => {
    if (refreshTrigger) {
      fetchHistoryCities();
    }
  }, [refreshTrigger]);

  // 当历史城市列表更新时，获取天气数据
  useEffect(() => {
    if (historyCities.length > 0) {
      fetchAllWeather(historyCities);
    }
  }, [historyCities]);

  // 处理城市点击
  const handleCityClick = (city: HistoryCity) => {
    const cityData: CityData = {
      name: city.cityName,
      locationID: city.locationId || "",
    };
    onCitySelect(cityData);
  };

  // 处理删除城市
  const handleDeleteCity = async (e: React.MouseEvent, cityId: number) => {
    e.stopPropagation(); // 阻止事件冒泡
    try {
      const response = await fetch(`/api/weather/history?id=${cityId}`, {
        method: "DELETE",
      });
      const result = await response.json();
      if (result.success) {
        fetchHistoryCities();
      } else {
        message.error(result.error || "删除失败");
      }
    } catch (error) {
      message.error("删除失败");
    }
  };

  // 根据天气状况获取图标颜色
  const getWeatherIconColor = (text: string) => {
    if (text.includes("晴")) return "text-yellow-500 dark:text-yellow-400";
    if (text.includes("云") || text.includes("阴"))
      return "text-gray-500 dark:text-gray-400";
    if (text.includes("雨")) return "text-blue-500 dark:text-blue-400";
    if (text.includes("雪")) return "text-blue-300 dark:text-blue-200";
    if (text.includes("雾") || text.includes("霾"))
      return "text-gray-400 dark:text-gray-500";
    return "text-gray-500 dark:text-gray-400";
  };

  return (
    <div className="pt-3">
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Spin size="small" />
        </div>
      ) : historyCities.length === 0 ? (
        <div className="py-8 text-center text-xs text-gray-400 dark:text-gray-500">
          暂无记录
        </div>
      ) : (
        <div className="space-y-2">
          {historyCities.map((city) => (
            <div
              key={city.id}
              onClick={() => handleCityClick(city)}
              className={`group cursor-pointer rounded-lg border p-3 transition-all hover:shadow-md ${
                selectedCity.locationID === city.locationId
                  ? "border-blue-500 bg-blue-50 dark:border-blue-600 dark:bg-blue-900/20"
                  : "border-gray-200 bg-white hover:border-blue-300 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-blue-600"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* 城市名称 */}
                  <div className="flex items-center space-x-1.5">
                    {selectedCity.locationID === city.locationId && (
                      <FaMapMarkerAlt
                        size={12}
                        className="text-blue-500 dark:text-blue-400"
                      />
                    )}
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                      {city.cityName}
                    </span>
                  </div>

                  {/* 天气信息 */}
                  {(() => {
                    const weatherData = weatherDataMap.get(city.locationId);
                    if (!weatherData) return null;

                    if (weatherData.loading) {
                      return (
                        <div className="mt-1.5 flex items-center space-x-1">
                          <Spin size="small" className="scale-50" />
                          <span className="text-xs text-gray-400 dark:text-gray-500">
                            加载中...
                          </span>
                        </div>
                      );
                    }

                    if (weatherData.error) {
                      return (
                        <div className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">
                          天气数据获取失败
                        </div>
                      );
                    }

                    return (
                      <div className="mt-1.5 flex items-center space-x-3">
                        {/* 天气图标和状态 */}
                        <div className="flex items-center space-x-1">
                          <i
                            className={`qi-${weatherData.icon} text-base ${getWeatherIconColor(weatherData.text)}`}
                          />
                          <span className="text-xs text-gray-600 dark:text-gray-400">
                            {weatherData.text}
                          </span>
                        </div>

                        {/* 温度 */}
                        <div className="flex items-center">
                          <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                            {weatherData.temp}°
                          </span>
                        </div>

                        {/* 湿度 */}
                        <div className="flex items-center space-x-0.5">
                          <FaTint
                            size={9}
                            className="text-blue-500 dark:text-blue-400"
                          />
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {weatherData.humidity}%
                          </span>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* 删除按钮 */}
                <button
                  onClick={(e) => handleDeleteCity(e, city.id)}
                  className="ml-2 rounded p-1.5 text-gray-400 opacity-0 transition-all hover:bg-red-50 hover:text-red-500 group-hover:opacity-100 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                  title="删除记录"
                >
                  <FaTrash size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HistoryCityList;
