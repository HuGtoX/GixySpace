"use client";

import { useState, useEffect } from "react";
import { FaMapMarkerAlt, FaClock, FaChevronLeft } from "react-icons/fa";
import { Spin } from "antd";
import type { CityData } from "./CitySearch";

interface HistoryCityListProps {
  selectedCity: CityData;
  onCitySelect: (city: CityData) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
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

const HistoryCityList: React.FC<HistoryCityListProps> = ({
  selectedCity,
  onCitySelect,
  collapsed,
  onToggleCollapse,
}) => {
  const [historyCities, setHistoryCities] = useState<HistoryCity[]>([]);
  const [loading, setLoading] = useState(true);

  // 获取历史城市列表
  const fetchHistoryCities = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/weather/history");
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setHistoryCities(result.data || []);
        }
      }
    } catch (error) {
      console.error("获取历史城市失败:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistoryCities();
  }, []);

  // 格式化时间
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return "今天";
    } else if (days === 1) {
      return "昨天";
    } else if (days < 7) {
      return `${days}天前`;
    } else {
      return `${date.getMonth() + 1}/${date.getDate()}`;
    }
  };

  // 处理城市点击
  const handleCityClick = (city: HistoryCity) => {
    const cityData: CityData = {
      name: city.cityName,
      locationId: city.locationId,
      lat: city.latitude,
      lon: city.longitude,
      province: city.province,
    };
    onCitySelect(cityData);
  };

  return (
    <div
      className={`relative flex h-full flex-col border-r border-gray-200 bg-gray-50 transition-all duration-300 dark:border-gray-700 dark:bg-gray-800/50 ${
        collapsed ? "w-12" : "w-64"
      }`}
    >
      {/* 折叠按钮 */}
      <button
        onClick={onToggleCollapse}
        className="absolute -right-3 top-4 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm transition-all hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
        title={collapsed ? "展开" : "收起"}
      >
        <FaChevronLeft
          size={10}
          className={`text-gray-600 transition-transform dark:text-gray-400 ${
            collapsed ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* 内容区域 */}
      <div className={`flex-1 overflow-hidden ${collapsed ? "hidden" : ""}`}>
        <div className="p-4">
          <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
            历史查询
          </h3>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Spin size="small" />
            </div>
          ) : historyCities.length === 0 ? (
            <div className="py-8 text-center text-xs text-gray-400 dark:text-gray-500">
              暂无历史记录
            </div>
          ) : (
            <div className="space-y-2">
              {historyCities.map((city) => (
                <div
                  key={city.id}
                  onClick={() => handleCityClick(city)}
                  className={`group cursor-pointer rounded-lg border p-3 transition-all hover:shadow-md ${
                    selectedCity.locationId === city.locationId
                      ? "border-blue-500 bg-blue-50 dark:border-blue-600 dark:bg-blue-900/20"
                      : "border-gray-200 bg-white hover:border-blue-300 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-blue-600"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-1.5">
                        <FaMapMarkerAlt
                          size={11}
                          className={`${
                            selectedCity.locationId === city.locationId
                              ? "text-blue-500 dark:text-blue-400"
                              : "text-gray-400 dark:text-gray-500"
                          }`}
                        />
                        <span
                          className={`text-sm font-medium ${
                            selectedCity.locationId === city.locationId
                              ? "text-blue-700 dark:text-blue-300"
                              : "text-gray-700 dark:text-gray-300"
                          }`}
                        >
                          {city.cityName}
                        </span>
                      </div>
                      {city.province && (
                        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          {city.province}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end space-y-1">
                      <div className="flex items-center space-x-1 text-xs text-gray-400 dark:text-gray-500">
                        <FaClock size={9} />
                        <span>{formatTime(city.lastVisitAt)}</span>
                      </div>
                      {city.visitCount > 1 && (
                        <div className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                          {city.visitCount}次
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 折叠状态下的提示 */}
      {collapsed && (
        <div className="flex h-full items-center justify-center">
          <div className="rotate-90 whitespace-nowrap text-xs text-gray-400 dark:text-gray-500">
            历史
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoryCityList;
