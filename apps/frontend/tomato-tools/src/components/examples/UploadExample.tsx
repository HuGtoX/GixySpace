/**
 * 文件上传示例组件
 *
 * 这个组件展示了如何使用 Supabase Storage 上传功能
 * 包含多种上传方式的示例
 */

"use client";

import React, { useState } from "react";
import { Button, Card, Space, message, Upload, Image } from "antd";
import { UploadOutlined, DeleteOutlined } from "@ant-design/icons";
import {
  uploadToStorage,
  uploadAvatar,
  uploadBase64ToStorage,
  deleteFromStorage,
} from "@/lib/uploadUtils";

export default function UploadExample() {
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string>("");
  const [uploadedPath, setUploadedPath] = useState<string>("");

  // 示例1：使用原生 input 上传
  const handleFileInputChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const result = await uploadToStorage(file, {
        bucket: "avatars",
        folder: "examples",
      });

      if (result.url && result.path) {
        setUploadedUrl(result.url);
        setUploadedPath(result.path);
        message.success("上传成功！");
      }
    } catch (error: any) {
      message.error("上传失败：" + (error.message || "未知错误"));
    } finally {
      setUploading(false);
    }
  };

  // 示例2：使用 Ant Design Upload 组件
  const handleAntdUpload = async (file: File) => {
    setUploading(true);
    try {
      const result = await uploadToStorage(file, {
        bucket: "avatars",
        folder: "examples",
      });

      if (result.url && result.path) {
        setUploadedUrl(result.url);
        setUploadedPath(result.path);
        message.success("上传成功！");
      }
    } catch (error: any) {
      message.error("上传失败：" + (error.message || "未知错误"));
    } finally {
      setUploading(false);
    }
    return false; // 阻止默认上传行为
  };

  // 示例3：上传头像（快捷方法）
  const handleAvatarUpload = async (file: File) => {
    setUploading(true);
    try {
      const result = await uploadAvatar(file, "user123");

      if (result.url && result.path) {
        setUploadedUrl(result.url);
        setUploadedPath(result.path);
        message.success("头像上传成功！");
      }
    } catch (error: any) {
      message.error("上传失败：" + (error.message || "未知错误"));
    } finally {
      setUploading(false);
    }
    return false;
  };

  // 示例4：上传 Base64 图片
  const handleBase64Upload = async () => {
    // 这里使用一个简单的 1x1 像素的透明 PNG 作为示例
    const base64Data =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

    setUploading(true);
    try {
      const result = await uploadBase64ToStorage(
        base64Data,
        `example_${Date.now()}.png`,
        {
          bucket: "avatars",
          folder: "examples",
        },
      );

      if (result.url && result.path) {
        setUploadedUrl(result.url);
        setUploadedPath(result.path);
        message.success("Base64 图片上传成功！");
      }
    } catch (error: any) {
      message.error("上传失败：" + (error.message || "未知错误"));
    } finally {
      setUploading(false);
    }
  };

  // 删除文件
  const handleDelete = async () => {
    if (!uploadedPath) {
      message.warning("没有可删除的文件");
      return;
    }

    try {
      await deleteFromStorage(uploadedPath, "avatars");
      message.success("文件删除成功！");
      setUploadedUrl("");
      setUploadedPath("");
    } catch (error: any) {
      message.error("删除失败：" + (error.message || "未知错误"));
    }
  };

  return (
    <div className="p-8">
      <h1 className="mb-6 text-2xl font-bold">Supabase Storage 上传示例</h1>

      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        {/* 示例1：原生 input */}
        <Card title="示例1：使用原生 input 上传" size="small">
          <Space>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileInputChange}
              disabled={uploading}
            />
            {uploading && <span>上传中...</span>}
          </Space>
        </Card>

        {/* 示例2：Ant Design Upload */}
        <Card title="示例2：使用 Ant Design Upload 组件" size="small">
          <Upload
            beforeUpload={handleAntdUpload}
            showUploadList={false}
            accept="image/*"
            disabled={uploading}
          >
            <Button icon={<UploadOutlined />} loading={uploading}>
              点击上传
            </Button>
          </Upload>
        </Card>

        {/* 示例3：头像上传 */}
        <Card title="示例3：使用头像上传快捷方法" size="small">
          <Upload
            beforeUpload={handleAvatarUpload}
            showUploadList={false}
            accept="image/*"
            disabled={uploading}
          >
            <Button icon={<UploadOutlined />} loading={uploading}>
              上传头像
            </Button>
          </Upload>
        </Card>

        {/* 示例4：Base64 上传 */}
        <Card title="示例4：上传 Base64 图片" size="small">
          <Button
            onClick={handleBase64Upload}
            loading={uploading}
            icon={<UploadOutlined />}
          >
            上传 Base64 示例图片
          </Button>
        </Card>

        {/* 上传结果展示 */}
        {uploadedUrl && (
          <Card
            title="上传结果"
            size="small"
            extra={
              <Button
                danger
                icon={<DeleteOutlined />}
                onClick={handleDelete}
                size="small"
              >
                删除
              </Button>
            }
          >
            <Space direction="vertical" style={{ width: "100%" }}>
              <div>
                <strong>文件 URL：</strong>
                <br />
                <a
                  href={uploadedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline"
                >
                  {uploadedUrl}
                </a>
              </div>
              <div>
                <strong>文件路径：</strong> {uploadedPath}
              </div>
              <div>
                <strong>预览：</strong>
                <br />
                <Image
                  src={uploadedUrl}
                  alt="Uploaded"
                  style={{ maxWidth: 200, marginTop: 8 }}
                />
              </div>
            </Space>
          </Card>
        )}

        {/* 使用说明 */}
        <Card title="使用说明" size="small">
          <ul className="list-disc space-y-2 pl-5">
            <li>所有上传操作都需要用户登录</li>
            <li>支持的文件类型：JPG、PNG、GIF、WebP、SVG</li>
            <li>文件大小限制：5MB</li>
            <li>文件会自动上传到 Supabase Storage</li>
            <li>上传成功后会返回公开访问的 URL</li>
            <li>可以通过文件路径删除已上传的文件</li>
          </ul>
        </Card>

        {/* 代码示例 */}
        <Card title="代码示例" size="small">
          <pre className="overflow-x-auto rounded bg-gray-100 p-4 dark:bg-gray-800">
            <code>{`import { uploadToStorage } from "@/lib/uploadUtils";

// 上传文件
const result = await uploadToStorage(file, {
  bucket: "avatars",
  folder: "examples"
});

console.log(result.url);  // 文件 URL
console.log(result.path); // 文件路径`}</code>
          </pre>
        </Card>
      </Space>
    </div>
  );
}
