````js
var axios = require("axios");
var data = JSON.stringify({
  model: "302-agent-todo-summary-gixy",
  messages: [
    {
      role: "user",
      content: "Hello!",
    },
  ],
});

var config = {
  method: "post",
  url: "https://api.302.ai/v1/chat/completions",
  headers: {
    Accept: "application/json",
    Authorization: "Bearer sk-4JE3jpsBpMCqoasLC40omUYA6WPJ8d5Uh1kcIVXTDYO7utkx",
    "User-Agent": "https://api.302.ai/v1/chat/completions",
    "Content-Type": "application/json",
  },
  data: data,
};

axios(config)
  .then(function (response) {
    console.log(JSON.stringify(response.data));
  })
  .catch(function (error) {
    console.log(error);
  });

const response = {
  success: true,
  summary: {
    choices: [
      {
        message: {
          role: "assistant",
          content:
            '好的，根据您提供的任务完成情况，我将为您生成一份详细的日报总结。以下是总结报告：\n\n```json\n{\n  "report_type": "day",\n  "report_date_range": "今日",\n  "author": "undefined",\n  "department": "",\n  "tasks": [\n    {\n      "title": "完成项目文档",\n      "description": "编写项目API文档和用户手册",\n      "priority": "high",\n      "status": "已完成",\n      "completed_at": "2024-01-10"\n    },\n    {\n      "title": "代码审查",\n      "description": "审查团队成员的代码提交",\n      "priority": "medium",\n      "status": "已完成",\n      "completed_at": "2024-01-12"\n    }\n  ]\n}\n```\n\n**日报总结：**\n\n在今天的任务中，我们成功完成了两个重要任务。首先，我们完成了项目的文档编写工作，包括编写项目API文档和用户手册。这项高优先级任务已经按时完成，有助于提高团队的开发效率和用户使用体验。其次，我们进行了代码审查，审查了团队成员的代码提交。尽管这项任务的优先级为中等，但它对于保证代码质量和避免潜在错误同样至关重要。所有任务均已在规定时间内完成，并得到了有效的执行。\n\n如果需要进一步的信息或有任何调整，请告知！',
        },
        finish_reason: "stop",
        index: 0,
        logprobs: null,
      },
    ],
    object: "chat.completion",
    usage: {
      prompt_tokens: 841,
      completion_tokens: 290,
      total_tokens: 1131,
    },
    created: 1756109995,
    system_fingerprint: null,
    model: "qwen-turbo-2024-11-01",
    id: "chatcmpl-e2bd26f7-e4c1-963b-a7d8-7f53283d5d8c",
  },
  prompt:
    '\n请根据用户今日完成的待办任务生成一份详细的日报总结。\n\n## 任务完成情况\n- report_type: day\n- report_date_range: 今日\n- author: undefined\n- raw_task_list: [{"title":"完成项目文档","description":"编写项目API文档和用户手册","createdAt":"2024-01-10","priority":"high"},{"title":"代码审查","description":"审查团队成员的代码提交","createdAt":"2024-01-12","priority":"medium"}]\n- 共完成 2 项任务\n',
};
````
