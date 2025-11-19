# 每日一言定时任务测试

## 🚀 快速开始

### 本地测试

```bash
# 方式一：使用测试脚本（推荐）
pnpm run test:fetch-daily-sentence

# 方式二：直接运行任务
pnpm run script:fetch-daily-sentence
```

### GitHub Actions测试

1. 访问 GitHub 仓库的 `Actions` 页面
2. 选择 `Test Daily Sentence Task` 工作流
3. 点击 `Run workflow`
4. 选择测试模式：
    - `dry-run`：模拟运行（不写入数据库）
    - `full`：完整运行（实际写入数据库）

## 📝 测试前准备

### 1. 环境变量配置

创建 `.env` 文件（如果还没有）：

```env
DATABASE_URL=your_database_connection_string
```

### 2. GitHub Secrets配置

在 GitHub 仓库设置中添加：

- `DATABASE_URL`：数据库连接字符串

## ✅ 测试检查项

- [ ] API连接正常
- [ ] 能够获取每日一言数据
- [ ] 内容去重功能正常
- [ ] 数据正确保存到数据库
- [ ] 同一天不会重复获取

## 📚 详细文档

查看完整的测试指南：[daily-sentence-test-guide.md](./daily-sentence-test-guide.md)

## 🔧 相关文件

- **定时任务脚本**：`apps/frontend/tomato-tools/scripts/fetch-daily-sentence.ts`
- **测试脚本**：`apps/frontend/tomato-tools/scripts/test-fetch-daily-sentence.mjs`
- **生产工作流**：`.github/workflows/scheduled-tasks.yml`
- **测试工作流**：`.github/workflows/test-scheduled-task.yml`

## 📊 预期结果

### 成功执行

```
========================================
开始执行每日一言定时任务
执行时间: 2025-11-19 10:00:00
========================================

检查今天是否已有数据...
今天还没有数据，开始获取...

第 1 次尝试获取每日一言...
✓ 成功获取到唯一内容: "人生如逆旅，我亦是行人..."

保存数据到数据库...
✓ 数据保存成功！

✓ 定时任务执行完成
```

### 已有数据

```
检查今天是否已有数据...
✓ 今天已有数据，无需重复获取
内容: "人生如逆旅，我亦是行人..."
```

## ❓ 常见问题

### 环境变量未设置

**错误**：`DATABASE_URL 环境变量未设置`

**解决**：确保 `.env` 文件存在并包含正确的 `DATABASE_URL`

### API连接失败

**错误**：`每日一言获取失败: HTTP 500`

**解决**：检查网络连接，稍后重试

### 数据库连接失败

**错误**：`connection refused`

**解决**：检查数据库连接字符串是否正确

## 🎯 生产环境

测试通过后，定时任务将：

- 每天北京时间凌晨 0:00 自动执行
- 获取唯一的每日一言内容
- 保存到数据库供前端展示
