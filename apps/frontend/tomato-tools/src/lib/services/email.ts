import { createModuleLogger } from "@/lib/logger";

const log = createModuleLogger("email-service");

/**
 * 邮件服务配置
 */
interface EmailConfig {
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPassword: string;
  fromEmail: string;
  fromName: string;
}

/**
 * 通知邮件数据
 */
interface NotificationEmailData {
  to: string;
  subject: string;
  title: string;
  content: string;
  actionUrl?: string;
  actionText?: string;
  priority?: string;
  type?: string;
}

/**
 * 邮件服务类
 */
export class EmailService {
  private static config: EmailConfig = {
    smtpHost: process.env.SMTP_HOST || "smtp.gmail.com",
    smtpPort: parseInt(process.env.SMTP_PORT || "587"),
    smtpUser: process.env.SMTP_USER || "",
    smtpPassword: process.env.SMTP_PASSWORD || "",
    fromEmail: process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || "",
    fromName: process.env.SMTP_FROM_NAME || "番茄工具箱",
  };

  /**
   * 检查邮件服务是否已配置
   */
  static isConfigured(): boolean {
    return !!(
      this.config.smtpHost &&
      this.config.smtpUser &&
      this.config.smtpPassword
    );
  }

  /**
   * 生成通知邮件HTML模板
   */
  private static generateNotificationEmailTemplate(
    data: NotificationEmailData,
  ): string {
    const priorityColors: Record<string, string> = {
      low: "#52c41a",
      normal: "#1890ff",
      high: "#fa8c16",
      urgent: "#ff4d4f",
    };

    const priorityLabels: Record<string, string> = {
      low: "低",
      normal: "普通",
      high: "高",
      urgent: "紧急",
    };

    const typeLabels: Record<string, string> = {
      system: "系统通知",
      github: "GitHub",
      update: "更新通知",
      security: "安全通知",
      feature: "功能通知",
      maintenance: "维护通知",
    };

    const priorityColor =
      priorityColors[data.priority || "normal"] || priorityColors.normal;
    const priorityLabel =
      priorityLabels[data.priority || "normal"] || priorityLabels.normal;
    const typeLabel = typeLabels[data.type || "system"] || "通知";

    return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.subject}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
      background-color: #f5f5f5;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background-color: #ffffff;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }
    .header {
      background-color: #f43f5e;
      padding: 30px;
      text-align: center;
      color: #ffffff;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }
    .content {
      padding: 30px;
    }
    .badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
      margin-bottom: 16px;
      background-color: ${priorityColor};
      color: #ffffff;
    }
    .title {
      font-size: 20px;
      font-weight: 600;
      color: #262626;
      margin: 16px 0;
    }
    .message {
      font-size: 14px;
      line-height: 1.8;
      color: #595959;
      margin: 16px 0;
      white-space: pre-wrap;
    }
    .action-button {
      display: inline-block;
      padding: 12px 24px;
      margin: 20px 0;
      background-color: #1890ff;
      color: #ffffff;
      text-decoration: none;
      border-radius: 4px;
      font-weight: 500;
      transition: background-color 0.3s;
    }
    .action-button:hover {
      background-color: #40a9ff;
    }
    .footer {
      padding: 20px 30px;
      background-color: #fafafa;
      border-top: 1px solid #f0f0f0;
      text-align: center;
      font-size: 12px;
      color: #8c8c8c;
    }
    .footer a {
      color: #1890ff;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🍅 番茄工具箱</h1>
    </div>
    <div class="content">
      <div>
        <span class="badge">${typeLabel}</span>
        <span class="badge">${priorityLabel}优先级</span>
      </div>
      <div class="title">${data.title}</div>
      <div class="message">${data.content}</div>
      ${
        data.actionUrl
          ? `<a href="${data.actionUrl}" class="action-button">${data.actionText || "查看详情"}</a>`
          : ""
      }
    </div>
    <div class="footer">
      <p>此邮件由番茄工具箱系统自动发送，请勿直接回复。</p>
      <p>
        <a href="${process.env.NEXT_PUBLIC_SITE_URL || "https://tomato-tools.com"}">访问番茄工具箱</a>
      </p>
    </div>
  </div>
</body>
</html>
    `.trim();
  }

  /**
   * 发送通知邮件
   */
  static async sendNotificationEmail(
    data: NotificationEmailData,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // 检查配置
      if (!this.isConfigured()) {
        log.warn("Email service not configured, skipping email send");
        return {
          success: false,
          error: "邮件服务未配置",
        };
      }

      log.info("Sending notification email", {
        to: data.to,
        subject: data.subject,
      });

      // 生成邮件HTML
      const html = this.generateNotificationEmailTemplate(data);

      // 使用 nodemailer 发送邮件
      const nodemailer = await import("nodemailer");

      const transporter = nodemailer.createTransport({
        host: this.config.smtpHost,
        port: this.config.smtpPort,
        secure: this.config.smtpPort === 465, // true for 465, false for other ports
        auth: {
          user: this.config.smtpUser,
          pass: this.config.smtpPassword,
        },
      });

      await transporter.sendMail({
        from: `"${this.config.fromName}" <${this.config.fromEmail}>`,
        to: data.to,
        subject: data.subject,
        html: html,
      });

      log.info("Notification email sent successfully", { to: data.to });

      return { success: true };
    } catch (error) {
      log.error("Failed to send notification email", { error, to: data.to });
      return {
        success: false,
        error: error instanceof Error ? error.message : "发送邮件失败",
      };
    }
  }

  /**
   * 批量发送通知邮件
   */
  static async sendBatchNotificationEmails(
    emails: NotificationEmailData[],
  ): Promise<{
    success: boolean;
    successCount: number;
    failCount: number;
    errors: string[];
  }> {
    log.info("Sending batch notification emails", { count: emails.length });

    let successCount = 0;
    let failCount = 0;
    const errors: string[] = [];

    for (const emailData of emails) {
      const result = await this.sendNotificationEmail(emailData);
      if (result.success) {
        successCount++;
      } else {
        failCount++;
        if (result.error) {
          errors.push(`${emailData.to}: ${result.error}`);
        }
      }
    }

    log.info("Batch notification emails sent", {
      total: emails.length,
      successCount,
      failCount,
    });

    return {
      success: failCount === 0,
      successCount,
      failCount,
      errors,
    };
  }
}
