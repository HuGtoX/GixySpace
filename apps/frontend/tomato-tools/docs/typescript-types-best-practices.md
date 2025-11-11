# TypeScript 类型管理最佳实践

## 项目类型架构

```
src/
├── types/                    # 项目级类型定义
│   ├── index.ts             # 主要类型导出
│   ├── ai-chat.ts           # AI聊天相关类型
│   ├── common.ts            # 通用类型
│   └── api.ts               # API相关类型
├── lib/drizzle/schema/      # 数据库类型定义
│   ├── schema.ts            # 主要schema导出
│   └── aiChat.ts            # AI聊天数据库schema
├── utils/
│   └── type-converters.ts   # 类型转换工具
└── components/
    └── */types.ts           # 组件特定类型
```

## 类型共享策略

### 1. 分层类型管理

- **数据库层**: 使用 Drizzle ORM 生成的类型作为数据源真理
- **业务逻辑层**: 在 `src/types/` 中定义业务相关类型
- **组件层**: 组件特定的 Props 和 State 类型
- **API层**: 请求/响应类型定义

### 2. 类型联动原则

- **单一数据源**: 数据库 schema 作为类型定义的唯一真理来源
- **类型转换**: 使用转换函数在不同层级间转换类型
- **重新导出**: 通过 re-export 避免重复定义
- **类型扩展**: 基于基础类型进行扩展，而非重新定义

### 3. 命名约定

- **数据库类型**: 以 `Db` 前缀命名，如 `DbChatSession`
- **前端类型**: 使用业务语义命名，如 `ChatSession`
- **API类型**: 以用途后缀命名，如 `ChatApiRequest`
- **组件类型**: 以组件名后缀命名，如 `AiChatModalProps`

## 使用示例

### 1. 定义新的业务类型

```typescript
// src/types/user.ts
export type {
  User as DbUser,
  NewUser as NewDbUser,
} from "@/lib/drizzle/schema/user";

export interface UserProfile extends Omit<DbUser, "password"> {
  displayName: string;
  avatar?: string;
}
```

### 2. 创建类型转换函数

```typescript
// src/utils/type-converters.ts
export function dbUserToProfile(dbUser: DbUser): UserProfile {
  return {
    ...dbUser,
    displayName: dbUser.fullName || dbUser.email,
    // 排除敏感信息
    password: undefined,
  };
}
```

### 3. 在组件中使用

```typescript
// src/components/UserCard/types.ts
export type { UserProfile } from "@/types/user";

export interface UserCardProps {
  user: UserProfile;
  onEdit?: (user: UserProfile) => void;
}
```

## 类型联动的优势

1. **类型安全**: 编译时检查类型一致性
2. **维护性**: 单一数据源，修改一处影响全局
3. **可读性**: 清晰的类型层次和命名约定
4. **扩展性**: 易于添加新的类型定义和转换
5. **重用性**: 避免重复定义，提高代码复用

## 注意事项

1. **避免循环依赖**: 合理组织类型文件的导入关系
2. **类型版本控制**: 数据库 schema 变更时同步更新类型
3. **性能考虑**: 大型项目中合理拆分类型文件
4. **文档同步**: 保持类型定义与文档的同步更新

## 类型定义重复检查清单

在添加新类型之前，请检查以下位置是否已存在类似定义：

1. **`src/types/index.ts`** - 通用类型定义

   - ApiResponse, ApiErrorResponse, ApiSuccessResponse
   - PaginationParams, PaginationResponse
   - BaseEntity, BaseEntityWithSoftDelete
   - 其他通用接口

2. **`src/types/api.ts`** - API特定类型

   - 特定API的请求/响应类型
   - 扩展自通用类型的API类型

3. **`src/lib/drizzle/schema/`** - 数据库类型

   - 数据库表结构类型
   - 使用 `type` 导出避免重复

4. **组件目录下的 `types.ts`** - 组件特定类型
   - 组件Props接口
   - 组件内部状态类型

### 避免重复的最佳实践

```typescript
// ❌ 不好的做法 - 重复定义
// file1.ts
export interface ApiResponse {
  success: boolean;
  data?: any;
}

// file2.ts
export interface ApiResponse {
  success: boolean;
  data?: any;
}

// ✅ 好的做法 - 导入复用
// file1.ts (types/index.ts)
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
}

// file2.ts
import type { ApiResponse } from "@/types";

export interface UserApiResponse extends ApiResponse<User> {
  // 扩展特定字段
}
```

## 组件Props类型定义规范

### 1. 完整的Props接口

每个组件都应该有明确的Props接口定义：

```typescript
/**
 * 组件属性接口
 */
interface MyComponentProps {
  /** 必需属性 - 添加JSDoc注释说明用途 */
  title: string;

  /** 可选属性 */
  description?: string;

  /** 回调函数 */
  onSubmit?: (data: FormData) => void;

  /** 子元素 */
  children?: React.ReactNode;

  /** 样式类名 */
  className?: string;
}

export default function MyComponent({
  title,
  description,
  onSubmit,
  children,
  className,
}: MyComponentProps) {
  // 组件实现
}
```

### 2. 使用泛型提高复用性

```typescript
interface ListProps<T> {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
  keyExtractor: (item: T) => string;
}

function List<T>({ items, renderItem, keyExtractor }: ListProps<T>) {
  return (
    <ul>
      {items.map((item) => (
        <li key={keyExtractor(item)}>{renderItem(item)}</li>
      ))}
    </ul>
  );
}
```

### 3. 扩展HTML元素属性

```typescript
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
  loading?: boolean;
}

function Button({ variant = "primary", loading, children, ...props }: ButtonProps) {
  return (
    <button {...props} disabled={loading || props.disabled}>
      {loading ? "Loading..." : children}
    </button>
  );
}
```

## 相关文档

- [错误处理系统使用指南](./ERROR_HANDLING_GUIDE.md)
- [API开发规范](./api-authorization.md)
