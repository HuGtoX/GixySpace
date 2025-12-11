# 图片资源优化指南

## 概述

本文档说明如何优化项目中的图片资源，以减少 70% 以上的图片体积，提升页面加载速度。

## 当前问题

项目中存在以下图片资源问题：

1. **头像图片过大**：`public/avatar/` 目录下的 7 个 PNG 图片，每个都超过 1MB

   - a1.png - a7.png: 1.25MB ~ 1.74MB

2. **SVG 图标过大**：部分 SVG 文件未经优化

   - douyin.svg: 1.24MB
   - toutiao.svg: 4.09MB
   - baidu.svg: 55KB

3. **未使用现代图片格式**：没有使用 WebP 等高压缩比格式

4. **未使用 Next.js Image 组件**：部分地方直接使用 `<img>` 标签

## 优化方案

### 1. 安装依赖

```bash
pnpm run optimize:images:install
```

或手动安装：

```bash
pnpm add -D sharp svgo
```

### 2. 运行优化脚本

```bash
pnpm run optimize:images
```

这个脚本会：

- 压缩所有头像图片（PNG → WebP + 优化的 PNG）
- 压缩所有新闻图标
- 优化大型 SVG 文件
- 将优化后的文件输出到 `-optimized` 目录

### 3. 检查优化结果

优化后的文件会保存在：

- `public/avatar-optimized/` - 优化后的头像
- `public/news-icon-optimized/` - 优化后的图标

**预期效果**：

- PNG 图片体积减少 70-80%
- SVG 文件体积减少 50-90%
- 总体图片资源减少约 10MB

### 4. 使用优化的图片组件

项目提供了三个优化的图片组件：

#### OptimizedImage - 通用图片组件

```tsx
import { OptimizedImage } from "@/components/ui/OptimizedImage";

<OptimizedImage
  src="/path/to/image.png"
  alt="描述"
  width={400}
  height={300}
  fallbackSrc="/fallback.png" // 可选：加载失败时的降级图片
  showPlaceholder={true} // 可选：显示加载占位符
/>;
```

#### AvatarImage - 头像组件

```tsx
import { AvatarImage } from "@/components/ui/OptimizedImage";

<AvatarImage
  src="/avatar/a1.png"
  alt="用户头像"
  size={40} // 可选：默认 40px
  className="border-2 border-white"
/>;
```

特性：

- 自动尝试加载 WebP 格式
- 加载失败时降级到原始格式
- 圆形裁剪
- 懒加载

#### NewsIcon - 新闻图标组件

```tsx
import { NewsIcon } from "@/components/ui/OptimizedImage";

<NewsIcon
  src="/news-icon/baidu.svg"
  alt="百度"
  size={24} // 可选：默认 24px
/>;
```

### 5. 替换现有代码

查找并替换项目中的 `<img>` 标签：

```bash
# 搜索使用 img 标签的地方
grep -r "<img" src/
```

替换示例：

```tsx
// 优化前
<img src="/avatar/a1.png" alt="头像" />

// 优化后
<AvatarImage src="/avatar/a1.png" alt="头像" size={40} />
```

### 6. 配置 CDN（可选）

对于大型静态文件，建议使用 CDN：

#### PDF Worker

```typescript
// 优化前：本地加载 1.53MB
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.min.mjs";

// 优化后：使用 CDN
import { pdfjs } from "pdfjs-dist";
pdfjs.GlobalWorkerOptions.workerSrc =
  "https://cdn.jsdelivr.net/npm/pdfjs-dist@5.1.91/build/pdf.worker.min.mjs";
```

#### 城市列表数据

```typescript
// 优化前：本地加载 1.07MB JSON
import cityList from "@/public/static/China-City-List-latest.json";

// 优化后：按需加载或使用 API
const loadCityList = async () => {
  const response = await fetch("/api/cities");
  return response.json();
};
```

## 优化效果

### 预期指标

| 指标                           | 优化前 | 优化后 | 改善 |
| ------------------------------ | ------ | ------ | ---- |
| 头像图片总大小                 | ~9.5MB | ~2MB   | -79% |
| SVG 图标总大小                 | ~5.4MB | ~0.5MB | -91% |
| 首屏加载时间                   | ~3.5s  | ~1.5s  | -57% |
| LCP (Largest Contentful Paint) | ~2.8s  | ~1.2s  | -57% |

### 验证优化效果

1. **使用 Chrome DevTools**

   - Network 面板查看资源大小
   - Lighthouse 检查性能分数

2. **使用 Next.js 分析工具**

   ```bash
   ANALYZE=true pnpm build
   ```

3. **监控 Web Vitals**
   - 项目已集成 `@vercel/speed-insights`
   - 查看实际用户的性能数据

## 最佳实践

### 1. 图片格式选择

- **照片/复杂图像**：WebP > JPEG > PNG
- **图标/简单图形**：SVG > WebP > PNG
- **透明背景**：WebP (带 alpha) > PNG

### 2. 图片尺寸

- 根据实际显示尺寸提供图片
- 使用 `srcset` 提供多种尺寸
- Next.js Image 会自动处理响应式

### 3. 懒加载

- 首屏外的图片使用 `loading="lazy"`
- Next.js Image 默认启用懒加载
- 关键图片使用 `priority` 属性

### 4. 占位符

```tsx
<OptimizedImage
  src="/large-image.jpg"
  alt="大图"
  width={800}
  height={600}
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,..." // 使用 plaiceholder 生成
/>
```

## 故障排除

### 问题：优化脚本运行失败

**解决方案**：

```bash
# 确保安装了依赖
pnpm add -D sharp svgo

# 检查 Node.js 版本（需要 >= 18）
node -v

# 清理缓存后重试
rm -rf node_modules
pnpm install
```

### 问题：图片显示模糊

**解决方案**：

- 检查 `quality` 参数（建议 80-90）
- 确保提供了足够大的原始图片
- 使用 `unoptimized={false}` 启用优化

### 问题：WebP 不显示

**解决方案**：

- 检查浏览器兼容性（现代浏览器都支持）
- 确保提供了降级方案（PNG/JPEG）
- 使用 `OptimizedImage` 组件自动处理

## 持续优化

### 1. 自动化

在 CI/CD 中添加图片优化步骤：

```yaml
# .github/workflows/optimize-images.yml
name: Optimize Images

on:
  push:
    paths:
      - "public/**/*.png"
      - "public/**/*.jpg"
      - "public/**/*.svg"

jobs:
  optimize:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm run optimize:images
      - uses: stefanzweifel/git-auto-commit-action@v4
        with:
          commit_message: "chore: optimize images"
```

### 2. 监控

- 定期检查 Lighthouse 分数
- 监控 Web Vitals 指标
- 使用 Bundle Analyzer 检查资源大小

### 3. 新增图片规范

上传新图片时：

1. 使用合适的格式和尺寸
2. 运行优化脚本
3. 使用优化的图片组件
4. 测试加载性能

## 参考资源

- [Next.js Image 优化文档](https://nextjs.org/docs/app/building-your-application/optimizing/images)
- [WebP 格式介绍](https://developers.google.com/speed/webp)
- [Sharp 图片处理库](https://sharp.pixelplumbing.com/)
- [SVGO SVG 优化工具](https://github.com/svg/svgo)
