# Docker 配置迁移说明

## 📋 迁移原因

在 monorepo 项目中，将 Docker 配置从子目录（`apps/frontend/tomato-tools/`）迁移到根目录是为了解决以下问题：

### 问题分析

1. **Workspace 依赖缺失**

    - `tomato-tools` 依赖 `@gixy/types`、`@gixy/utils` 等 workspace 包
    - 子目录构建无法访问这些依赖包的源代码
    - 导致构建失败或运行时错误

2. **pnpm-lock.yaml 位置错误**

    - 真正的 `pnpm-lock.yaml` 在 monorepo 根目录
    - 子目录 Dockerfile 无法找到正确的锁定文件
    - 可能导致依赖版本不一致

3. **构建上下文限制**
    - Docker 构建上下文在子目录时，无法访问父目录
    - 无法复制 workspace 配置和其他包的代码

## 🔄 配置变化对比

### 文件位置变化

| 文件               | 旧位置                                                 | 新位置                      |
| ------------------ | ------------------------------------------------------ | --------------------------- |
| Dockerfile         | `apps/frontend/tomato-tools/Dockerfile`                | `Dockerfile`                |
| docker-compose.yml | `apps/frontend/tomato-tools/docker-compose.yml`        | `docker-compose.yml`        |
| .dockerignore      | `apps/frontend/tomato-tools/.dockerignore`             | `.dockerignore`             |
| docker-start.sh    | `apps/frontend/tomato-tools/docker-start.sh`           | `docker-start.sh`           |
| docker-start.bat   | `apps/frontend/tomato-tools/docker-start.bat`          | `docker-start.bat`          |
| 部署文档           | `apps/frontend/tomato-tools/docs/DOCKER_DEPLOYMENT.md` | `docs/DOCKER_DEPLOYMENT.md` |

### Dockerfile 变化

#### 旧配置（子目录）

```dockerfile
# ❌ 问题：无法访问 workspace 依赖
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml* ./  # ❌ 找不到正确的文件
RUN pnpm install --frozen-lockfile

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .  # ❌ 只复制了 tomato-tools 目录
RUN pnpm build
```

#### 新配置（根目录）

```dockerfile
# ✅ 正确：支持 workspace 依赖
FROM node:20-alpine AS deps
WORKDIR /app

# ✅ 复制 workspace 配置
COPY pnpm-workspace.yaml ./
COPY package.json pnpm-lock.yaml ./

# ✅ 复制所有相关包的 package.json
COPY packages/types/package.json ./packages/types/
COPY packages/utils/package.json ./packages/utils/
COPY packages/eslint/package.json ./packages/eslint/
COPY apps/frontend/tomato-tools/package.json ./apps/frontend/tomato-tools/

# ✅ 安装所有 workspace 依赖
RUN pnpm install --frozen-lockfile

FROM node:20-alpine AS builder
WORKDIR /app

# ✅ 复制 workspace 包源代码
COPY packages/types ./packages/types
COPY packages/utils ./packages/utils
COPY packages/eslint ./packages/eslint

# ✅ 复制应用源代码
COPY apps/frontend/tomato-tools ./apps/frontend/tomato-tools

# ✅ 在应用目录构建
WORKDIR /app/apps/frontend/tomato-tools
RUN pnpm build
```

### docker-compose.yml 变化

#### 旧配置

```yaml
# ❌ 问题：构建上下文在子目录
services:
    tomato-tools:
        build:
            context: . # 当前目录是 apps/frontend/tomato-tools
            dockerfile: Dockerfile
        environment:
            - NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
            # ... 需要手动列出所有环境变量
```

#### 新配置

```yaml
# ✅ 正确：构建上下文在根目录
services:
    tomato-tools:
        build:
            context: . # 当前目录是 monorepo 根目录
            dockerfile: Dockerfile
        env_file:
            - ./apps/frontend/tomato-tools/.env # ✅ 从子目录读取环境变量
```

### .dockerignore 变化

#### 旧配置

```dockerignore
# ❌ 只排除当前目录的文件
node_modules
.next/
.env
```

#### 新配置

```dockerignore
# ✅ 排除所有子目录的文件，并排除不需要的 workspace 包
**/node_modules
**/.next/
**/.env

# ✅ 排除不需要的 workspace 包
apps/frontend/blog/
faas/
baas/
```

## 🚀 迁移步骤

如果你已经使用了旧的子目录配置，请按以下步骤迁移：

### 1. 删除旧配置文件

```bash
# 在 monorepo 根目录执行
rm apps/frontend/tomato-tools/Dockerfile
rm apps/frontend/tomato-tools/docker-compose.yml
rm apps/frontend/tomato-tools/.dockerignore
rm apps/frontend/tomato-tools/docker-start.sh
rm apps/frontend/tomato-tools/docker-start.bat
```

### 2. 使用新配置

新配置文件已经在根目录创建：

- `Dockerfile`
- `docker-compose.yml`
- `.dockerignore`
- `docker-start.sh`
- `docker-start.bat`

### 3. 更新环境变量

环境变量文件保持在原位置：

```bash
apps/frontend/tomato-tools/.env
```

### 4. 清理旧镜像

```bash
# 删除旧的镜像和容器
docker-compose down
docker rmi tomato-tools

# 清理 Docker 缓存
docker system prune -a
```

### 5. 使用新配置构建

```bash
# 在 monorepo 根目录执行
docker-compose build
docker-compose up -d
```

## 📝 使用注意事项

### 命令执行位置

| 操作     | 旧方式                                                  | 新方式                 |
| -------- | ------------------------------------------------------- | ---------------------- |
| 构建镜像 | `cd apps/frontend/tomato-tools && docker-compose build` | `docker-compose build` |
| 启动容器 | `cd apps/frontend/tomato-tools && docker-compose up -d` | `docker-compose up -d` |
| 查看日志 | `cd apps/frontend/tomato-tools && docker-compose logs`  | `docker-compose logs`  |
| 停止容器 | `cd apps/frontend/tomato-tools && docker-compose down`  | `docker-compose down`  |

⚠️ **重要**：所有 Docker 命令现在必须在 **monorepo 根目录** 执行！

### 环境变量文件

环境变量文件位置**没有变化**，仍然在：

```
apps/frontend/tomato-tools/.env
```

`docker-compose.yml` 会自动从这个位置读取。

### 快速启动脚本

快速启动脚本会自动处理环境变量文件的位置：

```bash
# Linux/Mac
./docker-start.sh

# Windows
docker-start.bat
```

## 🎯 迁移后的优势

### 1. 正确的依赖管理

- ✅ 所有 workspace 依赖都能正确安装
- ✅ 使用正确的 `pnpm-lock.yaml`
- ✅ 依赖版本一致性得到保证

### 2. 构建稳定性

- ✅ 构建过程更加稳定
- ✅ 不会出现找不到模块的错误
- ✅ 支持 monorepo 的完整功能

### 3. 更好的缓存利用

- ✅ Docker 层缓存更有效
- ✅ 依赖变化时只重新安装必要的包
- ✅ 构建速度更快

### 4. 符合最佳实践

- ✅ 符合 monorepo Docker 部署的最佳实践
- ✅ 更容易维护和扩展
- ✅ 支持未来添加更多应用

## 🔍 验证迁移

迁移完成后，执行以下命令验证：

```bash
# 1. 检查构建上下文
docker-compose config

# 2. 构建镜像（应该成功）
docker-compose build

# 3. 启动容器
docker-compose up -d

# 4. 检查容器状态
docker-compose ps

# 5. 查看日志（应该没有错误）
docker-compose logs

# 6. 访问应用
curl http://localhost:3000
```

## 📚 相关文档

- [完整部署指南](./DOCKER_DEPLOYMENT.md)
- [pnpm Workspace 文档](https://pnpm.io/workspaces)
- [Docker 多阶段构建](https://docs.docker.com/build/building/multi-stage/)

## 🆘 常见问题

### Q: 为什么不能在子目录使用 Docker？

A: 在 monorepo 中，子目录无法访问其他 workspace 包的代码和配置文件。Docker 构建上下文必须包含所有依赖的包。

### Q: 环境变量文件需要移动吗？

A: 不需要。环境变量文件仍然保持在 `apps/frontend/tomato-tools/.env`，`docker-compose.yml` 会从这个位置读取。

### Q: 旧的镜像和容器怎么办？

A: 建议删除旧的镜像和容器，然后使用新配置重新构建：

```bash
docker-compose down
docker rmi tomato-tools
docker system prune -a
```

### Q: 构建时间会变长吗？

A: 首次构建可能会稍长（因为需要处理更多文件），但后续构建会因为更好的缓存策略而更快。

### Q: 可以同时保留两套配置吗？

A: 不建议。这会导致混淆和维护困难。请完全迁移到根目录配置。

## ✅ 迁移检查清单

- [ ] 删除子目录中的旧 Docker 配置文件
- [ ] 确认根目录有新的 Docker 配置文件
- [ ] 环境变量文件在正确位置（`apps/frontend/tomato-tools/.env`）
- [ ] 清理旧的 Docker 镜像和容器
- [ ] 在根目录执行构建命令
- [ ] 验证应用正常运行
- [ ] 更新 CI/CD 配置（如果有）
- [ ] 更新团队文档和说明

---

如有任何问题，请参考 [DOCKER_DEPLOYMENT.md](./DOCKER_DEPLOYMENT.md) 或提交 Issue。
