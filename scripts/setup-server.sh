#!/bin/bash

# Tomato Tools 服务器环境配置脚本

set -e

echo "=========================================="
echo "Tomato Tools 服务器环境配置"
echo "=========================================="
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查是否为 root 用户
if [ "$EUID" -ne 0 ]; then 
    echo -e "${YELLOW}提示: 建议使用 root 用户运行此脚本${NC}"
    echo "如果遇到权限问题，请使用: sudo bash $0"
    echo ""
fi

# 1. 更新系统
echo -e "${GREEN}[1/6] 更新系统包...${NC}"
apt-get update -y
apt-get upgrade -y

# 2. 安装 Docker
echo -e "${GREEN}[2/6] 安装 Docker...${NC}"
if ! command -v docker &> /dev/null; then
    echo "Docker 未安装，开始安装..."
    curl -fsSL https://get.docker.com | bash
    systemctl start docker
    systemctl enable docker
    echo -e "${GREEN}✅ Docker 安装完成${NC}"
else
    echo -e "${YELLOW}Docker 已安装，跳过${NC}"
fi

# 3. 安装 Docker Compose
echo -e "${GREEN}[3/6] 安装 Docker Compose...${NC}"
if ! command -v docker-compose &> /dev/null; then
    echo "Docker Compose 未安装，开始安装..."
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    echo -e "${GREEN}✅ Docker Compose 安装完成${NC}"
else
    echo -e "${YELLOW}Docker Compose 已安装，跳过${NC}"
fi

# 4. 创建应用目录
echo -e "${GREEN}[4/6] 创建应用目录...${NC}"
APP_DIR="/opt/tomato-tools"
mkdir -p $APP_DIR
echo -e "${GREEN}✅ 应用目录创建完成: $APP_DIR${NC}"

# 5. 配置防火墙
echo -e "${GREEN}[5/6] 配置防火墙...${NC}"
if command -v ufw &> /dev/null; then
    echo "配置 UFW 防火墙..."
    ufw allow 22/tcp    # SSH
    ufw allow 3000/tcp  # 应用端口
    ufw --force enable
    echo -e "${GREEN}✅ 防火墙配置完成${NC}"
else
    echo -e "${YELLOW}UFW 未安装，跳过防火墙配置${NC}"
    echo -e "${YELLOW}请手动确保端口 3000 已开放${NC}"
fi

# 6. 配置 SSH（可选）
echo -e "${GREEN}[6/6] 配置 SSH...${NC}"
read -p "是否要配置 SSH 密钥认证？(y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "请将您的 SSH 公钥粘贴到下面（按 Ctrl+D 结束）："
    mkdir -p ~/.ssh
    chmod 700 ~/.ssh
    cat >> ~/.ssh/authorized_keys
    chmod 600 ~/.ssh/authorized_keys
    echo -e "${GREEN}✅ SSH 密钥已添加${NC}"
else
    echo -e "${YELLOW}跳过 SSH 密钥配置${NC}"
fi

# 显示系统信息
echo ""
echo "=========================================="
echo -e "${GREEN}✅ 环境配置完成！${NC}"
echo "=========================================="
echo ""
echo "系统信息:"
echo "  操作系统: $(lsb_release -d | cut -f2)"
echo "  Docker 版本: $(docker --version)"
echo "  Docker Compose 版本: $(docker-compose --version)"
echo "  应用目录: $APP_DIR"
echo ""
echo "下一步操作:"
echo "  1. 在 GitHub 仓库中配置 Secrets"
echo "  2. 推送代码触发自动部署"
echo "  3. 或手动运行 GitHub Actions workflow"
echo ""
echo "查看部署日志:"
echo "  docker logs -f tomato-tools"
echo ""
echo "重启应用:"
echo "  docker restart tomato-tools"
echo ""
echo "停止应用:"
echo "  docker stop tomato-tools"
echo ""
echo "=========================================="
