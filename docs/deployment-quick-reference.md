# 🚀 Tomato Tools 部署快速参考

## GitHub Secrets 配置清单

### 服务器连接（必需）

```
✅ SERVER_HOST              # 服务器IP地址
✅ SERVER_USERNAME          # SSH用户名
✅ SERVER_SSH_KEY           # SSH私钥（推荐）
   或 SERVER_PASSWORD       # SSH密码
   SERVER_PORT              # SSH端口（默认22）
```

### Next.js 构建变量（必需）

```
✅ NEXT_PUBLIC_SUPABASE_URL
✅ NEXT_PUBLIC_SUPABASE_ANON_KEY
✅ NEXT_PUBLIC_SITE_URL
```

### 运行时环境变量（必需）

```
✅ DATABASE_URL
✅ SUPABASE_SERVICE_ROLE_KEY
✅ UPSTASH_REDIS_REST_URL
✅ UPSTASH_REDIS_REST_TOKEN
```

### 可选 API 密钥

```
⚠️  AI_API_KEY
⚠️  TD_AGENT_API_KEY
⚠️  TD_AGENT_WEATHAER_KEY
⚠️  TD_AGENT_TODO_KEY
⚠️  HF_BASEURL
⚠️  QWEATHER_KEY
⚠️  COZE_API_KEY
⚠️  SMTP_HOST
⚠️  SMTP_PORT
⚠️  SMTP_USER
⚠️  SMTP_PASSWORD
⚠️  SMTP_FROM_EMAIL
⚠️  SMTP_FROM_NAME
```

---

## 服务器快速配置

### 一键配置脚本

```bash
curl -fsSL https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_REPO/main/scripts/setup-server.sh | sudo bash
```

### 手动配置步骤

```bash
# 1. 安装 Docker
curl -fsSL https://get.docker.com | bash
systemctl start docker
systemctl enable docker

# 2. 创建应用目录
mkdir -p /opt/tomato-tools

# 3. 配置防火墙
ufw allow 22/tcp
ufw allow 3000/tcp
ufw enable

# 4. 添加 SSH 公钥（推荐）
mkdir -p ~/.ssh
echo "YOUR_PUBLIC_KEY" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

---

## 常用命令

### 查看应用状态

```bash
docker ps -f name=tomato-tools
```

### 查看日志

```bash
# 实时日志
docker logs -f tomato-tools

# 最近100行
docker logs --tail 100 tomato-tools

# 带时间戳
docker logs -f --timestamps tomato-tools
```

### 管理应用

```bash
# 重启
docker restart tomato-tools

# 停止
docker stop tomato-tools

# 启动
docker start tomato-tools

# 删除容器
docker rm -f tomato-tools
```

### 查看资源使用

```bash
# 实时资源监控
docker stats tomato-tools

# 磁盘使用
docker system df

# 查看镜像
docker images | grep tomato-tools
```

### 清理资源

```bash
# 清理未使用的镜像
docker image prune -f

# 清理所有未使用的资源
docker system prune -a -f

# 清理旧的备份镜像（保留最近3个）
docker images tomato-tools --format "{{.ID}} {{.CreatedAt}}" | tail -n +4 | awk '{print $1}' | xargs -r docker rmi -f
```

---

## 故障排查

### 容器无法启动

```bash
# 1. 查看详细日志
docker logs tomato-tools

# 2. 检查环境变量
docker exec tomato-tools env | grep -E "DATABASE|SUPABASE|REDIS"

# 3. 检查端口占用
netstat -tlnp | grep 3000

# 4. 检查磁盘空间
df -h
```

### 应用无法访问

```bash
# 1. 检查容器状态
docker ps -a -f name=tomato-tools

# 2. 检查防火墙
ufw status

# 3. 测试本地访问
curl http://localhost:3000/api/health

# 4. 检查网络
docker network inspect bridge
```

### 数据库连接失败

```bash
# 1. 检查 DATABASE_URL
docker exec tomato-tools env | grep DATABASE_URL

# 2. 测试数据库连接
docker exec tomato-tools node -e "require('pg').Client({connectionString: process.env.DATABASE_URL}).connect().then(() => console.log('OK')).catch(console.error)"
```

---

## 回滚部署

### 使用备份镜像

```bash
# 1. 查看备份镜像
docker images | grep backup

# 2. 停止当前容器
docker stop tomato-tools && docker rm tomato-tools

# 3. 使用备份镜像启动
docker run -d \
  --name tomato-tools \
  --restart unless-stopped \
  -p 3000:3000 \
  --env-file /opt/tomato-tools/.env \
  tomato-tools:backup-YYYYMMDD_HHMMSS
```

### 使用旧版本代码

```bash
# 在 GitHub Actions 中手动运行旧的 commit
# 或者在本地重新部署旧版本
```

---

## 性能优化

### 查看容器资源限制

```bash
docker inspect tomato-tools | grep -A 10 "Memory"
```

### 设置资源限制

```bash
docker update --memory="2g" --cpus="2" tomato-tools
```

### 查看应用性能

```bash
# 进入容器
docker exec -it tomato-tools sh

# 查看进程
ps aux

# 查看内存使用
free -h
```

---

## 备份和恢复

### 备份环境文件

```bash
cp /opt/tomato-tools/.env /opt/tomato-tools/.env.backup.$(date +%Y%m%d)
```

### 备份容器

```bash
docker commit tomato-tools tomato-tools:backup-$(date +%Y%m%d_%H%M%S)
```

### 导出镜像

```bash
docker save tomato-tools:latest | gzip > tomato-tools-backup.tar.gz
```

### 恢复镜像

```bash
docker load < tomato-tools-backup.tar.gz
```

---

## 监控和告警

### 设置健康检查

```bash
# 创建监控脚本
cat > /opt/tomato-tools/health-check.sh << 'EOF'
#!/bin/bash
if ! curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "Health check failed at $(date)"
    docker restart tomato-tools
fi
EOF

chmod +x /opt/tomato-tools/health-check.sh

# 添加到 crontab（每5分钟检查一次）
(crontab -l 2>/dev/null; echo "*/5 * * * * /opt/tomato-tools/health-check.sh") | crontab -
```

### 日志轮转

```bash
# Docker 自动日志轮转配置
cat > /etc/docker/daemon.json << EOF
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
EOF

systemctl restart docker
```

---

## 安全建议

1. ✅ 使用 SSH 密钥而不是密码
2. ✅ 定期更新系统和 Docker
3. ✅ 使用非 root 用户运行容器
4. ✅ 配置防火墙只开放必要端口
5. ✅ 定期备份数据和配置
6. ✅ 使用环境变量管理敏感信息
7. ✅ 启用 HTTPS（使用 Nginx + Let's Encrypt）
8. ✅ 监控应用日志和性能

---

## 有用的链接

- 📖 [详细部署指南](../docs/github-actions-deploy-guide.md)
- 🐳 [Docker 部署文档](../docs/DOCKER_DEPLOYMENT.md)
- 🔧 [环境变量配置](../docs/environment-variables-guide.md)
- 🚀 [GitHub Actions 文档](https://docs.github.com/en/actions)
- 🐋 [Docker 官方文档](https://docs.docker.com/)

---

**提示**: 将此文件保存为书签，方便快速查找命令！
