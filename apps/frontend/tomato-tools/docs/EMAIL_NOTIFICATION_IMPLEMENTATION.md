# 邮箱通知功能实现说明

## 📧 功能概述

本次更新为番茄工具箱的通知系统添加了完整的邮件通知功能，支持在创建系统通知时自动向用户发送邮件提醒。

## ✨ 新增功能

### 1. 邮件服务 (EmailService)

**文件位置**: `src/lib/services/email.ts`

**主要功能**:

- ✅ SMTP邮件发送
- ✅ 精美的HTML邮件模板
- ✅ 批量邮件发送
- ✅ 邮件发送状态检查
- ✅ 详细的日志记录
- ✅ 错误处理和重试机制

**邮件模板特性**:

- 🎨 渐变色头部设计
- 🏷️ 通知类型和优先级标签
- 📝 清晰的标题和内容展示
- 🔗 可选的操作按钮
- 📱 响应式设计，支持移动端
- 🌙 专业的页脚信息

### 2. 通知服务集成

**文件位置**: `src/lib/services/notification.ts`

**更新内容**:

- 在 `sendToAllUsers` 方法中集成邮件发送
- 在 `sendToUsers` 方法中集成邮件发送
- 自动获取用户邮箱信息
- 过滤无邮箱用户
- 异步发送邮件，不阻塞通知创建

### 3. 测试邮件API

**文件位置**: `src/app/api/notifications/test-email/route.ts`

**功能**:

- `GET /api/notifications/test-email` - 检查邮件服务配置状态
- `POST /api/notifications/test-email` - 发送测试邮件
- 仅管理员可访问
- 支持自定义邮件内容

### 4. 管理界面增强

**文件位置**: `src/app/admin/notifications/page.tsx`

**新增功能**:

- 📧 "测试邮件"按钮
- 📊 邮件服务配置状态显示
- 🔔 未配置警告提示
- 📝 测试邮件发送表单

## 📦 依赖更新

**package.json** 新增依赖:

```json
{
  "dependencies": {
    "nodemailer": "^6.9.16"
  },
  "devDependencies": {
    "@types/nodemailer": "^6.4.17"
  }
}
```

## ⚙️ 配置说明

### 环境变量

在 `.env.local` 文件中添加以下配置：

```env
# SMTP邮件服务配置
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM_EMAIL=your-email@gmail.com
SMTP_FROM_NAME=番茄工具箱

# 网站URL
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 常用邮件服务商配置

详见 `docs/EMAIL_NOTIFICATION_SETUP.md` 文档，包含：

- Gmail 配置
- 163邮箱配置
- QQ邮箱配置
- 阿里云邮箱配置

## 🚀 使用方法

### 1. 安装依赖

```bash
pnpm install
```

### 2. 配置环境变量

复制 `.env.example` 到 `.env.local` 并填写SMTP配置：

```bash
cp .env.example .env.local
```

### 3. 测试邮件配置

1. 启动开发服务器：`pnpm dev`
2. 访问管理后台：`http://localhost:3000/admin/notifications`
3. 点击"测试邮件"按钮
4. 输入收件人邮箱
5. 点击"发送测试邮件"

### 4. 创建带邮件通知的系统通知

1. 在管理后台点击"创建通知"
2. 填写通知信息
3. **开启"发送邮件"开关**
4. 选择发送对象（所有用户或特定用户）
5. 点击创建

## 📝 API使用示例

### 创建通知并发送邮件

```typescript
const response = await fetch("/api/notifications", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    title: "系统维护通知",
    content: "系统将于今晚22:00-24:00进行维护。",
    type: "maintenance",
    priority: "high",
    status: "published",
    sendEmail: true, // 启用邮件发送
    sendPush: true,
    sendToAll: true,
  }),
});
```

### 发送测试邮件

```typescript
const response = await fetch("/api/notifications/test-email", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    to: "user@example.com",
    subject: "测试邮件",
    title: "邮件服务测试",
    content: "这是一封测试邮件。",
  }),
});
```

### 检查邮件服务状态

```typescript
const response = await fetch("/api/notifications/test-email");
const result = await response.json();
console.log("邮件服务已配置:", result.configured);
```

## 🔍 代码示例

### 直接使用邮件服务

```typescript
import { EmailService } from "@/lib/services/email";

// 发送单个通知邮件
await EmailService.sendNotificationEmail({
  to: "user@example.com",
  subject: "系统通知",
  title: "重要通知",
  content: "这是一条重要的系统通知。",
  actionUrl: "https://example.com/notifications",
  actionText: "查看详情",
  priority: "high",
  type: "system",
});

// 批量发送
await EmailService.sendBatchNotificationEmails([
  { to: "user1@example.com", subject: "通知", title: "标题", content: "内容" },
  { to: "user2@example.com", subject: "通知", title: "标题", content: "内容" },
]);

// 检查配置状态
const isConfigured = EmailService.isConfigured();
```

## 📚 文档

- **配置指南**: `docs/EMAIL_NOTIFICATION_SETUP.md`
- **环境变量示例**: `.env.example`
- **通知系统文档**: `docs/NOTIFICATION_SYSTEM.md`

## 🔒 安全建议

1. ✅ 不要将SMTP密码提交到版本控制
2. ✅ 使用应用专用密码而非主账户密码
3. ✅ 定期更换应用专用密码
4. ✅ 限制邮件发送频率
5. ✅ 保护用户隐私

## 🐛 故障排除

### 邮件发送失败

1. 检查SMTP配置是否正确
2. 确认邮箱密码/授权码是否有效
3. 查看日志获取详细错误信息
4. 测试网络连接

### Gmail发送失败

- 使用应用专用密码
- 确保已启用两步验证

### 163/QQ邮箱发送失败

- 使用授权码而非登录密码
- 确认已开启SMTP服务

详细故障排除请参考 `docs/EMAIL_NOTIFICATION_SETUP.md`

## 📊 日志

邮件发送会记录详细日志：

```bash
# 查看邮件服务日志
tail -f logs/email-service.log

# 查看通知服务日志
tail -f logs/notification-service.log
```

## 🎯 功能特点

- ✅ **易于配置**: 只需配置环境变量即可使用
- ✅ **美观模板**: 专业的HTML邮件模板
- ✅ **批量发送**: 支持向多个用户批量发送
- ✅ **错误处理**: 完善的错误处理和日志记录
- ✅ **异步发送**: 不阻塞主流程
- ✅ **灵活配置**: 支持多种邮件服务商
- ✅ **测试工具**: 内置测试邮件功能
- ✅ **状态检查**: 自动检查配置状态

## 🔄 工作流程

1. 管理员在后台创建通知
2. 开启"发送邮件"选项
3. 系统创建通知记录
4. 获取目标用户列表
5. 过滤有邮箱的用户
6. 批量发送邮件
7. 记录发送结果
8. 更新统计数据

## 📈 性能优化

- 批量发送减少连接开销
- 异步发送不阻塞主流程
- 自动过滤无效邮箱
- 详细的错误日志便于排查

## 🎉 总结

本次实现为番茄工具箱添加了完整的邮件通知功能，包括：

1. ✅ 邮件服务类 (EmailService)
2. ✅ 通知服务集成
3. ✅ 测试邮件API
4. ✅ 管理界面增强
5. ✅ 完整的配置文档
6. ✅ 环境变量示例
7. ✅ 故障排除指南

现在用户可以在创建系统通知时自动向用户发送精美的邮件提醒！
