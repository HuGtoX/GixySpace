import Image, { ImageProps } from "next/image";
import { useState } from "react";

interface OptimizedImageProps extends Omit<ImageProps, "src"> {
  src: string;
  fallbackSrc?: string;
  showPlaceholder?: boolean;
}

/**
 * 优化的图片组件
 * - 自动使用 Next.js Image 优化
 * - 支持 WebP 格式
 * - 懒加载
 * - 错误处理和降级
 */
export function OptimizedImage({
  src,
  alt,
  fallbackSrc,
  showPlaceholder = true,
  className,
  ...props
}: OptimizedImageProps) {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  // 如果加载失败，使用降级图片
  const imageSrc = error && fallbackSrc ? fallbackSrc : src;

  return (
    <div className={`relative ${className || ""}`}>
      {/* 加载占位符 */}
      {loading && showPlaceholder && (
        <div className="absolute inset-0 animate-pulse bg-gray-200 dark:bg-gray-700" />
      )}

      <Image
        src={imageSrc}
        alt={alt}
        onError={() => setError(true)}
        onLoad={() => setLoading(false)}
        loading="lazy"
        quality={85}
        {...props}
      />
    </div>
  );
}

/**
 * 头像图片组件
 * - 针对头像优化的尺寸
 * - 圆形裁剪
 */
interface AvatarImageProps {
  src: string;
  alt: string;
  size?: number;
  className?: string;
}

export function AvatarImage({
  src,
  alt,
  size = 40,
  className = "",
}: AvatarImageProps) {
  const [error, setError] = useState(false);

  // 尝试使用优化后的 WebP 格式
  const optimizedSrc = src
    .replace("/avatar/", "/avatar-optimized/")
    .replace(/\.(png|jpg|jpeg)$/, ".webp");
  const imageSrc = error ? src : optimizedSrc;

  return (
    <div
      className={`relative overflow-hidden rounded-full ${className}`}
      style={{ width: size, height: size }}
    >
      <Image
        src={imageSrc}
        alt={alt}
        width={size}
        height={size}
        onError={() => setError(true)}
        loading="lazy"
        quality={85}
        className="object-cover"
      />
    </div>
  );
}

/**
 * 新闻图标组件
 * - 针对图标优化的尺寸
 * - 支持 SVG 和位图
 */
interface NewsIconProps {
  src: string;
  alt: string;
  size?: number;
  className?: string;
}

export function NewsIcon({
  src,
  alt,
  size = 24,
  className = "",
}: NewsIconProps) {
  const [error, setError] = useState(false);
  const isSVG = src.endsWith(".svg");

  // 对于非SVG图片，尝试使用优化后的版本
  let imageSrc = src;
  if (!isSVG && !error) {
    imageSrc = src
      .replace("/news-icon/", "/news-icon-optimized/")
      .replace(/\.(png|jpg|jpeg)$/, ".webp");
  }

  return (
    <div
      className={`relative ${className}`}
      style={{ width: size, height: size }}
    >
      <Image
        src={error ? src : imageSrc}
        alt={alt}
        width={size}
        height={size}
        onError={() => setError(true)}
        loading="lazy"
        quality={90}
        className="object-contain"
      />
    </div>
  );
}
