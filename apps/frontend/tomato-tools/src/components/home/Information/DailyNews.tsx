"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { FaCalendar, FaLink, FaHistory, FaClock } from "react-icons/fa";
import { Divider, List, Button } from "antd";
import axios from "@/lib/clients/http";
import { useRequest } from "ahooks";
import { SixtySecondsData, HistoryTodayData } from "@gixy/types";
import { SixtySecondsResponse } from "@/lib/api/news/sources/60s";
import SectionCard from "@/components/ui/SectionCard";
import Skeleton from "./Skeleton";

const MAX_VISIBLE_ITEMS = 5;
const MAX_VISIBLE_HISTORY = 5;

const DailyNews = () => {
  const [newsData, setNewsData] = useState<SixtySecondsData | null>(null);
  const [historyData, setHistoryData] = useState<HistoryTodayData | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [historyExpanded, setHistoryExpanded] = useState(false);

  const { loading, runAsync: fetchNews } = useRequest(
    async () => {
      const response =
        await axios.get<SixtySecondsResponse>(`/api/news?source=60s`);
      return response;
    },
    { manual: true },
  );

  const displayNews = useMemo(() => {
    if (!newsData?.news || !newsData.news.length) return [];
    return newsData.news.slice(
      0,
      expanded ? newsData.news.length : MAX_VISIBLE_ITEMS,
    );
  }, [newsData, expanded]);

  const displayHistory = useMemo(() => {
    if (!historyData || !historyData.items.length) return [];
    return historyData.items.slice(
      0,
      historyExpanded ? historyData.items.length : MAX_VISIBLE_HISTORY,
    );
  }, [historyData, historyExpanded]);

  // 初始加载
  const loadData = useCallback(() => {
    fetchNews()
      .then((res) => {
        setNewsData(res.sixty);
        setHistoryData(res.history);
      })
      .catch((error) => console.log("Failed to load news: ", error));
  }, [fetchNews, setNewsData, setHistoryData]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getCurrentMonthDay = () => {
    const date = new Date();
    return date.toLocaleDateString("zh-CN", { month: "long", day: "numeric" });
  };

  return (
    <SectionCard className="flex h-full flex-col overflow-hidden rounded-xl">
      {loading ? (
        <Skeleton />
      ) : newsData ? (
        <div className="flex flex-1 flex-col">
          <div className="dark:bg-gray-850 border-b border-gray-100 p-4 transition-all duration-300 dark:border-gray-700">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                <FaCalendar
                  size={14}
                  className="mr-2 text-blue-500 dark:text-blue-400"
                />
                <span className="font-medium">{formatDate(newsData.date)}</span>
              </div>

              <div className="flex items-center text-sm">
                <FaLink
                  size={14}
                  className="mr-2 text-blue-500 dark:text-blue-400"
                />
                <a
                  href={newsData.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 transition-colors duration-200 hover:text-blue-600 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
                >
                  原文链接
                </a>
              </div>
            </div>
          </div>

          {/* 新闻内容 - 列表展示 */}
          <div className="p-4">
            <Skeleton data={newsData.news} loading={loading}>
              <div>
                <h4 className="mb-3 flex items-center text-base font-semibold text-gray-700 dark:text-gray-300">
                  <FaClock
                    size={16}
                    className="mr-2 text-blue-500 dark:text-blue-400"
                  />
                  今日新闻
                </h4>
                <List
                  dataSource={displayNews}
                  renderItem={(item, index) => (
                    <List.Item className="border-none">
                      <a
                        target="_blank"
                        href={`https://www.baidu.com/s?wd=${item}`}
                        className="text-gray-800 dark:text-gray-200"
                      >
                        {index + 1}. {item}
                      </a>
                    </List.Item>
                  )}
                />
                {newsData.news.length > MAX_VISIBLE_ITEMS && (
                  <div className="mt-2 flex justify-center">
                    <Button type="link" onClick={() => setExpanded(!expanded)}>
                      {expanded ? "收起" : "查看更多"}
                    </Button>
                  </div>
                )}
              </div>
            </Skeleton>

            <Divider className="my-2" />

            {/* 历史上的今天 */}
            <div>
              <h4 className="mb-3 flex items-center text-base font-semibold text-gray-700 dark:text-gray-300">
                <FaHistory
                  size={16}
                  className="mr-2 text-orange-500 dark:text-orange-400"
                />
                历史上的今天 ({historyData?.date || getCurrentMonthDay()})
              </h4>

              <Skeleton data={historyData?.items} loading={loading}>
                <List
                  dataSource={displayHistory}
                  renderItem={(item) => (
                    <List.Item className="border-none">
                      <div
                        onClick={() => {
                          window.open(item.link, "_blank");
                        }}
                        className="cursor-pointer"
                      >
                        <p className="leading-relaxed">
                          <span className="mr-1 font-semibold text-orange-500 dark:text-orange-400">
                            {item.year}�?
                          </span>
                          {item.title}
                        </p>
                      </div>
                    </List.Item>
                  )}
                />
                {historyData!.items.length > MAX_VISIBLE_ITEMS && (
                  <div className="mt-2 flex justify-center">
                    <Button
                      type="link"
                      onClick={() => setHistoryExpanded(!historyExpanded)}
                    >
                      {historyExpanded ? "收起" : "查看更多"}
                    </Button>
                  </div>
                )}
              </Skeleton>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center p-4 text-gray-500 dark:text-gray-400">
          暂无数据
        </div>
      )}
    </SectionCard>
  );
};

export default DailyNews;
