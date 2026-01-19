/**
 * 上下文记忆管理器测试示例
 * 演示如何使用ContextMemoryManager的各种功能
 */

import { createContextMemoryManager } from "@/lib/cache/context";
import type { ChatMessage } from "@/types/ai-chat";

// 模拟测试数据
const mockMessages: ChatMessage[] = [
  {
    id: "1",
    role: "user",
    content: "你好，我想学习React Hooks",
    timestamp: new Date("2025-01-01T10:00:00"),
  },
  {
    id: "2",
    role: "assistant",
    content:
      "你好！React Hooks是React 16.8引入的新特性，它让你在不编写class的情况下使用state和其他React特性。主要的Hooks包括useState、useEffect、useContext等。你想了解哪个Hooks？",
    timestamp: new Date("2025-01-01T10:00:05"),
  },
  {
    id: "3",
    role: "user",
    content: "请详细介绍useState的用法",
    timestamp: new Date("2025-01-01T10:01:00"),
  },
  {
    id: "4",
    role: "assistant",
    content:
      "useState是最常用的Hook之一。它的基本语法是：const [state, setState] = useState(initialValue)。useState返回一个数组，第一个元素是当前状态值，第二个元素是更新状态的函数。例如：const [count, setCount] = useState(0);",
    timestamp: new Date("2025-01-01T10:01:10"),
  },
  {
    id: "5",
    role: "user",
    content: "那useEffect呢？它和useState有什么区别？",
    timestamp: new Date("2025-01-01T10:02:00"),
  },
  {
    id: "6",
    role: "assistant",
    content:
      "useEffect用于处理副作用，比如数据获取、订阅、手动修改DOM等。它在组件渲染后执行。与useState的区别是：useState管理组件状态，useEffect处理副作用。useEffect的语法是：useEffect(() => { /* 副作用代码 */ }, [依赖项])。",
    timestamp: new Date("2025-01-01T10:02:15"),
  },
];

/**
 * 测试1: 基础功能测试
 */
export function testBasicFunctionality() {
  console.log("=== 测试1: 基础功能 ===\n");

  const manager = createContextMemoryManager({
    maxMessages: 4,
    maxTokens: 500,
  });

  // 获取统计信息
  const stats = manager.getMemoryStats(mockMessages);
  console.log("记忆统计:");
  console.log(`  总消息数: ${stats.totalMessages}`);
  console.log(`  用户消息: ${stats.userMessages}`);
  console.log(`  助手消息: ${stats.assistantMessages}`);
  console.log(`  估算Token: ${stats.estimatedTokens}`);
  console.log(
    `  时间范围: ${stats.earliestMessageTime?.toLocaleString()} - ${stats.latestMessageTime?.toLocaleString()}`,
  );
  console.log();

  // 优化上下文
  const optimized = manager.optimizeContext(mockMessages);
  console.log(
    `优化后消息数: ${optimized.length} (原始: ${mockMessages.length})`,
  );
  console.log("优化后的消息:");
  optimized.forEach((msg, idx) => {
    console.log(
      `  ${idx + 1}. [${msg.role}] ${msg.content.substring(0, 30)}...`,
    );
  });
  console.log();
}

/**
 * 测试2: 上下文构建测试
 */
export function testContextBuilding() {
  console.log("=== 测试2: 上下文构建 ===\n");

  const manager = createContextMemoryManager({
    maxMessages: 10,
    maxTokens: 2000,
  });

  const contextHistory = manager.buildContextHistory(mockMessages);
  console.log(`构建的上下文历史消息数: ${contextHistory.length}`);
  console.log("上下文历史:");
  contextHistory.forEach((msg, idx) => {
    console.log(
      `  ${idx + 1}. [${msg.role}] ${msg.content.substring(0, 40)}...`,
    );
  });
  console.log();
}

/**
 * 测试3: 关键词提取测试
 */
export function testKeywordExtraction() {
  console.log("=== 测试3: 关键词提取 ===\n");

  const manager = createContextMemoryManager();

  const testTexts = [
    "如何在React中实现用户认证和登录功能？",
    "我想了解TypeScript的类型系统和泛型的使用方法",
    "Next.js的服务端渲染和静态生成有什么区别？",
  ];

  testTexts.forEach((text, idx) => {
    const keywords = manager.extractKeywords(text, 5);
    console.log(`文本${idx + 1}: ${text}`);
    console.log(`关键词: ${keywords.join(", ")}`);
    console.log();
  });
}

/**
 * 测试4: 相关记忆搜索测试
 */
export function testMemorySearch() {
  console.log("=== 测试4: 相关记忆搜索 ===\n");

  const manager = createContextMemoryManager();

  const searchKeywords = ["useState", "Hook"];
  console.log(`搜索关键词: ${searchKeywords.join(", ")}`);

  const relevantMessages = manager.searchRelevantMemories(
    mockMessages,
    searchKeywords,
    3,
  );

  console.log(`找到 ${relevantMessages.length} 条相关消息:`);
  relevantMessages.forEach((msg, idx) => {
    console.log(
      `  ${idx + 1}. [${msg.role}] ${msg.content.substring(0, 50)}...`,
    );
  });
  console.log();
}

/**
 * 测试5: 对话摘要生成测试
 */
export function testSummaryGeneration() {
  console.log("=== 测试5: 对话摘要生成 ===\n");

  const manager = createContextMemoryManager({
    enableSummary: true,
  });

  const summary = manager.generateSummary(mockMessages);
  console.log("对话摘要:");
  console.log(summary);
  console.log();
}

/**
 * 测试6: Token限制测试
 */
export function testTokenLimits() {
  console.log("=== 测试6: Token限制测试 ===\n");

  const limits = [500, 1000, 2000, 4000];

  limits.forEach((limit) => {
    const manager = createContextMemoryManager({
      maxMessages: 100, // 设置很大，主要测试token限制
      maxTokens: limit,
    });

    const optimized = manager.optimizeContext(mockMessages);
    const stats = manager.getMemoryStats(optimized);

    console.log(`Token限制: ${limit}`);
    console.log(`  保留消息数: ${optimized.length}`);
    console.log(`  实际Token数: ${stats.estimatedTokens}`);
    console.log();
  });
}

/**
 * 测试7: 配置更新测试
 */
export function testConfigUpdate() {
  console.log("=== 测试7: 配置更新测试 ===\n");

  const manager = createContextMemoryManager({
    maxMessages: 10,
    maxTokens: 1000,
  });

  console.log("初始配置:", manager.getConfig());

  // 更新配置
  manager.updateConfig({
    maxMessages: 20,
    maxTokens: 2000,
  });

  console.log("更新后配置:", manager.getConfig());
  console.log();
}

/**
 * 测试8: 性能测试
 */
export function testPerformance() {
  console.log("=== 测试8: 性能测试 ===\n");

  const manager = createContextMemoryManager();

  // 生成大量测试数据
  const largeMessageSet: ChatMessage[] = [];
  for (let i = 0; i < 100; i++) {
    largeMessageSet.push({
      id: `${i}`,
      role: i % 2 === 0 ? "user" : "assistant",
      content: `这是第${i}条测试消息，包含一些测试内容用于性能测试。`.repeat(5),
      timestamp: new Date(),
    });
  }

  // 测试优化性能
  const start1 = performance.now();
  const optimized = manager.optimizeContext(largeMessageSet);
  const end1 = performance.now();
  console.log(`优化100条消息耗时: ${(end1 - start1).toFixed(2)}ms`);
  console.log(`优化后消息数: ${optimized.length}`);

  // 测试统计性能
  const start2 = performance.now();
  const stats = manager.getMemoryStats(largeMessageSet);
  const end2 = performance.now();
  console.log(`统计100条消息耗时: ${(end2 - start2).toFixed(2)}ms`);
  console.log(`估算Token数: ${stats.estimatedTokens}`);

  // 测试搜索性能
  const start3 = performance.now();
  const results = manager.searchRelevantMemories(
    largeMessageSet,
    ["测试", "消息"],
    10,
  );
  const end3 = performance.now();
  console.log(`搜索100条消息耗时: ${(end3 - start3).toFixed(2)}ms`);
  console.log(`找到相关消息: ${results.length}条`);
  console.log();
}

/**
 * 运行所有测试
 */
export function runAllTests() {
  console.log("========================================");
  console.log("  上下文记忆管理器测试套件");
  console.log("========================================\n");

  try {
    testBasicFunctionality();
    testContextBuilding();
    testKeywordExtraction();
    testMemorySearch();
    testSummaryGeneration();
    testTokenLimits();
    testConfigUpdate();
    testPerformance();

    console.log("========================================");
    console.log("  所有测试完成！");
    console.log("========================================");
  } catch (error) {
    console.error("测试失败:", error);
  }
}

// 如果直接运行此文件，执行所有测试
if (typeof window === "undefined") {
  // Node.js环境
  runAllTests();
}
