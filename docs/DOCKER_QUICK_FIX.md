# 🚀 Docker 构建快速修复指南

## 问题：DATABASE_URL environment variable is required

如果你在构建 Docker 镜像时遇到此错误，按以下步骤操作：

## 快速修复步骤

### 1️⃣ 清理旧的构建缓存

```bash
# 清理所有 Docker 缓存
docker system prune -a -f

# 或只清理构建缓存
docker builder prune -a -f
```

### 2️⃣ 确保 .env 文件配置正确

```bash
# 检查 .env 文件是否存在
ls -la .env

# 如果不存在，从示例创建
cp .env.example .env
```

### 3️⃣ 编辑 .env 文件，填入必需的构建时变量

```bash
# 编辑 .env 文件
nano .env
```

**最小配置**（只需这3个变量即可构建）：

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

> ⚠️ **注意**：`DATABASE_URL` 不需要在构建时提供！

### 4️⃣ 重新构建镜像

```bash
# 使用 docker-compose 构建
docker-compose build --no-cache

# 或使用快速启动脚本
./docker-start.sh  # Linux/Mac
docker-start.bat   # Windows
```

### 5️⃣ 添加运行时环境变量

构建成功后，在 `.env` 文件中添加运行时变量：

```bash
# 添加到 .env 文件
DATABASE_URL=postgresql://user:password@host:5432/database
NEXTAUTH_SECRET=$(openssl rand -base64 32)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 6️⃣ 启动容器

```bash
docker-compose up -d

# 查看日志
docker-compose logs -f
```

## 环境变量速查表

| 变量                            | 何时需要 | 必需？ |
| ------------------------------- | -------- | ------ |
| `NEXT_PUBLIC_SUPABASE_URL`      | 构建时   | ✅ 是  |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 构建时   | ✅ 是  |
| `NEXT_PUBLIC_SITE_URL`          | 构建时   | ✅ 是  |
| `DATABASE_URL`                  | 运行时   | ✅ 是  |
| `NEXTAUTH_SECRET`               | 运行时   | ✅ 是  |
| `SUPABASE_SERVICE_ROLE_KEY`     | 运行时   | ✅ 是  |
| `UPSTASH_REDIS_REST_URL`        | 运行时   | ❌ 否  |
| `AI_API_KEY`                    | 运行时   | ❌ 否  |

## 常见问题

### Q: 为什么构建时不需要 DATABASE_URL？

**A**: 数据库连接只在应用**运行时**需要，构建时只是编译代码，不会实际连接数据库。我们已经将数据库客户端改为延迟初始化，只在实际使用时才检查环境变量。

### Q: 修改了 NEXT*PUBLIC*\* 变量后怎么办？

**A**: 必须重新构建镜像：

```bash
docker-compose build --no-cache
docker-compose up -d
```

### Q: 修改了 DATABASE_URL 后怎么办？

**A**: 只需重启容器：

```bash
docker-compose restart
```

### Q: 如何生成 NEXTAUTH_SECRET？

**A**: 使用以下命令：

```bash
openssl rand -base64 32
```

## 验证构建成功

```bash
# 检查镜像是否创建成功
docker images | grep tomato-tools

# 检查容器是否运行
docker-compose ps

# 检查应用健康状态
curl http://localhost:3000/api/health

# 查看容器日志
docker-compose logs -f tomato-tools
```

## 完整的 .env 示例

```bash
# ============================================
# 构建时变量（必需）
# ============================================
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# ============================================
# 运行时变量（必需）
# ============================================
NODE_ENV=production
DATABASE_URL=postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres
NEXTAUTH_SECRET=your-random-secret-here
NEXTAUTH_URL=http://localhost:3000
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ============================================
# 运行时变量（可选）
# ============================================
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token
AI_API_KEY=your-ai-api-key
QWEATHER_KEY=your-qweather-key
PINO_LOG_LEVEL=info
```

## 获取帮助

如果问题仍未解决：

1. 查看详细文档：[DOCKER_ENV_FIX.md](./DOCKER_ENV_FIX.md)
2. 查看部署指南：[DOCKER_DEPLOYMENT.md](./DOCKER_DEPLOYMENT.md)
3. 查看容器日志：`docker-compose logs -f`
4. 提交 Issue（记得隐藏敏感信息）

---

**快速链接**：

- [完整修复说明](./DOCKER_ENV_FIX.md)
- [部署指南](./DOCKER_DEPLOYMENT.md)
- [环境变量示例](../.env.example)
