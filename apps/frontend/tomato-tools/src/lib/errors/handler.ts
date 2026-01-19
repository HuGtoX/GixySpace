import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { createRequestLogger } from "../logger";

/**
 * 自定义API错误类
 */
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code?: string,
    public details?: any,
  ) {
    super(message);
    this.name = "ApiError";
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 常见错误类型
 * 使用工厂函数创建错误类，减少代码冗余
 */
const createErrorClass = (
  statusCode: number,
  defaultMessage: string,
  code: string,
) => {
  return class extends ApiError {
    constructor(message: string = defaultMessage, details?: any) {
      super(statusCode, message, code, details);
    }
  };
};

export const BadRequestError = createErrorClass(
  400,
  "Bad Request",
  "BAD_REQUEST",
);
export const UnauthorizedError = createErrorClass(
  401,
  "Unauthorized",
  "UNAUTHORIZED",
);
export const ForbiddenError = createErrorClass(403, "Forbidden", "FORBIDDEN");
export const NotFoundError = createErrorClass(404, "Not Found", "NOT_FOUND");
export const ConflictError = createErrorClass(409, "Conflict", "CONFLICT");
export const ValidationError = createErrorClass(
  422,
  "Validation Error",
  "VALIDATION_ERROR",
);
export const TooManyRequestsError = createErrorClass(
  429,
  "Too Many Requests",
  "TOO_MANY_REQUESTS",
);
export const InternalServerError = createErrorClass(
  500,
  "Internal Server Error",
  "INTERNAL_SERVER_ERROR",
);
export const ServiceUnavailableError = createErrorClass(
  503,
  "Service Unavailable",
  "SERVICE_UNAVAILABLE",
);

/**
 * 错误响应接口
 */
export interface ErrorResponse {
  success: false;
  error: string;
  code?: string;
  details?: any;
  timestamp?: string;
  path?: string;
}

/**
 * 格式化错误响应
 */
export function formatErrorResponse(
  error: unknown,
  path?: string,
): ErrorResponse {
  const timestamp = new Date().toISOString();

  // 处理自定义API错误
  if (error instanceof ApiError) {
    return {
      success: false,
      error: error.message,
      code: error.code,
      details: error.details,
      timestamp,
      path,
    };
  }

  // 处理Zod验证错误
  if (error instanceof ZodError) {
    return {
      success: false,
      error: "Validation failed",
      code: "VALIDATION_ERROR",
      details: error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
      timestamp,
      path,
    };
  }

  // 处理标准Error
  if (error instanceof Error) {
    return {
      success: false,
      error: error.message || "Internal Server Error",
      code: "INTERNAL_SERVER_ERROR",
      timestamp,
      path,
    };
  }

  // 处理未知错误
  return {
    success: false,
    error: "An unexpected error occurred",
    code: "UNKNOWN_ERROR",
    timestamp,
    path,
  };
}

/**
 * 统一错误处理函数
 * @param error 错误对象
 * @param correlationId 请求关联ID
 * @param path 请求路径
 * @returns NextResponse
 */
export function handleApiError(
  error: unknown,
  correlationId?: string,
  path?: string,
): NextResponse<ErrorResponse> {
  // 创建日志记录器
  const logger = correlationId
    ? createRequestLogger(correlationId, path || "unknown")
    : console;

  // 记录错误日志
  if (error instanceof ApiError) {
    // 客户端错误（4xx）使用warn级别
    if (error.statusCode >= 400 && error.statusCode < 500) {
      logger.warn(
        {
          error: error.message,
          code: error.code,
          details: error.details,
          statusCode: error.statusCode,
        },
        "Client error occurred",
      );
    } else {
      // 服务器错误（5xx）使用error级别
      logger.error(
        {
          error: error.message,
          code: error.code,
          details: error.details,
          statusCode: error.statusCode,
          stack: error.stack,
        },
        "Server error occurred",
      );
    }

    const errorResponse = formatErrorResponse(error, path);
    return NextResponse.json(errorResponse, {
      status: error.statusCode,
      headers: correlationId
        ? { "x-correlation-id": correlationId }
        : undefined,
    });
  }

  // 处理Zod验证错误
  if (error instanceof ZodError) {
    logger.warn(
      {
        issues: error.issues,
      },
      "Validation error occurred",
    );

    const errorResponse = formatErrorResponse(error, path);
    return NextResponse.json(errorResponse, {
      status: 422,
      headers: correlationId
        ? { "x-correlation-id": correlationId }
        : undefined,
    });
  }

  // 处理其他错误
  logger.error(
    {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    },
    "Unexpected error occurred",
  );

  const errorResponse = formatErrorResponse(error, path);
  return NextResponse.json(errorResponse, {
    status: 500,
    headers: correlationId ? { "x-correlation-id": correlationId } : undefined,
  });
}

/**
 * 异步错误处理包装器
 * 用于包装API路由处理函数，自动捕获和处理错误
 */
export function withErrorHandler<T extends any[], R>(
  handler: (...args: T) => Promise<R>,
  options?: {
    correlationId?: string;
    path?: string;
  },
) {
  return async (...args: T): Promise<R | NextResponse<ErrorResponse>> => {
    try {
      return await handler(...args);
    } catch (error) {
      return handleApiError(error, options?.correlationId, options?.path);
    }
  };
}

/**
 * 成功响应格式化
 */
export interface SuccessResponse<T = any> {
  success: true;
  data: T;
  message?: string;
  timestamp?: string;
}

/**
 * 创建成功响应
 */
export function createSuccessResponse<T>(
  data: T,
  message?: string,
  status: number = 200,
  correlationId?: string,
): NextResponse<SuccessResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      message,
      timestamp: new Date().toISOString(),
    },
    {
      status,
      headers: correlationId
        ? { "x-correlation-id": correlationId }
        : undefined,
    },
  );
}
