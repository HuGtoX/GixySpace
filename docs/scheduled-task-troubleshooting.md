# 定时任务故障排除指南

## 常见错误及解决方案

### 1. ❌ spawn tsx ENOENT

**错误信息**：

```
✗ 任务执行出错
  错误: spawn tsx ENOENT
```

**原因**：系统找不到 `tsx` 命令

**解决方案**：

#### ✅ 方案一：使用 pnpm 运行（推荐）

```bash
pnpm run test:fetch-daily-sentence
```

测试脚本已经修改为使用 `pnpm` 来运行，所以直接使用上述命令即可。

#### 方案二：使用 npx 运行

```bash
npx tsx scripts/fetch-daily-sentence.ts
```

#### 方案三：全局安装 tsx

```bash
pnpm add -g tsx
```

---

### 2. ❌ 环境变量未设置

**错误信息**：

```
✗ DATABASE_URL 未设置
❌ 环境变量检查失败
```

**原因**：`.env.local` 文件不存在或未包含必要的环境变量

**解决方案**：

1. 确保 `.env.local` 文件存在于 `apps/frontend/tomato-tools/` 目录下

2. 检查文件内容，确保包含以下变量：

```env
DATABASE_URL=postgresql://user:password@host:port/database
```

3. 如果文件不存在，可以复制 `.env.example`（如果有）：

```bash
cd apps/frontend/tomato-tools
cp .env.example .env.local
```

4. 编辑 `.env.local` 文件，填入正确的数据库连接信息

---

### 3. ❌ API 连接失败

**错误信息**：

```
✗ API连接失败
  错误: HTTP错误: 500
```

**原因**：每日一言 API 服务不可用或网络问题

**解决方案**：

1. 检查网络连接
2. 稍后重试
3. 如果持续失败，可以考虑更换 API 源

---

### 4. ❌ 数据库连接失败

**错误信息**：

```
Error: Connection terminated unexpectedly
```

**原因**：数据库连接信息错误或数据库服务不可用

**解决方案**：

1. 验证 `DATABASE_URL` 格式是否正确：

```
postgresql://username:password@host:port/database
```

2. 检查数据库服务是否运行

3. 验证数据库凭据是否正确

4. 检查网络连接和防火墙设置

---

### 5. ❌ 表不存在

**错误信息**：

```
Error: relation "daily_sentences" does not exist
```

**原因**：数据库表未创建

**解决方案**：

运行数据库迁移：

```bash
cd apps/frontend/tomato-tools
pnpm run migrate
```

---

### 6. ❌ pnpm 命令找不到

**错误信息**：

```
'pnpm' 不是内部或外部命令
```

**原因**：pnpm 未安装

**解决方案**：

安装 pnpm：

```bash
npm install -g pnpm
```

或使用 npm 运行：

```bash
npm run test:fetch-daily-sentence
```

---

### 7. ❌ 权限错误

**错误信息**：

```
Error: EACCES: permission denied
```

**原因**：文件或目录权限不足

**解决方案**：

**Linux/Mac**:

```bash
chmod +x scripts/test-fetch-daily-sentence.mjs
chmod +x scripts/fetch-daily-sentence.ts
```

**Windows**: 以管理员身份运行命令提示符或 PowerShell

---

### 8. ❌ 模块找不到

**错误信息**：

```
Error: Cannot find module 'dotenv'
```

**原因**：依赖包未安装

**解决方案**：

安装依赖：

```bash
cd apps/frontend/tomato-tools
pnpm install
```

---

## 调试技巧

### 1. 查看详细日志

修改脚本添加更多日志输出：

```typescript
console.log('环境变量:', process.env.DATABASE_URL);
console.log('当前目录:', process.cwd());
```

### 2. 测试数据库连接

创建简单的测试脚本：

```typescript
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL!);

async function test() {
	try {
		const result = await sql`SELECT NOW()`;
		console.log('数据库连接成功:', result);
	} catch (error) {
		console.error('数据库连接失败:', error);
	} finally {
		await sql.end();
	}
}

test();
```

### 3. 测试 API 连接

使用 curl 或浏览器测试：

```bash
curl https://international.v1.hitokoto.cn?c=k
```

### 4. 检查环境变量加载

在脚本开头添加：

```typescript
import { config } from 'dotenv';
config({ path: '.env.local' });

console.log('DATABASE_URL:', process.env.DATABASE_URL ? '已设置' : '未设置');
```

---

## 验证清单

在运行定时任务前，请确认：

- [ ] pnpm 已安装
- [ ] 项目依赖已安装（`pnpm install`）
- [ ] `.env.local` 文件存在
- [ ] `DATABASE_URL` 环境变量已设置
- [ ] 数据库服务正在运行
- [ ] 数据库表已创建（运行过 `pnpm run migrate`）
- [ ] 网络连接正常
- [ ] 脚本文件有执行权限

---

## 测试流程

### 完整测试流程

```bash
# 1. 进入项目目录
cd apps/frontend/tomato-tools

# 2. 安装依赖
pnpm install

# 3. 配置环境变量
# 编辑 .env.local 文件

# 4. 运行数据库迁移
pnpm run migrate

# 5. 运行测试脚本
pnpm run test:fetch-daily-sentence

# 6. 如果测试通过，运行实际任务
pnpm run script:fetch-daily-sentence
```

### 快速测试

```bash
# 直接运行测试
pnpm run test:fetch-daily-sentence
```

---

## 获取帮助

如果以上方案都无法解决问题：

1. 查看完整错误日志
2. 检查 [环境变量配置指南](./environment-variables-guide.md)
3. 查看 [测试指南](./daily-sentence-test-guide.md)
4. 提交 Issue 并附上：
    - 完整的错误信息
    - 操作系统和 Node.js 版本
    - 执行的命令
    - 相关配置文件（隐藏敏感信息）

---

## 相关文档

- [环境变量配置指南](./environment-variables-guide.md)
- [定时任务测试指南](./daily-sentence-test-guide.md)
- [快速测试 README](./daily-sentence-test-README.md)
