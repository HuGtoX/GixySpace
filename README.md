# Gixy Workspace

`gixy_work` 工作区，包含多个前端应用和工具包，主要使用 React、TypeScript 和 Vite 构建。

## 项目结构

- `apps/frontend/easy-tools`: 一个基于 React、TypeScript 和 Vite 的前端工具项目。
- `packages/utils`: 包含一些通用工具函数的工具包。

### easy-tools 项目

#### 主要功能

- PDF 合并功能：可以上传多个 PDF 文件并将它们合并成一个文件。
- 包含自定义的头部、工具栏和容器组件。

## 安装依赖

```bash
pnpm install
```

## 开发指南

### easy-tools 项目

- `dev`: 启动开发服务器

```bash
cd apps/frontend/easy-tools
pnpm run dev
```

- `build`: 构建项目

```bash
cd apps/frontend/easy-tools
pnpm run build
```

### tomato-tools 项目

- `dev`: 启动开发服务器

```bash
pnpm dev
# 或
cd apps/frontend/tomato-tools
pnpm run dev
```

- `build`: 构建项目

```bash
pnpm build
# 或
cd apps/frontend/tomato-tools
pnpm run build
```

## 🐳 Docker 部署

本项目支持使用 Docker 部署番茄工具箱应用。

### 快速开始

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

#### 手动部署

1. **配置环境变量**

```bash
cp apps/frontend/tomato-tools/.env.example apps/frontend/tomato-tools/.env
# 编辑 .env 文件，填入实际配置
```

2. **使用 Docker Compose**

```bash
# 在 monorepo 根目录执行
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

### 访问应用

部署完成后访问：http://localhost:3000

### 详细文档

查看完整的 Docker 部署指南：[docs/DOCKER_DEPLOYMENT.md](./docs/DOCKER_DEPLOYMENT.md)

### 注意事项

⚠️ **重要**：所有 Docker 命令必须在 monorepo 根目录执行，因为项目使用 pnpm workspace 管理依赖。

## 贡献指南

如果你想为这个项目做出贡献，请遵循以下步骤：

1. Fork 这个仓库
2. 创建一个新的分支 (`git checkout -b feature/your-feature`)
3. 提交你的更改 (`git commit -am 'Add some feature'`)
4. 将更改推送到分支 (`git push origin feature/your-feature`)
5. 创建一个新的 Pull Request
