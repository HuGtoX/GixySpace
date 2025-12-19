# Docker 部署文件说明

本文档说明为番茄工具箱项目创建的 Docker 相关文件及其用途。

## 📁 创建的文件列表

### 1. Dockerfile

**路径**: `./Dockerfile`

**用途**: Docker 镜像构建文件

**特点**:

- 采用多阶段构建，优化镜像大小
- 基于 Node.js 20 Alpine 镜像
- 支持 pnpm 包管理器
- 使用非 root 用户运行，提高安全性
- 最终镜像大小约 200-300MB

**构建阶段**:

1. **deps**: 安装项目依赖
2. **builder**: 构建 Next.js 应用
3. **runner**: 生产运行环境

### 2. docker-compose.yml

**路径**: `./docker-compose.yml`

**用途**: Docker Compose 编排配置文件

**功能**:

- 简化容器启动和管理
- 配置所有必需的环境变量
- 设置健康检查
- 配置资源限制（CPU 和内存）
- 网络配置

**默认配置**:

- 端口映射: 3000:3000
- CPU 限制: 最大 2 核
- 内存限制: 最大 2GB
- 健康检查间隔: 30 秒

### 3. .dockerignore

**路径**: `./.dockerignore`

**用途**: 指定不需要复制到 Docker 镜像的文件

**排除内容**:

- node_modules（会在容器内重新安装）
- .next 构建缓存
- 环境变量文件
- Git 相关文件
- 文档和测试文件
- 开发工具配置

**效果**: 减少构建上下文大小，加快构建速度

### 4. .env.example

**路径**: `./.env.example`

**用途**: 环境变量配置示例文件

**包含配置**:

- Next.js 基础配置
- Supabase 认证配置
- 数据库连接配置
- Redis 配置
- AI API 配置
- 天气 API 配置
- SMTP 邮件配置

**使用方法**: 复制为 `.env` 并填入实际值

### 5. docker-start.sh

**路径**: `./docker-start.sh`

**用途**: Linux/Mac 快速启动脚本

**功能**:

- 自动检查 Docker 和 Docker Compose
- 自动创建 .env 文件（如果不存在）
- 一键构建和启动容器
- 显示容器状态
- 可选查看实时日志

**使用方法**:

```bash
chmod +x docker-start.sh
./docker-start.sh
```

### 6. docker-start.bat

**路径**: `./docker-start.bat`

**用途**: Windows 快速启动脚本

**功能**: 与 docker-start.sh 相同，适配 Windows 环境

**使用方法**:

```bash
docker-start.bat
```

### 7. docs/DOCKER_DEPLOYMENT.md

**路径**: `./docs/DOCKER_DEPLOYMENT.md`

**用途**: 详细的 Docker 部署指南

**内容**:

- 前置要求
- 快速开始指南
- 常用命令说明
- 配置说明
- 故障排查
- 生产环境部署建议
- 安全最佳实践

## 🔧 配置修改

### next.config.ts

在 Next.js 配置文件中添加了 `output: 'standalone'` 配置，这是 Docker 部署的关键配置。

**作用**:

- 生成独立的输出目录
- 包含运行所需的最小文件集
- 减小最终镜像大小
- 提高启动速度

## 📝 使用流程

### 首次部署

1. **配置环境变量**

   ```bash
   cp .env.example .env
   # 编辑 .env 文件
   ```

2. **启动服务**

   ```bash
   # 使用快速启动脚本
   ./docker-start.sh  # Linux/Mac
   docker-start.bat   # Windows

   # 或使用 Docker Compose
   docker-compose up -d
   ```

3. **访问应用**
   ```
   http://localhost:3000
   ```

### 日常维护

```bash
# 查看日志
docker-compose logs -f

# 重启服务
docker-compose restart

# 停止服务
docker-compose down

# 更新应用
git pull
docker-compose up -d --build
```

## 🎯 最佳实践

### 开发环境

- 使用 `docker-compose.yml` 进行本地测试
- 挂载代码卷以支持热重载（需要修改配置）
- 使用 `.env.local` 存储本地配置

### 生产环境

- 使用环境变量管理敏感信息
- 配置 HTTPS 反向代理（Nginx/Caddy）
- 启用日志收集和监控
- 定期备份数据库
- 使用 Docker Swarm 或 Kubernetes 进行编排

### 安全建议

- 不要将 `.env` 文件提交到版本控制
- 使用 Docker Secrets 管理敏感信息
- 定期更新基础镜像
- 限制容器资源使用
- 使用非 root 用户运行容器（已配置）

## 🔍 故障排查

### 常见问题

1. **容器无法启动**

   - 检查环境变量配置
   - 查看容器日志: `docker-compose logs`
   - 确认端口未被占用

2. **构建失败**

   - 清理 Docker 缓存: `docker system prune -a`
   - 检查网络连接
   - 确认 package.json 完整

3. **应用无法访问**
   - 检查容器状态: `docker-compose ps`
   - 验证端口映射
   - 检查防火墙设置

## 📚 相关文档

- [Dockerfile 参考](https://docs.docker.com/engine/reference/builder/)
- [Docker Compose 文档](https://docs.docker.com/compose/)
- [Next.js Docker 部署](https://nextjs.org/docs/deployment#docker-image)
- [完整部署指南](./DOCKER_DEPLOYMENT.md)

## 🎉 总结

通过这些 Docker 配置文件，你可以：

✅ 快速部署应用到任何支持 Docker 的环境  
✅ 保证开发和生产环境的一致性  
✅ 简化部署流程，降低运维成本  
✅ 轻松扩展和管理应用实例  
✅ 提高应用的可移植性和可维护性

如有问题，请参考 [DOCKER_DEPLOYMENT.md](./DOCKER_DEPLOYMENT.md) 或提交 Issue。
