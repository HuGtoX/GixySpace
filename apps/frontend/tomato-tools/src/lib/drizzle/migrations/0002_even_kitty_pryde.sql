CREATE TYPE "public"."ai_summary_status" AS ENUM('generating', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."ai_summary_type" AS ENUM('day', 'week', 'month', 'all');--> statement-breakpoint
CREATE TYPE "public"."todo_priority" AS ENUM('low', 'medium', 'high', 'urgent');--> statement-breakpoint
CREATE TYPE "public"."todo_status" AS ENUM('pending', 'in_progress', 'completed', 'cancelled');--> statement-breakpoint
ALTER TYPE "public"."user_role" ADD VALUE 'anonymous';--> statement-breakpoint
CREATE TABLE "ai_summary" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"content" text,
	"summary_type" "ai_summary_type" NOT NULL,
	"period" text NOT NULL,
	"todo_count" integer DEFAULT 0 NOT NULL,
	"status" "ai_summary_status" DEFAULT 'generating' NOT NULL,
	"prompt" text,
	"error_message" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "daily_sentences" (
	"id" serial PRIMARY KEY NOT NULL,
	"content" text NOT NULL,
	"source" text,
	"fetch_data" text,
	"fetch_date" date DEFAULT CURRENT_DATE NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_trackings" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"event_name" text NOT NULL,
	"event_category" text,
	"user_id" uuid NOT NULL,
	"properties" jsonb DEFAULT '{}'::jsonb,
	"occurred_at" timestamp with time zone DEFAULT now(),
	"path" text,
	"referrer" text,
	"user_agent" text,
	"ip" text
);
--> statement-breakpoint
CREATE TABLE "todo" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"status" "todo_status" DEFAULT 'pending' NOT NULL,
	"priority" "todo_priority" DEFAULT 'medium' NOT NULL,
	"due_date" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ai_summary" ADD CONSTRAINT "ai_summary_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_trackings" ADD CONSTRAINT "event_trackings_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "todo" ADD CONSTRAINT "todo_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_daily_sentences_date" ON "daily_sentences" USING btree ("fetch_date" date_ops);--> statement-breakpoint
CREATE INDEX "idx_event_trackings_guest_event" ON "event_trackings" USING btree ("user_id" uuid_ops,"event_name" text_ops);--> statement-breakpoint
CREATE INDEX "idx_event_trackings_occurred_at" ON "event_trackings" USING btree ("occurred_at" timestamptz_ops);