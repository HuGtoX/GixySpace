# Supabase Storage 上传 API 文档

## 概述

本项目提供了一套完整的文件上传解决方案，支持将文件上传到 Supabase Storage。

## API 路由

### POST /api/upload

上传文件到 Supabase Storage。

**请求方式：** `POST`

**Content-Type：** `multipart/form-data`

**请求参数：**

| 参数名   | 类型   | 必填 | 默认值   | 说明         |
| -------- | ------ | ---- | -------- | ------------ |
| file     | File   | 是   | -        | 要上传的文件 |
| bucket   | string | 否   | avatars  | 存储桶名称   |
| folder   | string | 否   | -        | 文件夹路径   |
| fileName | string | 否   | 自动生成 | 自定义文件名 |

**支持的文件类型：**

- image/jpeg
- image/jpg
- image/png
- image/gif
- image/webp
- image/svg+xml

**文件大小限制：** 5MB

**响应示例：**

```json
{
  "message": "文件上传成功",
  "url": "https://your-project.supabase.co/storage/v1/object/public/avatars/users/user123_1234567890.png",
  "path": "users/user123_1234567890.png"
}
```

**错误响应：**

```json
{
  "error": "文件过大",
  "details": "文件大小不能超过 5MB"
}
```

---

### DELETE /api/upload

从 Supabase Storage 删除文件。

**请求方式：** `DELETE`

**Content-Type：** `application/json`

**请求参数：**

```json
{
  "path": "users/user123_1234567890.png",
  "bucket": "avatars"
}
```

| 参数名 | 类型   | 必填 | 默认值  | 说明       |
| ------ | ------ | ---- | ------- | ---------- |
| path   | string | 是   | -       | 文件路径   |
| bucket | string | 否   | avatars | 存储桶名称 |

**响应示例：**

```json
{
  "message": "文件删除成功"
}
```

---

## 工具函数使用

项目提供了便捷的工具函数，位于 `@/lib/uploadUtils.ts`。

### 1. 上传文件

```typescript
import { uploadToStorage } from "@/lib/uploadUtils";

// 基本用法
const result = await uploadToStorage(file);
console.log(result.url); // 文件URL

// 指定存储桶和文件夹
const result = await uploadToStorage(file, {
  bucket: "avatars",
  folder: "users",
  fileName: "custom-name.png",
});
```

### 2. 上传头像

```typescript
import { uploadAvatar } from "@/lib/uploadUtils";

// 上传用户头像
const result = await uploadAvatar(file, userId);
console.log(result.url); // 头像URL
```

### 3. 上传 Base64 图片

```typescript
import { uploadBase64ToStorage } from "@/lib/uploadUtils";

// 将Base64图片上传到Storage
const base64Data = "data:image/png;base64,iVBORw0KGgoAAAANS...";
const result = await uploadBase64ToStorage(base64Data, "avatar.png", {
  bucket: "avatars",
  folder: "users",
});
console.log(result.url);
```

### 4. 删除文件

```typescript
import { deleteFromStorage } from "@/lib/uploadUtils";

// 删除文件
await deleteFromStorage("users/user123_1234567890.png");

// 指定存储桶
await deleteFromStorage("users/user123_1234567890.png", "avatars");
```

---

## React 组件示例

### 使用 FileUploader 组件上传

```tsx
import { FileUploader } from "@/components/ui/FileUploader";
import { uploadToStorage } from "@/lib/uploadUtils";
import { message } from "antd";

function MyComponent() {
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = async (file: File) => {
    setUploading(true);
    try {
      const result = await uploadToStorage(file, {
        bucket: "avatars",
        folder: "users",
      });

      message.success("上传成功！");
      console.log("文件URL:", result.url);

      // 这里可以将URL保存到数据库或状态中
    } catch (error) {
      message.error("上传失败：" + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <FileUploader
      accept="image/*"
      maxSize={5 * 1024 * 1024}
      onFileSelect={handleFileSelect}
      disabled={uploading}
    />
  );
}
```

### 使用原生 input 上传

```tsx
import { uploadToStorage } from "@/lib/uploadUtils";
import { message } from "antd";

function UploadComponent() {
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const result = await uploadToStorage(file);
      message.success("上传成功！");
      console.log("文件URL:", result.url);
    } catch (error) {
      message.error("上传失败");
    }
  };

  return <input type="file" accept="image/*" onChange={handleFileChange} />;
}
```

---

## 配置 Supabase Storage

### 1. 创建存储桶

在 Supabase 控制台中创建存储桶：

1. 进入 Supabase 项目控制台
2. 点击左侧菜单的 "Storage"
3. 点击 "New bucket"
4. 输入存储桶名称（如 `avatars`）
5. 设置为 Public（如果需要公开访问）

### 2. 配置存储策略

为了让用户能够上传和删除文件，需要配置存储策略：

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
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 允许所有人读取公开文件
CREATE POLICY "Allow public read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');
```

### 3. 环境变量配置

确保 `.env.local` 文件中配置了以下环境变量：

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

---

## 错误处理

### 常见错误

| 错误信息           | 原因                   | 解决方案                 |
| ------------------ | ---------------------- | ------------------------ |
| 未授权访问         | 用户未登录             | 确保用户已登录           |
| 请提供要上传的文件 | 未提供文件             | 检查文件是否正确传递     |
| 不支持的文件类型   | 文件类型不在允许列表中 | 使用支持的图片格式       |
| 文件过大           | 文件超过5MB            | 压缩文件或使用更小的文件 |
| 文件上传失败       | Supabase Storage 错误  | 检查存储桶配置和权限     |

### 错误处理示例

```typescript
import { uploadToStorage } from "@/lib/uploadUtils";
import { message } from "antd";

async function handleUpload(file: File) {
  try {
    const result = await uploadToStorage(file);
    return result.url;
  } catch (error: any) {
    // 根据错误类型显示不同的提示
    if (error.response?.status === 401) {
      message.error("请先登录");
    } else if (error.response?.status === 400) {
      message.error(error.response.data.error || "文件验证失败");
    } else if (error.response?.status === 500) {
      message.error("服务器错误，请稍后重试");
    } else {
      message.error("上传失败");
    }
    throw error;
  }
}
```

---

## 最佳实践

### 1. 文件命名

建议使用有意义的文件名，包含用户ID和时间戳：

```typescript
const fileName = `${userId}_${Date.now()}.${file.name.split(".").pop()}`;
```

### 2. 文件夹组织

建议按用途组织文件夹：

```
avatars/
  ├── users/          # 用户头像
  ├── system/         # 系统头像
  └── temp/           # 临时文件
```

### 3. 清理旧文件

在上传新文件前，删除旧文件以节省存储空间：

```typescript
// 删除旧头像
if (oldAvatarPath) {
  await deleteFromStorage(oldAvatarPath);
}

// 上传新头像
const result = await uploadAvatar(newFile, userId);
```

### 4. 进度显示

对于大文件，建议显示上传进度：

```typescript
import axios from "@/lib/axios";

const formData = new FormData();
formData.append("file", file);

const result = await axios.post("/api/upload", formData, {
  onUploadProgress: (progressEvent) => {
    const percentCompleted = Math.round(
      (progressEvent.loaded * 100) / (progressEvent.total || 1),
    );
    console.log(`上传进度: ${percentCompleted}%`);
  },
});
```

---

## 类型定义

所有类型定义位于 `@/types/api.ts`：

```typescript
export interface StorageApiUploadRequest {
  file: File;
  bucket?: string;
  folder?: string;
  fileName?: string;
}

export interface StorageApiUploadResponse extends ApiResponse {
  url?: string;
  path?: string;
}

export interface StorageApiDeleteRequest {
  path: string;
  bucket?: string;
}

export interface StorageApiDeleteResponse extends ApiResponse {
  message?: string;
}
```

---

## 安全注意事项

1. **文件类型验证**：服务端会验证文件类型，只允许上传图片
2. **文件大小限制**：默认限制为5MB，可根据需要调整
3. **用户认证**：所有上传操作都需要用户登录
4. **文件名安全**：自动生成的文件名包含用户ID，防止文件名冲突
5. **存储策略**：配置 Supabase Storage 策略，限制用户只能操作自己的文件

---

## 更新头像示例

完整的头像更新流程：

```typescript
import { uploadAvatar } from "@/lib/uploadUtils";
import axios from "@/lib/axios";
import { message } from "antd";

async function updateUserAvatar(file: File, userId: string) {
  try {
    // 1. 上传文件到 Supabase Storage
    const uploadResult = await uploadAvatar(file, userId);

    if (!uploadResult.url) {
      throw new Error("上传失败");
    }

    // 2. 更新用户头像URL到数据库
    await axios.put("/api/user/avatar", {
      avatarUrl: uploadResult.url,
      isSystemAvatar: false,
    });

    message.success("头像更新成功！");
    return uploadResult.url;
  } catch (error: any) {
    message.error("头像更新失败：" + (error.message || "未知错误"));
    throw error;
  }
}
```
