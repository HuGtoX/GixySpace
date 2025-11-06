# AI聊天会话数据库存储 - 快速开始

## 🚀 快速部署

### 1. 运行数据库迁移

```bash
# 进入项目目录
cd d:\-GixySpace\apps\frontend\tomato-tools

# 生成迁移文件
pnpm drizzle-kit generate

# 执行迁移（创建数据库表）
pnpm db:migrate
```

### 2. 验证迁移

检查数据库中是否成功创建了以下表：

- `ai_chat_session` - 聊天会话表
- `ai_chat_message` - 聊天消息表

### 3. 启动应用

```bash
pnpm dev
```

### 4. 测试功能

1. 登录应用
2. 打开AI聊天窗口
3. 如果有localStorage中的旧数据，会自动迁移
4. 创建新会话并发送消息
5. 刷新页面，验证数据是否持久化

## 📋 功能清单

### ✅ 已实现功能

- [x] 数据库表结构设计
- [x] 会话CRUD操作
- [x] 消息CRUD操作
- [x] API接口实现
- [x] 前端组件集成
- [x] 自动数据迁移
- [x] 用户认证和权限控制
- [x] 性能优化（索引、按需加载）

### 🎯 核心功能

1. **会话管理**

   - 创建新会话
   - 查看会话列表
   - 切换会话
   - 重命名会话
   - 删除会话

2. **消息管理**

   - 发送消息
   - 接收AI回复
   - 查看历史消息
   - 消息持久化

3. **数据迁移**
   - 自动检测localStorage数据
   - 一键迁移到数据库
   - 迁移进度提示
   - 自动清理旧数据

## 🔧 配置说明

### 环境变量

确保 `.env.local` 文件中配置了数据库连接：

```env
DATABASE_URL=postgresql://user:password@host:port/database
```

### 数据库要求

- PostgreSQL 12+
- 支持UUID类型
- 支持JSONB类型

## 📖 API文档

### 会话接口

```typescript
// 获取所有会话
GET /api/ai-chat/sessions
Response: { sessions: ChatSession[] }

// 创建会话
POST /api/ai-chat/sessions
Body: { title: string, model: string, isOnlineSearch: boolean }
Response: { session: ChatSession }

// 获取会话详情
GET /api/ai-chat/sessions/:sessionId
Response: { session: ChatSessionWithMessages }

// 更新会话
PATCH /api/ai-chat/sessions/:sessionId
Body: { title?: string, isOnlineSearch?: boolean }
Response: { session: ChatSession }

// 删除会话
DELETE /api/ai-chat/sessions/:sessionId
Response: { success: boolean }
```

### 消息接口

```typescript
// 添加消息
POST /api/ai-chat/sessions/:sessionId/messages
Body: { content: string, role: "user" | "assistant", metadata?: any }
Response: { message: ChatMessage }

// 获取消息列表
GET /api/ai-chat/sessions/:sessionId/messages
Response: { messages: ChatMessage[] }
```

## 💡 使用示例

### 在组件中使用

```tsx
import AiChatModal from "@/components/home/AiChatModal";

function MyComponent() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>打开AI助手</Button>

      <AiChatModal
        open={open}
        onClose={() => setOpen(false)}
        title="番茄智能助手"
        model="deepseek-chat"
        width={1200}
        height={600}
      />
    </>
  );
}
```

### 使用服务层

```typescript
import { AiChatService } from "@/modules/ai-chat/ai-chat.service";

// 创建服务实例
const aiChatService = new AiChatService(requestId);

// 创建会话
const session = await aiChatService.createSession({
  userId: user.id,
  title: "新对话",
  model: "deepseek-chat",
  isOnlineSearch: false,
});

// 添加消息
const message = await aiChatService.addMessage({
  sessionId: session.id,
  content: "你好",
  role: "user",
});

// 获取会话列表
const sessions = await aiChatService.getUserSessions(user.id);
```

## 🐛 故障排除

### 问题1：数据库迁移失败

**解决方案：**

1. 检查数据库连接配置
2. 确保数据库用户有创建表的权限
3. 查看迁移日志获取详细错误信息

### 问题2：API返回401错误

**解决方案：**

1. 确保用户已登录
2. 检查认证token是否有效
3. 验证Supabase配置

### 问题3：消息无法保存

**解决方案：**

1. 检查会话ID是否有效
2. 验证用户是否有权限访问该会话
3. 查看浏览器控制台错误信息

### 问题4：迁移后数据丢失

**解决方案：**

1. 检查localStorage中是否还有数据
2. 查看迁移日志中的错误信息
3. 手动运行迁移脚本

## 📚 相关文档

- [完整功能文档](./ai-chat-database.md)
- [实现总结](./AI_CHAT_IMPLEMENTATION_SUMMARY.md)
- [Drizzle ORM文档](https://orm.drizzle.team/)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)

## 🤝 贡献指南

如需添加新功能或修复bug，请遵循以下步骤：

1. 创建新分支
2. 实现功能并添加测试
3. 更新相关文档
4. 提交Pull Request

## 📝 更新日志

### v1.0.0 (2025-10-30)

- ✨ 初始版本发布
- ✨ 实现数据库存储功能
- ✨ 添加自动迁移功能
- 📝 完善文档

## 📞 支持

如有问题或建议，请：

1. 查看文档
2. 搜索已有issue
3. 创建新issue

---

**祝使用愉快！** 🎉
