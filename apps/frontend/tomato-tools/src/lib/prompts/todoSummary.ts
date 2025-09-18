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
## 任务完成情况
- report_type: ${options.period}
- raw_task_list: ${options.todos}
- 共完成 ${options.completedCount} 项任务

请生成一份详细清晰的本日任务完成总结，帮助用户快速了解本日任务完成情况。
`,

  /**
   * 周总结提示词
   */
  weekly: (options: TodoSummaryPromptOptions) => `
## 任务完成情况  
- report_type: ${options.period}
- raw_task_list: ${options.todos}
- 共完成 ${options.completedCount} 项任务

请生成一份详细清晰的一周任务完成总结，帮助用户快速了解本周任务完成情况。
`,

  /**
   * 月报总结提示词
   */
  monthly: (options: TodoSummaryPromptOptions) => `
## 任务完成情况
- report_type: ${options.period}
- raw_task_list: ${options.todos}
- 共完成 ${options.completedCount} 项任务

请生成一份详实的月度任务总结，帮助用户回顾成长并规划未来。
`,

  /**
   * 全部任务总结提示词
   */
  all: (options: TodoSummaryPromptOptions) => `
请根据用户所有已完成的待办任务生成一份全面的工作总结。

## 任务完成情况
- report_type: ${options.period}
- raw_task_list: ${options.todos}
- 共完成 ${options.completedCount} 项任务

请生成一份全面的工作总结，帮助用户回顾所有的工作成果和成长历程。
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
    case "all":
      return TODO_SUMMARY_PROMPTS.all(promptOptions);
    default:
      return TODO_SUMMARY_PROMPTS.daily(promptOptions);
  }
};
