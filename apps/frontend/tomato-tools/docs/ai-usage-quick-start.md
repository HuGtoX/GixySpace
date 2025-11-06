# AI使用记录 - 快速开始指南

## 🚀 快速开始

### 1. 执行数据库迁移

```bash
# 生成迁移文件
pnpm drizzle-kit generate

# 应用迁移到数据库
pnpm drizzle-kit push
```

### 2. 在API路由中集成

创建一个API路由来处理AI请求并记录使用情况：

```typescript
// app/api/ai/chat/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  recordAiApiCall,
  recordFailedAiApiCall,
} from "@/lib/services/aiUsageService.example";

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  const userId = req.headers.get("x-user-id"); // 从认证中获取

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { messages, model = "deepseek-chat" } = body;

    // 调用302.ai API
    const response = await fetch("https://api.302.ai/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.AI_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages,
        stream: false,
      }),
    });

    const data = await response.json();
    const duration = Date.now() - startTime;

    // 记录成功的AI调用
    await recordAiApiCall(userId, "chat", { model, messages }, data, {
      ipAddress: req.ip || req.headers.get("x-forwarded-for") || "unknown",
      userAgent: req.headers.get("user-agent") || "unknown",
      duration,
    });

    return NextResponse.json(data);
  } catch (error: any) {
    const duration = Date.now() - startTime;

    // 记录失败的AI调用
    await recordFailedAiApiCall(
      userId,
      "chat",
      { model: "deepseek-chat", messages: [] },
      error,
      {
        ipAddress: req.ip || req.headers.get("x-forwarded-for") || "unknown",
        userAgent: req.headers.get("user-agent") || "unknown",
        duration,
      },
    );

    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

### 3. 创建统计查询API

```typescript
// app/api/ai/usage/stats/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  getUserAiUsageStatistics,
  getUserTotalStatistics,
} from "@/lib/services/aiUsageService.example";

export async function GET(req: NextRequest) {
  const userId = req.headers.get("x-user-id");

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = req.nextUrl.searchParams;
  const days = parseInt(searchParams.get("days") || "30");

  try {
    // 获取最近N天的统计
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    const [dailyStats, totalStats] = await Promise.all([
      getUserAiUsageStatistics(userId, { startDate, limit: days }),
      getUserTotalStatistics(userId),
    ]);

    return NextResponse.json({
      dailyStats,
      totalStats,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

### 4. 创建使用日志查询API

```typescript
// app/api/ai/usage/logs/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getUserAiUsageLogs } from "@/lib/services/aiUsageService.example";

export async function GET(req: NextRequest) {
  const userId = req.headers.get("x-user-id");

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = req.nextUrl.searchParams;
  const scene = searchParams.get("scene") || undefined;
  const limit = parseInt(searchParams.get("limit") || "50");
  const offset = parseInt(searchParams.get("offset") || "0");

  try {
    const logs = await getUserAiUsageLogs(userId, {
      scene,
      limit,
      offset,
    });

    return NextResponse.json({ logs });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

### 5. 前端集成示例

#### 调用AI API

```typescript
// hooks/useAiChat.ts
import { useState } from "react";

export function useAiChat() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = async (message: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [{ role: "user", content: message }],
          model: "deepseek-chat",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { sendMessage, loading, error };
}
```

#### 查询使用统计

```typescript
// hooks/useAiUsageStats.ts
import { useState, useEffect } from "react";

interface DailyStats {
  date: string;
  totalRequests: number;
  totalTokens: number;
  totalCost: string;
}

interface TotalStats {
  totalRequests: number;
  totalTokens: number;
  totalCost: number;
}

export function useAiUsageStats(days: number = 30) {
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [totalStats, setTotalStats] = useState<TotalStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`/api/ai/usage/stats?days=${days}`);
        const data = await response.json();
        setDailyStats(data.dailyStats);
        setTotalStats(data.totalStats);
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [days]);

  return { dailyStats, totalStats, loading };
}
```

#### 展示统计数据

```typescript
// components/AiUsageStats.tsx
"use client";

import { useAiUsageStats } from "@/hooks/useAiUsageStats";
import { Card, Statistic, Row, Col, Spin } from "antd";

export function AiUsageStats() {
  const { dailyStats, totalStats, loading } = useAiUsageStats(30);

  if (loading) {
    return <Spin size="large" />;
  }

  return (
    <div className="space-y-4">
      <Row gutter={16}>
        <Col span={8}>
          <Card>
            <Statistic
              title="总请求次数"
              value={totalStats?.totalRequests || 0}
              suffix="次"
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="总Tokens使用"
              value={totalStats?.totalTokens || 0}
              suffix="tokens"
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="总成本"
              value={totalStats?.totalCost || 0}
              prefix="$"
              precision={4}
            />
          </Card>
        </Col>
      </Row>

      <Card title="最近30天使用趋势">
        {/* 这里可以集成图表库，如 recharts 或 echarts */}
        <div className="space-y-2">
          {dailyStats.map((stat) => (
            <div key={stat.date} className="flex justify-between">
              <span>{stat.date}</span>
              <span>{stat.totalTokens} tokens</span>
              <span>${stat.totalCost}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
```

### 6. 配置环境变量

在 `.env.local` 文件中添加：

```env
# 数据库连接
DATABASE_URL=postgresql://user:password@localhost:5432/tomato_tools

# 302.ai API密钥
AI_API_KEY=your_302ai_api_key_here
```

## 📊 使用场景示例

### 场景1：聊天对话

```typescript
await recordAiApiCall(
  userId,
  "chat",
  {
    model: "deepseek-chat",
    messages: [{ role: "user", content: "你好，请介绍一下自己" }],
  },
  responseData,
  { ipAddress, userAgent, duration },
);
```

### 场景2：内容摘要

```typescript
await recordAiApiCall(
  userId,
  "summary",
  {
    model: "deepseek-chat",
    messages: [
      {
        role: "user",
        content: "请总结以下内容：...",
      },
    ],
  },
  responseData,
  { ipAddress, userAgent, duration },
);
```

### 场景3：代码生成

```typescript
await recordAiApiCall(
  userId,
  "code_generation",
  {
    model: "deepseek-chat",
    messages: [
      {
        role: "user",
        content: "请帮我写一个React组件",
      },
    ],
  },
  responseData,
  { ipAddress, userAgent, duration },
);
```

## 🔍 常见问题

### Q1: 如何处理流式响应？

```typescript
// 对于流式响应，需要在流结束后记录
let fullResponse = "";
const stream = await fetch("https://api.302.ai/chat/completions", {
  // ... 配置 stream: true
});

const reader = stream.body?.getReader();
// 读取流并累积响应
// ...

// 流结束后记录
await recordAiApiCall(userId, scene, requestData, {
  choices: [{ message: { content: fullResponse } }],
  usage: {
    /* tokens信息 */
  },
});
```

### Q2: 如何实现配额限制？

```typescript
// 在API路由中添加配额检查
const todayStats = await getUserAiUsageStatistics(userId, {
  startDate: new Date().toISOString().split("T")[0],
  limit: 1,
});

const DAILY_QUOTA = 100000; // 每日10万tokens
if (todayStats[0]?.totalTokens >= DAILY_QUOTA) {
  return NextResponse.json({ error: "Daily quota exceeded" }, { status: 429 });
}
```

### Q3: 如何优化查询性能？

```typescript
// 使用缓存减少数据库查询
import { cache } from "react";

export const getCachedUserStats = cache(async (userId: string) => {
  return await getUserTotalStatistics(userId);
});
```

## 📚 下一步

- 查看 [完整文档](./ai-usage-database-schema.md)
- 查看 [ER图和流程图](./ai-usage-database-diagram.md)
- 查看 [服务示例代码](../src/lib/services/aiUsageService.example.ts)

## 🤝 贡献

如有问题或建议，欢迎提交Issue或PR！
