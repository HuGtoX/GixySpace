import { Config } from '@netlify/edge-functions';
import weiboNews from './src/news/weibo.mts';
import zhihuNews from './src/news/zhihu.mts';
import juejinNews from './src/news/juejin.mts';
import handlerMaker from './utils/handleMaker.mts';
import douyinNews from './src/news/douyin.mts';
import xueqiuNews from './src/news/xueqiu.mts';
import sixtySecondsNews from './src/news/60s.mts';

// 新闻路由映射表
const routes = {
	'/api/news/weibo': weiboNews,
	'/api/news/zhihu': zhihuNews,
	'/api/news/juejin': juejinNews,
	'/api/news/douyin': douyinNews,
	'/api/news/xueqiu': xueqiuNews,
	'/api/news/60s': sixtySecondsNews
};

export default handlerMaker(routes);

export const config: Config = {
	path: '/api/news/*',
	method: ['GET'],
	cache: 'manual'
};
