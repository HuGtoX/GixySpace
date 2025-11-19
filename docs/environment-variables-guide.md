# 环境变量配置说明

## 问题说明

在运行测试脚本时，可能会遇到无法读取 `.env.local` 文件中环境变量的问题。这是因为 Node.js 脚本默认不会自动加载 `.env` 文件。

## 解决方案

### 1. 使用 dotenv 包

项目已经安装了 `dotenv` 包，我们需要在脚本开头显式加载环境变量文件。

#### TypeScript 脚本 (.ts)

```typescript
import { config } from 'dotenv';
import { join } from 'path';

// 加载 .env.local 文件
config({ path: join(process.cwd(), '.env.local') });
```

#### ES Module 脚本 (.mjs)

```javascript
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 加载 .env.local 文件（相对于脚本所在目录）
config({ path: join(__dirname, '..', '.env.local') });
```

### 2. 环境变量文件优先级

在 Next.js 项目中，环境变量文件的加载优先级如下：

1. `.env.local` - 本地开发环境（优先级最高，不应提交到 Git）
2. `.env.development` - 开发环境
3. `.env.production` - 生产环境
4. `.env` - 所有环境的默认值

### 3. 项目中的配置

#### 定时任务脚本

**文件**: `apps/frontend/tomato-tools/scripts/fetch-daily-sentence.ts`

```typescript
import { config } from 'dotenv';
import { join } from 'path';

// 加载 .env.local 文件
config({ path: join(process.cwd(), '.env.local') });
```

#### 测试脚本

**文件**: `apps/frontend/tomato-tools/scripts/test-fetch-daily-sentence.mjs`

```javascript
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 加载 .env.local 文件
config({ path: join(__dirname, '..', '.env.local') });
```

## 验证环境变量

### 方法一：在脚本中打印

```javascript
console.log('DATABASE_URL:', process.env.DATABASE_URL ? '已设置' : '未设置');
```

### 方法二：使用测试脚本

运行测试脚本会自动检查环境变量：

```bash
pnpm run test:fetch-daily-sentence
```

输出示例：

```
2. 检查环境变量
------------------------------------------------------------
✓ DATABASE_URL 已设置
  值: postgresql://postgre...ninr:5432/postgres
```

## 常见问题

### Q1: 为什么 Next.js 应用能读取环境变量，但脚本不能？

**答**: Next.js 框架会自动加载 `.env.local` 文件，但独立的 Node.js 脚本需要手动使用 `dotenv` 包加载。

### Q2: 应该使用 `.env` 还是 `.env.local`？

**答**:

- `.env.local` - 用于本地开发，包含敏感信息，不应提交到 Git
- `.env` - 用于默认配置，可以提交到 Git（不包含敏感信息）

### Q3: GitHub Actions 中如何配置环境变量？

**答**: 在 GitHub 仓库的 Settings → Secrets and variables → Actions 中添加 Secret，然后在工作流中使用：

```yaml
env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

### Q4: 如何确保环境变量在所有环境中都能正确加载？

**答**:

1. 本地开发：使用 `.env.local` 文件
2. GitHub Actions：使用 GitHub Secrets
3. 生产环境：在服务器或平台上配置环境变量

### Q5: 运行测试脚本时出现 "spawn tsx ENOENT" 错误？

**答**: 这是因为 `tsx` 命令没有在系统 PATH 中。解决方案：

**方法一（推荐）**: 使用 pnpm 运行脚本

```bash
pnpm run test:fetch-daily-sentence
```

**方法二**: 使用 npx 运行

```bash
npx tsx scripts/fetch-daily-sentence.ts
```

**方法三**: 全局安装 tsx

```bash
pnpm add -g tsx
```

项目中的测试脚本已经修改为使用 `pnpm` 来运行，所以推荐使用方法一。

## 最佳实践

### 1. 不要提交敏感信息

在 `.gitignore` 中添加：

```
.env.local
.env*.local
```

### 2. 提供示例文件

创建 `.env.example` 文件，包含所有需要的环境变量（不包含实际值）：

```env
# Database Configuration
DATABASE_URL=postgresql://user:password@host:port/database

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### 3. 在脚本开头加载环境变量

确保在使用任何环境变量之前先加载 `.env.local` 文件：

```typescript
// ✅ 正确：在文件开头加载
import { config } from 'dotenv';
config({ path: '.env.local' });

const dbUrl = process.env.DATABASE_URL;

// ❌ 错误：在使用后才加载
const dbUrl = process.env.DATABASE_URL;
import { config } from 'dotenv';
config({ path: '.env.local' });
```

### 4. 验证必需的环境变量

在脚本中添加验证逻辑：

```typescript
const requiredEnvs = ['DATABASE_URL', 'SUPABASE_URL'];

for (const env of requiredEnvs) {
	if (!process.env[env]) {
		throw new Error(`环境变量 ${env} 未设置`);
	}
}
```

## 相关文件

- 定时任务脚本: `apps/frontend/tomato-tools/scripts/fetch-daily-sentence.ts`
- 测试脚本: `apps/frontend/tomato-tools/scripts/test-fetch-daily-sentence.mjs`
- 环境变量文件: `apps/frontend/tomato-tools/.env.local`
- Drizzle 配置: `apps/frontend/tomato-tools/drizzle.config.ts`
- 数据库迁移脚本: `apps/frontend/tomato-tools/scripts/migrate.ts`

## 参考资源

- [dotenv 文档](https://github.com/motdotla/dotenv)
- [Next.js 环境变量文档](https://nextjs.org/docs/basic-features/environment-variables)
- [GitHub Actions Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
