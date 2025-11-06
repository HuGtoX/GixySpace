# AI聊天会话数据库存储功能

## 概述

本功能将AI聊天会话从本地存储（localStorage）迁移到数据库存储，提供更可靠的数据持久化和跨设备同步能力。

## 数据库表结构

### 1. ai_chat_session（聊天会话表）

存储用户的聊天会话信息。

| 字段             | 类型      | 说明                     |
| ---------------- | --------- | ------------------------ |
| id               | uuid      | 主键                     |
| user_id          | uuid      | 用户ID（外键关联user表） |
| title            | text      | 会话标题                 |
| model            | text      | AI模型名称               |
| is_online_search | boolean   | 是否启用联网查询         |
| created_at       | timestamp | 创建时间                 |
| updated_at       | timestamp | 更新时间                 |

### 2. ai_chat_message（聊天消息表）

存储会话中的所有消息。

| 字段       | 类型      | 说明                                |
| ---------- | --------- | ----------------------------------- |
| id         | uuid      | 主键                                |
| session_id | uuid      | 会话ID（外键关联ai_chat_session表） |
| content    | text      | 消息内容                            |
| role       | enum      | 消息角色（user/assistant）          |
| metadata   | jsonb     | 扩展元数据（可选）                  |
| created_at | timestamp | 创建时间                            |

## API接口

### 会话管理

#### 获取用户所有会话

```
GET /api/ai-chat/sessions
```

#### 创建新会话

```
POST /api/ai-chat/sessions
Body: {
  title: string,
  model: string,
  isOnlineSearch: boolean
}
```

#### 获取会话详情（包含消息）

```
GET /api/ai-chat/sessions/[sessionId]
```

#### 更新会话

```
PATCH /api/ai-chat/sessions/[sessionId]
Body: {
  title?: string,
  isOnlineSearch?: boolean
}
```

#### 删除会话

```
DELETE /api/ai-chat/sessions/[sessionId]
```

### 消息管理

#### 添加消息到会话

```
POST /api/ai-chat/sessions/[sessionId]/messages
Body: {
  content: string,
  role: "user" | "assistant",
  metadata?: any
}
```

#### 获取会话的所有消息

```
GET /api/ai-chat/sessions/[sessionId]/messages
```

## 使用方法

### 1. 运行数据库迁移

```bash
# 生成迁移文件
pnpm drizzle-kit generate

# 执行迁移
pnpm db:migrate
```

### 2. 在组件中使用

组件已自动使用数据库存储，无需额外配置。会话数据会自动保存到数据库中。

```tsx
import AiChatModal from "@/components/home/AiChatModal";

function MyComponent() {
  const [open, setOpen] = useState(false);

  return (
    <AiChatModal
      open={open}
      onClose={() => setOpen(false)}
      model="deepseek-chat"
    />
  );
}
```

## 服务层

### AiChatService

提供会话和消息的CRUD操作。

```typescript
import { AiChatService } from "@/modules/ai-chat/ai-chat.service";

const aiChatService = new AiChatService(requestId);

// 创建会话
const session = await aiChatService.createSession({
  userId: "user-id",
  title: "新对话",
  model: "deepseek-chat",
  isOnlineSearch: false,
});

// 获取用户会话
const sessions = await aiChatService.getUserSessions("user-id");

// 添加消息
const message = await aiChatService.addMessage({
  sessionId: "session-id",
  content: "Hello",
  role: "user",
});
```

## 工具函数

### sessionDbUtils.ts

提供前端使用的数据库操作工具函数。

```typescript
import {
  fetchSessions,
  createSession,
  addMessage,
  updateSession,
  deleteSession,
} from "./sessionDbUtils";

// 获取所有会话
const sessions = await fetchSessions();

// 创建新会话
const newSession = await createSession("deepseek-chat", false);

// 添加消息
const message = await addMessage("session-id", "Hello", "user");
```

## 迁移说明

### 从localStorage迁移

如果用户之前使用localStorage存储会话，可以通过以下步骤迁移：

1. 读取localStorage中的会话数据
2. 调用API创建新会话
3. 批量添加消息到新会话
4. 清除localStorage中的旧数据

迁移脚本示例：

```typescript
async function migrateFromLocalStorage() {
  const oldSessions = JSON.parse(
    localStorage.getItem("ai-chat-sessions") || "[]",
  );

  for (const oldSession of oldSessions) {
    // 创建新会话
    const newSession = await createSession(
      oldSession.model,
      oldSession.isOnlineSearch,
    );

    if (newSession) {
      // 添加消息
      for (const message of oldSession.messages) {
        await addMessage(newSession.id, message.content, message.role);
      }

      // 更新标题
      await updateSession(newSession.id, { title: oldSession.title });
    }
  }

  // 清除旧数据
  localStorage.removeItem("ai-chat-sessions");
}
```

## 注意事项

1. **用户认证**：所有API接口都需要用户认证，未登录用户无法访问
2. **权限控制**：用户只能访问自己的会话和消息
3. **级联删除**：删除会话时会自动删除该会话的所有消息
4. **性能优化**：会话列表不包含消息内容，消息按需加载
5. **索引优化**：已为常用查询添加数据库索引

## 未来改进

- [ ] 添加会话搜索功能
- [ ] 支持会话标签和分类
- [ ] 添加消息编辑和删除功能
- [ ] 支持会话导出和导入
- [ ] 添加会话统计和分析
- [ ] 支持多设备实时同步
