# 全屏功能模块 (Fullscreen Module)

一个完整的、可复用的全屏功能解决方案，适用于番茄工具箱项目。

## 📦 模块结构

```
src/
├── hooks/
│   └── useFullscreen.ts          # 全屏控制Hook
├── components/
│   ├── ui/
│   │   ├── FullscreenButton.tsx  # 全屏按钮组件
│   │   ├── FullscreenContainer.tsx # 全屏容器组件
│   │   ├── fullscreen.ts         # 统一导出文件
│   │   └── Modal.tsx             # 已集成全屏功能的Modal
│   └── examples/
│       └── FullscreenExamples.tsx # 使用示例
└── docs/
    └── fullscreen-module.md      # 详细文档
```

## ✨ 特性

- ✅ **独立可复用** - 各模块独立设计，可单独使用或组合使用
- ✅ **类型安全** - 完整的TypeScript类型定义
- ✅ **灵活配置** - 丰富的配置选项，满足各种场景需求
- ✅ **易于集成** - 与现有UI框架无缝集成
- ✅ **响应式支持** - 完善的响应式布局支持
- ✅ **快捷键支持** - 内置快捷键功能（F11/Esc）
- ✅ **生命周期控制** - 提供完整的生命周期钩子
- ✅ **浏览器原生API** - 支持浏览器原生全屏API
- ✅ **动画效果** - 内置平滑的过渡动画

## 🚀 快速开始

### 安装

模块已集成在项目中，无需额外安装。

### 基础使用

```tsx
import {
  useFullscreen,
  FullscreenButton,
  FullscreenContainer,
} from "@/components/ui/fullscreen";

function MyComponent() {
  const { isFullscreen, toggleFullscreen } = useFullscreen();

  return (
    <FullscreenContainer isFullscreen={isFullscreen}>
      <div className="p-6">
        <div className="flex items-center justify-between">
          <h2>我的组件</h2>
          <FullscreenButton
            isFullscreen={isFullscreen}
            onClick={toggleFullscreen}
          />
        </div>
        <div>内容区域</div>
      </div>
    </FullscreenContainer>
  );
}
```

## 📚 核心API

### useFullscreen Hook

状态管理Hook，提供完整的全屏控制逻辑。

```tsx
const { isFullscreen, toggleFullscreen, enterFullscreen, exitFullscreen } =
  useFullscreen({
    defaultFullscreen: false,
    enableHotkey: true,
    onFullscreenChange: (isFullscreen) => {
      console.log("全屏状态:", isFullscreen);
    },
  });
```

### FullscreenButton 组件

通用的全屏按钮组件。

```tsx
<FullscreenButton
  isFullscreen={isFullscreen}
  onClick={toggleFullscreen}
  showText={true}
  fullscreenTooltip="进入全屏"
  exitFullscreenTooltip="退出全屏"
/>
```

### FullscreenContainer 组件

提供全屏状态下的样式和布局支持。

```tsx
<FullscreenContainer
  isFullscreen={isFullscreen}
  className="rounded-lg bg-white"
  fullscreenClassName="rounded-none"
  enableAnimation={true}
>
  {children}
</FullscreenContainer>
```

### FullscreenWrapper 组件

提供头部、内容、底部的布局结构。

```tsx
<FullscreenWrapper
  isFullscreen={isFullscreen}
  header={<Header />}
  footer={<Footer />}
>
  {content}
</FullscreenWrapper>
```

## 📖 使用场景

### 1. 在Modal中使用

```tsx
<GModal
  title="我的对话框"
  visible={visible}
  onClose={() => setVisible(false)}
  showFullscreen={true}
  enableFullscreenHotkey={true}
>
  <div>对话框内容</div>
</GModal>
```

### 2. 独立的全屏卡片

```tsx
function FullscreenCard() {
  const { isFullscreen, toggleFullscreen } = useFullscreen({
    enableHotkey: true,
  });

  return (
    <FullscreenContainer isFullscreen={isFullscreen}>
      <div className="p-6">
        <FullscreenButton
          isFullscreen={isFullscreen}
          onClick={toggleFullscreen}
        />
        <div>卡片内容</div>
      </div>
    </FullscreenContainer>
  );
}
```

### 3. 浏览器原生全屏

```tsx
function VideoPlayer() {
  const { isFullscreen, toggleFullscreen, elementRef } = useNativeFullscreen();

  return (
    <div ref={elementRef}>
      <video src="video.mp4" />
      <button onClick={toggleFullscreen}>全屏播放</button>
    </div>
  );
}
```

## 🎨 自定义样式

### 响应式设计

```tsx
<FullscreenContainer
  isFullscreen={isFullscreen}
  className="p-4 md:p-6 lg:p-8"
  fullscreenClassName="p-0"
>
  <div
    className={` ${isFullscreen ? "flex h-screen flex-col" : "mx-auto max-w-4xl"} `}
  >
    {content}
  </div>
</FullscreenContainer>
```

### 自定义按钮

```tsx
<FullscreenButton
  isFullscreen={isFullscreen}
  onClick={toggleFullscreen}
  type="primary"
  showText={true}
  fullscreenText="全屏模式"
  exitFullscreenText="退出全屏"
  className="custom-class"
/>
```

## 🔧 高级功能

### 生命周期控制

```tsx
const { isFullscreen, toggleFullscreen } = useFullscreen({
  onBeforeEnter: () => {
    console.log("准备进入全屏");
    return true; // 返回false可阻止
  },
  onBeforeExit: () => {
    console.log("准备退出全屏");
    return true;
  },
  onFullscreenChange: (isFullscreen) => {
    console.log("全屏状态变化:", isFullscreen);
  },
});
```

### 状态持久化

```tsx
const [savedFullscreen, setSavedFullscreen] = useState(() => {
  return localStorage.getItem("fullscreen") === "true";
});

const { isFullscreen } = useFullscreen({
  defaultFullscreen: savedFullscreen,
  onFullscreenChange: (isFullscreen) => {
    localStorage.setItem("fullscreen", String(isFullscreen));
  },
});
```

### 快捷键支持

```tsx
const { isFullscreen, toggleFullscreen } = useFullscreen({
  enableHotkey: true, // 启用F11和Esc快捷键
  hotkey: "F11", // 自定义快捷键
});
```

## 📝 完整示例

查看 `src/components/examples/FullscreenExamples.tsx` 获取完整的使用示例。

## 📄 详细文档

查看 `docs/fullscreen-module.md` 获取详细的API文档和使用指南。

## 🔍 类型定义

所有类型定义都已导出，可以直接导入使用：

```tsx
import type {
  FullscreenOptions,
  FullscreenControls,
  FullscreenButtonProps,
  FullscreenContainerProps,
  FullscreenWrapperProps,
} from "@/components/ui/fullscreen";
```

## ⚠️ 注意事项

1. **快捷键冲突** - 启用快捷键时注意避免与其他组件的快捷键冲突
2. **性能优化** - 在大型应用中，建议使用Context来共享全屏状态
3. **浏览器兼容性** - `useNativeFullscreen` 依赖浏览器原生API，使用前请检查 `isSupported`
4. **移动端适配** - 移动端全屏体验可能与桌面端不同，建议针对性优化
5. **样式冲突** - 全屏时注意处理z-index和定位相关的样式冲突

## 🤝 贡献

欢迎提交Issue和Pull Request来改进这个模块。

## 📜 许可

MIT License

---

**番茄工具箱 (Tomato Tools)** - 让开发更简单
