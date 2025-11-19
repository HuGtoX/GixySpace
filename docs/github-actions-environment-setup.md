# GitHub Actions 环境配置指南

本文档详细说明如何为番茄工具箱项目配置 GitHub Actions 的执行环境。

## 📋 目录

- [环境概述](#环境概述)
- [配置步骤](#配置步骤)
- [环境变量说明](#环境变量说明)
- [工作流使用](#工作流使用)
- [最佳实践](#最佳实践)

## 🎯 环境概述

项目使用 GitHub Environments 来管理不同的执行环境，支持以下环境：

- **development**：开发环境，用于测试和开发
- **production**：生产环境，用于正式运行

## 🔧 配置步骤

### 1. 创建 GitHub Environments

#### 方法一：通过网页界面（推荐）

1. **访问环境设置页面**

    ```
    https://github.com/HuGtoX/-GixySpace/settings/environments
    ```

2. **创建 development 环境**

    - 点击 **"New environment"**
    - 输入名称：`development`
    - 点击 **"Configure environment"**

3. **创建 production 环境**
    - 重复上述步骤，输入名称：`production`

#### 方法二：通过 GitHub CLI

```bash
# 需要先安装 GitHub CLI
gh api repos/HuGtoX/-GixySpace/environments/development -X PUT
gh api repos/HuGtoX/-GixySpace/environments/production -X PUT
```

### 2. 配置环境变量和 Secrets

#### Development 环境配置

1. 进入 development 环境配置页面
2. 在 **"Environment secrets"** 部分点击 **"Add secret"**
3. 添加以下 Secrets：

| Secret Name    | Description          | Example Value                                 |
| -------------- | -------------------- | --------------------------------------------- |
| `DATABASE_URL` | 开发数据库连接字符串 | `postgresql://user:pass@dev-host:5432/dev_db` |

#### Production 环境配置

1. 进入 production 环境配置页面
2. 添加以下 Secrets：

| Secret Name    | Description          | Example Value                                   |
| -------------- | -------------------- | ----------------------------------------------- |
| `DATABASE_URL` | 生产数据库连接字符串 | `postgresql://user:pass@prod-host:5432/prod_db` |

### 3. 配置环境保护规则（可选）

#### Production 环境保护规则建议

1. **Required reviewers**（必需审批者）

    - 添加团队成员作为审批者
    - 确保生产部署经过审核

2. **Wait timer**（等待时间）

    - 设置延迟时间（如 5 分钟）
    - 给予取消部署的缓冲时间

3. **Deployment branches**（部署分支限制）
    - 选择 **"Selected branches"**
    - 添加规则：`main`
    - 确保只有主分支可以部署到生产环境

#### Development 环境配置建议

- 不设置审批者（快速迭代）
- 允许 `dev` 和 `main` 分支部署

## 📝 环境变量说明

### 必需的 Secrets

#### DATABASE_URL

- **用途**：数据库连接字符串
- **格式**：`postgresql://username:password@host:port/database`
- **示例**：

    ```
    # Supabase 格式
    postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres

    # 标准 PostgreSQL 格式
    postgresql://myuser:mypassword@localhost:5432/mydatabase
    ```

### 可选的环境变量

如果需要添加其他环境变量，可以在环境配置页面的 **"Environment variables"** 部分添加：

| Variable Name | Description  | Example                      |
| ------------- | ------------ | ---------------------------- |
| `NODE_ENV`    | Node.js 环境 | `production` / `development` |
| `LOG_LEVEL`   | 日志级别     | `info` / `debug`             |

## 🚀 工作流使用

### 手动触发工作流

#### Test Scheduled Task（测试工作流）

1. 访问 Actions 页面：

    ```
    https://github.com/HuGtoX/-GixySpace/actions
    ```

2. 选择 **"Test Daily Sentence Task"**

3. 点击 **"Run workflow"**

4. 选择参数：

    - **Branch**：选择分支（`dev` 或 `main`）
    - **执行环境**：
        - `development`：使用开发环境的配置
        - `production`：使用生产环境的配置
    - **测试模式**：
        - `dry-run`：模拟运行，不写入数据库
        - `full`：完整运行，实际写入数据库

5. 点击 **"Run workflow"** 开始执行

#### Scheduled Tasks（定时任务）

- 自动运行：每天 UTC 16:00（北京时间凌晨 0:00）
- 使用环境：`production`
- 也可以手动触发（使用生产环境配置）

### 工作流配置说明

#### test-scheduled-task.yml

```yaml
jobs:
    test-fetch-daily-sentence:
        runs-on: ubuntu-latest
        environment: ${{ github.event.inputs.environment || 'development' }}
        # 使用用户选择的环境，默认为 development
```

特点：

- ✅ 支持选择执行环境
- ✅ 支持 dry-run 模式
- ✅ 适合测试和验证

#### scheduled-tasks.yml

```yaml
jobs:
    fetch-daily-sentence:
        runs-on: ubuntu-latest
        environment: production
        # 固定使用 production 环境
```

特点：

- ✅ 固定使用生产环境
- ✅ 定时自动执行
- ✅ 适合正式运行

## 🎨 最佳实践

### 1. 环境隔离

- **开发环境**：使用测试数据库，可以随意测试
- **生产环境**：使用正式数据库，需要谨慎操作

### 2. 安全配置

- ✅ 永远不要在代码中硬编码敏感信息
- ✅ 使用 Secrets 存储敏感数据
- ✅ 为生产环境设置保护规则
- ✅ 定期轮换密钥和密码

### 3. 测试流程

推荐的测试流程：

```mermaid
graph LR
    A[本地开发] --> B[推送到 dev 分支]
    B --> C[自动触发测试工作流]
    C --> D{测试通过?}
    D -->|是| E[手动触发 development 环境]
    E --> F{验证通过?}
    F -->|是| G[合并到 main 分支]
    G --> H[手动触发 production 环境]
    D -->|否| A
    F -->|否| A
```

### 4. 监控和日志

- 定期检查工作流执行日志
- 关注失败通知
- 验证数据库写入结果

## 🔍 故障排查

### 问题：工作流无法访问 DATABASE_URL

**原因**：Secret 未正确配置

**解决方案**：

1. 检查 Secret 名称是否为 `DATABASE_URL`（区分大小写）
2. 确认 Secret 已添加到对应的环境中
3. 验证工作流中的环境名称是否正确

### 问题：生产环境部署需要审批

**原因**：环境保护规则已启用

**解决方案**：

1. 这是正常的安全机制
2. 联系审批者进行审批
3. 或在环境设置中调整保护规则

### 问题：工作流在 GitHub Actions 页面不显示

**原因**：工作流从未被触发过

**解决方案**：

1. 推送代码到触发分支
2. 或手动触发工作流
3. 等待定时任务自动执行

## 📚 相关资源

- [GitHub Actions 文档](https://docs.github.com/en/actions)
- [GitHub Environments 文档](https://docs.github.com/en/actions/deployment/targeting-different-environments/using-environments-for-deployment)
- [GitHub Secrets 文档](https://docs.github.com/en/actions/security-guides/encrypted-secrets)

## 🆘 获取帮助

如有问题，请：

1. 查看工作流执行日志
2. 检查本文档的故障排查部分
3. 联系项目维护者

---

**最后更新**：2025-11-19
**维护者**：番茄工具箱团队
