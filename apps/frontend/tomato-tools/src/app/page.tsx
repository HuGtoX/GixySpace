"use client";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import NewsSection from "@/components/home/News";
import Tools from "@/components/home/Tools";
import Aside from "@/components/home/Aside";
import Container from "@/components/layout/Container";

const HomePage = () => {
  return (
    <Container>
      <Header />
      <main className="container mx-auto grid grid-cols-1 gap-6 px-4 py-6 pb-24 lg:grid-cols-12">
        <section className="space-y-6 lg:col-span-7">
          <NewsSection />
        </section>
        <section className="space-y-6 lg:col-span-5 xl:col-span-3">
          <Tools />
        </section>
        <aside className="space-y-6 lg:col-span-12 xl:col-span-2">
          <Aside />
        </aside>
      </main>
      <Footer />
    </Container>
  );
};

export default HomePage;
