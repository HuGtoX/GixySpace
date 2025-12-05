# 全屏功能模块使用文档

## 概述

全屏功能模块提供了一套完整的、可复用的全屏控制解决方案，包括状态管理、UI组件和布局容器。该模块设计灵活，可以轻松集成到各种组件中。

## 模块组成

### 1. useFullscreen Hook

核心的全屏状态管理Hook，提供完整的全屏控制逻辑。

#### 基本用法

```tsx
import { useFullscreen } from "@/hooks/useFullscreen";

function MyComponent() {
  const { isFullscreen, toggleFullscreen } = useFullscreen({
    defaultFullscreen: false,
    enableHotkey: true,
    onFullscreenChange: (isFullscreen) => {
      console.log("全屏状态:", isFullscreen);
    },
  });

  return (
    <div>
      <button onClick={toggleFullscreen}>
        {isFullscreen ? "退出全屏" : "进入全屏"}
      </button>
    </div>
  );
}
```

#### API

**参数 (FullscreenOptions)**

| 参数               | 类型                            | 默认值 | 说明                              |
| ------------------ | ------------------------------- | ------ | --------------------------------- |
| defaultFullscreen  | boolean                         | false  | 默认是否全屏                      |
| enableHotkey       | boolean                         | false  | 是否启用快捷键（F11或Esc）        |
| hotkey             | string                          | 'F11'  | 自定义快捷键                      |
| onFullscreenChange | (isFullscreen: boolean) => void | -      | 全屏状态变化回调                  |
| onBeforeEnter      | () => boolean \| void           | -      | 进入全屏前的回调，返回false可阻止 |
| onBeforeExit       | () => boolean \| void           | -      | 退出全屏前的回调，返回false可阻止 |

**返回值 (FullscreenControls)**

| 属性             | 类型                     | 说明         |
| ---------------- | ------------------------ | ------------ |
| isFullscreen     | boolean                  | 当前是否全屏 |
| enterFullscreen  | () => void               | 进入全屏     |
| exitFullscreen   | () => void               | 退出全屏     |
| toggleFullscreen | () => void               | 切换全屏状态 |
| setFullscreen    | (value: boolean) => void | 设置全屏状态 |

#### 高级用法

```tsx
// 带生命周期控制
const { isFullscreen, toggleFullscreen } = useFullscreen({
  onBeforeEnter: () => {
    console.log("准备进入全屏");
    // 返回false可以阻止进入全屏
    return true;
  },
  onBeforeExit: () => {
    console.log("准备退出全屏");
    return true;
  },
  onFullscreenChange: (isFullscreen) => {
    if (isFullscreen) {
      // 进入全屏后的处理
      document.body.style.overflow = "hidden";
    } else {
      // 退出全屏后的处理
      document.body.style.overflow = "";
    }
  },
});

// 启用快捷键
const controls = useFullscreen({
  enableHotkey: true, // 启用F11和Esc快捷键
  hotkey: "F11", // 自定义快捷键
});
```

### 2. useNativeFullscreen Hook

使用浏览器原生全屏API的Hook，适用于需要真正全屏显示的场景。

#### 基本用法

```tsx
import { useNativeFullscreen } from "@/hooks/useFullscreen";

function MyComponent() {
  const { isFullscreen, toggleFullscreen, elementRef, isSupported } =
    useNativeFullscreen();

  if (!isSupported) {
    return <div>您的浏览器不支持全屏API</div>;
  }

  return (
    <div ref={elementRef}>
      <button onClick={toggleFullscreen}>
        {isFullscreen ? "退出全屏" : "进入全屏"}
      </button>
      <div>这个区域将全屏显示</div>
    </div>
  );
}
```

### 3. FullscreenButton 组件

通用的全屏按钮组件，提供一致的UI和交互体验。

#### 基本用法

```tsx
import { FullscreenButton } from "@/components/ui/FullscreenButton";
import { useFullscreen } from "@/hooks/useFullscreen";

function MyComponent() {
  const { isFullscreen, toggleFullscreen } = useFullscreen();

  return (
    <FullscreenButton isFullscreen={isFullscreen} onClick={toggleFullscreen} />
  );
}
```

#### API

| 参数                  | 类型       | 默认值     | 说明                 |
| --------------------- | ---------- | ---------- | -------------------- |
| isFullscreen          | boolean    | -          | 当前是否全屏（必填） |
| onClick               | () => void | -          | 点击回调（必填）     |
| fullscreenTooltip     | string     | '全屏显示' | 全屏时的提示文本     |
| exitFullscreenTooltip | string     | '退出全屏' | 非全屏时的提示文本   |
| showTooltip           | boolean    | true       | 是否显示提示         |
| fullscreenIcon        | ReactNode  | -          | 自定义全屏图标       |
| exitFullscreenIcon    | ReactNode  | -          | 自定义退出全屏图标   |
| showText              | boolean    | false      | 是否显示文本         |
| fullscreenText        | string     | '全屏'     | 全屏时的文本         |
| exitFullscreenText    | string     | '退出全屏' | 非全屏时的文本       |

#### 自定义样式

```tsx
// 显示文本
<FullscreenButton
  isFullscreen={isFullscreen}
  onClick={toggleFullscreen}
  showText={true}
  fullscreenText="全屏模式"
  exitFullscreenText="退出全屏"
/>

// 自定义图标
<FullscreenButton
  isFullscreen={isFullscreen}
  onClick={toggleFullscreen}
  fullscreenIcon={<MyCustomIcon />}
  exitFullscreenIcon={<MyCustomExitIcon />}
/>

// 自定义样式
<FullscreenButton
  isFullscreen={isFullscreen}
  onClick={toggleFullscreen}
  type="primary"
  className="my-custom-class"
/>
```

### 4. FullscreenContainer 组件

提供全屏状态下的样式和布局支持。

#### 基本用法

```tsx
import { FullscreenContainer } from "@/components/ui/FullscreenContainer";
import { useFullscreen } from "@/hooks/useFullscreen";

function MyComponent() {
  const { isFullscreen } = useFullscreen();

  return (
    <FullscreenContainer isFullscreen={isFullscreen}>
      <div>这里的内容会根据全屏状态自动调整</div>
    </FullscreenContainer>
  );
}
```

#### API

| 参数                | 类型          | 默认值 | 说明                   |
| ------------------- | ------------- | ------ | ---------------------- |
| isFullscreen        | boolean       | -      | 是否全屏（必填）       |
| children            | ReactNode     | -      | 子元素（必填）         |
| className           | string        | ''     | 自定义类名             |
| style               | CSSProperties | {}     | 自定义样式             |
| fullscreenClassName | string        | ''     | 全屏时的类名           |
| fullscreenStyle     | CSSProperties | {}     | 全屏时的样式           |
| enableAnimation     | boolean       | true   | 是否启用动画           |
| animationDuration   | number        | 0.3    | 动画持续时间（秒）     |
| fixedPosition       | boolean       | true   | 是否固定定位（全屏时） |
| zIndex              | number        | 1000   | z-index值              |

### 5. FullscreenWrapper 组件

提供头部、内容、底部的布局结构，适用于复杂的全屏场景。

#### 基本用法

```tsx
import { FullscreenWrapper } from "@/components/ui/FullscreenContainer";
import { useFullscreen } from "@/hooks/useFullscreen";

function MyComponent() {
  const { isFullscreen, toggleFullscreen } = useFullscreen();

  return (
    <FullscreenWrapper
      isFullscreen={isFullscreen}
      header={
        <div className="flex items-center justify-between p-4">
          <h1>标题</h1>
          <FullscreenButton
            isFullscreen={isFullscreen}
            onClick={toggleFullscreen}
          />
        </div>
      }
      footer={
        <div className="p-4">
          <button>确定</button>
        </div>
      }
    >
      <div>主要内容区域</div>
    </FullscreenWrapper>
  );
}
```

## 完整示例

### 示例1：简单的全屏卡片

```tsx
import { useFullscreen } from "@/hooks/useFullscreen";
import { FullscreenButton } from "@/components/ui/FullscreenButton";
import { FullscreenContainer } from "@/components/ui/FullscreenContainer";

function FullscreenCard() {
  const { isFullscreen, toggleFullscreen } = useFullscreen({
    enableHotkey: true,
    onFullscreenChange: (isFullscreen) => {
      console.log("全屏状态变化:", isFullscreen);
    },
  });

  return (
    <FullscreenContainer
      isFullscreen={isFullscreen}
      className="rounded-lg bg-white shadow-lg dark:bg-gray-800"
      fullscreenClassName="rounded-none"
    >
      <div className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">我的卡片</h2>
          <FullscreenButton
            isFullscreen={isFullscreen}
            onClick={toggleFullscreen}
          />
        </div>
        <div className="content">
          <p>这是卡片内容</p>
        </div>
      </div>
    </FullscreenContainer>
  );
}
```

### 示例2：带头部和底部的全屏布局

```tsx
import { useFullscreen } from "@/hooks/useFullscreen";
import { FullscreenButton } from "@/components/ui/FullscreenButton";
import { FullscreenWrapper } from "@/components/ui/FullscreenContainer";

function FullscreenLayout() {
  const { isFullscreen, toggleFullscreen } = useFullscreen({
    defaultFullscreen: false,
    enableHotkey: true,
  });

  return (
    <FullscreenWrapper
      isFullscreen={isFullscreen}
      header={
        <div className="flex items-center justify-between bg-gray-100 p-4 dark:bg-gray-900">
          <h1 className="text-2xl font-bold">应用标题</h1>
          <FullscreenButton
            isFullscreen={isFullscreen}
            onClick={toggleFullscreen}
            showText={true}
          />
        </div>
      }
      footer={
        <div className="flex justify-end gap-2 bg-gray-100 p-4 dark:bg-gray-900">
          <button className="rounded bg-gray-300 px-4 py-2">取消</button>
          <button className="rounded bg-blue-500 px-4 py-2 text-white">
            确定
          </button>
        </div>
      }
      contentClassName="p-6"
    >
      <div>
        <h2 className="mb-4 text-xl">主要内容区域</h2>
        <p>这里是可滚动的内容...</p>
      </div>
    </FullscreenWrapper>
  );
}
```

### 示例3：在Modal中使用

```tsx
import GModal from "@/components/ui/Modal";

function MyModal() {
  const [visible, setVisible] = useState(false);

  return (
    <GModal
      title="我的对话框"
      visible={visible}
      onClose={() => setVisible(false)}
      showFullscreen={true}
      enableFullscreenHotkey={true}
      defaultFullscreen={false}
      onFullscreenChange={(isFullscreen) => {
        console.log("Modal全屏状态:", isFullscreen);
      }}
    >
      <div>对话框内容</div>
    </GModal>
  );
}
```

### 示例4：使用浏览器原生全屏API

```tsx
import { useNativeFullscreen } from "@/hooks/useFullscreen";

function VideoPlayer() {
  const { isFullscreen, toggleFullscreen, elementRef, isSupported } =
    useNativeFullscreen();

  return (
    <div ref={elementRef} className="relative">
      <video src="video.mp4" controls className="w-full" />
      {isSupported && (
        <button
          onClick={toggleFullscreen}
          className="absolute right-4 top-4 rounded bg-black bg-opacity-50 px-4 py-2 text-white"
        >
          {isFullscreen ? "退出全屏" : "全屏播放"}
        </button>
      )}
    </div>
  );
}
```

## 最佳实践

### 1. 响应式设计

```tsx
const { isFullscreen, toggleFullscreen } = useFullscreen();

return (
  <FullscreenContainer
    isFullscreen={isFullscreen}
    className="p-4 md:p-6 lg:p-8"
    fullscreenClassName="p-0"
  >
    <div
      className={` ${isFullscreen ? "flex h-screen flex-col" : "mx-auto max-w-4xl"} `}
    >
      {/* 内容 */}
    </div>
  </FullscreenContainer>
);
```

### 2. 与其他状态管理集成

```tsx
// 使用Context
const FullscreenContext = createContext<FullscreenControls | null>(null);

function FullscreenProvider({ children }) {
  const fullscreenControls = useFullscreen({
    enableHotkey: true,
  });

  return (
    <FullscreenContext.Provider value={fullscreenControls}>
      {children}
    </FullscreenContext.Provider>
  );
}

// 在子组件中使用
function ChildComponent() {
  const { isFullscreen, toggleFullscreen } = useContext(FullscreenContext);
  // ...
}
```

### 3. 条件性启用快捷键

```tsx
function MyComponent({ isActive }) {
  const { isFullscreen, toggleFullscreen } = useFullscreen({
    enableHotkey: isActive, // 只在组件激活时启用快捷键
  });

  // ...
}
```

### 4. 全屏状态持久化

```tsx
function MyComponent() {
  const [savedFullscreen, setSavedFullscreen] = useState(() => {
    return localStorage.getItem("fullscreen") === "true";
  });

  const { isFullscreen, toggleFullscreen } = useFullscreen({
    defaultFullscreen: savedFullscreen,
    onFullscreenChange: (isFullscreen) => {
      localStorage.setItem("fullscreen", String(isFullscreen));
    },
  });

  // ...
}
```

## 注意事项

1. **快捷键冲突**：启用快捷键时注意避免与其他组件的快捷键冲突
2. **性能优化**：在大型应用中，建议使用Context来共享全屏状态，避免重复创建Hook
3. **浏览器兼容性**：`useNativeFullscreen` 依赖浏览器原生API，使用前请检查 `isSupported`
4. **移动端适配**：移动端全屏体验可能与桌面端不同，建议针对性优化
5. **样式冲突**：全屏时注意处理z-index和定位相关的样式冲突

## 类型定义

所有类型定义都已导出，可以直接导入使用：

```tsx
import type {
  FullscreenOptions,
  FullscreenControls,
  FullscreenButtonProps,
  FullscreenContainerProps,
  FullscreenWrapperProps,
} from "@/hooks/useFullscreen";
```

## 总结

全屏功能模块提供了完整的全屏解决方案，具有以下特点：

- ✅ **独立可复用**：各模块独立设计，可单独使用或组合使用
- ✅ **类型安全**：完整的TypeScript类型定义
- ✅ **灵活配置**：丰富的配置选项，满足各种场景需求
- ✅ **易于集成**：与现有UI框架无缝集成
- ✅ **响应式支持**：完善的响应式布局支持
- ✅ **快捷键支持**：内置快捷键功能，提升用户体验
- ✅ **生命周期控制**：提供完整的生命周期钩子
