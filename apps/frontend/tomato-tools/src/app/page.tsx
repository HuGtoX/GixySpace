import { Suspense } from "react";
import Header from "@/components/toolsLayout/Header";
import Footer from "@/components/toolsLayout/Footer";
import NewsSection from "@/components/home/Information";
import Tools from "@/components/home/Tools";
import Aside from "@/components/home/Aside";
import Container from "@/components/toolsLayout/Container";
import NewsSkeleton from "@/components/home/Information/Skeleton";

// 骨架屏组件
function ToolsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-8 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
      <div className="grid grid-cols-2 gap-4">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700"
          />
        ))}
      </div>
    </div>
  );
}

function AsideSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className="h-48 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700"
        />
      ))}
    </div>
  );
}

// 主页使用服务端组件 + 流式渲染
export default function HomePage() {
  return (
    <Container>
      <Header />
      <main className="container mx-auto grid grid-cols-1 gap-6 px-4 py-6 pb-24 lg:grid-cols-12">
        <section className="space-y-6 lg:col-span-7 xl:col-span-6">
          <Suspense fallback={<NewsSkeleton />}>
            <NewsSection />
          </Suspense>
        </section>
        <section className="space-y-6 lg:col-span-5 xl:col-span-3">
          <Suspense fallback={<ToolsSkeleton />}>
            <Tools />
          </Suspense>
        </section>
        <aside className="space-y-6 lg:col-span-12 xl:col-span-3">
          <Suspense fallback={<AsideSkeleton />}>
            <Aside />
          </Suspense>
        </aside>
      </main>
      <Footer />
    </Container>
  );
}
