"use client";

import { motion } from "framer-motion";
import { useTheme } from "@/contexts/ThemeContext";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Container from "@/components/layout/Container";
import { Button } from "antd";
import Link from "next/link";
import { HomeOutlined, ArrowLeftOutlined } from "@ant-design/icons";

export default function NotFound() {
  const { isDarkMode } = useTheme();

  return (
    <Container>
      <Header />

      <main className="container mx-auto px-4 py-12 pb-24">
        <div className="flex min-h-[60vh] items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            {/* 404图标 */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                delay: 0.2,
                type: "spring",
                stiffness: 200,
                damping: 10,
              }}
              className="mb-8"
            >
              <div className="relative mx-auto mb-6 flex h-48 w-48 items-center justify-center">
                {/* 背景圆圈动画 */}
                <motion.div
                  animate={{
                    scale: [1, 1.1, 1],
                    opacity: [0.3, 0.5, 0.3],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className={`absolute inset-0 rounded-full ${
                    isDarkMode
                      ? "bg-gradient-to-br from-red-500/20 to-orange-500/20"
                      : "bg-gradient-to-br from-red-100 to-orange-100"
                  }`}
                />

                {/* 404文字 */}
                <div className="relative">
                  <h1
                    className={`text-8xl font-bold ${
                      isDarkMode
                        ? "bg-gradient-to-r from-red-400 to-orange-400"
                        : "bg-gradient-to-r from-red-500 to-orange-500"
                    } bg-clip-text text-transparent`}
                  >
                    404
                  </h1>
                </div>
              </div>

              {/* 番茄图标 */}
              <motion.div
                animate={{
                  rotate: [0, 10, -10, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="text-6xl"
              >
                🍅
              </motion.div>
            </motion.div>

            {/* 文字说明 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="mb-8"
            >
              <h2 className="mb-3 text-2xl font-bold text-gray-900 dark:text-white">
                页面走丢了
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                抱歉，您访问的页面不存在或已被移除
              </p>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-500">
                请检查URL是否正确，或返回首页继续浏览
              </p>
            </motion.div>

            {/* 操作按钮 */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="flex flex-col items-center justify-center gap-3 sm:flex-row"
            >
              <Link href="/">
                <Button
                  type="primary"
                  size="large"
                  icon={<HomeOutlined />}
                  className="min-w-[140px]"
                >
                  返回首页
                </Button>
              </Link>

              <Button
                size="large"
                icon={<ArrowLeftOutlined />}
                onClick={() => window.history.back()}
                className="min-w-[140px]"
              >
                返回上一页
              </Button>
            </motion.div>

            {/* 装饰性元素 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.5 }}
              className="mt-12 flex items-center justify-center gap-8 text-sm text-gray-400 dark:text-gray-600"
            >
              <div className="flex items-center gap-2">
                <span>💡</span>
                <span>实用工具</span>
              </div>
              <div className="flex items-center gap-2">
                <span>🚀</span>
                <span>快速便捷</span>
              </div>
              <div className="flex items-center gap-2">
                <span>🎯</span>
                <span>精准高效</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </main>

      <Footer />
    </Container>
  );
}
