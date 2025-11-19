#!/usr/bin/env node

/**
 * 本地测试脚本 - 每日一言定时任务
 * 用于在本地环境测试定时任务的执行情况
 */

// 加载环境变量
import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 加载 .env.local 文件
config({ path: join(__dirname, "..", ".env.local") });

import { spawn } from "child_process";

// 颜色输出
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function printHeader(title) {
  log("\n" + "=".repeat(60), "cyan");
  log(title, "bright");
  log("=".repeat(60), "cyan");
}

function printSection(title) {
  log(`\n${title}`, "blue");
  log("-".repeat(60), "blue");
}

async function testApiConnection() {
  printSection("1. 测试每日一言API连接");

  try {
    const response = await fetch("https://international.v1.hitokoto.cn?c=k");

    if (!response.ok) {
      throw new Error(`HTTP错误: ${response.status}`);
    }

    const data = await response.json();
    log("✓ API连接成功", "green");
    log(`  示例内容: "${data.hitokoto.substring(0, 50)}..."`, "cyan");
    log(`  来源: ${data.from}`, "cyan");
    return true;
  } catch (error) {
    log("✗ API连接失败", "red");
    log(`  错误: ${error.message}`, "red");
    return false;
  }
}

function checkEnvironment() {
  printSection("2. 检查环境变量");

  const requiredEnvs = ["DATABASE_URL"];
  let allPresent = true;

  for (const env of requiredEnvs) {
    if (process.env[env]) {
      log(`✓ ${env} 已设置`, "green");
      // 显示部分值用于验证（隐藏敏感信息）
      const value = process.env[env];
      const maskedValue =
        value.substring(0, 20) + "..." + value.substring(value.length - 10);
      log(`  值: ${maskedValue}`, "cyan");
    } else {
      log(`✗ ${env} 未设置`, "red");
      allPresent = false;
    }
  }

  return allPresent;
}

function checkScriptFile() {
  printSection("3. 检查脚本文件");

  const scriptPath = join(__dirname, "fetch-daily-sentence.ts");

  try {
    if (fs.existsSync(scriptPath)) {
      log("✓ 脚本文件存在", "green");
      log(`  路径: ${scriptPath}`, "cyan");
      return true;
    } else {
      log("✗ 脚本文件不存在", "red");
      return false;
    }
  } catch (error) {
    log("✗ 检查脚本文件失败", "red");
    log(`  错误: ${error.message}`, "red");
    return false;
  }
}

function runTask() {
  return new Promise((resolve, reject) => {
    printSection("4. 运行定时任务");

    log("启动任务...", "yellow");

    // 使用 pnpm 运行脚本，这样可以使用项目本地安装的 tsx
    const child = spawn("pnpm", ["run", "script:fetch-daily-sentence"], {
      stdio: "inherit",
      env: process.env,
      shell: true, // 在 Windows 上需要 shell
    });

    child.on("close", (code) => {
      if (code === 0) {
        log("\n✓ 任务执行成功", "green");
        resolve(true);
      } else {
        log(`\n✗ 任务执行失败，退出码: ${code}`, "red");
        resolve(false);
      }
    });

    child.on("error", (error) => {
      log("\n✗ 任务执行出错", "red");
      log(`  错误: ${error.message}`, "red");
      log("  提示: 请确保已安装 pnpm 包管理器", "yellow");
      reject(error);
    });
  });
}

async function main() {
  printHeader("每日一言定时任务 - 本地测试");

  log(
    `测试时间: ${new Date().toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" })}`,
    "cyan",
  );

  // 1. 测试API连接
  const apiOk = await testApiConnection();
  if (!apiOk) {
    log("\n⚠️  API连接失败，但继续测试...", "yellow");
  }

  // 2. 检查环境变量
  const envOk = checkEnvironment();
  if (!envOk) {
    log("\n❌ 环境变量检查失败，请设置必要的环境变量", "red");
    log("提示: 请确保 .env 文件存在并包含 DATABASE_URL", "yellow");
    process.exit(1);
  }

  // 3. 检查脚本文件
  const scriptOk = checkScriptFile();
  if (!scriptOk) {
    log("\n❌ 脚本文件检查失败", "red");
    process.exit(1);
  }

  // 4. 运行任务
  try {
    const taskOk = await runTask();

    // 5. 生成测试报告
    printSection("5. 测试报告");

    if (taskOk) {
      log("✓ 所有测试通过", "green");
      log("\n建议:", "yellow");
      log("  1. 检查数据库确认数据是否正确写入", "cyan");
      log("  2. 验证数据内容是否符合预期", "cyan");
      log("  3. 确认没有重复数据", "cyan");
    } else {
      log("✗ 测试失败", "red");
      log("\n请检查上述错误信息并修复问题", "yellow");
      process.exit(1);
    }
  } catch (error) {
    log("\n❌ 测试执行异常", "red");
    log(`错误: ${error.message}`, "red");
    process.exit(1);
  }

  printHeader("测试完成");
}

// 执行测试
main().catch((error) => {
  console.error("测试脚本执行失败:", error);
  process.exit(1);
});
