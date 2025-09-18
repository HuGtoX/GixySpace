import { NextRequest, NextResponse } from "next/server";
import { NotificationService } from "@/lib/services/notification";
import { createModuleLogger } from "@/lib/logger";
import crypto from "crypto";

const log = createModuleLogger("github-webhook-api");

// GitHub Webhook事件类型
interface GitHubWebhookEvent {
  action: string;
  pull_request?: {
    id: number;
    number: number;
    title: string;
    html_url: string;
    user: {
      login: string;
      avatar_url: string;
    };
    labels: Array<{
      name: string;
      color: string;
    }>;
  };
  label?: {
    name: string;
    color: string;
  };
  repository: {
    name: string;
    full_name: string;
    html_url: string;
  };
  sender: {
    login: string;
    avatar_url: string;
  };
}

/**
 * 验证GitHub Webhook签名
 */
function verifyGitHubSignature(
  payload: string,
  signature: string,
  secret: string,
): boolean {
  if (!signature || !secret) {
    return false;
  }

  const expectedSignature = `sha256=${crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex")}`;

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature),
  );
}

/**
 * 生成通知内容
 */
function generateNotificationContent(event: GitHubWebhookEvent): {
  title: string;
  content: string;
  actionUrl: string;
  metadata: any;
} {
  const { action, pull_request, label, repository, sender } = event;

  if (action === "labeled" && pull_request && label) {
    return {
      title: `PR #${pull_request.number} 被添加了标签 "${label.name}"`,
      content: `${sender.login} 为 PR "${pull_request.title}" 添加了标签 "${label.name}"。\n\n仓库: ${repository.full_name}`,
      actionUrl: pull_request.html_url,
      metadata: {
        type: "github_pr_labeled",
        repository: repository.full_name,
        pr_number: pull_request.number,
        pr_title: pull_request.title,
        label: {
          name: label.name,
          color: label.color,
        },
        sender: {
          login: sender.login,
          avatar_url: sender.avatar_url,
        },
      },
    };
  }

  if (action === "unlabeled" && pull_request && label) {
    return {
      title: `PR #${pull_request.number} 移除了标签 "${label.name}"`,
      content: `${sender.login} 从 PR "${pull_request.title}" 移除了标签 "${label.name}"。\n\n仓库: ${repository.full_name}`,
      actionUrl: pull_request.html_url,
      metadata: {
        type: "github_pr_unlabeled",
        repository: repository.full_name,
        pr_number: pull_request.number,
        pr_title: pull_request.title,
        label: {
          name: label.name,
          color: label.color,
        },
        sender: {
          login: sender.login,
          avatar_url: sender.avatar_url,
        },
      },
    };
  }

  if (action === "opened" && pull_request) {
    return {
      title: `新的 PR #${pull_request.number} 已创建`,
      content: `${sender.login} 创建了新的 PR "${pull_request.title}"。\n\n仓库: ${repository.full_name}`,
      actionUrl: pull_request.html_url,
      metadata: {
        type: "github_pr_opened",
        repository: repository.full_name,
        pr_number: pull_request.number,
        pr_title: pull_request.title,
        sender: {
          login: sender.login,
          avatar_url: sender.avatar_url,
        },
      },
    };
  }

  if (action === "closed" && pull_request) {
    return {
      title: `PR #${pull_request.number} 已关闭`,
      content: `${sender.login} 关闭了 PR "${pull_request.title}"。\n\n仓库: ${repository.full_name}`,
      actionUrl: pull_request.html_url,
      metadata: {
        type: "github_pr_closed",
        repository: repository.full_name,
        pr_number: pull_request.number,
        pr_title: pull_request.title,
        sender: {
          login: sender.login,
          avatar_url: sender.avatar_url,
        },
      },
    };
  }

  // 默认通知内容
  return {
    title: `GitHub 事件: ${action}`,
    content: `在仓库 ${repository.full_name} 中发生了 ${action} 事件。`,
    actionUrl: repository.html_url,
    metadata: {
      type: "github_generic",
      action,
      repository: repository.full_name,
      sender: {
        login: sender.login,
        avatar_url: sender.avatar_url,
      },
    },
  };
}

/**
 * POST /api/notifications/github-webhook - GitHub Webhook处理
 */
export async function POST(request: NextRequest) {
  try {
    const payload = await request.text();
    const signature = request.headers.get("x-hub-signature-256");
    const event = request.headers.get("x-github-event");

    // 验证Webhook签名（如果配置了密钥）
    const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET;
    if (webhookSecret && signature) {
      const isValid = verifyGitHubSignature(payload, signature, webhookSecret);
      if (!isValid) {
        log.warn("Invalid GitHub webhook signature");
        return NextResponse.json(
          { success: false, error: "Invalid signature" },
          { status: 401 },
        );
      }
    }

    const webhookEvent: GitHubWebhookEvent = JSON.parse(payload);

    log.info("Received GitHub webhook", {
      event,
      action: webhookEvent.action,
      repository: webhookEvent.repository?.full_name,
    });

    // 只处理特定的事件
    const supportedEvents = ["pull_request"];
    if (!event || !supportedEvents.includes(event)) {
      log.info("Unsupported GitHub event", { event });
      return NextResponse.json({ success: true, message: "Event ignored" });
    }

    // 只处理特定的动作
    const supportedActions = ["opened", "closed", "labeled", "unlabeled"];
    if (!supportedActions.includes(webhookEvent.action)) {
      log.info("Unsupported GitHub action", { action: webhookEvent.action });
      return NextResponse.json({ success: true, message: "Action ignored" });
    }

    // 生成通知内容
    const notificationData = generateNotificationContent(webhookEvent);

    // 创建通知
    const notification = await NotificationService.createNotification({
      title: notificationData.title,
      content: notificationData.content,
      type: "github",
      priority: "normal",
      status: "published",
      actionUrl: notificationData.actionUrl,
      iconUrl:
        "https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png",
      metadata: notificationData.metadata,
      sendEmail: false,
      sendPush: true,
      createdBy: null,
    });

    // 发送给所有用户
    await NotificationService.sendToAllUsers(notification.id);

    log.info("GitHub notification created and sent", {
      notificationId: notification.id,
      title: notification.title,
    });

    return NextResponse.json({
      success: true,
      message: "Webhook processed successfully",
      notificationId: notification.id,
    });
  } catch (error) {
    log.error("Failed to process GitHub webhook", { error });

    return NextResponse.json(
      {
        success: false,
        error: "Failed to process webhook",
      },
      { status: 500 },
    );
  }
}
