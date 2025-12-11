"use client";

import React, { useState } from "react";
import { Tabs } from "antd";
import NewsCard from "./HotCard";
import DailyNews from "./DailyNews";
import CurrencyRates from "./CurrencyRates";
// 注意：此处引用路径已更改为HotConfig，请确保该文件存在
import { newsPlatforms, dailyNewsConfig, currencyRatesConfig } from "./config";

const NewsSection = () => {
  // 当前激活的tab键
  const [activeKey, setActiveKey] = useState("hot");

  // 处理tab切换
  const handleTabChange = (key: string) => {
    setActiveKey(key);
  };

  // 配置标签页项
  const items = [
    {
      key: "hot",
      label: "实时热搜",
      children: (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {newsPlatforms.slice(0, 6).map((platform) => (
            <NewsCard
              key={platform.id}
              title={platform.title}
              type={platform.id}
              bg={platform.bg}
              icon={platform.icon}
              color={platform.color}
            />
          ))}
        </div>
      ),
    },
    {
      key: "daily",
      label: (
        <div className="flex items-center">
          <span>{dailyNewsConfig?.title || "每日新闻"}</span>
        </div>
      ),
      children: <DailyNews />,
    },
    {
      key: "currency",
      label: (
        <div className="flex items-center">
          <span>{currencyRatesConfig.title}</span>
        </div>
      ),
      children: <CurrencyRates />,
    },
  ];

  return (
    <div className="mb-8">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold">热点资讯</h2>
      </div>
      <Tabs
        activeKey={activeKey}
        onChange={handleTabChange}
        items={items}
        tabBarStyle={{ marginBottom: "16px" }}
      />
    </div>
  );
};

export default NewsSection;
