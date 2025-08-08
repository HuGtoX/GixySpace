import React from "react";
import { Form, Select, Slider, Switch, Card, Typography, Space } from "antd";
import { useDeviceDetect } from "@/hooks/useDeviceDetect";
import { ImageFormat, ConversionSettings as SettingsType } from "../types";

const { Option } = Select;
const { Title } = Typography;

interface ConversionSettingsProps {
  settings: SettingsType;
  onSettingsChange: (settings: SettingsType) => void;
  currentFormat?: ImageFormat;
}

const ConversionSettings = ({
  settings,
  onSettingsChange,
  currentFormat,
}: ConversionSettingsProps) => {
  const { isMobile } = useDeviceDetect();

  const handleFormatChange = (format: ImageFormat) => {
    onSettingsChange({ ...settings, format });
  };

  const handleQualityChange = (quality: number) => {
    onSettingsChange({ ...settings, quality });
  };

  const handleRemoveBackgroundChange = (removeBackground: boolean) => {
    onSettingsChange({ ...settings, removeBackground });
  };

  const handlePreserveExifChange = (preserveExif: boolean) => {
    onSettingsChange({ ...settings, preserveExif });
  };

  // 格式是否支持质量设置
  const supportsQuality =
    settings.format === "jpg" ||
    settings.format === "jpeg" ||
    settings.format === "webp";

  // 格式是否支持背景移除
  const supportsBackgroundRemoval = settings.format === "png";

  return (
    <Card
      title={<Title level={isMobile ? 4 : 3}>转换设置</Title>}
      className="w-full"
    >
      <Form
        layout={isMobile ? "vertical" : "horizontal"}
        labelCol={isMobile ? undefined : { span: 6 }}
      >
        <Form.Item label="目标格式" className="mb-4">
          <Select
            value={settings.format}
            onChange={handleFormatChange}
            className="w-full"
          >
            <Option value="jpg">JPG</Option>
            <Option value="png">PNG</Option>
            <Option value="webp">WEBP</Option>
            <Option value="svg">SVG</Option>
            <Option value="ico">ICO</Option>
          </Select>
          {currentFormat && settings.format !== currentFormat && (
            <Typography.Text type="success" className="block mt-1">
              从 {currentFormat.toUpperCase()} 转换为{" "}
              {settings.format.toUpperCase()}
            </Typography.Text>
          )}
        </Form.Item>

        {supportsQuality && (
          <Form.Item label="图片质量" className="mb-4">
            <Space direction="vertical" className="w-full">
              <Slider
                min={1}
                max={100}
                value={settings.quality}
                onChange={handleQualityChange}
                marks={{
                  1: "1%",
                  25: "25%",
                  50: "50%",
                  75: "75%",
                  100: "100%",
                }}
              />
              <Typography.Text type="secondary">
                当前质量: {settings.quality}%
                {settings.quality >= 90 && " (高质量)"}
                {settings.quality >= 70 && settings.quality < 90 && " (中等质量)"}
                {settings.quality < 70 && " (压缩模式)"}
              </Typography.Text>
            </Space>
          </Form.Item>
        )}

        {supportsBackgroundRemoval && (
          <Form.Item label="移除背景" className="mb-4">
            <Space direction="vertical">
              <Switch
                checked={settings.removeBackground}
                onChange={handleRemoveBackgroundChange}
              />
              <Typography.Text type="secondary" className="text-xs">
                仅适用于PNG格式，将白色背景设为透明
              </Typography.Text>
            </Space>
          </Form.Item>
        )}

        <Form.Item label="保留EXIF" className="mb-4">
          <Space direction="vertical">
            <Switch
              checked={settings.preserveExif}
              onChange={handlePreserveExifChange}
            />
            <Typography.Text type="secondary" className="text-xs">
              保留图片的元数据信息（拍摄时间、设备信息等）
            </Typography.Text>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default ConversionSettings;