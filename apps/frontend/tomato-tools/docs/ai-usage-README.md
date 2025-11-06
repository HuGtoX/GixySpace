# AI使用记录数据库方案 - 文档导航

## 📚 文档概览

本目录包含了番茄工具箱AI使用记录数据库方案的完整文档。

---

## 🗂️ 文档列表

### 核心文档

| 文档                                                     | 说明                   | 适合人群             |
| -------------------------------------------------------- | ---------------------- | -------------------- |
| [📖 数据库方案](./ai-usage-database-schema.md)           | 完整的数据库表结构设计 | 所有开发者           |
| [🚀 快速开始](./ai-usage-quick-start.md)                 | 5分钟快速上手指南      | 新手开发者           |
| [💬 对话分类设计](./ai-usage-conversation-categories.md) | 对话分类的详细说明     | 需要细化追踪的开发者 |
| [📊 ER图和流程图](./ai-usage-database-diagram.md)        | 可视化的数据库设计     | 架构师、技术负责人   |

### 更新文档

| 文档                                                              | 说明                     | 适合人群               |
| ----------------------------------------------------------------- | ------------------------ | ---------------------- |
| [🆕 对话分类功能更新](./ai-usage-update-conversation-category.md) | 对话分类功能的更新说明   | 已使用旧版本的开发者   |
| [⭐ AI请求函数优化](./ai-usage-optimization-summary.md)           | AI请求函数优化完成总结   | 所有开发者             |
| [📘 集成指南](./ai-usage-integration-guide.md)                    | 详细的集成教程和最佳实践 | 需要集成AI功能的开发者 |
| [🔧 数据库迁移指南](./ai-usage-migration-guide.md)                | 数据库迁移和枚举更新指南 | 遇到枚举错误的开发者   |

---

## 🎯 快速导航

### 我想...

#### 📖 了解整体方案

→ 阅读 [数据库方案](./ai-usage-database-schema.md)

#### 🚀 快速开始使用

→ 阅读 [快速开始指南](./ai-usage-quick-start.md)

#### 💬 了解对话分类

→ 阅读 [对话分类设计文档](./ai-usage-conversation-categories.md)

#### 📊 查看数据库结构图

→ 阅读 [ER图和流程图](./ai-usage-database-diagram.md)

#### 🔄 从旧版本升级

→ 阅读 [对话分类功能更新](./ai-usage-update-conversation-category.md)

---

## 📋 方案特点

### ✨ 核心功能

- ✅ **完整记录** - 记录每次AI调用的详细信息
- ✅ **双层分类** - 场景 + 对话分类的双层体系
- ✅ **灵活标签** - 支持自定义标签
- ✅ **成本追踪** - 精确计算每次调用的成本
- ✅ **性能优化** - 合理的索引设计
- ✅ **统计汇总** - 按日期自动汇总统计数据

### 🎯 使用场景

1. **用户行为分析** - 了解用户如何使用AI功能
2. **成本管理** - 追踪和控制AI使用成本
3. **性能监控** - 监控API响应时间和成功率
4. **配额管理** - 实现用户使用配额限制
5. **数据报告** - 生成详细的使用报告

---

## 🗄️ 数据库表结构

### 主要表

#### 1. ai_usage_logs（AI使用日志表）

记录每次AI API调用的详细信息。

**关键字段：**

- 用户信息（user_id）
- 使用场景（scene）
- 对话分类（conversation_category）⭐ 新增
- 对话标签（conversation_tags）⭐ 新增
- Tokens使用量（prompt_tokens, completion_tokens, total_tokens）
- 预估成本（estimated_cost）
- 请求/响应数据（request_data, response_data）
- 请求状态（status）
- 性能指标（duration）

#### 2. ai_usage_statistics（AI使用统计表）

按日期汇总用户的AI使用情况。

**关键字段：**

- 请求统计（total_requests, success_requests, failed_requests）
- Tokens统计（total_tokens）
- 成本统计（total_cost）
- 场景分布（scene_stats）
- 分类分布（category_stats）⭐ 新增
- 模型分布（model_stats）

---

## 🎨 分类体系

### 使用场景（Scene）- 7种

粗粒度分类，描述AI的主要用途：

- `chat` - 聊天对话
- `summary` - 内容摘要
- `translation` - 翻译
- `code_generation` - 代码生成
- `text_optimization` - 文本优化
- `question_answer` - 问答
- `other` - 其他

### 对话分类（Conversation Category）- 21种 ⭐

细粒度分类，描述具体的对话类型：

**通用对话类（2种）**

- general_chat, casual_conversation

**工作相关类（5种）**

- work_consultation, technical_support, code_review, debugging_help, architecture_design

**学习教育类（3种）**

- learning_tutorial, concept_explanation, homework_help

**创作类（3种）**

- content_creation, writing_assistance, brainstorming

**数据处理类（3种）**

- data_analysis, report_generation, document_summary

**语言处理类（3种）**

- translation_service, grammar_check, text_polishing

**其他（1种）**

- other

> 💡 详细说明请查看 [对话分类设计文档](./ai-usage-conversation-categories.md)

---

## 💻 代码示例

### 基础使用

```typescript
import { recordAiApiCall } from "@/lib/services/aiUsageService.example";

// 记录AI调用
await recordAiApiCall(
  userId,
  "chat", // 场景
  requestData,
  responseData,
  {
    conversationCategory: "technical_support", // 对话分类
    conversationTags: ["react", "bug"], // 标签
    ipAddress: "192.168.1.1",
    userAgent: "Mozilla/5.0...",
    duration: 2500,
  },
);
```

### 查询统计

```typescript
import { getUserAiUsageStatistics } from "@/lib/services/aiUsageService.example";

// 查询最近30天的统计
const stats = await getUserAiUsageStatistics(userId, {
  startDate: "2025-01-01",
  limit: 30,
});

// 查看分类分布
stats.forEach((stat) => {
  console.log("对话分类分布:", stat.categoryStats);
  // 输出：{ "technical_support": 8, "code_review": 5, ... }
});
```

---

## 🚀 快速开始

### 1. 执行数据库迁移

```bash
pnpm drizzle-kit generate
pnpm drizzle-kit push
```

### 2. 在API中记录使用

```typescript
// app/api/chat/route.ts
export async function POST(request: Request) {
  const startTime = Date.now();

  // 调用AI API
  const response = await callAiApi(...);

  // 记录使用情况
  await recordAiApiCall(userId, "chat", requestData, response, {
    conversationCategory: "general_chat",
    duration: Date.now() - startTime,
  });

  return Response.json(response);
}
```

### 3. 查询和展示

```typescript
// 查询用户使用日志
const logs = await getUserAiUsageLogs(userId, {
  limit: 50,
});

// 查询统计数据
const totalStats = await getUserTotalStatistics(userId);
console.log(`总tokens: ${totalStats.totalTokens}`);
console.log(`总成本: $${totalStats.totalCost}`);
```

---

## 📊 数据分析示例

### 按分类统计使用量

```typescript
const categoryStats = await db
  .select({
    category: aiUsageLogs.conversationCategory,
    count: sql<number>`COUNT(*)`,
    totalTokens: sql<number>`SUM(${aiUsageLogs.totalTokens})`,
  })
  .from(aiUsageLogs)
  .where(eq(aiUsageLogs.userId, userId))
  .groupBy(aiUsageLogs.conversationCategory);
```

### 识别高成本对话类型

```typescript
const costByCategory = await db
  .select({
    category: aiUsageLogs.conversationCategory,
    totalCost: sql<number>`SUM(${aiUsageLogs.estimatedCost})`,
  })
  .from(aiUsageLogs)
  .groupBy(aiUsageLogs.conversationCategory)
  .orderBy(desc(sql`SUM(${aiUsageLogs.estimatedCost})`));
```

---

## 📁 相关文件

### 数据库Schema

- [aiUsage.ts](../src/lib/drizzle/schema/aiUsage.ts) - AI使用记录表定义
- [schema.ts](../src/lib/drizzle/schema/schema.ts) - 主Schema文件

### 服务层

- [aiUsageService.example.ts](../src/lib/services/aiUsageService.example.ts) - 服务层示例代码

### 文档

- [ai-usage-database-schema.md](./ai-usage-database-schema.md) - 完整数据库方案
- [ai-usage-conversation-categories.md](./ai-usage-conversation-categories.md) - 对话分类详细说明
- [ai-usage-database-diagram.md](./ai-usage-database-diagram.md) - ER图和流程图
- [ai-usage-quick-start.md](./ai-usage-quick-start.md) - 快速开始指南
- [ai-usage-update-conversation-category.md](./ai-usage-update-conversation-category.md) - 对话分类功能更新说明

---

## 🔧 技术栈

- **数据库**: PostgreSQL
- **ORM**: Drizzle ORM
- **语言**: TypeScript
- **框架**: Next.js 15

---

## 💡 最佳实践

### 1. 异步记录日志

```typescript
// 不要等待日志记录完成，避免影响API响应速度
recordAiApiCall(...).catch(err => console.error(err));
```

### 2. 定期清理旧数据

```typescript
// 清理90天前的详细日志，保留统计数据
await db
  .delete(aiUsageLogs)
  .where(
    lte(aiUsageLogs.createdAt, new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)),
  );
```

### 3. 实现配额管理

```typescript
// 检查用户今日使用量
const todayStats = await getUserAiUsageStatistics(userId, {
  startDate: new Date().toISOString().split("T")[0],
});

if (todayStats[0]?.totalTokens > USER_DAILY_QUOTA) {
  throw new Error("Daily quota exceeded");
}
```

---

## 🎯 应用场景

### 1. 用户仪表板

展示用户的AI使用情况：

- 今日/本月使用量
- Tokens消耗趋势
- 成本统计
- 对话分类分布

### 2. 管理后台

管理员查看全局统计：

- 总体使用趋势
- 热门对话类型
- 成本分析
- 异常使用检测

### 3. 成本优化

基于数据优化成本：

- 识别高成本场景
- 优化模型选择
- 实施配额限制
- 成本预警

### 4. 产品优化

基于使用数据改进产品：

- 了解用户需求
- 优化功能设计
- 提升用户体验
- 发现新机会

---

## 📞 需要帮助？

### 常见问题

**Q: 如何选择合适的对话分类？**  
A: 查看 [对话分类设计文档](./ai-usage-conversation-categories.md) 中的详细说明和示例。

**Q: 如何计算AI调用成本？**  
A: 参考 [数据库方案](./ai-usage-database-schema.md) 中的成本计算部分。

**Q: 如何实现配额限制？**  
A: 参考 [快速开始指南](./ai-usage-quick-start.md) 中的配额管理示例。

### 获取支持

1. 查看相关文档
2. 查看代码示例
3. 查看测试用例

---

## 🎉 开始使用

选择适合你的文档开始：

- 🆕 **新用户** → [快速开始指南](./ai-usage-quick-start.md)
- 📖 **详细了解** → [数据库方案](./ai-usage-database-schema.md)
- 💬 **使用分类** → [对话分类设计](./ai-usage-conversation-categories.md)
- 🔄 **版本升级** → [对话分类功能更新](./ai-usage-update-conversation-category.md)

祝你使用愉快！🚀
