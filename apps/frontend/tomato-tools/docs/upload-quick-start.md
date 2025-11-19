# 快速开始：Supabase Storage 上传功能

## 🚀 5分钟快速上手

### 第一步：配置 Supabase

#### 1. 创建存储桶

登录 [Supabase 控制台](https://app.supabase.com)：

1. 选择你的项目
2. 点击左侧菜单的 **Storage**
3. 点击 **New bucket** 按钮
4. 输入存储桶名称：`avatars`
5. 勾选 **Public bucket**（允许公开访问）
6. 点击 **Create bucket**

#### 2. 配置存储策略

在 Supabase 控制台的 SQL Editor 中执行以下 SQL：

```sql
-- 允许认证用户上传文件
CREATE POLICY "Allow authenticated users to upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars');

-- 允许用户删除自己的文件
CREATE POLICY "Allow users to delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'avatars');

-- 允许所有人读取公开文件
CREATE POLICY "Allow public read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');
```

#### 3. 检查环境变量

确保 `.env.local` 文件包含以下配置：

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 第二步：使用上传功能

#### 方式1：使用工具函数（推荐）

```typescript
import { uploadToStorage } from "@/lib/uploadUtils";

async function handleUpload(file: File) {
  try {
    const result = await uploadToStorage(file, {
      bucket: "avatars",
      folder: "users",
    });

    console.log("文件 URL:", result.url);
    console.log("文件路径:", result.path);
  } catch (error) {
    console.error("上传失败:", error);
  }
}
```

#### 方式2：直接调用 API

```typescript
async function handleUpload(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("bucket", "avatars");
  formData.append("folder", "users");

  const response = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });

  const result = await response.json();
  console.log("文件 URL:", result.url);
}
```

#### 方式3：在 React 组件中使用

```tsx
import { useState } from "react";
import { Button, message } from "antd";
import { uploadToStorage } from "@/lib/uploadUtils";

export default function MyComponent() {
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const result = await uploadToStorage(file);
      message.success("上传成功！");
      console.log(result.url);
    } catch (error) {
      message.error("上传失败");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        disabled={uploading}
      />
      {uploading && <span>上传中...</span>}
    </div>
  );
}
```

### 第三步：查看示例

项目中包含了完整的示例组件，展示了各种上传方式：

**文件位置：** `src/components/examples/UploadExample.tsx`

你可以在开发环境中导入并使用这个组件：

```tsx
import { UploadExample } from "@/components/examples";

export default function TestPage() {
  return <UploadExample />;
}
```

## 📚 常用场景

### 场景1：上传用户头像

```typescript
import { uploadAvatar } from "@/lib/uploadUtils";

// 自动上传到 avatars/users/ 目录
const result = await uploadAvatar(file, userId);
```

### 场景2：上传裁剪后的图片（Base64）

```typescript
import { uploadBase64ToStorage } from "@/lib/uploadUtils";

// 将裁剪后的 base64 图片上传
const result = await uploadBase64ToStorage(croppedImageBase64, "avatar.png", {
  bucket: "avatars",
  folder: "users",
});
```

### 场景3：删除旧文件

```typescript
import { deleteFromStorage } from "@/lib/uploadUtils";

// 删除旧头像
await deleteFromStorage(oldAvatarPath, "avatars");

// 上传新头像
const result = await uploadAvatar(newFile, userId);
```

### 场景4：批量上传

```typescript
import { uploadToStorage } from "@/lib/uploadUtils";

async function uploadMultipleFiles(files: File[]) {
  const results = await Promise.all(
    files.map((file) =>
      uploadToStorage(file, {
        bucket: "avatars",
        folder: "gallery",
      }),
    ),
  );

  return results.map((r) => r.url);
}
```

## 🎯 最佳实践

### 1. 错误处理

```typescript
import { uploadToStorage } from "@/lib/uploadUtils";
import { message } from "antd";

async function safeUpload(file: File) {
  try {
    const result = await uploadToStorage(file);
    return result.url;
  } catch (error: any) {
    // 根据错误类型显示不同提示
    if (error.response?.status === 401) {
      message.error("请先登录");
    } else if (error.response?.status === 400) {
      message.error(error.response.data.error);
    } else {
      message.error("上传失败，请重试");
    }
    throw error;
  }
}
```

### 2. 文件验证

```typescript
function validateFile(file: File): boolean {
  // 检查文件类型
  const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    message.error("仅支持 JPG、PNG、GIF、WebP 格式");
    return false;
  }

  // 检查文件大小（5MB）
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    message.error("文件大小不能超过 5MB");
    return false;
  }

  return true;
}

// 使用
if (validateFile(file)) {
  await uploadToStorage(file);
}
```

### 3. 显示上传进度

```typescript
import axios from "@/lib/axios";

async function uploadWithProgress(
  file: File,
  onProgress: (percent: number) => void,
) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await axios.post("/api/upload", formData, {
    onUploadProgress: (progressEvent) => {
      const percent = Math.round(
        (progressEvent.loaded * 100) / (progressEvent.total || 1),
      );
      onProgress(percent);
    },
  });

  return response.data;
}

// 使用
await uploadWithProgress(file, (percent) => {
  console.log(`上传进度: ${percent}%`);
});
```

### 4. 清理旧文件

```typescript
import { uploadAvatar, deleteFromStorage } from "@/lib/uploadUtils";

async function updateAvatar(
  file: File,
  userId: string,
  oldAvatarPath?: string,
) {
  // 1. 上传新头像
  const result = await uploadAvatar(file, userId);

  // 2. 删除旧头像（如果存在且不是系统头像）
  if (oldAvatarPath && !oldAvatarPath.includes("/system/")) {
    try {
      await deleteFromStorage(oldAvatarPath);
    } catch (error) {
      console.warn("删除旧头像失败:", error);
      // 不影响主流程
    }
  }

  return result.url;
}
```

## 🔍 调试技巧

### 1. 查看上传日志

API 路由会记录详细的日志，包括：

- 用户 ID
- 文件名和大小
- 上传路径
- 错误信息

在开发环境中查看控制台输出。

### 2. 检查 Supabase Storage

在 Supabase 控制台的 Storage 页面：

1. 选择 `avatars` 存储桶
2. 查看已上传的文件
3. 检查文件权限和 URL

### 3. 测试 API 端点

使用 curl 或 Postman 测试：

```bash
# 上传文件
curl -X POST http://localhost:3000/api/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@/path/to/image.jpg" \
  -F "bucket=avatars" \
  -F "folder=users"

# 删除文件
curl -X DELETE http://localhost:3000/api/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"path":"users/file.jpg","bucket":"avatars"}'
```

## 📖 更多资源

- [完整 API 文档](./upload-api.md)
- [功能总结](./upload-feature-summary.md)
- [示例组件](../src/components/examples/UploadExample.tsx)
- [Supabase Storage 官方文档](https://supabase.com/docs/guides/storage)

## ❓ 常见问题

### Q: 上传失败，提示"未授权访问"？

**A:** 确保用户已登录。所有上传操作都需要身份验证。

### Q: 文件上传成功但无法访问？

**A:** 检查存储桶是否设置为 Public，并确保配置了正确的存储策略。

### Q: 如何修改文件大小限制？

**A:** 在 `src/app/api/upload/route.ts` 中修改 `MAX_FILE_SIZE` 常量。

### Q: 支持哪些文件类型？

**A:** 目前仅支持图片格式（JPG、PNG、GIF、WebP、SVG）。可以在 `ALLOWED_MIME_TYPES` 中添加更多类型。

### Q: 如何自定义文件名？

**A:** 使用 `fileName` 参数：

```typescript
await uploadToStorage(file, {
  fileName: "custom-name.jpg",
});
```

## 🎉 开始使用

现在你已经准备好使用 Supabase Storage 上传功能了！

1. ✅ 配置 Supabase Storage
2. ✅ 选择合适的上传方式
3. ✅ 参考示例代码
4. ✅ 遵循最佳实践

祝你开发愉快！🚀
