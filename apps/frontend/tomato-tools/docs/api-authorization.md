# API 权限验证工具

本文档介绍如何在 API 路由中使用封装的权限验证函数。

## 可用函数

### 1. `authorization()`

验证用户是否已登录（Supabase 认证）。

**返回值**: Supabase 认证用户对象

**抛出异常**: 如果用户未登录，抛出 "未授权访问" 错误

**使用场景**: 需要验证用户登录状态的 API

```typescript
import { authorization } from "@/app/api/authorization";

export async function GET(request: NextRequest) {
  try {
    const authUser = await authorization();
    // authUser 包含 Supabase 认证信息（id, email 等）

    // 继续处理业务逻辑...
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "未授权访问" },
      { status: 401 },
    );
  }
}
```

### 2. `requireAdmin()`

验证用户是否为管理员（包含登录验证 + 数据库角色验证）。

**返回值**: 完整的用户对象（包含数据库中的所有用户信息）

**抛出异常**:

- "未授权访问" - 用户未登录
- "用户不存在" - 数据库中找不到该用户
- "权限不足，只有管理员才能执行此操作" - 用户不是管理员

**使用场景**: 需要管理员权限的 API（如创建、更新、删除敏感数据）

```typescript
import { requireAdmin } from "@/app/api/authorization";

export async function POST(request: NextRequest) {
  try {
    // 一行代码完成所有权限验证
    const user = await requireAdmin();
    // user 包含完整的用户信息（id, email, role, username 等）

    // 继续处理业务逻辑...
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "权限验证失败";

    // 根据错误类型返回不同的状态码
    const status =
      errorMessage === "未授权访问"
        ? 401
        : errorMessage === "用户不存在"
          ? 404
          : 403;

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status },
    );
  }
}
```

## 完整示例

### 示例 1: 创建通知（需要管理员权限）

```typescript
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/app/api/authorization";
import { NotificationService } from "@/lib/services/notification";

export async function POST(request: NextRequest) {
  try {
    // 验证管理员权限
    await requireAdmin();

    // 解析请求体
    const body = await request.json();

    // 创建通知
    const notification = await NotificationService.createNotification(body);

    return NextResponse.json({
      success: true,
      data: notification,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "创建通知失败";
    const status = errorMessage.includes("权限")
      ? 403
      : errorMessage === "未授权访问"
        ? 401
        : 500;

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status },
    );
  }
}
```

### 示例 2: 获取用户信息（只需登录）

```typescript
import { NextRequest, NextResponse } from "next/server";
import { authorization } from "@/app/api/authorization";
import { UserService } from "@/modules/user/user.service";

export async function GET(request: NextRequest) {
  try {
    // 只验证登录状态
    const authUser = await authorization();

    // 获取用户详细信息
    const userService = new UserService();
    const user = await userService.getUserById(authUser.id);

    return NextResponse.json({
      success: true,
      data: user,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "未授权访问" },
      { status: 401 },
    );
  }
}
```

## 权限验证流程

### `authorization()` 流程

```
1. 调用 AuthService.getCurrentUser()
2. 检查 Supabase 认证状态
3. 返回认证用户对象 或 抛出异常
```

### `requireAdmin()` 流程

```
1. 调用 authorization() 验证登录状态
   ↓
2. 使用 UserService.getUserById() 查询数据库
   ↓
3. 检查用户是否存在
   ↓
4. 检查用户角色是否为 "admin"
   ↓
5. 返回完整用户对象 或 抛出异常
```

## 注意事项

1. **错误处理**: 两个函数都会抛出异常，需要使用 try-catch 捕获
2. **返回值差异**:
   - `authorization()` 返回 Supabase 认证用户（字段较少）
   - `requireAdmin()` 返回数据库完整用户信息（字段更多）
3. **性能考虑**: `requireAdmin()` 会额外查询数据库，比 `authorization()` 稍慢
4. **角色定义**: 用户角色定义在数据库 schema 中：`["user", "admin", "anonymous"]`

## 扩展建议

如果需要其他角色验证，可以参考 `requireAdmin()` 创建类似函数：

```typescript
/**
 * 验证用户权限（可指定角色）
 */
export async function requireRole(allowedRoles: string[]) {
  const authUser = await authorization();
  const userService = new UserService();
  const user = await userService.getUserById(authUser.id);

  if (!user) {
    throw new Error("用户不存在");
  }

  if (!allowedRoles.includes(user.role)) {
    throw new Error(`权限不足，需要以下角色之一: ${allowedRoles.join(", ")}`);
  }

  return user;
}

// 使用示例
await requireRole(["admin", "moderator"]);
```
