import {withSentryConfig} from "@sentry/nextjs";
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
        source: "/api/v2/:path*",
        destination: "https://tomato-tools.netlify.app/api/:path*",
        // destination: "http://127.0.0.1:8888/api/:path*",
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
 // For all available options, see:
 // https://www.npmjs.com/package/@sentry/webpack-plugin#options

 org: "szpt",

 project: "javascript-nextjs",

 // Only print logs for uploading source maps in CI
 silent: !process.env.CI,

 // For all available options, see:
 // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

 // Upload a larger set of source maps for prettier stack traces (increases build time)
 widenClientFileUpload: true,

 // Uncomment to route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
 // This can increase your server load as well as your hosting bill.
 // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
 // side errors will fail.
 // tunnelRoute: "/monitoring",

 // Automatically tree-shake Sentry logger statements to reduce bundle size
 disableLogger: true,

 // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
 // See the following for more information:
 // https://docs.sentry.io/product/crons/
 // https://vercel.com/docs/cron-jobs
 automaticVercelMonitors: true,
});