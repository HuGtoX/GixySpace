# 用户头像管理功能

## 功能概述

用户头像管理功能允许用户通过两种方式更换头像：

1. **系统头像库**：选择预设的默认头像
2. **自定义上传**：上传本地图片并进行圆形裁剪

## 组件结构

### 1. AvatarUploadModal（头像上传模态窗口）

主要的交互组件，提供头像选择和上传的界面。

**位置**：`src/components/avatar/AvatarUploadModal.tsx`

**功能**：

- 提供Tab切换，在系统头像和自定义上传之间切换
- 管理整个头像更新流程
- 处理文件验证（类型、大小限制）

**Props**：

```typescript
interface AvatarUploadModalProps {
  open: boolean; // 模态窗口是否打开
  currentAvatar?: string; // 当前用户头像URL
  onCancel: () => void; // 取消回调
  onConfirm: (avatarUrl: string, isSystemAvatar: boolean) => void; // 确认回调
}
```

### 2. SystemAvatarGrid（系统头像库）

展示系统预设头像的网格组件。

**位置**：`src/components/avatar/SystemAvatarGrid.tsx`

**功能**：

- 以网格形式展示系统头像
- 支持选择和高亮显示
- 圆形显示头像

**Props**：

```typescript
interface SystemAvatarGridProps {
  selectedAvatar: string | null; // 当前选中的头像URL
  onSelect: (avatarUrl: string) => void; // 选择回调
}
```

### 3. ImageCropper（图片裁剪器）

提供图片裁剪功能的组件。

**位置**：`src/components/avatar/ImageCropper.tsx`

**功能**：

- 支持图片缩放（Zoom）
- 支持图片拖拽定位
- 圆形裁剪区域
- 实时预览效果
- 支持触摸操作（移动端）

**Props**：

```typescript
interface ImageCropperProps {
  image: string; // 要裁剪的图片（base64或URL）
  onCropComplete: (croppedImage: string) => void; // 裁剪完成回调
  onCancel: () => void; // 取消回调
}
```

## API接口

### 1. 更新用户头像

**端点**：`PUT /api/user/avatar`

**请求体**：

```json
{
  "avatarUrl": "string",      // 头像URL或base64
  "isSystemAvatar": boolean   // 是否为系统头像
}
```

**响应**：

```json
{
  "message": "头像更新成功",
  "avatarUrl": "string"
}
```

### 2. 更新用户资料

**端点**：`PUT /api/user/profile`

**请求体**：

```json
{
  "fullName": "string", // 可选
  "bio": "string", // 可选，最多200字
  "website": "string", // 可选，必须是有效URL
  "location": "string" // 可选，最多100字
}
```

## 使用示例

在Profile页面中集成：

```tsx
import { useState } from "react";
import AvatarUploadModal from "@/components/avatar/AvatarUploadModal";

function ProfilePage() {
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);
  const [updatingAvatar, setUpdatingAvatar] = useState(false);
  const { user, refreshUser } = useAuth();

  const handleAvatarUpdate = async (
    avatarUrl: string,
    isSystemAvatar: boolean,
  ) => {
    setUpdatingAvatar(true);
    try {
      const response = await fetch("/api/user/avatar", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarUrl, isSystemAvatar }),
        credentials: "include",
      });

      if (response.ok) {
        message.success("头像更新成功");
        await refreshUser();
        setAvatarModalOpen(false);
      }
    } catch (error) {
      message.error("头像更新失败");
    } finally {
      setUpdatingAvatar(false);
    }
  };

  return (
    <>
      <Button onClick={() => setAvatarModalOpen(true)}>更换头像</Button>

      <AvatarUploadModal
        open={avatarModalOpen}
        currentAvatar={user?.avatarUrl}
        onCancel={() => setAvatarModalOpen(false)}
        onConfirm={handleAvatarUpdate}
      />
    </>
  );
}
```

## 系统头像管理

系统头像存储在 `public/avatar/` 目录下。

当前可用头像：

- `/avatar/a1.png`
- `/avatar/a2.png`
- `/avatar/a3.png`
- `/avatar/a4.png`
- `/avatar/a5.png`
- `/avatar/a6.png`
- `/avatar/a7.png`

要添加新的系统头像：

1. 将头像文件放入 `public/avatar/` 目录
2. 更新 `SystemAvatarGrid.tsx` 中的 `SYSTEM_AVATARS` 数组

## 技术特性

### 图片处理

- **文件大小限制**：5MB
- **支持格式**：JPG, PNG, GIF
- **裁剪输出**：PNG格式，圆形裁剪
- **缩放范围**：0.1x - 3x

### 用户体验

- 拖拽调整图片位置
- 滑块控制缩放
- 实时预览效果
- 响应式设计
- 支持触摸操作

### 数据存储

- 系统头像：直接使用URL路径
- 自定义头像：当前存储为base64（可扩展为对象存储）

## 未来优化建议

1. **对象存储集成**

   - 将自定义头像上传到Supabase Storage或其他对象存储服务
   - 减少数据库存储压力
   - 提高加载速度

2. **图片优化**

   - 自动压缩上传的图片
   - 生成多种尺寸的缩略图
   - 使用WebP格式

3. **更多裁剪选项**

   - 支持方形裁剪
   - 支持自定义裁剪比例
   - 添加滤镜效果

4. **头像历史**
   - 保存用户的历史头像
   - 支持恢复之前的头像

## 注意事项

1. 确保用户已登录才能使用头像更新功能
2. 自定义头像以base64格式存储，注意数据库字段长度
3. 系统头像路径必须正确，否则会显示默认图标
4. 图片裁剪在客户端完成，不会上传原始大图
