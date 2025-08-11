"use client";

import React, { useState, useCallback, useEffect } from "react";
import { Layout, message, Button } from "antd";
import {
  ScissorOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
  PlusOutlined,
  UndoOutlined,
} from "@ant-design/icons";
import Container from "@/components/layout/ToolsLayout/Container";
import { downloadFile } from "@gixy/utils";
import FileUploader from "@/components/FileUploader";
import { PDFDocument } from "pdf-lib";

let pdfjsLib: any = null;
const { Content } = Layout;

type Page = {
  id: number;
  canvas: string;
  selected: boolean;
  pageNumber: number;
  partitionId: number | null;
};

type Pages = Page[];

type Partition = {
  id: number;
  name: string;
  color: string;
};

const generateRandomColor = () => {
  const colors = [
    "#1677ff",
    "#52c41a",
    "#faad14",
    "#f5222d",
    "#722ed1",
    "#1890ff",
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

const PdfSplitPage = () => {
  const [pages, setPages] = useState<Pages>([]);
  const [pdfDoc, setPdfDoc] = useState<PDFDocument>();
  const [scale, setScale] = useState<number>(1);
  const [pdfBytes, setPdfBytes] = useState<ArrayBuffer>();
  const [partitions, setPartitions] = useState<Partition[]>([
    { id: 1, name: "分区1", color: "#1677ff" },
  ]);
  const [activePartitionId, setActivePartitionId] = useState<number>(1);

  // 因为存在dom对象的操作，pdfjs包需要动态导入进行水合
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Import PDF.js...
      import("pdfjs-dist").then((pdfjsObject) => {
        pdfjsLib = pdfjsObject;
        // Set the worker source...
        pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
      });
    }
  }, []);

  const addPartition = () => {
    const newId = Math.max(...partitions.map((p) => p.id), 0) + 1;
    setPartitions([
      ...partitions,
      { id: newId, name: `分区${newId}`, color: generateRandomColor() },
    ]);
    setActivePartitionId(newId);
  };

  const deletePartition = (id: number) => {
    if (partitions.length <= 1) {
      message.info("至少需要保留一个分区");
      return;
    }

    // 更新页面，移除被删除分区的关联
    setPages(
      pages.map((page) =>
        page.partitionId === id
          ? { ...page, partitionId: null, selected: false }
          : page,
      ),
    );

    // 删除分区
    setPartitions(partitions.filter((p) => p.id !== id));

    // 设置新的活动分区
    setActivePartitionId(partitions[0].id);
  };

  const handlePartitionChange = (id: number) => {
    setActivePartitionId(id);
  };

  // 重置分区选择
  const resetPartitions = () => {
    setPartitions([{ id: 1, name: "分区1", color: "#1677ff" }]);
    setActivePartitionId(1);
    setPages(
      pages.map((page) => ({ ...page, partitionId: null, selected: false })),
    );
  };

  const handlePageSplit = async () => {
    try {
      if (!pdfDoc) {
        message.error("请先上传PDF文档");
        return;
      }

      // 按分区拆分PDF
      for (const partition of partitions) {
        const partitionPages = pages
          .filter((page) => page.partitionId === partition.id)
          .map((page) => page.pageNumber - 1);

        if (partitionPages.length === 0) continue;

        const newPdfDoc = await PDFDocument.create();
        const sortedPages = partitionPages.sort((a, b) => a - b);
        for (let i = 0; i < sortedPages.length; i++) {
          const [copiedPage] = await newPdfDoc.copyPages(pdfDoc, [
            sortedPages[i],
          ]);
          newPdfDoc.addPage(copiedPage);
        }
        const newPdfBytes = await newPdfDoc.save();
        const newPdfBlob = new Blob([newPdfBytes], { type: "application/pdf" });
        const newPdfUrl = URL.createObjectURL(newPdfBlob);
        downloadFile(newPdfUrl, `${partition.name}.pdf`);
      }

      message.success("所有分区已成功拆分并下载");
      return;
    } catch (error) {
      console.error("拆分PDF失败:", error);
      message.error("拆分PDF时发生错误，请检查控制台日志");
    }
  };

  const handlePageClick = (pageNumber: number) => {
    setPages(
      pages.map((page) => {
        if (page.pageNumber === pageNumber + 1) {
          // 如果页面已经属于当前分区，则取消选择
          if (page.partitionId === activePartitionId) {
            return { ...page, selected: false, partitionId: null };
          } else {
            // 否则将其添加到当前分区
            return { ...page, selected: true, partitionId: activePartitionId };
          }
        }
        return page;
      }),
    );
  };

  const renderPages = useCallback(async () => {
    if (!pdfBytes) return;

    // 1. 使用 pdfjs-dist 加载并渲染页面（用于预览）
    const pdf = await pdfjsLib.getDocument({ data: pdfBytes }).promise;
    const pageCount = pdf.numPages;
    const newPages: Pages = [];
    for (let i = 1; i <= pageCount; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale });

      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      if (!context) {
        message.error(`第${i}页渲染失败：无法获取canvas上下文`);
        continue;
      }
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      await page.render({ canvasContext: context, viewport }).promise;

      const canvasDataURL = canvas.toDataURL("image/png");

      // 保留现有页面的分区信息
      const existingPage = pages.find((p) => p.pageNumber === i);

      newPages.push({
        id: Date.now() + i + Math.random(), // 增加随机数确保id唯一
        pageNumber: i,
        canvas: canvasDataURL,
        selected: existingPage?.selected ?? false,
        partitionId: existingPage?.partitionId ?? null,
      });
    }
    setPages(newPages);
  }, [pdfBytes, scale, pages]);

  const handleUpload = async (files: any[]) => {
    for (const { file } of files) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const pdfBytes = e?.target?.result as ArrayBuffer;
        setPdfBytes(pdfBytes);

        // 2. 使用 pdf-lib 加载 PDF 文档
        const pdfDoc = await PDFDocument.load(pdfBytes);
        setPdfDoc(pdfDoc);

        // 渲染页面
        await renderPages();
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const handleZoomIn = () => {
    if (scale < 3) {
      setScale((prev) => Math.min(prev + 0.1, 3));
    } else {
      message.info("已达到最大缩放比例");
    }
  };

  const handleZoomOut = () => {
    if (scale > 0.5) {
      setScale((prev) => Math.max(prev - 0.1, 0.5));
    } else {
      message.info("已达到最小缩放比例");
    }
  };

  // 监听scale变化，重新渲染页面
  React.useEffect(() => {
    if (pdfBytes) {
      // 添加延迟确保scale更新完成
      const timer = setTimeout(() => {
        renderPages();
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [scale, renderPages, pdfBytes]);

  // 工具说明内容
  const instructions = {
    title: "使用说明",
    content: [
      "上传PDF文件：点击下方的文件上传按钮，选择需要拆分的PDF文档（仅支持PDF格式）。",
      "预览页面：上传成功后，页面会显示所有PDF页面的缩略图，每个缩略图右上角显示页码。",
      "选择页面：点击需要拆分的页面缩略图，选中的页面会显示蓝色边框和背景色（可多选）。",
      "执行拆分：确认选择后，点击顶部的“完成”按钮，系统将生成并自动下载拆分后的PDF文件（仅包含选中页面）。",
    ],
    tips: "整个转换过程都在您的本地进行，我们不会上传任何数据到云端服务器",
  };

  return (
    <Container
      title="PDF拆分"
      header={
        <div className="flex flex-wrap justify-between gap-2 p-4">
          <div className="flex flex-wrap gap-2">
            {partitions.map((partition) => (
              <Button
                key={partition.id}
                style={{ backgroundColor: partition.color, color: "#fff" }}
                onClick={() => handlePartitionChange(partition.id)}
                className={
                  activePartitionId === partition.id
                    ? "ring-2 ring-white ring-offset-2"
                    : ""
                }
              >
                {partition.name}
                {partitions.length > 1 && (
                  <span
                    className="ml-1 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      deletePartition(partition.id);
                    }}
                  >
                    ×
                  </span>
                )}
              </Button>
            ))}
            <Button icon={<PlusOutlined />} onClick={addPartition}>
              添加分区
            </Button>
            <Button icon={<UndoOutlined />} onClick={resetPartitions}>
              重置分区
            </Button>
          </div>
          <div className="flex gap-2">
            <Button icon={<ZoomOutOutlined />} onClick={handleZoomOut}>
              缩小
            </Button>
            <Button icon={<ZoomInOutlined />} onClick={handleZoomIn}>
              放大
            </Button>
            <span className="flex items-center px-2 py-1 text-sm text-gray-600">
              缩放比例: {scale.toFixed(1)}x
            </span>
            <Button
              type="primary"
              icon={<ScissorOutlined />}
              onClick={handlePageSplit}
            >
              完成拆分
            </Button>
          </div>
        </div>
      }
      instructions={{
        ...instructions,
        content: [
          "上传PDF文件：点击下方的文件上传按钮，选择需要拆分的PDF文档（仅支持PDF格式）。",
          "创建分区：点击'添加分区'按钮可以创建多个拆分区域。",
          "选择页面：先选择要添加页面的分区，然后点击PDF页面缩略图将其添加到该分区。",
          "执行拆分：确认选择后，点击顶部的'完成拆分'按钮，系统将为每个分区生成并自动下载对应的PDF文件。",
        ],
      }}
    >
      <Content>
        <div
          className={`grid ${scale > 2 ? "grid-cols-3" : "grid-cols-[repeat(auto-fill,minmax(180px,1fr))]"} gap-4 p-4`}
        >
          {pages.map((page) => (
            <div
              key={page.id}
              className="relative rounded-lg border border-solid border-gray-200 p-1 transition-all duration-300 hover:cursor-pointer hover:shadow-md"
              onClick={() => handlePageClick(page.pageNumber - 1)}
              style={{
                borderColor: page.partitionId
                  ? partitions.find((p) => p.id === page.partitionId)?.color ||
                    "#1677ff"
                  : "#e8e8e8",
                backgroundColor: page.partitionId
                  ? `${partitions.find((p) => p.id === page.partitionId)?.color || "#1677ff"}10`
                  : "white",
                boxShadow: page.partitionId
                  ? `0 0 0 2px ${partitions.find((p) => p.id === page.partitionId)?.color || "#1677ff"}`
                  : "none",
              }}
            >
              {/* 分区颜色标识条 */}
              {page.partitionId && (
                <div
                  className="absolute left-0 right-0 top-0 h-1"
                  style={{
                    backgroundColor:
                      partitions.find((p) => p.id === page.partitionId)
                        ?.color || "#1677ff",
                    borderTopLeftRadius: "4px",
                    borderTopRightRadius: "4px",
                  }}
                />
              )}

              {/* 剪切线样式 - 对角线 */}
              {page.partitionId && (
                <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
                  <div
                    className="absolute -right-12 top-0 h-0.5 w-32 rotate-45"
                    style={{
                      transformOrigin: "left top",
                      backgroundColor:
                        partitions.find((p) => p.id === page.partitionId)
                          ?.color || "#1677ff",
                      opacity: 0.6,
                      boxShadow: "0 0 2px rgba(0,0,0,0.2)",
                    }}
                  />
                </div>
              )}

              <img
                src={page.canvas}
                alt="PDF页面"
                className="w-full object-cover"
                style={{ height: `${150 * scale}px` }}
              />
              <div className="absolute left-1 top-1 rounded bg-black/60 px-2 py-1 text-xs text-white">
                第{page.pageNumber}页
              </div>
              {page.partitionId && (
                <div
                  className="absolute right-1 top-1 rounded px-1 py-0.5 text-xs text-white"
                  style={{
                    backgroundColor:
                      partitions.find((p) => p.id === page.partitionId)
                        ?.color || "#1677ff",
                  }}
                >
                  {partitions.find((p) => p.id === page.partitionId)?.name}
                </div>
              )}
            </div>
          ))}
        </div>
        <FileUploader
          accept={["application/pdf"]}
          onUploadSuccess={handleUpload}
          multiple
        />
      </Content>
    </Container>
  );
};

export default PdfSplitPage;
