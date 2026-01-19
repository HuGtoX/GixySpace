import { NextRequest, NextResponse } from "next/server";
import { authorization } from "@/lib/api/authorization";
import { createClient } from "@/lib/clients/supabase/server";
import { createRequestLogger, generateCorrelationId } from "@/lib/logger";
import { z } from "zod";

// 定义上传文件的schema
const uploadFileSchema = z.object({
  bucket: z.string().default("avatars"), // 默认存储�?
  folder: z.string().optional(), // 可选的文件夹路�?
  fileName: z.string().optional(), // 可选的自定义文件名
});

// 支持的文件类�?
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
];

// 最大文件大�?(5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024;

/**
 * POST /api/upload
 * 上传文件到Supabase Storage
 *
 * 请求体：FormData
 * - file: File (必需)
 * - bucket: string (可选，默认�?"avatars")
 * - folder: string (可选，文件夹路�?
 * - fileName: string (可选，自定义文件名)
 *
 * 响应�?
 * - success: { url: string, path: string, message: string }
 * - error: { error: string, details?: any }
 */
export async function POST(request: NextRequest) {
  const correlationId =
    request.headers.get("x-correlation-id") || generateCorrelationId();
  const logger = createRequestLogger(correlationId, "upload");

  logger.info("File upload request received");

  try {
    // 验证用户身份
    const user = await authorization();

    if (!user) {
      logger.warn("Unauthorized access attempt");
      return NextResponse.json({ error: "未授权访�? }, { status: 401 });
    }

    // 解析 FormData
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const bucket = (formData.get("bucket") as string) || "avatars";
    const folder = formData.get("folder") as string | null;
    const customFileName = formData.get("fileName") as string | null;

    // 验证文件是否存在
    if (!file) {
      logger.warn("No file provided");
      return NextResponse.json(
        { error: "请提供要上传的文�? },
        { status: 400 },
      );
    }

    // 验证文件类型
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      logger.warn({ fileType: file.type }, "Invalid file type");
      return NextResponse.json(
        {
          error: "不支持的文件类型",
          details: `仅支�? ${ALLOWED_MIME_TYPES.join(", ")}`,
        },
        { status: 400 },
      );
    }

    // 验证文件大小
    if (file.size > MAX_FILE_SIZE) {
      logger.warn({ fileSize: file.size }, "File too large");
      return NextResponse.json(
        {
          error: "文件过大",
          details: `文件大小不能超过 ${MAX_FILE_SIZE / 1024 / 1024}MB`,
        },
        { status: 400 },
      );
    }

    // 生成文件�?
    const fileExt = file.name.split(".").pop();
    const fileName = customFileName || `${user.id}_${Date.now()}.${fileExt}`;

    // 构建文件路径
    const filePath = folder ? `${folder}/${fileName}` : fileName;

    logger.info(
      {
        userId: user.id,
        fileName,
        fileSize: file.size,
        fileType: file.type,
        bucket,
        filePath,
      },
      "Uploading file to Supabase Storage",
    );

    // 创建 Supabase 客户�?
    const supabase = await createClient();

    // 将文件转换为 ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    console.log("-- [ customFileName ] --", customFileName);
    console.log("-- [ filePath ] --", filePath);

    // 上传文件�?Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false, // 不覆盖已存在的文�?
      });

    if (error) {
      logger.error({ error }, "Failed to upload file to Supabase Storage");
      return NextResponse.json(
        {
          error: "文件上传失败",
          details: error.message,
        },
        { status: 500 },
      );
    }

    // 获取公共访问URL
    const {
      data: { publicUrl },
    } = supabase.storage.from(bucket).getPublicUrl(data.path);

    logger.info(
      {
        userId: user.id,
        filePath: data.path,
        publicUrl,
      },
      "File uploaded successfully",
    );

    return NextResponse.json(
      {
        message: "文件上传成功",
        url: publicUrl,
        path: data.path,
      },
      {
        status: 200,
        headers: {
          "x-correlation-id": correlationId,
        },
      },
    );
  } catch (error: any) {
    logger.error({ error }, "Upload file error");
    return NextResponse.json(
      { error: error.message || "上传失败" },
      {
        status: 500,
        headers: {
          "x-correlation-id": correlationId,
        },
      },
    );
  }
}

/**
 * DELETE /api/upload
 * 从Supabase Storage删除文件
 *
 * 请求体：JSON
 * - path: string (必需，文件路�?
 * - bucket: string (可选，默认�?"avatars")
 *
 * 响应�?
 * - success: { message: string }
 * - error: { error: string, details?: any }
 */
export async function DELETE(request: NextRequest) {
  const correlationId =
    request.headers.get("x-correlation-id") || generateCorrelationId();
  const logger = createRequestLogger(correlationId, "upload/delete");

  logger.info("Delete file request received");

  try {
    // 验证用户身份
    const user = await authorization();

    if (!user) {
      logger.warn("Unauthorized access attempt");
      return NextResponse.json({ error: "未授权访�? }, { status: 401 });
    }

    // 解析请求�?
    const body = await request.json();
    const { path, bucket = "avatars" } = body;

    // 验证路径是否存在
    if (!path) {
      logger.warn("No file path provided");
      return NextResponse.json(
        { error: "请提供要删除的文件路�? },
        { status: 400 },
      );
    }

    logger.info(
      {
        userId: user.id,
        path,
        bucket,
      },
      "Deleting file from Supabase Storage",
    );

    // 创建 Supabase 客户�?
    const supabase = await createClient();

    // �?Supabase Storage 删除文件
    const { error } = await supabase.storage.from(bucket).remove([path]);

    if (error) {
      logger.error({ error }, "Failed to delete file from Supabase Storage");
      return NextResponse.json(
        {
          error: "文件删除失败",
          details: error.message,
        },
        { status: 500 },
      );
    }

    logger.info(
      {
        userId: user.id,
        path,
      },
      "File deleted successfully",
    );

    return NextResponse.json(
      {
        message: "文件删除成功",
      },
      {
        status: 200,
        headers: {
          "x-correlation-id": correlationId,
        },
      },
    );
  } catch (error: any) {
    logger.error({ error }, "Delete file error");
    return NextResponse.json(
      { error: error.message || "删除失败" },
      {
        status: 500,
        headers: {
          "x-correlation-id": correlationId,
        },
      },
    );
  }
}
