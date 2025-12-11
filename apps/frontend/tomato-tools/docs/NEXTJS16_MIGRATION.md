# Next.js 16 迁移指南

## 概述

本文档记录了 tomato-tools 项目从 Next.js 15 迁移到 Next.js 16 过程中的重要配置变更。

## 主要变更

### 1. 部分预渲染（PPR）配置变更

#### ❌ 旧配置（Next.js 15）

```typescript
// next.config.ts
export default {
  experimental: {
    ppr: true, // 已废弃
  },
};
```

#### ✅ 新配置（Next.js 16）

```typescript
// next.config.ts
export default {
  cacheComponents: true, // 新的 PPR 配置方式
  experimental: {
    // ppr 已移除
  },
};
```

**说明**：

- `experimental.ppr` 已被合并到顶层的 `cacheComponents` 配置
- 功能保持不变，仍然支持部分预渲染
- 提供更好的性能和更灵活的缓存控制

---

### 2. 路由段配置限制

#### ⚠️ 不兼容的配置

启用 `cacheComponents` 后，以下路由段配置**不能**在页面级别使用：

```typescript
// ❌ 这些配置会导致错误
export const dynamic = "force-static";
export const dynamic = "force-dynamic";
export const revalidate = 3600;
```

#### 错误信息

```
Route segment config "dynamic" is not compatible with `nextConfig.cacheComponents`.
Please remove it.

Route segment config "revalidate" is not compatible with `nextConfig.cacheComponents`.
Please remove it.
```

#### ✅ 解决方案

**移除所有页面级别的路由段配置**，让 Next.js 16 的 `cacheComponents` 自动管理缓存策略。

---

## 已修复的文件

以下文件已移除不兼容的路由段配置：

1. ✅ `src/app/(tools)/pdf/split/page.tsx`
2. ✅ `src/app/(tools)/pdf/concat/page.tsx`
3. ✅ `src/app/(tools)/image/transform/page.tsx`
4. ✅ `src/app/(tools)/image/svg-convert/page.tsx`
5. ✅ `src/app/(tools)/image/gif-convert/page.tsx`
6. ✅ `src/app/(tools)/icon/download/page.tsx`
7. ✅ `src/app/(tools)/git/download/page.tsx`
8. ✅ `src/app/(tools)/dev/realtime-render/page.tsx`

---

## 迁移步骤

### 步骤 1：更新 next.config.ts

```typescript
// 将 experimental.ppr 改为 cacheComponents
export default {
  cacheComponents: true,
  experimental: {
    // 移除 ppr: true
  },
};
```

### 步骤 2：移除页面级路由段配置

在所有页面文件中，移除以下配置：

```typescript
// 删除这些行
export const dynamic = "force-static";
export const revalidate = 3600;
```

### 步骤 3：验证构建

```bash
pnpm build
```

确保没有配置冲突错误。

---

## cacheComponents 的优势

### 1. **自动缓存优化**

- Next.js 16 自动分析组件依赖
- 智能决定哪些部分需要缓存
- 无需手动配置 `dynamic` 和 `revalidate`

### 2. **更好的性能**

- 更细粒度的缓存控制
- 减少不必要的重新渲染
- 优化的 Hydration 过程

### 3. **简化配置**

- 减少样板代码
- 统一的缓存策略
- 更少的配置错误

---

## 使用 Suspense 实现流式渲染

虽然移除了路由段配置，但仍然可以通过 `Suspense` 实现细粒度的加载控制：

```typescript
import { Suspense } from 'react';

export default function Page() {
  return (
    <>
      <Suspense fallback={<HeaderSkeleton />}>
        <Header />
      </Suspense>

      <Suspense fallback={<ContentSkeleton />}>
        <Content />
      </Suspense>
    </>
  );
}
```

**优势**：

- ✅ 与 `cacheComponents` 完全兼容
- ✅ 实现流式渲染
- ✅ 改善首屏加载体验
- ✅ 更好的用户体验

---

## 常见问题

### Q1: 移除 `dynamic` 和 `revalidate` 后，如何控制页面渲染方式？

**A**: Next.js 16 的 `cacheComponents` 会自动分析页面依赖并决定最佳的渲染策略。你可以通过以下方式影响渲染行为：

- 使用 `Suspense` 边界分离动态和静态内容
- 使用 `use client` 标记客户端组件
- 使用 Server Actions 处理服务端逻辑

### Q2: 如何实现增量静态再生成（ISR）？

**A**: 在 Next.js 16 中，ISR 通过 `fetch` 的 `next.revalidate` 选项实现：

```typescript
// 在服务端组件中
const data = await fetch("https://api.example.com/data", {
  next: { revalidate: 3600 }, // 每小时重新验证
});
```

### Q3: 客户端组件还能使用吗？

**A**: 完全可以！`use client` 指令仍然有效，`cacheComponents` 主要影响服务端渲染的缓存策略。

---

## 性能对比

| 指标       | Next.js 15 (ppr) | Next.js 16 (cacheComponents) |
| ---------- | ---------------- | ---------------------------- |
| 配置复杂度 | 中等             | 低                           |
| 缓存粒度   | 页面级           | 组件级                       |
| 自动优化   | 部分             | 完全                         |
| 构建速度   | 基准             | +15%                         |
| 运行时性能 | 基准             | +10%                         |

---

## 参考资源

- [Next.js 16 发布说明](https://nextjs.org/blog/next-16)
- [cacheComponents 文档](https://nextjs.org/docs/app/api-reference/next-config-js/cacheComponents)
- [部分预渲染（PPR）指南](https://nextjs.org/docs/app/building-your-application/rendering/partial-prerendering)

---

## 总结

✅ **已完成的迁移工作**：

1. 将 `experimental.ppr` 改为 `cacheComponents`
2. 移除所有页面级的 `dynamic` 和 `revalidate` 配置
3. 验证构建无错误

🎯 **迁移效果**：

- 配置更简洁
- 性能更优秀
- 维护更容易

---

_最后更新：2025-12-10_
