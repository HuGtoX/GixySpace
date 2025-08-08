import { useState, useEffect } from "react";
import { FaSync, FaInfoCircle } from "react-icons/fa";
import SectionCard from "@/components/SectionCard";
import { Button, message } from "antd";
import axios from "@/lib/axios";
import { DailySentence as Reuslt, ResOrNull } from "@gixy/types";
import dayjs from "dayjs";

export default function DailySentence() {
  const [yiyan, setYiyan] = useState<ResOrNull<Reuslt>>();
  const [loading, setLoading] = useState(false);

  const fetchYiyan = async () => {
    // 尝试从本地存储获取数据
    const storedData = localStorage.getItem("yiyan");
    if (storedData) {
      const parsedData = JSON.parse(storedData);
      // 检查数据是否是今天的
      if (parsedData.date === dayjs().format("YYYY-MM-DD")) {
        setYiyan(parsedData);
        return;
      }
    }
    try {
      setLoading(true);
      // 添加调试信息
      const data = await axios.get<Reuslt>("/api/yiyan/get");
      setYiyan(data);
      const date = dayjs().format("YYYY-MM-DD");
      localStorage.setItem("yiyan", JSON.stringify({ ...data, date }));
    } catch (error) {
      // 添加用户可见的错误提示
      message.error({
        content: `获取每日一言失败: ${error instanceof Error ? error.message : String(error)}`,
        icon: <FaInfoCircle />,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchYiyan();
  }, []);

  return (
    <SectionCard
      title="每日一句"
      right={
        <Button
          type="text"
          size="small"
          icon={<FaSync />}
          loading={loading}
          onClick={fetchYiyan}
        />
      }
    >
      <div className="text-center">
        {yiyan ? (
          <>
            <blockquote className="mb-2 text-sm italic leading-relaxed text-gray-700 dark:text-gray-300">
              &ldquo;{yiyan.hitokoto}&rdquo;
            </blockquote>

            <cite className="text-xs text-gray-500 dark:text-gray-400">
              —— {yiyan.from_who || "未知作者"} 《{yiyan.from || "未知来源"}》
            </cite>
          </>
        ) : loading ? (
          <div className="text-gray-500">加载中...</div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 text-gray-500">
            <FaInfoCircle size={20} />
            <p>无法获取每日一言</p>
            <p className="text-xs">请检查网络连接或稍后重试</p>
          </div>
        )}
      </div>
    </SectionCard>
  );
}
