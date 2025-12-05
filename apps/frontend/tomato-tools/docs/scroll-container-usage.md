# ScrollContainer 组件使用文档

## 组件简介

`ScrollContainer` 是一个带自定义滚动条样式的容器组件，提供了优雅的滚动体验。

## 主要特性

1. **鼠标悬停显示滚动条**：默认隐藏滚动条，鼠标移入时显示，移出时隐藏
2. **自定义滚动条样式**：支持自定义滚动条宽度、颜色等样式
3. **深色模式支持**：自动适配深色主题
4. **移动端兼容**：支持触摸滑动，滑动时显示滚动条
5. **主题色支持**：提供默认灰色和主题色两种滚动条样式
6. **浏览器兼容**：兼容主流浏览器（Chrome、Firefox、Safari、Edge）

## API 文档

### Props

| 属性             | 类型                                         | 默认值      | 说明                                         |
| ---------------- | -------------------------------------------- | ----------- | -------------------------------------------- |
| `children`       | `React.ReactNode`                            | -           | 容器内容（必需）                             |
| `className`      | `string`                                     | -           | 自定义样式类名                               |
| `scrollbarType`  | `"default" \| "primary"`                     | `"default"` | 滚动条类型：default(灰色) 或 primary(主题色) |
| `alwaysShow`     | `boolean`                                    | `false`     | 是否始终显示滚动条                           |
| `scrollbarWidth` | `number`                                     | `6`         | 滚动条宽度（像素）                           |
| `style`          | `React.CSSProperties`                        | -           | 自定义内联样式                               |
| `onScroll`       | `(e: React.UIEvent<HTMLDivElement>) => void` | -           | 滚动事件回调                                 |

### Ref

组件支持通过 `ref` 访问底层的 `HTMLDivElement` 元素。

## 使用示例

### 基础用法

```tsx
import ScrollContainer from "@/components/ui/ScrollContainer";

function MyComponent() {
  return (
    <ScrollContainer className="h-[400px]">
      <div>
        {/* 你的内容 */}
        <p>内容1</p>
        <p>内容2</p>
        <p>内容3</p>
        {/* ... 更多内容 */}
      </div>
    </ScrollContainer>
  );
}
```

### 使用主题色滚动条

```tsx
<ScrollContainer className="h-[500px]" scrollbarType="primary">
  <div>内容...</div>
</ScrollContainer>
```

### 始终显示滚动条

```tsx
<ScrollContainer className="h-[400px]" alwaysShow={true}>
  <div>内容...</div>
</ScrollContainer>
```

### 自定义滚动条宽度

```tsx
<ScrollContainer className="h-[400px]" scrollbarWidth={8}>
  <div>内容...</div>
</ScrollContainer>
```

### 监听滚动事件

```tsx
function MyComponent() {
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;

    // 检测是否滚动到底部
    if (scrollTop + clientHeight >= scrollHeight - 10) {
      console.log("滚动到底部了");
    }
  };

  return (
    <ScrollContainer className="h-[400px]" onScroll={handleScroll}>
      <div>内容...</div>
    </ScrollContainer>
  );
}
```

### 使用 ref

```tsx
import { useRef } from "react";

function MyComponent() {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToTop = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <>
      <button onClick={scrollToTop}>回到顶部</button>
      <ScrollContainer ref={scrollRef} className="h-[400px]">
        <div>内容...</div>
      </ScrollContainer>
    </>
  );
}
```

### 在新闻卡片中使用

```tsx
import ScrollContainer from "@/components/ui/ScrollContainer";

function NewsCard() {
  return (
    <div className="rounded-xl bg-white shadow-md dark:bg-gray-800">
      <div className="border-b p-4">
        <h3>热门新闻</h3>
      </div>

      <ScrollContainer className="h-[350px] p-2">
        {newsList.map((news) => (
          <div key={news.id} className="p-2">
            {news.title}
          </div>
        ))}
      </ScrollContainer>
    </div>
  );
}
```

### 在待办事项列表中使用

```tsx
import ScrollContainer from "@/components/ui/ScrollContainer";

function TodoList() {
  return (
    <div className="rounded-xl bg-white shadow-md dark:bg-gray-800">
      <div className="border-b p-4">
        <h3>待办事项</h3>
      </div>

      <ScrollContainer
        className="max-h-[300px] space-y-2 pr-1"
        scrollbarType="primary"
      >
        {todos.map((todo) => (
          <div key={todo.id} className="p-2">
            {todo.title}
          </div>
        ))}
      </ScrollContainer>
    </div>
  );
}
```

## 样式说明

### 滚动条颜色

- **默认模式（default）**：

  - 浅色主题：灰色 `rgba(156, 163, 175, 0.4)`
  - 深色主题：深灰色 `rgba(75, 85, 99, 0.5)`

- **主题色模式（primary）**：
  - 浅色主题：番茄红 `rgba(255, 99, 71, 0.4)`
  - 深色主题：番茄红 `rgba(255, 99, 71, 0.5)`

### 滚动条行为

1. **默认状态**：滚动条隐藏（透明度为0）
2. **鼠标悬停**：滚动条显示（透明度为1），过渡时间 0.3s
3. **触摸滑动**：滚动条显示，滑动结束后 1 秒隐藏
4. **始终显示模式**：滚动条始终可见

## 浏览器兼容性

- ✅ Chrome/Edge (Webkit)
- ✅ Firefox (使用 scrollbar-width 和 scrollbar-color)
- ✅ Safari (Webkit)
- ✅ 移动端浏览器（支持触摸事件）

## 注意事项

1. 容器必须设置固定高度或最大高度（如 `h-[400px]` 或 `max-h-[300px]`），否则滚动条不会出现
2. 如果内容不足以产生滚动，滚动条不会显示
3. 在移动端，滚动条会在触摸滑动时显示，滑动结束后延迟 1 秒隐藏
4. 组件使用了 `styled-jsx` 来实现动态样式，确保项目已安装相关依赖

## 迁移指南

### 从普通 div 迁移

**之前：**

```tsx
<div className="custom-scrollbar h-[350px] overflow-auto">{content}</div>
```

**之后：**

```tsx
<ScrollContainer className="h-[350px]">{content}</ScrollContainer>
```

### 从 Ant Design Spin 包裹的滚动容器迁移

**之前：**

```tsx
<div className="max-h-[300px] overflow-auto">
  <Spin spinning={loading}>{content}</Spin>
</div>
```

**之后：**

```tsx
<ScrollContainer className="max-h-[300px]">
  <Spin spinning={loading}>{content}</Spin>
</ScrollContainer>
```

## 相关资源

- [Tailwind CSS 文档](https://tailwindcss.com/docs)
- [React forwardRef 文档](https://react.dev/reference/react/forwardRef)
- [MDN - CSS Scrollbar](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Scrollbars)
