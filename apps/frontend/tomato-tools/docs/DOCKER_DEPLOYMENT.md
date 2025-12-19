# Docker 部署指南

本文档介绍如何使用 Docker 部署番茄工具箱项目。

## 📋 前置要求

- Docker 20.10+
- Docker Compose 2.0+
- 至少 2GB 可用内存
- 至少 2GB 可用磁盘空间

## 🚀 快速开始

### 1. 配置环境变量

复制环境变量示例文件并填入实际配置：

```bash
cp .env.example .env
```

编辑 `.env` 文件，填入以下必需的配置：

- **Supabase 配置**：`NEXT_PUBLIC_SUPABASE_URL`、`NEXT_PUBLIC_SUPABASE_ANON_KEY`、`SUPABASE_SERVICE_ROLE_KEY`
- **数据库配置**：`DATABASE_URL`
- **NextAuth 配置**：`NEXTAUTH_SECRET`、`NEXTAUTH_URL`
- 其他可选配置根据需要填写

### 2. 构建并启动容器

使用 Docker Compose 一键启动：

```bash
docker-compose up -d
```

或者使用 Docker 命令：

```bash
# 构建镜像
docker build -t tomato-tools .

# 运行容器
docker run -d \
  --name tomato-tools \
  -p 3000:3000 \
  --env-file .env \
  tomato-tools
```

### 3. 访问应用

应用启动后，访问：http://localhost:3000

## 📝 常用命令

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
```

### 进入容器

```bash
docker-compose exec tomato-tools sh
```

## 🔧 配置说明

### 端口配置

默认端口为 3000，如需修改，编辑 `docker-compose.yml`：

```yaml
ports:
  - "8080:3000" # 将容器的3000端口映射到主机的8080端口
```

### 资源限制

默认资源限制：

- CPU：最大 2 核，预留 0.5 核
- 内存：最大 2GB，预留 512MB

如需调整，编辑 `docker-compose.yml` 中的 `deploy.resources` 部分。

### 健康检查

容器配置了健康检查，每 30 秒检查一次应用状态。查看健康状态：

```bash
docker-compose ps
```

## 🐛 故障排查

### 容器无法启动

1. 检查环境变量是否正确配置
2. 查看容器日志：`docker-compose logs`
3. 确认端口 3000 未被占用

### 应用无法访问

1. 确认容器正在运行：`docker-compose ps`
2. 检查防火墙设置
3. 验证端口映射是否正确

### 数据库连接失败

1. 确认 `DATABASE_URL` 配置正确
2. 检查数据库服务是否可访问
3. 验证数据库凭据

### 构建失败

1. 清理 Docker 缓存：`docker system prune -a`
2. 确保网络连接正常
3. 检查 `package.json` 和依赖是否完整

## 🔐 生产环境部署建议

### 1. 使用 HTTPS

配置反向代理（如 Nginx）启用 HTTPS：

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 2. 环境变量安全

- 不要将 `.env` 文件提交到版本控制
- 使用 Docker Secrets 或环境变量管理工具
- 定期轮换敏感凭据

### 3. 日志管理

配置日志驱动，将日志发送到集中式日志系统：

```yaml
services:
  tomato-tools:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

### 4. 备份策略

- 定期备份数据库
- 备份用户上传的文件
- 保存环境变量配置

### 5. 监控和告警

- 配置容器监控（如 Prometheus + Grafana）
- 设置健康检查告警
- 监控资源使用情况

## 📦 多阶段构建说明

Dockerfile 使用多阶段构建优化镜像大小：

1. **deps 阶段**：安装所有依赖（包括 workspace 依赖）
2. **builder 阶段**：构建 Next.js 应用
3. **runner 阶段**：仅包含运行时必需的文件

最终镜像大小约为 200-300MB。

### Monorepo 特殊配置

本项目是 **monorepo** 结构，与单体项目有以下差异：

**目录结构**：

```
.next/standalone/
├── apps/frontend/tomato-tools/
│   ├── server.js          ← 启动文件在子目录
│   └── .next/
├── packages/              ← 包含 workspace 依赖
│   ├── types/
│   └── utils/
└── node_modules/
```

**关键配置**：

- 启动命令：`node apps/frontend/tomato-tools/server.js`
- 静态文件路径：`apps/frontend/tomato-tools/.next/static`
- 需要复制所有 workspace 包的依赖

## 🔄 更新应用

```bash
# 1. 拉取最新代码
git pull

# 2. 重新构建并启动
docker-compose up -d --build

# 3. 清理旧镜像
docker image prune -f
```

## 📚 相关资源

- [Next.js Docker 部署文档](https://nextjs.org/docs/deployment#docker-image)
- [Docker Compose 文档](https://docs.docker.com/compose/)
- [项目主文档](../README.md)

## 💡 提示

- 首次构建可能需要 5-10 分钟
- 确保 Docker 有足够的资源分配
- 生产环境建议使用 Docker Swarm 或 Kubernetes 进行编排
- 定期更新基础镜像以获取安全补丁

## 🆘 获取帮助

如遇到问题，请：

1. 查看容器日志
2. 检查环境变量配置
3. 参考故障排查部分
4. 提交 Issue 到项目仓库
