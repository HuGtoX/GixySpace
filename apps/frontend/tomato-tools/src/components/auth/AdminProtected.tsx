"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, Spin, Alert, Button } from "antd";
import { FaHome, FaLock } from "react-icons/fa";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

interface AdminProtectedProps {
  children: React.ReactNode;
}

const AdminProtected = ({ children }: AdminProtectedProps) => {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // 如果用户未登录，跳转到登录页面
    if (!loading && !user) {
      router.push("/auth/login");
    }
  }, [user, loading, router]);

  // 正在加载用户信息
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Card className="w-96 text-center">
          <Spin size="large" />
          <div className="mt-4 text-gray-600 dark:text-gray-300">
            正在验证身份...
          </div>
        </Card>
      </div>
    );
  }

  // 用户未登录
  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Card className="w-96">
          <Alert
            message="需要登录"
            description="请先登录后再访问此页面"
            type="warning"
            showIcon
            icon={<FaLock />}
            className="mb-4"
          />
          <div className="flex justify-center space-x-2">
            <Link href="/auth/login">
              <Button type="primary">去登录</Button>
            </Link>
            <Link href="/">
              <Button icon={<FaHome />}>返回首页</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  // 用户已登录但不是管理员
  if (user.role !== "admin") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Card className="w-96">
          <Alert
            message="权限不足"
            description="只有管理员才能访问此页面"
            type="error"
            showIcon
            icon={<FaLock />}
            className="mb-4"
          />
          <div className="text-center">
            <p className="mb-4 text-gray-600 dark:text-gray-300">
              当前用户角色: <span className="font-semibold">{user.role}</span>
            </p>
            <Link href="/">
              <Button type="primary" icon={<FaHome />}>
                返回首页
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  // 用户是管理员，显示受保护的内容
  return <>{children}</>;
};

export default AdminProtected;
