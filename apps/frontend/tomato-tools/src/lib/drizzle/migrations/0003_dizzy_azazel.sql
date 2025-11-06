CREATE TYPE "public"."ai_conversation_category" AS ENUM('general_chat', 'casual_conversation', 'work_consultation', 'technical_support', 'code_review', 'debugging_help', 'architecture_design', 'learning_tutorial', 'concept_explanation', 'homework_help', 'content_creation', 'writing_assistance', 'brainstorming', 'data_analysis', 'report_generation', 'document_summary', 'translation_service', 'grammar_check', 'text_polishing', 'other');--> statement-breakpoint
CREATE TYPE "public"."ai_usage_scene" AS ENUM('chat', 'summary', 'translation', 'code_generation', 'text_optimization', 'question_answer', 'other');--> statement-breakpoint
CREATE TYPE "public"."ai_usage_status" AS ENUM('success', 'failed', 'timeout');--> statement-breakpoint
CREATE TYPE "public"."notification_priority" AS ENUM('low', 'normal', 'high', 'urgent');--> statement-breakpoint
CREATE TYPE "public"."notification_status" AS ENUM('draft', 'published', 'archived');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('system', 'github', 'update', 'security', 'feature', 'maintenance');--> statement-breakpoint
CREATE TABLE "ai_usage_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"scene" "ai_usage_scene" NOT NULL,
	"scene_description" text,
	"conversation_category" "ai_conversation_category",
	"conversation_tags" jsonb,
	"model" text NOT NULL,
	"prompt_tokens" integer DEFAULT 0 NOT NULL,
	"completion_tokens" integer DEFAULT 0 NOT NULL,
	"total_tokens" integer DEFAULT 0 NOT NULL,
	"estimated_cost" numeric(10, 6),
	"request_data" jsonb,
	"response_data" jsonb,
	"status" "ai_usage_status" DEFAULT 'success' NOT NULL,
	"error_message" text,
	"error_code" text,
	"duration" integer,
	"ip_address" text,
	"user_agent" text,
	"request_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_usage_statistics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"date" date NOT NULL,
	"total_requests" integer DEFAULT 0 NOT NULL,
	"success_requests" integer DEFAULT 0 NOT NULL,
	"failed_requests" integer DEFAULT 0 NOT NULL,
	"total_prompt_tokens" integer DEFAULT 0 NOT NULL,
	"total_completion_tokens" integer DEFAULT 0 NOT NULL,
	"total_tokens" integer DEFAULT 0 NOT NULL,
	"total_cost" numeric(10, 6) DEFAULT '0' NOT NULL,
	"scene_stats" jsonb DEFAULT '{}'::jsonb,
	"category_stats" jsonb DEFAULT '{}'::jsonb,
	"model_stats" jsonb DEFAULT '{}'::jsonb,
	"avg_duration" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"type" "notification_type" NOT NULL,
	"priority" "notification_priority" DEFAULT 'normal' NOT NULL,
	"status" "notification_status" DEFAULT 'published' NOT NULL,
	"action_url" text,
	"icon_url" text,
	"metadata" json,
	"send_email" boolean DEFAULT false,
	"send_push" boolean DEFAULT true,
	"scheduled_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_stats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"notification_id" uuid NOT NULL,
	"total_sent" integer DEFAULT 0 NOT NULL,
	"total_read" integer DEFAULT 0 NOT NULL,
	"total_clicked" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "notification_stats_notification_id_unique" UNIQUE("notification_id")
);
--> statement-breakpoint
CREATE TABLE "user_notification" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"notification_id" uuid NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"is_archived" boolean DEFAULT false NOT NULL,
	"is_favorite" boolean DEFAULT false NOT NULL,
	"read_at" timestamp with time zone,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ai_usage_logs" ADD CONSTRAINT "ai_usage_logs_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_usage_statistics" ADD CONSTRAINT "ai_usage_statistics_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification" ADD CONSTRAINT "notification_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_stats" ADD CONSTRAINT "notification_stats_notification_id_notification_id_fk" FOREIGN KEY ("notification_id") REFERENCES "public"."notification"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_notification" ADD CONSTRAINT "user_notification_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_notification" ADD CONSTRAINT "user_notification_notification_id_notification_id_fk" FOREIGN KEY ("notification_id") REFERENCES "public"."notification"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_ai_usage_logs_user_id" ON "ai_usage_logs" USING btree ("user_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_ai_usage_logs_scene" ON "ai_usage_logs" USING btree ("scene");--> statement-breakpoint
CREATE INDEX "idx_ai_usage_logs_category" ON "ai_usage_logs" USING btree ("conversation_category");--> statement-breakpoint
CREATE INDEX "idx_ai_usage_logs_created_at" ON "ai_usage_logs" USING btree ("created_at" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "idx_ai_usage_logs_user_created" ON "ai_usage_logs" USING btree ("user_id" uuid_ops,"created_at" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "idx_ai_usage_stats_user_date" ON "ai_usage_statistics" USING btree ("user_id" uuid_ops,"date" date_ops);--> statement-breakpoint
CREATE INDEX "idx_ai_usage_stats_date" ON "ai_usage_statistics" USING btree ("date" date_ops);