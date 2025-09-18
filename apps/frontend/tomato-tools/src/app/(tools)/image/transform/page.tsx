"use client";

import { ImageViewer, ImageViewerItem } from "@/components/ImageViewer";
import { Container } from "@/components/layout/ToolsLayout";
import {
  convertImage,
  getRecommendedFormat,
  saveImage,
} from "@/lib/imageProcessing";
import { Button, Col, Empty, message, Modal, Row } from "antd";
import { useCallback, useState } from "react";
import BatchActions from "./components/BatchActions";
import ConversionSettings from "./components/ConversionSettings";
import FileUploader from "@/components/FileUploader";
import ImageItem from "./components/ImageItem";
import { ImageFile, ConversionSettings as SettingsType } from "./types";

// 使用说明内容
const instructionsContent = [
  "上传图片：点击下方的文件上传按钮，选择需要转换的图片文件（支持JPG、PNG、GIF、BMP、TIFF等格式）。",
  "选择格式：在下方的格式选择器中，选择目标图片格式（JPG、PNG、GIF、BMP、TIFF等）。",
  "执行转换：确认选择后，点击顶部的'开始转换 🚀'按钮，系统将自动处理并下载转换后的图片文件。",
];

// 检查浏览器是否支持Web Share API
const isShareSupported =
  typeof navigator !== "undefined" && "share" in navigator;

export default function ImageTransformPage() {
  // 状态管理
  const [imageFiles, setImageFiles] = useState<ImageFile[]>([]);
  const [settings, setSettings] = useState<SettingsType>({
    format: "webp",
    quality: 80,
    removeBackground: false,
    preserveExif: true,
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingConvertAction, setPendingConvertAction] = useState<
    (() => void) | null
  >(null);
  // 图片预览状态
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);

  // 处理新添加的文件
  const handleFilesAdded = useCallback(
    (files: ImageFile[]) => {
      // 检查文件ID是否已存在，防止重复添加
      setImageFiles((prevFiles) => {
        // 获取已有文件的ID集合
        const existingIds = new Set(prevFiles.map((file) => file.id));

        // 过滤掉已存在的文件
        const newFiles = files.filter((file) => !existingIds.has(file.id));

        // 如果没有新文件，直接返回原状态
        if (newFiles.length === 0) {
          return prevFiles;
        }

        // 否则添加新文件
        return [...prevFiles, ...newFiles];
      });

      // 如果只有一个文件，自动推荐最佳格式
      if (files.length === 1) {
        const recommendedFormat = getRecommendedFormat(files[0].format);
        if (recommendedFormat !== settings.format) {
          setSettings((prev) => ({ ...prev, format: recommendedFormat }));
        }
      }
    },
    [settings.format],
  );

  // 转换单个图片
  const convertSingleImage = useCallback(
    async (imageFile: ImageFile): Promise<ImageFile> => {
      try {
        const result = await convertImage(imageFile.file, settings);
        return {
          ...imageFile,
          status: "completed",
          result,
          error: undefined,
        };
      } catch (error) {
        console.error("转换失败:", error);
        return {
          ...imageFile,
          status: "error",
          error: error instanceof Error ? error.message : "转换失败",
        };
      }
    },
    [settings],
  );

  // 处理单个文件转换
  const handleConvertSingle = useCallback(
    async (id: string) => {
      const imageFile = imageFiles.find((file) => file.id === id);
      if (!imageFile) return;

      // 检查是否已有转换结果
      if (imageFile.result) {
        // 显示确认对话框
        setPendingConvertAction(() => async () => {
          setImageFiles((prevFiles) =>
            prevFiles.map((file) =>
              file.id === id ? { ...file, status: "processing" } : file,
            ),
          );

          const convertedFile = await convertSingleImage(imageFile);

          setImageFiles((prevFiles) =>
            prevFiles.map((file) => (file.id === id ? convertedFile : file)),
          );
        });
        setShowConfirmModal(true);
        return;
      }

      // 直接转换
      setImageFiles((prevFiles) =>
        prevFiles.map((file) =>
          file.id === id ? { ...file, status: "processing" } : file,
        ),
      );

      const convertedFile = await convertSingleImage(imageFile);

      setImageFiles((prevFiles) =>
        prevFiles.map((file) => (file.id === id ? convertedFile : file)),
      );
    },
    [imageFiles, convertSingleImage],
  );

  // 批量转换所有图片
  const handleConvertAll = useCallback(async () => {
    if (imageFiles.length === 0) return;

    // 检查是否有已转换的文件
    const hasConvertedFiles = imageFiles.some((file) => file.result);
    if (hasConvertedFiles) {
      setPendingConvertAction(() => async () => {
        await performBatchConvert(imageFiles);
      });
      setShowConfirmModal(true);
      return;
    }

    await performBatchConvert(imageFiles);
  }, [imageFiles]);

  // 转换剩余文件（仅转换未转换的文件）
  const handleConvertRemaining = useCallback(async () => {
    const remainingFiles = imageFiles.filter((file) => !file.result);
    if (remainingFiles.length === 0) return;

    await performBatchConvert(remainingFiles);
  }, [imageFiles]);

  // 执行批量转换
  const performBatchConvert = useCallback(
    async (filesToConvert: ImageFile[]) => {
      setIsProcessing(true);
      setProgress(0);

      try {
        // 标记所有要转换的文件为处理中
        setImageFiles((prevFiles) =>
          prevFiles.map((file) =>
            filesToConvert.some((f) => f.id === file.id)
              ? { ...file, status: "processing" }
              : file,
          ),
        );

        const totalFiles = filesToConvert.length;
        let completedFiles = 0;

        // 并发转换，但限制并发数量
        const concurrencyLimit = 3;
        const chunks = [];
        for (let i = 0; i < filesToConvert.length; i += concurrencyLimit) {
          chunks.push(filesToConvert.slice(i, i + concurrencyLimit));
        }

        for (const chunk of chunks) {
          const promises = chunk.map(async (file) => {
            const convertedFile = await convertSingleImage(file);
            completedFiles++;
            setProgress((completedFiles / totalFiles) * 100);
            return convertedFile;
          });

          const convertedChunk = await Promise.all(promises);

          // 更新转换结果
          setImageFiles((prevFiles) =>
            prevFiles.map((file) => {
              const converted = convertedChunk.find((c) => c.id === file.id);
              return converted || file;
            }),
          );
        }

        message.success(`成功转换 ${totalFiles} 个文件`);
      } catch (error) {
        console.error("批量转换失败:", error);
        message.error("批量转换失败");
      } finally {
        setIsProcessing(false);
        setProgress(0);
      }
    },
    [convertSingleImage],
  );

  // 确认转换
  const handleConfirmConvert = useCallback(async () => {
    setShowConfirmModal(false);
    if (pendingConvertAction) {
      await pendingConvertAction();
      setPendingConvertAction(null);
    }
  }, [pendingConvertAction]);

  // 取消转换
  const handleCancelConvert = useCallback(() => {
    setShowConfirmModal(false);
    setPendingConvertAction(null);
  }, []);

  // 下载单个文件
  const handleDownload = useCallback(async (imageFile: ImageFile) => {
    if (!imageFile.result) {
      message.error("文件尚未转换");
      return;
    }

    try {
      await saveImage(
        imageFile.result.blob!,
        `${imageFile.name.split(".")[0]}.${imageFile.result.format}`,
      );
      message.success("下载成功");
    } catch (error) {
      message.error("下载失败");
      console.error(error);
    }
  }, []);

  // 批量下载所有已转换的文件
  const handleDownloadAll = useCallback(async () => {
    const completedFiles = imageFiles.filter(
      (file) => file.status === "completed" && file.result,
    );

    if (completedFiles.length === 0) {
      message.warning("没有可下载的文件");
      return;
    }

    try {
      // 如果只有一个文件，直接下载
      if (completedFiles.length === 1) {
        await handleDownload(completedFiles[0]);
        return;
      }

      // 多个文件时，逐个下载
      for (const file of completedFiles) {
        await saveImage(
          file.result!.blob!,
          `${file.name.split(".")[0]}.${file.result!.format}`,
        );
        // 添加小延迟避免浏览器阻止多个下载
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      message.success(`成功下载 ${completedFiles.length} 个文件`);
    } catch (error) {
      message.error("批量下载失败");
      console.error(error);
    }
  }, [imageFiles, handleDownload]);

  // 清空所有文件
  const handleClearAll = useCallback(() => {
    setImageFiles([]);
    setProgress(0);
    message.success("已清空所有文件");
  }, []);

  // 删除单个文件
  const handleDelete = useCallback((id: string) => {
    setImageFiles((prevFiles) => {
      const newFiles = prevFiles.filter((file) => file.id !== id);
      // 清理预览URL
      const fileToDelete = prevFiles.find((file) => file.id === id);
      if (fileToDelete) {
        URL.revokeObjectURL(fileToDelete.preview);
        if (fileToDelete.result?.preview) {
          URL.revokeObjectURL(fileToDelete.result.preview);
        }
      }
      return newFiles;
    });
    message.success("文件已删除");
  }, []);

  // 分享文件
  const handleShare = useCallback(async (imageFile: ImageFile) => {
    if (!imageFile.result) {
      message.error("文件尚未转换");
      return;
    }

    if (!isShareSupported) {
      message.error("当前浏览器不支持分享功能");
      return;
    }

    try {
      const fileName = `${imageFile.name.split(".")[0]}.${imageFile.result.format}`;
      const file = new File([imageFile.result.blob!], fileName, {
        type: imageFile.result.blob!.type,
      });

      await navigator.share({
        title: "分享图片",
        text: "我使用图像处理工具处理的图片",
        files: [file],
      });

      message.success("分享成功");
    } catch (error) {
      message.error("分享失败");
      console.error(error);
    }
  }, []);

  // 处理图片预览
  const handlePreview = useCallback(
    (imageFile: ImageFile) => {
      const index = imageFiles.findIndex((file) => file.id === imageFile.id);
      if (index !== -1) {
        setPreviewIndex(index);
        setPreviewVisible(true);
      }
    },
    [imageFiles],
  );

  // 关闭预览
  const handleClosePreview = useCallback(() => {
    setPreviewVisible(false);
  }, []);

  // 预览索引变化
  const handlePreviewIndexChange = useCallback((index: number) => {
    setPreviewIndex(index);
  }, []);

  // 转换图片数据为预览格式
  const previewImages: ImageViewerItem[] = imageFiles.map((file) => ({
    id: file.id,
    src: file.result?.preview || file.preview,
    alt: file.name,
    title: `${file.name} (${file.format.toUpperCase()}${file.result ? ` → ${file.result.format.toUpperCase()}` : ""})`,
  }));

  return (
    <>
      <Container
        title="图片转换"
        instructions={{
          tips: "整个转换过程都在您的本地进行，我们不会上传任何数据到云端服务器",
          content: instructionsContent,
        }}
      >
        {/* 自定义确认对话框 */}
        <Modal
          title="确认重新转换"
          open={showConfirmModal}
          onCancel={handleCancelConvert}
          footer={[
            <Button key="cancel" onClick={handleCancelConvert}>
              取消
            </Button>,
            <Button key="submit" type="primary" onClick={handleConfirmConvert}>
              继续转换
            </Button>,
          ]}
        >
          <p>检测到有已转换的图片，重新转换可能会覆盖之前的结果。是否继续？</p>
        </Modal>

        <Row gutter={[24, 24]}>
          <Col xs={24} sm={24} md={12} lg={12} xl={12}>
            <FileUploader
              multiple
              accept={["image/*"]}
              acceptText="支持单个或批量上传。支持 JPG、PNG、WebP 等格式"
              onUploadSuccess={handleFilesAdded}
            />
          </Col>

          <Col xs={24} sm={24} md={12} lg={12} xl={12}>
            <ConversionSettings
              settings={settings}
              onSettingsChange={setSettings}
              currentFormat={
                imageFiles.length === 1 ? imageFiles[0].format : undefined
              }
            />
          </Col>
        </Row>

        {/* 批量操作区 */}
        {imageFiles.length > 0 && (
          <div style={{ marginTop: "24px" }}>
            <BatchActions
              imageFiles={imageFiles}
              onConvertAll={handleConvertAll}
              onConvertRemaining={handleConvertRemaining}
              onDownloadAll={handleDownloadAll}
              onClearAll={handleClearAll}
              isProcessing={isProcessing}
              progress={progress}
            />
          </div>
        )}

        {/* 图片预览区 */}
        <div style={{ marginTop: "24px" }}>
          {imageFiles.length > 0 ? (
            imageFiles.map((file) => (
              <ImageItem
                key={file.id}
                imageFile={file}
                onDownload={handleDownload}
                onShare={isShareSupported ? handleShare : undefined}
                onDelete={handleDelete}
                onConvert={handleConvertSingle}
                onPreview={handlePreview}
              />
            ))
          ) : (
            <Empty
              description="请上传图片文件"
              style={{ marginTop: "32px", padding: "32px" }}
            />
          )}
        </div>

        {/* 图片预览器 */}
        <ImageViewer
          visible={previewVisible}
          images={previewImages}
          currentIndex={previewIndex}
          onClose={handleClosePreview}
          onIndexChange={handlePreviewIndexChange}
          showThumbnails={true}
          showDots={true}
          showNavigation={true}
          showZoom={true}
        />
      </Container>
    </>
  );
}
