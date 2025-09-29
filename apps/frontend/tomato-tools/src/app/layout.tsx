import type { Metadata } from "next";
import "./globals.css";
import "@ant-design/v5-patch-for-react-19";
import ThemeProvider from "@/contexts/ThemeContext";
import AntdProvider from "@/components/providers/AntdProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import AppProvider from "@/components/providers/AppProvider";
export const metadata: Metadata = {
  title: "番茄工具 - 实用在线工具集合",
  description:
    "番茄工具提供PDF合并、PDF拆分、图片转换、实时编辑渲染等实用在线工具",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="dark">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const savedTheme = localStorage.getItem('isDarkMode');
                  const isDarkMode = savedTheme !== null ? JSON.parse(savedTheme) : true;
                  if (!isDarkMode) {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {
                  // 如果解析失败，保持默认的暗色主题（已经在className中设置）
                }
              })();
            `,
          }}
        />
      </head>
      <body>
        <ThemeProvider>
          <AuthProvider>
            <AntdProvider>
              <AppProvider>{children}</AppProvider>
            </AntdProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
