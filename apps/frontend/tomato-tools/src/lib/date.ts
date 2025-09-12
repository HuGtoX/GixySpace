import dayjs from "dayjs";
import weekOfYear from "dayjs/plugin/weekOfYear";
import isLeapYear from "dayjs/plugin/isLeapYear";
import "dayjs/locale/zh-cn";

// 扩展dayjs功能
dayjs.extend(weekOfYear);
dayjs.extend(isLeapYear);
dayjs.locale("zh-cn");

export type DateRangeType = "day" | "week" | "month";

export interface DateRange {
  start: string;
  end: string;
  label: string;
}

/**
 * 根据日期类型生成日期范围
 * @param type 日期类型：today-本日，thisWeek-本周，thisMonth-本月
 * @returns 日期范围对象
 */
export function generateDateRange(type: DateRangeType): DateRange {
  const now = dayjs();

  switch (type) {
    case "day":
      return {
        start: now.startOf("day").format("YYYY-MM-DD"),
        end: now.endOf("day").format("YYYY-MM-DD"),
        label: "本日",
      };

    case "week":
      return {
        start: now.startOf("week").format("YYYY-MM-DD"),
        end: now.endOf("week").format("YYYY-MM-DD"),
        label: "本周",
      };

    case "month":
      return {
        start: now.startOf("month").format("YYYY-MM-DD"),
        end: now.endOf("month").format("YYYY-MM-DD"),
        label: "本月",
      };

    default:
      return {
        start: now.format("YYYY-MM-DD"),
        end: now.format("YYYY-MM-DD"),
        label: "今日",
      };
  }
}

/**
 * 获取所有预设的日期范围
 * @returns 所有日期范围配置
 */
export function getAllDateRanges(): Record<DateRangeType, DateRange> {
  return {
    day: generateDateRange("day"),
    week: generateDateRange("week"),
    month: generateDateRange("month"),
  };
}

/**
 * 格式化日期显示
 * @param date 日期字符串或Date对象
 * @param format 格式模板，默认为YYYY-MM-DD
 * @returns 格式化后的日期字符串
 */
export function formatDate(
  date: string | Date,
  format: string = "YYYY-MM-DD",
): string {
  return dayjs(date).format(format);
}

/**
 * 检查是否为今天
 * @param date 日期字符串
 * @returns 是否为今天
 */
export function isToday(date: string): boolean {
  return dayjs(date).isSame(dayjs(), "day");
}

/**
 * 检查日期是否在范围内
 * @param date 要检查的日期
 * @param start 开始日期
 * @param end 结束日期
 * @returns 是否在范围内
 */
export function isDateInRange(
  date: string,
  start: string,
  end: string,
): boolean {
  const targetDate = dayjs(date);
  return targetDate.isAfter(dayjs(start)) && targetDate.isBefore(dayjs(end));
}
