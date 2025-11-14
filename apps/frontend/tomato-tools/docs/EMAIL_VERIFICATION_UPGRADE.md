# 邮箱验证码绑定升级功能实现文档

## 📝 功能概述

本次重构实现了基于邮箱验证码的匿名用户升级功能，用户可以通过验证邮箱后设置密码来升级为正式用户，整个过程更加安全和友好。

## ✨ 主要变更

### 1. Header组件调整

**文件**: `src/components/toolsLayout/Header.tsx`

**变更内容**:

- 移除了 `UpgradeUserModal` 组件的导入和使用
- 将"升级为正式用户"按钮改为跳转到登录页面（带 `mode=upgrade` 参数）
- 简化了升级流程，统一在登录页面处理

### 2. 新增API接口

#### 2.1 发送验证码接口

**端点**: `POST /api/auth/send-verification-code`

**文件**: `src/app/api/auth/send-verification-code/route.ts`

**功能**:

- 发送6位数字验证码到用户邮箱
- 验证码有效期5分钟
- 限制1分钟内只能发送一次
- 使用EmailService发送邮件

**请求参数**:

```typescript
{
  email: string; // 邮箱地址
}
```

**响应**:

```typescript
{
  success: boolean;
  message: string;
}
```

#### 2.2 验证验证码接口

**端点**: `POST /api/auth/verify-code`

**文件**: `src/app/api/auth/verify-code/route.ts`

**功能**:

- 验证邮箱验证码是否正确
- 检查验证码是否过期
- 验证成功后删除验证码记录

**请求参数**:

```typescript
{
  email: string; // 邮箱地址
  code: string; // 6位验证码
}
```

#### 2.3 绑定邮箱升级接口

**端点**: `POST /api/auth/bind-email`

**文件**: `src/app/api/auth/bind-email/route.ts`

**功能**:

- 验证当前用户是否为匿名用户
- 验证邮箱验证码
- 将匿名用户转换为正式用户
- 保留原有数据（用户ID不变）

**请求参数**:

```typescript
{
  email: string;      // 邮箱地址
  code: string;       // 6位验证码
  password: string;   // 密码（至少6个字符）
  fullName?: string;  // 姓名（可选）
}
```

**响应**:

```typescript
{
  success: boolean;
  message: string;
  note: string; // "您的所有数据已自动保留"
}
```

### 3. 数据库Schema更新

**文件**: `src/lib/drizzle/schema/schema.ts`

**新增表**: `email_verification`

```typescript
export const emailVerification = pgTable("email_verification", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull(),
  code: text("code").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
```

**字段说明**:

- `id`: 主键UUID
- `email`: 邮箱地址
- `code`: 6位验证码
- `expiresAt`: 过期时间（5分钟后）
- `createdAt`: 创建时间

### 4. 登录页面重构

**文件**: `src/app/auth/login/LoginForm.tsx`

**核心功能**:

#### 4.1 智能识别用户类型

```typescript
// 根据URL参数判断是否为升级模式
const isUpgradeMode = searchParams.get("mode") === "upgrade";

// 根据用户状态显示不同界面
if (user?.isAnonymous) {
  // 显示升级界面（Tab切换）
} else {
  // 显示普通登录界面
}
```

#### 4.2 Tab切换功能

**绑定邮箱升级Tab**:

- 邮箱输入
- 验证码输入（带发送按钮和倒计时）
- 密码设置
- 确认密码
- 姓名（可选）

**登录已有账号Tab**:

- 邮箱输入
- 密码输入
- 提示：登录后将保留临时数据

#### 4.3 验证码发送功能

```typescript
const handleSendCode = async () => {
  // 1. 验证邮箱格式
  // 2. 调用发送验证码API
  // 3. 启动60秒倒计时
  // 4. 显示成功提示
};
```

**特性**:

- 60秒倒计时防止频繁发送
- 实时显示剩余秒数
- 邮箱格式验证

#### 4.4 绑定邮箱升级流程

```typescript
const handleBindEmail = async (values) => {
  // 1. 调用bindEmailUpgrade方法
  // 2. 验证码自动验证
  // 3. 绑定邮箱和密码
  // 4. 升级为正式用户
  // 5. 跳转到首页
};
```

### 5. AuthContext更新

**文件**: `src/contexts/AuthContext.tsx`

**新增方法**: `bindEmailUpgrade`

```typescript
const bindEmailUpgrade = async (
  email: string,
  code: string,
  password: string,
  fullName?: string,
) => {
  const response = await fetch("/api/auth/bind-email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, code, password, fullName }),
    credentials: "include",
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Bind email failed");
  }

  // 重新获取用户信息
  await fetchUser(false);
};
```

## 🎯 用户流程

### 匿名用户升级流程

```
1. 匿名用户点击头像菜单中的"升级为正式用户"
   ↓
2. 跳转到登录页面（/auth/login?mode=upgrade）
   ↓
3. 自动显示"绑定邮箱升级"Tab
   ↓
4. 输入邮箱地址
   ↓
5. 点击"发送验证码"按钮
   ↓
6. 收到邮件，查看6位验证码
   ↓
7. 输入验证码
   ↓
8. 设置密码（至少6个字符）
   ↓
9. 确认密码
   ↓
10. 输入姓名（可选）
   ↓
11. 点击"确认升级"
   ↓
12. 系统验证验证码
   ↓
13. 绑定邮箱和密码
   ↓
14. 升级为正式用户（保留所有数据）
   ↓
15. 跳转到首页
```

### 普通用户登录流程

```
1. 未登录用户访问登录页面
   ↓
2. 显示标准登录界面
   ↓
3. 输入邮箱和密码
   ↓
4. 点击"登录"
   ↓
5. 验证成功后跳转到首页
```

## 🔒 安全特性

### 1. 验证码安全

- **有效期限制**: 验证码5分钟后自动过期
- **频率限制**: 1分钟内只能发送一次验证码
- **一次性使用**: 验证成功后立即删除验证码记录
- **随机生成**: 使用6位随机数字，100万种组合

### 2. 密码安全

- **最小长度**: 密码至少6个字符
- **确认密码**: 需要二次确认，防止输入错误
- **加密存储**: 密码通过Supabase Auth加密存储

### 3. 身份验证

- **匿名用户检查**: 只有匿名用户才能使用绑定升级功能
- **邮箱唯一性**: 系统自动检查邮箱是否已被注册
- **会话管理**: 使用Cookie进行会话管理

## 📊 数据迁移

### 注册绑定方式（新功能）

**特点**: 用户ID不变，所有数据自动保留

**流程**:

```
匿名用户 (ID: A)
    ↓
验证邮箱
    ↓
设置密码
    ↓
更新用户信息 (ID: A)
    - role: anonymous → user
    - isAnonymous: true → false
    - email: anonymous_xxx → 真实邮箱
    ↓
所有数据自动保留 (ID 不变)
    ↓
升级完成
```

### 登录绑定方式（保留）

**特点**: 需要迁移数据到已有账号

**流程**:

```
匿名用户 (ID: A) + 正式用户 (ID: B)
    ↓
验证登录凭据
    ↓
迁移数据: A → B
    ↓
删除匿名用户 (ID: A)
    ↓
登录到正式账号 (ID: B)
```

## 🎨 UI/UX优化

### 1. 视觉提示

**临时账号标识**:

- 页面标题显示橙色"临时账号"徽章
- 清晰的升级优势说明
- 友好的引导文案

**升级优势展示**:

```
✓ 数据永久保存，不会过期
✓ 解锁更多高级功能
✓ 多设备同步使用
✓ 优先技术支持
```

### 2. 交互优化

**验证码发送**:

- 发送按钮带加载状态
- 60秒倒计时显示
- 实时显示剩余秒数
- 倒计时结束后可重新发送

**表单验证**:

- 实时邮箱格式验证
- 密码长度验证
- 确认密码一致性验证
- 验证码长度验证（6位）

**错误提示**:

- 清晰的错误信息
- 可关闭的Alert组件
- 友好的错误文案

### 3. Tab切换

**两个Tab**:

1. **绑定邮箱升级**: 默认Tab，适合新用户
2. **登录已有账号**: 适合已有正式账号的用户

**切换提示**:

- "已有正式账号？直接登录"
- 点击文字即可切换Tab

## 🧪 测试建议

### 功能测试

#### 1. 验证码发送测试

**测试步骤**:

1. 输入有效邮箱
2. 点击"发送验证码"
3. 检查邮箱是否收到验证码
4. 验证倒计时是否正常工作
5. 测试1分钟内重复发送（应该被拒绝）

**预期结果**:

- ✅ 验证码成功发送到邮箱
- ✅ 倒计时正常显示（60秒）
- ✅ 1分钟内无法重复发送
- ✅ 验证码格式正确（6位数字）

#### 2. 绑定邮箱升级测试

**测试步骤**:

1. 以匿名用户身份登录
2. 点击"升级为正式用户"
3. 输入邮箱并发送验证码
4. 输入收到的验证码
5. 设置密码和确认密码
6. 输入姓名（可选）
7. 点击"确认升级"

**预期结果**:

- ✅ 验证码验证成功
- ✅ 邮箱绑定成功
- ✅ 密码设置成功
- ✅ 用户角色变为正式用户
- ✅ 所有数据保留
- ✅ 跳转到首页

#### 3. 验证码过期测试

**测试步骤**:

1. 发送验证码
2. 等待5分钟以上
3. 尝试使用过期的验证码

**预期结果**:

- ✅ 提示"验证码无效或已过期"
- ✅ 需要重新发送验证码

#### 4. 错误处理测试

**测试场景**:

- 输入错误的验证码
- 密码和确认密码不一致
- 邮箱格式错误
- 密码长度不足6个字符

**预期结果**:

- ✅ 显示清晰的错误提示
- ✅ 不会提交表单
- ✅ 用户可以修改后重试

### 边界测试

#### 1. 邮箱已注册

- 输入已注册的邮箱
- 验证错误提示

#### 2. 网络异常

- 模拟网络断开
- 验证错误提示和重试机制

#### 3. 并发请求

- 快速多次点击发送验证码
- 验证频率限制是否生效

## 📚 相关文档

- [AUTO_ANONYMOUS_LOGIN_SUMMARY.md](./AUTO_ANONYMOUS_LOGIN_SUMMARY.md) - 自动匿名登录功能
- [ANONYMOUS_USER_UPGRADE.md](./ANONYMOUS_USER_UPGRADE.md) - 匿名用户升级功能（旧版）
- [EMAIL_NOTIFICATION_SETUP.md](./EMAIL_NOTIFICATION_SETUP.md) - 邮件服务配置

## 🔧 环境配置

### 必需的环境变量

```env
# 数据库连接
DATABASE_URL=postgresql://...

# SMTP邮件服务配置（用于发送验证码）
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM_EMAIL=your-email@gmail.com
SMTP_FROM_NAME=番茄工具箱

# 网站URL
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 数据库迁移

运行以下命令创建 `email_verification` 表：

```bash
# 生成迁移文件
pnpm drizzle-kit generate

# 执行迁移
pnpm drizzle-kit migrate
```

## 🎉 总结

本次重构实现了基于邮箱验证码的匿名用户升级功能，主要优势：

1. ✅ **更安全**: 通过邮箱验证码确认用户身份
2. ✅ **更友好**: 统一在登录页面处理，流程更清晰
3. ✅ **更灵活**: 支持两种升级方式（绑定邮箱/登录已有账号）
4. ✅ **数据保留**: 用户ID不变，所有数据自动保留
5. ✅ **体验优化**: 倒计时、实时验证、清晰提示

---

**实现日期**: 2025-11-14  
**版本**: v2.0.0  
**状态**: ✅ 已完成
