"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  Select,
  Spin,
  message,
  Row,
  Col,
  Typography,
  Divider,
  Input,
  Tag,
} from "antd";
import {
  DollarOutlined,
  ReloadOutlined,
  FilterOutlined,
  DownOutlined,
  UpOutlined,
} from "@ant-design/icons";
import axios from "@/lib/axios";

const { Option } = Select;
const { Title, Text } = Typography;
const { Search } = Input;

interface CurrencyRate {
  currency: string;
  rate: number;
  change: number;
  changePercent: number;
}

// 60s API 返回的数据结构
interface CurrencyRatesResponse {
  success: boolean;
  data: {
    base_code: string;
    updated: string;
    updated_at: number;
    next_updated: string;
    next_updated_at: number;
    rates: Array<{
      currency: string;
      rate: number;
    }>;
  };
  message?: string;
  error?: string;
}

const CurrencyRates = () => {
  const [loading, setLoading] = useState(false);
  const [rates, setRates] = useState<CurrencyRate[]>([]);
  const [selectedBase, setSelectedBase] = useState("CNY");
  const [updateTime, setUpdateTime] = useState<string>("");
  const [searchText, setSearchText] = useState("");
  const [selectedCurrencies, setSelectedCurrencies] = useState<string[]>([]);
  const [filteredRates, setFilteredRates] = useState<CurrencyRate[]>([]);
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);

  // 常用货币列表
  const popularCurrencies = [
    { code: "CNY", name: "人民币", symbol: "¥" },
    { code: "USD", name: "美元", symbol: "$" },
    { code: "EUR", name: "欧元", symbol: "€" },
    { code: "JPY", name: "日元", symbol: "¥" },
    { code: "GBP", name: "英镑", symbol: "£" },
    { code: "HKD", name: "港币", symbol: "HK$" },
    { code: "KRW", name: "韩元", symbol: "₩" },
    { code: "SGD", name: "新加坡元", symbol: "S$" },
    { code: "AUD", name: "澳元", symbol: "A$" },
    { code: "CAD", name: "加元", symbol: "C$" },
    { code: "CHF", name: "瑞士法郎", symbol: "CHF" },
    { code: "NZD", name: "新西兰元", symbol: "NZ$" },
    { code: "RUB", name: "俄罗斯卢布", symbol: "₽" },
    { code: "INR", name: "印度卢比", symbol: "₹" },
    { code: "THB", name: "泰铢", symbol: "฿" },
    { code: "MYR", name: "马来西亚林吉特", symbol: "RM" },
    { code: "PHP", name: "菲律宾比索", symbol: "₱" },
    { code: "IDR", name: "印尼盾", symbol: "Rp" },
    { code: "VND", name: "越南盾", symbol: "₫" },
    { code: "TWD", name: "新台币", symbol: "NT$" },
    { code: "AED", name: "阿联酋迪拉姆", symbol: "د.إ" },
    { code: "SAR", name: "沙特里亚尔", symbol: "﷼" },
    { code: "TRY", name: "土耳其里拉", symbol: "₺" },
  ];

  // 获取汇率数据
  const fetchCurrencyRates = async (baseCurrency: string = "CNY") => {
    setLoading(true);
    try {
      // 60s API 总是返回以CNY为基准的汇率，我们需要在前端进行转换
      const data: CurrencyRatesResponse = await axios.get(
        `/api/currency?base=CNY`,
      );

      if (data.success && data.data) {
        // 60s API 返回的是数组格式的汇率数据
        const ratesArray = data.data.rates;

        // 创建汇率映射对象，方便查找
        const ratesMap: Record<string, number> = {};
        ratesArray.forEach((item) => {
          ratesMap[item.currency] = item.rate;
        });

        // 如果基准货币不是CNY，需要进行汇率转换
        let formattedRates: CurrencyRate[] = [];

        if (baseCurrency === "CNY") {
          // 直接使用CNY基准的汇率
          formattedRates = popularCurrencies
            .filter(
              (currency) =>
                currency.code !== baseCurrency && ratesMap[currency.code],
            )
            .map((currency) => ({
              currency: currency.code,
              rate: ratesMap[currency.code],
              change: 0,
              changePercent: 0,
            }));
        } else {
          // 转换为其他基准货币
          const baseRate = ratesMap[baseCurrency];
          if (baseRate) {
            formattedRates = popularCurrencies
              .filter(
                (currency) =>
                  currency.code !== baseCurrency && ratesMap[currency.code],
              )
              .map((currency) => ({
                currency: currency.code,
                rate: ratesMap[currency.code] / baseRate, // 转换汇率
                change: 0,
                changePercent: 0,
              }));

            // 添加CNY到目标货币列表（如果不是CNY基准）
            if (baseCurrency !== "CNY") {
              formattedRates.unshift({
                currency: "CNY",
                rate: 1 / baseRate,
                change: 0,
                changePercent: 0,
              });
            }
          }
        }

        setRates(formattedRates);
        // 格式化更新时间
        const updateDate = new Date(data.data.updated);
        setUpdateTime(updateDate.toLocaleString("zh-CN"));
      } else {
        message.error(data.error || "获取汇率数据失败");
      }
    } catch (error) {
      console.error("获取汇率数据错误:", error);
      message.error("网络请求失败，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  // 从localStorage加载筛选设置
  useEffect(() => {
    const savedFilters = localStorage.getItem("currency-filters");
    if (savedFilters) {
      try {
        const filters = JSON.parse(savedFilters);
        setSelectedCurrencies(filters.selectedCurrencies || []);
        setSearchText(filters.searchText || "");
        setIsFilterExpanded(filters.isFilterExpanded ?? false);
      } catch (error) {
        console.error("解析筛选设置失败:", error);
      }
    }
  }, []);

  // 保存筛选设置到localStorage
  const saveFiltersToStorage = (
    currencies: string[],
    search: string,
    expanded?: boolean,
  ) => {
    const filters = {
      selectedCurrencies: currencies,
      searchText: search,
      isFilterExpanded: expanded ?? isFilterExpanded,
      timestamp: Date.now(),
    };
    localStorage.setItem("currency-filters", JSON.stringify(filters));
  };

  // 筛选汇率数据
  useEffect(() => {
    let filtered = rates;

    // 按搜索文本筛选
    if (searchText) {
      filtered = filtered.filter((rate) => {
        const currencyInfo = getCurrencyInfo(rate.currency);
        return (
          currencyInfo.code.toLowerCase().includes(searchText.toLowerCase()) ||
          currencyInfo.name.toLowerCase().includes(searchText.toLowerCase())
        );
      });
    }

    // 按选中的货币筛选
    if (selectedCurrencies.length > 0) {
      filtered = filtered.filter((rate) =>
        selectedCurrencies.includes(rate.currency),
      );
    }

    setFilteredRates(filtered);
  }, [rates, searchText, selectedCurrencies]);

  // 组件挂载时获取数据
  useEffect(() => {
    fetchCurrencyRates(selectedBase);
  }, [selectedBase]);

  // 处理基础货币切换
  const handleBaseChange = (value: string) => {
    setSelectedBase(value);
  };

  // 刷新数据
  const handleRefresh = () => {
    fetchCurrencyRates(selectedBase);
  };

  // 获取货币信息
  const getCurrencyInfo = (code: string) => {
    return (
      popularCurrencies.find((c) => c.code === code) || {
        code,
        name: code,
        symbol: "",
      }
    );
  };

  // 处理搜索文本变化
  const handleSearchChange = (value: string) => {
    setSearchText(value);
    saveFiltersToStorage(selectedCurrencies, value);
  };

  // 处理货币选择变化
  const handleCurrencySelect = (currencies: string[]) => {
    setSelectedCurrencies(currencies);
    saveFiltersToStorage(currencies, searchText);
  };

  // 清除所有筛选
  const clearAllFilters = () => {
    setSearchText("");
    setSelectedCurrencies([]);
    saveFiltersToStorage([], "");
  };

  // 移除单个货币筛选
  const removeCurrencyFilter = (currency: string) => {
    const newSelected = selectedCurrencies.filter((c) => c !== currency);
    setSelectedCurrencies(newSelected);
    saveFiltersToStorage(newSelected, searchText);
  };

  // 切换筛选展开状态
  const toggleFilterExpanded = () => {
    const newExpanded = !isFilterExpanded;
    setIsFilterExpanded(newExpanded);
    saveFiltersToStorage(selectedCurrencies, searchText, newExpanded);
  };

  return (
    <div className="currency-rates">
      <div className="mb-4">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <DollarOutlined className="text-lg text-green-600" />
            <Title level={4} className="!mb-0">
              当日货币汇率
            </Title>
          </div>
          <div className="flex items-center gap-2">
            <Text type="secondary" className="text-sm">
              基准货币：
            </Text>
            <Select
              value={selectedBase}
              onChange={handleBaseChange}
              style={{ width: 120 }}
              size="small"
            >
              {popularCurrencies.map((currency) => (
                <Option key={currency.code} value={currency.code}>
                  {currency.code}
                </Option>
              ))}
            </Select>
            <ReloadOutlined
              className="cursor-pointer text-blue-500 hover:text-blue-700"
              onClick={handleRefresh}
              spin={loading}
            />
          </div>
        </div>

        {/* 筛选控件区域 */}
        <div className="rounded-lg border border-blue-100 bg-gradient-to-r from-blue-50 to-green-50 shadow-sm dark:border-gray-600 dark:from-gray-800 dark:to-gray-700">
          {/* 筛选头部 - 始终显示 */}
          <div
            className="flex cursor-pointer items-center justify-between p-4 transition-colors hover:bg-blue-50/50 dark:hover:bg-gray-700/50"
            onClick={toggleFilterExpanded}
          >
            <div className="flex items-center gap-2">
              <FilterOutlined className="text-blue-600 dark:text-blue-400" />
              <Text strong className="text-sm text-blue-800 dark:text-blue-300">
                货币筛选
              </Text>
              {(searchText || selectedCurrencies.length > 0) && (
                <div className="ml-2 flex items-center gap-2">
                  <div className="h-2 w-2 animate-pulse rounded-full bg-green-500"></div>
                  <Text className="rounded bg-green-100 px-2 py-0.5 text-xs text-green-600 dark:bg-green-900/50 dark:text-green-400">
                    已筛选{" "}
                    {selectedCurrencies.length > 0
                      ? selectedCurrencies.length
                      : ""}
                  </Text>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {(searchText || selectedCurrencies.length > 0) && (
                <Text
                  className="cursor-pointer text-xs text-blue-500 hover:text-blue-700 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
                  onClick={(e) => {
                    e.stopPropagation();
                    clearAllFilters();
                  }}
                >
                  清除筛选
                </Text>
              )}
              {isFilterExpanded ? (
                <UpOutlined className="text-xs text-blue-600 dark:text-blue-400" />
              ) : (
                <DownOutlined className="text-xs text-blue-600 dark:text-blue-400" />
              )}
            </div>
          </div>

          {/* 筛选内容 - 可展开收起 */}
          {isFilterExpanded && (
            <div className="border-t border-blue-100 px-4 pb-4 pt-3 dark:border-gray-600">
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-3 sm:flex-row">
                  {/* 搜索框 */}
                  <div className="flex-1">
                    <Search
                      placeholder="搜索货币代码或名称..."
                      value={searchText}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      size="small"
                      allowClear
                    />
                  </div>

                  {/* 货币多选 */}
                  <div className="flex-1">
                    <Select
                      mode="multiple"
                      placeholder="选择要显示的货币"
                      value={selectedCurrencies}
                      onChange={handleCurrencySelect}
                      style={{ width: "100%" }}
                      size="small"
                      maxTagCount={3}
                      maxTagTextLength={4}
                    >
                      {popularCurrencies
                        .filter((currency) => currency.code !== selectedBase)
                        .map((currency) => (
                          <Option key={currency.code} value={currency.code}>
                            {currency.code} - {currency.name}
                          </Option>
                        ))}
                    </Select>
                  </div>
                </div>

                {/* 已选择的货币标签 */}
                {selectedCurrencies.length > 0 && (
                  <div className="flex flex-wrap gap-2 rounded border border-blue-100 bg-white/60 p-2 dark:border-gray-600 dark:bg-gray-700/60">
                    <Text className="mr-2 flex items-center text-xs font-medium text-blue-700 dark:text-blue-300">
                      已选择:
                    </Text>
                    {selectedCurrencies.map((currency) => {
                      const info = getCurrencyInfo(currency);
                      return (
                        <Tag
                          key={currency}
                          closable
                          onClose={() => removeCurrencyFilter(currency)}
                          className="border-blue-200 bg-blue-100 text-xs text-blue-700 hover:bg-blue-200 dark:border-blue-700 dark:bg-blue-900/50 dark:text-blue-300 dark:hover:bg-blue-800/50"
                          color="blue"
                        >
                          {info.code}
                        </Tag>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {updateTime && (
        <div className="mb-4">
          <Text type="secondary" className="text-sm">
            更新时间: {updateTime}
          </Text>
        </div>
      )}

      <Spin spinning={loading}>
        <Row gutter={[16, 16]}>
          {filteredRates.map((rate) => {
            const currencyInfo = getCurrencyInfo(rate.currency);
            const baseInfo = getCurrencyInfo(selectedBase);

            return (
              <Col xs={24} sm={12} md={8} lg={6} key={rate.currency}>
                <Card
                  size="small"
                  className="transition-shadow hover:shadow-md dark:border-gray-600 dark:bg-gray-800"
                  bodyStyle={{ padding: "12px" }}
                >
                  <div className="text-center">
                    <div className="mb-2 flex items-center justify-center gap-2">
                      <Text strong className="text-base">
                        {currencyInfo.code}
                      </Text>
                      <Text type="secondary" className="text-sm">
                        {currencyInfo.name}
                      </Text>
                    </div>

                    <Divider className="!my-2" />

                    <div className="mb-1">
                      <Text className="text-xs text-gray-500">
                        1 {baseInfo.symbol}
                        {baseInfo.code} =
                      </Text>
                    </div>

                    <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                      {currencyInfo.symbol}
                      {rate.rate.toFixed(4)}
                    </div>

                    {rate.changePercent !== 0 && (
                      <div
                        className={`text-sm ${rate.changePercent > 0 ? "text-red-500" : "text-green-500"}`}
                      >
                        {rate.changePercent > 0 ? "+" : ""}
                        {rate.changePercent.toFixed(2)}%
                      </div>
                    )}
                  </div>
                </Card>
              </Col>
            );
          })}
        </Row>
      </Spin>

      {rates.length === 0 && !loading && (
        <div className="py-8 text-center">
          <Text type="secondary">暂无汇率数据</Text>
        </div>
      )}

      {rates.length > 0 && filteredRates.length === 0 && !loading && (
        <div className="rounded-lg border border-blue-100 bg-gradient-to-b from-blue-50 to-transparent py-8 text-center dark:border-gray-600 dark:from-gray-800">
          <Text className="text-blue-600 dark:text-blue-400">
            没有符合筛选条件的货币
          </Text>
          <div className="mt-3">
            <Text
              className="inline-block cursor-pointer rounded bg-blue-500 px-4 py-2 text-sm text-white transition-colors hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
              onClick={clearAllFilters}
            >
              清除筛选条件
            </Text>
          </div>
        </div>
      )}
    </div>
  );
};

export default CurrencyRates;
