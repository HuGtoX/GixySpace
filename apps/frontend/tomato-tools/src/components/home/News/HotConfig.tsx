import { FaWeibo, FaZhihu } from "react-icons/fa";
import Image from "next/image";
import { FaCalendar } from "react-icons/fa";

// 定义新闻平台配置类型
interface NewsPlatformConfig {
  id: string;
  title: string;
  color: string;
  bg: string;
  icon: React.ReactNode;
}

// 微博配置
export const weiboConfig: NewsPlatformConfig = {
  id: "weibo",
  title: "微博热搜榜",
  color: "text-weibo",
  bg: "bg-weibo-60",
  icon: <FaWeibo />,
};

// 知乎配置
export const zhihuConfig: NewsPlatformConfig = {
  id: "zhihu",
  title: "知乎热搜榜",
  color: "text-zhihu",
  bg: "bg-zhihu-60",
  icon: <FaZhihu />,
};

// 掘金配置
export const juejinConfig: NewsPlatformConfig = {
  id: "juejin",
  title: "掘金热搜榜",
  color: "text-juejin",
  bg: "bg-juejin-60",
  icon: <Image src="/icon/juejin.svg" alt="掘金" width={20} height={20} />,
};

// 抖音配置
export const douyinConfig: NewsPlatformConfig = {
  id: "douyin",
  title: "抖音热搜榜",
  color: "text-douyin",
  bg: "bg-douyin-60",
  icon: <Image src="/icon/douyin.png" alt="抖音" width={20} height={20} />,
};

// 雪球配置
export const xueqiuConfig: NewsPlatformConfig = {
  id: "xueqiu",
  title: "雪球热搜榜",
  color: "text-xueqiu",
  bg: "bg-xueqiu-60",
  icon: <Image src="/icon/xueqiu.png" alt="雪球" width={20} height={20} />,
};

// 今日头条
export const toutiaoConfig: NewsPlatformConfig = {
  id: "toutiao",
  title: "今日头条热搜榜",
  color: "text-toutiao",
  bg: "bg-toutiao-60",
  icon: <Image src="/icon/toutiao.ico" alt="今日头条" width={20} height={20} />,
};

// 每日新闻配置
export const dailyNewsConfig: NewsPlatformConfig = {
  id: "daily",
  title: "每日世界简报",
  color: "text-blue-500",
  bg: "bg-blue-50",
  icon: <FaCalendar size={20} />,
};

// 所有平台配置列表
export const newsPlatforms = [
  weiboConfig,
  zhihuConfig,
  douyinConfig,
  toutiaoConfig,
  xueqiuConfig,
  juejinConfig,
];
