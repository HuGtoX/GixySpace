ALTER TABLE "password_reset_tokens" RENAME TO "password_reset_token";--> statement-breakpoint
ALTER TABLE "users" RENAME TO "user";--> statement-breakpoint
ALTER TABLE "user_profiles" RENAME TO "user_profile";--> statement-breakpoint
ALTER TABLE "user_sessions" RENAME TO "user_session";--> statement-breakpoint
ALTER TABLE "password_reset_token" DROP CONSTRAINT "password_reset_tokens_token_unique";--> statement-breakpoint
ALTER TABLE "user" DROP CONSTRAINT "users_email_unique";--> statement-breakpoint
ALTER TABLE "password_reset_token" DROP CONSTRAINT "password_reset_tokens_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "user_profile" DROP CONSTRAINT "user_profiles_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "user_session" DROP CONSTRAINT "user_sessions_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "password_reset_token" ADD CONSTRAINT "password_reset_token_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_profile" ADD CONSTRAINT "user_profile_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_session" ADD CONSTRAINT "user_session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "password_reset_token" ADD CONSTRAINT "password_reset_token_token_unique" UNIQUE("token");--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_email_unique" UNIQUE("email");