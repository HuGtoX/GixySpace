import { useState, useMemo, useRef } from "react";
import { Select, Spin } from "antd";
import { debounce } from "@gixy/utils";
import { ApiResponse } from "@/types";
import axios from "@/lib/clients/http";

// 城市数据接口
export interface CityData {
  name: string;
  locationID: number | string;
}

interface CitySearchProps {
  onSelectCity: (city: CityData) => void;
  selectedCity?: CityData;
}
interface ValueType {
  key?: string;
  label: React.ReactNode;
  value: any;
  avatar?: string;
}

type CitySearchRespone = ApiResponse<Array<Record<string, any>>>;
export default function CitySearch({
  onSelectCity,
  selectedCity,
}: CitySearchProps) {
  const [searchText, setSearchText] = useState("");
  const [fetching, setFetching] = useState(false);
  const [options, setOptions] = useState<ValueType[]>([]);
  const fetchRef = useRef(0);

  const debounceFetcher = useMemo(() => {
    const fetchOptions = async (value: string) => {
      const { data } = await axios.get<CitySearchRespone>(
        `/api/weather/cities?name=${value}`,
      );
      if (!data) return [];
      return data?.map((item) => ({
        label: `${item.field8}-${item.field10}-${item.field3}`,
        value: item["China-City-List v202506200"],
      }));
    };

    const loadOptions = (value: string) => {
      fetchRef.current += 1;
      const fetchId = fetchRef.current;
      setOptions([]);
      setFetching(true);

      fetchOptions(value).then((newOptions) => {
        if (fetchId !== fetchRef.current) {
          return;
        }
        setOptions(newOptions);
        setFetching(false);
      });
    };
    return debounce(loadOptions, 500);
  }, []);

  const handleCityClick = (value: string, option?: ValueType | ValueType[]) => {
    if (!option || Array.isArray(option)) return;
    const labelParts = option.label as string;
    const cityData: CityData = {
      name: labelParts || "",
      locationID: value,
    };
    onSelectCity(cityData);
    setSearchText(""); // 清空搜索框
  };

  return (
    <Select
      style={{ width: "100%" }}
      showSearch={{ optionFilterProp: "label", onSearch: debounceFetcher }}
      placeholder="搜索城市或者县区"
      onChange={handleCityClick}
      notFoundContent={fetching ? <Spin size="small" /> : "No results found"}
      options={options}
      value={null}
    />
  );
}
