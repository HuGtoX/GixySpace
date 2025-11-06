# AI使用记录集成指南

本指南介绍如何在番茄工具箱项目中使用AI请求函数并自动记录使用情况。

## 📋 目录

- [快速开始](#快速开始)
- [基础用法](#基础用法)
- [高级用法](#高级用法)
- [API路由集成](#api路由集成)
- [前端集成](#前端集成)
- [最佳实践](#最佳实践)
- [常见问题](#常见问题)

---

## 🚀 快速开始

### 1. 基础AI请求（不记录使用情况）

```typescript
import { requestAI } from "@/lib/ai-client";

// 简单的AI请求，不记录使用情况
const result = await requestAI({
  content: "你好，请介绍一下TypeScript",
  apiKey: process.env.TD_AGENT_API_KEY!,
});

if (result.success) {
  console.log("AI回复:", result.content);
} else {
  console.error("请求失败:", result.error);
}
```

### 2. 带使用记录的AI请求

```typescript
import { requestAI } from "@/lib/ai-client";

// 带使用记录的AI请求
const result = await requestAI({
  content: "帮我审查这段代码...",
  apiKey: process.env.TD_AGENT_API_KEY!,
  userId: "user-uuid-here", // 提供userId即可自动记录
  scene: "code_review", // 使用场景
  conversationCategory: "code_review", // 对话分类
  conversationTags: ["typescript", "review"], // 标签
  sceneDescription: "用户请求代码审查",
});
```

---

## 📖 基础用法

### 请求参数说明

```typescript
interface AIRequestOptions {
  // ===== 必填参数 =====
  content: string; // AI请求内容
  apiKey: string; // 302.ai API密钥

  // ===== 可选参数 =====
  model?: string; // AI模型，默认："302-agent-todo-summary-gixy"
  timeout?: number; // 超时时间（毫秒），默认：30000
  headers?: Record<string, string>; // 自定义请求头

  // ===== 使用记录参数（可选） =====
  userId?: string; // 用户ID，提供后自动记录使用情况
  scene?: AiUsageScene; // 使用场景
  conversationCategory?: AiConversationCategory; // 对话分类
  conversationTags?: string[]; // 对话标签
  sceneDescription?: string; // 场景描述
  ipAddress?: string; // 用户IP地址
  userAgent?: string; // 用户代理
  enableUsageTracking?: boolean; // 是否启用追踪，默认：true
}
```

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

### 对话分类（Category）

```typescript
type AiConversationCategory =
  // 通用对话类
  | "general_chat" // 通用聊天
  | "casual_conversation" // 闲聊

  // 工作相关类
  | "work_consultation" // 工作咨询
  | "technical_support" // 技术支持
  | "code_review" // 代码审查
  | "debugging_help" // 调试帮助
  | "architecture_design" // 架构设计

  // 学习教育类
  | "learning_tutorial" // 学习教程
  | "concept_explanation" // 概念解释
  | "homework_help" // 作业辅导

  // 创作类
  | "content_creation" // 内容创作
  | "writing_assistance" // 写作辅助
  | "brainstorming" // 头脑风暴

  // 数据处理类
  | "data_analysis" // 数据分析
  | "report_generation" // 报告生成
  | "document_summary" // 文档摘要

  // 语言处理类
  | "translation_service" // 翻译服务
  | "grammar_check" // 语法检查
  | "text_polishing" // 文本润色
  | "other"; // 其他
```

---

## 🎯 高级用法

### 1. 完整参数示例

```typescript
import { requestAI } from "@/lib/ai-client";

const result = await requestAI({
  // 基础参数
  content: "请帮我分析这段代码的性能问题...",
  apiKey: process.env.TD_AGENT_API_KEY!,
  model: "deepseek-chat",
  timeout: 60000, // 60秒超时

  // 使用记录参数
  userId: currentUser.id,
  scene: "code_review",
  conversationCategory: "debugging_help",
  conversationTags: ["performance", "optimization", "urgent"],
  sceneDescription: "用户报告代码性能问题，需要优化建议",
  ipAddress: request.headers.get("x-forwarded-for") || "unknown",
  userAgent: request.headers.get("user-agent") || "unknown",
});

if (result.success) {
  console.log("AI分析结果:", result.content);
  console.log("Token使用:", result.data?.usage);
} else {
  console.error("分析失败:", result.error);
}
```

### 2. 禁用使用记录

```typescript
// 即使提供了userId，也不记录使用情况
const result = await requestAI({
  content: "测试请求",
  apiKey: process.env.TD_AGENT_API_KEY!,
  userId: currentUser.id,
  enableUsageTracking: false, // 禁用追踪
});
```

### 3. 使用默认API密钥

```typescript
import { requestAIWithDefaultKey } from "@/lib/ai-client";

// 自动从环境变量读取API密钥
const result = await requestAIWithDefaultKey(
  "你好，世界！",
  "deepseek-chat", // 可选的模型名称
);
```

---

## 🔌 API路由集成

### 示例：聊天API路由

```typescript
// app/api/chat/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requestAI } from "@/lib/ai-client";
import { authorization } from "@/app/api/authorization";

export async function POST(request: NextRequest) {
  try {
    // 1. 获取当前用户
    const user = await authorization();

    // 2. 解析请求数据
    const body = await request.json();
    const {
      message,
      model = "302-agent-todo-summary-gixy",
      category = "general_chat",
      tags = [],
    } = body;

    // 3. 验证参数
    if (!message || message.trim() === "") {
      return NextResponse.json({ error: "消息内容不能为空" }, { status: 400 });
    }

    // 4. 调用AI（自动记录使用情况）
    const result = await requestAI({
      content: message,
      apiKey: process.env.TD_AGENT_API_KEY!,
      model,
      userId: user.id, // 自动记录到数据库
      scene: "chat",
      conversationCategory: category,
      conversationTags: tags,
      sceneDescription: `用户聊天: ${message.substring(0, 50)}...`,
      ipAddress: request.headers.get("x-forwarded-for") || "unknown",
      userAgent: request.headers.get("user-agent") || "unknown",
    });

    // 5. 返回结果
    if (result.success) {
      return NextResponse.json({
        success: true,
        content: result.content,
        usage: result.data?.usage,
      });
    } else {
      return NextResponse.json(
        { error: result.error, details: result.details },
        { status: 500 },
      );
    }
  } catch (error: any) {
    console.error("Chat API error:", error);
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}
```

### 示例：代码审查API路由

```typescript
// app/api/code-review/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requestAI } from "@/lib/ai-client";
import { authorization } from "@/app/api/authorization";

export async function POST(request: NextRequest) {
  try {
    const user = await authorization();
    const { code, language } = await request.json();

    const prompt = `请审查以下${language}代码，指出潜在问题和改进建议：\n\n${code}`;

    const result = await requestAI({
      content: prompt,
      apiKey: process.env.TD_AGENT_API_KEY!,
      model: "deepseek-chat",
      userId: user.id,
      scene: "code_generation",
      conversationCategory: "code_review",
      conversationTags: [language, "review"],
      sceneDescription: `代码审查: ${language}`,
      ipAddress: request.headers.get("x-forwarded-for") || "unknown",
      userAgent: request.headers.get("user-agent") || "unknown",
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        review: result.content,
        usage: result.data?.usage,
      });
    } else {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

---

## 💻 前端集成

### React组件示例

```tsx
"use client";

import { useState } from "react";
import { Button, Input, Select, Tag, message } from "antd";

const categories = [
  { value: "general_chat", label: "💬 通用聊天" },
  { value: "technical_support", label: "🔧 技术支持" },
  { value: "code_review", label: "👨‍💻 代码审查" },
  { value: "learning_tutorial", label: "📚 学习教程" },
];

export default function ChatInterface() {
  const [input, setInput] = useState("");
  const [category, setCategory] = useState("general_chat");
  const [tags, setTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState("");

  const handleSubmit = async () => {
    if (!input.trim()) {
      message.warning("请输入消息内容");
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
          tags,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setResponse(data.content);
        message.success("请求成功");

        // 显示Token使用情况
        if (data.usage) {
          console.log("Token使用:", data.usage);
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
      <div>
        <label className="mb-2 block">对话分类</label>
        <Select
          value={category}
          onChange={setCategory}
          options={categories}
          className="w-full"
        />
      </div>

      <div>
        <label className="mb-2 block">标签（可选）</label>
        <Select
          mode="tags"
          value={tags}
          onChange={setTags}
          placeholder="添加标签..."
          className="w-full"
        />
      </div>

      <div>
        <label className="mb-2 block">消息内容</label>
        <Input.TextArea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="输入你的问题..."
          rows={4}
        />
      </div>

      <Button type="primary" onClick={handleSubmit} loading={loading} block>
        发送
      </Button>

      {response && (
        <div className="mt-4 rounded bg-gray-50 p-4">
          <h3 className="mb-2 font-bold">AI回复：</h3>
          <p className="whitespace-pre-wrap">{response}</p>
        </div>
      )}
    </div>
  );
}
```

---

## 🎨 最佳实践

### 1. 合理选择场景和分类

```typescript
// ✅ 好的做法：明确的场景和分类
await requestAI({
  content: "请帮我优化这段SQL查询...",
  apiKey: apiKey,
  userId: user.id,
  scene: "code_generation", // 明确场景
  conversationCategory: "debugging_help", // 具体分类
  conversationTags: ["sql", "performance"], // 相关标签
  sceneDescription: "SQL查询优化请求",
});

// ❌ 不好的做法：使用默认值
await requestAI({
  content: "请帮我优化这段SQL查询...",
  apiKey: apiKey,
  userId: user.id,
  // 没有指定场景和分类，难以统计分析
});
```

### 2. 添加有意义的标签

```typescript
// ✅ 好的做法：添加有意义的标签
conversationTags: ["urgent", "production", "bug-fix", "database"];

// ❌ 不好的做法：标签过于宽泛或无意义
conversationTags: ["test", "abc", "123"];
```

### 3. 提供场景描述

```typescript
// ✅ 好的做法：清晰的场景描述
sceneDescription: "用户报告登录功能异常，需要紧急排查";

// ❌ 不好的做法：描述过于简单
sceneDescription: "问题";
```

### 4. 错误处理

```typescript
const result = await requestAI({
  content: message,
  apiKey: apiKey,
  userId: user.id,
  scene: "chat",
});

if (result.success) {
  // 处理成功响应
  console.log("AI回复:", result.content);

  // 可以访问完整的响应数据
  if (result.data) {
    console.log("模型:", result.data.model);
    console.log("Token使用:", result.data.usage);
  }
} else {
  // 处理错误
  console.error("错误:", result.error);

  // 可以访问错误详情
  if (result.details) {
    console.error("详情:", result.details);
  }

  // 根据错误类型进行不同处理
  if (result.error?.includes("认证失败")) {
    // 处理认证错误
  } else if (result.error?.includes("请求过于频繁")) {
    // 处理限流错误
  }
}
```

### 5. 性能优化

```typescript
// 对于不需要立即响应的场景，可以使用较长的超时时间
const result = await requestAI({
  content: longDocument,
  apiKey: apiKey,
  userId: user.id,
  scene: "summary",
  timeout: 120000, // 2分钟超时
});

// 对于实时聊天场景，使用较短的超时时间
const result = await requestAI({
  content: chatMessage,
  apiKey: apiKey,
  userId: user.id,
  scene: "chat",
  timeout: 15000, // 15秒超时
});
```

---

## ❓ 常见问题

### Q1: 如何查询用户的AI使用统计？

```typescript
import {
  getUserAiUsageLogs,
  getUserAiUsageStatistics,
  getUserTotalStatistics,
} from "@/lib/services/aiUsageService";

// 查询最近30天的使用日志
const logs = await getUserAiUsageLogs(userId, {
  startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
  limit: 100,
});

// 查询每日统计
const stats = await getUserAiUsageStatistics(userId, {
  startDate: "2025-01-01",
  limit: 30,
});

// 查询总统计
const total = await getUserTotalStatistics(userId);
console.log("总请求次数:", total.totalRequests);
console.log("总Token数:", total.totalTokens);
console.log("总成本:", total.totalCost);
```

### Q2: 使用记录会影响性能吗？

不会。使用记录是异步执行的，不会阻塞AI请求的主流程。即使记录失败，也不会影响AI请求的结果。

### Q3: 如何禁用某些请求的使用记录？

```typescript
// 方法1：不提供userId
await requestAI({
  content: "测试请求",
  apiKey: apiKey,
  // 不提供userId，不会记录
});

// 方法2：显式禁用
await requestAI({
  content: "测试请求",
  apiKey: apiKey,
  userId: user.id,
  enableUsageTracking: false, // 禁用追踪
});
```

### Q4: 如何自定义成本计算？

修改 `aiUsageService.ts` 中的 `calculateCost` 函数：

```typescript
function calculateCost(
  model: string,
  promptTokens: number,
  completionTokens: number,
): number {
  // 自定义定价表
  const pricing: Record<string, { input: number; output: number }> = {
    "your-model": { input: 0.0001, output: 0.0002 },
    // 添加更多模型...
  };

  const modelPricing = pricing[model] || pricing["deepseek-chat"];
  const inputCost = (promptTokens / 1000) * modelPricing.input;
  const outputCost = (completionTokens / 1000) * modelPricing.output;

  return inputCost + outputCost;
}
```

### Q5: 如何获取用户IP和User-Agent？

在Next.js API路由中：

```typescript
export async function POST(request: NextRequest) {
  const ipAddress =
    request.headers.get("x-forwarded-for") ||
    request.headers.get("x-real-ip") ||
    "unknown";

  const userAgent = request.headers.get("user-agent") || "unknown";

  const result = await requestAI({
    content: message,
    apiKey: apiKey,
    userId: user.id,
    ipAddress,
    userAgent,
  });
}
```

---

## 📚 相关文档

- [数据库表结构设计](./ai-usage-database-schema.md)
- [对话分类详细说明](./ai-usage-conversation-categories.md)
- [快速开始指南](./ai-usage-quick-start.md)
- [ER图和流程图](./ai-usage-database-diagram.md)

---

## 🎉 总结

通过集成AI使用记录功能，你可以：

✅ **自动追踪** - 每次AI调用自动记录到数据库  
✅ **详细统计** - 按场景、分类、模型等维度统计  
✅ **成本分析** - 精确计算每次调用的成本  
✅ **性能监控** - 记录请求耗时，发现性能问题  
✅ **用户行为** - 了解用户如何使用AI功能  
✅ **无侵入性** - 记录失败不影响主流程

开始使用吧！🚀
