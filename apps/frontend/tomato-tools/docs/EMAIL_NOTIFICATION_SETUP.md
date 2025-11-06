# 邮件通知功能配置指南

## 功能概述

番茄工具箱的通知系统支持邮件通知功能，可以在创建系统通知时自动向用户发送邮件提醒。

## 功能特性

- ✅ 支持SMTP邮件发送
- ✅ 精美的HTML邮件模板
- ✅ 批量发送邮件
- ✅ 邮件发送日志记录
- ✅ 支持多种邮件服务商（Gmail、163、QQ邮箱等）
- ✅ 自动过滤无邮箱用户
- ✅ 发送失败错误处理

## 环境变量配置

在项目根目录的 `.env.local` 文件中添加以下配置：

```env
# SMTP邮件服务配置
SMTP_HOST=smtp.gmail.com          # SMTP服务器地址
SMTP_PORT=587                      # SMTP端口（587为TLS，465为SSL）
SMTP_USER=your-email@gmail.com    # 发件人邮箱
SMTP_PASSWORD=your-app-password   # 邮箱密码或应用专用密码
SMTP_FROM_EMAIL=your-email@gmail.com  # 发件人邮箱（可选，默认使用SMTP_USER）
SMTP_FROM_NAME=番茄工具箱          # 发件人名称（可选）

# 网站URL（用于邮件中的链接）
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## 常用邮件服务商配置

### Gmail

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

**注意**：Gmail需要使用应用专用密码，不能使用账户密码。

**获取应用专用密码步骤**：

1. 登录Google账户
2. 访问 https://myaccount.google.com/security
3. 启用两步验证
4. 在"应用专用密码"中生成新密码
5. 使用生成的密码作为 `SMTP_PASSWORD`

### 163邮箱

```env
SMTP_HOST=smtp.163.com
SMTP_PORT=465
SMTP_USER=your-email@163.com
SMTP_PASSWORD=your-authorization-code
```

**注意**：163邮箱需要使用授权码，不能使用登录密码。

**获取授权码步骤**：

1. 登录163邮箱
2. 设置 -> POP3/SMTP/IMAP
3. 开启SMTP服务
4. 获取授权码

### QQ邮箱

```env
SMTP_HOST=smtp.qq.com
SMTP_PORT=587
SMTP_USER=your-email@qq.com
SMTP_PASSWORD=your-authorization-code
```

**获取授权码步骤**：

1. 登录QQ邮箱
2. 设置 -> 账户
3. 开启SMTP服务
4. 生成授权码

### 阿里云邮箱

```env
SMTP_HOST=smtp.aliyun.com
SMTP_PORT=465
SMTP_USER=your-email@aliyun.com
SMTP_PASSWORD=your-password
```

## 安装依赖

项目已经包含了 `nodemailer` 依赖，如果没有安装，请运行：

```bash
pnpm add nodemailer
pnpm add -D @types/nodemailer
```

## 使用方法

### 1. 在管理后台创建通知时启用邮件发送

访问 `/admin/notifications` 页面，创建通知时：

1. 填写通知标题和内容
2. 选择通知类型和优先级
3. **开启"发送邮件"开关**
4. 选择发送给所有用户或特定用户
5. 点击创建

### 2. 通过API创建通知并发送邮件

```typescript
// 创建通知并发送邮件
const response = await fetch("/api/notifications", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    title: "系统维护通知",
    content: "系统将于今晚22:00-24:00进行维护，期间服务可能不可用。",
    type: "maintenance",
    priority: "high",
    status: "published",
    sendEmail: true, // 启用邮件发送
    sendPush: true,
    sendToAll: true, // 发送给所有用户
  }),
});
```

### 3. 在代码中直接使用邮件服务

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

// 批量发送通知邮件
await EmailService.sendBatchNotificationEmails([
  {
    to: "user1@example.com",
    subject: "系统通知",
    title: "通知标题",
    content: "通知内容",
  },
  {
    to: "user2@example.com",
    subject: "系统通知",
    title: "通知标题",
    content: "通知内容",
  },
]);
```

## 邮件模板

邮件使用精美的HTML模板，包含以下元素：

- 🎨 渐变色头部
- 🏷️ 通知类型和优先级标签
- 📝 通知标题和内容
- 🔗 操作按钮（如果提供了actionUrl）
- 📧 页脚信息和网站链接

### 优先级颜色

- **低优先级**：绿色 (#52c41a)
- **普通优先级**：蓝色 (#1890ff)
- **高优先级**：橙色 (#fa8c16)
- **紧急优先级**：红色 (#ff4d4f)

## 日志查看

邮件发送会记录详细的日志，可以通过以下方式查看：

```bash
# 查看邮件服务日志
tail -f logs/email-service.log

# 查看通知服务日志
tail -f logs/notification-service.log
```

日志包含以下信息：

- 邮件发送请求
- 发送成功/失败状态
- 收件人信息
- 错误详情

## 故障排除

### 1. 邮件发送失败

**问题**：邮件无法发送

**解决方案**：

- 检查SMTP配置是否正确
- 确认邮箱密码/授权码是否有效
- 检查网络连接
- 查看日志获取详细错误信息

### 2. Gmail发送失败

**问题**：Gmail提示"Less secure app access"

**解决方案**：

- 使用应用专用密码而不是账户密码
- 确保已启用两步验证

### 3. 163/QQ邮箱发送失败

**问题**：提示"Authentication failed"

**解决方案**：

- 使用授权码而不是登录密码
- 确认已开启SMTP服务

### 4. 邮件进入垃圾箱

**问题**：发送的邮件被标记为垃圾邮件

**解决方案**：

- 配置SPF、DKIM、DMARC记录（如果使用自己的域名）
- 避免在邮件内容中使用过多营销词汇
- 建议用户将发件地址加入白名单

### 5. 邮件服务未配置

**问题**：日志显示"Email service not configured"

**解决方案**：

- 检查 `.env.local` 文件是否存在
- 确认所有必需的环境变量都已配置
- 重启开发服务器使环境变量生效

## 性能优化

### 批量发送优化

对于大量用户的邮件发送，系统会：

1. 自动过滤无邮箱的用户
2. 使用批量发送减少连接开销
3. 记录发送失败的邮件以便重试

### 异步发送

邮件发送是异步的，不会阻塞通知创建流程：

- 通知立即创建并保存到数据库
- 邮件在后台异步发送
- 发送失败不影响通知的正常显示

## 安全建议

1. **不要将SMTP密码提交到版本控制**

   - 使用 `.env.local` 文件存储敏感信息
   - 确保 `.env.local` 在 `.gitignore` 中

2. **使用应用专用密码**

   - 不要使用主账户密码
   - 定期更换应用专用密码

3. **限制发送频率**

   - 避免短时间内发送大量邮件
   - 遵守邮件服务商的发送限制

4. **保护用户隐私**
   - 使用密送（BCC）发送批量邮件
   - 不在邮件中暴露其他用户的邮箱地址

## 测试

### 测试邮件配置

创建一个测试通知来验证邮件配置：

```typescript
// 测试邮件发送
const testEmail = await EmailService.sendNotificationEmail({
  to: "your-test-email@example.com",
  subject: "测试邮件",
  title: "邮件服务测试",
  content: "这是一封测试邮件，用于验证邮件服务配置是否正确。",
  priority: "normal",
  type: "system",
});

console.log("测试结果:", testEmail);
```

## 相关文档

- [通知系统文档](./NOTIFICATION_SYSTEM.md)
- [日志系统文档](./LOGGER_USAGE.md)
- [API文档](./API_DOCUMENTATION.md)

## 技术支持

如有问题，请：

1. 查看日志文件获取详细错误信息
2. 检查环境变量配置
3. 参考本文档的故障排除部分
4. 提交Issue到项目仓库
