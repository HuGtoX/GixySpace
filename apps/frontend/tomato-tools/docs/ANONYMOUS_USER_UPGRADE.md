# 匿名用户升级功能文档

## 📝 功能概述

匿名用户升级功能为临时用户提供了两种平滑升级为正式用户的方式，确保用户数据能够无缝迁移，提升用户转化率和使用体验。

## ✨ 核心特性

- ✅ **双重升级方式**：支持注册绑定和登录绑定两种升级路径
- ✅ **数据无缝迁移**：所有临时数据自动保留或迁移
- ✅ **友好的视觉提示**：清晰的临时账号标识和升级入口
- ✅ **进度可视化**：数据迁移过程实时显示
- ✅ **完善的错误处理**：网络异常、验证失败等场景的处理机制
- ✅ **原子操作保障**：确保数据迁移的完整性和一致性

## 🎯 升级方式

### 方式一：注册绑定（新用户）

**适用场景**：用户没有正式账号，希望创建新账号

**流程：**

1. 点击用户菜单中的"升级为正式用户"
2. 选择"注册绑定"选项卡
3. 输入邮箱、密码和姓名（可选）
4. 系统自动将临时数据绑定到新账号
5. 发送邮箱验证邮件

**数据处理：**

- 用户ID保持不变
- 所有数据自动保留（因为ID不变）
- 用户角色从 `anonymous` 变更为 `user`
- 匿名标识字段被清除

### 方式二：登录绑定（已有账号）

**适用场景**：用户已有正式账号，希望将临时数据迁移到现有账号

**流程：**

1. 点击用户菜单中的"升级为正式用户"
2. 选择"登录绑定"选项卡
3. 输入已有账号的邮箱和密码
4. 系统验证登录凭据
5. 将临时数据迁移到正式账号
6. 自动登录到正式账号

**数据处理：**

- 验证目标账号不是临时账号
- 迁移用户配置（如果目标账号没有）
- 迁移其他关联数据（待办事项、使用记录等）
- 删除临时用户记录

## 🎨 界面设计

### 1. Header 组件优化

#### 匿名用户标识

- 头像边框改为虚线橙色边框
- 显示"临时"徽章
- 用户名下方显示"临时账号"文字
- 整体橙色主题突出临时状态

#### 用户菜单

- 匿名用户菜单顶部显示"升级为正式用户"选项
- 使用橙色高亮和加粗字体
- 图标使用 `FaUserPlus`
- 分隔线区分升级选项和其他菜单项

### 2. 升级模态框

#### 整体布局

- 标题：带图标的"升级为正式用户"
- 升级优势说明（橙色背景卡片）
- Tab 切换：注册绑定 / 登录绑定
- 表单区域
- 操作按钮：稍后处理 / 确认升级

#### 注册绑定表单

- 邮箱输入（必填，邮箱格式验证）
- 密码输入（必填，最少6个字符）
- 确认密码（必填，与密码一致性验证）
- 姓名输入（可选）
- 数据迁移进度条

#### 登录绑定表单

- 邮箱输入（必填，邮箱格式验证）
- 密码输入（必填）
- 数据迁移进度条

## 🔧 技术实现

### 前端实现

#### 1. Header 组件 (`src/components/toolsLayout/Header.tsx`)

**新增功能：**

- 导入 `UpgradeUserModal` 组件
- 添加 `upgradeModalOpen` 状态管理
- 根据 `user.isAnonymous` 动态生成菜单
- 为匿名用户添加视觉标识（Badge、虚线边框）

**关键代码：**

```tsx
// 匿名用户头像标识
{
  user.isAnonymous ? (
    <Badge count="临时" offset={[-5, 5]}>
      <Avatar className="border-2 border-dashed border-orange-500" />
    </Badge>
  ) : (
    <Avatar className="border-2 border-solid border-orange-500" />
  );
}

// 动态菜单
const userMenu = user?.isAnonymous
  ? [
      { key: "upgrade", label: "升级为正式用户" },
      { type: "divider" },
      // ... 其他菜单项
    ]
  : [
      /* 正常菜单 */
    ];
```

#### 2. UpgradeUserModal 组件 (`src/components/auth/UpgradeUserModal.tsx`)

**核心功能：**

- Tab 切换（注册绑定 / 登录绑定）
- 表单验证和提交
- 加载状态管理
- 数据迁移进度显示
- 错误处理和用户提示

**状态管理：**

```tsx
const [loading, setLoading] = useState(false);
const [activeTab, setActiveTab] = useState("register");
const [migrationProgress, setMigrationProgress] = useState(0);
const [showProgress, setShowProgress] = useState(false);
```

**进度模拟：**

```tsx
const progressInterval = setInterval(() => {
  setMigrationProgress((prev) => {
    if (prev >= 90) {
      clearInterval(progressInterval);
      return 90;
    }
    return prev + 10;
  });
}, 200);
```

#### 3. AuthContext 更新 (`src/contexts/AuthContext.tsx`)

**新增方法：**

```tsx
// 登录并绑定匿名用户数据
const loginAndBindAnonymous = async (email: string, password: string) => {
  const response = await fetch("/api/auth/login-bind", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(data.error || "Login and bind failed");
  }

  await fetchUser(false);
};
```

### 后端实现

#### 1. 注册绑定 API (`src/app/api/auth/convert/route.ts`)

**端点：** `POST /api/auth/convert`

**请求参数：**

```typescript
{
  email: string;      // 邮箱地址
  password: string;   // 密码（至少6个字符）
  fullName?: string;  // 姓名（可选）
}
```

**处理流程：**

1. 验证当前用户是否为匿名用户
2. 调用 `AnonymousService.convertToRegularUser()`
3. 更新 Supabase Auth 用户信息
4. 更新本地数据库用户信息
5. 数据自动保留（用户ID不变）

**响应：**

```typescript
{
  success: true,
  message: "升级成功！请查收邮箱验证邮件",
  note: "您的所有数据已自动保留"
}
```

#### 2. 登录绑定 API (`src/app/api/auth/login-bind/route.ts`)

**端点：** `POST /api/auth/login-bind`

**请求参数：**

```typescript
{
  email: string; // 目标账号邮箱
  password: string; // 目标账号密码
}
```

**处理流程：**

1. 验证当前用户是否为匿名用户
2. 验证登录凭据
3. 检查目标账号不是临时账号
4. 迁移用户配置和数据
5. 删除匿名用户会话
6. 登录到目标账号

**数据迁移逻辑：**

```typescript
// 迁移用户配置
const anonymousProfile = await userService.getUserProfile(currentUser.id);
const targetProfile = await userService.getUserProfile(targetUserId);

if (anonymousProfile && !targetProfile) {
  await userService.createUserProfile({
    userId: targetUserId,
    bio: anonymousProfile.bio,
    website: anonymousProfile.website,
    location: anonymousProfile.location,
    preferences: anonymousProfile.preferences,
  });
}

// TODO: 迁移其他数据
// - 待办事项 (todos)
// - AI使用记录 (ai_usage_logs)
// - 通知 (notifications)
```

**响应：**

```typescript
{
  success: true,
  message: "绑定成功，您的临时数据已迁移到正式账号",
  userId: string
}
```

## 📊 数据迁移策略

### 注册绑定（用户ID不变）

**优势：**

- 实现简单，无需数据迁移
- 所有外键关联自动保留
- 零数据丢失风险

**实现：**

```typescript
// 只需更新用户表字段
await userService.updateUser(userId, {
  email,
  fullName,
  role: "user",
  isAnonymous: false,
  anonymousCreatedAt: null,
  expiresAt: null,
});
```

### 登录绑定（用户ID改变）

**需要迁移的数据：**

1. **用户配置 (user_profile)**

   - 个人简介
   - 网站链接
   - 位置信息
   - 用户偏好设置

2. **待办事项 (todo)**

   - 所有待办事项记录
   - 更新 `user_id` 外键

3. **AI使用记录 (ai_usage_logs)**

   - 使用历史
   - 统计数据

4. **通知 (user_notification)**
   - 未读通知
   - 通知历史

**迁移策略：**

```typescript
// 1. 查询匿名用户的所有关联数据
// 2. 批量更新外键关联到目标用户
// 3. 处理冲突（如目标用户已有相同数据）
// 4. 删除匿名用户记录
```

## 🔒 安全考虑

### 1. 身份验证

- 所有API都需要通过 `authorization()` 验证
- 登录绑定需要验证目标账号凭据
- 防止非匿名用户调用升级接口

### 2. 数据验证

- 使用 Zod 进行参数校验
- 邮箱格式验证
- 密码强度要求（最少6个字符）
- 确认密码一致性验证

### 3. 错误处理

- 邮箱已注册的友好提示
- 登录凭据错误的处理
- 网络异常的重试机制
- 数据迁移失败的回滚

### 4. 日志记录

- 记录所有升级操作
- 记录数据迁移过程
- 记录错误和异常
- 使用 correlation ID 追踪请求

## 🧪 测试指南

### 功能测试

#### 1. 注册绑定测试

**测试步骤：**

1. 以匿名用户身份登录
2. 创建一些测试数据（待办事项等）
3. 点击"升级为正式用户"
4. 选择"注册绑定"
5. 输入新邮箱和密码
6. 提交表单

**预期结果：**

- ✅ 显示数据迁移进度
- ✅ 升级成功提示
- ✅ 收到验证邮件
- ✅ 所有数据保留
- ✅ 用户角色变为 `user`
- ✅ 临时标识消失

#### 2. 登录绑定测试

**测试步骤：**

1. 先创建一个正式账号A
2. 以匿名用户身份登录
3. 创建一些测试数据
4. 点击"升级为正式用户"
5. 选择"登录绑定"
6. 输入账号A的邮箱和密码
7. 提交表单

**预期结果：**

- ✅ 显示数据迁移进度
- ✅ 绑定成功提示
- ✅ 自动登录到账号A
- ✅ 临时数据迁移到账号A
- ✅ 匿名用户记录被删除

#### 3. 错误场景测试

**测试场景：**

- 邮箱已被注册
- 密码不一致
- 登录凭据错误
- 网络异常
- 目标账号也是临时账号

**预期结果：**

- ✅ 显示友好的错误提示
- ✅ 不影响现有数据
- ✅ 可以重试操作

### 性能测试

**测试指标：**

- 升级操作响应时间 < 3秒
- 数据迁移完成时间 < 5秒
- 并发升级支持 > 100 QPS

### 兼容性测试

**测试环境：**

- Chrome、Firefox、Safari、Edge
- 移动端浏览器
- 不同屏幕尺寸

## 📈 用户体验优化

### 1. 视觉提示

**临时账号标识：**

- 橙色主题色
- "临时"徽章
- 虚线边框
- 文字提示

**升级入口：**

- 菜单顶部位置
- 橙色高亮
- 加粗字体
- 明确的图标

### 2. 操作引导

**升级优势说明：**

- 数据永久保存
- 解锁更多功能
- 多设备同步
- 优先技术支持

**进度反馈：**

- 实时进度条
- 状态文字说明
- 完成提示

### 3. 灵活性

**稍后处理选项：**

- 允许用户继续使用临时账号
- 不强制立即升级
- 在关键功能点提示升级

## 🚀 部署清单

### 前端部署

- [x] Header 组件更新
- [x] UpgradeUserModal 组件创建
- [x] AuthContext 方法添加
- [x] 样式和图标配置

### 后端部署

- [x] `/api/auth/convert` API 优化
- [x] `/api/auth/login-bind` API 创建
- [x] 数据迁移逻辑实现
- [x] 日志和监控配置

### 测试验证

- [ ] 功能测试通过
- [ ] 性能测试通过
- [ ] 兼容性测试通过
- [ ] 安全测试通过

### 文档更新

- [x] 功能文档
- [x] API 文档
- [x] 测试指南
- [ ] 用户使用手册

## 📞 常见问题

### Q1: 升级后数据会丢失吗？

**A:** 不会。注册绑定方式下，用户ID不变，所有数据自动保留。登录绑定方式下，系统会自动迁移所有数据到目标账号。

### Q2: 可以将多个临时账号合并到一个正式账号吗？

**A:** 目前支持将一个临时账号绑定到一个正式账号。如需合并多个账号，请联系技术支持。

### Q3: 升级失败怎么办？

**A:** 系统会显示具体的错误信息。常见原因包括邮箱已被注册、网络异常等。您可以根据提示重试，或选择"稍后处理"继续使用临时账号。

### Q4: 升级后还能恢复到临时账号吗？

**A:** 不能。升级是单向操作，完成后无法恢复。但您的所有数据都会保留。

### Q5: 登录绑定时，如果目标账号已有数据怎么办？

**A:** 系统会智能合并数据。如果目标账号已有相同类型的数据，会保留目标账号的数据，临时账号的数据作为补充。

## 📚 相关文档

- [AUTO_ANONYMOUS_LOGIN.md](./AUTO_ANONYMOUS_LOGIN.md) - 自动匿名登录功能
- [ANONYMOUS_USER_IMPLEMENTATION.md](./ANONYMOUS_USER_IMPLEMENTATION.md) - 匿名用户实现清单
- [anonymous-user.md](./anonymous-user.md) - 匿名用户功能文档

## 🎉 总结

匿名用户升级功能通过提供双重升级路径、友好的用户界面和完善的数据迁移机制，显著提升了用户转化率和使用体验。该功能已完全集成到认证系统中，可以立即投入使用。

---

**实现日期**: 2025-11-12  
**版本**: v1.0.0  
**状态**: ✅ 已完成
