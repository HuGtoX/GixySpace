"use client";

import { useEffect, useRef } from "react";
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
import { Line } from "react-chartjs-2";
import type { WeatherForecastResponse } from "@/app/api/types";

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
);

interface WeatherChartProps {
  forecast: WeatherForecastResponse;
}

const WeatherChart: React.FC<WeatherChartProps> = ({ forecast }) => {
  const chartRef = useRef<ChartJS<"line">>(null);

  useEffect(() => {
    // 当主题变化时更新图表
    const chart = chartRef.current;
    if (chart) {
      chart.update();
    }
  }, []);

  if (!forecast?.daily || forecast.daily.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-500 dark:text-gray-400">
        暂无天气数据
      </div>
    );
  }

  // 准备图表数据
  const labels = forecast.daily.map((day) => {
    const date = new Date(day.fxDate);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  });

  const maxTemps = forecast.daily.map((day) => Number(day.tempMax));
  const minTemps = forecast.daily.map((day) => Number(day.tempMin));
  const humidity = forecast.daily.map((day) => Number(day.humidity));

  const isDark =
    typeof window !== "undefined" &&
    document.documentElement.classList.contains("dark");

  const textColor = isDark ? "#9ca3af" : "#6b7280";
  const gridColor = isDark ? "#374151" : "#e5e7eb";

  const data = {
    labels,
    datasets: [
      {
        label: "最高温度 (°C)",
        data: maxTemps,
        borderColor: "rgb(239, 68, 68)",
        backgroundColor: "rgba(239, 68, 68, 0.1)",
        tension: 0.4,
        fill: false,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        label: "最低温度 (°C)",
        data: minTemps,
        borderColor: "rgb(59, 130, 246)",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        tension: 0.4,
        fill: false,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        label: "湿度 (%)",
        data: humidity,
        borderColor: "rgb(34, 197, 94)",
        backgroundColor: "rgba(34, 197, 94, 0.1)",
        tension: 0.4,
        fill: false,
        pointRadius: 4,
        pointHoverRadius: 6,
        yAxisID: "y1",
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
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          color: textColor,
          usePointStyle: true,
          padding: 15,
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        backgroundColor: isDark ? "#1f2937" : "#ffffff",
        titleColor: isDark ? "#f3f4f6" : "#111827",
        bodyColor: isDark ? "#d1d5db" : "#374151",
        borderColor: isDark ? "#374151" : "#e5e7eb",
        borderWidth: 1,
        padding: 12,
        displayColors: true,
        callbacks: {
          label: function (context: any) {
            let label = context.dataset.label || "";
            if (label) {
              label += ": ";
            }
            if (context.parsed.y !== null) {
              label += context.parsed.y;
              if (context.datasetIndex === 2) {
                label += "%";
              } else {
                label += "°C";
              }
            }
            return label;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          color: gridColor,
          drawBorder: false,
        },
        ticks: {
          color: textColor,
          font: {
            size: 11,
          },
        },
      },
      y: {
        type: "linear" as const,
        display: true,
        position: "left" as const,
        grid: {
          color: gridColor,
          drawBorder: false,
        },
        ticks: {
          color: textColor,
          font: {
            size: 11,
          },
          callback: function (value: any) {
            return value + "°C";
          },
        },
      },
      y1: {
        type: "linear" as const,
        display: true,
        position: "right" as const,
        grid: {
          drawOnChartArea: false,
          drawBorder: false,
        },
        ticks: {
          color: textColor,
          font: {
            size: 11,
          },
          callback: function (value: any) {
            return value + "%";
          },
        },
      },
    },
  };

  return (
    <div className="h-80 w-full">
      <Line ref={chartRef} data={data} options={options} />
    </div>
  );
};

export default WeatherChart;
