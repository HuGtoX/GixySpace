# GitHub Actions CI/CD 部署指南

本文档说明如何使用 GitHub Actions 自动构建和部署 Tomato Tools 项目到腾讯云轻量服务器。

## 📋 前置要求

### 1. 服务器要求

- 腾讯云轻量服务器（或其他云服务器）
- 已安装 Docker 和 Docker Compose
- 开放 3000 端口（或其他自定义端口）
- SSH 访问权限

### 2. GitHub 仓库要求

- 项目已推送到 GitHub
- 有仓库的管理员权限（用于配置 Secrets）

## 🔐 配置 GitHub Secrets

在 GitHub 仓库中配置以下 Secrets：

### 服务器连接配置

| Secret 名称       | 说明             | 示例               |
| ----------------- | ---------------- | ------------------ |
| `SERVER_HOST`     | 服务器 IP 地址   | `123.456.789.0`    |
| `SERVER_USERNAME` | SSH 用户名       | `root` 或 `ubuntu` |
| `SERVER_PASSWORD` | SSH 密码         | `your-password`    |
| `SERVER_PORT`     | SSH 端口（可选） | `22`（默认）       |

### Next.js 公共环境变量（构建时需要）

| Secret 名称                     | 说明              | 必需 |
| ------------------------------- | ----------------- | ---- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Supabase 项目 URL | ✅   |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 匿名密钥 | ✅   |
| `NEXT_PUBLIC_SITE_URL`          | 网站访问地址      | ✅   |

### 运行时环境变量

| Secret 名称                 | 说明                        | 必需 |
| --------------------------- | --------------------------- | ---- |
| `DATABASE_URL`              | PostgreSQL 数据库连接字符串 | ✅   |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase 服务角色密钥       | ✅   |
| `UPSTASH_REDIS_REST_URL`    | Upstash Redis URL           | ✅   |
| `UPSTASH_REDIS_REST_TOKEN`  | Upstash Redis Token         | ✅   |
| `AI_API_KEY`                | AI API 密钥                 | ⚠️   |
| `TD_AGENT_API_KEY`          | TD Agent API 密钥           | ⚠️   |
| `TD_AGENT_WEATHAER_KEY`     | TD Agent 天气密钥           | ⚠️   |
| `TD_AGENT_TODO_KEY`         | TD Agent TODO 密钥          | ⚠️   |
| `HF_BASEURL`                | 和风天气 API 地址           | ⚠️   |
| `QWEATHER_KEY`              | 和风天气 API 密钥           | ⚠️   |
| `COZE_API_KEY`              | 扣子 API 密钥               | ⚠️   |
| `PINO_LOG_LEVEL`            | 日志级别                    | ❌   |
| `SMTP_HOST`                 | SMTP 服务器地址             | ⚠️   |
| `SMTP_PORT`                 | SMTP 端口                   | ⚠️   |
| `SMTP_USER`                 | SMTP 用户名                 | ⚠️   |
| `SMTP_PASSWORD`             | SMTP 密码                   | ⚠️   |
| `SMTP_FROM_EMAIL`           | 发件人邮箱                  | ⚠️   |
| `SMTP_FROM_NAME`            | 发件人名称                  | ⚠️   |

### Docker Hub 配置（可选）

如果需要推送镜像到 Docker Hub：

| Secret 名称       | 说明                    |
| ----------------- | ----------------------- |
| `DOCKER_USERNAME` | Docker Hub 用户名       |
| `DOCKER_PASSWORD` | Docker Hub 密码或 Token |

## 📝 配置步骤

### 1. 添加 GitHub Secrets

1. 进入 GitHub 仓库页面
2. 点击 `Settings` → `Secrets and variables` → `Actions`
3. 点击 `New repository secret`
4. 逐个添加上述 Secrets

### 2. 准备服务器

在腾讯云轻量服务器上执行以下命令：

```bash
# 安装 Docker（如果未安装）
curl -fsSL https://get.docker.com | bash

# 启动 Docker 服务
sudo systemctl start docker
sudo systemctl enable docker

# 创建应用目录
sudo mkdir -p /opt/tomato-tools
sudo chown -R $USER:$USER /opt/tomato-tools

# 配置防火墙（开放 3000 端口）
sudo ufw allow 3000/tcp
```

### 3. 触发部署

部署会在以下情况自动触发：

- 推送代码到 `main` 或 `master` 分支
- 修改了以下路径的文件：
    - `apps/frontend/tomato-tools/**`
    - `packages/**`
    - `Dockerfile`
    - `docker-compose.yml`
    - `pnpm-workspace.yaml`
    - `package.json`
    - `pnpm-lock.yaml`

也可以手动触发：

1. 进入 GitHub 仓库的 `Actions` 页面
2. 选择 `构建和部署 Tomato Tools` workflow
3. 点击 `Run workflow` 按钮

## 🚀 部署流程

workflow 会执行以下步骤：

1. **检出代码** - 从 GitHub 拉取最新代码
2. **设置环境** - 配置 Node.js 和 pnpm
3. **安装依赖** - 安装项目依赖
4. **代码检查** - 运行 ESLint 检查代码质量
5. **构建镜像** - 使用 Docker Buildx 构建镜像
6. **上传镜像** - 将镜像上传到服务器
7. **部署应用** - 在服务器上加载镜像并启动容器
8. **健康检查** - 验证应用是否正常运行
9. **发送通知** - 输出部署结果

## 📊 监控部署

### 查看 GitHub Actions 日志

1. 进入仓库的 `Actions` 页面
2. 点击最新的 workflow 运行记录
3. 查看各个步骤的执行日志

### 查看服务器日志

SSH 连接到服务器后执行：

```bash
# 查看容器状态
docker ps -f name=tomato-tools

# 查看容器日志
docker logs tomato-tools

# 实时查看日志
docker logs -f tomato-tools

# 查看最近 100 行日志
docker logs --tail 100 tomato-tools
```

## 🔧 故障排查

### 1. 构建失败

**问题**：Docker 镜像构建失败

**解决方案**：

- 检查 Dockerfile 语法
- 确认所有构建参数（NEXT*PUBLIC*\*）已正确配置
- 查看 GitHub Actions 日志中的错误信息

### 2. 上传失败

**问题**：无法上传镜像到服务器

**解决方案**：

- 检查服务器 SSH 连接配置
- 确认 `SERVER_HOST`、`SERVER_USERNAME`、`SERVER_PASSWORD` 正确
- 检查服务器磁盘空间是否充足

### 3. 容器启动失败

**问题**：容器无法启动或立即退出

**解决方案**：

- SSH 连接到服务器，执行 `docker logs tomato-tools` 查看错误
- 检查环境变量是否完整
- 确认数据库连接是否正常
- 检查端口 3000 是否被占用

### 4. 健康检查失败

**问题**：应用启动但健康检查失败

**解决方案**：

- 确认 `NEXT_PUBLIC_SITE_URL` 配置正确
- 检查防火墙是否开放 3000 端口
- 确认应用的 `/api/health` 端点正常工作
- 增加健康检查的等待时间

## 🔄 回滚部署

如果新版本出现问题，可以快速回滚：

```bash
# SSH 连接到服务器
ssh user@your-server-ip

# 查看所有镜像
docker images

# 停止当前容器
docker stop tomato-tools
docker rm tomato-tools

# 使用旧版本镜像启动（如果保留了旧镜像）
docker run -d \
  --name tomato-tools \
  --restart unless-stopped \
  -p 3000:3000 \
  --env-file /opt/tomato-tools/.env \
  tomato-tools:previous-tag
```

## 🎯 优化建议

### 1. 使用 SSH 密钥认证

相比密码认证，SSH 密钥更安全：

```bash
# 在本地生成密钥对
ssh-keygen -t ed25519 -C "github-actions"

# 将公钥添加到服务器
ssh-copy-id -i ~/.ssh/id_ed25519.pub user@server-ip

# 在 GitHub Secrets 中添加私钥
# SECRET_NAME: SERVER_SSH_KEY
# VALUE: 私钥内容（cat ~/.ssh/id_ed25519）
```

然后修改 workflow 中的 SSH 步骤，使用 `key` 参数替代 `password`。

### 2. 使用 Docker Registry

将镜像推送到 Docker Hub 或私有 Registry，避免每次都传输大文件：

```yaml
# 推送到 Docker Hub
- name: 推送镜像
  run: |
      docker tag tomato-tools:latest username/tomato-tools:latest
      docker push username/tomato-tools:latest

# 在服务器上拉取
- name: 部署
  run: |
      docker pull username/tomato-tools:latest
      docker run -d ... username/tomato-tools:latest
```

### 3. 使用环境文件

在服务器上创建 `.env` 文件，避免在命令行中暴露敏感信息：

```bash
# 在服务器上创建 .env 文件
cat > /opt/tomato-tools/.env << EOF
DATABASE_URL=postgresql://...
SUPABASE_SERVICE_ROLE_KEY=...
# ... 其他环境变量
EOF

# 使用 --env-file 参数
docker run -d \
  --name tomato-tools \
  --env-file /opt/tomato-tools/.env \
  tomato-tools:latest
```

### 4. 配置 Nginx 反向代理

使用 Nginx 作为反向代理，支持 HTTPS 和域名访问：

```nginx
server {
    listen 80;
    server_name your-domain.com;

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

## 📚 相关文档

- [Docker 部署文档](./DOCKER_DEPLOYMENT.md)
- [环境变量配置指南](./environment-variables-guide.md)
- [GitHub Actions 官方文档](https://docs.github.com/en/actions)

## 🆘 获取帮助

如果遇到问题：

1. 查看 GitHub Actions 日志
2. 查看服务器容器日志
3. 参考故障排查章节
4. 提交 Issue 到项目仓库
