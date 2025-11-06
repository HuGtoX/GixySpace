# AI使用记录数据库方案

## 📋 概述

本方案为番茄工具箱项目设计了一套完整的AI使用记录数据库表结构，用于记录和统计用户使用302.ai API的情况。

## 🗂️ 数据库表结构

### 1. ai_usage_logs（AI使用日志表）

记录每次AI API调用的详细信息。

#### 字段说明

| 字段名                | 类型          | 说明                       | 必填 |
| --------------------- | ------------- | -------------------------- | ---- |
| id                    | UUID          | 主键                       | ✅   |
| user_id               | UUID          | 用户ID（外键）             | ✅   |
| scene                 | ENUM          | 使用场景                   | ✅   |
| scene_description     | TEXT          | 场景描述                   | ❌   |
| conversation_category | ENUM          | 对话分类（细粒度）         | ❌   |
| conversation_tags     | JSONB         | 对话标签（如：["urgent"]） | ❌   |
| model                 | TEXT          | AI模型名称                 | ✅   |
| prompt_tokens         | INTEGER       | 输入tokens数量             | ✅   |
| completion_tokens     | INTEGER       | 输出tokens数量             | ✅   |
| total_tokens          | INTEGER       | 总tokens数量               | ✅   |
| estimated_cost        | NUMERIC(10,6) | 预估成本（美元）           | ❌   |
| request_data          | JSONB         | 完整请求数据               | ❌   |
| response_data         | JSONB         | 完整响应数据               | ❌   |
| status                | ENUM          | 请求状态                   | ✅   |
| error_message         | TEXT          | 错误信息                   | ❌   |
| error_code            | TEXT          | 错误代码                   | ❌   |
| duration              | INTEGER       | 请求耗时（毫秒）           | ❌   |
| ip_address            | TEXT          | 用户IP地址                 | ❌   |
| user_agent            | TEXT          | 用户代理                   | ❌   |
| request_id            | TEXT          | 请求ID                     | ❌   |
| created_at            | TIMESTAMP     | 创建时间                   | ✅   |

#### 使用场景枚举（ai_usage_scene）

- `chat` - 聊天对话
- `summary` - 内容摘要
- `translation` - 翻译
- `code_generation` - 代码生成
- `text_optimization` - 文本优化
- `question_answer` - 问答
- `other` - 其他

#### 对话分类枚举（ai_conversation_category）

更细粒度的对话类型分类，可选值包括：

**通用对话类**

- `general_chat` - 通用聊天
- `casual_conversation` - 闲聊

**工作相关类**

- `work_consultation` - 工作咨询
- `technical_support` - 技术支持
- `code_review` - 代码审查
- `debugging_help` - 调试帮助
- `architecture_design` - 架构设计

**学习教育类**

- `learning_tutorial` - 学习教程
- `concept_explanation` - 概念解释
- `homework_help` - 作业辅导

**创作类**

- `content_creation` - 内容创作
- `writing_assistance` - 写作辅助
- `brainstorming` - 头脑风暴

**数据处理类**

- `data_analysis` - 数据分析
- `report_generation` - 报告生成
- `document_summary` - 文档摘要

**语言处理类**

- `translation_service` - 翻译服务
- `grammar_check` - 语法检查
- `text_polishing` - 文本润色

**其他**

- `other` - 其他

> 💡 **详细说明**：查看 [AI对话分类设计文档](./ai-usage-conversation-categories.md) 了解如何使用对话分类。

#### 请求状态枚举（ai_usage_status）

- `success` - 成功
- `failed` - 失败
- `timeout` - 超时

#### 索引

- `idx_ai_usage_logs_user_id` - 用户ID索引
- `idx_ai_usage_logs_scene` - 场景索引
- `idx_ai_usage_logs_category` - 对话分类索引
- `idx_ai_usage_logs_created_at` - 创建时间索引
- `idx_ai_usage_logs_user_created` - 用户ID+创建时间复合索引

### 2. ai_usage_statistics（AI使用统计表）

按日期统计用户的AI使用情况，便于快速查询和展示。

#### 字段说明

| 字段名                  | 类型          | 说明                 | 必填 |
| ----------------------- | ------------- | -------------------- | ---- |
| id                      | UUID          | 主键                 | ✅   |
| user_id                 | UUID          | 用户ID（外键）       | ✅   |
| date                    | DATE          | 统计日期             | ✅   |
| total_requests          | INTEGER       | 总请求次数           | ✅   |
| success_requests        | INTEGER       | 成功请求次数         | ✅   |
| failed_requests         | INTEGER       | 失败请求次数         | ✅   |
| total_prompt_tokens     | INTEGER       | 总输入tokens         | ✅   |
| total_completion_tokens | INTEGER       | 总输出tokens         | ✅   |
| total_tokens            | INTEGER       | 总tokens             | ✅   |
| total_cost              | NUMERIC(10,6) | 总成本（美元）       | ✅   |
| scene_stats             | JSONB         | 场景统计             | ❌   |
| category_stats          | JSONB         | 对话分类统计         | ❌   |
| model_stats             | JSONB         | 模型统计             | ❌   |
| avg_duration            | INTEGER       | 平均请求耗时（毫秒） | ❌   |
| created_at              | TIMESTAMP     | 创建时间             | ✅   |
| updated_at              | TIMESTAMP     | 更新时间             | ✅   |

#### 索引

- `idx_ai_usage_stats_user_date` - 用户ID+日期复合索引
- `idx_ai_usage_stats_date` - 日期索引

## 📝 使用示例

### 1. 记录成功的AI调用
