import Weather from "./Weather";
import QuickLink from "./QuickLink";
import DailySentence from "./DailySentence";
// import MoreTools from "./MoreTools";
import AITools from "./AITools";
import SectionCard from "@/components/ui/SectionCard";

function Aside() {
  return (
    <>
      <Weather />
      <DailySentence />
      <AITools />
      <QuickLink />
      {/* <MoreTools /> */}
      <SectionCard title="最近访问">
        <div className="py-8 text-center text-gray-500 dark:text-gray-400">
          <p>暂无访问记录</p>
        </div>
      </SectionCard>
    </>
  );
}

export default Aside;
