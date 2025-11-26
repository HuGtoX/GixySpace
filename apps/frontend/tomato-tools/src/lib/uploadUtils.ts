import axios from "@/lib/axios";
import type {
  StorageApiUploadResponse,
  StorageApiDeleteResponse,
} from "@/types/api";

/**
 * 上传文件到Supabase Storage
 * @param file 要上传的文件
 * @param options 上传选项
 * @returns 上传结果，包含文件URL和路径
 */
export async function uploadToStorage(
  file: File,
  options?: {
    bucket?: string;
    folder?: string;
    fileName?: string;
  },
): Promise<StorageApiUploadResponse> {
  const formData = new FormData();
  formData.append("file", file);

  if (options?.bucket) {
    formData.append("bucket", options.bucket);
  }

  if (options?.folder) {
    formData.append("folder", options.folder);
  }

  if (options?.fileName) {
    formData.append("fileName", options.fileName);
  }

  const response = await axios.post<StorageApiUploadResponse>(
    "/api/upload",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );

  return response;
}

/**
 * 从Supabase Storage删除文件
 * @param path 文件路径
 * @param bucket 存储桶名称（可选，默认为avatars）
 * @returns 删除结果
 */
export async function deleteFromStorage(
  path: string,
  bucket?: string,
): Promise<StorageApiDeleteResponse> {
  const response = await axios.delete<StorageApiDeleteResponse>("/api/upload", {
    data: {
      path,
      bucket: bucket || "avatars",
    },
  });

  return response.data;
}

/**
 * 上传头像到Supabase Storage
 * 这是一个便捷方法，专门用于上传用户头像
 * @param file 头像文件
 * @param userId 用户ID（可选，用于自定义文件名）
 * @returns 上传结果
 */
export async function uploadAvatar(
  file: File,
  userId?: string,
): Promise<StorageApiUploadResponse> {
  return uploadToStorage(file, {
    bucket: "avatars",
    folder: "users",
    fileName: userId
      ? `${userId}_${Date.now()}.${file.name.split(".").pop()}`
      : undefined,
  });
}

/**
 * 将Base64图片上传到Supabase Storage
 * @param base64Data Base64编码的图片数据
 * @param fileName 文件名
 * @param options 上传选项
 * @returns 上传结果
 */
export async function uploadBase64ToStorage(
  base64Data: string,
  fileName: string,
  options?: {
    bucket?: string;
    folder?: string;
  },
): Promise<StorageApiUploadResponse> {
  // 将Base64转换为Blob
  const base64WithoutPrefix = base64Data.replace(
    /^data:image\/\w+;base64,/,
    "",
  );
  const binaryString = atob(base64WithoutPrefix);
  const bytes = new Uint8Array(binaryString.length);

  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  // 检测MIME类型
  const mimeType =
    base64Data.match(/^data:(image\/\w+);base64,/)?.[1] || "image/png";
  const blob = new Blob([bytes], { type: mimeType });
  const file = new File([blob], fileName, { type: mimeType });

  return uploadToStorage(file, options);
}
