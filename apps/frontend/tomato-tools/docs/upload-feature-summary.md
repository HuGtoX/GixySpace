# Supabase Storage 上传功能

## 📋 概述

本次更新为番茄工具箱项目添加了完整的 Supabase Storage 文件上传功能，包括：

- ✅ API 路由（上传和删除）
- ✅ 工具函数库
- ✅ TypeScript 类型定义
- ✅ 头像上传组件集成
- ✅ 完整的文档说明

## 🚀 新增文件

### 1. API 路由

**文件路径：** `src/app/api/upload/route.ts`

提供了两个 API 端点：

- `POST /api/upload` - 上传文件到 Supabase Storage
- `DELETE /api/upload` - 从 Supabase Storage 删除文件

**特性：**

- ✅ 用户身份验证
- ✅ 文件类型验证（仅支持图片）
- ✅ 文件大小限制（5MB）
- ✅ 自动生成唯一文件名
- ✅ 支持自定义存储桶和文件夹
- ✅ 完整的错误处理和日志记录

### 2. 工具函数库

**文件路径：** `src/lib/uploadUtils.ts`

提供了便捷的上传工具函数：

- `uploadToStorage()` - 通用文件上传
- `uploadAvatar()` - 头像上传（快捷方法）
- `uploadBase64ToStorage()` - Base64 图片上传
- `deleteFromStorage()` - 文件删除

### 3. 类型定义

**文件路径：** `src/types/api.ts`

新增了 Supabase Storage 相关的 TypeScript 类型：

- `StorageApiUploadRequest`
- `StorageApiUploadResponse`
- `StorageApiDeleteRequest`
- `StorageApiDeleteResponse`

### 4. 文档

**文件路径：** `docs/upload-api.md`

包含完整的使用文档：

- API 接口说明
- 工具函数使用示例
- React 组件集成示例
- Supabase 配置指南
- 错误处理和最佳实践

## 🔧 修改的文件

### 头像上传组件

**文件路径：** `src/components/avatar/AvatarUploadModal.tsx`

**更新内容：**

- ✅ 集成了 `uploadBase64ToStorage` 函数
- ✅ 裁剪后的图片自动上传到 Supabase Storage
- ✅ 添加了上传进度提示
- ✅ 改进了错误处理
- ✅ 现在返回的是 Storage URL 而不是 base64

**优势：**

- 📦 减少数据库存储压力（不再存储 base64）
- 🚀 提升加载速度（CDN 加速）
- 🔒 更好的安全性（文件权限控制）
- 💾 节省带宽（按需加载）

## 📖 使用方法

### 快速开始

#### 1. 在组件中使用

```typescript
import { uploadToStorage } from "@/lib/uploadUtils";

// 上传文件
const result = await uploadToStorage(file, {
  bucket: "avatars",
  folder: "users",
});

console.log(result.url); // 文件 URL
```

#### 2. 上传头像

```typescript
import { uploadAvatar } from "@/lib/uploadUtils";

const result = await uploadAvatar(file, userId);
// 自动上传到 avatars/users/ 目录
```

#### 3. 上传 Base64 图片

```typescript
import { uploadBase64ToStorage } from "@/lib/uploadUtils";

const result = await uploadBase64ToStorage(base64Data, "avatar.png", {
  bucket: "avatars",
  folder: "users",
});
```

### 完整示例

查看 `docs/upload-api.md` 获取更多示例和详细说明。

## ⚙️ 配置要求

### 1. 环境变量

确保 `.env.local` 中配置了以下变量：

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 2. Supabase Storage 配置

#### 创建存储桶

1. 进入 Supabase 控制台
2. 点击 "Storage"
3. 创建名为 `avatars` 的存储桶
4. 设置为 Public（允许公开访问）

#### 配置存储策略

```sql
-- 允许认证用户上传
CREATE POLICY "Allow authenticated users to upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars');

-- 允许用户删除自己的文件
CREATE POLICY "Allow users to delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'avatars');

-- 允许公开读取
CREATE POLICY "Allow public read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');
```

## 🎯 功能特性

### 安全性

- ✅ 用户身份验证（必须登录）
- ✅ 文件类型白名单验证
- ✅ 文件大小限制
- ✅ 自动生成安全的文件名
- ✅ Supabase Storage 权限控制

### 性能优化

- ✅ 文件存储在 CDN（Supabase Storage）
- ✅ 减少数据库负载
- ✅ 支持大文件上传
- ✅ 自动压缩和优化

### 开发体验

- ✅ TypeScript 类型支持
- ✅ 完整的错误处理
- ✅ 详细的日志记录
- ✅ 简洁的 API 设计
- ✅ 丰富的文档和示例

## 📝 API 参考

### POST /api/upload

**请求参数：**

- `file` (File, 必需) - 要上传的文件
- `bucket` (string, 可选) - 存储桶名称，默认 "avatars"
- `folder` (string, 可选) - 文件夹路径
- `fileName` (string, 可选) - 自定义文件名

**响应：**

```json
{
  "message": "文件上传成功",
  "url": "https://...supabase.co/storage/.../file.png",
  "path": "users/file.png"
}
```

### DELETE /api/upload

**请求参数：**

```json
{
  "path": "users/file.png",
  "bucket": "avatars"
}
```

**响应：**

```json
{
  "message": "文件删除成功"
}
```

## 🐛 常见问题

### 1. 上传失败：未授权访问

**原因：** 用户未登录  
**解决：** 确保用户已登录后再上传

### 2. 上传失败：不支持的文件类型

**原因：** 文件类型不在白名单中  
**解决：** 仅支持 JPG、PNG、GIF、WebP、SVG 格式

### 3. 上传失败：文件过大

**原因：** 文件超过 5MB  
**解决：** 压缩文件或调整 `MAX_FILE_SIZE` 配置

### 4. 上传成功但无法访问

**原因：** 存储桶未设置为 Public  
**解决：** 在 Supabase 控制台将存储桶设置为 Public

## 🔄 迁移指南

如果你的项目之前使用 base64 存储头像，现在可以迁移到 Supabase Storage：

```typescript
// 旧方式（base64）
await updateAvatar(base64Data);

// 新方式（Storage URL）
const result = await uploadBase64ToStorage(base64Data, "avatar.png");
await updateAvatar(result.url);
```

## 📚 相关文档

- [完整 API 文档](./upload-api.md)
- [Supabase Storage 文档](https://supabase.com/docs/guides/storage)
- [Next.js File Upload](https://nextjs.org/docs/app/building-your-application/routing/route-handlers#formdata)

## 🎉 总结

通过这次更新，番茄工具箱项目现在拥有了：

1. **完整的文件上传系统** - 支持上传、删除、管理
2. **优化的头像功能** - 从 base64 迁移到 CDN
3. **类型安全** - 完整的 TypeScript 支持
4. **良好的开发体验** - 简洁的 API 和丰富的文档
5. **生产就绪** - 安全、高效、可扩展

现在你可以在项目的任何地方轻松使用文件上传功能！🚀
