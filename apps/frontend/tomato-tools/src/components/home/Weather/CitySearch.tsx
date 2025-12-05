import { useState, useMemo } from "react";
import { Input, Empty } from "antd";
import { FaSearch, FaMapMarkerAlt } from "react-icons/fa";

// 城市数据接口
export interface CityData {
  name: string;
  lat: number;
  lon: number;
  province?: string;
  locationId?: string;
}

interface CitySearchProps {
  cities: CityData[];
  onSelectCity: (city: CityData) => void;
  selectedCity?: CityData;
}

// 热门城市列表
const HOT_CITIES: CityData[] = [
  { name: "北京", lat: 39.9, lon: 116.4, province: "北京市" },
  { name: "上海", lat: 31.23, lon: 121.47, province: "上海市" },
  { name: "广州", lat: 23.13, lon: 113.26, province: "广东省" },
  { name: "深圳", lat: 22.56, lon: 113.91, province: "广东省" },
  { name: "成都", lat: 30.57, lon: 104.06, province: "四川省" },
  { name: "杭州", lat: 30.25, lon: 120.17, province: "浙江省" },
  { name: "重庆", lat: 29.56, lon: 106.55, province: "重庆市" },
  { name: "西安", lat: 34.27, lon: 108.93, province: "陕西省" },
];

export default function CitySearch({
  cities,
  onSelectCity,
  selectedCity,
}: CitySearchProps) {
  const [searchText, setSearchText] = useState("");

  // 搜索过滤
  const filteredCities = useMemo(() => {
    if (!searchText.trim()) {
      return [];
    }

    const searchLower = searchText.toLowerCase().trim();
    return cities
      .filter(
        (city) =>
          city.name.toLowerCase().includes(searchLower) ||
          (city.province && city.province.toLowerCase().includes(searchLower)),
      )
      .slice(0, 20); // 最多显示20个结果
  }, [searchText, cities]);

  const handleCityClick = (city: CityData) => {
    onSelectCity(city);
    setSearchText(""); // 清空搜索框
  };

  return (
    <div className="space-y-3">
      {/* 搜索框 */}
      <div className="relative">
        <Input
          placeholder="搜索城市名称..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          prefix={<FaSearch className="text-gray-400" size={14} />}
          className="rounded-lg"
          size="large"
          allowClear
        />
      </div>

      {/* 搜索结果 */}
      {searchText.trim() && (
        <div className="max-h-64 overflow-y-auto rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
          {filteredCities.length > 0 ? (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {filteredCities.map((city, index) => (
                <div
                  key={`${city.name}-${index}`}
                  className={`flex cursor-pointer items-center justify-between px-4 py-2.5 transition-colors hover:bg-blue-50 dark:hover:bg-gray-700 ${
                    selectedCity?.name === city.name
                      ? "bg-blue-50 dark:bg-gray-700"
                      : ""
                  }`}
                  onClick={() => handleCityClick(city)}
                >
                  <div className="flex items-center space-x-2">
                    <FaMapMarkerAlt
                      size={12}
                      className="text-blue-500 dark:text-blue-400"
                    />
                    <span className="font-medium text-gray-900 dark:text-white">
                      {city.name}
                    </span>
                    {city.province && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {city.province}
                      </span>
                    )}
                  </div>
                  {selectedCity?.name === city.name && (
                    <svg
                      className="h-4 w-4 text-blue-500"
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
              ))}
            </div>
          ) : (
            <div className="py-8">
              <Empty
                description="未找到匹配的城市"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            </div>
          )}
        </div>
      )}

      {/* 热门城市 */}
      {!searchText.trim() && (
        <div>
          <div className="mb-2 text-xs font-semibold text-gray-600 dark:text-gray-400">
            热门城市
          </div>
          <div className="grid grid-cols-4 gap-2">
            {HOT_CITIES.map((city) => (
              <button
                key={city.name}
                onClick={() => handleCityClick(city)}
                className={`rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
                  selectedCity?.name === city.name
                    ? "border-blue-500 bg-blue-50 text-blue-600 dark:border-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                    : "border-gray-200 bg-white text-gray-700 hover:border-blue-300 hover:bg-blue-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-blue-600 dark:hover:bg-gray-700"
                }`}
              >
                {city.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
