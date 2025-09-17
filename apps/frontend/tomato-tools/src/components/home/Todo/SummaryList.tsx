import { useState, useEffect } from "react";
import { Spin, Button, message } from "antd";
import { FaEye, FaTrash } from "react-icons/fa";
import AISummarySection from "./AISummarySection";
import axios from "@/lib/axios";

// AI总结数据类型
interface AISummary {
  id: string;
  title: string;
  content: string;
  period: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface AISummaryListProps {
  visible: boolean;
}

export default function AISummaryList({ visible }: AISummaryListProps) {
  const [loading, setLoading] = useState(false);
  const [aiSummaries, setAiSummaries] = useState<AISummary[]>([]);
  const [selectedSummary, setSelectedSummary] = useState<AISummary | null>(
    null,
  );
  const [summaryDetailVisible, setSummaryDetailVisible] = useState(false);

  // 获取AI总结历史
  const fetchAISummaries = async () => {
    setLoading(true);
    try {
      const response = await axios.get<{
        success: boolean;
        data: AISummary[];
        pagination: {
          total: number;
        };
      }>("/api/todo/summary?page=1&pageSize=20");

      if (response.data) {
        setAiSummaries(response.data);
      } else {
        setAiSummaries([]);
      }
    } catch (err) {
      console.error("Failed to fetch AI summaries:", err);
      message.error("获取AI总结失败");
      setAiSummaries([]);
    } finally {
      setLoading(false);
    }
  };

  // 查看AI总结详情
  const viewSummaryDetail = async (summary: AISummary) => {
    try {
      const response = await axios.get<{
        success: boolean;
        data: AISummary;
      }>(`/api/todo/summary/${summary.id}`);

      if (response.data) {
        setSelectedSummary(response.data);
        setSummaryDetailVisible(true);
      } else {
        message.error("获取总结详情失败");
      }
    } catch (err) {
      console.error("Failed to fetch summary detail:", err);
      message.error("获取总结详情失败");
    }
  };

  // 删除AI总结
  const deleteSummary = async (id: string) => {
    try {
      await axios.delete(`/api/todo/summary/${id}`);
      message.success("删除成功");
      fetchAISummaries();
    } catch (err) {
      console.error("Failed to delete summary:", err);
      message.error("删除失败");
    }
  };

  // 组件可见时获取数据
  useEffect(() => {
    if (visible) {
      fetchAISummaries();
    }
  }, [visible]);

  return (
    <div className="h-full overflow-auto">
      <Spin spinning={loading} tip="加载中...">
        <div className="space-y-4">
          {summaryDetailVisible && selectedSummary ? (
            // 总结详情视图
            <div>
              <div className="mb-4 flex items-center justify-between">
                <Button
                  onClick={() => setSummaryDetailVisible(false)}
                  type="link"
                  className="p-0"
                >
                  ← 返回列表
                </Button>
              </div>
              <AISummarySection
                summaryLoading={false}
                aiSummary={selectedSummary.content}
              />
            </div>
          ) : (
            // 总结列表视图
            <>
              {aiSummaries.length === 0 ? (
                <div className="py-12 text-center text-gray-500 dark:text-gray-400">
                  <div className="mb-2 text-4xl">🤖</div>
                  <p>暂无AI总结记录</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {aiSummaries.map((summary) => (
                    <div
                      key={summary.id}
                      className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800"
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {summary.title}
                        </h3>
                        <div className="flex items-center gap-2">
                          <Button
                            type="text"
                            size="small"
                            icon={<FaEye />}
                            onClick={() => viewSummaryDetail(summary)}
                          >
                            查看
                          </Button>
                          <Button
                            type="text"
                            size="small"
                            danger
                            icon={<FaTrash />}
                            onClick={() => deleteSummary(summary.id)}
                          >
                            删除
                          </Button>
                        </div>
                      </div>
                      <div className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                        时间周期:{" "}
                        {summary.period === "day"
                          ? "本日"
                          : summary.period === "week"
                            ? "本周"
                            : summary.period === "month"
                              ? "本月"
                              : "全部"}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        创建时间: {new Date(summary.createdAt).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </Spin>
    </div>
  );
}
