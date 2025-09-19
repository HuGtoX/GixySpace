"use client";

import { Card, Tag, Typography, Button, Space, Image, Tooltip } from "antd";
import {
  DeleteOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from "@ant-design/icons";
import { formatFileSize } from "@/lib/imageProcessing";

const { Text } = Typography;

type UploadStatus = "idle" | "processing" | "completed" | "error";

export interface UploadItem {
  id: string;
  name: string;
  size: number;
  preview: string;
  status: UploadStatus;
  message?: string;
  format?: string;
}

interface UploadListProps {
  items: UploadItem[];
  onRemove: (id: string) => void;
  onMoveUp?: (id: string) => void;
  onMoveDown?: (id: string) => void;
}

const statusConfig: Record<UploadStatus, { color: string; text: string }> = {
  idle: { color: "default", text: "待处理" },
  processing: { color: "processing", text: "处理中" },
  completed: { color: "success", text: "已完成" },
  error: { color: "error", text: "失败" },
};

const UploadList = ({
  items,
  onRemove,
  onMoveUp,
  onMoveDown,
}: UploadListProps) => {
  if (!items.length) {
    return (
      <Card className="text-center text-gray-500 dark:text-gray-400">
        暂未选择文件
      </Card>
    );
  }

  return (
    <Space direction="vertical" className="w-full">
      {items.map((item, index) => {
        const status = statusConfig[item.status];
        return (
          <Card
            key={item.id}
            styles={{ body: { padding: 16 } }}
            className="shadow-sm"
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-4">
                <Image
                  src={item.preview}
                  alt={item.name}
                  width={84}
                  height={84}
                  className="rounded-md border border-gray-200 object-cover dark:border-gray-700"
                  preview={{ maskClassName: "rounded-md" }}
                />
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Text strong>{item.name}</Text>
                    <Tag color={status.color}>{status.text}</Tag>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                    <span>{formatFileSize(item.size)}</span>
                    {item.format && (
                      <span>格式: {item.format.toUpperCase()}</span>
                    )}
                  </div>
                  {item.message && (
                    <Text
                      type={item.status === "error" ? "danger" : "secondary"}
                    >
                      {item.message}
                    </Text>
                  )}
                </div>
              </div>

              <Space>
                {onMoveUp && (
                  <Tooltip title="上移">
                    <Button
                      icon={<ArrowUpOutlined />}
                      onClick={() => onMoveUp(item.id)}
                      disabled={index === 0}
                    />
                  </Tooltip>
                )}
                {onMoveDown && (
                  <Tooltip title="下移">
                    <Button
                      icon={<ArrowDownOutlined />}
                      onClick={() => onMoveDown(item.id)}
                      disabled={index === items.length - 1}
                    />
                  </Tooltip>
                )}
                <Tooltip title="移除">
                  <Button
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => onRemove(item.id)}
                  />
                </Tooltip>
              </Space>
            </div>
          </Card>
        );
      })}
    </Space>
  );
};

export default UploadList;
