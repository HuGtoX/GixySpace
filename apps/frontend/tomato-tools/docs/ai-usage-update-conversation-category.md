# AI使用记录数据库方案 - 更新说明

## 🎉 更新内容

根据你的需求，我已经在原有的数据库设计基础上，**添加了对话分类（Conversation Category）功能**，实现了更细粒度的AI使用追踪。

---

## 📊 设计理念

### 双层分类体系

```
使用场景（Scene）
    ↓ 粗粒度分类
    ├─ chat（聊天对话）
    ├─ summary（内容摘要）
    ├─ translation（翻译）
    └─ ...

对话分类（Conversation Category）
    ↓ 细粒度分类
    ├─ general_chat（通用聊天）
    ├─ technical_support（技术支持）
    ├─ code_review（代码审查）
    └─ ...（共21种分类）
```

### 为什么需要双层分类？

1. **使用场景（Scene）** - 描述AI的主要用途

   - 适合宏观统计和成本分析
   - 例如：所有"聊天对话"场景的总成本

2. **对话分类（Category）** - 描述具体的对话类型
   - 适合精细化分析和优化
   - 例如：区分"技术支持"和"闲聊"的使用模式

---

## 🆕 新增字段

### ai_usage_logs 表

| 字段名                  | 类型  | 说明         | 示例                  |
| ----------------------- | ----- | ------------ | --------------------- |
| `conversation_category` | ENUM  | 对话分类     | `technical_support`   |
| `conversation_tags`     | JSONB | 对话标签数组 | `["react", "urgent"]` |

### ai_usage_statistics 表

| 字段名           | 类型  | 说明         | 示例                       |
| ---------------- | ----- | ------------ | -------------------------- |
| `category_stats` | JSONB | 对话分类统计 | `{"technical_support": 5}` |

### 新增索引

- `idx_ai_usage_logs_category` - 对话分类索引，优化按分类查询的性能

---

## 🎯 对话分类列表（21种）

### 1️⃣ 通用对话类（2种）

- `general_chat` - 通用聊天
- `casual_conversation` - 闲聊

### 2️⃣ 工作相关类（5种）

- `work_consultation` - 工作咨询
- `technical_support` - 技术支持
- `code_review` - 代码审查
- `debugging_help` - 调试帮助
- `architecture_design` - 架构设计

### 3️⃣ 学习教育类（3种）

- `learning_tutorial` - 学习教程
- `concept_explanation` - 概念解释
- `homework_help` - 作业辅导

### 4️⃣ 创作类（3种）

- `content_creation` - 内容创作
- `writing_assistance` - 写作辅助
- `brainstorming` - 头脑风暴

### 5️⃣ 数据处理类（3种）

- `data_analysis` - 数据分析
- `report_generation` - 报告生成
- `document_summary` - 文档摘要

### 6️⃣ 语言处理类（3种）

- `translation_service` - 翻译服务
- `grammar_check` - 语法检查
- `text_polishing` - 文本润色

### 7️⃣ 其他（1种）

- `other` - 其他

---

## 💻 代码示例

### 基础使用

```typescript
import { recordAiApiCall } from "@/lib/services/aiUsageService.example";

// 记录一次技术支持对话
await recordAiApiCall(
  userId,
  "chat", // 场景：聊天对话
  requestData,
  responseData,
  {
    conversationCategory: "technical_support", // 分类：技术支持
    conversationTags: ["react", "bug", "urgent"], // 标签
    sceneDescription: "用户报告React组件渲染问题",
    ipAddress: "192.168.1.1",
    userAgent: "Mozilla/5.0...",
    duration: 2500,
  },
);
```

### 场景 + 分类组合示例

| 场景              | 推荐分类              | 使用案例     |
| ----------------- | --------------------- | ------------ |
| `chat`            | `general_chat`        | 日常闲聊     |
| `chat`            | `technical_support`   | 技术问题咨询 |
| `code_generation` | `code_review`         | 代码审查     |
| `summary`         | `document_summary`    | 文档摘要     |
| `translation`     | `translation_service` | 翻译服务     |

### 查询特定分类的对话

```typescript
import { db } from "@/lib/drizzle/client";
import { aiUsageLogs } from "@/lib/drizzle/schema/aiUsage";
import { eq, and } from "drizzle-orm";

// 查询所有技术支持类对话
const technicalSupportLogs = await db
  .select()
  .from(aiUsageLogs)
  .where(
    and(
      eq(aiUsageLogs.userId, userId),
      eq(aiUsageLogs.conversationCategory, "technical_support"),
    ),
  );

console.log(`技术支持对话数量: ${technicalSupportLogs.length}`);
```

### 统计分类分布

```typescript
import { getUserAiUsageStatistics } from "@/lib/services/aiUsageService.example";

// 查询本月统计
const stats = await getUserAiUsageStatistics(userId, {
  startDate: "2025-01-01",
  endDate: "2025-01-31",
});

stats.forEach((stat) => {
  console.log(`日期: ${stat.date}`);
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

---

## 🔧 前端集成

### 在聊天界面添加分类选择器

```tsx
import { Select } from "antd";
import { useState } from "react";

const conversationCategories = [
  { value: "general_chat", label: "💬 通用聊天", group: "通用" },
  { value: "technical_support", label: "🔧 技术支持", group: "工作" },
  { value: "code_review", label: "👨‍💻 代码审查", group: "工作" },
  { value: "learning_tutorial", label: "📚 学习教程", group: "学习" },
  { value: "content_creation", label: "✍️ 内容创作", group: "创作" },
  // ... 更多分类
];

function ChatInterface() {
  const [category, setCategory] = useState("general_chat");

  return (
    <div>
      <Select
        value={category}
        onChange={setCategory}
        options={conversationCategories}
        placeholder="选择对话类型"
        style={{ width: 200, marginBottom: 16 }}
      />
      {/* 聊天组件 */}
    </div>
  );
}
```

### 在API路由中记录分类

```typescript
// app/api/chat/route.ts
import { recordAiApiCall } from "@/lib/services/aiUsageService.example";

export async function POST(request: Request) {
  const { message, model, category, tags } = await request.json();
  const startTime = Date.now();

  // 调用AI API
  const response = await callAiApi(message, model);

  // 记录使用情况（包含分类）
  await recordAiApiCall(userId, "chat", { message, model }, response, {
    conversationCategory: category,
    conversationTags: tags,
    ipAddress: getClientIp(request),
    userAgent: request.headers.get("user-agent"),
    duration: Date.now() - startTime,
  });

  return Response.json(response);
}
```

---

## 📈 数据分析场景

### 1. 分析用户最常用的对话类型

```typescript
// 统计用户各类对话的使用频率
const categoryDistribution = await db
  .select({
    category: aiUsageLogs.conversationCategory,
    count: sql<number>`COUNT(*)`,
    totalTokens: sql<number>`SUM(${aiUsageLogs.totalTokens})`,
    avgDuration: sql<number>`AVG(${aiUsageLogs.duration})`,
  })
  .from(aiUsageLogs)
  .where(eq(aiUsageLogs.userId, userId))
  .groupBy(aiUsageLogs.conversationCategory)
  .orderBy(desc(sql`COUNT(*)`));
```

### 2. 识别高成本对话类型

```typescript
// 找出成本最高的对话类型
const costByCategory = await db
  .select({
    category: aiUsageLogs.conversationCategory,
    totalCost: sql<number>`SUM(${aiUsageLogs.estimatedCost})`,
    avgCost: sql<number>`AVG(${aiUsageLogs.estimatedCost})`,
  })
  .from(aiUsageLogs)
  .where(eq(aiUsageLogs.userId, userId))
  .groupBy(aiUsageLogs.conversationCategory)
  .orderBy(desc(sql`SUM(${aiUsageLogs.estimatedCost})`));
```

### 3. 对比不同场景下的分类分布

```typescript
// 分析"chat"场景下的分类分布
const chatCategoryStats = await db
  .select({
    category: aiUsageLogs.conversationCategory,
    count: sql<number>`COUNT(*)`,
  })
  .from(aiUsageLogs)
  .where(and(eq(aiUsageLogs.userId, userId), eq(aiUsageLogs.scene, "chat")))
  .groupBy(aiUsageLogs.conversationCategory);
```

---

## 🎨 可视化建议

### 饼图 - 对话分类分布

```typescript
// 数据格式
const pieData = [
  { name: "技术支持", value: 35 },
  { name: "通用聊天", value: 25 },
  { name: "代码审查", value: 20 },
  { name: "学习教程", value: 15 },
  { name: "其他", value: 5 },
];
```

### 柱状图 - 各分类tokens使用量

```typescript
// 数据格式
const barData = [
  { category: "技术支持", tokens: 15000 },
  { category: "代码审查", tokens: 12000 },
  { category: "通用聊天", tokens: 8000 },
  // ...
];
```

### 折线图 - 分类使用趋势

```typescript
// 数据格式
const lineData = [
  { date: "2025-01-01", technical_support: 5, code_review: 3 },
  { date: "2025-01-02", technical_support: 8, code_review: 4 },
  // ...
];
```

---

## 🚀 迁移步骤

### 1. 执行数据库迁移

```bash
# 生成迁移文件
pnpm drizzle-kit generate

# 推送到数据库
pnpm drizzle-kit push
```

### 2. 更新现有代码

在所有调用 `recordAiApiCall` 的地方添加分类参数：

```typescript
// 之前
await recordAiApiCall(userId, "chat", requestData, responseData);

// 之后
await recordAiApiCall(userId, "chat", requestData, responseData, {
  conversationCategory: "general_chat", // 新增
  conversationTags: ["greeting"], // 新增
});
```

### 3. 更新现有数据（可选）

如果有历史数据，可以批量设置默认分类：

```typescript
// 将所有chat场景的记录设置为general_chat
await db
  .update(aiUsageLogs)
  .set({ conversationCategory: "general_chat" })
  .where(
    and(
      eq(aiUsageLogs.scene, "chat"),
      isNull(aiUsageLogs.conversationCategory),
    ),
  );
```

---

## 📚 完整文档

| 文档                                                                         | 说明             |
| ---------------------------------------------------------------------------- | ---------------- |
| [aiUsage.ts](../src/lib/drizzle/schema/aiUsage.ts)                           | 数据库Schema定义 |
| [aiUsageService.example.ts](../src/lib/services/aiUsageService.example.ts)   | 服务层示例代码   |
| [ai-usage-database-schema.md](./ai-usage-database-schema.md)                 | 完整数据库方案   |
| [ai-usage-conversation-categories.md](./ai-usage-conversation-categories.md) | 对话分类详细说明 |
| [ai-usage-database-diagram.md](./ai-usage-database-diagram.md)               | ER图和流程图     |
| [ai-usage-quick-start.md](./ai-usage-quick-start.md)                         | 快速开始指南     |

---

## 💡 最佳实践

### 1. 选择合适的分类

```typescript
// ✅ 好的做法：明确的分类
conversationCategory: "technical_support";

// ❌ 不好的做法：不确定时留空
conversationCategory: undefined;

// ✅ 更好的做法：不确定时使用general_chat
conversationCategory: "general_chat";
```

### 2. 合理使用标签

```typescript
// ✅ 好的做法：简洁明了的标签
conversationTags: ["react", "performance", "urgent"];

// ❌ 不好的做法：过多或重复的标签
conversationTags: [
  "react",
  "reactjs",
  "react.js",
  "frontend",
  "web",
  "javascript",
  "js",
];
```

### 3. 自动分类

可以使用关键词或AI自动识别分类：

```typescript
function autoDetectCategory(message: string): string {
  const keywords = {
    technical_support: ["bug", "error", "问题", "报错"],
    code_review: ["审查", "review", "代码"],
    translation_service: ["翻译", "translate"],
  };

  for (const [category, words] of Object.entries(keywords)) {
    if (words.some((word) => message.includes(word))) {
      return category;
    }
  }

  return "general_chat";
}
```

---

## 🎯 总结

通过添加**对话分类**功能，你现在可以：

✅ **精确追踪** - 了解用户具体在做什么  
✅ **细化分析** - 区分不同类型对话的使用模式  
✅ **成本优化** - 识别高成本的对话类型  
✅ **体验提升** - 根据分类优化AI响应策略  
✅ **数据洞察** - 生成更有价值的使用报告

开始使用对话分类，让你的AI使用数据更有价值！🚀

---

## 📞 需要帮助？

如果在使用过程中遇到问题，可以：

1. 查看 [对话分类详细文档](./ai-usage-conversation-categories.md)
2. 查看 [快速开始指南](./ai-usage-quick-start.md)
3. 查看代码示例：[aiUsageService.example.ts](../src/lib/services/aiUsageService.example.ts)
