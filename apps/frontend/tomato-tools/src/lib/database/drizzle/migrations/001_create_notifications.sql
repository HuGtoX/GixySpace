-- 创建通知类型枚举
CREATE TYPE "notification_type" AS ENUM ('system', 'github', 'update', 'security', 'feature', 'maintenance');

-- 创建通知优先级枚举
CREATE TYPE "notification_priority" AS ENUM ('low', 'normal', 'high', 'urgent');

-- 创建通知状态枚举
CREATE TYPE "notification_status" AS ENUM ('draft', 'published', 'archived');

-- 创建通知表
CREATE TABLE "notification" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "title" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "type" "notification_type" NOT NULL,
  "priority" "notification_priority" NOT NULL DEFAULT 'normal',
  "status" "notification_status" NOT NULL DEFAULT 'published',
  "action_url" TEXT,
  "icon_url" TEXT,
  "metadata" JSONB,
  "send_email" BOOLEAN NOT NULL DEFAULT false,
  "send_push" BOOLEAN NOT NULL DEFAULT true,
  "scheduled_at" TIMESTAMPTZ,
  "expires_at" TIMESTAMPTZ,
  "created_by" UUID REFERENCES "user"("id"),
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 创建用户通知关联表
CREATE TABLE "user_notification" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "notification_id" UUID NOT NULL REFERENCES "notification"("id") ON DELETE CASCADE,
  "is_read" BOOLEAN NOT NULL DEFAULT false,
  "is_archived" BOOLEAN NOT NULL DEFAULT false,
  "is_favorite" BOOLEAN NOT NULL DEFAULT false,
  "read_at" TIMESTAMPTZ,
  "archived_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 创建通知统计表
CREATE TABLE "notification_stats" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "notification_id" UUID NOT NULL REFERENCES "notification"("id") ON DELETE CASCADE UNIQUE,
  "total_sent" INTEGER NOT NULL DEFAULT 0,
  "total_read" INTEGER NOT NULL DEFAULT 0,
  "total_clicked" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 创建索引
CREATE INDEX "idx_notification_type" ON "notification"("type");
CREATE INDEX "idx_notification_status" ON "notification"("status");
CREATE INDEX "idx_notification_created_at" ON "notification"("created_at");
CREATE INDEX "idx_notification_expires_at" ON "notification"("expires_at");

CREATE INDEX "idx_user_notification_user_id" ON "user_notification"("user_id");
CREATE INDEX "idx_user_notification_notification_id" ON "user_notification"("notification_id");
CREATE INDEX "idx_user_notification_is_read" ON "user_notification"("is_read");
CREATE INDEX "idx_user_notification_created_at" ON "user_notification"("created_at");

-- 创建复合索引
CREATE INDEX "idx_user_notification_user_read" ON "user_notification"("user_id", "is_read");
CREATE INDEX "idx_notification_status_expires" ON "notification"("status", "expires_at");

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_notification_updated_at 
    BEFORE UPDATE ON "notification" 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_stats_updated_at 
    BEFORE UPDATE ON "notification_stats" 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();