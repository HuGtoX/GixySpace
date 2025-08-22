"use client";

import React, { useState, useEffect, useCallback } from "react";
import { FaSync, FaRegStar } from "react-icons/fa";
import { Skeleton } from "antd";
import Image from "next/image";
import ActionButton from "@/components/ActionButton";
import axios from "@/lib/axios";
import CacheStorage from "@/lib/storage";
import { useRequest } from "ahooks";
import { SixtySecondsData } from "@gixy/types";

interface HotNewsCardProps {
  title: string;
  icon: React.ReactNode;
  color: string;
  bg: string;
  type: string;
}
const HotNewsCard = ({ title, icon, bg, type, color }: HotNewsCardProps) => {
  const [items, setItems] = useState<SixtySecondsData[]>([]);
  const { loading, runAsync: fetchNews } = useRequest(
    async (refresh?: boolean) => {
      const cacheStorage = new CacheStorage(window.sessionStorage);
      if (!refresh && cacheStorage.getItem(type)) {
        return cacheStorage.getItem(type) as SixtySecondsData[];
      }
      const response = await axios.get<{
        success: boolean;
        data: SixtySecondsData[];
      }>(`/api/news?source=${type}`);
      if (response.success) {
        // 缓存数据，过期时间为 60 秒
        cacheStorage.setItem(type, response.data, 60);
        return response.data;
      }
      return [];
    },
    { manual: true },
  );

  // 初始加载和刷新功能
  const loadData = useCallback(
    (refresh?: boolean) => {
      fetchNews(refresh)
        .then(setItems)
        .catch((error) => console.log("Faild to load news: ", error));
    },
    [fetchNews, setItems],
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="overflow-hidden rounded-xl bg-white shadow-md transition-all duration-300 hover:shadow-lg dark:bg-gray-800">
      {/* 卡片头部 */}
      <div className="flex items-center justify-between border-b border-gray-100 p-4 dark:border-gray-700">
        <div className="flex items-center">
          <div
            className={`${color} mr-2 flex h-8 w-8 items-center justify-center rounded-full text-2xl`}
          >
            {icon}
          </div>
          <h3 className="font-bold">{title}</h3>
        </div>
        <div className="flex items-center gap-2">
          <ActionButton
            color="info"
            onClick={() => loadData(true)}
            loading={loading}
            size="sm"
          >
            <FaSync size={16} />
          </ActionButton>
          <ActionButton color="info" size="sm">
            <FaRegStar size={20} />
          </ActionButton>
        </div>
      </div>

      {/* 新闻列表 */}
      <div className="h-[350px] overflow-auto p-2">
        {loading ? (
          // 加载骨架屏
          Array(5)
            .fill(0)
            .map((_, index) => (
              <div key={index} className="flex items-center gap-3 p-2">
                <Skeleton.Button
                  shape="circle"
                  size="small"
                  className="h-6 w-6"
                />
                <Skeleton.Button
                  shape="circle"
                  size="small"
                  className="h-4 w-4"
                />
                <Skeleton.Input style={{ flex: 1 }} active />
              </div>
            ))
        ) : items?.length > 0 ? (
          items.map((item, index) => (
            <div
              key={item.id}
              className="flex items-center rounded-lg px-3 py-2 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <div
                className={`${bg} mr-3 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs text-white`}
              >
                {index + 1}
              </div>
              {item.extra?.icon && (
                <Image
                  src={item.extra.icon.url}
                  alt="hot"
                  width={16}
                  height={16}
                  className="mr-3 h-4 w-4 flex-shrink-0"
                  style={{
                    transform: `scale(${item.extra.icon.scale || 1})`,
                  }}
                  unoptimized
                />
              )}
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 truncate text-sm text-gray-800 hover:text-blue-500 dark:text-gray-300 dark:hover:text-blue-400"
                title={item.title}
              >
                {item.title}
                {item.extra?.info && (
                  <span className="ml-1 text-xs text-gray-500">
                    {item.extra.info}
                  </span>
                )}
              </a>
            </div>
          ))
        ) : (
          <div className="flex h-full items-center justify-center text-gray-500">
            暂无数据
          </div>
        )}
      </div>
    </div>
  );
};

export default HotNewsCard;
