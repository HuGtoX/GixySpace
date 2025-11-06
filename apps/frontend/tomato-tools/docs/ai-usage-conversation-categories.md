# AI对话分类设计文档

## 📋 概述

在AI使用记录系统中，我们设计了**两层分类体系**：

1. **使用场景（Scene）** - 粗粒度分类，描述AI的主要用途
2. **对话分类（Conversation Category）** - 细粒度分类，描述具体的对话类型

这种双层分类设计可以帮助你：

- 📊 更精确地分析用户行为
- 💰 更准确地计算不同场景的成本
- 🎯 优化不同类型对话的AI模型选择
- 📈 生成更详细的使用报告

---

## 🎯 使用场景（Scene）

### 场景列表

| 场景代码            | 场景名称 | 描述           | 适用范围   |
| ------------------- | -------- | -------------- | ---------- |
| `chat`              | 聊天对话 | 通用的对话交互 | 最广泛     |
| `summary`           | 内容摘要 | 文本总结和提炼 | 文档处理   |
| `translation`       | 翻译     | 语言翻译服务   | 多语言场景 |
| `code_generation`   | 代码生成 | 生成代码片段   | 开发场景   |
| `text_optimization` | 文本优化 | 改进文本质量   | 写作场景   |
| `question_answer`   | 问答     | 问题解答       | 知识查询   |
| `other`             | 其他     | 其他未分类场景 | 兜底分类   |

---

## 💬 对话分类（Conversation Category）

### 分类体系

#### 1️⃣ 通用对话类

适用于日常交流和一般性咨询。

| 分类代码              | 分类名称 | 使用场景示例                 |
| --------------------- | -------- | ---------------------------- |
| `general_chat`        | 通用聊天 | "你好"、"介绍一下自己"       |
| `casual_conversation` | 闲聊     | "今天天气怎么样"、"讲个笑话" |

**推荐场景**：`chat`

---

#### 2️⃣ 工作相关类

适用于专业工作场景。

| 分类代码              | 分类名称 | 使用场景示例           |
| --------------------- | -------- | ---------------------- |
| `work_consultation`   | 工作咨询 | "如何提高团队效率"     |
| `technical_support`   | 技术支持 | "这个错误怎么解决"     |
| `code_review`         | 代码审查 | "帮我审查这段代码"     |
| `debugging_help`      | 调试帮助 | "为什么这个函数不工作" |
| `architecture_design` | 架构设计 | "设计一个微服务架构"   |

**推荐场景**：`chat`、`code_generation`、`question_answer`

---

#### 3️⃣ 学习教育类

适用于学习和教育场景。

| 分类代码              | 分类名称 | 使用场景示例       |
| --------------------- | -------- | ------------------ |
| `learning_tutorial`   | 学习教程 | "教我React Hooks"  |
| `concept_explanation` | 概念解释 | "什么是闭包"       |
| `homework_help`       | 作业辅导 | "帮我解这道数学题" |

**推荐场景**：`question_answer`、`chat`

---

#### 4️⃣ 创作类

适用于内容创作场景。

| 分类代码             | 分类名称 | 使用场景示例         |
| -------------------- | -------- | -------------------- |
| `content_creation`   | 内容创作 | "写一篇关于AI的文章" |
| `writing_assistance` | 写作辅助 | "帮我改进这段文字"   |
| `brainstorming`      | 头脑风暴 | "给我一些创意点子"   |

**推荐场景**：`text_optimization`、`chat`

---

#### 5️⃣ 数据处理类

适用于数据分析和报告生成。

| 分类代码            | 分类名称 | 使用场景示例         |
| ------------------- | -------- | -------------------- |
| `data_analysis`     | 数据分析 | "分析这组数据的趋势" |
| `report_generation` | 报告生成 | "生成月度工作报告"   |
| `document_summary`  | 文档摘要 | "总结这篇文档的要点" |

**推荐场景**：`summary`、`question_answer`

---

#### 6️⃣ 语言处理类

适用于语言相关的处理任务。

| 分类代码              | 分类名称 | 使用场景示例         |
| --------------------- | -------- | -------------------- |
| `translation_service` | 翻译服务 | "把这段话翻译成英文" |
| `grammar_check`       | 语法检查 | "检查这段文字的语法" |
| `text_polishing`      | 文本润色 | "让这段话更专业"     |

**推荐场景**：`translation`、`text_optimization`

---

#### 7️⃣ 其他

| 分类代码 | 分类名称 | 使用场景示例 |
| -------- | -------- | ------------ |
| `other`  | 其他     | 未分类的对话 |

**推荐场景**：`other`

---

## 🔧 使用示例

### 示例 1：通用聊天

```typescript
await recordAiApiCall(
  userId,
  "chat", // 场景：聊天对话
  requestData,
  responseData,
  {
    conversationCategory: "general_chat", // 分类：通用聊天
    conversationTags: ["greeting"], // 标签：问候
    ipAddress: "192.168.1.1",
    userAgent: "Mozilla/5.0...",
    duration: 1200,
  },
);
```

### 示例 2：技术支持

```typescript
await recordAiApiCall(
  userId,
  "chat", // 场景：聊天对话
  requestData,
  responseData,
  {
    conversationCategory: "technical_support", // 分类：技术支持
    conversationTags: ["bug", "urgent"], // 标签：bug、紧急
    sceneDescription: "用户报告登录问题",
    duration: 3500,
  },
);
```

### 示例 3：代码审查

```typescript
await recordAiApiCall(
  userId,
  "code_generation", // 场景：代码生成
  requestData,
  responseData,
  {
    conversationCategory: "code_review", // 分类：代码审查
    conversationTags: ["react", "performance"], // 标签：React、性能
    sceneDescription: "审查React组件性能",
    duration: 2800,
  },
);
```

### 示例 4：文档摘要

```typescript
await recordAiApiCall(
  userId,
  "summary", // 场景：内容摘要
  requestData,
  responseData,
  {
    conversationCategory: "document_summary", // 分类：文档摘要
    conversationTags: ["technical-doc", "api"], // 标签：技术文档、API
    sceneDescription: "API文档摘要",
    duration: 1500,
  },
);
```

### 示例 5：翻译服务

```typescript
await recordAiApiCall(
  userId,
  "translation", // 场景：翻译
  requestData,
  responseData,
  {
    conversationCategory: "translation_service", // 分类：翻译服务
    conversationTags: ["zh-CN", "en-US"], // 标签：中文、英文
    sceneDescription: "中译英",
    duration: 800,
  },
);
```

---

## 📊 数据分析示例

### 按对话分类统计

```typescript
// 查询用户的对话分类分布
const stats = await getUserAiUsageStatistics(userId, {
  startDate: "2025-01-01",
  endDate: "2025-01-31",
});

// 分析对话分类
stats.forEach((stat) => {
  console.log("日期:", stat.date);
  console.log("场景分布:", stat.sceneStats);
  console.log("对话分类分布:", stat.categoryStats);
  // 输出示例：
  // {
  //   "general_chat": 15,
  //   "technical_support": 8,
  //   "code_review": 5,
  //   "document_summary": 3
  // }
});
```

### 查询特定分类的对话

```typescript
// 查询所有技术支持类对话
const technicalSupportLogs = await db
  .select()
  .from(aiUsageLogs)
  .where(
    and(
      eq(aiUsageLogs.userId, userId),
      eq(aiUsageLogs.conversationCategory, "technical_support"),
    ),
  )
  .orderBy(desc(aiUsageLogs.createdAt));
```

---

## 🎨 前端集成示例

### 在聊天界面添加分类选择

```tsx
import { Select } from "antd";

const conversationCategories = [
  { value: "general_chat", label: "通用聊天" },
  { value: "technical_support", label: "技术支持" },
  { value: "code_review", label: "代码审查" },
  { value: "learning_tutorial", label: "学习教程" },
  // ... 更多分类
];

function ChatInterface() {
  const [category, setCategory] = useState("general_chat");

  const handleSendMessage = async (message: string) => {
    const response = await fetch("/api/chat", {
      method: "POST",
      body: JSON.stringify({
        message,
        model: "deepseek-chat",
        category, // 传递对话分类
      }),
    });
    // ...
  };

  return (
    <div>
      <Select
        value={category}
        onChange={setCategory}
        options={conversationCategories}
        style={{ width: 200, marginBottom: 16 }}
      />
      {/* 聊天界面 */}
    </div>
  );
}
```

### 在API路由中记录分类

```typescript
// app/api/chat/route.ts
export async function POST(request: Request) {
  const { message, model, category } = await request.json();

  // 调用AI API
  const response = await callAiApi(message, model);

  // 记录使用情况
  await recordAiApiCall(userId, "chat", { message, model }, response, {
    conversationCategory: category,
    conversationTags: extractTags(message), // 自动提取标签
    ipAddress: getClientIp(request),
    userAgent: request.headers.get("user-agent"),
    duration: Date.now() - startTime,
  });

  return Response.json(response);
}
```

---

## 🏷️ 对话标签（Conversation Tags）

除了对话分类，你还可以使用**标签**来进一步细化分类：

### 标签示例

```typescript
// 技术相关标签
["react", "vue", "typescript", "nodejs", "python"][
  // 优先级标签
  ("urgent", "important", "low-priority")
][
  // 状态标签
  ("resolved", "pending", "follow-up")
][
  // 语言标签
  ("zh-CN", "en-US", "ja-JP")
][
  // 领域标签
  ("frontend", "backend", "devops", "database")
];
```

### 标签使用示例

```typescript
await recordAiApiCall(userId, "chat", requestData, responseData, {
  conversationCategory: "technical_support",
  conversationTags: [
    "react", // 技术栈
    "urgent", // 优先级
    "frontend", // 领域
    "bug-fix", // 类型
  ],
});
```

---

## 📈 最佳实践

### 1. 选择合适的分类

- **明确场景**：先确定使用场景（Scene），再选择对话分类
- **保持一致**：同类型的对话使用相同的分类
- **避免过度分类**：如果不确定，使用 `general_chat` 或 `other`

### 2. 合理使用标签

- **简洁明了**：标签应该简短且有意义
- **标准化**：建立标签规范，避免重复（如 `js` vs `javascript`）
- **适度使用**：每个对话 2-5 个标签即可

### 3. 数据分析

- **定期分析**：每周/月分析对话分类分布
- **优化模型**：根据分类选择最合适的AI模型
- **成本控制**：识别高成本的对话类型

### 4. 自动分类

可以使用AI自动识别对话分类：

```typescript
async function autoDetectCategory(message: string): Promise<string> {
  // 使用关键词匹配
  if (message.includes("代码") || message.includes("bug")) {
    return "technical_support";
  }
  if (message.includes("翻译")) {
    return "translation_service";
  }
  // ... 更多规则

  return "general_chat";
}
```

---

## 🔄 迁移指南

如果你已经有现有的AI使用记录，可以通过以下方式添加对话分类：

```typescript
// 批量更新现有记录
await db
  .update(aiUsageLogs)
  .set({
    conversationCategory: "general_chat", // 默认分类
  })
  .where(
    and(
      eq(aiUsageLogs.scene, "chat"),
      isNull(aiUsageLogs.conversationCategory),
    ),
  );
```

---

## 📚 相关文档

- [数据库表设计](./ai-usage-database-schema.md)
- [快速开始指南](./ai-usage-quick-start.md)
- [ER图和流程图](./ai-usage-database-diagram.md)

---

## 💡 总结

通过**场景 + 分类 + 标签**的三层体系，你可以：

✅ **精确追踪** - 了解用户如何使用AI功能  
✅ **数据分析** - 生成详细的使用报告  
✅ **成本优化** - 识别高成本场景并优化  
✅ **体验提升** - 根据分类优化AI响应

开始使用对话分类，让你的AI使用数据更有价值！🚀
