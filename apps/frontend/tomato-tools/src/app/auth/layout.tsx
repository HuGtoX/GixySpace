import Link from "next/link";
import { HomeOutlined } from "@ant-design/icons";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 transition-colors duration-200 dark:bg-gray-900 sm:px-6 lg:px-8">
      {/* 返回首页导航标识 */}
      <div className="absolute left-4 top-4 sm:left-6 sm:top-6">
        <Link
          href="/"
          className="group flex items-center space-x-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-all duration-200 hover:bg-gray-100 hover:text-orange-600 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-orange-400"
        >
          <HomeOutlined className="text-base transition-transform duration-200 group-hover:scale-110" />
          <span className="hidden sm:inline">返回首页</span>
        </Link>
      </div>

      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="mb-2 text-3xl font-bold text-gray-900 transition-colors duration-200 dark:text-gray-100">
            番茄工具箱
          </h1>
          <p className="text-gray-600 transition-colors duration-200 dark:text-gray-400">
            您的专属工具集合
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
