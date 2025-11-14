"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

interface UserProfile {
  bio?: string;
  website?: string;
  location?: string;
  preferences?: Record<string, unknown>;
}

interface AuthUser {
  id: string;
  email: string;
  emailConfirmed: boolean;
  fullName?: string;
  avatarUrl?: string;
  role: string;
  isActive: boolean;
  isAnonymous?: boolean;
  createdAt: string;
  profile?: UserProfile;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (
    email: string,
    code: string,
    password: string,
    fullName?: string,
  ) => Promise<void>;
  createAnonymousUser: () => Promise<void>;
  convertToRegularUser: (
    email: string,
    password: string,
    fullName?: string,
  ) => Promise<void>;
  bindEmailUpgrade: (
    email: string,
    code: string,
    password: string,
    fullName?: string,
  ) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // 获取当前用户信息
  const fetchUser = async (autoCreateAnonymous: boolean = true) => {
    try {
      const response = await fetch("/api/auth/me", {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        // 如果获取用户失败且允许自动创建匿名用户
        if (autoCreateAnonymous && response.status === 401) {
          console.log("No user found, attempting to create anonymous user");
          try {
            await createAnonymousUser();
            return; // createAnonymousUser 会调用 fetchUser(false)
          } catch (anonymousError) {
            console.error("Failed to create anonymous user:", anonymousError);
            setUser(null);
          }
        } else {
          setUser(null);
        }
      }
    } catch (error) {
      console.error("Failed to fetch user:", error);

      // 网络错误时也尝试创建匿名用户
      if (autoCreateAnonymous) {
        try {
          await createAnonymousUser();
          return;
        } catch (anonymousError) {
          console.error("Failed to create anonymous user:", anonymousError);
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  };

  // 登录
  const login = async (email: string, password: string) => {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
      credentials: "include",
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Login failed");
    }

    // 重新获取用户信息
    await fetchUser();
  };

  // 注册
  const register = async (
    email: string,
    code: string,
    password: string,
    fullName?: string,
  ) => {
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, code, password, fullName }),
      credentials: "include",
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Registration failed");
    }

    // 注册成功后不自动登录，需要用户手动登录
  };

  // 登出
  const logout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setUser(null);
    }
  };

  // 创建匿名用户
  const createAnonymousUser = async () => {
    const response = await fetch("/api/auth/anonymous", {
      method: "POST",
      credentials: "include",
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to create anonymous user");
    }

    // 重新获取用户信息，但不再自动创建匿名用户（避免无限循环）
    await fetchUser(false);
  };

  // 转换为正式用户（注册绑定）
  const convertToRegularUser = async (
    email: string,
    password: string,
    fullName?: string,
  ) => {
    const response = await fetch("/api/auth/convert", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password, fullName }),
      credentials: "include",
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Conversion failed");
    }

    // 重新获取用户信息
    await fetchUser(false);
  };

  // 绑定邮箱升级（验证码方式）
  const bindEmailUpgrade = async (
    email: string,
    code: string,
    password: string,
    fullName?: string,
  ) => {
    const response = await fetch("/api/auth/bind-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, code, password, fullName }),
      credentials: "include",
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Bind email failed");
    }

    // 重新获取用户信息
    await fetchUser(false);
  };

  // 刷新用户信息
  const refreshUser = async () => {
    await fetchUser(false);
  };

  // 初始化时获取用户信息
  useEffect(() => {
    fetchUser();
  }, []);

  const value = {
    user,
    loading,
    login,
    logout,
    register,
    createAnonymousUser,
    convertToRegularUser,
    bindEmailUpgrade,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
