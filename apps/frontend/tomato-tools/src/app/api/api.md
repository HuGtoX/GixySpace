# 待办任务总结 API

提供AI驱动的待办任务总结生成服务，基于302.ai大模型API。

## 接口地址

`POST /api/todo/summary`

## 请求参数

### Body (JSON)

| 参数名         | 类型   | 必填 | 说明                                      | 示例      |
| -------------- | ------ | ---- | ----------------------------------------- | --------- |
| period         | string | 是   | 时间段类型：`day`、`week`、`month`、`all` | `"day"`   |
| todos          | array  | 是   | 待办任务列表                              | `[{...}]` |
| userName       | string | 否   | 用户名称，默认为"用户"                    | `"张三"`  |
| completedCount | number | 否   | 已完成任务数量，默认为0                   | `5`       |

### 任务对象结构

```typescript
interface Todo {
  id: number | string;
  title: string;
  description?: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: "pending" | "in_progress" | "completed";
  dueDate?: string; // YYYY-MM-DD
  createdAt?: string; // YYYY-MM-DD
  updatedAt?: string; // YYYY-MM-DD
}
```

## 响应格式

### 成功响应

```json
{
  "success": true,
  "summary": "AI生成的总结内容...",
  "prompt": "生成的提示词（仅开发环境）"
}
```

### 错误响应

```json
{
  "error": "错误描述",
  "details": "详细错误信息（可选）"
}
```

## 使用示例

### JavaScript

```javascript
const response = await fetch("/api/todo/summary", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    period: "week",
    todos: [
      {
        id: 1,
        title: "完成项目文档",
        priority: "high",
        status: "completed",
        dueDate: "2024-01-15",
      },
    ],
    userName: "李四",
    completedCount: 3,
  }),
});

const result = await response.json();
if (result.success) {
  console.log("AI总结:", result.summary);
} else {
  console.error("错误:", result.error);
}
```

### React组件中使用

```typescript
const generateSummary = async () => {
  try {
    const response = await axios.post("/api/todo/summary", {
      period: "day",
      todos: completedTodos,
      userName: currentUser.name,
      completedCount: completedTodos.length,
    });

    if (response.data.success) {
      setAiSummary(response.data.summary);
    }
  } catch (error) {
    console.error("生成总结失败:", error);
  }
};
```

## 错误码

| 状态码 | 说明           |
| ------ | -------------- |
| 200    | 成功           |
| 400    | 参数错误       |
| 401    | AI服务认证失败 |
| 429    | 请求频率限制   |
| 500    | 服务器内部错误 |

## 环境配置

在 `.env.local` 文件中配置AI API密钥：

```bash
AI_API_KEY=your-302-ai-api-key-here
```

## 开发测试

运行测试脚本验证接口：

```bash
npx tsx src/app/api/todo/summary/test.ts
```

## 注意事项

1. 需要配置有效的302.ai API密钥
2. 生产环境建议移除prompt字段返回
3. 建议添加请求频率限制
4. 考虑添加缓存机制减少API调用
