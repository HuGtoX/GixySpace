/**
 * 待办任务总结生成提示词
 * 用于生成日报、周报、月报的AI总结
 */

export interface TodoSummaryPromptOptions {
  userName: string;
  period: "day" | "week" | "month" | "all";
  todos: string;
  completedCount: number;
}

export const TODO_SUMMARY_PROMPTS = {
  /**
   * 日报总结提示词
   */
  daily: (options: TodoSummaryPromptOptions) => `
请根据用户今日完成的待办任务生成一份详细的日报总结。

## 任务完成情况
- report_type: ${options.period}
- report_date_range: 今日
- author: ${options.userName}
- raw_task_list: ${options.todos}
- 共完成 ${options.completedCount} 项任务
`,

  /**
   * 周报总结提示词
   */
  weekly: (options: TodoSummaryPromptOptions) => `
请根据用户本周完成的待办任务生成一份详细的周报总结。

## 任务完成情况  
- report_type: ${options.period}
- report_date_range: 本周
- author: ${options.userName}
- raw_task_list: ${options.todos}
- 共完成 ${options.completedCount} 项任务

请生成一份全面的周度工作总结，帮助用户更好地规划下一周的工作。
`,

  /**
   * 月报总结提示词
   */
  monthly: (options: TodoSummaryPromptOptions) => `
请根据用户本月完成的待办任务生成一份详细的月报总结。

## 任务完成情况
- report_type: ${options.period}
- report_date_range: 本月
- author: ${options.userName}
- raw_task_list: ${options.todos}
- 共完成 ${options.completedCount} 项任务

请生成一份详实的月度工作总结，帮助用户回顾成长并规划未来。
`,
};

/**
 * 根据时间段获取对应的提示词
 */
export const getTodoSummaryPrompt = (
  period: TodoSummaryPromptOptions["period"],
  options: Omit<TodoSummaryPromptOptions, "period">,
) => {
  const promptOptions: TodoSummaryPromptOptions = {
    period,
    ...options,
  };

  switch (period) {
    case "day":
      return TODO_SUMMARY_PROMPTS.daily(promptOptions);
    case "week":
      return TODO_SUMMARY_PROMPTS.weekly(promptOptions);
    case "month":
      return TODO_SUMMARY_PROMPTS.monthly(promptOptions);
    default:
      return TODO_SUMMARY_PROMPTS.daily(promptOptions);
  }
};
