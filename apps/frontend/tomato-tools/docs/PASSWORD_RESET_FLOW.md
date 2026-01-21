# 密码重置流程文档

## 概述

本文档说明番茄工具箱项目中密码重置功能的完整流程，特别是Auth Callback在安全认证中的关键作用。

## 安全架构

密码重置流程采用了Supabase的标准认证流程，通过Auth Callback中转来确保安全性：

```
用户请求重置 → 发送邮件 → 用户点击链接 → Auth Callback → 交换Session → 重置密码页面
```

## 完整流程

### 1. 用户请求重置密码

**文件**: `ResetPasswordForm.tsx`

用户在重置密码页面输入邮箱，前端调用API：

```typescript
const response = await fetch("/api/auth/reset-password", {
  method: "POST",
  body: JSON.stringify({
    email,
    redirectUrl: location.origin,
  }),
});
```

### 2. 后端发送重置邮件

**文件**: `app/api/auth/reset-password/route.ts` (POST方法)

API接收请求后，调用AuthService发送邮件：

```typescript
const result = await authService.sendPasswordResetEmail({
  email,
  redirectUrl,
});
```

**文件**: `modules/auth/auth.service.ts` (sendPasswordResetEmail方法)

关键配置：`redirectTo` 指向 Auth Callback，并通过 `next` 参数指定最终目标页面：

```typescript
const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
  redirectTo: `${data.redirectUrl}/auth/callback?next=/auth/reset-password`,
});
```

### 3. 用户点击邮件链接

用户收到的邮件包含类似以下的链接（Supabase自动生成）：

```
https://yourdomain.com/auth/callback?code=xxx&type=recovery&next=/auth/reset-password
```

其中：

- `code`: Supabase生成的一次性验证码
- `type`: Supabase自动添加的认证类型标识（`recovery` 表示密码重置）
- `next`: 完成认证后的跳转目标

### 4. Auth Callback处理（关键环节）

**文件**: `app/auth/callback/route.ts`

这是整个流程中最关键的安全环节：

```typescript
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";
  const type = searchParams.get("type"); // Supabase自动添加的认证类型

  if (code) {
    const supabase = await createClient();

    // 关键步骤：将code交换为有效的session
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // 识别密码重置场景
      const isPasswordReset =
        next.includes("/auth/reset-password") || type === "recovery";

      if (isPasswordReset) {
        logger.info("Password reset code exchange successful");
      }

      // 构建重定向URL，保留type参数
      let redirectUrl = next;
      if (type && isPasswordReset) {
        const separator = next.includes("?") ? "&" : "?";
        redirectUrl = `${next}${separator}type=${type}`;
      }

      // 重定向到重置密码页面，此时浏览器已有有效session
      return NextResponse.redirect(`${origin}${redirectUrl}`);
    }
  }
}
```

**Auth Callback的作用**：

1. **安全验证**: 验证邮件中的code是否有效
2. **Session交换**: 将一次性code转换为浏览器端的认证Cookie/Session
3. **参数传递**: 保留Supabase的`type=recovery`参数，传递给重置密码页面
4. **状态建立**: 确保后续请求可以识别用户身份
5. **防止重放**: code使用后即失效，防止重复使用

### 5. 用户设置新密码

**文件**: `ResetPasswordForm.tsx`

用户到达重置密码页面时，通过检查URL参数判断是否为更新模式：

```typescript
React.useEffect(() => {
  const type = searchParams.get("type");
  if (type === "recovery") {
    setIsUpdateMode(true);
  }
}, [searchParams]);
```

用户输入新密码后，调用API：

```typescript
const response = await fetch("/api/auth/reset-password", {
  method: "PUT",
  body: JSON.stringify({
    newPassword: values.newPassword,
  }),
});
```

**注意**: 不再需要传递token/code，因为session已经建立。

### 6. 后端更新密码

**文件**: `app/api/auth/reset-password/route.ts` (PUT方法)

```typescript
const result = await authService.updatePasswordWithSession({
  newPassword,
});
```

**文件**: `modules/auth/auth.service.ts` (updatePasswordWithSession方法)

使用当前session验证用户并更新密码：

```typescript
async updatePasswordWithSession(data: {
  newPassword: string;
}): Promise<{ error: string | null }> {
  const supabase = await createClient();

  // 验证当前用户是否已登录
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: "未找到已认证的用户，请重新点击邮件中的重置链接" };
  }

  // 使用当前session更新密码
  const { error } = await supabase.auth.updateUser({
    password: data.newPassword,
  });

  return { error: error?.message || null };
}
```

## 安全特性

### 1. 一次性验证码

- 邮件中的code只能使用一次
- 使用后立即失效，防止重放攻击

### 2. Session验证

- 密码更新时验证session而非code
- 确保请求来自已认证的用户

### 3. 时效性

- code有时间限制（通常1小时）
- 过期后需要重新请求

### 4. 安全传输

- code通过HTTPS传输
- Session存储在HttpOnly Cookie中

## 错误处理

### Code无效或过期

- 用户被重定向到 `/auth/auth-code-error`
- 提示用户重新请求重置邮件

### Session不存在

- 返回错误："未找到已认证的用户，请重新点击邮件中的重置链接"
- 用户需要重新点击邮件链接

### 网络错误

- 前端显示友好的错误提示
- 后端记录详细日志便于排查

## 相关文件

### 前端组件

- `src/components/auth/ResetPasswordForm.tsx` - 重置密码表单

### API路由

- `src/app/api/auth/reset-password/route.ts` - 密码重置API
- `src/app/auth/callback/route.ts` - Auth Callback处理

### 服务层

- `src/modules/auth/auth.service.ts` - 认证服务

## 测试流程

1. 访问重置密码页面，输入邮箱
2. 检查邮箱，点击重置链接
3. 验证是否正确跳转到callback
4. 验证是否成功跳转到重置密码页面
5. 输入新密码并提交
6. 验证密码是否更新成功
7. 使用新密码登录验证

## 注意事项

1. **环境变量**: 确保 `NEXT_PUBLIC_SITE_URL` 配置正确
2. **Supabase配置**: 在Supabase Dashboard中配置正确的重定向URL
3. **HTTPS**: 生产环境必须使用HTTPS
4. **日志记录**: 所有关键步骤都有日志记录，便于排查问题

## 更新历史

- **2026-01-21**: 添加Auth Callback中转环节，增强安全性
  - 修改邮件redirectTo指向callback
  - 增强callback识别密码重置场景
  - 移除前端直接使用code的逻辑
  - 添加updatePasswordWithSession方法
