# AI请求函数优化完成 ✅

## 📋 更新概览

已成功优化AI请求函数，集成了自动使用记录功能。现在每次AI请求都会自动记录到数据库，包括tokens使用量、成本、场景分类等详细信息。

---

## 🎯 主要改进

### 1. **创建了AI使用记录服务**

📁 `src/lib/services/aiUsageService.ts`

- ✅ `recordSuccessfulAiCall()` - 记录成功的AI调用
- ✅ `recordFailedAiCall()` - 记录失败的AI调用
- ✅ `getUserAiUsageLogs()` - 查询用户使用日志
- ✅ `getUserAiUsageStatistics()` - 查询用户统计数据
- ✅ `getUserTotalStatistics()` - 查询用户总统计
- ✅ 自动计算成本（基于302.ai定价）
- ✅ 自动更新每日统计数据

### 2. **优化了AI请求函数**

📁 `src/lib/ai-client.ts`

**新增参数：**

```typescript
interface AIRequestOptions {
  // ... 原有参数 ...

  // 使用记录参数（可选）
  userId?: string; // 用户ID
  scene?: AiUsageScene; // 使用场景
  conversationCategory?: AiConversationCategory; // 对话分类
  conversationTags?: string[]; // 对话标签
  sceneDescription?: string; // 场景描述
  ipAddress?: string; // IP地址
  userAgent?: string; // 用户代理
  enableUsageTracking?: boolean; // 是否启用追踪
}
```

**自动功能：**

- ✅ 自动记录成功的AI调用
- ✅ 自动记录失败的AI调用
- ✅ 自动计算请求耗时
- ✅ 自动提取tokens使用量
- ✅ 自动计算成本
- ✅ 异步记录，不阻塞主流程
- ✅ 记录失败不影响AI请求

### 3. **升级了Chat API路由**

📁 `src/app/api/chat/route.ts`

**新增功能：**

- ✅ 自动获取当前用户（如果已登录）
- ✅ 支持场景和分类参数
- ✅ 支持自定义标签
- ✅ 自动记录IP和User-Agent
- ✅ 返回是否记录了使用情况

**新增请求参数：**

```typescript
{
  message: string;           // 消息内容（必填）
  model?: string;            // AI模型（可选）
  scene?: string;            // 使用场景（可选）
  category?: string;         // 对话分类（可选）
  tags?: string[];           // 标签（可选）
  description?: string;      // 场景描述（可选）
}
```

### 4. **创建了完整文档**

📁 `docs/ai-usage-integration-guide.md`

包含：

- 📖 快速开始指南
- 📖 基础用法示例
- 📖 高级用法示例
- 📖 API路由集成示例
- 📖 前端集成示例
- 📖 最佳实践
- 📖 常见问题解答

---

## 🚀 快速使用

### 基础用法（不记录）

```typescript
import { requestAI } from "@/lib/ai-client";

const result = await requestAI({
  content: "你好，世界！",
  apiKey: process.env.TD_AGENT_API_KEY!,
});
```

### 带记录的用法

```typescript
import { requestAI } from "@/lib/ai-client";

const result = await requestAI({
  content: "帮我审查这段代码...",
  apiKey: process.env.TD_AGENT_API_KEY!,
  userId: currentUser.id, // 提供userId即可自动记录
  scene: "code_review",
  conversationCategory: "code_review",
  conversationTags: ["typescript", "review"],
});
```

### API路由中使用

```typescript
// app/api/chat/route.ts
export async function POST(request: NextRequest) {
  const user = await authorization();
  const { message, category, tags } = await request.json();

  const result = await requestAI({
    content: message,
    apiKey: process.env.TD_AGENT_API_KEY!,
    userId: user.id, // 自动记录到数据库
    scene: "chat",
    conversationCategory: category,
    conversationTags: tags,
    ipAddress: request.headers.get("x-forwarded-for") || "unknown",
    userAgent: request.headers.get("user-agent") || "unknown",
  });

  return NextResponse.json(result);
}
```

### 前端调用

```typescript
const response = await fetch("/api/chat", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    message: "你好",
    category: "general_chat",
    tags: ["greeting"],
  }),
});

const data = await response.json();
console.log("AI回复:", data.content);
console.log("Token使用:", data.usage);
console.log("是否记录:", data.tracked);
```

---

## 📊 使用场景和分类

### 使用场景（Scene）

```typescript
type AiUsageScene =
  | "chat" // 聊天对话
  | "summary" // 内容摘要
  | "translation" // 翻译
  | "code_generation" // 代码生成
  | "text_optimization" // 文本优化
  | "question_answer" // 问答
  | "other"; // 其他
```

### 对话分类（Category）- 21种

```typescript
// 通用对话类
"general_chat"; // 通用聊天
"casual_conversation"; // 闲聊

// 工作相关类
"work_consultation"; // 工作咨询
"technical_support"; // 技术支持
"code_review"; // 代码审查
"debugging_help"; // 调试帮助
"architecture_design"; // 架构设计

// 学习教育类
"learning_tutorial"; // 学习教程
"concept_explanation"; // 概念解释
"homework_help"; // 作业辅导

// 创作类
"content_creation"; // 内容创作
"writing_assistance"; // 写作辅助
"brainstorming"; // 头脑风暴

// 数据处理类
"data_analysis"; // 数据分析
"report_generation"; // 报告生成
"document_summary"; // 文档摘要

// 语言处理类
"translation_service"; // 翻译服务
"grammar_check"; // 语法检查
"text_polishing"; // 文本润色

// 其他
"other"; // 其他
```

---

## 📈 查询使用统计

### 查询用户日志

```typescript
import { getUserAiUsageLogs } from "@/lib/services/aiUsageService";

const logs = await getUserAiUsageLogs(userId, {
  startDate: new Date("2025-01-01"),
  endDate: new Date("2025-12-31"),
  scene: "chat",
  limit: 100,
  offset: 0,
});

logs.forEach((log) => {
  console.log(`场景: ${log.scene}`);
  console.log(`分类: ${log.conversationCategory}`);
  console.log(`Tokens: ${log.totalTokens}`);
  console.log(`成本: $${log.estimatedCost}`);
});
```

### 查询每日统计

```typescript
import { getUserAiUsageStatistics } from "@/lib/services/aiUsageService";

const stats = await getUserAiUsageStatistics(userId, {
  startDate: "2025-01-01",
  endDate: "2025-12-31",
  limit: 30,
});

stats.forEach((stat) => {
  console.log(`日期: ${stat.date}`);
  console.log(`总请求: ${stat.totalRequests}`);
  console.log(`成功: ${stat.successRequests}`);
  console.log(`失败: ${stat.failedRequests}`);
  console.log(`总Tokens: ${stat.totalTokens}`);
  console.log(`总成本: $${stat.totalCost}`);
  console.log(`场景分布:`, stat.sceneStats);
  console.log(`分类分布:`, stat.categoryStats);
});
```

### 查询总统计

```typescript
import { getUserTotalStatistics } from "@/lib/services/aiUsageService";

const total = await getUserTotalStatistics(userId);

console.log(`总请求次数: ${total.totalRequests}`);
console.log(`成功次数: ${total.successRequests}`);
console.log(`失败次数: ${total.failedRequests}`);
console.log(`总Tokens: ${total.totalTokens}`);
console.log(`总成本: $${total.totalCost}`);
```

---

## 🎨 前端组件示例

### React聊天组件

```tsx
"use client";

import { useState } from "react";
import { Button, Input, Select, message } from "antd";

const categories = [
  { value: "general_chat", label: "💬 通用聊天" },
  { value: "technical_support", label: "🔧 技术支持" },
  { value: "code_review", label: "👨‍💻 代码审查" },
  { value: "learning_tutorial", label: "📚 学习教程" },
];

export default function ChatInterface() {
  const [input, setInput] = useState("");
  const [category, setCategory] = useState("general_chat");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState("");

  const handleSubmit = async () => {
    if (!input.trim()) {
      message.warning("请输入消息");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: input,
          category,
          tags: ["chat"],
        }),
      });

      const data = await res.json();

      if (data.success) {
        setResponse(data.content);
        message.success("请求成功");

        // 显示使用情况
        if (data.usage) {
          console.log("Token使用:", data.usage);
        }
        if (data.tracked) {
          console.log("✅ 已记录使用情况");
        }
      } else {
        message.error(data.error || "请求失败");
      }
    } catch (error) {
      message.error("网络错误");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 p-4">
      <Select
        value={category}
        onChange={setCategory}
        options={categories}
        className="w-full"
      />

      <Input.TextArea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="输入消息..."
        rows={4}
      />

      <Button type="primary" onClick={handleSubmit} loading={loading} block>
        发送
      </Button>

      {response && (
        <div className="mt-4 rounded bg-gray-50 p-4">
          <p className="whitespace-pre-wrap">{response}</p>
        </div>
      )}
    </div>
  );
}
```

---

## ✨ 核心特性

### 1. 自动记录

- ✅ 提供userId即可自动记录
- ✅ 成功和失败都会记录
- ✅ 自动提取tokens和成本
- ✅ 自动计算请求耗时

### 2. 异步处理

- ✅ 记录操作异步执行
- ✅ 不阻塞AI请求主流程
- ✅ 记录失败不影响结果

### 3. 灵活配置

- ✅ 支持禁用追踪
- ✅ 支持自定义场景和分类
- ✅ 支持添加标签
- ✅ 支持场景描述

### 4. 完整统计

- ✅ 详细的使用日志
- ✅ 每日统计汇总
- ✅ 总体统计数据
- ✅ 多维度分析

### 5. 成本追踪

- ✅ 自动计算每次调用成本
- ✅ 基于302.ai定价
- ✅ 支持自定义定价
- ✅ 精确到小数点后6位

---

## 🔧 配置说明

### 环境变量

```bash
# .env.local
TD_AGENT_API_KEY=your-302ai-api-key
```

### 数据库迁移

```bash
# 生成迁移文件
pnpm drizzle-kit generate

# 推送到数据库
pnpm drizzle-kit push
```

---

## 📚 相关文档

| 文档                                              | 说明                 |
| ------------------------------------------------- | -------------------- |
| [集成指南](./ai-usage-integration-guide.md)       | 详细的集成教程和示例 |
| [数据库设计](./ai-usage-database-schema.md)       | 数据库表结构设计     |
| [对话分类](./ai-usage-conversation-categories.md) | 21种对话分类说明     |
| [快速开始](./ai-usage-quick-start.md)             | 5分钟快速上手        |
| [ER图](./ai-usage-database-diagram.md)            | 数据库ER图和流程图   |

---

## 🎯 下一步建议

### 1. 创建用户仪表板

展示个人AI使用情况：

- 今日/本月使用量
- Token消耗趋势
- 成本统计
- 对话分类分布

### 2. 创建管理后台

全局数据分析：

- 所有用户使用统计
- 热门场景分析
- 成本分析
- 异常检测

### 3. 实施配额限制

基于使用统计：

- 每日请求限制
- Token配额管理
- 成本预警
- 超额提醒

### 4. 优化AI模型选择

数据驱动决策：

- 分析不同场景的模型效果
- 优化模型选择策略
- 降低成本
- 提升体验

---

## ⚠️ 注意事项

### 1. 用户隐私

- ✅ 请求和响应数据存储在JSONB字段中
- ⚠️ 注意不要记录敏感信息
- ⚠️ 遵守数据保护法规
- ⚠️ 提供数据删除功能

### 2. 性能考虑

- ✅ 使用记录是异步的，不影响性能
- ✅ 统计表加速查询
- ✅ 合理的索引设计
- ⚠️ 定期清理旧数据

### 3. 成本计算

- ✅ 定价表需要定期更新
- ⚠️ 不同模型价格不同
- ⚠️ 实际成本可能有偏差
- ⚠️ 仅供参考，以实际账单为准

### 4. 错误处理

- ✅ 记录失败不影响AI请求
- ✅ 错误会打印到控制台
- ⚠️ 需要监控记录失败率
- ⚠️ 定期检查数据完整性

---

## 🎉 总结

通过本次优化，AI请求函数现在具备了：

✅ **自动追踪** - 每次调用自动记录  
✅ **详细统计** - 多维度数据分析  
✅ **成本计算** - 精确的成本追踪  
✅ **性能监控** - 请求耗时记录  
✅ **灵活配置** - 支持多种使用场景  
✅ **无侵入性** - 不影响原有功能  
✅ **易于使用** - 简单的API设计  
✅ **完整文档** - 详细的使用指南

开始使用吧！🚀

---

## 📞 技术支持

如有问题，请查看：

- [集成指南](./ai-usage-integration-guide.md)
- [常见问题](./ai-usage-integration-guide.md#常见问题)
- 或联系开发团队

---

**更新时间**: 2025-10-28  
**版本**: 1.0.0
