import {
  ConversionSettings,
  ImageFormat,
} from "@/app/(tools)/image/transform/types";

// 支持的图片格式
export const SUPPORTED_FORMATS: ImageFormat[] = [
  "jpg",
  "jpeg",
  "png",
  "webp",
  "svg",
];

// 获取MIME类型
export const getMimeType = (format: ImageFormat): string => {
  const mimeTypes: Record<ImageFormat, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    svg: "image/svg+xml",
  };
  return mimeTypes[format];
};

// 检测图片格式
export const detectImageFormat = (file: File): ImageFormat => {
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (extension && SUPPORTED_FORMATS.includes(extension as ImageFormat)) {
    return extension as ImageFormat;
  }
  // 根据MIME类型检测
  if (file.type.includes("jpeg")) return "jpg";
  if (file.type.includes("png")) return "png";
  if (file.type.includes("webp")) return "webp";
  if (file.type.includes("svg")) return "svg";
  return "jpg"; // 默认格式
};

// 创建图片预览URL
export const createPreviewUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// 格式转换函数
export const convertImage = async (
  file: File,
  settings: ConversionSettings,
): Promise<{
  blob: Blob;
  preview: string;
  format: ImageFormat;
  size: number;
}> => {
  return new Promise((resolve, reject) => {
    try {
      const { format, quality, removeBackground } = settings;

      // 创建一个canvas元素进行图像处理
      const img = new Image();
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        throw new Error("无法创建Canvas上下文");
      }

      img.onload = async () => {
        // 设置canvas尺寸
        canvas.width = img.width;
        canvas.height = img.height;

        // 绘制图像
        ctx.drawImage(img, 0, 0);

        // 处理背景移除（仅对PNG格式）
        if (removeBackground && format === "png") {
          // 这里简单示范背景移除的逻辑
          // 实际项目可能需要更复杂的算法或库
          // 这里只是简单地将白色背景变为透明
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;

          for (let i = 0; i < data.length; i += 4) {
            // 如果像素接近白色，设置为透明
            if (data[i] > 240 && data[i + 1] > 240 && data[i + 2] > 240) {
              data[i + 3] = 0; // 设置透明度为0
            }
          }

          ctx.putImageData(imageData, 0, 0);
        }

        // 转换为目标格式
        const mimeType = getMimeType(format);

        // 对于JPEG和WEBP格式，可以设置质量
        let blob: Blob;
        if (format === "jpg" || format === "jpeg" || format === "webp") {
          blob = await new Promise<Blob>((resolve) =>
            canvas.toBlob((b) => resolve(b!), mimeType, quality / 100),
          );
        } else {
          blob = await new Promise<Blob>((resolve) =>
            canvas.toBlob((b) => resolve(b!), mimeType),
          );
        }

        // 创建预览URL
        const preview = URL.createObjectURL(blob);

        resolve({
          blob,
          preview,
          format,
          size: blob.size,
        });
      };

      img.onerror = () => {
        reject(new Error("图像加载失败"));
      };

      // 创建预览URL
      createPreviewUrl(file)
        .then((previewUrl) => {
          img.src = previewUrl;
        })
        .catch(reject);
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * 将图片转换为SVG格式
 * @param file - 图片文件
 * @param settings - SVG转换设置
 * @returns 转换结果
 */
export async function convertImageToSVG(
  file: File,
  settings: {
    precision: number;
    colorMode: "auto" | "color" | "grayscale" | "monochrome";
    removeBackground: boolean;
    simplifyPaths: boolean;
  },
): Promise<{
  preview: string;
  blob: Blob;
  format: "svg";
  size: number;
}> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    img.onload = async () => {
      try {
        // 设置canvas尺寸
        canvas.width = img.width;
        canvas.height = img.height;

        // 绘制图片到canvas
        ctx!.drawImage(img, 0, 0);

        // 获取图片数据
        const imageData = ctx!.getImageData(0, 0, canvas.width, canvas.height);

        // 创建SVG
        const svg = createSVGFromImageData(imageData, settings);

        // 将SVG转换为Blob
        const svgBlob = new Blob([svg], { type: "image/svg+xml" });

        // 创建预览URL
        const previewUrl = URL.createObjectURL(svgBlob);

        resolve({
          preview: previewUrl,
          blob: svgBlob,
          format: "svg",
          size: svgBlob.size,
        });
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error("图片加载失败"));
    };

    img.src = URL.createObjectURL(file);
  });
}

/**
 * 从ImageData创建SVG
 */
function createSVGFromImageData(
  imageData: ImageData,
  settings: {
    precision: number;
    colorMode: "auto" | "color" | "grayscale" | "monochrome";
    removeBackground: boolean;
    simplifyPaths: boolean;
  },
): string {
  const { width, height, data } = imageData;

  // 简化的SVG创建逻辑
  // 在实际应用中，这里应该使用更复杂的矢量化算法
  // 这里提供一个基础的实现

  let svgContent = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`;

  // 根据颜色模式处理
  switch (settings.colorMode) {
    case "monochrome":
      svgContent += createMonochromeSVG(data, width, height, settings);
      break;
    case "grayscale":
      svgContent += createGrayscaleSVG(data, width, height, settings);
      break;
    case "color":
    case "auto":
    default:
      svgContent += createColorSVG(data, width, height, settings);
      break;
  }

  svgContent += "</svg>";

  return svgContent;
}

/**
 * 创建彩色SVG
 */
function createColorSVG(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  settings: { precision: number; simplifyPaths: boolean },
): string {
  // 简化的彩色SVG创建
  // 实际应用中应使用Potrace或类似算法
  const step = Math.max(1, 11 - settings.precision);
  let content = "";

  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      const index = (y * width + x) * 4;
      const r = data[index];
      const g = data[index + 1];
      const b = data[index + 2];
      const a = data[index + 3];

      if (a > 128) {
        // 忽略透明像素
        const size = step;
        content += `<rect x="${x}" y="${y}" width="${size}" height="${size}" fill="rgb(${r},${g},${b})" />`;
      }
    }
  }

  return content;
}

/**
 * 创建灰度SVG
 */
function createGrayscaleSVG(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  settings: { precision: number; simplifyPaths: boolean },
): string {
  const step = Math.max(1, 11 - settings.precision);
  let content = "";

  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      const index = (y * width + x) * 4;
      const r = data[index];
      const g = data[index + 1];
      const b = data[index + 2];
      const a = data[index + 3];

      if (a > 128) {
        const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
        const size = step;
        content += `<rect x="${x}" y="${y}" width="${size}" height="${size}" fill="rgb(${gray},${gray},${gray})" />`;
      }
    }
  }

  return content;
}

/**
 * 创建单色SVG
 */
function createMonochromeSVG(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  settings: { precision: number; simplifyPaths: boolean },
): string {
  const step = Math.max(1, 11 - settings.precision);
  let content = "";

  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      const index = (y * width + x) * 4;
      const r = data[index];
      const g = data[index + 1];
      const b = data[index + 2];
      const a = data[index + 3];

      if (a > 128) {
        const brightness = (r + g + b) / 3;
        if (brightness > 128) {
          const size = step;
          content += `<rect x="${x}" y="${y}" width="${size}" height="${size}" fill="black" />`;
        }
      }
    }
  }

  return content;
}

// 获取推荐格式
export const getRecommendedFormat = (
  currentFormat: ImageFormat,
): ImageFormat => {
  // 根据当前格式推荐最佳转换格式
  const recommendations: Record<ImageFormat, ImageFormat> = {
    jpg: "webp",
    jpeg: "webp",
    png: "webp",
    webp: "png",
    svg: "png",
  };
  return recommendations[currentFormat] || "webp";
};

// 保存图片
export const saveImage = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// 检查文件大小限制
export const checkFileSizeLimit = (file: File, size: number): boolean => {
  const maxSize = size * 1024 * 1024; // 20MB for mobile, 50MB for desktop
  return file.size <= maxSize;
};

// 格式化文件大小
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};
