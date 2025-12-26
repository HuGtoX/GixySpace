# 番茄工具箱 Dockerfile (Monorepo 版本)
# 使用多阶段构建优化镜像大小

# ============================================
# 阶段1: 依赖安装
# ============================================
FROM node:20-alpine AS deps

# 安装 pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# 设置工作目录
WORKDIR /app

# 复制 workspace 配置文件
COPY pnpm-workspace.yaml ./
COPY package.json pnpm-lock.yaml ./

# 复制所有 workspace 包的 package.json
COPY packages/types/package.json ./packages/types/
COPY packages/utils/package.json ./packages/utils/
COPY packages/eslint/package.json ./packages/eslint/
COPY apps/frontend/tomato-tools/package.json ./apps/frontend/tomato-tools/

# 安装所有依赖（包括 workspace 依赖）
RUN pnpm install --frozen-lockfile

# ============================================
# 阶段2: 构建应用
# ============================================
FROM node:20-alpine AS builder

# 安装 pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# 从deps阶段复制所有node_modules（包括子目录的）
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/eslint/node_modules ./packages/eslint/node_modules
COPY --from=deps /app/apps/frontend/tomato-tools/node_modules ./apps/frontend/tomato-tools/node_modules
COPY --from=deps /app/pnpm-workspace.yaml ./
COPY --from=deps /app/package.json ./
COPY --from=deps /app/pnpm-lock.yaml ./

# 复制 workspace 包源代码
COPY packages/types ./packages/types
COPY packages/utils ./packages/utils
COPY packages/eslint ./packages/eslint

# 复制 tomato-tools 应用源代码
COPY apps/frontend/tomato-tools ./apps/frontend/tomato-tools

# 声明构建参数
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_SITE_URL
ARG DATABASE_URL

# 设置环境变量（构建时）
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV DATABASE_URL=$DATABASE_URL

# 在根目录执行构建（pnpm workspace 会自动处理依赖）
RUN pnpm build:new

# ============================================
# 阶段3: 生产运行
# ============================================
FROM node:20-alpine AS runner

WORKDIR /app

# 设置环境变量
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# 创建非root用户
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Next.js standalone 模式会在 .next/standalone 中生成完整的应用
# 需要复制整个 standalone 目录的内容
COPY --from=builder /app/apps/frontend/tomato-tools/.next/standalone ./

# 复制 public 目录到正确的位置（相对于 standalone 的应用路径）
COPY --from=builder /app/apps/frontend/tomato-tools/public ./apps/frontend/tomato-tools/public

# 复制静态文件到正确的位置（相对于 standalone 的应用路径）
COPY --from=builder /app/apps/frontend/tomato-tools/.next/static ./apps/frontend/tomato-tools/.next/static

# 设置文件权限
RUN chown -R nextjs:nodejs /app

# 切换到非root用户
USER nextjs

# 暴露端口
EXPOSE 3000

# 启动应用
CMD ["node", "apps/frontend/tomato-tools/server.js"]
