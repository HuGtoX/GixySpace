import { NextRequest, NextResponse } from "next/server";
import { createDbClient } from "@/lib/drizzle/client";
import { AuthService } from "@/modules/auth/auth.service";
import { authorization } from "../authorization";
import {
  todo,
  todoStatusEnum,
  todoPriorityEnum,
} from "@/lib/drizzle/schema/todo";
import { eq, and } from "drizzle-orm";
import { createRequestLogger, generateCorrelationId } from "@/lib/logger";

import { z } from "zod";

export async function GET(request: NextRequest) {
  const correlationId =
    request.headers.get("x-correlation-id") || generateCorrelationId();
  const logger = createRequestLogger(correlationId, "todo/get");
  try {
    const dbClient = createDbClient();

    const user = await authorization();

    const todos = await dbClient.db
      .select()
      .from(todo)
      .where(eq(todo.userId, user.id))
      .orderBy(todo.createdAt);

    return NextResponse.json(todos);
  } catch (error) {
    logger.error({ error }, "Get todos error");

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "获取待办事项失败" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  console.log("POST request to /api/todo received");
  console.log("Request headers:", request.headers);
  try {
    const dbClient = createDbClient();
    const authService = new AuthService();
    const { session, error } = await authService.getSession();

    if (error || !session || !session.user.id) {
      return NextResponse.json(
        { error: error || "未授权访问" },
        { status: 401 },
      );
    }

    // 验证请求数据
    const todoSchema = z.object({
      title: z.string().min(1, "任务标题不能为空"),
      description: z.string().optional(),
      priority: z
        .enum(todoPriorityEnum.enumValues)
        .optional()
        .default("medium"),
      dueDate: z.string().optional(),
    });

    const body = await request.json();
    const validatedData = todoSchema.parse(body);

    const newTodo = await dbClient.db
      .insert(todo)
      .values({
        userId: session.user.id,
        title: validatedData.title,
        description: validatedData.description,
        priority: validatedData.priority,
        dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : null,
        status: "pending",
      })
      .returning();

    return NextResponse.json(newTodo[0], { status: 201 });
  } catch (error) {
    console.error("创建待办事项失败:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "创建待办事项失败" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const dbClient = createDbClient();
    const authService = new AuthService();
    const { session, error } = await authService.getSession();

    if (error || !session || !session.user.id) {
      return NextResponse.json(
        { error: error || "未授权访问" },
        { status: 401 },
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "缺少任务ID" }, { status: 400 });
    }

    // 验证请求数据
    const updateSchema = z.object({
      title: z.string().optional(),
      description: z.string().optional(),
      status: z.enum(todoStatusEnum.enumValues).optional(),
      priority: z.enum(todoPriorityEnum.enumValues).optional(),
      dueDate: z.iso.datetime().optional(),
      completed: z.boolean().optional(),
      archived: z.boolean().optional(),
    });

    const body = await request.json();
    console.log("-- [ body ] --", body);

    const validatedData = updateSchema.parse(body);

    // 构建更新数据
    const updateData: Record<string, any> = {
      ...validatedData,
      dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : null,
      updatedAt: new Date(),
    };

    // 执行更新
    const updatedTodo = await dbClient.db
      .update(todo)
      .set(updateData)
      .where(and(eq(todo.id, id), eq(todo.userId, session.user.id)))
      .returning();

    if (updatedTodo.length === 0) {
      return NextResponse.json(
        { error: "未找到任务或无权修改" },
        { status: 404 },
      );
    }

    return NextResponse.json(updatedTodo[0]);
  } catch (error) {
    console.error("更新待办事项失败:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "更新待办事项失败" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const dbClient = createDbClient();
    const authService = new AuthService();
    const { session, error } = await authService.getSession();

    if (error || !session || !session.user.id) {
      return NextResponse.json(
        { error: error || "未授权访问" },
        { status: 401 },
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "缺少任务ID" }, { status: 400 });
    }

    // 执行删除
    const deletedTodo = await dbClient.db
      .delete(todo)
      .where(and(eq(todo.id, id), eq(todo.userId, session.user.id)))
      .returning();

    if (deletedTodo.length === 0) {
      return NextResponse.json(
        { error: "未找到任务或无权删除" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, id: deletedTodo[0].id });
  } catch (error) {
    console.error("删除待办事项失败:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "删除待办事项失败" },
      { status: 500 },
    );
  }
}
