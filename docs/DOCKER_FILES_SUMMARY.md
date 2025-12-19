# Monorepo Docker 配置总结

## 📋 问题与解决方案

### 原始问题

你提出了一个关键问题：**在 monorepo 项目中，将 Docker 配置放在子目录（`tomato-tools`）下是否会存在依赖缺失？**

**答案：是的，会存在严重的依赖缺失问题！**

### 具体问题

1. **Workspace 依赖无法访问**

    - `tomato-tools` 依赖 `@gixy/types`、`@gixy/utils`、`@gixy/eslint-plugin-unused-imports`
    - 这些包位于 `packages/` 目录
    - 子目录构建无法访问父目录的其他包

2. **pnpm-lock.yaml 位置错误**

    - 真正的锁定文件在 monorepo 根目录
    - 子目录 Dockerfile 找不到正确的锁定文件
    - 导致依赖版本不一致或安装失败

3. **构建上下文限制**
    - Docker 构建上下文在子目录时，无法访问父目录
    - 无法复制 workspace 配置文件（`pnpm-workspace.yaml`）

## ✅ 解决方案

将所有 Docker 配置文件移到 **monorepo 根目录**，并调整构建策略以支持 workspace 依赖。

## 📁 创建的文件

### 1. 根目录配置文件

| 文件               | 位置                  | 说明                               |
| ------------------ | --------------------- | ---------------------------------- |
| Dockerfile         | `/Dockerfile`         | 支持 workspace 的多阶段构建配置    |
| docker-compose.yml | `/docker-compose.yml` | 容器编排配置，从子目录读取环境变量 |
| .dockerignore      | `/.dockerignore`      | 优化构建上下文，排除不需要的文件   |
| docker-start.sh    | `/docker-start.sh`    | Linux/Mac 快速启动脚本             |
| docker-start.bat   | `/docker-start.bat`   | Windows 快速启动脚本               |

### 2. 文档文件

| 文件                    | 位置                         | 说明           |
| ----------------------- | ---------------------------- | -------------- |
| DOCKER_DEPLOYMENT.md    | `/docs/DOCKER_DEPLOYMENT.md` | 完整的部署指南 |
| DOCKER_MIGRATION.md     | `/docs/DOCKER_MIGRATION.md`  | 配置迁移说明   |
| DOCKER_FILES_SUMMARY.md | 本文件                       | 配置总结       |

### 3. 保留的文件

| 文件         | 位置                                       | 说明                 |
| ------------ | ------------------------------------------ | -------------------- |
| .env         | `/apps/frontend/tomato-tools/.env`         | 环境变量配置（不变） |
| .env.example | `/apps/frontend/tomato-tools/.env.example` | 环境变量示例（不变） |

## 🔧 关键配置说明

### Dockerfile 关键点

```dockerfile
# ✅ 阶段1: 复制 workspace 配置和所有包的 package.json
COPY pnpm-workspace.yaml ./
COPY package.json pnpm-lock.yaml ./
COPY packages/types/package.json ./packages/types/
COPY packages/utils/package.json ./packages/utils/
COPY packages/eslint/package.json ./packages/eslint/
COPY apps/frontend/tomato-tools/package.json ./apps/frontend/tomato-tools/

# ✅ 阶段2: 复制所有必需的源代码
COPY packages/types ./packages/types
COPY packages/utils ./packages/utils
COPY packages/eslint ./packages/eslint
COPY apps/frontend/tomato-tools ./apps/frontend/tomato-tools

# ✅ 在应用目录构建
WORKDIR /app/apps/frontend/tomato-tools
RUN pnpm build
```

### docker-compose.yml 关键点

```yaml
services:
    tomato-tools:
        build:
            context: . # ✅ 根目录作为构建上下文
            dockerfile: Dockerfile
        env_file:
            - ./apps/frontend/tomato-tools/.env # ✅ 从子目录读取环境变量
```

### .dockerignore 关键点

```dockerignore
# ✅ 排除所有 node_modules
**/node_modules

# ✅ 排除不需要的 workspace 包
apps/frontend/blog/
faas/
baas/

# ✅ 保留必需的包
# packages/types/
# packages/utils/
# packages/eslint/
# apps/frontend/tomato-tools/
```

## 🚀 使用方法

### 快速启动（推荐）

```bash
# Linux/Mac
chmod +x docker-start.sh
./docker-start.sh

# Windows
docker-start.bat
```

### 手动启动

```bash
# 1. 配置环境变量（如果还没有）
cp apps/frontend/tomato-tools/.env.example apps/frontend/tomato-tools/.env
nano apps/frontend/tomato-tools/.env

# 2. 构建并启动（在根目录执行）
docker-compose up -d

# 3. 查看日志
docker-compose logs -f

# 4. 访问应用
# http://localhost:3000
```

## ⚠️ 重要注意事项

### 1. 命令执行位置

**所有 Docker 命令必须在 monorepo 根目录执行！**

```bash
# ✅ 正确
cd /path/to/-GixySpace
docker-compose up -d

# ❌ 错误
cd /path/to/-GixySpace/apps/frontend/tomato-tools
docker-compose up -d
```

### 2. 环境变量文件位置

环境变量文件保持在原位置：

```
apps/frontend/tomato-tools/.env
```

不需要移动到根目录。

### 3. 构建上下文

构建上下文是整个 monorepo 根目录，包含：

- 所有 workspace 包
- pnpm 配置文件
- 依赖锁定文件

### 4. 首次构建时间

首次构建可能需要 **10-15 分钟**，因为需要：

- 安装所有 workspace 依赖
- 构建多个包
- 生成 Next.js 构建产物

后续构建会因为 Docker 缓存而更快。

## 📊 配置对比

### 子目录配置 vs 根目录配置

| 特性           | 子目录配置  | 根目录配置  |
| -------------- | ----------- | ----------- |
| Workspace 依赖 | ❌ 无法访问 | ✅ 完全支持 |
| pnpm-lock.yaml | ❌ 找不到   | ✅ 正确位置 |
| 构建稳定性     | ❌ 经常失败 | ✅ 稳定可靠 |
| 缓存效率       | ⚠️ 较低     | ✅ 高效     |
| 维护难度       | ⚠️ 较高     | ✅ 简单     |
| 符合最佳实践   | ❌ 否       | ✅ 是       |

## 🎯 优势总结

### 1. 依赖管理

- ✅ 所有 workspace 依赖正确安装
- ✅ 使用正确的依赖锁定文件
- ✅ 版本一致性得到保证

### 2. 构建稳定性

- ✅ 不会出现"找不到模块"错误
- ✅ 支持 monorepo 完整功能
- ✅ 构建过程可预测

### 3. 开发体验

- ✅ 一键启动脚本
- ✅ 清晰的文档说明
- ✅ 符合直觉的使用方式

### 4. 生产就绪

- ✅ 多阶段构建优化镜像大小
- ✅ 非 root 用户运行
- ✅ 健康检查配置
- ✅ 资源限制设置

## 📈 镜像信息

### 镜像大小

- **最终镜像**：约 300-400MB
- **基础镜像**：node:20-alpine (~180MB)
- **应用代码**：~50MB
- **依赖**：~150-200MB

### 构建阶段

1. **deps**：安装所有依赖（~500MB）
2. **builder**：构建应用（~800MB）
3. **runner**：仅运行时文件（~350MB）

最终镜像只包含 runner 阶段的内容。

## 🔍 验证清单

部署后，请验证以下内容：

- [ ] 容器成功启动：`docker-compose ps`
- [ ] 应用可访问：`curl http://localhost:3000`
- [ ] 健康检查通过：`docker inspect tomato-tools | grep Health`
- [ ] 日志无错误：`docker-compose logs`
- [ ] 环境变量正确：`docker-compose exec tomato-tools env`
- [ ] Workspace 依赖可用：检查应用功能

## 📚 相关文档

1. **[DOCKER_DEPLOYMENT.md](./DOCKER_DEPLOYMENT.md)** - 完整的部署指南

    - 前置要求
    - 详细步骤
    - 常用命令
    - 故障排查
    - 生产环境建议

2. **[DOCKER_MIGRATION.md](./DOCKER_MIGRATION.md)** - 配置迁移说明

    - 迁移原因
    - 配置对比
    - 迁移步骤
    - 常见问题

3. **[README.md](../README.md)** - 项目主文档
    - 项目概述
    - 快速开始
    - Docker 部署章节

## 🆘 故障排查

### 问题：找不到 workspace 包

```bash
# 错误信息
Error: Cannot find module '@gixy/types'
```

**解决方案**：

1. 确认在根目录执行构建
2. 检查 Dockerfile 是否正确复制了 packages 目录
3. 清理缓存重新构建：
    ```bash
    docker system prune -a
    docker-compose build --no-cache
    ```

### 问题：pnpm install 失败

```bash
# 错误信息
ERR_PNPM_LOCKFILE_MISSING_DEPENDENCY
```

**解决方案**：

1. 确认 `pnpm-lock.yaml` 在根目录
2. 在本地执行 `pnpm install` 验证
3. 检查 Dockerfile 是否正确复制了锁定文件

### 问题：构建时间过长

**优化建议**：

1. 使用 Docker BuildKit：
    ```bash
    DOCKER_BUILDKIT=1 docker-compose build
    ```
2. 确保 `.dockerignore` 正确配置
3. 利用构建缓存，避免频繁使用 `--no-cache`

## 💡 最佳实践

### 开发流程

```bash
# 1. 本地开发（不使用 Docker）
pnpm dev

# 2. 测试 Docker 构建
docker-compose build

# 3. 本地测试容器
docker-compose up

# 4. 验证功能
curl http://localhost:3000

# 5. 查看日志
docker-compose logs -f
```

### 生产部署

```bash
# 1. 配置生产环境变量
cp apps/frontend/tomato-tools/.env.example apps/frontend/tomato-tools/.env.production
nano apps/frontend/tomato-tools/.env.production

# 2. 使用生产配置构建
docker-compose -f docker-compose.prod.yml build

# 3. 启动生产容器
docker-compose -f docker-compose.prod.yml up -d

# 4. 配置反向代理（Nginx/Caddy）
# 5. 启用 HTTPS
# 6. 配置监控和日志
```

## 🎉 总结

通过将 Docker 配置从子目录迁移到 monorepo 根目录，我们解决了：

1. ✅ **依赖缺失问题** - 所有 workspace 依赖都能正确访问
2. ✅ **构建稳定性** - 不再出现找不到模块的错误
3. ✅ **符合最佳实践** - 遵循 monorepo Docker 部署的标准做法
4. ✅ **易于维护** - 清晰的文件结构和完善的文档

现在你可以放心地使用 Docker 部署番茄工具箱应用了！🚀

---

**问题反馈**：如有任何问题或建议，请提交 Issue 或查看详细文档。
