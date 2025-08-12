"use client";

import { useState } from "react";
import { Button, message, List, Typography } from "antd";
import { PDFDocument } from "pdf-lib";
import { Container } from "@/components/layout/ToolsLayout";
import DragList from "@/components/pdfConcat/DragList";
import FileUploader from "@/components/FileUploader";
import { content } from "@/components/pdfConcat/Content";

type RcFileType = File & { id: string };
export interface CustomUploadFile extends RcFileType {
  file: RcFileType;
}

const ConcatPage: React.FC = () => {
  const [fileList, setFileList] = useState<CustomUploadFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const [mergedFileName, setMergedFileName] = useState<string>("");
  const [mergedPdfUrl, setMergedPdfUrl] = useState<string>("");

  // 处理文件上传
  const handleUpload = (files: any[]) => {
    setFileList((prev) => [...prev, ...files]);
  };

  // 处理文件删除
  const handleDelete = (uid: string) => {
    setFileList((prev) => prev.filter((file) => uid !== file.id));
  };

  // 合并PDF逻辑
  const handleMerge = async () => {
    if (fileList.length < 2) {
      return messageApi.warning("请至少上传2个PDF文件");
    }
    setIsLoading(true);
    try {
      const mergedPdf = await PDFDocument.create();
      for (const file of fileList) {
        const pdfBytes = await file.file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(pdfBytes);
        const pages = await mergedPdf.copyPages(
          pdfDoc,
          pdfDoc.getPageIndices(),
        );
        pages.forEach((page) => {
          mergedPdf.addPage(page);
        });
      }

      const mergedPdfBytes = await mergedPdf.save();
      const blob = new Blob([mergedPdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      setMergedPdfUrl(url);

      const link = document.createElement("a");
      link.href = url;
      link.download = "merged.pdf";
      link.click();

      message.success("PDF合并成功！");
      setMergedFileName("merged.pdf");
      setFileList([]);
    } catch (error: Error | any) {
      message.error("合并失败，请检查文件", error?.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 预览PDF
  const handlePreview = () => {
    if (mergedPdfUrl) {
      window.open(mergedPdfUrl, "_blank");
    }
  };

  return (
    <Container
      title="PDF合并"
      instructions={{
        content,
      }}
      footer={
        <div style={{ display: "flex", gap: 16 }}>
          <Button
            block
            type="primary"
            onClick={handleMerge}
            loading={isLoading}
            disabled={fileList.length < 2}
            style={{ height: 46, fontSize: 16, flex: 1 }}
          >
            开始合并 PDF 🚀
          </Button>
          <Button
            block
            type="default"
            onClick={handlePreview}
            disabled={!mergedPdfUrl}
            style={{ height: 46, fontSize: 16, flex: 1 }}
          >
            预览合并结果 👀
          </Button>
        </div>
      }
    >
      {contextHolder}
      <FileUploader
        onUploadSuccess={handleUpload}
        accept={["application/pdf"]}
        multiple
      />

      <DragList
        handleDelete={handleDelete}
        items={fileList}
        onChange={setFileList}
      />

      {mergedFileName && (
        <div style={{ marginTop: 24 }}>
          <Typography.Title level={5}>合并结果</Typography.Title>
          <List
            size="small"
            bordered
            dataSource={[mergedFileName]}
            renderItem={(item) => <List.Item>{item}</List.Item>}
          />
        </div>
      )}
    </Container>
  );
};

export default ConcatPage;
