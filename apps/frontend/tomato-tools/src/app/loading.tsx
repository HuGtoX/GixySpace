"use client";

import { motion } from "framer-motion";
import { useTheme } from "@/contexts/ThemeContext";
import Header from "@/components/toolsLayout/Header";
import Footer from "@/components/toolsLayout/Footer";
import Container from "@/components/toolsLayout/Container";

export default function Loading() {
  const { isDarkMode } = useTheme();

  return (
    <Container>
      <Header />

      <div className="sticky top-[64px] z-40 border-b border-gray-200 bg-white shadow-sm transition-colors duration-300 dark:border-gray-700 dark:bg-gray-800">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: "100%" }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut",
          }}
          className={`h-1 ${isDarkMode ? "bg-dark-primary" : "bg-primary"}`}
        />
        <div className="flex items-center justify-center py-3">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="font-medium text-gray-700 dark:text-gray-300"
          >
            加载中...
          </motion.p>
        </div>
      </div>

      <Footer />
    </Container>
  );
}
