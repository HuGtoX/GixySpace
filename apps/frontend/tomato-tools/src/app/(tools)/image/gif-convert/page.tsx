"use client";

import { useEffect, useMemo, useState } from "react";
import {
  App,
  Button,
  Card,
  Col,
  Form,
  Row,
  Select,
  Slider,
  Space,
  Switch,
  Tabs,
  Typography,
} from "antd";
import {
  DownloadOutlined,
  ClearOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import FileUploader, { AcceptMap } from "@/components/FileUploader";
import { Container } from "@/components/layout/ToolsLayout";
import UploadList, { UploadItem } from "./components/UploadList";
import {
  GifConvertibleFormat,
  convertGifToZip,
  decodeGifFile,
  encodeGifFromFrames,
  imageFilesToFrames,
  mergeGifFiles,
  suggestBaseName,
} from "@/lib/gifProcessing";
import { saveAs } from "file-saver";
import { gifConvertInstructions } from "./instructions";
import { formatFileSize } from "@/lib/imageProcessing";

const { Text } = Typography;

interface ExtendedUploadItem extends UploadItem {
  file: File;
}

type TabKey = "gif-to-image" | "image-to-gif" | "gif-merge";

type UploadPayload = {
  id: string;
  file: File;
  preview: string;
  name: string;
  size: number;
};

const GIF_FORMATS: GifConvertibleFormat[] = ["png", "jpeg", "webp"];

const QUALITY_MARKS = {
  10: "10%",
  50: "50%",
  80: "80%",
  100: "100%",
};

const SCALE_MARKS = {
  30: "30%",
  60: "60%",
  80: "80%",
  100: "100%",
};

const FPS_MARKS = {
  5: "5",
  12: "12",
  24: "24",
  30: "30",
};

const COLORS_MARKS = {
  32: "32",
  128: "128",
  256: "256",
};

function detectFormat(file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (extension) return extension;
  if (file.type.includes("gif")) return "gif";
  if (file.type.includes("png")) return "png";
  if (file.type.includes("jpeg")) return "jpeg";
  if (file.type.includes("webp")) return "webp";
  return "image";
}

function mapUploads(files: UploadPayload[]): ExtendedUploadItem[] {
  return files.map((item) => ({
    ...item,
    status: "idle",
    message: undefined,
    format: detectFormat(item.file),
  }));
}

function createInstructions() {
  return {
    content: gifConvertInstructions,
    tips: "所有处理均在浏览器本地完成，我们不会上传您的文件。",
  };
}

export default function GifConvertPage() {
  const { message } = App.useApp();
  const [activeKey, setActiveKey] = useState<TabKey>("gif-to-image");
  const [gifUploads, setGifUploads] = useState<ExtendedUploadItem[]>([]);
  const [imageUploads, setImageUploads] = useState<ExtendedUploadItem[]>([]);
  const [mergeUploads, setMergeUploads] = useState<ExtendedUploadItem[]>([]);
  const [isBusy, setIsBusy] = useState(false);
  const [lastPreviewUrl, setLastPreviewUrl] = useState<string | null>(null);

  const [gifFormat, setGifFormat] = useState<GifConvertibleFormat>("png");
  const [gifQuality, setGifQuality] = useState(80);
  const [gifScale, setGifScale] = useState(80);

  const [imageFps, setImageFps] = useState(12);
  const [imageScale, setImageScale] = useState(100);

  const [mergeFps, setMergeFps] = useState(12);
  const [mergeScale, setMergeScale] = useState(80);
  const [mergeLoop, setMergeLoop] = useState(true);
  const [mergeColors, setMergeColors] = useState(128);

  const instructions = useMemo(createInstructions, []);

  useEffect(() => {
    return () => {
      if (lastPreviewUrl) {
        URL.revokeObjectURL(lastPreviewUrl);
      }
    };
  }, [lastPreviewUrl]);

  const clearPreviewUrl = () => {
    if (lastPreviewUrl) {
      URL.revokeObjectURL(lastPreviewUrl);
      setLastPreviewUrl(null);
    }
  };

  const updateItemStatus = (
    listSetter: React.Dispatch<React.SetStateAction<ExtendedUploadItem[]>>,
    id: string,
    status: UploadItem["status"],
    messageText?: string,
  ) => {
    listSetter((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              status,
              message: messageText,
            }
          : item,
      ),
    );
  };

  const removeItem = (
    listSetter: React.Dispatch<React.SetStateAction<ExtendedUploadItem[]>>,
    id: string,
  ) => {
    listSetter((prev) => prev.filter((item) => item.id !== id));
  };

  const moveItem = (
    listSetter: React.Dispatch<React.SetStateAction<ExtendedUploadItem[]>>,
    id: string,
    direction: "up" | "down",
  ) => {
    listSetter((prev) => {
      const index = prev.findIndex((item) => item.id === id);
      if (index === -1) return prev;
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;
      const newItems = [...prev];
      const [current] = newItems.splice(index, 1);
      newItems.splice(targetIndex, 0, current);
      return newItems;
    });
  };

  const mergeUploadsWith = (
    setter: React.Dispatch<React.SetStateAction<ExtendedUploadItem[]>>,
    files: UploadPayload[],
  ) => {
    setter((prev) => {
      const mapped = mapUploads(files);
      const existingIds = new Set(prev.map((item) => item.id));
      const merged = [...prev];
      mapped.forEach((item) => {
        if (!existingIds.has(item.id)) {
          merged.push(item);
        }
      });
      return merged;
    });
  };

  const handleGifUpload = (files: UploadPayload[]) => {
    mergeUploadsWith(setGifUploads, files);
  };

  const handleImageUpload = (files: UploadPayload[]) => {
    mergeUploadsWith(setImageUploads, files);
  };

  const handleMergeUpload = (files: UploadPayload[]) => {
    mergeUploadsWith(setMergeUploads, files);
  };

  const handleGifConvert = async () => {
    if (!gifUploads.length) {
      message.warning("请先上传至少一个 GIF 文件");
      return;
    }
    setIsBusy(true);

    try {
      for (const item of gifUploads) {
        updateItemStatus(setGifUploads, item.id, "processing");
        const decoded = await decodeGifFile(item.file);
        const baseName = suggestBaseName(item.name, gifFormat);
        const { blob, files } = await convertGifToZip(decoded, {
          format: gifFormat,
          quality: gifQuality,
          scale: gifScale / 100,
          baseName,
        });
        saveAs(blob, `${baseName}.zip`);
        updateItemStatus(
          setGifUploads,
          item.id,
          "completed",
          `已导出 ${files} 帧，压缩包大小约 ${formatFileSize(blob.size)}`,
        );
      }
      message.success("所有 GIF 已转换为图片压缩包");
    } catch (error) {
      console.error(error);
      message.error((error as Error).message || "转换失败，请稍后重试");
      setGifUploads((prev) =>
        prev.map((item) =>
          item.status === "processing"
            ? { ...item, status: "error", message: "转换失败" }
            : item,
        ),
      );
    } finally {
      setIsBusy(false);
    }
  };

  const handleImagesToGif = async () => {
    if (!imageUploads.length) {
      message.warning("请上传至少一张图片");
      return;
    }

    setIsBusy(true);
    clearPreviewUrl();

    try {
      setImageUploads((prev) =>
        prev.map((item) => ({
          ...item,
          status: "processing",
          message: undefined,
        })),
      );
      const frames = await imageFilesToFrames(
        imageUploads.map((item) => item.file),
        {
          scale: imageScale / 100,
          fps: imageFps,
        },
      );

      const gifBlob = await encodeGifFromFrames(frames, {
        fps: imageFps,
        loop: true,
        useGlobalPalette: true,
      });

      const outputName = suggestBaseName(
        imageUploads[0].name,
        `animated-${imageFps}fps`,
      );
      saveAs(gifBlob, `${outputName}.gif`);
      const previewUrl = URL.createObjectURL(gifBlob);
      setLastPreviewUrl(previewUrl);
      setImageUploads((prev) =>
        prev.map((item) => ({
          ...item,
          status: "completed",
          message: `已加入序列，帧率 ${imageFps} FPS`,
        })),
      );
      message.success("GIF 动画生成成功");
    } catch (error) {
      console.error(error);
      message.error((error as Error).message || "生成 GIF 失败");
      setImageUploads((prev) =>
        prev.map((item) =>
          item.status === "processing"
            ? { ...item, status: "error", message: "生成失败" }
            : item,
        ),
      );
    } finally {
      setIsBusy(false);
    }
  };

  const handleMergeGif = async () => {
    if (!mergeUploads.length) {
      message.warning("请上传需要合并的 GIF 文件");
      return;
    }
    setIsBusy(true);
    clearPreviewUrl();

    try {
      setMergeUploads((prev) =>
        prev.map((item) => ({
          ...item,
          status: "processing",
          message: undefined,
        })),
      );
      const { blob, frameCount, width, height } = await mergeGifFiles(
        mergeUploads.map((item) => item.file),
        {
          fps: mergeFps,
          scale: mergeScale / 100,
          loop: mergeLoop,
          maxColors: mergeColors,
        },
      );
      const outputName = suggestBaseName(mergeUploads[0].name, "merged");
      saveAs(blob, `${outputName}.gif`);
      const previewUrl = URL.createObjectURL(blob);
      setLastPreviewUrl(previewUrl);
      setMergeUploads((prev) =>
        prev.map((item, index) => ({
          ...item,
          status: "completed",
          message:
            index === 0
              ? `输出 ${frameCount} 帧，尺寸 ${width}x${height}`
              : "已加入合并序列",
        })),
      );
      message.success("GIF 合并完成");
    } catch (error) {
      console.error(error);
      message.error((error as Error).message || "合并失败，请稍后重试");
      setMergeUploads((prev) =>
        prev.map((item) =>
          item.status === "processing"
            ? { ...item, status: "error", message: "合并失败" }
            : item,
        ),
      );
    } finally {
      setIsBusy(false);
    }
  };

  const gifSettings = (
    <Card title="转换设置" className="shadow-sm">
      <Form layout="vertical">
        <Row gutter={16}>
          <Col xs={24} lg={12}>
            <Form.Item label="输出格式">
              <Select<GifConvertibleFormat>
                value={gifFormat}
                onChange={setGifFormat}
                options={GIF_FORMATS.map((value) => ({
                  label: value.toUpperCase(),
                  value,
                }))}
              />
            </Form.Item>
          </Col>
          <Col xs={24} lg={12}>
            <Form.Item label="压缩质量">
              <Slider
                min={10}
                max={100}
                marks={QUALITY_MARKS}
                value={gifQuality}
                onChange={setGifQuality}
                disabled={gifFormat === "png"}
              />
              <Text type="secondary">
                PNG 保持无损，其余格式支持 10%-100% 质量调节
              </Text>
            </Form.Item>
          </Col>
        </Row>
        <Form.Item label="缩放比例">
          <Slider
            min={30}
            max={100}
            marks={SCALE_MARKS}
            value={gifScale}
            onChange={setGifScale}
          />
          <Text type="secondary">缩小可有效减少文件体积，推荐 60%-100%</Text>
        </Form.Item>
      </Form>
    </Card>
  );

  const imageSettings = (
    <Card title="动画参数" className="shadow-sm">
      <Form layout="vertical">
        <Form.Item label="帧率 (FPS)">
          <Slider
            min={1}
            max={30}
            marks={FPS_MARKS}
            value={imageFps}
            onChange={setImageFps}
          />
          <Text type="secondary">常用帧率：12（平滑）/ 24（电影感）</Text>
        </Form.Item>
        <Form.Item label="缩放比例">
          <Slider
            min={30}
            max={120}
            marks={{ 50: "50%", 100: "100%", 120: "120%" }}
            value={imageScale}
            onChange={setImageScale}
          />
          <Text type="secondary">
            &gt;100% 将放大图片，可能导致模糊，建议保持在 50%-100%
          </Text>
        </Form.Item>
      </Form>
    </Card>
  );

  const mergeSettings = (
    <Card title="合并参数" className="shadow-sm">
      <Form layout="vertical">
        <Row gutter={16}>
          <Col xs={24} lg={12}>
            <Form.Item label="输出帧率">
              <Slider
                min={1}
                max={30}
                marks={FPS_MARKS}
                value={mergeFps}
                onChange={setMergeFps}
              />
            </Form.Item>
          </Col>
          <Col xs={24} lg={12}>
            <Form.Item label="色彩数量">
              <Slider
                min={16}
                max={256}
                step={16}
                marks={COLORS_MARKS}
                value={mergeColors}
                onChange={setMergeColors}
              />
              <Text type="secondary">
                色彩越少文件越小，建议在 128-256 之间
              </Text>
            </Form.Item>
          </Col>
        </Row>
        <Form.Item label="画面缩放">
          <Slider
            min={40}
            max={100}
            marks={SCALE_MARKS}
            value={mergeScale}
            onChange={setMergeScale}
          />
          <Text type="secondary">
            根据最大 GIF 尺寸进行等比缩放，保持画面一致
          </Text>
        </Form.Item>
        <Form.Item label="循环播放">
          <Switch checked={mergeLoop} onChange={setMergeLoop} />
          <Text type="secondary" className="ml-3">
            关闭后动画只播放一次
          </Text>
        </Form.Item>
      </Form>
    </Card>
  );

  const previewSection = lastPreviewUrl ? (
    <Card title="最近生成的动图预览" className="shadow-sm">
      <div className="flex flex-col items-center gap-2">
        <img src={lastPreviewUrl} alt="GIF preview" className="max-h-80" />
        <Button onClick={clearPreviewUrl} size="small">
          清除预览
        </Button>
      </div>
    </Card>
  ) : null;

  const tabItems = [
    {
      key: "gif-to-image",
      label: "GIF 转图片",
      children: (
        <Space direction="vertical" size={16} className="w-full">
          <FileUploader
            accept={[AcceptMap.gif]}
            acceptText="支持 GIF 动画，单个文件不超过 50MB"
            onUploadSuccess={handleGifUpload as any}
            multiple
          />
          <UploadList
            items={gifUploads}
            onRemove={(id) => removeItem(setGifUploads, id)}
          />
          {gifSettings}
          <Space>
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              onClick={handleGifConvert}
              loading={isBusy}
            >
              导出帧序列
            </Button>
            <Button
              icon={<ClearOutlined />}
              onClick={() => setGifUploads([])}
              disabled={!gifUploads.length || isBusy}
            >
              清空列表
            </Button>
          </Space>
        </Space>
      ),
    },
    {
      key: "image-to-gif",
      label: "图片转 GIF",
      children: (
        <Space direction="vertical" size={16} className="w-full">
          <FileUploader
            accept={[AcceptMap.image]}
            acceptText="支持 PNG/JPEG/WebP 等常见图片格式"
            onUploadSuccess={handleImageUpload as any}
            multiple
          />
          <UploadList
            items={imageUploads}
            onRemove={(id) => removeItem(setImageUploads, id)}
            onMoveUp={(id) => moveItem(setImageUploads, id, "up")}
            onMoveDown={(id) => moveItem(setImageUploads, id, "down")}
          />
          {imageSettings}
          <Space>
            <Button
              type="primary"
              icon={<ThunderboltOutlined />}
              onClick={handleImagesToGif}
              loading={isBusy}
            >
              生成动图
            </Button>
            <Button
              icon={<ClearOutlined />}
              onClick={() => setImageUploads([])}
              disabled={!imageUploads.length || isBusy}
            >
              清空列表
            </Button>
          </Space>
          {previewSection}
        </Space>
      ),
    },
    {
      key: "gif-merge",
      label: "GIF 合并",
      children: (
        <Space direction="vertical" size={16} className="w-full">
          <FileUploader
            accept={[AcceptMap.gif]}
            acceptText="支持多 GIF 批量合并，建议不超过 20 个"
            onUploadSuccess={handleMergeUpload as any}
            multiple
          />
          <UploadList
            items={mergeUploads}
            onRemove={(id) => removeItem(setMergeUploads, id)}
            onMoveUp={(id) => moveItem(setMergeUploads, id, "up")}
            onMoveDown={(id) => moveItem(setMergeUploads, id, "down")}
          />
          {mergeSettings}
          <Space>
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              onClick={handleMergeGif}
              loading={isBusy}
            >
              合并导出
            </Button>
            <Button
              icon={<ClearOutlined />}
              onClick={() => setMergeUploads([])}
              disabled={!mergeUploads.length || isBusy}
            >
              清空列表
            </Button>
          </Space>
          {previewSection}
        </Space>
      ),
    },
  ];

  return (
    <Container title="GIF 多格式转换" instructions={instructions}>
      <Tabs
        activeKey={activeKey}
        onChange={(key) => setActiveKey(key as TabKey)}
        items={tabItems}
      />
    </Container>
  );
}
