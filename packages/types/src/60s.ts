/**
 * 响应数据
 */
export interface SixtySecondsData {
	/**
	 * API 更新时间字符串
	 */
	api_updated: string;
	/**
	 * API 更新时间戳（13 位）
	 */
	api_updated_at: number;
	audio: Audio;
	/**
	 * 封面图 URL
	 */
	cover: string;
	created: string;
	created_at: number;
	/**
	 * 返回的数据所属日期
	 */
	date: string;
	/**
	 * 原文链接
	 */
	link: string;
	/**
	 * 新闻列表
	 */
	news: string[];
	/**
	 * 微语
	 */
	tip: string;
	/**
	 * 更新时间字符串
	 */
	updated: string;
	/**
	 * 更新时间戳（13 位）
	 */
	updated_at: number;
	[property: string]: any;
}

export interface Audio {
	music: string;
	news: string;
	[property: string]: any;
}

export interface HistoryTodayData {
	/**
	 * 日期（几月几号）
	 */
	date: string;
	/**
	 * 日
	 */
	day: number;
	/**
	 * 事件列表
	 */
	items: Item[];
	/**
	 * 月份
	 */
	month: number;
	[property: string]: any;
}

interface Item {
	/**
	 * 事件描述
	 */
	description: string;
	/**
	 * 事件类型，death/event/birth
	 */
	event_type: string;
	/**
	 * 百科详情链接
	 */
	link: string;
	/**
	 * 标题
	 */
	title: string;
	/**
	 * 年份
	 */
	year: string;
	[property: string]: any;
}
