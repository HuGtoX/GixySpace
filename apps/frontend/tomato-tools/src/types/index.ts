/**
 * 通用类型定义文件
 * 包含项目中常用的类型接口
 */

/**
 * 分页响应接口
 * @template T 数据类型
 */
export interface PaginationResponse<T> {
  /** 数据列表 */
  data: T[];
  /** 分页信息 */
  pagination: {
    /** 当前页码 */
    page: number;
    /** 每页数量 */
    limit: number;
    /** 总记录数 */
    total: number;
    /** 总页数 */
    pages: number;
  };
}

/**
 * 分页请求参数
 */
export interface PaginationParams {
  /** 页码，从1开始 */
  page?: number;
  /** 每页数量 */
  limit?: number;
}

/**
 * 基础实体接口
 */
export interface BaseEntity {
  /** 唯一标识 */
  id: string;
  /** 创建时间 */
  createdAt: Date;
  /** 更新时间 */
  updatedAt: Date;
}

/**
 * 带软删除的基础实体接口
 */
export interface BaseEntityWithSoftDelete extends BaseEntity {
  /** 删除时间 */
  deletedAt?: Date | null;
}

/**
 * API响应基础接口
 */
export interface ApiResponse<T = any> {
  /** 是否成功 */
  success: boolean;
  /** 数据 */
  data?: T;
  /** 错误信息 */
  error?: string;
  /** 错误代码 */
  code?: number;
}

/**
 * 列表查询参数
 */
export interface ListQueryParams extends PaginationParams {
  /** 搜索关键词 */
  search?: string;
  /** 排序字段 */
  sortBy?: string;
  /** 排序方向 */
  sortOrder?: "asc" | "desc";
  /** 筛选条件 */
  filters?: Record<string, any>;
}

/**
 * 选择项接口
 */
export interface SelectOption {
  /** 值 */
  value: string | number;
  /** 显示文本 */
  label: string;
  /** 是否禁用 */
  disabled?: boolean;
}

/**
 * 键值对接口
 */
export interface KeyValuePair<K = string, V = any> {
  key: K;
  value: V;
}

/**
 * 文件信息接口
 */
export interface FileInfo {
  /** 文件名 */
  name: string;
  /** 文件大小（字节） */
  size: number;
  /** 文件类型 */
  type: string;
  /** 文件URL */
  url: string;
  /** 上传时间 */
  uploadedAt: Date;
}

/**
 * 用户基础信息接口
 */
export interface UserBasicInfo {
  /** 用户ID */
  id: string;
  /** 用户名 */
  username: string;
  /** 邮箱 */
  email: string;
  /** 头像URL */
  avatar?: string;
  /** 显示名称 */
  displayName?: string;
}

/**
 * 操作结果接口
 */
export interface OperationResult {
  /** 是否成功 */
  success: boolean;
  /** 消息 */
  message: string;
  /** 数据 */
  data?: any;
}

/**
 * AI总结响应接口
 */
export interface AISummaryResponse {
  /** 是否成功 */
  success: boolean;
  /** AI生成的总结内容 */
  summary: string;
  /** 提示词（仅开发环境） */
  prompt?: string;
  /** 错误信息 */
  error?: string;
}

/**
 * 待办任务总结请求参数
 */
export interface TodoSummaryRequest {
  /** 时间段类型 */
  period: 'day' | 'week' | 'month' | 'all';
  /** 待办任务列表 */
  todos: any[];
  /** 用户名称 */
  userName?: string;
  /** 已完成任务数量 */
  completedCount?: number;
}
