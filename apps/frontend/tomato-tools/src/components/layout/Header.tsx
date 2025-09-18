"use client";

import React from "react";
import { Affix, Input, Button, Dropdown, Avatar, MenuProps } from "antd";
import { FaSun, FaMoon, FaUser, FaCog, FaSignOutAlt } from "react-icons/fa";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import Image from "next/image";
import NotificationDropdown from "@/components/notifications/NotificationDropdown";

const { Search } = Input;

// 顶部导航栏组件
const Header = () => {
  const { isDarkMode, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleMenuClick = async ({ key }: { key: string }) => {
    switch (key) {
      case "1":
        router.push("/profile");
        break;
      case "2":
        router.push("/settings");
        break;
      case "3":
        try {
          await logout();
          router.push("/auth/login");
        } catch (error) {
          console.error("Logout failed:", error);
        }
        break;
    }
  };

  const userMenu: MenuProps["items"] = [
    {
      key: "1",
      icon: <FaUser className="mr-2" />,
      label: "个人资料",
    },
    {
      key: "2",
      icon: <FaCog className="mr-2" />,
      label: "设置",
    },
    {
      key: "3",
      icon: <FaSignOutAlt className="mr-2" />,
      label: "退出登录",
    },
  ];

  return (
    <Affix>
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 shadow-sm backdrop-blur-md dark:border-gray-700 dark:bg-gray-800/80">
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-4">
            <div
              className="flex cursor-pointer items-center space-x-3"
              onClick={() => router.push("/")}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg">
                <Image
                  src="/tomato.svg"
                  alt="tomato logo"
                  width={40}
                  height={40}
                  title="tomato logo"
                />
              </div>
              <div className="text-2xl font-bold text-primary dark:text-dark-primary">
                番茄工具
              </div>
            </div>

            <div className="mx-8 hidden max-w-xl flex-1 items-center md:flex">
              <Search className="w-full" placeholder="搜索工具或资讯..." />
            </div>
          </div>
          <div className="flex items-center space-x-6">
            <Button
              shape="circle"
              icon={
                isDarkMode ? (
                  <FaMoon className="text-blue-300" />
                ) : (
                  <FaSun className="text-yellow-500" />
                )
              }
              onClick={toggleTheme}
              className="transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
            />
            <NotificationDropdown />
            {user ? (
              <div className="flex items-center space-x-3">
                <span className="hidden text-sm font-medium text-gray-700 dark:text-gray-300 md:block">
                  {user.fullName || user.email}
                </span>
                <Dropdown
                  menu={{ items: userMenu, onClick: handleMenuClick }}
                  placement="bottomRight"
                >
                  <Avatar
                    size={38}
                    src={user.avatarUrl || "/avatar/a5.png"}
                    className="border-1 cursor-pointer border-solid border-orange-500 dark:border-dark-primary"
                  />
                </Dropdown>
              </div>
            ) : (
              <div
                className="flex cursor-pointer items-center space-x-3"
                onClick={() => router.push("/auth/login")}
              >
                <span className="hidden text-sm text-gray-500 dark:text-gray-400 md:block">
                  游客
                </span>
                <Avatar
                  size={38}
                  icon={<FaUser />}
                  className="border-1 cursor-pointer border-solid border-gray-300 dark:border-gray-600"
                  onClick={() => router.push("/auth/login")}
                />
              </div>
            )}
          </div>
        </div>
      </header>
    </Affix>
  );
};

export default Header;
