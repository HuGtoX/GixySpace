/**
 * ScrollContainer 组件类型测试
 *
 * 这个文件用于验证 ScrollContainer 组件的 TypeScript 类型定义是否正确
 */

import React, { useRef } from "react";
import ScrollContainer from "./index";

// ✅ 测试 1: 基础用法
function Test1() {
  return (
    <ScrollContainer className="h-[400px]">
      <div>内容</div>
    </ScrollContainer>
  );
}

// ✅ 测试 2: 所有可选属性
function Test2() {
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    console.log(e.currentTarget.scrollTop);
  };

  return (
    <ScrollContainer
      className="h-[400px]"
      scrollbarType="primary"
      alwaysShow={true}
      scrollbarWidth={8}
      style={{ padding: "16px" }}
      onScroll={handleScroll}
    >
      <div>内容</div>
    </ScrollContainer>
  );
}

// ✅ 测试 3: 使用 ref
function Test3() {
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
        <div>内容</div>
      </ScrollContainer>
    </>
  );
}

// ✅ 测试 4: scrollbarType 类型检查
function Test4() {
  return (
    <>
      <ScrollContainer scrollbarType="default" className="h-[400px]">
        <div>默认样式</div>
      </ScrollContainer>
      <ScrollContainer scrollbarType="primary" className="h-[400px]">
        <div>主题色样式</div>
      </ScrollContainer>
      {/* @ts-expect-error - 应该报错：不支持的 scrollbarType */}
      <ScrollContainer scrollbarType="invalid" className="h-[400px]">
        <div>无效样式</div>
      </ScrollContainer>
    </>
  );
}

// ✅ 测试 5: 嵌套使用
function Test5() {
  return (
    <ScrollContainer className="h-[600px]">
      <div>
        <h2>标题</h2>
        <ScrollContainer className="h-[200px]" scrollbarType="primary">
          <div>嵌套的滚动容器</div>
        </ScrollContainer>
      </div>
    </ScrollContainer>
  );
}

// ✅ 测试 6: 与其他组件组合
function Test6() {
  return (
    <div className="rounded-xl bg-white shadow-md dark:bg-gray-800">
      <div className="border-b p-4">
        <h3>标题</h3>
      </div>
      <ScrollContainer className="h-[350px] p-2">
        <ul>
          {Array.from({ length: 20 }, (_, i) => (
            <li key={i}>项目 {i + 1}</li>
          ))}
        </ul>
      </ScrollContainer>
    </div>
  );
}

// 导出所有测试组件
export { Test1, Test2, Test3, Test4, Test5, Test6 };
