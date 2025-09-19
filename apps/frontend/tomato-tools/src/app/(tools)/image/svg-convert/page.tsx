"use client";

import { ImageViewer } from "@/components/ImageViewer";
import { Container } from "@/components/layout/ToolsLayout";
import { convertImageToSVG, saveImage } from "@/lib/imageProcessing";
import { Col, Empty, message, Modal, Row } from "antd";
import { useCallback, useState } from "react";
import BatchActions from "../transform/components/BatchActions";
import FileUploader from "@/components/FileUploader";
import ImageItem from "../transform/components/ImageItem";
import { ImageFile } from "../transform/types";
import { svgInstructions } from "./instructions";

export default function SVGConvertPage() {
  // 状态管理
  const [imageFiles, setImageFiles] = useState<ImageFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingConvertAction, setPendingConvertAction] = useState<
    (() => void) | null
  >(null);
  // 图片预览状态
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);

  // SVG转换设置
  const [svgSettings, setSvgSettings] = useState({
    precision: 8,
    colorMode: "auto" as "auto" | "color" | "grayscale" | "monochrome",
    removeBackground: false,
    simplifyPaths: true,
  });

  // 使用专门的instructions
  const instructionsContent = svgInstructions;

  // 处理新添加的文件
  const handleFilesAdded = useCallback((files: ImageFile[]) => {
    setImageFiles((prevFiles) => {
      return [...prevFiles, ...files];
    });
  }, []);

  // 转换单个图片为SVG
  const convertSingleImageToSVG = useCallback(
    async (imageFile: ImageFile): Promise<ImageFile> => {
      try {
        const result = await convertImageToSVG(imageFile.file, svgSettings);
        return {
          ...imageFile,
          status: "completed",
          result,
          error: undefined,
        };
      } catch (error) {
        console.error("SVG转换失败:", error);
        return {
          ...imageFile,
          status: "error",
          error: error instanceof Error ? error.message : "SVG转换失败",
        };
      }
    },
    [svgSettings],
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

          const convertedFile = await convertSingleImageToSVG(imageFile);

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

      const convertedFile = await convertSingleImageToSVG(imageFile);

      setImageFiles((prevFiles) =>
        prevFiles.map((file) => (file.id === id ? convertedFile : file)),
      );
    },
    [imageFiles, convertSingleImageToSVG],
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
            const convertedFile = await convertSingleImageToSVG(file);
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

        message.success(`成功转换 ${totalFiles} 个文件为SVG格式`);
      } catch (error) {
        console.error("批量SVG转换失败:", error);
        message.error("批量SVG转换失败");
      } finally {
        setIsProcessing(false);
        setProgress(0);
      }
    },
    [convertSingleImageToSVG],
  );

  // 确认转换
  const handleConfirmConvert = useCallback(async () => {
    setShowConfirmModal(false);
    if (pendingConvertAction) {
      pendingConvertAction();
      setPendingConvertAction(null);
    }
  }, [pendingConvertAction]);

  // 取消转换
  const handleCancelConvert = useCallback(() => {
    setShowConfirmModal(false);
    setPendingConvertAction(null);
  }, []);

  // 下载单个SVG文件
  const handleDownload = useCallback(async (imageFile: ImageFile) => {
    if (!imageFile.result) {
      message.error("文件尚未转换");
      return;
    }

    try {
      saveImage(imageFile.result.blob!, `${imageFile.name.split(".")[0]}.svg`);
      message.success("SVG文件下载成功");
    } catch (error) {
      message.error("SVG文件下载失败");
      console.error(error);
    }
  }, []);

  // 批量下载所有已转换的SVG文件
  const handleDownloadAll = useCallback(async () => {
    const completedFiles = imageFiles.filter(
      (file) => file.status === "completed" && file.result,
    );

    if (completedFiles.length === 0) {
      message.warning("没有可下载的SVG文件");
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
        await saveImage(file.result!.blob!, `${file.name.split(".")[0]}.svg`);
        // 添加小延迟避免浏览器阻止多个下载
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      message.success(`成功下载 ${completedFiles.length} 个SVG文件`);
    } catch (error) {
      message.error("批量SVG下载失败");
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
    setImageFiles((prevFiles) => prevFiles.filter((file) => file.id !== id));
  }, []);

  // 预览图片
  const handlePreview = useCallback((index: number) => {
    setPreviewIndex(index);
    setPreviewVisible(true);
  }, []);

  // 渲染SVG转换设置组件 - 优化版本，支持暗色主题
  const renderSVGSettings = () => (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-lg dark:border-gray-700 dark:bg-gray-800">
      <h3 className="mb-6 text-xl font-semibold text-gray-800 dark:text-gray-100">
        SVG转换设置
      </h3>

      <div className="space-y-8">
        {/* 转换精度 */}
        <div>
          <label className="mb-4 block text-sm font-medium text-gray-700 dark:text-gray-300">
            转换精度
            <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
              ({svgSettings.precision}/10)
            </span>
          </label>
          <div className="relative">
            <input
              aria-label="Conversion precision slider"
              title="Adjust conversion precision"
              placeholder="Conversion precision"
              type="range"
              min="1"
              max="10"
              value={svgSettings.precision}
              onChange={(e) =>
                setSvgSettings((prev) => ({
                  ...prev,
                  precision: parseInt(e.target.value),
                }))
              }
              className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 transition-all dark:bg-gray-600 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:transition-all hover:[&::-webkit-slider-thumb]:bg-blue-600 dark:[&::-webkit-slider-thumb]:bg-blue-400"
            />
            <div className="mt-3 flex justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>快速</span>
              <span>平衡</span>
              <span>精细</span>
            </div>
          </div>
        </div>

        {/* 颜色模式 */}
        <div>
          <label className="mb-4 block text-sm font-medium text-gray-700 dark:text-gray-300">
            颜色模式
          </label>
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: "auto", label: "自动", desc: "智能选择" },
              { value: "color", label: "彩色", desc: "保持原色" },
              { value: "grayscale", label: "灰度", desc: "黑白效果" },
              { value: "monochrome", label: "单色", desc: "纯黑图形" },
            ].map((mode) => (
              <button
                key={mode.value}
                type="button"
                onClick={() =>
                  setSvgSettings((prev) => ({
                    ...prev,
                    colorMode: mode.value as any,
                  }))
                }
                className={`rounded-lg border-2 p-4 text-left transition-all duration-200 ${
                  svgSettings.colorMode === mode.value
                    ? "border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-900/30 dark:text-blue-300"
                    : "border-gray-200 bg-gray-50 hover:border-gray-300 dark:border-gray-600 dark:bg-gray-700/50 dark:text-gray-300 dark:hover:border-gray-500"
                }`}
              >
                <div className="font-medium">{mode.label}</div>
                <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {mode.desc}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 高级选项 */}
        <div>
          <label className="mb-4 block text-sm font-medium text-gray-700 dark:text-gray-300">
            高级选项
          </label>
          <div className="space-y-4">
            <label className="flex items-start">
              <input
                type="checkbox"
                checked={svgSettings.removeBackground}
                onChange={(e) =>
                  setSvgSettings((prev) => ({
                    ...prev,
                    removeBackground: e.target.checked,
                  }))
                }
                className="mr-3 mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-500 dark:bg-gray-600"
              />
              <div>
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  移除背景
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  自动检测并移除纯色背景
                </div>
              </div>
            </label>

            <label className="flex items-start">
              <input
                type="checkbox"
                checked={svgSettings.simplifyPaths}
                onChange={(e) =>
                  setSvgSettings((prev) => ({
                    ...prev,
                    simplifyPaths: e.target.checked,
                  }))
                }
                className="mr-3 mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-500 dark:bg-gray-600"
              />
              <div>
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  简化路径
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  减少SVG文件大小，提高加载速度
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* 提示信息 */}
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
          <div className="text-sm text-blue-800 dark:text-blue-200">
            <strong className="flex items-center">💡 使用提示</strong>
            <ul className="mt-3 space-y-2 text-xs">
              <li className="flex items-start">
                <span className="mr-2 mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-400"></span>
                简单图形转换效果最佳
              </li>
              <li className="flex items-start">
                <span className="mr-2 mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-400"></span>
                高精度适合复杂图片，但处理时间较长
              </li>
              <li className="flex items-start">
                <span className="mr-2 mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-400"></span>
                SVG文件可无损缩放，适合logo和图标
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <Container
      title="图片转SVG工具"
      instructions={{
        title: "将位图图片转换为可缩放的SVG矢量格式",
        content: instructionsContent,
      }}
    >
      {/* 批量操作栏 */}
      <BatchActions
        imageFiles={imageFiles}
        isProcessing={isProcessing}
        progress={progress}
        onConvertAll={handleConvertAll}
        onConvertRemaining={handleConvertRemaining}
        onDownloadAll={handleDownloadAll}
        onClearAll={handleClearAll}
      />

      <Row gutter={[32, 32]} className="mt-8">
        <Col xs={24} lg={16}>
          {/* 文件上传区域 */}
          <div className="mb-8">
            <FileUploader
              multiple
              accept={["image/*"]}
              acceptText="支持单个或批量上传。支持 JPG、PNG、WebP 等格式"
              onUploadSuccess={handleFilesAdded}
            />
          </div>

          {imageFiles.length > 0 && (
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  已上传图片 ({imageFiles.length})
                </h3>
              </div>
              <div>
                {imageFiles.map((file, index) => (
                  <div key={file.id} className="h-full">
                    <ImageItem
                      imageFile={file}
                      onConvert={() => handleConvertSingle(file.id)}
                      onDownload={() => handleDownload(file)}
                      onDelete={() => handleDelete(file.id)}
                      onPreview={() => handlePreview(index)}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {imageFiles.length === 0 && (
            <div className="mt-16">
              <Empty
                description="暂无图片，请上传图片开始转换"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                className="py-8"
              />
            </div>
          )}
        </Col>

        <Col xs={24} lg={8}>
          <div className="sticky top-8">
            {/* SVG转换设置 */}
            {renderSVGSettings()}
          </div>
        </Col>
      </Row>

      {/* 图片预览 */}
      <ImageViewer
        visible={previewVisible}
        onClose={() => setPreviewVisible(false)}
        currentIndex={previewIndex}
        onIndexChange={setPreviewIndex}
        images={imageFiles.map((file) => ({
          id: file.id,
          src: file.result?.preview || file.preview,
          title: file.name,
          alt: file.name,
        }))}
      />

      {/* 确认对话框 */}
      <Modal
        title="确认转换"
        open={showConfirmModal}
        onOk={handleConfirmConvert}
        onCancel={handleCancelConvert}
        okText="确认转换"
        cancelText="取消"
      >
        <p>检测到已有转换结果，重新转换将覆盖现有结果。是否继续？</p>
      </Modal>
    </Container>
  );
}
