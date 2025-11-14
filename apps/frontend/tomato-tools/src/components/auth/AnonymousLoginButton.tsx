"use client";

import { useAuth } from "@/contexts/AuthContext";
import { Button, message } from "antd";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface AnonymousLoginButtonProps {
  className?: string;
  size?: "small" | "middle" | "large";
}

export default function AnonymousLoginButton({
  className = "",
  size = "large",
}: AnonymousLoginButtonProps) {
  const { createAnonymousUser, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // 如果已登录，不显示按钮
  if (user) {
    return null;
  }

  const handleClick = async () => {
    setLoading(true);
    try {
      await createAnonymousUser();
      message.success("欢迎使用！已为您创建临时账号");
      router.push("/dashboard");
    } catch (error) {
      message.error(
        error instanceof Error ? error.message : "创建临时账号失败",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      type="primary"
      size={size}
      loading={loading}
      onClick={handleClick}
      className={className}
    >
      立即体验
    </Button>
  );
}
