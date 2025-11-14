# 匿名用户升级功能 - 快速开始

## 🚀 功能简介

为匿名用户提供平滑升级为正式用户的功能，支持**注册绑定**和**登录绑定**两种方式。

## ✨ 主要特性

- ✅ 双重升级路径（注册新账号 / 绑定已有账号）
- ✅ 数据无缝迁移
- ✅ 友好的视觉提示
- ✅ 实时进度显示
- ✅ 完善的错误处理

## 📦 已实现的功能

### 1. 前端组件

#### Header 组件优化

- **文件**: `src/components/toolsLayout/Header.tsx`
- **功能**:
  - 为匿名用户添加"临时"徽章
  - 显示橙色虚线边框
  - 菜单中添加"升级为正式用户"选项
  - 集成升级模态框

#### UpgradeUserModal 组件

- **文件**: `src/components/auth/UpgradeUserModal.tsx`
- **功能**:
  - Tab 切换（注册绑定 / 登录绑定）
  - 表单验证和提交
  - 数据迁移进度显示
  - 错误处理和用户提示

#### AuthContext 更新

- **文件**: `src/contexts/AuthContext.tsx`
- **新增方法**:
  - `loginAndBindAnonymous()` - 登录并绑定匿名数据

### 2. 后端 API

#### 注册绑定 API

- **端点**: `POST /api/auth/convert`
- **文件**: `src/app/api/auth/convert/route.ts`
- **功能**: 将匿名用户转换为正式用户（注册新账号）

#### 登录绑定 API

- **端点**: `POST /api/auth/login-bind`
- **文件**: `src/app/api/auth/login-bind/route.ts`
- **功能**: 登录并将匿名数据迁移到已有账号

## 🎯 使用方法

### 用户操作流程

#### 方式一：注册绑定（新用户）

1. 以匿名用户身份登录系统
2. 点击右上角用户头像（带"临时"徽章）
3. 在下拉菜单中点击"升级为正式用户"
4. 在弹出的模态框中选择"注册绑定"选项卡
5. 填写表单：
   - 邮箱（必填）
   - 密码（必填，至少6个字符）
   - 确认密码（必填）
   - 姓名（可选）
6. 点击"确认升级"按钮
7. 等待数据迁移完成
8. 查收邮箱验证邮件

**结果**: 所有临时数据自动保留，用户角色变为正式用户

#### 方式二：登录绑定（已有账号）

1. 以匿名用户身份登录系统
2. 点击右上角用户头像
3. 在下拉菜单中点击"升级为正式用户"
4. 在弹出的模态框中选择"登录绑定"选项卡
5. 填写表单：
   - 邮箱（已有账号的邮箱）
   - 密码（已有账号的密码）
6. 点击"登录并绑定"按钮
7. 等待数据迁移完成
8. 自动登录到正式账号

**结果**: 临时数据迁移到正式账号，自动登录

## 🔧 开发者指南

### 前端集成

#### 1. 在其他页面添加升级提示

```tsx
import { useAuth } from "@/contexts/AuthContext";
import { Alert, Button } from "antd";

function MyComponent() {
  const { user } = useAuth();
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);

  if (user?.isAnonymous) {
    return (
      <>
        <Alert
          message="您正在使用临时账号"
          description="升级为正式用户以解锁更多功能"
          type="warning"
          action={
            <Button onClick={() => setUpgradeModalOpen(true)}>立即升级</Button>
          }
        />
        <UpgradeUserModal
          open={upgradeModalOpen}
          onClose={() => setUpgradeModalOpen(false)}
        />
      </>
    );
  }

  return <div>{/* 正常内容 */}</div>;
}
```

#### 2. 限制匿名用户访问某些功能

```tsx
import { useAuth } from "@/contexts/AuthContext";
import { message } from "antd";

function PremiumFeature() {
  const { user } = useAuth();

  const handlePremiumAction = () => {
    if (user?.isAnonymous) {
      message.warning("此功能仅对正式用户开放，请先升级账号");
      return;
    }

    // 执行高级功能
  };

  return <Button onClick={handlePremiumAction}>高级功能</Button>;
}
```

### 后端集成

#### 1. 在 API 中限制匿名用户

```typescript
import { authorization } from "@/app/api/authorization";
import { UserService } from "@/modules/user/user.service";

export async function POST(request: NextRequest) {
  const authUser = await authorization();
  const userService = new UserService();

  const user = await userService.getUserById(authUser.id);

  if (user?.isAnonymous) {
    return NextResponse.json(
      { error: "此功能仅对正式用户开放" },
      { status: 403 },
    );
  }

  // 继续处理...
}
```

#### 2. 扩展数据迁移逻辑

在 `src/app/api/auth/login-bind/route.ts` 中添加更多数据迁移：

```typescript
// 迁移待办事项
const anonymousTodos = await todoService.getTodosByUserId(currentUser.id);
for (const todo of anonymousTodos) {
  await todoService.updateTodo(todo.id, { userId: targetUserId });
}

// 迁移AI使用记录
const anonymousAiLogs = await aiService.getLogsByUserId(currentUser.id);
for (const log of anonymousAiLogs) {
  await aiService.updateLog(log.id, { userId: targetUserId });
}

// 迁移通知
const anonymousNotifications = await notificationService.getByUserId(
  currentUser.id,
);
for (const notification of anonymousNotifications) {
  await notificationService.updateNotification(notification.id, {
    userId: targetUserId,
  });
}
```

## 🧪 测试

### 快速测试

1. **启动开发服务器**

   ```bash
   pnpm dev
   ```

2. **清除浏览器 cookies**

3. **访问应用**

   - 系统会自动创建匿名用户
   - 观察头像上的"临时"徽章

4. **测试注册绑定**

   - 点击用户菜单 → "升级为正式用户"
   - 选择"注册绑定"
   - 填写表单并提交
   - 验证升级成功

5. **测试登录绑定**
   - 先创建一个正式账号
   - 以匿名用户登录
   - 点击"升级为正式用户"
   - 选择"登录绑定"
   - 输入正式账号凭据
   - 验证数据迁移成功

### 自动化测试

创建测试脚本 `scripts/test-upgrade.js`:

```javascript
// 测试注册绑定
async function testRegisterBind() {
  const response = await fetch("http://localhost:3000/api/auth/convert", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "test@example.com",
      password: "password123",
      fullName: "测试用户",
    }),
    credentials: "include",
  });

  const data = await response.json();
  console.log("注册绑定结果:", data);
}

// 测试登录绑定
async function testLoginBind() {
  const response = await fetch("http://localhost:3000/api/auth/login-bind", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "existing@example.com",
      password: "password123",
    }),
    credentials: "include",
  });

  const data = await response.json();
  console.log("登录绑定结果:", data);
}
```

## 📊 数据流程

### 注册绑定流程

```
匿名用户 (ID: A)
    ↓
点击"升级为正式用户"
    ↓
选择"注册绑定"
    ↓
输入邮箱和密码
    ↓
POST /api/auth/convert
    ↓
更新 Supabase Auth (ID: A)
    ↓
更新本地数据库 (ID: A)
    - role: anonymous → user
    - isAnonymous: true → false
    - email: anonymous_xxx → 真实邮箱
    ↓
所有数据自动保留 (ID 不变)
    ↓
发送验证邮件
    ↓
升级完成
```

### 登录绑定流程

```
匿名用户 (ID: A) + 正式用户 (ID: B)
    ↓
点击"升级为正式用户"
    ↓
选择"登录绑定"
    ↓
输入正式账号凭据
    ↓
POST /api/auth/login-bind
    ↓
验证登录凭据 (ID: B)
    ↓
迁移数据: A → B
    - 用户配置
    - 待办事项
    - 使用记录
    - 通知
    ↓
删除匿名用户 (ID: A)
    ↓
登录到正式账号 (ID: B)
    ↓
绑定完成
```

## 🎨 UI 预览

### 匿名用户标识

```
┌─────────────────────────────┐
│  [临时]                      │
│   ┌─────────────┐           │
│   │   头像      │ 临时用户   │
│   │ (虚线边框)  │ 临时账号   │
│   └─────────────┘           │
└─────────────────────────────┘
```

### 用户菜单

```
┌─────────────────────────────┐
│ 🔸 升级为正式用户 (橙色)     │
├─────────────────────────────┤
│ 👤 个人资料                  │
│ ⚙️  设置                     │
│ 🚪 退出登录                  │
└─────────────────────────────┘
```

### 升级模态框

```
┌─────────────────────────────────────┐
│  🔸 升级为正式用户                   │
├─────────────────────────────────────┤
│  ┌───────────────────────────────┐  │
│  │ 升级优势：                     │  │
│  │ • 数据永久保存                 │  │
│  │ • 解锁更多功能                 │  │
│  │ • 多设备同步                   │  │
│  └───────────────────────────────┘  │
│                                     │
│  [注册绑定] [登录绑定]              │
│                                     │
│  邮箱: [________________]           │
│  密码: [________________]           │
│  确认: [________________]           │
│  姓名: [________________]           │
│                                     │
│  [进度条: ████████░░ 80%]          │
│                                     │
│  [稍后处理]  [确认升级]             │
└─────────────────────────────────────┘
```

## 📝 注意事项

### 1. 数据迁移

- **注册绑定**: 用户ID不变，所有数据自动保留
- **登录绑定**: 需要手动迁移数据，请确保迁移逻辑完整

### 2. 邮箱验证

- 注册绑定后需要验证邮箱
- 验证前用户可以正常使用系统
- 某些高级功能可能需要邮箱验证

### 3. 错误处理

- 邮箱已注册 → 提示使用登录绑定
- 登录凭据错误 → 提示重新输入
- 网络异常 → 提供重试选项

### 4. 性能优化

- 数据迁移使用批量操作
- 大量数据时显示详细进度
- 考虑使用后台任务处理

## 🔗 相关链接

- [完整功能文档](./ANONYMOUS_USER_UPGRADE.md)
- [自动匿名登录文档](./AUTO_ANONYMOUS_LOGIN.md)
- [匿名用户实现清单](./ANONYMOUS_USER_IMPLEMENTATION.md)

## 💡 最佳实践

1. **在关键功能点提示升级**

   - 数据导出功能
   - 高级设置
   - 协作功能

2. **提供升级优势说明**

   - 数据永久保存
   - 更多功能
   - 更好的体验

3. **不要强制升级**

   - 允许用户继续使用临时账号
   - 提供"稍后处理"选项
   - 在合适的时机提醒

4. **确保数据安全**
   - 完整的数据迁移
   - 原子操作
   - 失败回滚

## 🎉 开始使用

功能已完全实现并可以立即使用！只需启动应用，以匿名用户身份登录，即可看到升级入口。

---

**版本**: v1.0.0  
**更新日期**: 2025-11-12  
**状态**: ✅ 可用
