# 天气画报功能实现文档

## 功能概述

根据 WeatherAgent.md 文档的要求，已成功实现天气画报生成功能。该功能允许用户为当前城市生成 AI 驱动的天气画报，包含诗意的天气描述和 AI 生成的图片。

## 实现的功能

### 1. 核心功能

- ✅ 点击标题栏右侧的画报按钮，弹出 Modal 框
- ✅ 调用第三方 Coze API 生成天气画报
- ✅ 展示 AI 生成的图片和诗词描述
- ✅ 将画报数据存储到数据库
- ✅ 每个用户每天只能生成一次画报（按日期限制）

### 2. 用户体验

- 加载状态提示
- 错误处理和重试机制
- 友好的提示信息
- 响应式设计，支持深色模式

## 技术实现

### 1. 数据库表结构

**文件**: `src/lib/drizzle/schema/weatherPoster.ts`

创建了 `weather_poster` 表，包含以下字段：

- `id`: 主键
- `userId`: 用户ID（外键）
- `city`: 城市名称
- `condition`: 天气状况
- `date`: 日期描述（如：12月11日周四）
- `generatedDate`: 生成日期（用于每日限制判断）
- `imgUrl`: AI 生成的图片 URL
- `poetry`: 诗词描述
- `tempHigh`: 最高温度
- `tempLow`: 最低温度
- `createdAt`: 创建时间

### 2. API 路由

**文件**: `src/app/api/weather/poster/route.ts`

实现了两个端点：

#### POST `/api/weather/poster`

生成天气画报

- 验证用户身份
- 检查今日是否已生成（每日限制）
- 调用 Coze API 生成画报
- 解析流式响应
- 存储到数据库

#### GET `/api/weather/poster`

获取用户的画报历史

- 支持分页（limit 参数）
- 按创建时间倒序排列

### 3. 类型定义

**文件**: `src/app/api/types.ts`

添加了以下类型：

- `WeatherPosterData`: 画报数据结构
- `WeatherPosterGenerateRequest`: 生成请求参数
- `WeatherPosterGenerateResponse`: 生成响应结构

### 4. 前端组件

#### PosterModal 组件

**文件**: `src/components/home/Weather/PosterModal.tsx`

功能：

- 自动触发画报生成
- 显示加载状态
- 展示画报内容（图片、天气信息、诗词）
- 错误处理和重试
- 每日限制提示

#### Weather 组件修改

**文件**: `src/components/home/Weather/index.tsx`

修改内容：

- 添加画报按钮（FaImage 图标）
- 集成 PosterModal 组件
- 传递城市名称参数

## 第三方 API 集成

### Coze API 配置

- **端点**: `https://api.coze.cn/v1/workflow/stream_run`
- **认证**: Bearer Token
- **工作流 ID**: `7579820957188702248`
- **应用 ID**: `7579793955551330356`

### 请求参数

```json
{
  "workflow_id": "7579820957188702248",
  "app_id": "7579793955551330356",
  "parameters": {
    "BOT_USER_INPUT": "",
    "city": "城市名称"
  }
}
```

### 响应数据结构

```json
{
  "city": "深圳",
  "condition": "多云",
  "date": "12月11日周四",
  "img": "https://s.coze.cn/t/hmnFn4gCFb0/",
  "poetry": "北风轻抚云纱，二十六度的温柔包裹着南国冬日的矜持...",
  "temp_high": 26,
  "temp_low": 19
}
```

## 使用流程

1. 用户打开天气模块
2. 点击标题栏右侧的画报图标按钮
3. 弹出 Modal 框，自动开始生成画报
4. 显示加载状态和提示信息
5. 生成成功后展示画报内容
6. 如果今日已生成，显示限制提示

## 错误处理

### 客户端错误处理

- 网络请求失败
- API 响应错误
- 数据解析失败
- 每日限制提示

### 服务端错误处理

- 用户未登录（401）
- 参数验证失败（400）
- 每日限制（429）
- 第三方 API 错误（500）
- 数据解析错误（500）

## 数据库迁移

需要运行以下命令来创建数据库表：

```bash
pnpm drizzle-kit generate
pnpm drizzle-kit push
```

## 安全考虑

1. **身份验证**: 所有 API 请求都需要用户登录
2. **每日限制**: 防止滥用，每个用户每天只能生成一次
3. **数据验证**: 使用 Zod 进行参数校验
4. **级联删除**: 用户删除时自动删除相关画报数据

## 样式设计

- 遵循项目的 Tailwind CSS 规范
- 支持深色模式
- 响应式设计
- 与现有天气模块风格保持一致

## 后续优化建议

1. **缓存机制**: 可以考虑缓存画报数据，减少 API 调用
2. **历史记录**: 在 Modal 中添加历史画报查看功能
3. **分享功能**: 允许用户分享画报到社交媒体
4. **自定义城市**: 允许用户为不同城市生成画报
5. **下载功能**: 允许用户下载画报图片

## 相关文件清单

### 新增文件

- `src/lib/drizzle/schema/weatherPoster.ts` - 数据库表结构
- `src/app/api/weather/poster/route.ts` - API 路由
- `src/components/home/Weather/PosterModal.tsx` - 画报展示组件

### 修改文件

- `src/app/api/types.ts` - 添加类型定义
- `src/components/home/Weather/index.tsx` - 添加画报按钮和集成

## 测试建议

1. **功能测试**

   - 首次生成画报
   - 重复生成（验证每日限制）
   - 不同城市生成
   - 错误场景测试

2. **性能测试**

   - API 响应时间
   - 流式数据处理
   - 数据库查询性能

3. **用户体验测试**
   - 加载状态显示
   - 错误提示友好性
   - 响应式布局
   - 深色模式适配

## 总结

已成功实现 WeatherAgent.md 文档中要求的所有功能：

- ✅ 天气画报生成
- ✅ Modal 框展示
- ✅ 第三方 API 集成
- ✅ 数据库存储
- ✅ 每日限制控制
- ✅ 完整的错误处理
- ✅ 良好的用户体验

功能已完整实现，可以进行测试和部署。
