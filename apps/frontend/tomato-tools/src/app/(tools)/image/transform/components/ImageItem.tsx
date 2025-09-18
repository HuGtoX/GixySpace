import React from "react";
import {
  Card,
  Row,
  Col,
  Space,
  Button,
  Typography,
  Progress,
  Image,
  Tooltip,
  Tag,
} from "antd";
import {
  SyncOutlined,
  DownloadOutlined,
  DeleteOutlined,
  ShareAltOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import { useDeviceDetect } from "@/hooks/useDeviceDetect";
import { ImageFile } from "../types";
import { formatFileSize } from "@/lib/imageProcessing";

const { Text } = Typography;

interface ImageItemProps {
  imageFile: ImageFile;
  onConvert?: (id: string) => void;
  onDownload: (imageFile: ImageFile) => void;
  onDelete: (id: string) => void;
  onShare?: (imageFile: ImageFile) => void;
  onPreview?: (imageFile: ImageFile) => void;
}

const ImageItem = ({
  imageFile,
  onConvert,
  onDownload,
  onDelete,
  onShare,
  onPreview,
}: ImageItemProps) => {
  const { isMobile } = useDeviceDetect();
  const { id, name, format, size, status, result, error } = imageFile;

  // 计算文件大小变化
  const sizeReduction = result
    ? Math.round(((size - result.size) / size) * 100)
    : 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "success";
      case "processing":
        return "processing";
      case "error":
        return "error";
      default:
        return "default";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed":
        return "已完成";
      case "processing":
        return "处理中";
      case "error":
        return "失败";
      default:
        return "待处理";
    }
  };

  return (
    <Card className="mb-4" bodyStyle={{ padding: isMobile ? "12px" : "16px" }}>
      <Row gutter={[16, 16]} align="middle">
        <Col xs={24} sm={6} md={4} lg={3} xl={3}>
          <div className="relative">
            <Image
              src={result?.preview || imageFile.preview}
              alt={name}
              width="100%"
              height={80}
              className="rounded object-cover"
              preview={false}
            />
            {onPreview && (
              <Button
                type="primary"
                icon={<EyeOutlined />}
                size="small"
                className="absolute right-1 top-1 opacity-80"
                onClick={() => onPreview(imageFile)}
              />
            )}
          </div>
        </Col>

        <Col xs={24} sm={12} md={14} lg={15} xl={15}>
          <Space direction="vertical" className="w-full">
            <div className="flex items-center justify-between">
              <Text strong className="text-sm">
                {name}
              </Text>
              <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>
            </div>

            <div className="flex items-center space-x-4 text-xs text-gray-500">
              <span>原格式: {format.toUpperCase()}</span>
              <span>大小: {formatFileSize(size)}</span>
            </div>

            {result && status === "completed" && (
              <>
                <div className="flex items-center space-x-2">
                  <Text type="secondary" className="text-xs">
                    新大小: {formatFileSize(result.size)}
                  </Text>
                  <Text
                    type={sizeReduction > 0 ? "success" : "danger"}
                    className="text-xs"
                  >
                    {sizeReduction > 0
                      ? `节省 ${sizeReduction}%`
                      : `增加 ${Math.abs(sizeReduction)}%`}
                  </Text>
                </div>

                <Text type="secondary" className="text-xs">
                  新格式: {result.format.toUpperCase()}
                </Text>
              </>
            )}

            {status === "processing" && (
              <Progress percent={50} status="active" className="mt-2" />
            )}

            {status === "error" && (
              <Text type="danger" className="mt-2 text-xs">
                {error || "处理失败"}
              </Text>
            )}
          </Space>
        </Col>

        <Col xs={24} sm={6} md={6} lg={6} xl={6}>
          <Space
            direction={isMobile ? "horizontal" : "vertical"}
            className={`w-full ${isMobile ? "justify-center" : "justify-end"}`}
          >
            {onConvert && ["idle", "error"].includes(status) && (
              <Tooltip title="转换">
                <Button
                  type="primary"
                  icon={<SyncOutlined />}
                  onClick={() => onConvert(id)}
                  block={!isMobile}
                  size="small"
                >
                  转换
                </Button>
              </Tooltip>
            )}

            {result && (
              <>
                <Tooltip title="下载">
                  <Button
                    type="primary"
                    icon={<DownloadOutlined />}
                    onClick={() => onDownload(imageFile)}
                    block={!isMobile}
                    size="small"
                  >
                    下载
                  </Button>
                </Tooltip>

                {onShare && (
                  <Tooltip title="分享">
                    <Button
                      icon={<ShareAltOutlined />}
                      onClick={() => onShare(imageFile)}
                      block={!isMobile}
                      size="small"
                    >
                      分享
                    </Button>
                  </Tooltip>
                )}
              </>
            )}

            <Tooltip title="删除">
              <Button
                danger
                icon={<DeleteOutlined />}
                onClick={() => onDelete(id)}
                block={!isMobile}
                size="small"
              >
                删除
              </Button>
            </Tooltip>
          </Space>
        </Col>
      </Row>
    </Card>
  );
};

export default ImageItem;
