import type { NextConfig } from "next";

/**
 * 内存优化
 * https://zh-hans.nextjs.im/docs/app/guides/memory-usage
 */
const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: false,
  experimental: {
    optimizePackageImports: ["antd"],
    // 当 Next.js 服务器启动时，它会将每个页面的 JavaScript 模块预加载到内存中，而不是在请求时加载。
    preloadEntriesOnStart: false,
    // 降低最大内存使用量，但可能会轻微增加编译时间。
    webpackMemoryOptimizations: true,
  },
  transpilePackages: ["antd"],
  // Webpack 缓存将生成的 Webpack 模块保存在内存和/或磁盘上以提高构建速度。
  webpack: (config, { dev }) => {
    if (config.cache && !dev) {
      config.cache = Object.freeze({
        type: "memory",
      });
    }
    // 重要：返回修改后的配置
    return config;
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "https://tomato-tools.netlify.app/api/:path*",
        // destination: "http://127.0.0.1:8888/api/:path*",
      },
    ];
  },
};

export default nextConfig;
