"use client";

import { useState } from "react";
import type { WeatherDailyInfoResponse } from "@/app/api/types";
import GModal from "@/components/ui/Modal";
import type { CityData } from "./CitySearch";
import WeatherChart from "./WeatherChart";
import HistoryCityList from "./HistoryCityList";
import {
  FaSun,
  FaMoon,
  FaWind,
  FaTint,
  FaEye,
  FaCompress,
  FaCloudRain,
} from "react-icons/fa";
import "qweather-icons/font/qweather-icons.css"; // 引入天气图标样式
import "./styles.css"; // 引入天气组件专用样式

interface IWeatherDetailModalProps {
  isModalVisible: boolean;
  setIsModalVisible: (value: boolean) => void;
  weatherData: WeatherDailyInfoResponse;
  selectedCity: CityData;
  onCityChange: (city: CityData) => void;
}

const DetailModal: React.FC<IWeatherDetailModalProps> = ({
  isModalVisible,
  setIsModalVisible,
  weatherData,
  selectedCity,
  onCityChange,
}) => {
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

  // 获取空气质量等级颜色
  const getAqiColor = (aqi: number) => {
    if (aqi <= 50) return "bg-green-500";
    if (aqi <= 100) return "bg-yellow-500";
    if (aqi <= 150) return "bg-orange-500";
    if (aqi <= 200) return "bg-red-500";
    if (aqi <= 300) return "bg-purple-500";
    return "bg-red-900";
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
      width={1200}
      footer={null}
    >
      <div className="flex h-[600px] overflow-hidden">
        {/* 左侧：历史城市列表 */}
        <HistoryCityList
          selectedCity={selectedCity}
          onCitySelect={onCityChange}
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed(!collapsed)}
        />

        {/* 右侧：天气详情 */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* 当前天气概览 */}
          <div className="mb-6 rounded-xl border border-gray-200 bg-gradient-to-br from-blue-50 to-purple-50 p-6 dark:border-gray-700 dark:from-gray-800 dark:to-gray-800/80">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <i
                  className={`qi-${weatherData.weather.now.icon} text-6xl ${getWeatherIconColor(weatherData.weather.now.text)}`}
                />
                <div>
                  <div className="text-5xl font-bold text-gray-900 dark:text-white">
                    {weatherData.weather.now.temp}
                    <span className="text-2xl text-gray-500">°C</span>
                  </div>
                  <div className="mt-2 text-lg text-gray-700 dark:text-gray-300">
                    {weatherData.weather.now.text}
                  </div>
                  <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    体感温度 {weatherData.weather.now.feelsLike}°C
                  </div>
                </div>
              </div>

              {/* 空气质量 */}
              {weatherData.air && (
                <div className="text-right">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    空气质量
                  </div>
                  <div className="mt-1 flex items-center justify-end space-x-2">
                    <div
                      className={`h-3 w-3 rounded-full ${getAqiColor(Number(weatherData.air.now.aqi))}`}
                    ></div>
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">
                      {weatherData.air.now.aqi}
                    </span>
                  </div>
                  <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    {getAqiLevel(Number(weatherData.air.now.aqi))}
                  </div>
                </div>
              )}
            </div>

            {/* 详细指标 */}
            <div className="mt-6 grid grid-cols-4 gap-4">
              <div className="rounded-lg bg-white/60 p-3 dark:bg-gray-700/60">
                <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                  <FaTint size={14} />
                  <span className="text-xs">湿度</span>
                </div>
                <div className="mt-1 text-xl font-semibold text-gray-900 dark:text-white">
                  {weatherData.weather.now.humidity}%
                </div>
              </div>

              <div className="rounded-lg bg-white/60 p-3 dark:bg-gray-700/60">
                <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                  <FaWind size={14} />
                  <span className="text-xs">风速</span>
                </div>
                <div className="mt-1 text-xl font-semibold text-gray-900 dark:text-white">
                  {weatherData.weather.now.windSpeed}
                  <span className="text-sm">km/h</span>
                </div>
              </div>

              <div className="rounded-lg bg-white/60 p-3 dark:bg-gray-700/60">
                <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                  <FaEye size={14} />
                  <span className="text-xs">能见度</span>
                </div>
                <div className="mt-1 text-xl font-semibold text-gray-900 dark:text-white">
                  {weatherData.weather.now.vis}
                  <span className="text-sm">km</span>
                </div>
              </div>

              <div className="rounded-lg bg-white/60 p-3 dark:bg-gray-700/60">
                <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                  <FaCompress size={14} />
                  <span className="text-xs">气压</span>
                </div>
                <div className="mt-1 text-xl font-semibold text-gray-900 dark:text-white">
                  {weatherData.weather.now.pressure}
                  <span className="text-sm">hPa</span>
                </div>
              </div>
            </div>
          </div>

          {/* 七天天气趋势图表 */}
          <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              七天天气趋势
            </h3>
            <WeatherChart forecast={weatherData.forecast} />
          </div>

          {/* 七天天气详情列表 */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              未来七天预报
            </h3>
            <div className="space-y-3">
              {weatherData.forecast.daily.map((day, index) => {
                const date = new Date(day.fxDate);
                const dayName =
                  index === 0
                    ? "今天"
                    : index === 1
                      ? "明天"
                      : ["日", "一", "二", "三", "四", "五", "六"][
                          date.getDay()
                        ];

                return (
                  <div
                    key={day.fxDate}
                    className="flex items-center justify-between rounded-lg border border-gray-100 p-4 transition-all hover:border-blue-200 hover:bg-blue-50/50 dark:border-gray-700 dark:hover:border-blue-800 dark:hover:bg-blue-900/10"
                  >
                    {/* 日期 */}
                    <div className="w-24">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {dayName}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {date.getMonth() + 1}/{date.getDate()}
                      </div>
                    </div>

                    {/* 白天天气 */}
                    <div className="flex flex-1 items-center space-x-3">
                      <i
                        className={`qi-${day.iconDay} text-2xl ${getWeatherIconColor(day.textDay)}`}
                      />
                      <div>
                        <div className="text-sm text-gray-700 dark:text-gray-300">
                          {day.textDay}
                        </div>
                        <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
                          <FaWind size={10} />
                          <span>{day.windDirDay}</span>
                          <span>{day.windScaleDay}级</span>
                        </div>
                      </div>
                    </div>

                    {/* 夜间天气 */}
                    <div className="flex flex-1 items-center space-x-3">
                      <i
                        className={`qi-${day.iconNight} text-2xl ${getWeatherIconColor(day.textNight)}`}
                      />
                      <div>
                        <div className="text-sm text-gray-700 dark:text-gray-300">
                          {day.textNight}
                        </div>
                        <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
                          <FaWind size={10} />
                          <span>{day.windDirNight}</span>
                          <span>{day.windScaleNight}级</span>
                        </div>
                      </div>
                    </div>

                    {/* 温度范围 */}
                    <div className="flex w-32 items-center justify-end space-x-2">
                      <span className="text-sm font-semibold text-blue-500 dark:text-blue-400">
                        {day.tempMin}°
                      </span>
                      <span className="text-gray-400">~</span>
                      <span className="text-sm font-semibold text-red-500 dark:text-red-400">
                        {day.tempMax}°
                      </span>
                    </div>

                    {/* 其他信息 */}
                    <div className="ml-4 flex w-40 items-center justify-end space-x-4 text-xs text-gray-500 dark:text-gray-400">
                      <div className="flex items-center space-x-1">
                        <FaTint size={10} />
                        <span>{day.humidity}%</span>
                      </div>
                      {Number(day.precip) > 0 && (
                        <div className="flex items-center space-x-1">
                          <FaCloudRain size={10} />
                          <span>{day.precip}mm</span>
                        </div>
                      )}
                      <div className="flex items-center space-x-1">
                        <FaSun size={10} />
                        <span>UV{day.uvIndex}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 日出日落信息 */}
          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-orange-50 to-yellow-50 p-4 dark:border-gray-700 dark:from-gray-800 dark:to-gray-800/80">
              <div className="flex items-center space-x-3">
                <FaSun className="text-3xl text-orange-500 dark:text-orange-400" />
                <div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    日出时间
                  </div>
                  <div className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
                    {weatherData.forecast.daily[0]?.sunrise || "--:--"}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-indigo-50 to-purple-50 p-4 dark:border-gray-700 dark:from-gray-800 dark:to-gray-800/80">
              <div className="flex items-center space-x-3">
                <FaMoon className="text-3xl text-indigo-500 dark:text-indigo-400" />
                <div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    日落时间
                  </div>
                  <div className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
                    {weatherData.forecast.daily[0]?.sunset || "--:--"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </GModal>
  );
};

export default DetailModal;
