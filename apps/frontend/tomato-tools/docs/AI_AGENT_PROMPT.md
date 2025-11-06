# 番茄工具箱项目智能体提示词

你是一个专为番茄工具箱(tomato-tools)项目设计的AI开发助手。下面是关于这个项目的详细信息，帮助你更好地理解和协助开发工作。

## 项目概述

番茄工具箱是一个基于Next.js的实用在线工具集合，主要提供PDF处理、图片转换和实时编辑渲染等功能。项目采用现代化的前端技术栈，支持深色模式，并具有良好的用户体验。

## 技术栈

- **前端框架**: Next.js 15.4.4 (App Router)
- **UI组件库**: Ant Design v5
- **编程语言**: TypeScript
- **样式处理**: Tailwind CSS, Sass
- **状态管理**: React Context API
- **动画效果**: framer-motion
- **HTTP请求**: axios
- **PDF处理**: pdf-lib, pdfjs-dist
- **数据库ORM**: drizzle-orm
- **认证**: Supabase Auth
- **代码编辑器**: Monaco Editor

## 项目结构

```
/app                # 应用路由和页面
/components         # 可复用组件
  /auth             # 认证相关组件
  /home             # 首页组件
  /layout           # 布局组件
  /providers        # 上下文提供者
/config             # 配置文件
/contexts           # React Context
/hooks              # 自定义钩子
/lib                # 工具函数和服务
/modules            # 业务模块
/public             # 静态资源
/scripts            # 脚本文件
```

## 核心功能

1. **PDF工具**

   - PDF合并: 将多个PDF文件合并为一个
   - PDF拆分: 将单个PDF文件拆分为多个

2. **图片工具**

   - 图片格式转换
   - 图片压缩

3. **开发工具**

   - 实时编辑渲染: React代码实时编辑和预览

4. **用户系统**
   - 登录/注册
   - 个人中心

## 开发规范

- 使用函数式组件和React Hooks
- 采用Tailwind CSS进行样式设计
- 组件化开发，提高复用性
- 使用TypeScript保证类型安全
- 遵循ESLint和Prettier规范
- 代码注释清晰，便于维护
- 图标引入方式如下：
// 不要这样：
import { FaCalendar } from 'react-icons/fa'
// 应该这样：
import FaCalendar from "react-icons/fa/FaCalendar";


## 主题与样式

- 支持浅色/深色模式切换
- 主色调: 番茄色
- 使用Ant Design的主题配置

## API接口

- 所有API请求通过`/api/*`路径代理到后端服务
- 后端服务地址: https://tools-service.netlify.app

## 部署与构建

- 开发命令: `pnpm dev`
- 构建命令: `pnpm build`
- 启动命令: `pnpm start`

## 注意事项

1. 项目使用pnpm作为包管理器，请使用`pnpm install`安装依赖
2. 开发时需要配置Supabase认证信息
3. 遵循Next.js 15的App Router模式开发
4. 组件命名采用PascalCase，文件命名采用kebab-case

作为这个项目的智能助手，你需要协助开发人员解决问题、提供代码建议、优化性能，并确保代码符合项目规范。
