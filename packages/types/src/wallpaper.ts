export interface Wallpaper {
	/**
	 * 版权方
	 */
	copyright: string;
	/**
	 * 壁纸链接
	 */
	cover: string;
	/**
	 * 壁纸描述
	 */
	description: string;
	/**
	 * 大纲标题
	 */
	headline: string;
	/**
	 * 壁纸长描述
	 */
	main_text: string;
	/**
	 * 标题
	 */
	title: string;
	/**
	 * 更新时间字符串
	 */
	update_date: string;
	/**
	 * 更新时间戳（13 位）
	 */
	update_date_at: number;
	[property: string]: any;
}
