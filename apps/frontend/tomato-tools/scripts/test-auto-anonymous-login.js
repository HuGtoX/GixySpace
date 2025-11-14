#!/usr/bin/env node

/**
 * 自动匿名登录功能测试脚本
 *
 * 使用方法：
 * node scripts/test-auto-anonymous-login.js
 */

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

console.log("🧪 开始测试自动匿名登录功能...\n");

async function testAutoAnonymousLogin() {
  try {
    console.log("📝 测试 1: 无认证状态下访问 /api/auth/me");
    console.log(`   请求: GET ${BASE_URL}/api/auth/me`);

    const response = await fetch(`${BASE_URL}/api/auth/me`, {
      credentials: "include",
    });

    console.log(`   响应状态: ${response.status}`);

    if (response.ok) {
      const data = await response.json();
      console.log("   ✅ 成功获取用户信息");
      console.log(`   用户ID: ${data.user.id}`);
      console.log(`   是否匿名: ${data.user.isAnonymous}`);
      console.log(`   邮箱: ${data.user.email}`);
      console.log(`   角色: ${data.user.role}`);

      if (data.user.isAnonymous) {
        console.log("\n   ✅ 自动匿名登录成功！");
        return { success: true, userId: data.user.id };
      } else {
        console.log("\n   ⚠️  用户不是匿名用户（可能已有登录状态）");
        return { success: true, userId: data.user.id, isExisting: true };
      }
    } else {
      const error = await response.json();
      console.log(`   ❌ 请求失败: ${error.error}`);
      return { success: false, error: error.error };
    }
  } catch (error) {
    console.log(`   ❌ 测试失败: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function testManualAnonymousCreation() {
  try {
    console.log("\n📝 测试 2: 手动创建匿名用户");
    console.log(`   请求: POST ${BASE_URL}/api/auth/anonymous`);

    const response = await fetch(`${BASE_URL}/api/auth/anonymous`, {
      method: "POST",
      credentials: "include",
    });

    console.log(`   响应状态: ${response.status}`);

    if (response.ok) {
      const data = await response.json();
      console.log("   ✅ 匿名用户创建成功");
      console.log(`   用户ID: ${data.user.id}`);
      console.log(`   是否匿名: ${data.user.isAnonymous}`);
      return { success: true, userId: data.user.id };
    } else {
      const error = await response.json();
      console.log(`   ❌ 创建失败: ${error.error}`);
      return { success: false, error: error.error };
    }
  } catch (error) {
    console.log(`   ❌ 测试失败: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log("=".repeat(60));
  console.log("自动匿名登录功能测试");
  console.log("=".repeat(60));
  console.log(`测试环境: ${BASE_URL}\n`);

  // 测试 1: 自动匿名登录
  const test1Result = await testAutoAnonymousLogin();

  // 测试 2: 手动创建匿名用户
  const test2Result = await testManualAnonymousCreation();

  // 总结
  console.log("\n" + "=".repeat(60));
  console.log("测试总结");
  console.log("=".repeat(60));

  const results = [
    { name: "自动匿名登录", result: test1Result },
    { name: "手动创建匿名用户", result: test2Result },
  ];

  results.forEach(({ name, result }) => {
    const status = result.success ? "✅ 通过" : "❌ 失败";
    console.log(`${status} - ${name}`);
    if (!result.success && result.error) {
      console.log(`   错误: ${result.error}`);
    }
  });

  const allPassed = results.every((r) => r.result.success);

  console.log("\n" + "=".repeat(60));
  if (allPassed) {
    console.log("🎉 所有测试通过！");
  } else {
    console.log("⚠️  部分测试失败，请检查配置和日志");
  }
  console.log("=".repeat(60));

  return allPassed;
}

// 运行测试
runTests()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error("测试执行出错:", error);
    process.exit(1);
  });
