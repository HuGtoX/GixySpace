"use client";

import React, { useState, useEffect } from "react";
import { Modal, Tabs, Button, message, Space } from "antd";
import {
  UploadOutlined,
  CameraOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import SystemAvatarGrid, { SYSTEM_AVATARS } from "./SystemAvatarGrid";
import ImageCropper from "./ImageCropper";
import FileUploader, { AcceptMap } from "@/components/ui/FileUploader";
import { uploadBase64ToStorage } from "@/lib/utils/upload";
import { useAuth } from "@/contexts/AuthContext";

interface AvatarUploadModalProps {
  open: boolean;
  currentAvatar?: string;
  onCancel: () => void;
  onConfirm: (avatarUrl: string, isSystemAvatar: boolean) => void;
}

type TabKey = "system" | "upload";

export default function AvatarUploadModal({
  open,
  currentAvatar,
  onCancel,
  onConfirm,
}: AvatarUploadModalProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("system");
  const [selectedSystemAvatar, setSelectedSystemAvatar] = useState<
    string | null
  >(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [croppedImage, setCroppedImage] = useState<string | null>(null);
  const [isCropping, setIsCropping] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingToStorage, setIsUploadingToStorage] = useState(false);
  const { user } = useAuth();

  // 当Modal打开时，检查当前头像是否为系统头像
  useEffect(() => {
    if (open && currentAvatar) {
      // 检查当前头像是否在系统头像列表中
      const isSystemAvatar = SYSTEM_AVATARS.includes(currentAvatar);
      if (isSystemAvatar) {
        setSelectedSystemAvatar(currentAvatar);
      } else {
        setSelectedSystemAvatar(null);
      }
    }
  }, [open, currentAvatar]);

  // 重置状态
  const resetState = () => {
    setActiveTab("system");
    setSelectedSystemAvatar(null);
    setUploadedImage(null);
    setCroppedImage(null);
    setIsCropping(false);
    setIsUploading(false);
  };

  // 处理取消
  const handleCancel = () => {
    resetState();
    onCancel();
  };

  // 处理确认
  const handleConfirm = async () => {
    if (activeTab === "system" && selectedSystemAvatar) {
      onConfirm(selectedSystemAvatar, true);
      resetState();
    } else if (activeTab === "upload" && croppedImage) {
      // 将裁剪后的base64图片上传到Supabase Storage
      setIsUploadingToStorage(true);
      try {
        const fileName = `avatar_${Date.now()}.png`;
        const result = await uploadBase64ToStorage(croppedImage, fileName, {
          bucket: "avatar",
          folder: "users",
        });

        if (!result.url) {
          throw new Error("上传失败，未返回URL");
        }

        message.success("头像上传成功！");
        onConfirm(result.url, false);
        resetState();
      } catch (error: any) {
        console.error("上传头像失败:", error);
        message.error("上传头像失败：" + (error.message || "未知错误"));
      } finally {
        setIsUploadingToStorage(false);
      }
    } else {
      message.warning("请选择或上传头像");
    }
  };

  // 处理文件上传成功
  const handleUploadSuccess = (files: any[]) => {
    if (files.length > 0) {
      const file = files[0];
      setUploadedImage(file.preview);
      setIsCropping(true);
      setIsUploading(false);
    }
  };

  // 处理文件上传错误
  const handleUploadError = (error: string) => {
    message.error(error);
    setIsUploading(false);
  };

  // 上传前的钩子
  const beforeUpload = async (files: File[]) => {
    setIsUploading(true);
    return true;
  };

  // 处理裁剪完成
  const handleCropComplete = (croppedImageUrl: string) => {
    setCroppedImage(croppedImageUrl);
    setIsCropping(false);
  };

  // 处理取消裁剪
  const handleCropCancel = () => {
    setUploadedImage(null);
    setIsCropping(false);
    setIsUploading(false);
  };

  // 重新裁剪
  const handleRecrop = () => {
    if (uploadedImage) {
      setIsCropping(true);
    }
  };

  const tabItems = [
    {
      key: "system",
      label: (
        <span className="flex items-center gap-2">
          <CameraOutlined />
          系统头像
        </span>
      ),
      children: (
        <div className="h-[500px] overflow-y-auto">
          <SystemAvatarGrid
            selectedAvatar={selectedSystemAvatar}
            onSelect={setSelectedSystemAvatar}
          />
        </div>
      ),
    },
    {
      key: "upload",
      label: (
        <span className="flex items-center gap-2">
          <UploadOutlined />
          自定义上传
        </span>
      ),
      children: (
        <div className="flex h-[500px] flex-col">
          {!uploadedImage && !croppedImage ? (
            // 上传区域 - 使用 FileUploader 组件
            <div className="flex flex-1 items-center justify-center p-4">
              <div className="w-full">
                <FileUploader
                  accept={[
                    AcceptMap.jpeg,
                    AcceptMap.png,
                    AcceptMap.gif,
                    AcceptMap.webp,
                  ]}
                  maxSizeMobile={5}
                  maxSizeDesktop={5}
                  uploadText="点击或拖拽图片到此区域上传"
                  acceptText="支持 JPG、PNG、GIF、WebP 格式"
                  disabled={isUploading}
                  multiple={false}
                  maxFiles={1}
                  beforeUpload={beforeUpload}
                  onUploadSuccess={handleUploadSuccess}
                  onUploadError={handleUploadError}
                  loadingText="正在加载图片..."
                  showPrivacyAlert={false}
                  errorMessages={{
                    invalidType: "请选择图片文件",
                    overSize: "图片大小不能超过5MB",
                    maxFiles: "只能上传一张图片",
                  }}
                  draggerStyle={{
                    background: "transparent",
                  }}
                />
              </div>
            </div>
          ) : isCropping && uploadedImage ? (
            // 裁剪界面
            <div className="flex-1">
              <ImageCropper
                image={uploadedImage}
                onCropComplete={handleCropComplete}
                onCancel={handleCropCancel}
              />
            </div>
          ) : croppedImage ? (
            // 预览裁剪结果
            <div className="flex flex-1 flex-col items-center justify-center p-8">
              <div className="mb-6">
                <div className="h-40 w-40 overflow-hidden rounded-full border-4 border-orange-500 dark:border-dark-primary">
                  <img
                    src={croppedImage}
                    alt="Cropped avatar"
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
              <Space>
                <Button onClick={handleRecrop}>重新裁剪</Button>
                <Button
                  type="primary"
                  onClick={() => {
                    setCroppedImage(null);
                    setUploadedImage(null);
                    setIsUploading(false);
                  }}
                >
                  重新上传
                </Button>
              </Space>
            </div>
          ) : null}
        </div>
      ),
    },
  ];

  // 判断是否可以确认
  const canConfirm =
    (activeTab === "system" && selectedSystemAvatar) ||
    (activeTab === "upload" && croppedImage);

  return (
    <Modal
      title="更换头像"
      open={open}
      onCancel={handleCancel}
      width={700}
      footer={
        isCropping ? null : (
          <Space>
            <Button onClick={handleCancel} disabled={isUploadingToStorage}>
              取消
            </Button>
            <Button
              type="primary"
              onClick={handleConfirm}
              disabled={!canConfirm || isUploadingToStorage}
              loading={isUploadingToStorage}
              icon={isUploadingToStorage ? <LoadingOutlined /> : null}
            >
              {isUploadingToStorage ? "上传中..." : "确认"}
            </Button>
          </Space>
        )
      }
      destroyOnClose
    >
      <Tabs
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key as TabKey)}
        items={tabItems}
      />
    </Modal>
  );
}
