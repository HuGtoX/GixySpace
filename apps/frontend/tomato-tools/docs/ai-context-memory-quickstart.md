# AI对话上下文记忆 - 快速开始

## 🚀 5分钟快速上手

### 1. 功能已自动启用

好消息！上下文记忆功能已经自动集成到AI聊天组件中，**无需任何配置即可使用**。

### 2. 验证功能

打开AI聊天窗口，进行以下测试：

```
你: 你好，我想学习React
AI: 你好！我很乐意帮你学习React...

你: useState怎么用？
AI: useState是React中最常用的Hook...（AI记住了你在学习React）

你: 给我一个例子
AI: 好的，这是一个useState的例子...（AI记住了你在问useState）
```

✅ 如果AI的回复能够理解之前的对话内容，说明上下文记忆功能正常工作！

### 3. 查看上下文信息

打开浏览器开发者工具（F12），在Console中查看日志：

```
[AiChatModal] 发送请求，上下文消息数: 4
[Chat API] 收到请求: contextMessages=4
```

## 📊 功能特性

### 自动记忆

- ✅ 记住当前会话的所有对话
- ✅ 最多保留20条历史消息
- ✅ 自动控制在4000 tokens以内

### 智能优化

- ✅ 自动裁剪过长的历史
- ✅ 保持对话完整性
- ✅ 优先保留最近的消息

### 性能优秀

- ✅ 响应时间增加<1秒
- ✅ 内存占用增加<3MB
- ✅ 对用户体验影响极小

## 🎯 使用场景

### 场景1: 连续提问

```
你: 什么是TypeScript？
AI: TypeScript是JavaScript的超集...

你: 它有什么优势？
AI: TypeScript的主要优势包括...（理解"它"指TypeScript）

你: 如何安装？
AI: 安装TypeScript很简单...（知道你在问TypeScript的安装）
```

### 场景2: 代码调试

```
你: 我的React组件报错了
AI: 请告诉我错误信息...

你: Cannot read property 'map' of undefined
AI: 这个错误通常是因为...（记住了你在调试React组件）

你: 怎么修复？
AI: 你可以这样修复...（基于之前的错误信息给出建议）
```

### 场景3: 学习讨论

```
你: 解释一下闭包
AI: 闭包是指函数可以访问...

你: 给个例子
AI: 好的，这是一个闭包的例子...（知道要给闭包的例子）

你: 这个例子中的变量作用域是怎样的？
AI: 在这个例子中...（基于刚才给出的例子解释）
```

## 🔧 高级配置（可选）

如果你想自定义配置，可以修改 `AiChatModal/index.tsx`：

```typescript
const memoryManager = useMemo(
  () =>
    createContextMemoryManager({
      maxMessages: 30, // 增加到30条消息
      maxTokens: 6000, // 增加到6000 tokens
      enableSummary: true, // 启用摘要功能
    }),
  [],
);
```

## 📈 监控和调试

### 查看记忆统计

在浏览器Console中运行：

```javascript
// 获取当前会话的消息
const messages = /* 当前会话的messages数组 */;

// 创建管理器
const manager = createContextMemoryManager();

// 查看统计
const stats = manager.getMemoryStats(messages);
console.log('记忆统计:', stats);
```

输出示例：

```
记忆统计: {
  totalMessages: 10,
  userMessages: 5,
  assistantMessages: 5,
  estimatedTokens: 1234,
  earliestMessageTime: "2025-01-03T10:00:00",
  latestMessageTime: "2025-01-03T10:05:00"
}
```

### 测试关键词提取

```javascript
const manager = createContextMemoryManager();
const keywords = manager.extractKeywords(
  "如何在React中实现用户认证和登录功能",
  5,
);
console.log("关键词:", keywords);
// 输出: ['React', '实现', '用户', '认证', '登录']
```

## ⚠️ 注意事项

### 1. Token限制

- 默认限制4000 tokens
- 超出会自动裁剪旧消息
- 不会影响功能，只是减少上下文

### 2. 会话隔离

- 每个会话独立记忆
- 切换会话会重置上下文
- 不同会话间不共享记忆

### 3. 性能影响

- 带上下文的请求稍慢（+0.5-1秒）
- 这是正常现象
- 换来的是更好的对话体验

## 🐛 常见问题

### Q1: AI似乎忘记了之前的对话？

**A**: 检查以下几点：

1. 是否切换了会话？（会话间不共享记忆）
2. 对话是否太长？（超过20条会自动裁剪）
3. 查看Console日志确认上下文是否发送

### Q2: 响应速度变慢了？

**A**: 这是正常的，因为：

1. 需要处理更多的上下文信息
2. 通常只增加0.5-1秒
3. 可以减少maxMessages来提速

### Q3: 如何清除记忆？

**A**: 有两种方式：

1. 创建新会话（点击"新建会话"）
2. 删除当前会话并重新开始

## 📚 进阶学习

想了解更多？查看完整文档：

- [完整功能文档](./ai-context-memory.md)
- [实现总结](./ai-context-memory-implementation.md)
- [测试示例](../src/lib/__tests__/context-memory.test.ts)

## 🎉 开始使用

现在就打开AI聊天窗口，体验智能的上下文记忆功能吧！

---

**提示**: 如果遇到任何问题，请查看[故障排查指南](./ai-context-memory.md#故障排查)或提交Issue。
