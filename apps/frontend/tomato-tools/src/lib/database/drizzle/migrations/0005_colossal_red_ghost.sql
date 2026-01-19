ALTER TABLE "user" ADD COLUMN "is_anonymous" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "anonymous_created_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "expires_at" timestamp with time zone;