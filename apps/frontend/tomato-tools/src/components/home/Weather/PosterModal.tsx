"use client";

import React, { useState } from "react";
import { Modal, Button, Spin, message } from "antd";
import Image from "next/image";
import GModal from "@/components/ui/Modal";
import type { WeatherPosterData } from "@/lib/api/types";
import axios from "@/lib/clients/http";

interface PosterModalProps {
  visible: boolean;
  onClose: () => void;
  cityName: string;
}

export default function PosterModal({
  visible,
  onClose,
  cityName,
}: PosterModalProps) {
  const [loading, setLoading] = useState(false);
  const [posterData, setPosterData] = useState<WeatherPosterData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isFromCache, setIsFromCache] = useState(false); // 标记是否为缓存数据

  // 当 Modal 打开时生成画报
  React.useEffect(() => {
    if (visible && !posterData && !loading) {
      generatePoster();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const generatePoster = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.post("/api/weather/poster", {
        city: cityName,
      });

      if (response.success) {
        setPosterData(response.data.poster);
        setIsFromCache(!response.data.isFirstToday); // 根据 isFirstToday 判断是否为缓存

        if (response.data.isFirstToday) {
          message.success("画报生成成功！");
        } else {
          message.info("已加载今日生成的画报");
        }
      } else {
        setError(response.data.error || "画报生成失败");
        message.error(response.data.error || "画报生成失败");
      }
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.error || err.message || "画报生成失败";
      setError(errorMsg);
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setPosterData(null);
    setError(null);
    setIsFromCache(false);
    onClose();
  };

  const handleRetry = () => {
    setPosterData(null);
    setError(null);
    setIsFromCache(false);
    generatePoster();
  };

  return (
    <GModal
      title="今日天气画报"
      isMacOSStyle
      visible={visible}
      onClose={handleClose}
      width={600}
      centered
    >
      <div className="py-4">
        {loading && (
          <div className="flex flex-col items-center justify-center py-12">
            <Spin size="large" />
            <p className="mt-4 text-gray-500 dark:text-gray-400">
              正在生成画报，请稍候...
            </p>
          </div>
        )}

        {error && !loading && (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="mb-4 rounded-lg bg-red-50 p-4 text-center dark:bg-red-900/20">
              <p className="text-red-600 dark:text-red-400">{error}</p>
            </div>
            {!error.includes("今日已生成") && (
              <Button type="primary" onClick={handleRetry}>
                重试
              </Button>
            )}
          </div>
        )}

        {posterData && !loading && (
          <div className="space-y-4">
            {/* 画报图片 */}
            <div className="relative aspect-video w-full overflow-hidden rounded-lg">
              <Image
                src={posterData.img}
                alt={`${posterData.city}天气画报`}
                fill
                className="object-cover"
                unoptimized
              />
            </div>

            {/* 画报信息 */}
            <div className="space-y-3 rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {posterData.city}
                </h3>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {posterData.date}
                </span>
              </div>

              <div className="flex items-center space-x-4">
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  {posterData.condition}
                </span>
                <div className="flex items-center space-x-2 text-sm">
                  <span className="font-semibold text-blue-500 dark:text-blue-400">
                    {posterData.temp_low}°
                  </span>
                  <span className="text-gray-400">~</span>
                  <span className="font-semibold text-red-500 dark:text-red-400">
                    {posterData.temp_high}°
                  </span>
                </div>
              </div>

              {/* 诗词描述 */}
              <div className="border-t border-gray-200 pt-3 dark:border-gray-700">
                <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                  {posterData.poetry}
                </p>
              </div>
            </div>

            {/* 提示信息 */}
            <div
              className={`rounded-lg p-3 text-center text-xs ${
                isFromCache
                  ? "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400"
                  : "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
              }`}
            >
              {isFromCache
                ? "✓ 这是今日已生成的画报（每个城市每天只能生成一次）"
                : "每天只能为每个城市生成一次画报哦～"}
            </div>
          </div>
        )}
      </div>
    </GModal>
  );
}
