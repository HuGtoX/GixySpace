"use client";

import { useEffect, useRef, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { Line } from "react-chartjs-2";
import type { WeatherForecastResponse } from "@/lib/api/types";

// 注册 Chart.js 组件
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartDataLabels,
);

interface WeatherChartProps {
  forecast: WeatherForecastResponse;
}

const WeatherChart = ({ forecast }: WeatherChartProps) => {
  const chartRef = useRef<ChartJS<"line">>(null);
  const [isDark, setIsDark] = useState(false);

  // 获取天气图标对应的 emoji
  const getWeatherEmoji = (iconCode: string) => {
    const code = Number(iconCode);

    // 晴天（白天）
    if (code == 100) return "☀️";
    // 晴天（夜晚）
    if (code >= 150 && code <= 153) return "🌙";
    // 阴天/多云
    if ([101, 102, 104].includes(code)) return "☁️";

    // 雷雨相关
    if (code >= 302 && code <= 304) return "⛈️";
    // 阵雨
    if (code === 300 || code === 301 || code === 350 || code === 351)
      return "🌦️";
    // 小雨/毛毛雨
    if (code === 305 || code === 309) return "🌧️";
    // 中到大雨
    if (code >= 306 && code <= 308) return "🌧️";
    // 暴雨
    if (code >= 310 && code <= 318) return "⛆";
    // 冻雨
    if (code === 313) return "🧊";
    // 其他雨天
    if (code === 399) return "🌧️";

    // 雨夹雪
    if (code === 404 || code === 405 || code === 406 || code === 456)
      return "🌨️";
    // 阵雪
    if (code === 407 || code === 457) return "🌨️";
    // 小到中雪
    if (code >= 400 && code <= 403) return "❄️";
    // 暴雪
    if (code >= 408 && code <= 410) return "❄️";
    // 其他雪天
    if (code === 499) return "❄️";

    // 雾
    if (
      code === 500 ||
      code === 501 ||
      code === 509 ||
      code === 510 ||
      code === 514 ||
      code === 515
    )
      return "🌫️";
    // 霾
    if (code === 502 || (code >= 511 && code <= 513)) return "😷";
    // 沙尘
    if (code >= 503 && code <= 508) return "💨";

    // 极端天气
    if (code === 900) return "🔥"; // 热
    if (code === 901) return "🥶"; // 冷

    // 未知
    if (code === 999) return "❓";

    return "🌤️"; // 默认
  };

  useEffect(() => {
    // 检测初始主题
    const checkTheme = () => {
      if (typeof window !== "undefined") {
        const dark = document.documentElement.classList.contains("dark");
        setIsDark(dark);
      }
    };

    checkTheme();

    // 监听主题变化
    const observer = new MutationObserver(checkTheme);
    if (typeof window !== "undefined") {
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["class"],
      });
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    // 当主题变化时更新图表
    const chart = chartRef.current;
    if (chart) {
      chart.update();
    }
  }, [isDark]);

  if (!forecast?.daily || forecast.daily.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-500 dark:text-gray-400">
        暂无天气数据
      </div>
    );
  }

  // 准备图表数据 - 优化标签信息，添加天气图标
  const labels = forecast.daily.map((day, index) => {
    const date = new Date(day.fxDate);
    const dayName =
      index === 0
        ? "今天"
        : ["周日", "周一", "周二", "周三", "周四", "周五", "周六"][
            date.getDay()
          ];

    // 添加天气图标 emoji
    const weatherEmoji = getWeatherEmoji(day.iconDay);
    const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;
    const weatherStr = `${weatherEmoji} ${day.textDay}`;

    // 返回带图标的多行标签
    return [dayName, dateStr, weatherStr];
  });

  const maxTemps = forecast.daily.map((day) => Number(day.tempMax));
  const minTemps = forecast.daily.map((day) => Number(day.tempMin));

  // 使用高对比度颜色
  const textColor = isDark ? "#e5e7eb" : "#1f2937";
  const gridColor = isDark
    ? "rgba(75, 85, 99, 0.3)"
    : "rgba(229, 231, 235, 0.8)";

  const data = {
    labels,
    datasets: [
      {
        label: "最高温度",
        data: maxTemps,
        borderColor: isDark ? "rgb(248, 113, 113)" : "rgb(239, 68, 68)",
        backgroundColor: isDark
          ? "rgba(248, 113, 113, 0.15)"
          : "rgba(239, 68, 68, 0.15)",
        tension: 0.4,
        pointRadius: 5,
        pointHoverRadius: 7,
        pointBackgroundColor: isDark
          ? "rgb(248, 113, 113)"
          : "rgb(239, 68, 68)",
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        pointHoverBorderWidth: 3,
        borderWidth: 2,
        datalabels: {
          align: "top" as const,
          anchor: "end" as const,
          color: isDark ? "rgb(248, 113, 113)" : "rgb(239, 68, 68)",
          font: {
            size: 12,
            weight: 600,
          },
          formatter: (value: number) => `${value}°`,
          offset: 4,
        },
      },
      {
        label: "最低温度",
        data: minTemps,
        borderColor: isDark ? "rgb(96, 165, 250)" : "rgb(59, 130, 246)",
        backgroundColor: isDark
          ? "rgba(96, 165, 250, 0.15)"
          : "rgba(59, 130, 246, 0.15)",
        tension: 0.4,
        pointRadius: 5,
        pointHoverRadius: 7,
        pointBackgroundColor: isDark
          ? "rgb(96, 165, 250)"
          : "rgb(59, 130, 246)",
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        pointHoverBorderWidth: 3,
        borderWidth: 2,
        datalabels: {
          align: "bottom" as const,
          anchor: "end" as const,
          color: isDark ? "rgb(96, 165, 250)" : "rgb(59, 130, 246)",
          font: {
            size: 12,
            weight: 600,
          },
          formatter: (value: number) => `${value}°`,
          offset: 4,
        },
      },
    ],
  };
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "index" as const,
      intersect: false,
    },
    scales: {
      x: {
        ticks: {
          color: textColor,
          font: {
            size: 12,
            weight: 500,
          },
          padding: 8,
        },
        grid: {
          color: gridColor,
          drawOnChartArea: false,
        },
      },
      y: {
        display: false,
        grid: {
          display: false,
        },
      },
    },
    plugins: {
      legend: {
        position: "top" as const,
        align: "end" as const,
        labels: {
          color: textColor,
          usePointStyle: true,
          pointStyle: "circle",
          padding: 8,
          boxWidth: 8,
          boxHeight: 8,
          font: {
            size: 12,
            weight: 500,
          },
        },
      },
      tooltip: {
        backgroundColor: isDark
          ? "rgba(31, 41, 55, 0.95)"
          : "rgba(255, 255, 255, 0.95)",
        titleColor: isDark ? "#f3f4f6" : "#111827",
        bodyColor: isDark ? "#d1d5db" : "#374151",
        borderColor: isDark ? "#4b5563" : "#e5e7eb",
        borderWidth: 1,
        padding: 10,
        boxWidth: 6,
        boxHeight: 6,
        boxPadding: 4,
        bodyFont: {
          size: 12,
        },
        displayColors: true,
        callbacks: {
          title: function (context: any) {
            const index = context[0].dataIndex;
            const day = forecast.daily[index];
            const date = new Date(day.fxDate);
            return `${date.getMonth() + 1}月${date.getDate()}日 ${day.textDay}`;
          },
          afterBody: function (context: any) {
            const index = context[0].dataIndex;
            const day = forecast.daily[index];
            return [
              `风向: ${day.windDirDay} ${day.windScaleDay}级`,
              `湿度: ${day.humidity}%`,
              `紫外线: ${day.uvIndex}`,
            ];
          },
        },
      },
    },
  };

  return (
    <div className="w-full">
      <div className="h-[250px] w-full">
        <Line ref={chartRef} data={data} options={options} />
      </div>
    </div>
  );
};

export default WeatherChart;
