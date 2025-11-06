# AI对话上下文记忆 - 架构设计

## 🏗️ 系统架构

### 整体架构图

```mermaid
graph TB
    User[用户] --> UI[AiChatModal组件]
    UI --> MM[ContextMemoryManager]
    MM --> Optimize[消息优化]
    MM --> Build[构建上下文]
    Build --> API[Chat API]
    API --> Client[AI Client]
    Client --> AIService[AI服务]
    AIService --> Response[AI响应]
    Response --> DB[(数据库)]
    DB --> UI

    style MM fill:#e1f5ff
    style API fill:#fff3e0
    style Client fill:#f3e5f5
    style DB fill:#e8f5e9
```

### 数据流程图

```mermaid
sequenceDiagram
    participant U as 用户
    participant UI as 前端组件
    participant MM as 记忆管理器
    participant API as Chat API
    participant AI as AI服务
    participant DB as 数据库

    U->>UI: 输入消息
    UI->>DB: 保存用户消息
    UI->>MM: 获取历史消息
    MM->>MM: 优化上下文
    MM->>UI: 返回优化后的上下文
    UI->>API: 发送请求(含上下文)
    API->>AI: 调用AI服务
    AI->>API: 返回AI响应
    API->>DB: 保存AI响应
    API->>UI: 返回结果
    UI->>U: 显示AI回复
```

## 📦 模块设计

### 1. ContextMemoryManager（核心模块）

```mermaid
classDiagram
    class ContextMemoryManager {
        -config: ContextMemoryConfig
        +optimizeContext(messages)
        +buildContextHistory(messages)
        +getMemoryStats(messages)
        +generateSummary(messages)
        +searchRelevantMemories(messages, keywords)
        +extractKeywords(text)
        +updateConfig(config)
        +getConfig()
        -estimateTokens(text)
        -balanceConversation(messages)
    }

    class ContextMemoryConfig {
        +maxMessages: number
        +maxTokens: number
        +enableSummary: boolean
        +keepSystemMessages: boolean
    }

    class MemoryStats {
        +totalMessages: number
        +userMessages: number
        +assistantMessages: number
        +estimatedTokens: number
        +earliestMessageTime: Date
        +latestMessageTime: Date
    }

    ContextMemoryManager --> ContextMemoryConfig
    ContextMemoryManager --> MemoryStats
```

### 2. 消息处理流程

```mermaid
flowchart TD
    Start[开始] --> Input[接收消息列表]
    Input --> Check1{消息数量检查}
    Check1 -->|超过maxMessages| Trim1[按数量裁剪]
    Check1 -->|未超过| Check2{Token数量检查}
    Trim1 --> Check2
    Check2 -->|超过maxTokens| Trim2[按Token裁剪]
    Check2 -->|未超过| Balance[平衡对话]
    Trim2 --> Balance
    Balance --> Output[输出优化后的消息]
    Output --> End[结束]

    style Start fill:#e8f5e9
    style End fill:#e8f5e9
    style Trim1 fill:#fff3e0
    style Trim2 fill:#fff3e0
    style Balance fill:#e1f5ff
```

### 3. Token估算算法

```mermaid
flowchart LR
    Text[输入文本] --> Split[分离中英文]
    Split --> Chinese[中文字符]
    Split --> English[英文单词]
    Chinese --> Calc1[字符数 × 1.5]
    English --> Calc2[单词数 × 1.0]
    Calc1 --> Sum[求和]
    Calc2 --> Sum
    Sum --> Round[向上取整]
    Round --> Result[Token数量]

    style Text fill:#e8f5e9
    style Result fill:#e8f5e9
```

## 🔄 交互流程

### 用户发送消息流程

```mermaid
stateDiagram-v2
    [*] --> 输入消息
    输入消息 --> 保存用户消息
    保存用户消息 --> 加载历史消息
    加载历史消息 --> 优化上下文
    优化上下文 --> 构建请求
    构建请求 --> 发送API请求
    发送API请求 --> 等待响应
    等待响应 --> 接收AI回复
    接收AI回复 --> 保存AI消息
    保存AI消息 --> 显示回复
    显示回复 --> [*]
```

### 上下文优化流程

```mermaid
stateDiagram-v2
    [*] --> 接收消息列表
    接收消息列表 --> 检查消息数量
    检查消息数量 --> 数量裁剪: 超过限制
    检查消息数量 --> 检查Token数量: 未超过
    数量裁剪 --> 检查Token数量
    检查Token数量 --> Token裁剪: 超过限制
    检查Token数量 --> 平衡对话: 未超过
    Token裁剪 --> 平衡对话
    平衡对话 --> 返回结果
    返回结果 --> [*]
```

## 🗄️ 数据库设计

### 表结构

```mermaid
erDiagram
    USER ||--o{ AI_CHAT_SESSION : has
    AI_CHAT_SESSION ||--o{ AI_CHAT_MESSAGE : contains

    USER {
        uuid id PK
        string email
        string full_name
        timestamp created_at
    }

    AI_CHAT_SESSION {
        uuid id PK
        uuid user_id FK
        string title
        string model
        boolean is_online_search
        timestamp created_at
        timestamp updated_at
    }

    AI_CHAT_MESSAGE {
        uuid id PK
        uuid session_id FK
        text content
        enum role
        jsonb metadata
        timestamp created_at
    }
```

### 索引设计

```sql
-- 会话表索引
CREATE INDEX idx_ai_chat_session_user_id ON ai_chat_session(user_id);
CREATE INDEX idx_ai_chat_session_created_at ON ai_chat_session(created_at DESC);
CREATE INDEX idx_ai_chat_session_user_created ON ai_chat_session(user_id, created_at DESC);

-- 消息表索引
CREATE INDEX idx_ai_chat_message_session_id ON ai_chat_message(session_id);
CREATE INDEX idx_ai_chat_message_created_at ON ai_chat_message(created_at);
CREATE INDEX idx_ai_chat_message_session_created ON ai_chat_message(session_id, created_at);
```

## 🎨 前端组件结构

```mermaid
graph TD
    AiChatModal[AiChatModal] --> SessionSidebar[SessionSidebar]
    AiChatModal --> ChatComponent[ChatComponent]
    AiChatModal --> InputArea[InputArea]
    AiChatModal --> MemoryManager[ContextMemoryManager]

    SessionSidebar --> SessionList[会话列表]
    ChatComponent --> MessageList[消息列表]
    InputArea --> TextInput[文本输入]
    InputArea --> SendButton[发送按钮]
    InputArea --> OnlineSwitch[联网开关]

    MemoryManager --> Optimize[优化上下文]
    MemoryManager --> Build[构建历史]

    style AiChatModal fill:#e1f5ff
    style MemoryManager fill:#fff3e0
```

## 🔌 API接口设计

### POST /api/chat

**请求体**:

```typescript
{
  message: string;              // 当前消息
  model: string;                // AI模型
  isOnlineSearch?: boolean;     // 是否联网
  stream?: boolean;             // 是否流式
  conversationHistory?: Array<{ // 对话历史
    role: "user" | "assistant";
    content: string;
  }>;
  maxContextMessages?: number;  // 最大上下文数
  systemPrompt?: string;        // 系统提示词
}
```

**响应体**:

```typescript
{
  success: boolean;
  content?: string;             // AI回复内容
  usage?: {                     // Token使用情况
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  model: string;
  duration: number;             // 耗时(ms)
  tracked: boolean;             // 是否记录
}
```

## 🧮 算法设计

### Token估算算法

```
function estimateTokens(text: string): number {
  // 1. 统计中文字符
  chineseChars = count(text, /[\u4e00-\u9fa5]/g)

  // 2. 统计英文单词
  englishWords = count(text.replace(/[\u4e00-\u9fa5]/g, '').split(/\s+/))

  // 3. 计算Token数
  tokens = ceil(chineseChars * 1.5 + englishWords * 1.0)

  return tokens
}
```

### 消息优化算法

```
function optimizeContext(messages: Message[]): Message[] {
  // 1. 按数量限制
  messages = messages.slice(-maxMessages)

  // 2. 按Token限制（从后往前累加）
  result = []
  totalTokens = 0
  for (i = messages.length - 1; i >= 0; i--) {
    tokens = estimateTokens(messages[i].content)
    if (totalTokens + tokens <= maxTokens) {
      result.unshift(messages[i])
      totalTokens += tokens
    } else {
      break
    }
  }

  // 3. 平衡对话（确保用户-助手配对）
  result = balanceConversation(result)

  return result
}
```

### 对话平衡算法

```
function balanceConversation(messages: Message[]): Message[] {
  result = []
  expectingRole = "user"

  for (msg of messages) {
    if (msg.role == expectingRole) {
      result.push(msg)
      expectingRole = (expectingRole == "user") ? "assistant" : "user"
    } else if (result.length > 0) {
      result.push(msg)  // 允许连续同角色
    }
  }

  return result
}
```

## 📊 性能优化策略

### 1. 前端优化

```mermaid
graph LR
    A[useMemo缓存管理器] --> B[避免重复创建]
    C[懒加载消息] --> D[按需加载历史]
    E[虚拟滚动] --> F[大量消息优化]

    style A fill:#e8f5e9
    style C fill:#e8f5e9
    style E fill:#e8f5e9
```

### 2. 后端优化

```mermaid
graph LR
    A[数据库索引] --> B[快速查询]
    C[连接池] --> D[复用连接]
    E[缓存热门会话] --> F[减少查询]

    style A fill:#fff3e0
    style C fill:#fff3e0
    style E fill:#fff3e0
```

### 3. 算法优化

```mermaid
graph LR
    A[Token估算缓存] --> B[避免重复计算]
    C[增量更新] --> D[只处理新消息]
    E[并行处理] --> F[提高吞吐量]

    style A fill:#e1f5ff
    style C fill:#e1f5ff
    style E fill:#e1f5ff
```

## 🔐 安全设计

### 数据隔离

```mermaid
graph TD
    User1[用户1] --> Session1[会话1]
    User1 --> Session2[会话2]
    User2[用户2] --> Session3[会话3]
    User2 --> Session4[会话4]

    Session1 -.不可访问.-> Session3
    Session2 -.不可访问.-> Session4

    style User1 fill:#e8f5e9
    style User2 fill:#e8f5e9
```

### 权限控制

- ✅ 用户只能访问自己的会话
- ✅ 会话级别的权限验证
- ✅ 数据库级别的外键约束
- ✅ API级别的身份认证

## 📈 扩展性设计

### 未来扩展方向

```mermaid
mindmap
  root((上下文记忆))
    短期记忆
      当前实现
      流式优化
      实时更新
    长期记忆
      向量化存储
      语义搜索
      知识图谱
    智能功能
      自动摘要
      主题识别
      情感分析
    跨会话
      全局记忆
      用户画像
      个性化推荐
```

## 🎯 设计原则

1. **简单优先**: 从最简单的实现开始
2. **性能优先**: 确保不影响用户体验
3. **可扩展**: 预留扩展接口
4. **可维护**: 清晰的代码结构
5. **可测试**: 完善的测试覆盖

---

**文档版本**: v1.0  
**最后更新**: 2025-01-03  
**维护者**: 开发团队
