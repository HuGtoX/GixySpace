# ScrollContainer 迁移指南

本指南将帮助你将项目中现有的滚动容器迁移到新的 `ScrollContainer` 组件。

## 为什么要迁移？

新的 `ScrollContainer` 组件提供了以下优势：

1. **更好的用户体验**: 鼠标悬停时才显示滚动条，界面更简洁
2. **统一的样式**: 所有滚动容器使用统一的样式规范
3. **更好的可维护性**: 集中管理滚动条样式，便于后续调整
4. **移动端优化**: 自动处理触摸事件，提供更好的移动端体验
5. **类型安全**: 完整的 TypeScript 类型定义

## 迁移步骤

### 步骤 1: 识别需要迁移的组件

在项目中搜索以下模式：

```tsx
// 模式 1: 使用 overflow-auto 的 div
<div className="overflow-auto">

// 模式 2: 使用 custom-scrollbar 类
<div className="custom-scrollbar">

// 模式 3: 固定高度的滚动容器
<div className="h-[350px] overflow-auto">
<div className="max-h-[300px] overflow-auto">
```

### 步骤 2: 导入组件

在需要迁移的文件顶部添加导入：

```tsx
import ScrollContainer from "@/components/ui/ScrollContainer";
```

### 步骤 3: 替换代码

根据不同的使用场景，按照以下示例进行替换。

## 迁移示例

### 示例 1: 新闻卡片 (HotCard.tsx)

**迁移前：**

```tsx
<div className="h-[350px] overflow-auto p-2">
  {loading ? (
    // 骨架屏
    <Skeleton />
  ) : items?.length > 0 ? (
    items.map((item) => <NewsItem key={item.id} item={item} />)
  ) : (
    <div>暂无数据</div>
  )}
</div>
```

**迁移后：**

```tsx
import ScrollContainer from "@/components/ui/ScrollContainer";

<ScrollContainer className="h-[350px] p-2">
  {loading ? (
    // 骨架屏
    <Skeleton />
  ) : items?.length > 0 ? (
    items.map((item) => <NewsItem key={item.id} item={item} />)
  ) : (
    <div>暂无数据</div>
  )}
</ScrollContainer>;
```

**改进点：**

- 鼠标悬停时才显示滚动条
- 自动适配深色模式
- 移动端触摸优化

### 示例 2: 待办事项列表 (Todo/index.tsx)

**迁移前：**

```tsx
<div className="max-h-[300px] space-y-2 overflow-auto pr-1">
  <Spin spinning={loading} tip="加载中...">
    {todos.filter((todo) => todo.status !== "completed").length === 0 ? (
      <EmptyState />
    ) : (
      todos
        .filter((todo) => todo.status !== "completed")
        .map((todo) => <TodoItem key={todo.id} todo={todo} />)
    )}
  </Spin>
</div>
```

**迁移后：**

```tsx
import ScrollContainer from "@/components/ui/ScrollContainer";

<ScrollContainer
  className="max-h-[300px] space-y-2 pr-1"
  scrollbarType="primary"
>
  <Spin spinning={loading} tip="加载中...">
    {todos.filter((todo) => todo.status !== "completed").length === 0 ? (
      <EmptyState />
    ) : (
      todos
        .filter((todo) => todo.status !== "completed")
        .map((todo) => <TodoItem key={todo.id} todo={todo} />)
    )}
  </Spin>
</ScrollContainer>;
```

**改进点：**

- 使用主题色滚动条，与待办事项的重要性相匹配
- 保持原有的 `space-y-2` 和 `pr-1` 样式

### 示例 3: 侧边栏导航

**迁移前：**

```tsx
<aside className="h-screen overflow-auto bg-white dark:bg-gray-800">
  <nav>
    <ul>
      {menuItems.map((item) => (
        <li key={item.id}>{item.label}</li>
      ))}
    </ul>
  </nav>
</aside>
```

**迁移后：**

```tsx
import ScrollContainer from "@/components/ui/ScrollContainer";

<aside className="h-screen bg-white dark:bg-gray-800">
  <ScrollContainer className="h-full">
    <nav>
      <ul>
        {menuItems.map((item) => (
          <li key={item.id}>{item.label}</li>
        ))}
      </ul>
    </nav>
  </ScrollContainer>
</aside>;
```

**改进点：**

- 侧边栏滚动条只在需要时显示
- 保持界面简洁

### 示例 4: 模态框内容

**迁移前：**

```tsx
<Modal open={open} onClose={onClose}>
  <div className="max-h-[500px] overflow-auto p-4">
    <h2>标题</h2>
    <div>{content}</div>
  </div>
</Modal>
```

**迁移后：**

```tsx
import ScrollContainer from "@/components/ui/ScrollContainer";

<Modal open={open} onClose={onClose}>
  <div className="p-4">
    <h2>标题</h2>
    <ScrollContainer className="max-h-[500px]">
      <div>{content}</div>
    </ScrollContainer>
  </div>
</Modal>;
```

**改进点：**

- 模态框内容区域滚动体验更好
- 标题固定，内容可滚动

### 示例 5: 表格容器

**迁移前：**

```tsx
<div className="overflow-auto">
  <table className="min-w-full">
    <thead>
      <tr>
        <th>列1</th>
        <th>列2</th>
      </tr>
    </thead>
    <tbody>
      {data.map((row) => (
        <tr key={row.id}>
          <td>{row.col1}</td>
          <td>{row.col2}</td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
```

**迁移后：**

```tsx
import ScrollContainer from "@/components/ui/ScrollContainer";

<ScrollContainer className="max-h-[600px]">
  <table className="min-w-full">
    <thead>
      <tr>
        <th>列1</th>
        <th>列2</th>
      </tr>
    </thead>
    <tbody>
      {data.map((row) => (
        <tr key={row.id}>
          <td>{row.col1}</td>
          <td>{row.col2}</td>
        </tr>
      ))}
    </tbody>
  </table>
</ScrollContainer>;
```

**改进点：**

- 表格滚动时滚动条更明显
- 支持横向和纵向滚动

## 高级用法

### 1. 监听滚动事件

```tsx
import { useState } from "react";
import ScrollContainer from "@/components/ui/ScrollContainer";

function InfiniteScrollList() {
  const [page, setPage] = useState(1);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;

    // 滚动到底部时加载更多
    if (scrollTop + clientHeight >= scrollHeight - 50) {
      setPage((prev) => prev + 1);
    }
  };

  return (
    <ScrollContainer className="h-[500px]" onScroll={handleScroll}>
      {/* 列表内容 */}
    </ScrollContainer>
  );
}
```

### 2. 使用 ref 控制滚动

```tsx
import { useRef } from "react";
import ScrollContainer from "@/components/ui/ScrollContainer";

function ChatWindow() {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  };

  return (
    <>
      <ScrollContainer ref={scrollRef} className="h-[400px]">
        {messages.map((msg) => (
          <Message key={msg.id} message={msg} />
        ))}
      </ScrollContainer>
      <button onClick={scrollToBottom}>滚动到底部</button>
    </>
  );
}
```

### 3. 条件渲染滚动条类型

```tsx
import ScrollContainer from "@/components/ui/ScrollContainer";

function DynamicList({ isImportant }: { isImportant: boolean }) {
  return (
    <ScrollContainer
      className="h-[400px]"
      scrollbarType={isImportant ? "primary" : "default"}
    >
      {/* 列表内容 */}
    </ScrollContainer>
  );
}
```

## 注意事项

### 1. 高度设置

❌ **错误**：没有设置高度

```tsx
<ScrollContainer>
  <div>内容</div>
</ScrollContainer>
```

✅ **正确**：设置固定高度或最大高度

```tsx
<ScrollContainer className="h-[400px]">
  <div>内容</div>
</ScrollContainer>

<ScrollContainer className="max-h-[400px]">
  <div>内容</div>
</ScrollContainer>
```

### 2. 嵌套滚动

尽量避免嵌套滚动容器，如果必须嵌套，确保内外容器的高度设置合理：

```tsx
<ScrollContainer className="h-[600px]">
  <div>
    <h2>外层内容</h2>
    <ScrollContainer className="h-[200px]">
      <div>内层内容</div>
    </ScrollContainer>
  </div>
</ScrollContainer>
```

### 3. 性能考虑

对于包含大量元素的列表，考虑使用虚拟滚动：

```tsx
import { FixedSizeList } from "react-window";
import ScrollContainer from "@/components/ui/ScrollContainer";

function VirtualList({ items }: { items: any[] }) {
  return (
    <ScrollContainer className="h-[500px]">
      <FixedSizeList
        height={500}
        itemCount={items.length}
        itemSize={50}
        width="100%"
      >
        {({ index, style }) => <div style={style}>{items[index].name}</div>}
      </FixedSizeList>
    </ScrollContainer>
  );
}
```

## 迁移检查清单

- [ ] 已导入 `ScrollContainer` 组件
- [ ] 已设置容器高度（`h-[xxx]` 或 `max-h-[xxx]`）
- [ ] 已移除原有的 `overflow-auto` 类
- [ ] 已移除原有的 `custom-scrollbar` 类
- [ ] 已测试鼠标悬停效果
- [ ] 已测试移动端触摸滑动
- [ ] 已测试深色模式
- [ ] 已验证滚动功能正常

## 常见问题

### Q: 滚动条不显示？

A: 检查以下几点：

1. 容器是否设置了高度？
2. 内容是否超出容器高度？
3. 是否正确导入了组件？

### Q: 如何让滚动条始终显示？

A: 使用 `alwaysShow` 属性：

```tsx
<ScrollContainer alwaysShow={true} className="h-[400px]">
  {content}
</ScrollContainer>
```

### Q: 如何自定义滚动条宽度？

A: 使用 `scrollbarWidth` 属性：

```tsx
<ScrollContainer scrollbarWidth={8} className="h-[400px]">
  {content}
</ScrollContainer>
```

### Q: 移动端滚动不流畅？

A: 组件已经处理了触摸事件，如果仍有问题，可以添加以下 CSS：

```tsx
<ScrollContainer
  className="h-[400px]"
  style={{ WebkitOverflowScrolling: "touch" }}
>
  {content}
</ScrollContainer>
```

## 获取帮助

如果在迁移过程中遇到问题，可以：

1. 查看 [完整使用文档](./scroll-container-usage.md)
2. 访问 [演示页面](/demo/scroll-container)
3. 查看 [组件源码](../src/components/ui/ScrollContainer.tsx)
4. 提交 Issue 或联系开发团队

## 总结

迁移到 `ScrollContainer` 组件可以显著提升用户体验和代码可维护性。建议优先迁移以下场景：

1. **高频使用的列表**: 新闻列表、待办事项、评论列表等
2. **侧边栏导航**: 菜单、目录等
3. **模态框内容**: 长表单、详情页等
4. **表格容器**: 数据表格、报表等

逐步迁移，每次迁移后进行充分测试，确保功能正常。
