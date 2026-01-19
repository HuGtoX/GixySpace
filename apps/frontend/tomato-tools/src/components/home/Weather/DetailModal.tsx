"use client";

import React, { useState } from "react";
import type { WeatherDailyInfoResponse } from "@/lib/api/types";
import GModal from "@/components/ui/Modal";
import type { CityData } from "./CitySearch";
import WeatherChart from "./WeatherChart";
import HistoryCityList from "./HistoryCityList";
import CitySearch from "./CitySearch";
import CollapsiblePanel from "@/components/ui/CollapsiblePanel";
import { FaSun, FaMoon } from "react-icons/fa";
import "qweather-icons/font/qweather-icons.css"; // 引入天气图标样式
import "./styles.css"; // 引入天气组件专用样式

interface IWeatherDetailModalProps {
  isModalVisible: boolean;
  setIsModalVisible: (value: boolean) => void;
  weatherData: WeatherDailyInfoResponse | null;
  selectedCity: CityData;
  onCityChange: (city: CityData) => void;
  historyRefreshTrigger?: number; // 用于触发历史列表刷新
}

function DetailModal({
  isModalVisible,
  setIsModalVisible,
  weatherData,
  selectedCity,
  onCityChange,
  historyRefreshTrigger,
}: IWeatherDetailModalProps) {
  const [collapsed, setCollapsed] = useState(false);

  if (!weatherData) return null;

  // 获取天气图标颜色
  const getWeatherIconColor = (text: string) => {
    if (text.includes("晴")) return "text-yellow-500 dark:text-yellow-400";
    if (text.includes("云") || text.includes("阴"))
      return "text-gray-500 dark:text-gray-400";
    if (text.includes("雨")) return "text-blue-500 dark:text-blue-400";
    if (text.includes("雪")) return "text-cyan-400 dark:text-cyan-300";
    return "text-gray-600 dark:text-gray-400";
  };

  // 获取空气质量等级文字
  const getAqiLevel = (aqi: number) => {
    if (aqi <= 50) return "优";
    if (aqi <= 100) return "良";
    if (aqi <= 150) return "轻度污染";
    if (aqi <= 200) return "中度污染";
    if (aqi <= 300) return "重度污染";
    return "严重污染";
  };

  return (
    <GModal
      isMacOSStyle
      showFullscreen
      title={`${selectedCity.name} - 天气详情`}
      visible={isModalVisible}
      onOk={() => setIsModalVisible(false)}
      onClose={() => setIsModalVisible(false)}
      width={1000}
      height={600}
      footer={null}
    >
      <div className="flex h-full">
        <CollapsiblePanel
          className="h-full p-3"
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed(!collapsed)}
          collapsedText="历史"
          collapsedTitle="展开历史记录"
          expandedTitle="收起历史记录"
        >
          <CitySearch onSelectCity={onCityChange} selectedCity={selectedCity} />
          <HistoryCityList
            selectedCity={selectedCity}
            onCitySelect={onCityChange}
            refreshTrigger={historyRefreshTrigger}
          />
        </CollapsiblePanel>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="mb-4 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <i
                  className={`qi-${weatherData.weather.now.icon} text-5xl ${getWeatherIconColor(weatherData.weather.now.text)}`}
                />
                <div>
                  <div className="flex items-baseline space-x-1">
                    <span className="text-4xl font-bold text-gray-900 dark:text-white">
                      {weatherData.weather.now.temp}
                    </span>
                    <span className="text-xl text-gray-500 dark:text-gray-400">
                      °C
                    </span>
                    <span className="ml-2 text-base text-gray-600 dark:text-gray-400">
                      {weatherData.weather.now.text}
                    </span>
                  </div>
                  <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    体感 {weatherData.weather.now.feelsLike}°C
                  </div>
                </div>
              </div>

              {/* 空气质量 - 极简显示 */}
              {weatherData.air && (
                <div className="flex items-baseline space-x-1.5">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    AQI
                  </span>
                  <span className="text-lg font-bold text-gray-900 dark:text-white">
                    {weatherData.air.now.aqi}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {getAqiLevel(Number(weatherData.air.now.aqi))}
                  </span>
                </div>
              )}
            </div>

            <div className="mt-4 flex items-center gap-3">
              {[
                {
                  label: "湿度",
                  value: `${weatherData.weather.now.humidity}%`,
                },
                {
                  label: "风速",
                  value: `${weatherData.weather.now.windSpeed}km/h`,
                },
                { label: "能见度", value: `${weatherData.weather.now.vis}km` },
                {
                  label: "气压",
                  value: `${weatherData.weather.now.pressure}hPa`,
                },
              ].map((item) => (
                <div key={item.label} className="flex items-baseline space-x-1">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {item.label}
                  </span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 七天天气趋势图表 - 紧凑布局 */}
          <div className="mb-4 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
            <h3 className="mb-3 text-base font-semibold text-gray-900 dark:text-white">
              未来七天预报
            </h3>
            <WeatherChart forecast={weatherData.forecast} />
          </div>

          {/* 日出日落信息 - 紧凑布局 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center space-x-2 rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
              <FaSun className="text-2xl text-orange-500 dark:text-orange-400" />
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  日出
                </div>
                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                  {weatherData.forecast.daily[0]?.sunrise || "--:--"}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2 rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
              <FaMoon className="text-2xl text-indigo-500 dark:text-indigo-400" />
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  日落
                </div>
                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                  {weatherData.forecast.daily[0]?.sunset || "--:--"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </GModal>
  );
}

export default DetailModal;
