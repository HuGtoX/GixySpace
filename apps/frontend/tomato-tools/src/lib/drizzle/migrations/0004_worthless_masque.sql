CREATE TYPE "public"."message_role" AS ENUM('user', 'assistant');--> statement-breakpoint
ALTER TYPE "public"."ai_usage_scene" ADD VALUE 'weather_report' BEFORE 'other';--> statement-breakpoint
CREATE TABLE "ai_chat_message" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"content" text NOT NULL,
	"role" "message_role" NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_chat_session" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text DEFAULT '新对话' NOT NULL,
	"model" text NOT NULL,
	"is_online_search" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ai_chat_message" ADD CONSTRAINT "ai_chat_message_session_id_ai_chat_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."ai_chat_session"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_chat_session" ADD CONSTRAINT "ai_chat_session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_ai_chat_message_session_id" ON "ai_chat_message" USING btree ("session_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_ai_chat_message_created_at" ON "ai_chat_message" USING btree ("created_at" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "idx_ai_chat_message_session_created" ON "ai_chat_message" USING btree ("session_id" uuid_ops,"created_at" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "idx_ai_chat_session_user_id" ON "ai_chat_session" USING btree ("user_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_ai_chat_session_created_at" ON "ai_chat_session" USING btree ("created_at" timestamptz_ops);--> statement-breakpoint
CREATE INDEX "idx_ai_chat_session_user_created" ON "ai_chat_session" USING btree ("user_id" uuid_ops,"created_at" timestamptz_ops);