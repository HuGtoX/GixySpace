/**
 * API相关类型定义
 * 统一管理所有API请求和响应的类型定义
 *
 * 注意：基础类型（如ApiResponse、PaginationParams等）已移至 @/types/index.ts
 * 此文件仅包含特定API的请求和响应类型
 */

import type { ApiResponse } from "./index";

// 分页响应（扩展基础ApiResponse）
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// 用户认证相关API类型
export interface AuthApiLoginRequest {
  email: string;
  password: string;
}

export interface AuthApiRegisterRequest {
  email: string;
  password: string;
  name?: string;
}

export interface AuthApiUserDto {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthApiAuthResponse extends ApiResponse {
  user?: AuthApiUserDto;
  token?: string;
}

// 文件上传相关API类型
export interface FileApiUploadRequest {
  file: File;
  category?: string;
}

export interface FileApiFileDto {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  createdAt: string;
}

export interface FileApiUploadResponse extends ApiResponse {
  file?: FileApiFileDto;
}

// Supabase Storage上传相关API类型
export interface StorageApiUploadRequest {
  file: File;
  bucket?: string;
  folder?: string;
  fileName?: string;
}

export interface StorageApiUploadResponse extends ApiResponse {
  url?: string;
  path?: string;
}

export interface StorageApiDeleteRequest {
  path: string;
  bucket?: string;
}

export interface StorageApiDeleteResponse extends ApiResponse {
  message?: string;
}
