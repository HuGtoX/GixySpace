# 临时用户功能实现清单

## ✅ 已完成的实现

### 1. 数据库层 (Database Layer)

- [x] 更新 `user` 表 schema，添加匿名用户字段
  - `is_anonymous`: 标识匿名用户
  - `anonymous_created_at`: 创建时间
  - `expires_at`: 过期时间
- [x] 创建数据库迁移文件 `0005_add_anonymous_user_fields.sql`

**文件位置：**

- `src/lib/drizzle/schema/schema.ts`
- `src/lib/drizzle/migrations/0005_add_anonymous_user_fields.sql`

### 2. 服务层 (Service Layer)

- [x] 创建 `AnonymousService` 服务类

  - `createAnonymousUser()`: 创建匿名用户
  - `convertToRegularUser()`: 转换为正式用户
  - `isAnonymousUser()`: 检查匿名状态
  - `cleanupExpiredAnonymousUsers()`: 清理过期用户

- [x] 更新 `AuthService` 服务类

  - `getCurrentUserOrAnonymous()`: 获取当前用户或自动创建匿名用户
  - 集成 `AnonymousService` 实现自动匿名登录

- [x] 更新 `UserService` 服务类
  - `isAnonymousUser()`: 检查用户是否为匿名用户
  - `getUserWithProfile()`: 获取用户完整信息（包括配置）

**文件位置：**

- `src/modules/auth/anonymous.service.ts`
- `src/modules/auth/auth.service.ts`
- `src/modules/user/user.service.ts`

### 3. API 层 (API Layer)

- [x] 创建匿名用户 API: `POST /api/auth/anonymous`
- [x] 转换用户 API: `POST /api/auth/convert`
- [x] 更新 `/api/auth/me` 接口
  - 返回 `isAnonymous` 字段
  - **自动匿名登录**：当获取用户失败时，自动调用 `getCurrentUserOrAnonymous()` 创建匿名用户

**文件位置：**

- `src/app/api/auth/anonymous/route.ts`
- `src/app/api/auth/convert/route.ts`
- `src/app/api/auth/me/route.ts`

### 4. 中间件 (Middleware)

- [x] 更新 middleware，添加匿名用户路径配置
  - 添加 `regularUserOnlyPaths` 和 `regularUserOnlyApiPaths`
  - 将匿名相关 API 添加到公开路径

**文件位置：**

- `middleware.ts`

### 5. 前端上下文 (Frontend Context)

- [x] 更新 `AuthContext`
  - 添加 `isAnonymous` 字段到 `AuthUser` 接口
  - 添加 `createAnonymousUser()` 方法
  - 添加 `convertToRegularUser()` 方法
  - **自动匿名登录**：`fetchUser()` 方法在获取用户失败时自动创建匿名用户
  - 添加 `autoCreateAnonymous` 参数避免无限循环

**文件位置：**

- `src/contexts/AuthContext.tsx`

### 6. UI 组件 (UI Components)

- [x] `AnonymousLoginButton`: 立即体验按钮
- [x] `AnonymousUserBanner`: 临时账号提示横幅
- [x] `ConvertUserModal`: 转换用户模态框

**文件位置：**

- `src/components/auth/AnonymousLoginButton.tsx`
- `src/components/auth/AnonymousUserBanner.tsx`
- `src/components/auth/ConvertUserModal.tsx`

### 7. 文档 (Documentation)

- [x] 创建完整的功能文档 `anonymous-user.md`
- [x] 创建实现清单 `ANONYMOUS_USER_IMPLEMENTATION.md`
- [x] 创建自动匿名登录文档 `AUTO_ANONYMOUS_LOGIN.md`

**文件位置：**

- `docs/anonymous-user.md`
- `docs/ANONYMOUS_USER_IMPLEMENTATION.md`
- `docs/AUTO_ANONYMOUS_LOGIN.md`

### 8. 测试脚本 (Test Scripts)

- [x] 创建自动匿名登录测试脚本

**文件位置：**

- `scripts/test-auto-anonymous-login.js`

---

## 🎯 自动匿名登录功能

### 核心特性

- ✅ **自动触发**：用户信息获取失败时自动创建匿名账号
- ✅ **无感体验**：用户无需手动操作，系统自动处理
- ✅ **数据安全**：匿名用户数据完全隔离
- ✅ **可恢复性**：支持后续转换为正式用户
- ✅ **完整日志**：所有操作都有详细的日志记录

### 工作流程

1. 用户访问应用 → 调用 `/api/auth/me`
2. 系统尝试获取当前用户
3. 如果获取失败 → 自动调用 `getCurrentUserOrAnonymous()`
4. 创建匿名用户并返回用户信息
5. 用户可以立即使用基础功能

### 详细文档

请查看 [AUTO_ANONYMOUS_LOGIN.md](./AUTO_ANONYMOUS_LOGIN.md) 了解完整的实现细节和使用方法。

---

## 📋 待完成的集成步骤

### 1. 数据库迁移

```bash
# 执行数据库迁移
cd apps/frontend/tomato-tools
pnpm db:migrate
```

### 2. Supabase 配置

在 Supabase Dashboard 中启用匿名登录：

1. 进入 Authentication > Settings
2. 找到 "Anonymous sign-ins" 选项
3. 启用该功能

### 3. 测试自动匿名登录

```bash
# 运行测试脚本
node scripts/test-auto-anonymous-login.js
```

### 3. 首页集成

在首页添加"立即体验"按钮：

```tsx
// src/app/page.tsx 或相应的首页组件
import AnonymousLoginButton from "@/components/auth/AnonymousLoginButton";

export default function HomePage() {
  return (
    <div>
      {/* 其他内容 */}
      <AnonymousLoginButton size="large" />
    </div>
  );
}
```

### 4. Dashboard 集成

在 Dashboard 添加临时账号提示：

```tsx
// src/app/dashboard/page.tsx
import AnonymousUserBanner from "@/components/auth/AnonymousUserBanner";

export default function DashboardPage() {
  return (
    <div>
      <AnonymousUserBanner />
      {/* 其他内容 */}
    </div>
  );
}
```

### 5. 权限控制（可选）

在需要限制匿名用户的功能中添加检查：

```typescript
// 示例：在某个 API 中
import { authorization } from "@/app/api/authorization";
import { UserService } from "@/modules/user/user.service";

export async function POST(request: NextRequest) {
  const authUser = await authorization();
  const userService = new UserService();
  const user = await userService.getUserById(authUser.id);

  if (user?.isAnonymous) {
    return NextResponse.json(
      { error: "此功能仅对正式用户开放，请先转为正式账号" },
      { status: 403 },
    );
  }

  // 继续处理...
}
```

### 6. 定时清理任务（推荐）

设置定时任务清理过期的匿名用户：

**选项 A：使用 Supabase Edge Functions**

```typescript
// supabase/functions/cleanup-anonymous-users/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { AnonymousService } from "./anonymous.service.ts";

serve(async (req) => {
  const anonymousService = new AnonymousService();
  const result = await anonymousService.cleanupExpiredAnonymousUsers();

  return new Response(
    JSON.stringify({
      success: true,
      deletedCount: result.deletedCount,
    }),
    { headers: { "Content-Type": "application/json" } },
  );
});
```

**选项 B：使用 Vercel Cron Jobs**

```typescript
// src/app/api/cron/cleanup-anonymous/route.ts
import { NextRequest, NextResponse } from "next/server";
import { AnonymousService } from "@/modules/auth/anonymous.service";

export async function GET(request: NextRequest) {
  // 验证 cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const anonymousService = new AnonymousService();
  const result = await anonymousService.cleanupExpiredAnonymousUsers();

  return NextResponse.json({
    success: true,
    deletedCount: result.deletedCount,
  });
}
```

然后在 `vercel.json` 中配置：

```json
{
  "crons": [
    {
      "path": "/api/cron/cleanup-anonymous",
      "schedule": "0 0 * * *"
    }
  ]
}
```

---

## 🧪 测试步骤

### 1. 测试创建匿名用户

```bash
curl -X POST http://localhost:3000/api/auth/anonymous \
  -H "Content-Type: application/json"
```

### 2. 测试转换用户

```bash
curl -X POST http://localhost:3000/api/auth/convert \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "fullName": "测试用户"
  }'
```

### 3. 前端测试流程

1. 访问首页，点击"立即体验"
2. 验证是否成功创建匿名用户并跳转到 Dashboard
3. 检查是否显示临时账号提示横幅
4. 点击"转为正式账号"，填写信息
5. 验证转换是否成功

---

## 📊 功能特性

### ✨ 核心功能

- ✅ 无需注册即可体验
- ✅ 数据完全隔离
- ✅ 平滑转换为正式用户
- ✅ 自动过期清理
- ✅ 完整的用户体验流程

### 🔒 安全特性

- ✅ 基于 Supabase Auth
- ✅ 独立的用户 ID
- ✅ 数据库级别隔离
- ✅ 邮箱验证机制
- ✅ 过期时间控制

### 🎨 用户体验

- ✅ 一键创建临时账号
- ✅ 友好的提示信息
- ✅ 简单的转换流程
- ✅ 数据无缝迁移

---

## 🔧 配置说明

### 环境变量

确保以下环境变量已配置：

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# 站点 URL
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Cron Secret (如果使用 Vercel Cron)
CRON_SECRET=your-secret-key
```

---

## 📈 后续优化建议

1. **使用统计**

   - 记录匿名用户创建数量
   - 统计转换率
   - 分析用户行为

2. **功能限制**

   - 对匿名用户进行 API 限流
   - 限制某些高级功能
   - 设置数据存储上限

3. **用户引导**

   - 添加新手引导
   - 突出转换的好处
   - 提供数据导出功能

4. **社交登录**
   - 支持 Google 登录
   - 支持 GitHub 登录
   - 快速转换流程

---

## 📞 问题排查

### 常见问题

1. **匿名登录失败**

   - 检查 Supabase 是否启用匿名登录
   - 验证环境变量配置

2. **转换失败**

   - 检查邮箱格式
   - 验证密码长度
   - 查看服务器日志

3. **数据未保留**
   - 确认用户 ID 一致
   - 检查数据库外键关系

---

## ✅ 完成检查清单

- [ ] 执行数据库迁移
- [ ] 在 Supabase 启用匿名登录
- [ ] 在首页添加"立即体验"按钮
- [ ] 在 Dashboard 添加提示横幅
- [ ] 测试创建匿名用户流程
- [ ] 测试转换用户流程
- [ ] 配置定时清理任务（可选）
- [ ] 添加使用统计（可选）
- [ ] 更新用户协议说明

---

## 📚 相关文档

- [Supabase 匿名登录文档](https://supabase.com/docs/guides/auth/auth-anonymous)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Drizzle ORM 文档](https://orm.drizzle.team/)

---

**实现完成日期**: 2025-11-11

**版本**: v1.0.0
