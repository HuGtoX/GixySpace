"use client";

import { Affix, Button, Dropdown, Avatar, MenuProps, Badge } from "antd";
import {
  FaSun,
  FaMoon,
  FaUser,
  FaCog,
  FaSignOutAlt,
  FaUserPlus,
} from "react-icons/fa";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import NotificationDropdown from "@/components/notifications/NotificationDropdown";

// 顶部导航栏组件
const Header = () => {
  const { isDarkMode, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleMenuClick = async ({ key }: { key: string }) => {
    switch (key) {
      case "upgrade":
        router.push("/auth/login?mode=upgrade");
        break;
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

  // 根据用户类型动态生成菜单
  const userMenu: MenuProps["items"] = [
    user?.isAnonymous && {
      key: "upgrade",
      icon: <FaUserPlus className="mr-2 text-orange-500" />,
      label: (
        <span className="font-semibold text-orange-500">
          升级为正式用户/登录
        </span>
      ),
    },
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
    !user?.isAnonymous && {
      key: "3",
      icon: <FaSignOutAlt className="mr-2" />,
      label: "退出登录",
    },
  ].filter((item) => !!item);

  return (
    <Affix>
      <header className="sticky top-0 z-50 border-b bg-white/20 shadow-sm backdrop-blur-md dark:border-gray-700 dark:bg-gray-800/80">
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-4">
            <div
              className="flex cursor-pointer items-center space-x-3"
              onClick={() => router.push("/")}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg">
                <img
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
              <div className="group flex items-center space-x-3">
                <div className="items-en hidden md:flex">
                  <span className="max-w-[80px] cursor-pointer truncate text-sm font-semibold text-slate-800 transition-colors group-hover:text-primary dark:text-gray-200 dark:group-hover:text-dark-primary">
                    {user.isAnonymous ? user.id : user.fullName || user.email}
                  </span>
                </div>
                <Dropdown
                  menu={{ items: userMenu, onClick: handleMenuClick }}
                  placement="bottomRight"
                  trigger={["click"]}
                >
                  <div className="relative cursor-pointer">
                    {user.isAnonymous ? (
                      <Badge
                        count="临时"
                        offset={[-5, 5]}
                        style={{
                          backgroundColor: "#f97316",
                          fontSize: "10px",
                          height: "18px",
                          lineHeight: "18px",
                        }}
                      >
                        <Avatar
                          size={42}
                          src={user.avatarUrl || "/avatar/a5.png"}
                          className="border-2 border-dashed border-orange-500 transition-all duration-200 hover:scale-105 hover:shadow-lg dark:border-orange-400"
                        />
                      </Badge>
                    ) : (
                      <>
                        <Avatar
                          size={42}
                          src={user.avatarUrl || "/avatar/a5.png"}
                          className="border-2 border-solid border-orange-500 transition-all duration-200 hover:scale-105 hover:shadow-lg dark:border-dark-primary"
                        />
                        <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-green-500 ring-2 ring-white dark:ring-gray-800"></div>
                      </>
                    )}
                  </div>
                </Dropdown>
              </div>
            ) : (
              <div className="group flex items-center space-x-3">
                <div className="hidden flex-col items-end md:flex">
                  <span className="text-xs font-medium text-slate-600 dark:text-gray-400">
                    未登录
                  </span>
                </div>
                <div
                  className="relative cursor-pointer"
                  onClick={() => router.push("/auth/login")}
                >
                  <Avatar
                    size={42}
                    icon={<FaUser />}
                    className="border-2 border-dashed border-slate-200 transition-all duration-200 hover:scale-105 hover:border-primary hover:bg-primary/10 dark:border-gray-600 dark:hover:border-dark-primary dark:hover:bg-dark-primary/10"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </header>
    </Affix>
  );
};

export default Header;
