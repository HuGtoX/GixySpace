# 日志记录库使用指南

本项目使用 [Pino](https://github.com/pinojs/pino) 作为日志记录库，这是一个高性能的 Node.js 日志记录器。

## 安装的依赖

- `pino`: 核心日志记录库
- `pino-pretty`: 美化日志输出格式（开发环境使用）

## 日志级别

Pino 支持以下日志级别（按严重程度递增）：

| 级别 | 数值 | 描述 |
|------|------|------|
| `trace` | 10 | 最详细的调试信息 |
| `debug` | 20 | 调试信息 |
| `info` | 30 | 一般信息 |
| `warn` | 40 | 警告信息 |
| `error` | 50 | 错误信息 |
| `fatal` | 60 | 致命错误 |

## 基本使用方式

### 1. 导入日志器

```typescript
import { logger, createModuleLogger, createRequestLogger } from '@/lib/logger';
```

### 2. 基础日志记录

```typescript
// 基础使用
logger.info('应用启动成功');
logger.warn('这是一个警告');
logger.error('发生了错误');
logger.debug('调试信息');
logger.trace('追踪信息');
logger.fatal('致命错误');

// 带有额外数据的日志
logger.info({ userId: '123', action: 'login' }, '用户登录成功');
logger.error({ error: err.message, stack: err.stack }, '处理请求时发生错误');
```

### 3. 模块特定的日志器

为不同模块创建专用的日志器，便于日志分类和过滤：

```typescript
// 创建模块日志器
const authLogger = createModuleLogger('auth');
const userLogger = createModuleLogger('user');
const apiLogger = createModuleLogger('api');

// 使用模块日志器
authLogger.info('用户认证成功');
userLogger.warn('用户数据更新失败');
apiLogger.error('API 调用超时');
```

### 4. 请求级别的日志器

为每个请求创建带有唯一标识的日志器，便于追踪请求链路：

```typescript
// 在 API 路由中使用
export async function GET(request: NextRequest) {
  const correlationId = request.headers.get('x-correlation-id') || generateCorrelationId();
  const logger = createRequestLogger(correlationId, 'api/users');
  
  logger.info('开始处理用户列表请求');
  
  try {
    const users = await getUserList();
    logger.info({ count: users.length }, '成功获取用户列表');
    return Response.json(users);
  } catch (error) {
    logger.error({ error: error.message }, '获取用户列表失败');
    return Response.json({ error: '内部服务器错误' }, { status: 500 });
  }
}
```

## 环境变量配置

### 日志级别配置

在 `.env.local` 文件中设置日志级别：

```bash
# 设置日志级别（trace, debug, info, warn, error, fatal）
PINO_LOG_LEVEL=debug

# 开发环境
NODE_ENV=development
```

### 默认配置逻辑

- 生产环境 (`NODE_ENV=production`)：默认级别为 `warn`
- 开发环境：默认级别为 `debug`
- 可通过 `PINO_LOG_LEVEL` 环境变量覆盖默认设置

## 最佳实践

### 1. 结构化日志

使用对象作为第一个参数来记录结构化数据：

```typescript
// ✅ 推荐：结构化日志
logger.info({ 
  userId: user.id, 
  email: user.email, 
  action: 'registration',
  timestamp: new Date().toISOString()
}, '用户注册成功');

// ❌ 不推荐：字符串拼接
logger.info(`用户 ${user.email} 注册成功，ID: ${user.id}`);
```

### 2. 错误日志记录

记录错误时包含完整的错误信息：

```typescript
try {
  await someAsyncOperation();
} catch (error) {
  logger.error({
    error: error.message,
    stack: error.stack,
    operation: 'someAsyncOperation',
    context: { userId, requestId }
  }, '异步操作失败');
}
```

### 3. 性能监控

记录关键操作的执行时间：

```typescript
const startTime = Date.now();
try {
  const result = await databaseQuery();
  const duration = Date.now() - startTime;
  
  logger.info({ 
    duration, 
    resultCount: result.length 
  }, '数据库查询完成');
  
  return result;
} catch (error) {
  const duration = Date.now() - startTime;
  logger.error({ 
    duration, 
    error: error.message 
  }, '数据库查询失败');
  throw error;
}
```

### 4. 敏感信息处理

避免在日志中记录敏感信息：

```typescript
// ✅ 安全的日志记录
logger.info({ 
  userId: user.id, 
  email: user.email.replace(/(.{2}).*(@.*)/, '$1***$2') // 邮箱脱敏
}, '用户登录');

// ❌ 危险：记录敏感信息
logger.info({ password: user.password }, '用户登录'); // 绝对不要这样做
```

## 开发环境日志配置

### 当前配置说明

项目支持多种开发模式，以适应不同的开发需求和 Next.js 版本兼容性：

1. **彩色日志模式**：在非 Turbopack 环境下自动启用彩色日志输出
2. **JSON 格式模式**：在 Turbopack 环境或生产环境下使用标准 JSON 格式
3. **外部美化模式**：通过管道使用 `pino-pretty` 进行日志美化

### 日志输出格式

#### 彩色日志格式（dev:standard 模式）

**简单消息：**
```
[5:47:08 PM] INFO [api/logger-test] 这是 info 级别的日志
[5:47:08 PM] WARN [api/logger-test] 这是 warn 级别的日志
```

**包含结构化数据的消息（美化输出）：**
```
[5:47:08 PM] INFO [api/logger-test] 这是 info 级别的日志
  requestId: "abc-123"
  userAgent: "curl/8.7.1"
  operation: "mock_async_operation"
  duration: 101
  success: true
```

**复杂对象的美化输出：**
```
[5:47:08 PM] INFO [api/logger-test] 用户操作完成
  user:
    {
      id: 123,
      name: "张三",
      roles: ["admin", "user"]
    }
  metadata:
    {
      timestamp: "2025-08-01T09:45:44.181Z",
      source: "web"
    }
```

#### JSON 格式（dev 或生产环境）
```json
{"level":"info","time":"2025-08-01T09:45:44.181Z","pid":24082,"hostname":"hostname","requestId":"abc-123","module":"api/logger-test","msg":"这是 info 级别的日志"}
```

### 启动开发服务器

根据需要选择合适的开发模式：

```bash
# 标准模式 - 彩色日志（推荐用于日志调试）
pnpm run dev:standard

# Turbopack 模式 - 快速编译，JSON 格式日志
pnpm run dev

# 美化模式 - Turbopack + 外部美化工具
pnpm run dev:pretty
```

### 运行日志演示

项目提供了一个完整的日志使用演示：

```bash
# 安装依赖（如果还没有安装）
pnpm install

# 运行日志演示
pnpm run logger:demo
```

这将展示所有日志级别的输出效果，以及各种使用场景的示例。

### API 日志测试

项目提供了一个 API 路由来测试在实际 Next.js 应用中的日志效果：

```bash
# 启动开发服务器（彩色日志模式）
pnpm run dev:standard

# 在浏览器中访问或使用 curl 测试
curl http://localhost:3000/api/logger-test

# 测试错误日志（POST 请求）
curl -X POST http://localhost:3000/api/logger-test \
  -H "Content-Type: application/json" \
  -d '{"triggerError": true}'
```

#### 预期输出示例

**彩色日志模式 (dev:standard)**：
```
[5:47:08 PM] INFO [api/logger-test] 开始处理日志测试请求 requestId="dde2f88d-956a-4e65-a8fe-32ec5ad5600b"
[5:47:08 PM] INFO [api/logger-test] 这是 info 级别的日志 userAgent="curl/8.7.1"
[5:47:08 PM] WARN [api/logger-test] 这是 warn 级别的日志 warning="test_warning"
```

**JSON 格式模式 (dev)**：
```json
{"level":"info","time":"2025-08-01T09:45:44.181Z","requestId":"dde2f88d-956a-4e65-a8fe-32ec5ad5600b","module":"api/logger-test","msg":"开始处理日志测试请求"}
```

### 彩色日志功能

#### 自动检测机制

项目会自动检测运行环境并选择合适的日志格式：

- **开发环境 + 非 Turbopack**：自动启用彩色日志
- **开发环境 + Turbopack**：使用 JSON 格式
- **生产环境**：始终使用 JSON 格式

#### Turbopack 检测逻辑

系统通过以下条件检测 Turbopack：
- 环境变量 `TURBOPACK=1`
- 命令行参数包含 `--turbopack`
- 环境变量 `NEXT_RUNTIME=edge`

#### 开发模式选择指南

**推荐使用场景：**

1. **`dev:standard`** - 日志调试和开发
   - ✅ 彩色日志，易于阅读
   - ✅ 完整的结构化数据显示
   - ❌ 编译速度较慢

2. **`dev:pretty`** - 平衡性能和可读性
   - ✅ 快速编译（Turbopack）
   - ✅ 美化的日志输出
   - ❌ 需要额外的管道处理

3. **`dev`** - 最快开发体验
   - ✅ 最快的编译速度
   - ✅ 适合生产环境调试
   - ❌ JSON 格式不易阅读

#### 可用脚本说明
- `dev`: Turbopack 模式（最快编译，JSON 日志）
- `dev:standard`: 标准模式（彩色日志，较慢编译）
- `dev:pretty`: Turbopack + pino-pretty 管道（快速编译 + 美化日志）

#### 彩色日志特性

彩色日志模式提供以下特性：
- 🎨 不同日志级别使用不同颜色
- ⏰ 本地化时间格式显示
- 📦 模块信息清晰标识
- 📊 结构化数据自动展开和美化输出
- 🔍 请求 ID 和关联信息显示
- 🌈 JSON 对象智能美化格式化
- 📋 复杂对象层级缩进显示
- 🎯 字段名称高亮显示（青色）

#### JSON 美化输出特性

在 `dev:standard` 和 `dev:pretty` 模式下，日志系统会自动美化 JSON 对象的输出：

**自动检测和格式化：**
- 简单值：直接显示（字符串、数字、布尔值）
- 对象：多行缩进显示，字段名高亮
- 数组：智能换行，单元素数组保持单行
- 嵌套结构：递归缩进，保持层次清晰

**使用示例：**
```javascript
// 记录包含复杂对象的日志
requestLogger.info({
  user: { id: 123, name: "张三", roles: ["admin"] },
  operation: "update_profile",
  metadata: { source: "web", timestamp: new Date() }
}, "用户操作完成");

// 输出效果：
// [5:45:44 PM] INFO [api/users] 用户操作完成
//   user:
//     {
//       id: 123,
//       name: "张三",
//       roles: ["admin"]
//     }
//   operation: "update_profile"
//   metadata:
//     {
//       source: "web",
//       timestamp: "2025-08-01T09:45:44.181Z"
//     }
```

#### 生产环境日志聚合
在生产环境中，建议使用专业的日志聚合工具：
- ELK Stack (Elasticsearch, Logstash, Kibana)
- Grafana Loki
- Datadog
- New Relic

## 生产环境

在生产环境中，日志以 JSON 格式输出，便于日志收集系统（如 ELK Stack、Fluentd 等）处理和分析。

## 故障排查

### 常见问题

#### 1. Worker 线程错误

**错误信息**：
```
Error: Cannot find module '/ROOT/node_modules/.pnpm/thread-stream@3.1.0/node_modules/thread-stream/lib/worker.js'
Error: the worker has exited
```

**解决方案**：
- 这是 `pino-pretty` 与 Next.js Turbopack 的兼容性问题
- 项目已移除 `pino-pretty` 的 transport 配置
- 如需彩色日志，请使用上述替代方案

#### 2. 日志不显示

**可能原因**：
- 日志级别设置过高
- 环境变量配置错误

**解决方案**：
```bash
# 检查当前日志级别
echo $PINO_LOG_LEVEL

# 临时降低日志级别
PINO_LOG_LEVEL=debug npm run dev
```

### 查看特定模块的日志

由于使用了模块化日志器，可以通过日志管理工具过滤特定模块的日志：

```bash
# 使用 grep 过滤特定模块的日志
npm run dev 2>&1 | grep '"module":"auth"'

# 过滤特定请求ID的日志
npm run dev 2>&1 | grep '"requestId":"your-request-id"'
```

### 调整日志级别

临时调整日志级别进行调试：

```bash
# 临时设置为 trace 级别查看详细日志
PINO_LOG_LEVEL=trace npm run dev

# 只显示错误和致命错误
PINO_LOG_LEVEL=error npm run dev
```

## 相关链接

- [Pino 官方文档](https://github.com/pinojs/pino)
- [Pino Pretty 文档](https://github.com/pinojs/pino-pretty)
- [Node.js 日志最佳实践](https://nodejs.org/en/docs/guides/diagnostics/)