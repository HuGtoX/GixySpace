# AI使用记录数据库ER图

```mermaid
erDiagram
    USER ||--o{ AI_USAGE_LOGS : "has many"
    USER ||--o{ AI_USAGE_STATISTICS : "has many"

    USER {
        uuid id PK
        text email
        text full_name
        text avatar_url
        user_role role
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }

    AI_USAGE_LOGS {
        uuid id PK
        uuid user_id FK
        ai_usage_scene scene
        text scene_description
        text model
        integer prompt_tokens
        integer completion_tokens
        integer total_tokens
        numeric estimated_cost
        jsonb request_data
        jsonb response_data
        ai_usage_status status
        text error_message
        text error_code
        integer duration
        text ip_address
        text user_agent
        text request_id
        timestamp created_at
    }

    AI_USAGE_STATISTICS {
        uuid id PK
        uuid user_id FK
        date date
        integer total_requests
        integer success_requests
        integer failed_requests
        integer total_prompt_tokens
        integer total_completion_tokens
        integer total_tokens
        numeric total_cost
        jsonb scene_stats
        jsonb model_stats
        integer avg_duration
        timestamp created_at
        timestamp updated_at
    }
```

## 表关系说明

### 1. USER → AI_USAGE_LOGS (一对多)

- 一个用户可以有多条AI使用日志
- 通过 `user_id` 外键关联
- 级联删除：删除用户时，自动删除其所有AI使用日志

### 2. USER → AI_USAGE_STATISTICS (一对多)

- 一个用户可以有多条AI使用统计记录（按日期）
- 通过 `user_id` 外键关联
- 级联删除：删除用户时，自动删除其所有统计记录

## 数据流程图

```mermaid
flowchart TD
    A[用户发起AI请求] --> B[调用302.ai API]
    B --> C{请求成功?}
    C -->|是| D[记录成功日志]
    C -->|否| E[记录失败日志]
    D --> F[提取tokens信息]
    E --> F
    F --> G[计算预估成本]
    G --> H[保存到ai_usage_logs表]
    H --> I[触发统计更新]
    I --> J{当日统计存在?}
    J -->|是| K[更新统计记录]
    J -->|否| L[创建新统计记录]
    K --> M[完成]
    L --> M
```

## 查询性能优化

### 索引策略

```mermaid
graph LR
    A[ai_usage_logs] --> B[idx_user_id]
    A --> C[idx_scene]
    A --> D[idx_created_at]
    A --> E[idx_user_created]

    F[ai_usage_statistics] --> G[idx_user_date]
    F --> H[idx_date]

    style B fill:#90EE90
    style C fill:#90EE90
    style D fill:#90EE90
    style E fill:#FFD700
    style G fill:#FFD700
    style H fill:#90EE90
```

**图例：**

- 🟢 绿色：单列索引
- 🟡 黄色：复合索引（性能最优）

### 常见查询场景

1. **查询用户最近的AI使用记录**

   - 使用索引：`idx_user_created`
   - 查询效率：⭐⭐⭐⭐⭐

2. **按场景统计使用情况**

   - 使用索引：`idx_scene`
   - 查询效率：⭐⭐⭐⭐

3. **查询用户每日统计**
   - 使用索引：`idx_user_date`
   - 查询效率：⭐⭐⭐⭐⭐

## 数据增长预估

```mermaid
graph TD
    A[假设条件] --> B[每用户每天10次AI调用]
    A --> C[1000个活跃用户]

    B --> D[ai_usage_logs表]
    C --> D
    D --> E[每天新增10,000条记录]
    E --> F[每月约300,000条记录]
    F --> G[每年约3,600,000条记录]

    B --> H[ai_usage_statistics表]
    C --> H
    H --> I[每天新增1,000条记录]
    I --> J[每月约30,000条记录]
    J --> K[每年约365,000条记录]

    style G fill:#FFB6C1
    style K fill:#90EE90
```

### 存储空间估算

**ai_usage_logs表：**

- 平均每条记录：~2KB（包含JSONB数据）
- 年增长：3,600,000 × 2KB ≈ 7.2GB

**ai_usage_statistics表：**

- 平均每条记录：~1KB
- 年增长：365,000 × 1KB ≈ 365MB

**建议：**

- 定期归档超过90天的详细日志
- 保留统计数据用于长期分析
- 使用PostgreSQL分区表优化大表查询

## 数据生命周期

```mermaid
stateDiagram-v2
    [*] --> Active: 创建记录
    Active --> Archive: 90天后
    Archive --> Deleted: 1年后
    Deleted --> [*]

    note right of Active
        实时查询
        完整数据
    end note

    note right of Archive
        归档存储
        只读访问
    end note

    note right of Deleted
        永久删除
        仅保留统计
    end note
```
