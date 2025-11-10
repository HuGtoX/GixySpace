import Header from "@/components/toolsLayout/Header";
import Footer from "@/components/toolsLayout/Footer";

export default function ToolsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="font-inter theme-transition min-h-full bg-gray-50 pb-[50px] text-gray-800 dark:bg-gray-900 dark:text-gray-100">
      <Header />
      {/* 桌面端固定高度布局，移动端保持原有滚动 */}
      <main className="container mx-auto px-4 py-6 lg:h-[calc(100vh-120px)] lg:overflow-hidden">
        {children}
      </main>
      <Footer />
    </div>
  );
}
