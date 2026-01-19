import { NextRequest, NextResponse } from "next/server";
import { requestAI, requestAIStream } from "@/lib/clients/ai";
import { authorization } from "@/lib/api/authorization";
import type {
  AiUsageScene,
  AiConversationCategory,
} from "@/lib/services/aiUsageService";

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    let userId: string | undefined;
    try {
      const user = await authorization();
      userId = user.id;
    } catch (error) {
      console.log("[Chat API] 用户未登录，将不记录使用情况");
    }

    // 解析请求体，添加错误处理
    let body;
    try {
      const text = await request.text();
      console.log("[Chat API] 收到请求�?", text.substring(0, 200));

      if (!text || text.trim().length === 0) {
        console.error("[Chat API] 请求体为�?);
        return NextResponse.json(
          {
            success: false,
            error: "请求体不能为�?,
          },
          { status: 400 },
        );
      }

      body = JSON.parse(text);
    } catch (error: any) {
      return NextResponse.json(
        {
          success: false,
          error: "请求格式错误，请确保发送的是有效的JSON数据",
          details:
            process.env.NODE_ENV === "development" ? error.message : undefined,
        },
        { status: 400 },
      );
    }

    const {
      message,
      model = "deepseek-chat",
      isOnlineSearch = false,
      stream = false,
      scene = "chat" as AiUsageScene,
      category = "general_chat" as AiConversationCategory,
      tags = [] as string[],
      description,
      conversationHistory = [], // 对话历史上下�?
      maxContextMessages = 10, // 最大上下文消息数量
      systemPrompt, // 系统提示�?
    } = body;

    console.log(
      `[Chat API] 收到请求: model=${model}, messageLength=${message?.length || 0}, isOnlineSearch=${isOnlineSearch}, contextMessages=${conversationHistory?.length || 0}`,
    );

    // 验证请求参数
    if (
      !message ||
      typeof message !== "string" ||
      message.trim().length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "消息内容不能为空",
        },
        { status: 400 },
      );
    }

    // 获取API密钥
    const apiKey = process.env.TD_AGENT_API_KEY;
    if (!apiKey) {
      console.error("[Chat API] API密钥未配�?);
      return NextResponse.json(
        {
          success: false,
          error: "AI服务配置错误，请联系管理�?,
        },
        { status: 500 },
      );
    }

    // 获取请求元数�?
    const ipAddress =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";

    // 如果是流式请�?
    if (stream) {
      const streamResponse = await requestAIStream({
        content: message.trim(),
        apiKey,
        model,
        timeout: 60000,
        "web-search": isOnlineSearch,
        stream: true,
        // 上下文记忆参�?
        conversationHistory,
        maxContextMessages,
        systemPrompt,
        // 使用记录参数
        userId,
        scene,
        conversationCategory: category,
        conversationTags: tags,
        sceneDescription:
          description ||
          `用户聊天${isOnlineSearch ? "(联网)" : ""}: ${message.trim().substring(0, 50)}...`,
        ipAddress,
        userAgent,
      });

      if (streamResponse.success && streamResponse.stream) {
        // 创建转换流来处理SSE数据
        const transformStream = new TransformStream({
          transform(chunk, controller) {
            const text = new TextDecoder().decode(chunk);
            const lines = text.split("\n");

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const data = line.slice(6);
                if (data === "[DONE]") {
                  controller.enqueue(
                    new TextEncoder().encode("data: [DONE]\n\n"),
                  );
                  return;
                }

                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.choices?.[0]?.delta?.content;
                  if (content) {
                    controller.enqueue(
                      new TextEncoder().encode(
                        `data: ${JSON.stringify({ content })}\n\n`,
                      ),
                    );
                  }
                } catch (e) {
                  // 忽略解析错误
                }
              }
            }
          },
        });

        const readableStream =
          streamResponse.stream.pipeThrough(transformStream);

        return new Response(readableStream, {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type",
          },
        });
      } else {
        console.error(`[Chat API] 流式AI服务响应失败: ${streamResponse.error}`);
        return NextResponse.json(
          {
            success: false,
            error: streamResponse.error || "AI流式服务响应失败",
            details: streamResponse.details,
          },
          { status: 500 },
        );
      }
    }

    // 非流式请求（保持原有逻辑�?
    const response = await requestAI({
      content: message.trim(),
      apiKey,
      model,
      timeout: 60000,
      "web-search": isOnlineSearch, // 联网查询参数
      // 上下文记忆参�?
      conversationHistory,
      maxContextMessages,
      systemPrompt,
      // 使用记录参数
      userId, // 如果有userId则自动记�?
      scene,
      conversationCategory: category,
      conversationTags: tags,
      sceneDescription:
        description ||
        `用户聊天${isOnlineSearch ? "(联网)" : ""}: ${message.trim().substring(0, 50)}...`,
      ipAddress,
      userAgent,
    });

    const duration = Date.now() - startTime;
    console.log(
      `[Chat API] AI服务响应完成: success=${response.success}, duration=${duration}ms`,
    );

    if (response.success) {
      return NextResponse.json({
        success: true,
        content: response.content,
        usage: response.data?.usage,
        model,
        duration,
        tracked: !!userId, // 是否记录了使用情�?
      });
    } else {
      console.error(`[Chat API] AI服务响应失败: ${response.error}`);
      return NextResponse.json(
        {
          success: false,
          error: response.error || "AI服务响应失败",
          details: response.details,
        },
        { status: 500 },
      );
    }
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`[Chat API] 服务器错�?(${duration}ms):`, error);

    return NextResponse.json(
      {
        success: false,
        error: "服务器内部错误，请稍后重�?,
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 },
    );
  }
}

// 支持OPTIONS请求（CORS预检�?
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
