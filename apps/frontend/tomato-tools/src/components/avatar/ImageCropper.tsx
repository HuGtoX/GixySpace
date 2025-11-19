"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { Button, Slider, Space } from "antd";
import { ZoomInOutlined, ZoomOutOutlined } from "@ant-design/icons";

interface ImageCropperProps {
  image: string;
  onCropComplete: (croppedImage: string) => void;
  onCancel: () => void;
}

interface Point {
  x: number;
  y: number;
}

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export default function ImageCropper({
  image,
  onCropComplete,
  onCancel,
}: ImageCropperProps) {
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState<Point>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<Point>({ x: 0, y: 0 });
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 加载图片并计算初始尺寸
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setImageSize({ width: img.width, height: img.height });

      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        const containerHeight = containerRef.current.clientHeight;
        setContainerSize({ width: containerWidth, height: containerHeight });

        // 计算初始缩放以适应容器
        const scale =
          Math.min(containerWidth / img.width, containerHeight / img.height) *
          0.8;
        setZoom(scale);
      }
    };
    img.src = image;
  }, [image]);

  // 处理鼠标按下
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      });
    },
    [position],
  );

  // 处理鼠标移动
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging) return;

      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;

      setPosition({ x: newX, y: newY });
    },
    [isDragging, dragStart],
  );

  // 处理鼠标释放
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // 处理触摸事件
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      const touch = e.touches[0];
      setIsDragging(true);
      setDragStart({
        x: touch.clientX - position.x,
        y: touch.clientY - position.y,
      });
    },
    [position],
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isDragging) return;

      const touch = e.touches[0];
      const newX = touch.clientX - dragStart.x;
      const newY = touch.clientY - dragStart.y;

      setPosition({ x: newX, y: newY });
    },
    [isDragging, dragStart],
  );

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // 生成裁剪后的图片
  const getCroppedImage = useCallback(async () => {
    if (!imageRef.current || !canvasRef.current || !containerRef.current)
      return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 设置画布大小为圆形裁剪区域的大小
    const cropSize = Math.min(containerSize.width, containerSize.height) * 0.8;
    canvas.width = cropSize;
    canvas.height = cropSize;

    // 计算容器中心点（裁剪区域的中心）
    const centerX = containerSize.width / 2;
    const centerY = containerSize.height / 2;

    // 图片中心在容器中的位置（考虑用户的拖动偏移）
    // 图片通过 translate(-50%, -50%) 居中，然后加上用户拖动的偏移
    const imageCenterX = centerX + position.x;
    const imageCenterY = centerY + position.y;

    // 裁剪区域中心相对于图片中心的偏移（容器坐标系，已缩放）
    const offsetX = centerX - imageCenterX;
    const offsetY = centerY - imageCenterY;

    // 转换到原始图片坐标系
    // 1. 偏移量除以缩放比例得到原始图片坐标系中的偏移
    // 2. 从图片中心开始计算裁剪区域的位置
    const sourceX = imageSize.width / 2 + offsetX / zoom - cropSize / zoom / 2;
    const sourceY = imageSize.height / 2 + offsetY / zoom - cropSize / zoom / 2;
    const sourceSize = cropSize / zoom;

    // 创建圆形裁剪路径
    ctx.beginPath();
    ctx.arc(cropSize / 2, cropSize / 2, cropSize / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    // 绘制图片
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(
        img,
        sourceX,
        sourceY,
        sourceSize,
        sourceSize,
        0,
        0,
        cropSize,
        cropSize,
      );

      // 转换为base64
      const croppedImage = canvas.toDataURL("image/png");
      onCropComplete(croppedImage);
    };
    img.src = image;
  }, [image, zoom, position, imageSize, containerSize, onCropComplete]);

  return (
    <div className="flex h-full min-h-[400px] flex-col">
      {/* 裁剪区域 */}
      <div
        ref={containerRef}
        className="relative flex-1 cursor-move overflow-hidden bg-gray-900"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* 图片 */}
        <img
          ref={imageRef}
          src={image}
          alt="Crop"
          className="pointer-events-none absolute select-none"
          style={{
            left: "50%",
            top: "50%",
            transform: `translate(-50%, -50%) translate(${position.x}px, ${position.y}px) scale(${zoom})`,
            transformOrigin: "center center",
            maxWidth: "none",
            maxHeight: "none",
          }}
          draggable={false}
        />

        {/* 圆形裁剪遮罩 */}
        <div className="pointer-events-none absolute inset-0">
          <svg width="100%" height="100%">
            <defs>
              <mask id="crop-mask">
                <rect width="100%" height="100%" fill="white" />
                <circle
                  cx="50%"
                  cy="50%"
                  r={`${Math.min(containerSize.width, containerSize.height) * 0.4}px`}
                  fill="black"
                />
              </mask>
            </defs>
            <rect
              width="100%"
              height="100%"
              fill="rgba(0, 0, 0, 0.5)"
              mask="url(#crop-mask)"
            />
            <circle
              cx="50%"
              cy="50%"
              r={`${Math.min(containerSize.width, containerSize.height) * 0.4}px`}
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeDasharray="5,5"
            />
          </svg>
        </div>
      </div>

      {/* 控制栏 */}
      <div className="border-t border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <div className="mb-4">
          <div className="flex items-center gap-2">
            <ZoomOutOutlined className="text-gray-500" />
            <Slider
              min={0.1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={setZoom}
              className="flex-1"
            />
            <ZoomInOutlined className="text-gray-500" />
          </div>
        </div>

        <Space className="w-full justify-end">
          <Button onClick={onCancel}>取消</Button>
          <Button type="primary" onClick={getCroppedImage}>
            确认裁剪
          </Button>
        </Space>
      </div>

      {/* 隐藏的canvas用于生成裁剪后的图片 */}
      <canvas ref={canvasRef} style={{ display: "none" }} />
    </div>
  );
}
