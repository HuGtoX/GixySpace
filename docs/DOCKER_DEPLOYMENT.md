# Monorepo Docker 部署指南

本文档介绍如何在 monorepo 项目中使用 Docker 部署番茄工具箱应用。

## 📋 前置要求

- Docker 20.10+
- Docker Compose 2.0+
- 至少 2GB 可用内存
- 至少 3GB 可用磁盘空间（monorepo 构建需要更多空间）

## 🏗️ Monorepo 架构说明

本项目采用 pnpm workspace 管理 monorepo，包含以下结构：

```
-GixySpace/
├── apps/
│   └── frontend/
│       ├── tomato-tools/    # 番茄工具箱应用
│       └── blog/            # 博客应用
├── packages/
│   ├── types/               # 共享类型定义
│   ├── utils/               # 共享工具函数
│   └── eslint/              # ESLint 配置
├── faas/                    # 云函数
├── pnpm-workspace.yaml      # workspace 配置
├── pnpm-lock.yaml           # 依赖锁定文件
├── Dockerfile               # Docker 构建文件
└── docker-compose.yml       # Docker Compose 配置
```

### 依赖关系

`tomato-tools` 应用依赖以下 workspace 包：

- `@gixy/types` - 共享类型定义
- `@gixy/utils` - 共享工具函数
- `@gixy/eslint-plugin-unused-imports` - ESLint 插件

## 🚀 快速开始

### 1. 配置环境变量

在 monorepo 根目录执行：

```bash
# 如果 .env 文件不存在，从示例文件创建
cp apps/frontend/tomato-tools/.env.example apps/frontend/tomato-tools/.env

# 编辑环境变量文件
nano apps/frontend/tomato-tools/.env
```

必需的配置项：

- **Supabase 配置**：`NEXT_PUBLIC_SUPABASE_URL`、`NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **数据库配置**：`DATABASE_URL`
- **NextAuth 配置**：`NEXTAUTH_SECRET`、`NEXTAUTH_URL`

### 2. 构建并启动容器

#### 使用快速启动脚本（推荐）

**Linux/Mac:**

```bash
chmod +x docker-start.sh
./docker-start.sh
```

**Windows:**

```bash
docker-start.bat
```

#### 手动启动

```bash
# 在 monorepo 根目录执行
docker-compose up -d
```

### 3. 访问应用

应用启动后，访问：http://localhost:3000

## 📝 常用命令

所有命令都需要在 **monorepo 根目录** 执行：

### 查看日志

```bash
# 查看所有日志
docker-compose logs

# 实时查看日志
docker-compose logs -f

# 查看最近100行日志
docker-compose logs --tail=100
```

### 重启服务

```bash
docker-compose restart
```

### 停止服务

```bash
docker-compose down
```

### 重新构建

```bash
# 重新构建并启动
docker-compose up -d --build

# 强制重新构建（不使用缓存）
docker-compose build --no-cache
docker-compose up -d
```

### 进入容器

```bash
docker-compose exec tomato-tools sh
```

## 🔧 Monorepo 特定配置

### Dockerfile 说明

Dockerfile 采用三阶段构建，针对 monorepo 进行了优化：

#### 阶段1: 依赖安装

- 复制 workspace 配置文件（`pnpm-workspace.yaml`）
- 复制所有相关包的 `package.json`
- 安装所有 workspace 依赖

#### 阶段2: 构建应用

- 复制所有必需的 workspace 包源代码
- 复制 `tomato-tools` 应用源代码
- 在应用目录中执行构建

#### 阶段3: 生产运行

- 仅复制构建产物和必需文件
- 使用非 root 用户运行

### .dockerignore 配置

`.dockerignore` 文件针对 monorepo 进行了优化：

- 排除不需要的 workspace 包（如 `blog`、`faas`）
- 保留必需的包（`types`、`utils`、`eslint`）
- 排除所有 `node_modules`（会在容器内重新安装）

### 环境变量管理

环境变量文件位于：`apps/frontend/tomato-tools/.env`

`docker-compose.yml` 通过 `env_file` 指令引用此文件：

```yaml
env_file:
    - ./apps/frontend/tomato-tools/.env
```

## 🐛 故障排查

### 构建失败：找不到 workspace 包

**问题**：构建时提示找不到 `@gixy/types` 或 `@gixy/utils`

**解决方案**：

1. 确保在 monorepo 根目录执行构建
2. 检查 `pnpm-workspace.yaml` 配置
3. 清理 Docker 缓存后重新构建：
    ```bash
    docker system prune -a
    docker-compose build --no-cache
    ```

### 依赖安装失败

**问题**：`pnpm install` 失败

**解决方案**：

1. 检查 `pnpm-lock.yaml` 是否存在
2. 确保 Dockerfile 正确复制了所有 `package.json`
3. 尝试在本地执行 `pnpm install` 验证依赖

### 容器启动后无法访问

**问题**：容器运行但应用无法访问

**解决方案**：

1. 检查环境变量配置：
    ```bash
    docker-compose exec tomato-tools env | grep NEXT
    ```
2. 查看容器日志：
    ```bash
    docker-compose logs -f
    ```
3. 确认端口 3000 未被占用

### 构建时间过长

**问题**：首次构建需要很长时间

**原因**：Monorepo 需要安装和构建多个包

**优化建议**：

1. 使用 Docker 构建缓存
2. 仅在必要时使用 `--no-cache`
3. 考虑使用 Docker BuildKit：
    ```bash
    DOCKER_BUILDKIT=1 docker-compose build
    ```

## 🔐 生产环境部署建议

### 1. 多阶段构建优化

当前 Dockerfile 已经优化，但可以进一步改进：

```dockerfile
# 可选：添加构建缓存挂载
RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile
```

### 2. 环境变量安全

- 使用 Docker Secrets 或 Kubernetes Secrets
- 不要将 `.env` 文件提交到版本控制
- 在 CI/CD 中注入环境变量

### 3. 镜像优化

```bash
# 查看镜像大小
docker images | grep tomato-tools

# 分析镜像层
docker history tomato-tools:latest
```

### 4. 健康检查

`docker-compose.yml` 已配置健康检查：

```yaml
healthcheck:
    test:
        [
            'CMD',
            'node',
            '-e',
            "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"
        ]
    interval: 30s
    timeout: 10s
    retries: 3
```

确保应用有 `/api/health` 端点。

## 📊 性能优化

### 构建缓存

利用 Docker 层缓存，将不常变化的文件放在前面：

1. workspace 配置文件
2. package.json 文件
3. 依赖安装
4. 源代码复制
5. 应用构建

### 减小镜像大小

- 使用 Alpine 基础镜像 ✅
- 多阶段构建 ✅
- 仅复制必需文件 ✅
- 使用 `.dockerignore` ✅

当前镜像大小约：**300-400MB**（包含 workspace 依赖）

## 🔄 更新应用

```bash
# 1. 拉取最新代码
git pull

# 2. 重新构建并启动（在 monorepo 根目录）
docker-compose up -d --build

# 3. 清理旧镜像
docker image prune -f
```

## 📚 相关资源

- [pnpm Workspace 文档](https://pnpm.io/workspaces)
- [Next.js Docker 部署](https://nextjs.org/docs/deployment#docker-image)
- [Docker Compose 文档](https://docs.docker.com/compose/)
- [Docker 多阶段构建](https://docs.docker.com/build/building/multi-stage/)

## 💡 最佳实践

### Monorepo Docker 部署

1. **构建上下文**：始终使用 monorepo 根目录作为构建上下文
2. **依赖管理**：确保所有 workspace 依赖都被正确复制
3. **选择性复制**：只复制必需的 workspace 包，减小镜像大小
4. **缓存优化**：合理安排 Dockerfile 指令顺序，最大化缓存利用

### 开发工作流

```bash
# 本地开发（不使用 Docker）
pnpm dev

# 测试 Docker 构建
docker-compose build

# 本地测试容器
docker-compose up

# 生产部署
docker-compose -f docker-compose.prod.yml up -d
```

## 🆘 获取帮助

如遇到问题：

1. 查看容器日志：`docker-compose logs -f`
2. 检查环境变量：`docker-compose config`
3. 验证构建上下文：确保在 monorepo 根目录
4. 参考本文档的故障排查部分
5. 提交 Issue 到项目仓库

## 📝 注意事项

⚠️ **重要**：

- 所有 Docker 命令必须在 **monorepo 根目录** 执行
- 环境变量文件位于 `apps/frontend/tomato-tools/.env`
- 不要在子目录中运行 `docker-compose`
- 首次构建可能需要 10-15 分钟（取决于网络速度）
