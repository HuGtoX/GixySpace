/**
 * API相关类型定义
 * 统一管理所有API请求和响应的类型定义
 */

// 基础API响应类型
export interface BaseApiResponse {
  success: boolean;
  error?: string;
  message?: string;
}

// 通用API错误响应
export interface ApiErrorResponse {
  error: string;
}

// 分页参数
export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

// 分页响应
export interface PaginatedResponse<T> extends BaseApiResponse {
  data: T[];
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

export interface AuthApiAuthResponse extends BaseApiResponse {
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

export interface FileApiUploadResponse extends BaseApiResponse {
  file?: FileApiFileDto;
}
