# 临时用户功能文档

## 功能概述

临时用户功能允许用户无需注册即可体验应用的核心功能。临时用户的数据会保存在数据库中，并可以随时转换为正式用户以永久保存数据。

## 技术实现

### 1. 数据库设计

在 `user` 表中添加了以下字段：

- `is_anonymous`: 标识是否为匿名用户（默认 false）
- `anonymous_created_at`: 匿名用户创建时间
- `expires_at`: 匿名用户过期时间（默认30天后）

### 2. 核心服务

#### AnonymousService (`src/modules/auth/anonymous.service.ts`)

提供以下方法：

- `createAnonymousUser()`: 创建匿名用户
- `convertToRegularUser()`: 将匿名用户转换为正式用户
- `isAnonymousUser()`: 检查用户是否为匿名用户
- `cleanupExpiredAnonymousUsers()`: 清理过期的匿名用户（定时任务）

### 3. API 端点

#### POST /api/auth/anonymous

创建匿名用户

**响应示例：**

```json
{
  "user": {
    "id": "uuid",
    "isAnonymous": true
  }
}
```

#### POST /api/auth/convert

将匿名用户转换为正式用户

**请求参数：**

```json
{
  "email": "user@example.com",
  "password": "password123",
  "fullName": "张三" // 可选
}
```

**响应示例：**

```json
{
  "success": true,
  "message": "转换成功，请查收邮箱验证邮件"
}
```

### 4. 前端组件

#### AnonymousLoginButton

用于首页的"立即体验"按钮，点击后创建匿名用户并跳转到 dashboard。

**使用示例：**

```tsx
import AnonymousLoginButton from "@/components/auth/AnonymousLoginButton";

<AnonymousLoginButton size="large" />;
```

#### AnonymousUserBanner

显示在页面顶部的提示横幅，提醒用户转为正式账号。

**使用示例：**

```tsx
import AnonymousUserBanner from "@/components/auth/AnonymousUserBanner";

<AnonymousUserBanner />;
```

#### ConvertUserModal

转换用户的模态框，包含邮箱、密码、姓名输入。

## 使用流程

### 用户体验流程

```mermaid
graph TD
    A[访问首页] --> B{是否登录?}
    B -->|否| C[显示"立即体验"按钮]
    B -->|是| D[显示用户信息]
    C --> E[点击创建匿名用户]
    E --> F[跳转到Dashboard]
    F --> G[显示临时账号提示]
    G --> H{想要保留数据?}
    H -->|是| I[点击转为正式账号]
    H -->|否| J[继续使用]
    I --> K[填写邮箱密码]
    K --> L[转换成功]
    L --> M[发送验证邮件]
    J --> N[30天后自动清理]
```

### 开发集成步骤

1. **在首页添加"立即体验"按钮**

```tsx
import AnonymousLoginButton from "@/components/auth/AnonymousLoginButton";

export default function HomePage() {
  return (
    <div>
      <h1>欢迎使用番茄工具箱</h1>
      <AnonymousLoginButton />
    </div>
  );
}
```

2. **在 Dashboard 添加提示横幅**

```tsx
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

3. **运行数据库迁移**

```bash
# 执行迁移文件
pnpm db:migrate
```

## 数据库迁移

迁移文件位于：`src/lib/drizzle/migrations/0005_add_anonymous_user_fields.sql`

```sql
-- 添加匿名用户相关字段
ALTER TABLE "user"
ADD COLUMN "is_anonymous" BOOLEAN DEFAULT FALSE NOT NULL,
ADD COLUMN "anonymous_created_at" TIMESTAMP WITH TIME ZONE,
ADD COLUMN "expires_at" TIMESTAMP WITH TIME ZONE;

-- 为匿名用户创建索引
CREATE INDEX IF NOT EXISTS "idx_user_anonymous" ON "user"("is_anonymous", "expires_at");
```

## 安全考虑

1. **数据隔离**：每个匿名用户有独立的 Supabase Auth ID，数据完全隔离
2. **过期清理**：建议设置定时任务清理过期的匿名用户数据
3. **转换验证**：转换为正式用户时需要邮箱验证
4. **权限控制**：某些敏感功能可以限制仅对正式用户开放

## 权限控制示例

在需要限制匿名用户访问的 API 中：

```typescript
import { authorization } from "@/app/api/authorization";
import { UserService } from "@/modules/user/user.service";

export async function POST(request: NextRequest) {
  const authUser = await authorization();
  const userService = new UserService();
  const user = await userService.getUserById(authUser.id);

  // 检查是否为匿名用户
  if (user?.isAnonymous) {
    return NextResponse.json(
      { error: "此功能仅对正式用户开放" },
      { status: 403 },
    );
  }

  // 继续处理...
}
```

## 定时清理任务

建议使用 Supabase Edge Functions 或 Cron Job 定期清理过期的匿名用户：

```typescript
// 示例：每天凌晨执行清理
import { AnonymousService } from "@/modules/auth/anonymous.service";

export async function cleanupExpiredUsers() {
  const anonymousService = new AnonymousService();
  const result = await anonymousService.cleanupExpiredAnonymousUsers();
  console.log(`Cleaned up ${result.deletedCount} expired anonymous users`);
}
```

## 注意事项

1. 确保 Supabase 项目已启用匿名登录功能
2. 匿名用户的邮箱格式为 `anonymous_{user_id}@temp.local`
3. 转换为正式用户后，原有数据会保留
4. 建议在用户协议中说明临时账号的数据保留政策

## 后续优化建议

1. **限流控制**：对匿名用户的 API 调用进行限流
2. **功能限制**：某些高级功能仅对正式用户开放
3. **数据导出**：允许匿名用户导出数据
4. **社交登录**：支持通过 Google/GitHub 等快速转正
5. **使用统计**：记录匿名用户的使用情况和转化率
