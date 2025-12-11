# 组件懒加载优化指南

## 概述

本文档说明如何通过组件懒加载优化项目性能，减少首屏加载时间和 JavaScript 包体积。

## 优化目标

- 减少首屏 JavaScript 包体积 30-40%
- 提升首屏加载速度 40-50%
- 改善 Time to Interactive (TTI) 指标
- 优化 Largest Contentful Paint (LCP)

## 已实施的懒加载优化

### 1. Monaco Editor 懒加载

**位置**: `src/app/(tools)/dev/realtime-render/page.tsx`

**优化前**:

```typescript
import CodeEditor from "@/components/realtimeRender/CodeEditor";
```

**优化后**:

```typescript
import dynamic from "next/dynamic";
import { Spin } from "antd";

const CodeEditor = dynamic(
  () => import("@/components/realtimeRender/CodeEditor"),
  {
    loading: () => (
      <div className="flex h-full items-center justify-center">
        <Spin size="large" tip="加载代码编辑器..." />
      </div>
    ),
    ssr: false, // Monaco Editor 依赖浏览器 API
  }
);
```

**效果**:

- Monaco Editor 包体积: ~2.5MB
- 减少首屏加载: ~2.5MB
- 仅在用户访问实时渲染页面时加载

### 2. PDF Worker CDN 化

**位置**: `src/app/(tools)/pdf/split/page.tsx`

**优化前**:

```typescript
pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs"; // 1.53MB
```

**优化后**:

```typescript
pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdn.jsdelivr.net/npm/pdfjs-dist@5.1.91/build/pdf.worker.min.mjs";
```

**效果**:

- 减少打包体积: 1.53MB
- 利用 CDN 缓存和并行加载
- 减少服务器带宽消耗

### 3. ImageViewer 懒加载

**位置**: `src/app/(tools)/image/transform/page.tsx`

**优化前**:

```typescript
import { ImageViewer } from "@/components/ImageViewer";
```

**优化后**:

```typescript
const ImageViewer = dynamic<any>(
  () => import("@/components/ImageViewer").then((mod) => mod.ImageViewer),
  {
    loading: () => (
      <div className="flex h-64 items-center justify-center">
        <Spin size="large" />
      </div>
    ),
    ssr: false,
  }
);
```

**效果**:

- 减少图片处理页面的初始加载
- 提升页面交互响应速度

## 懒加载最佳实践

### 1. 何时使用懒加载

✅ **应该懒加载的组件**:

- 大型第三方库 (Monaco Editor, Chart.js, PDF.js)
- 非首屏可见的组件
- 用户交互后才显示的组件 (Modal, Drawer)
- 条件渲染的组件
- 路由级别的页面组件

❌ **不应该懒加载的组件**:

- 首屏关键内容
- 小型组件 (< 10KB)
- 频繁使用的公共组件
- 布局组件 (Header, Footer)

### 2. 懒加载模式

#### 基础懒加载

```typescript
import dynamic from "next/dynamic";

const DynamicComponent = dynamic(() => import("./Component"));
```

#### 带加载状态

```typescript
const DynamicComponent = dynamic(() => import("./Component"), {
  loading: () => <LoadingSpinner />,
});
```

#### 禁用 SSR

```typescript
const DynamicComponent = dynamic(() => import("./Component"), {
  ssr: false, // 仅在客户端渲染
});
```

#### 命名导出

```typescript
const DynamicComponent = dynamic(() =>
  import("./Component").then((mod) => mod.NamedExport),
);
```

#### 多个组件懒加载

```typescript
const DynamicHeader = dynamic(() => import("./Header"));
const DynamicFooter = dynamic(() => import("./Footer"));
const DynamicSidebar = dynamic(() => import("./Sidebar"));
```

### 3. 加载状态设计

#### 骨架屏

```typescript
function ComponentSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-8 w-32 animate-pulse rounded bg-gray-200" />
      <div className="h-64 animate-pulse rounded bg-gray-200" />
    </div>
  );
}

const DynamicComponent = dynamic(() => import("./Component"), {
  loading: () => <ComponentSkeleton />,
});
```

#### Spin 加载器

```typescript
import { Spin } from "antd";

const DynamicComponent = dynamic(() => import("./Component"), {
  loading: () => (
    <div className="flex h-full items-center justify-center">
      <Spin size="large" tip="加载中..." />
    </div>
  ),
});
```

#### 渐进式加载

```typescript
const DynamicComponent = dynamic(() => import("./Component"), {
  loading: () => (
    <div className="animate-fade-in">
      <LoadingPlaceholder />
    </div>
  ),
});
```

## 推荐的懒加载组件

### 1. Chart.js 图表组件

```typescript
// src/components/charts/LazyChart.tsx
import dynamic from "next/dynamic";
import { Spin } from "antd";

export const LazyLineChart = dynamic(
  () => import("react-chartjs-2").then((mod) => mod.Line),
  {
    loading: () => <Spin />,
    ssr: false,
  }
);

export const LazyBarChart = dynamic(
  () => import("react-chartjs-2").then((mod) => mod.Bar),
  {
    loading: () => <Spin />,
    ssr: false,
  }
);
```

### 2. 天气图表组件

```typescript
// src/components/home/Weather/index.tsx
import dynamic from "next/dynamic";

const WeatherChart = dynamic(
  () => import("./WeatherChart"),
  {
    loading: () => <div className="h-64 animate-pulse bg-gray-200" />,
    ssr: false,
  }
);
```

### 3. AI 聊天模态框

```typescript
// src/components/home/AiChatModal/index.tsx
import dynamic from "next/dynamic";

const AiChatModal = dynamic(() => import("./AiChatModal"), {
  loading: () => null, // 模态框不需要加载状态
  ssr: false,
});
```

### 4. Markdown 编辑器

```typescript
const MarkdownEditor = dynamic(
  () => import("@monaco-editor/react"),
  {
    loading: () => <Spin size="large" tip="加载编辑器..." />,
    ssr: false,
  }
);
```

## 路由级别的代码分割

Next.js App Router 自动为每个页面进行代码分割，但你可以进一步优化：

### 1. 动态路由懒加载

```typescript
// app/tools/[toolId]/page.tsx
import dynamic from "next/dynamic";

const toolComponents = {
  "pdf-merge": dynamic(() => import("@/components/tools/PDFMerge")),
  "image-convert": dynamic(() => import("@/components/tools/ImageConvert")),
  "code-editor": dynamic(() => import("@/components/tools/CodeEditor")),
};

export default function ToolPage({ params }: { params: { toolId: string } }) {
  const ToolComponent = toolComponents[params.toolId];

  if (!ToolComponent) {
    return <NotFound />;
  }

  return <ToolComponent />;
}
```

### 2. 条件加载

```typescript
export default function Page() {
  const [showAdvanced, setShowAdvanced] = useState(false);

  // 仅在需要时加载高级功能
  const AdvancedFeatures = useMemo(
    () => showAdvanced
      ? dynamic(() => import("./AdvancedFeatures"))
      : null,
    [showAdvanced]
  );

  return (
    <div>
      <BasicFeatures />
      <button onClick={() => setShowAdvanced(true)}>
        显示高级功能
      </button>
      {AdvancedFeatures && <AdvancedFeatures />}
    </div>
  );
}
```

## 性能监控

### 1. 使用 Next.js Bundle Analyzer

```bash
# 安装
pnpm add -D @next/bundle-analyzer

# 配置 next.config.ts
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer(nextConfig);

# 运行分析
ANALYZE=true pnpm build
```

### 2. 监控懒加载性能

```typescript
// lib/performance.ts
export function trackLazyLoad(componentName: string) {
  const start = performance.now();

  return {
    end: () => {
      const duration = performance.now() - start;
      console.log(`[Lazy Load] ${componentName}: ${duration.toFixed(2)}ms`);

      // 发送到分析服务
      if (typeof window !== "undefined") {
        window.gtag?.("event", "lazy_load", {
          component: componentName,
          duration: Math.round(duration),
        });
      }
    },
  };
}

// 使用
const DynamicComponent = dynamic(async () => {
  const tracker = trackLazyLoad("MyComponent");
  const mod = await import("./MyComponent");
  tracker.end();
  return mod;
});
```

### 3. Web Vitals 监控

```typescript
// app/layout.tsx
import { SpeedInsights } from '@vercel/speed-insights/next';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
```

## 常见问题

### Q1: 懒加载组件闪烁怎么办？

**A**: 使用骨架屏或占位符保持布局稳定：

```typescript
const DynamicComponent = dynamic(() => import("./Component"), {
  loading: () => <div className="h-64" />, // 保持高度
});
```

### Q2: 如何预加载懒加载组件？

**A**: 使用 `preload` 方法：

```typescript
const DynamicComponent = dynamic(() => import("./Component"));

// 在用户可能需要之前预加载
function handleMouseEnter() {
  DynamicComponent.preload();
}

<button onMouseEnter={handleMouseEnter}>
  显示组件
</button>
```

### Q3: SSR 和懒加载如何配合？

**A**: 对于需要 SEO 的内容，使用 SSR；对于交互组件，禁用 SSR：

```typescript
// 需要 SEO
const ContentComponent = dynamic(() => import("./Content"), {
  ssr: true, // 默认值
});

// 交互组件
const InteractiveComponent = dynamic(() => import("./Interactive"), {
  ssr: false,
});
```

### Q4: 如何处理懒加载错误？

**A**: 添加错误边界：

```typescript
import { ErrorBoundary } from "react-error-boundary";

function ErrorFallback({ error }) {
  return (
    <div>
      <h2>组件加载失败</h2>
      <button onClick={() => window.location.reload()}>
        重新加载
      </button>
    </div>
  );
}

<ErrorBoundary FallbackComponent={ErrorFallback}>
  <DynamicComponent />
</ErrorBoundary>
```

## 优化效果

### 预期指标

| 指标                         | 优化前 | 优化后 | 改善   |
| ---------------------------- | ------ | ------ | ------ |
| 首屏 JS 包大小               | ~800KB | ~500KB | -37.5% |
| 首屏加载时间                 | ~3.5s  | ~2.0s  | -43%   |
| TTI (Time to Interactive)    | ~4.2s  | ~2.5s  | -40%   |
| FCP (First Contentful Paint) | ~1.8s  | ~1.2s  | -33%   |

### 实际测试

使用 Lighthouse 测试：

```bash
# 安装 Lighthouse CLI
npm install -g lighthouse

# 运行测试
lighthouse https://your-site.com --view
```

## 持续优化

### 1. 定期审查

- 每月检查 Bundle Analyzer 报告
- 识别新的懒加载机会
- 移除不必要的依赖

### 2. 自动化检测

```javascript
// scripts/check-bundle-size.js
const fs = require("fs");
const path = require("path");

const MAX_BUNDLE_SIZE = 500 * 1024; // 500KB

const statsFile = path.join(__dirname, "../.next/analyze/client.json");
const stats = JSON.parse(fs.readFileSync(statsFile, "utf8"));

const mainBundleSize = stats.assets
  .filter((asset) => asset.name.includes("main"))
  .reduce((sum, asset) => sum + asset.size, 0);

if (mainBundleSize > MAX_BUNDLE_SIZE) {
  console.error(
    `❌ Main bundle size (${mainBundleSize}) exceeds limit (${MAX_BUNDLE_SIZE})`,
  );
  process.exit(1);
}

console.log(`✅ Main bundle size: ${mainBundleSize} bytes`);
```

### 3. CI/CD 集成

```yaml
# .github/workflows/bundle-size.yml
name: Bundle Size Check

on: [pull_request]

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm build
      - run: node scripts/check-bundle-size.js
```

## 参考资源

- [Next.js Dynamic Imports](https://nextjs.org/docs/app/building-your-application/optimizing/lazy-loading)
- [React.lazy](https://react.dev/reference/react/lazy)
- [Web.dev - Code Splitting](https://web.dev/code-splitting-suspense/)
- [Bundle Analyzer](https://www.npmjs.com/package/@next/bundle-analyzer)
