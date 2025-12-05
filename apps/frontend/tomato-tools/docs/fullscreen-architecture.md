# 全屏功能模块架构设计

## 设计目标

将全屏功能设计为可复用的独立组件，满足以下要求：

1. ✅ 实现独立的全屏控制逻辑模块
2. ✅ 设计通用的全屏功能接口规范
3. ✅ 确保与不同风格的modal组件都能无缝集成
4. ✅ 支持多种触发方式（按钮点击、快捷键等）
5. ✅ 提供全屏状态管理和事件监听机制
6. ✅ 保持与现有UI框架的兼容性
7. ✅ 考虑响应式布局的适配方案

## 架构概览

```
┌─────────────────────────────────────────────────────────────┐
│                     全屏功能模块                              │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────────┐  ┌──────────────────┐                  │
│  │  核心逻辑层      │  │  UI组件层         │                  │
│  ├─────────────────┤  ├──────────────────┤                  │
│  │ useFullscreen   │  │ FullscreenButton │                  │
│  │ useNative...    │  │ FullscreenContainer                 │
│  │                 │  │ FullscreenWrapper│                  │
│  └─────────────────┘  └──────────────────┘                  │
│           │                     │                            │
│           └──────────┬──────────┘                            │
│                      │                                       │
│           ┌──────────▼──────────┐                            │
│           │   集成层 (Modal等)   │                            │
│           └─────────────────────┘                            │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## 模块分层

### 1. 核心逻辑层 (Hooks)

**职责**：提供全屏状态管理和控制逻辑

#### useFullscreen Hook

- **功能**：虚拟全屏控制（通过CSS实现）
- **特点**：
  - 轻量级，不依赖浏览器API
  - 支持快捷键（F11、Esc）
  - 提供生命周期钩子
  - 完整的状态管理

```typescript
interface FullscreenOptions {
  defaultFullscreen?: boolean;
  enableHotkey?: boolean;
  hotkey?: string;
  onFullscreenChange?: (isFullscreen: boolean) => void;
  onBeforeEnter?: () => boolean | void;
  onBeforeExit?: () => boolean | void;
}

interface FullscreenControls {
  isFullscreen: boolean;
  enterFullscreen: () => void;
  exitFullscreen: () => void;
  toggleFullscreen: () => void;
  setFullscreen: (value: boolean) => void;
}
```

#### useNativeFullscreen Hook

- **功能**：浏览器原生全屏API封装
- **特点**：
  - 真正的全屏体验
  - 跨浏览器兼容
  - 自动处理前缀
  - 提供兼容性检测

### 2. UI组件层

**职责**：提供可复用的UI组件

#### FullscreenButton

- **功能**：统一的全屏按钮组件
- **特点**：
  - 自动切换图标
  - 支持提示文本
  - 可自定义样式
  - 支持文本模式

#### FullscreenContainer

- **功能**：全屏容器组件
- **特点**：
  - 自动处理全屏样式
  - 支持动画效果
  - 灵活的定位方式
  - 可自定义z-index

#### FullscreenWrapper

- **功能**：全屏布局包装器
- **特点**：
  - 头部/内容/底部布局
  - 自动处理滚动
  - 响应式支持
  - Flex布局

### 3. 集成层

**职责**：与现有组件集成

#### Modal组件集成

- 使用`useFullscreen` Hook替代内部状态
- 使用`FullscreenButton`替代自定义按钮
- 保持向后兼容
- 新增快捷键支持

## 设计模式

### 1. 关注点分离 (Separation of Concerns)

```
逻辑层 (useFullscreen)
  ↓ 提供状态和方法
UI层 (FullscreenButton, FullscreenContainer)
  ↓ 提供可视化组件
集成层 (Modal)
  ↓ 组合使用
应用层 (业务组件)
```

### 2. 组合优于继承 (Composition over Inheritance)

```tsx
// 不是通过继承扩展功能
class FullscreenModal extends Modal {}

// 而是通过组合
function MyModal() {
  const fullscreen = useFullscreen();
  return (
    <Modal>
      <FullscreenButton {...fullscreen} />
      <FullscreenContainer {...fullscreen}>{content}</FullscreenContainer>
    </Modal>
  );
}
```

### 3. 依赖注入 (Dependency Injection)

```tsx
// 组件不依赖具体实现，而是接收控制接口
function FullscreenButton({
  isFullscreen,
  onClick,
}: {
  isFullscreen: boolean;
  onClick: () => void;
}) {
  // 不关心isFullscreen和onClick如何实现
}
```

### 4. 单一职责原则 (Single Responsibility)

- `useFullscreen`: 只负责状态管理
- `FullscreenButton`: 只负责按钮UI
- `FullscreenContainer`: 只负责容器样式
- `FullscreenWrapper`: 只负责布局结构

## 接口设计

### 统一的控制接口

```typescript
interface FullscreenControls {
  isFullscreen: boolean; // 状态
  enterFullscreen: () => void; // 进入
  exitFullscreen: () => void; // 退出
  toggleFullscreen: () => void; // 切换
  setFullscreen: (value: boolean) => void; // 设置
}
```

这个接口可以被任何组件使用，无论是Modal、Card还是其他组件。

### 可扩展的配置接口

```typescript
interface FullscreenOptions {
  // 基础配置
  defaultFullscreen?: boolean;

  // 交互配置
  enableHotkey?: boolean;
  hotkey?: string;

  // 生命周期
  onFullscreenChange?: (isFullscreen: boolean) => void;
  onBeforeEnter?: () => boolean | void;
  onBeforeExit?: () => boolean | void;
}
```

## 集成方案

### 1. 与Modal集成

**重构前**：

```tsx
const [isFullscreen, setIsFullscreen] = useState(false);
const handleToggleFullscreen = () => {
  setIsFullscreen(!isFullscreen);
  onFullscreenChange?.(!isFullscreen);
};
```

**重构后**：

```tsx
const { isFullscreen, toggleFullscreen } = useFullscreen({
  defaultFullscreen,
  enableHotkey: enableFullscreenHotkey && visible,
  onFullscreenChange,
});
```

**优势**：

- 代码更简洁
- 功能更强大（快捷键、生命周期）
- 逻辑可复用

### 2. 与其他组件集成

任何组件都可以轻松集成全屏功能：

```tsx
function MyComponent() {
  const fullscreen = useFullscreen();

  return (
    <FullscreenContainer {...fullscreen}>
      <FullscreenButton {...fullscreen} />
      {content}
    </FullscreenContainer>
  );
}
```

## 响应式设计

### 1. 样式适配

```tsx
<FullscreenContainer
  isFullscreen={isFullscreen}
  className="p-4 md:p-6 lg:p-8"
  fullscreenClassName="p-0"
>
  <div className={` ${isFullscreen ? "h-screen" : "mx-auto max-w-4xl"} `}>
    {content}
  </div>
</FullscreenContainer>
```

### 2. 布局适配

```tsx
<FullscreenWrapper
  isFullscreen={isFullscreen}
  header={<Header />}
  footer={<Footer />}
>
  {/* 内容区域自动处理滚动 */}
</FullscreenWrapper>
```

## 兼容性方案

### 1. 浏览器API兼容

```typescript
// 自动处理浏览器前缀
if (element.requestFullscreen) {
  await element.requestFullscreen();
} else if (element.webkitRequestFullscreen) {
  await element.webkitRequestFullscreen();
} else if (element.mozRequestFullScreen) {
  await element.mozRequestFullScreen();
}
```

### 2. 降级方案

```typescript
// 检查是否支持原生API
const isSupported = useCallback(() => {
  return !!(
    document.fullscreenEnabled ||
    document.webkitFullscreenEnabled ||
    document.mozFullScreenEnabled
  );
}, []);

// 不支持时使用虚拟全屏
if (!isSupported) {
  return <VirtualFullscreen />;
}
```

## 性能优化

### 1. 状态管理优化

```typescript
// 使用ref避免闭包问题
const isFullscreenRef = useRef(isFullscreen);
useEffect(() => {
  isFullscreenRef.current = isFullscreen;
}, [isFullscreen]);
```

### 2. 事件监听优化

```typescript
// 只在需要时添加事件监听
useEffect(() => {
  if (!enableHotkey) return;

  window.addEventListener("keydown", handleKeyDown);
  return () => {
    window.removeEventListener("keydown", handleKeyDown);
  };
}, [enableHotkey, handleKeyDown]);
```

### 3. 组件渲染优化

```typescript
// 使用memo避免不必要的重渲染
export const FullscreenButton = React.memo<FullscreenButtonProps>(({ ... }) => {
  // ...
});
```

## 扩展性设计

### 1. 自定义触发方式

```tsx
// 按钮触发
<FullscreenButton onClick={toggleFullscreen} />;

// 快捷键触发
useFullscreen({ enableHotkey: true });

// 手势触发（可扩展）
useFullscreen({
  enableGesture: true,
  gesture: "swipe-up",
});
```

### 2. 自定义动画

```tsx
<FullscreenContainer
  enableAnimation={true}
  animationDuration={0.5}
  // 可扩展自定义动画配置
  animationConfig={{
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 }
  }}
>
```

### 3. 状态共享

```tsx
// 使用Context共享全屏状态
const FullscreenContext = createContext<FullscreenControls | null>(null);

function FullscreenProvider({ children }) {
  const fullscreen = useFullscreen();
  return (
    <FullscreenContext.Provider value={fullscreen}>
      {children}
    </FullscreenContext.Provider>
  );
}
```

## 测试策略

### 1. 单元测试

- Hook逻辑测试
- 组件渲染测试
- 事件处理测试

### 2. 集成测试

- Modal集成测试
- 快捷键功能测试
- 生命周期测试

### 3. E2E测试

- 用户交互流程测试
- 跨浏览器兼容性测试

## 文档体系

```
docs/
├── fullscreen-module-README.md    # 快速入门
├── fullscreen-module.md           # 详细API文档
└── fullscreen-architecture.md     # 架构设计（本文档）

src/components/examples/
└── FullscreenExamples.tsx         # 代码示例
```

## 总结

这个全屏功能模块通过以下设计实现了高度的可复用性：

1. **分层架构**：逻辑层、UI层、集成层清晰分离
2. **接口标准化**：统一的控制接口和配置接口
3. **组合式设计**：通过组合而非继承实现功能扩展
4. **响应式支持**：完善的响应式布局方案
5. **兼容性保证**：跨浏览器兼容和降级方案
6. **性能优化**：合理的状态管理和事件处理
7. **易于扩展**：预留扩展点，支持自定义配置

这个设计不仅满足了当前的需求，也为未来的功能扩展提供了良好的基础。
