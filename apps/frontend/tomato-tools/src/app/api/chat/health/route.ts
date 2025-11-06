import { NextResponse } from "next/server";

export async function GET() {
  try {
    // 检查环境变量
    const apiKey = process.env.TD_AGENT_API_KEY;

    return NextResponse.json({
      success: true,
      hasApiKey: !!apiKey,
      apiKeyLength: apiKey ? apiKey.length : 0,
      message: "Chat API is ready",
    });
  } catch (error) {
    return NextResponse.json({ error: "Health check failed" }, { status: 500 });
  }
}
