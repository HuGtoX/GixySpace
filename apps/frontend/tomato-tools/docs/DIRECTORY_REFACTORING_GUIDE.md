# 目录重构指南

本文档记录了tomato-tools项目的目录结构重构详情，包括所有文件移动和导入路径变更。

## 重构日期

2026-01-19

## 重构目标

1. 清理API路由目录，移除非路由文件
2. 重构lib目录结构，按职责分类
3. 提高代码可维护性和可发现性
4. 符合Next.js最佳实践

---

## 第一阶段：API路由目录清理

### 文件移动映射

#### News API 源文件

| 原路径                        | 新路径                                |
| ----------------------------- | ------------------------------------- |
| `src/app/api/news/60s.ts`     | `src/lib/api/news/sources/60s.ts`     |
| `src/app/api/news/douyin.ts`  | `src/lib/api/news/sources/douyin.ts`  |
| `src/app/api/news/juejin.ts`  | `src/lib/api/news/sources/juejin.ts`  |
| `src/app/api/news/toutiao.ts` | `src/lib/api/news/sources/toutiao.ts` |
| `src/app/api/news/weibo.ts`   | `src/lib/api/news/sources/weibo.ts`   |
| `src/app/api/news/xueqiu.ts`  | `src/lib/api/news/sources/xueqiu.ts`  |
| `src/app/api/news/zhihu.ts`   | `src/lib/api/news/sources/zhihu.ts`   |

#### Weather API 工具文件

| 原路径                          | 新路径                          |
| ------------------------------- | ------------------------------- |
| `src/app/api/weather/utils.ts`  | `src/lib/api/weather/utils.ts`  |
| `src/app/api/weather/README.md` | `src/lib/api/weather/README.md` |
| `src/app/api/weather/daily.md`  | `src/lib/api/weather/daily.md`  |

#### API 通用文件

| 原路径                         | 新路径                         |
| ------------------------------ | ------------------------------ |
| `src/app/api/authorization.ts` | `src/lib/api/authorization.ts` |
| `src/app/api/types.ts`         | `src/lib/api/types.ts`         |

### 导入路径更新

#### authorization 导入更新

**旧导入：**

```typescript
import { authorization } from "@/app/api/authorization";
import { requireAdmin } from "@/app/api/authorization";
```

**新导入：**

```typescript
import { authorization } from "@/lib/api/authorization";
import { requireAdmin } from "@/lib/api/authorization";
```

**影响的文件：**

- `src/app/api/auth/bind-email/route.ts`
- `src/app/api/auth/convert/route.ts`
- `src/app/api/chat/route.ts`
- `src/app/api/notifications/route.ts`
- `src/app/api/notifications/test-email/route.ts`
- `src/app/api/notifications/[id]/route.ts`
- `src/app/api/todo/route.ts`
- `src/app/api/todo/summary/route.ts`
- `src/app/api/todo/summary/[id]/route.ts`
- `src/app/api/upload/route.ts`
- `src/app/api/user/avatar/route.ts`
- `src/app/api/user/profile/route.ts`

#### types 导入更新

**旧导入：**

```typescript
import type { WeatherDailyInfoResponse } from "@/app/api/types";
```

**新导入：**

```typescript
import type { WeatherDailyInfoResponse } from "@/lib/api/types";
```

**影响的文件：**

- `src/app/api/weather/poster/route.ts`
- `src/components/home/Weather/DetailModal.tsx`
- `src/components/home/Weather/HistoryCityList.tsx`
- `src/components/home/Weather/index.tsx`
- `src/components/home/Weather/PosterModal.tsx`
- `src/components/home/Weather/WeatherChart.tsx`

#### news 源文件导入更新

**旧导入：**

```typescript
import { GET as getDouyinNews } from "./douyin";
```

**新导入：**

```typescript
import { GET as getDouyinNews } from "@/lib/api/news/sources/douyin";
```

**影响的文件：**

- `src/app/api/news/route.ts`

---

## 第二阶段：lib目录重构

### 新目录结构

```
lib/
├── api/                    # API 相关工具（新增）
│   ├── authorization.ts
│   ├── types.ts
│   ├── news/
│   │   └── sources/
│   └── weather/
├── clients/                # 客户端封装（新增）
│   ├── ai.ts              # 原 aiClient.ts
│   ├── http.ts            # 原 axios.ts
│   └── supabase/          # 原 supabase/
├── utils/                  # 通用工具（新增）
│   ├── date.ts            # 原 date.ts
│   ├── storage.ts         # 原 storage.ts
│   └── upload.ts          # 原 uploadUtils.ts
├── processing/             # 业务处理（新增）
│   ├── gif.ts             # 原 gifProcessing.ts
│   └── image.ts           # 原 imageProcessing.ts
├── cache/                  # 缓存相关（新增）
│   ├── redis.ts           # 原 redisCache.ts
│   ├── session.ts         # 原 sessionCache.ts
│   └── context.ts         # 原 contextMemory.ts
├── database/               # 数据库相关（新增）
│   └── drizzle/           # 原 drizzle/
├── errors/                 # 错误处理（新增）
│   └── handler.ts         # 原 errorHandler.ts
├── services/               # 服务层（保持）
├── logger/                 # 日志（保持）
└── prompts/                # AI 提示词（保持）
```

### 文件移动映射

#### 客户端文件

| 原路径                | 新路径                      |
| --------------------- | --------------------------- |
| `src/lib/aiClient.ts` | `src/lib/clients/ai.ts`     |
| `src/lib/axios.ts`    | `src/lib/clients/http.ts`   |
| `src/lib/supabase/`   | `src/lib/clients/supabase/` |

#### 工具文件

| 原路径                   | 新路径                     |
| ------------------------ | -------------------------- |
| `src/lib/date.ts`        | `src/lib/utils/date.ts`    |
| `src/lib/storage.ts`     | `src/lib/utils/storage.ts` |
| `src/lib/uploadUtils.ts` | `src/lib/utils/upload.ts`  |

#### 处理文件

| 原路径                       | 新路径                        |
| ---------------------------- | ----------------------------- |
| `src/lib/gifProcessing.ts`   | `src/lib/processing/gif.ts`   |
| `src/lib/imageProcessing.ts` | `src/lib/processing/image.ts` |

#### 缓存文件

| 原路径                     | 新路径                     |
| -------------------------- | -------------------------- |
| `src/lib/redisCache.ts`    | `src/lib/cache/redis.ts`   |
| `src/lib/sessionCache.ts`  | `src/lib/cache/session.ts` |
| `src/lib/contextMemory.ts` | `src/lib/cache/context.ts` |

#### 数据库文件

| 原路径             | 新路径                      |
| ------------------ | --------------------------- |
| `src/lib/drizzle/` | `src/lib/database/drizzle/` |

#### 错误处理文件

| 原路径                    | 新路径                      |
| ------------------------- | --------------------------- |
| `src/lib/errorHandler.ts` | `src/lib/errors/handler.ts` |

### 导入路径更新指南

#### 需要批量更新的导入

以下是需要在整个项目中批量更新的导入路径：

```typescript
// AI Client
"@/lib/aiClient" → "@/lib/clients/ai"

// HTTP Client
"@/lib/axios" → "@/lib/clients/http"

// Supabase
"@/lib/supabase/client" → "@/lib/clients/supabase/client"
"@/lib/supabase/server" → "@/lib/clients/supabase/server"

// Utils
"@/lib/date" → "@/lib/utils/date"
"@/lib/storage" → "@/lib/utils/storage"
"@/lib/uploadUtils" → "@/lib/utils/upload"

// Processing
"@/lib/gifProcessing" → "@/lib/processing/gif"
"@/lib/imageProcessing" → "@/lib/processing/image"

// Cache
"@/lib/redisCache" → "@/lib/cache/redis"
"@/lib/sessionCache" → "@/lib/cache/session"
"@/lib/contextMemory" → "@/lib/cache/context"

// Database
"@/lib/drizzle/client" → "@/lib/database/drizzle/client"
"@/lib/drizzle/schema" → "@/lib/database/drizzle/schema"

// Error Handler
"@/lib/errorHandler" → "@/lib/errors/handler"
```

---

## 批量更新脚本

可以使用以下命令批量更新导入路径：

```bash
# 使用 PowerShell 批量替换
Get-ChildItem -Path "src" -Recurse -Include *.ts,*.tsx | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    $content = $content -replace '@/lib/aiClient', '@/lib/clients/ai'
    $content = $content -replace '@/lib/axios', '@/lib/clients/http'
    $content = $content -replace '@/lib/supabase/', '@/lib/clients/supabase/'
    $content = $content -replace '@/lib/date', '@/lib/utils/date'
    $content = $content -replace '@/lib/storage', '@/lib/utils/storage'
    $content = $content -replace '@/lib/uploadUtils', '@/lib/utils/upload'
    $content = $content -replace '@/lib/gifProcessing', '@/lib/processing/gif'
    $content = $content -replace '@/lib/imageProcessing', '@/lib/processing/image'
    $content = $content -replace '@/lib/redisCache', '@/lib/cache/redis'
    $content = $content -replace '@/lib/sessionCache', '@/lib/cache/session'
    $content = $content -replace '@/lib/contextMemory', '@/lib/cache/context'
    $content = $content -replace '@/lib/drizzle/', '@/lib/database/drizzle/'
    $content = $content -replace '@/lib/errorHandler', '@/lib/errors/handler'
    Set-Content -Path $_.FullName -Value $content -NoNewline
}
```

---

## 验证步骤

重构完成后，请执行以下验证步骤：

1. **类型检查**

   ```bash
   pnpm tsc --noEmit
   ```

2. **Lint 检查**

   ```bash
   pnpm lint
   ```

3. **构建测试**

   ```bash
   pnpm build
   ```

4. **运行开发服务器**

   ```bash
   pnpm dev
   ```

5. **测试关键功能**
   - [ ] 用户认证流程
   - [ ] AI 聊天功能
   - [ ] 天气查询
   - [ ] 新闻聚合
   - [ ] Todo 管理
   - [ ] 文件上传

---

## 注意事项

1. **drizzle.config.ts 更新**

   - 需要更新 schema 路径：`src/lib/drizzle/schema` → `src/lib/database/drizzle/schema`

2. **中间件更新**

   - 检查 `middleware.ts` 中的 supabase 导入路径

3. **环境变量**

   - 无需更改，所有环境变量保持不变

4. **数据库迁移**
   - 无需重新运行迁移，数据库结构未变

---

## 回滚方案

如果重构出现问题，可以使用 Git 回滚：

```bash
# 查看提交历史
git log --oneline

# 回滚到重构前的提交
git reset --hard <commit-id>
```

---

## 后续优化建议

### 第三阶段：完善 modules 目录

- 删除空的 `chat/` 目录
- 补充 `todo`, `weather`, `notification` 模块

### 第四阶段：优化组件目录

- 移动 `FaIcon.tsx` 到 `ui/`
- 统一样式文件命名（`.module.css`）
- 重命名 `toolsLayout/` 为 `layout/`

### 第五阶段：优化类型定义

- 按领域分类类型文件
- 建立清晰的类型导出结构

---

## 相关文档

- [Next.js 最佳实践](https://nextjs.org/docs/app/building-your-application)
- [项目规范文档](./global.md)
- [API 授权文档](./api-authorization.md)
