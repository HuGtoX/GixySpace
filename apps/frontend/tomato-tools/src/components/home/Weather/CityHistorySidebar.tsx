import { useState, useEffect } from "react";
import { Spin, Empty, message } from "antd";
import { FaHistory, FaClock, FaTrash, FaMapMarkerAlt } from "react-icons/fa";
import type { CityData } from "./CitySearch";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/zh-cn";

dayjs.extend(relativeTime);
dayjs.locale("zh-cn");

interface CityHistoryItem {
  id: string;
  cityName: string;
  cityNameEn?: string;
  locationId?: string;
  latitude: string;
  longitude: string;
  province?: string;
  visitCount: number;
  lastVisitAt: string;
  createdAt: string;
}

interface CityHistorySidebarProps {
  onSelectCity: (city: CityData) => void;
  selectedCity?: CityData;
  onHistoryUpdate?: () => void;
}

export default function CityHistorySidebar({
  onSelectCity,
  selectedCity,
  onHistoryUpdate,
}: CityHistorySidebarProps) {
  const [histories, setHistories] = useState<CityHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 加载历史记录
  const loadHistories = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/weather/history?limit=20");
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "获取历史记录失败");
      }

      setHistories(data.data || []);
    } catch (err) {
      console.error("加载历史记录失败:", err);
      setError(err instanceof Error ? err.message : "加载失败");
    } finally {
      setIsLoading(false);
    }
  };

  // 删除历史记录
  const handleDelete = async (id: string, cityName: string) => {
    try {
      const response = await fetch(`/api/weather/history?id=${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "删除失败");
      }

      message.success(`已删除 ${cityName} 的历史记录`);
      loadHistories(); // 重新加载列表
      onHistoryUpdate?.();
    } catch (err) {
      console.error("删除历史记录失败:", err);
      message.error(err instanceof Error ? err.message : "删除失败");
    }
  };

  // 选择城市
  const handleSelectCity = (history: CityHistoryItem) => {
    const city: CityData = {
      name: history.cityName,
      lat: parseFloat(history.latitude),
      lon: parseFloat(history.longitude),
      province: history.province,
      locationId: history.locationId,
    };
    onSelectCity(city);
  };

  useEffect(() => {
    loadHistories();
  }, []);

  return (
    <div className="flex h-full flex-col">
      {/* 标题 */}
      <div className="mb-3 flex items-center space-x-2 border-b border-gray-200 pb-3 dark:border-gray-700">
        <FaHistory className="text-purple-500 dark:text-purple-400" size={16} />
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
          最近访问
        </h3>
        {histories.length > 0 && (
          <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
            {histories.length}
          </span>
        )}
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Spin size="small" />
          </div>
        ) : error ? (
          <div className="rounded-lg bg-red-50 p-4 text-center text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        ) : histories.length === 0 ? (
          <div className="py-8">
            <Empty
              description="暂无访问记录"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          </div>
        ) : (
          <div className="space-y-2">
            {histories.map((history) => (
              <div
                key={history.id}
                className={`group relative rounded-lg border p-3 transition-all ${
                  selectedCity?.name === history.cityName
                    ? "border-purple-300 bg-purple-50 dark:border-purple-600 dark:bg-purple-900/20"
                    : "border-gray-200 bg-white hover:border-purple-200 hover:bg-purple-50/50 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-purple-700 dark:hover:bg-gray-700"
                }`}
              >
                {/* 城市信息 */}
                <div
                  className="cursor-pointer"
                  onClick={() => handleSelectCity(history)}
                >
                  <div className="mb-1.5 flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      <FaMapMarkerAlt
                        size={12}
                        className="mt-0.5 text-purple-500 dark:text-purple-400"
                      />
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {history.cityName}
                      </span>
                    </div>
                    {selectedCity?.name === history.cityName && (
                      <svg
                        className="h-4 w-4 text-purple-500"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>

                  {history.province && (
                    <div className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                      {history.province}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-1 text-gray-500 dark:text-gray-400">
                      <FaClock size={10} />
                      <span>{dayjs(history.lastVisitAt).fromNow()}</span>
                    </div>
                    <span className="text-gray-400 dark:text-gray-500">
                      访问 {history.visitCount} 次
                    </span>
                  </div>
                </div>

                {/* 删除按钮 */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(history.id, history.cityName);
                  }}
                  className="absolute right-2 top-2 rounded p-1 text-gray-400 opacity-0 transition-all hover:bg-red-50 hover:text-red-500 group-hover:opacity-100 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                  title="删除记录"
                >
                  <FaTrash size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
