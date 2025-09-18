import { useDeviceDetect } from "@/hooks/useDeviceDetect";
import {
  checkFileSizeLimit,
  createPreviewUrl,
  detectImageFormat,
} from "@/lib/imageProcessing";
import { InboxOutlined } from "@ant-design/icons";
import { Alert, message, Typography, Upload } from "antd";
import type { UploadProps } from "antd";
import React, { useCallback, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { ImageFile } from "../types";

const { Dragger } = Upload;
const { Text } = Typography;

interface FileUploaderProps {
  onFilesAdded: (files: ImageFile[]) => void;
}

// 生成文件指纹，用于相同文件识别
const generateFileFingerprint = async (file: File): Promise<string> => {
  try {
    // 使用文件名、大小、最后修改时间创建指纹
    const fingerprintData = `${file.name}-${file.size}-${file.lastModified}`;

    // 如果支持crypto API，生成哈希值
    if (window.crypto && window.crypto.subtle) {
      const encoder = new TextEncoder();
      const data = encoder.encode(fingerprintData);
      const hashBuffer = await window.crypto.subtle.digest("SHA-256", data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    }

    // 降级方案：使用简单的字符串哈希
    let hash = 0;
    for (let i = 0; i < fingerprintData.length; i++) {
      const char = fingerprintData.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // 转换为32位整数
    }
    return Math.abs(hash).toString(36);
  } catch (error) {
    console.warn("生成文件指纹失败，使用UUID:", error);
    return uuidv4();
  }
};

const FileUploader = ({ onFilesAdded }: FileUploaderProps) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { isMobile } = useDeviceDetect();

  // 处理文件函数
  const processFiles = useCallback(
    async (fileList: File[]) => {
      if (isLoading || fileList.length === 0) {
        return;
      }

      try {
        setIsLoading(true);

        const maxSize = isMobile ? 20 : 50; // 以MB为单位
        const validFiles: ImageFile[] = [];
        const invalidFiles: string[] = [];

        for (const file of fileList) {
          // 验证文件类型
          const isImage = file.type.startsWith("image/");
          if (!isImage) {
            invalidFiles.push(`${file.name} (不是图片文件)`);
            continue;
          }

          // 验证文件大小
          if (!checkFileSizeLimit(file, isMobile)) {
            invalidFiles.push(`${file.name} (超过${maxSize}MB限制)`);
            continue;
          }

          // 处理有效文件
          try {
            const preview = await createPreviewUrl(file);
            const format = detectImageFormat(file);
            // 为相同文件生成一致的ID
            const fileId = await generateFileFingerprint(file);

            validFiles.push({
              id: fileId,
              file,
              preview,
              format,
              size: file.size,
              name: file.name,
              status: "idle",
            });
          } catch (_error) {
            invalidFiles.push(`${file.name} (处理失败)`);
            console.log("处理失败", _error);
          }
        }

        // 提示无效文件
        if (invalidFiles.length > 0) {
          message.error(
            `${invalidFiles.length}个文件无法处理: ${invalidFiles.join(", ")}`,
          );
        }

        // 返回有效文件
        if (validFiles.length > 0) {
          onFilesAdded(validFiles);
          message.success(`已添加${validFiles.length}个文件`);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [isMobile, onFilesAdded, isLoading],
  );

  // 处理文件选择
  const handleFileUpload = useCallback(
    (options: Parameters<NonNullable<UploadProps["customRequest"]>>[0]) => {
      const { file, onSuccess } = options;

      // 单个文件上传处理
      if (file instanceof File) {
        processFiles([file]);
      }

      // 完成上传操作
      onSuccess?.("ok");
      return false; // 阻止默认上传行为
    },
    [processFiles],
  );

  // 处理拖拽上传
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const files = Array.from(e.dataTransfer.files);
      processFiles(files);
    },
    [processFiles],
  );

  // 处理多文件选择
  const handleMultipleFiles = useCallback(
    (info: { fileList: Array<{ originFileObj?: File }> }) => {
      const { fileList } = info;
      if (fileList && fileList.length > 0) {
        const files = fileList
          .map((item) => item.originFileObj)
          .filter((file): file is File => file instanceof File);
        processFiles(files);
      }
    },
    [processFiles],
  );

  return (
    <div className="w-full">
      <Dragger
        name="files"
        multiple
        customRequest={handleFileUpload}
        onChange={handleMultipleFiles}
        onDrop={handleDrop}
        accept="image/*"
        showUploadList={false}
        disabled={isLoading}
        className="hover:border-primary"
      >
        <p className="ant-upload-drag-icon">
          <InboxOutlined className="text-4xl text-primary" />
        </p>
        <p className="ant-upload-text text-lg font-medium">
          点击或拖拽图片到此区域上传
        </p>
        <p className="ant-upload-hint text-gray-500">
          支持单个或批量上传。支持 JPG、PNG、WebP、SVG 等格式
          <br />
          <Text type="secondary">
            文件大小限制：{isMobile ? "20MB" : "50MB"}
          </Text>
        </p>
      </Dragger>

      <Alert
        message="隐私保护"
        description="所有图片处理都在您的浏览器本地进行，不会上传到服务器，确保您的隐私安全。"
        type="info"
        showIcon
        className="mt-4"
      />
    </div>
  );
};

export default FileUploader;
