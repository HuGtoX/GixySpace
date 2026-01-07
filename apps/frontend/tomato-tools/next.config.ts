import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

/**
 * 内存优化
 * https://zh-hans.nextjs.im/docs/app/guides/memory-usage
 */
const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: false,
  // Docker 部署配置：生成独立的输出目录
  output: "standalone",
  // 将 pino 相关包标记为外部包，避免打包问题（Next.js 16 要求放在顶层）
  serverExternalPackages: [
    "pino",
    "pino-pretty",
    "thread-stream",
    "pino-abstract-transport",
    "sonic-boom",
    "atomic-sleep",
  ],
  // 图片优化配置
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  experimental: {
    optimizePackageImports: ["antd"],
    // 当 Next.js 服务器启动时,它会将每个页面的 JavaScript 模块预加载到内存中，而不是在请求时加载。
    preloadEntriesOnStart: false,
    // 降低最大内存使用量，但可能会轻微增加编译时间。
    webpackMemoryOptimizations: true,
  },
  transpilePackages: ["antd"],
  // Webpack 缓存将生成的 Webpack 模块保存在内存和/或磁盘上以提高构建速度。
  webpack: (config, { dev, isServer, webpack }) => {
    if (config.cache && !dev) {
      config.cache = Object.freeze({
        type: "memory",
      });
    }

    // 解决 pino 日志库在 Next.js 16 中的打包问题
    // pino 使用的 thread-stream 等模块是 Node.js 专用的，需要忽略测试文件和开发依赖
    if (isServer) {
      // 忽略 thread-stream 的测试文件和 bench 文件
      config.plugins = config.plugins || [];
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /^(tap|fastbench|pino-elasticsearch|desm)$/,
        }),
        new webpack.IgnorePlugin({
          resourceRegExp: /\/test\//,
          contextRegExp: /thread-stream/,
        }),
        new webpack.IgnorePlugin({
          resourceRegExp: /bench\.js$/,
          contextRegExp: /thread-stream/,
        }),
      );
    }

    // 重要：返回修改后的配置
    return config;
  },
  async rewrites() {
    return [
      // yiyan API已迁移到Next.js内部路由 /api/yiyan/get
      // 保留v2路径的rewrite以兼容其他可能的FAAS API
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
