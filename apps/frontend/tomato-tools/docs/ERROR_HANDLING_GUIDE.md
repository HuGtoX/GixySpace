# 错误处理系统使用指南

## 概述

本项目实现了统一的错误处理系统，提供了一致的错误响应格式和便捷的错误处理工具。

## 核心功能

### 1. 自定义错误类

项目提供了多种预定义的错误类，覆盖常见的HTTP错误场景：

```typescript
import {
  BadRequestError, // 400 错误请求
  UnauthorizedError, // 401 未授权
  ForbiddenError, // 403 禁止访问
  NotFoundError, // 404 未找到
  ConflictError, // 409 冲突
  ValidationError, // 422 验证错误
  TooManyRequestsError, // 429 请求过多
  InternalServerError, // 500 服务器内部错误
  ServiceUnavailableError, // 503 服务不可用
} from "@/lib/error-handler";
```

### 2. 统一错误处理函数

#### handleApiError

自动处理各种类型的错误并返回标准格式的响应：

```typescript
import { handleApiError } from "@/lib/error-handler";

export async function GET(request: Request) {
  try {
    // 你的业务逻辑
    const data = await fetchData();
    return createSuccessResponse(data);
  } catch (error) {
    return handleApiError(error, correlationId, "/api/your-path");
  }
}
```

#### createSuccessResponse

创建标准格式的成功响应：

```typescript
import { createSuccessResponse } from "@/lib/error-handler";

// 基本用法
return createSuccessResponse(data);

// 带消息
return createSuccessResponse(data, "操作成功");

// 自定义状态码
return createSuccessResponse(data, "创建成功", 201);

// 带关联ID
return createSuccessResponse(data, "操作成功", 200, correlationId);
```

## 响应格式

### 成功响应

```typescript
{
  success: true,
  data: any,           // 实际数据
  message?: string,    // 可选的消息
  timestamp: string    // ISO 8601 格式的时间戳
}
```

### 错误响应

```typescript
{
  success: false,
  error: string,       // 错误消息
  code?: string,       // 错误代码
  details?: any,       // 详细错误信息
  timestamp: string,   // ISO 8601 格式的时间戳
  path?: string        // 请求路径
}
```

## 使用示例

### 示例 1: 基本API路由

```typescript
import {
  handleApiError,
  createSuccessResponse,
  NotFoundError,
} from "@/lib/error-handler";

export async function GET(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const item = await db.findById(params.id);

    if (!item) {
      throw new NotFoundError("Item not found");
    }

    return createSuccessResponse(item);
  } catch (error) {
    return handleApiError(error, undefined, `/api/items/${params.id}`);
  }
}
```

### 示例 2: 带验证的POST请求

```typescript
import { z } from "zod";
import {
  handleApiError,
  createSuccessResponse,
  ValidationError,
} from "@/lib/error-handler";

const createItemSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Zod验证会自动被handleApiError处理
    const validatedData = createItemSchema.parse(body);

    const item = await db.create(validatedData);

    return createSuccessResponse(item, "Item created successfully", 201);
  } catch (error) {
    return handleApiError(error, undefined, "/api/items");
  }
}
```

### 示例 3: 带日志的错误处理

```typescript
import {
  handleApiError,
  createSuccessResponse,
  InternalServerError,
} from "@/lib/error-handler";
import { createRequestLogger, generateCorrelationId } from "@/lib/logger";

export async function POST(request: Request) {
  const correlationId =
    request.headers.get("x-correlation-id") || generateCorrelationId();
  const logger = createRequestLogger(correlationId, "api/items");

  try {
    logger.info("Creating new item");

    const data = await request.json();
    const item = await db.create(data);

    logger.info({ itemId: item.id }, "Item created successfully");

    return createSuccessResponse(item, "Item created", 201, correlationId);
  } catch (error) {
    // handleApiError会自动记录错误日志
    return handleApiError(error, correlationId, "/api/items");
  }
}
```

### 示例 4: 自定义错误

```typescript
import { ApiError, handleApiError } from "@/lib/error-handler";

export async function GET(request: Request) {
  try {
    const result = await externalApiCall();

    if (result.status === "rate_limited") {
      throw new ApiError(
        429,
        "API rate limit exceeded",
        "RATE_LIMIT_EXCEEDED",
        { retryAfter: result.retryAfter },
      );
    }

    return createSuccessResponse(result.data);
  } catch (error) {
    return handleApiError(error);
  }
}
```

### 示例 5: 异步错误处理包装器

```typescript
import { withErrorHandler } from "@/lib/error-handler";

// 包装整个处理函数
export const GET = withErrorHandler(
  async (request: Request) => {
    const data = await fetchData();
    return createSuccessResponse(data);
  },
  { path: "/api/data" },
);
```

## 错误类型处理

### 1. Zod验证错误

Zod验证错误会自动被识别并格式化：

```typescript
// 输入
const schema = z.object({
  email: z.string().email(),
  age: z.number().min(18)
});

schema.parse({ email: "invalid", age: 15 });

// 输出
{
  success: false,
  error: "Validation failed",
  code: "VALIDATION_ERROR",
  details: [
    { path: "email", message: "Invalid email" },
    { path: "age", message: "Number must be greater than or equal to 18" }
  ],
  timestamp: "2025-01-11T03:12:07.000Z"
}
```

### 2. 自定义API错误

```typescript
throw new BadRequestError("Invalid input", { field: "email" });

// 输出
{
  success: false,
  error: "Invalid input",
  code: "BAD_REQUEST",
  details: { field: "email" },
  timestamp: "2025-01-11T03:12:07.000Z"
}
```

### 3. 标准Error

```typescript
throw new Error("Something went wrong");

// 输出
{
  success: false,
  error: "Something went wrong",
  code: "INTERNAL_SERVER_ERROR",
  timestamp: "2025-01-11T03:12:07.000Z"
}
```

## 最佳实践

### 1. 始终使用try-catch

```typescript
export async function GET(request: Request) {
  try {
    // 业务逻辑
  } catch (error) {
    return handleApiError(error);
  }
}
```

### 2. 使用合适的错误类型

```typescript
// ✅ 好的做法
if (!user) {
  throw new NotFoundError("User not found");
}

if (!hasPermission) {
  throw new ForbiddenError("Access denied");
}

// ❌ 不好的做法
if (!user) {
  throw new Error("User not found");
}
```

### 3. 提供详细的错误信息

```typescript
// ✅ 好的做法
throw new ValidationError("Invalid input", {
  fields: ["email", "password"],
  reason: "Required fields missing",
});

// ❌ 不好的做法
throw new ValidationError("Invalid");
```

### 4. 使用关联ID追踪请求

```typescript
const correlationId =
  request.headers.get("x-correlation-id") || generateCorrelationId();

// 在整个请求处理过程中使用相同的correlationId
return handleApiError(error, correlationId, path);
```

### 5. 不要暴露敏感信息

```typescript
// ✅ 好的做法
throw new InternalServerError("Database operation failed");

// ❌ 不好的做法
throw new InternalServerError(`Database error: ${dbError.message}`);
```

## 迁移指南

### 从旧代码迁移

**之前：**

```typescript
export async function GET() {
  try {
    const data = await fetchData();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch data" },
      { status: 500 },
    );
  }
}
```

**之后：**

```typescript
import { handleApiError, createSuccessResponse } from "@/lib/error-handler";

export async function GET() {
  try {
    const data = await fetchData();
    return createSuccessResponse(data);
  } catch (error) {
    return handleApiError(error, undefined, "/api/data");
  }
}
```

## 类型定义

所有相关的TypeScript类型定义已统一到 `@/types/index.ts`：

```typescript
import type {
  ApiResponse,
  ApiErrorResponse,
  ApiSuccessResponse,
} from "@/types";
```

## 相关文档

- [类型定义规范](./typescript-types-best-practices.md)
- [日志系统使用指南](./LOGGER_USAGE.md)
- [API开发规范](./api-authorization.md)
