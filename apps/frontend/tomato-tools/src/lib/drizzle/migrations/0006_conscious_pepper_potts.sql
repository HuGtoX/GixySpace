CREATE TABLE "weather_city_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"city_name" text NOT NULL,
	"city_name_en" text,
	"location_id" text,
	"latitude" numeric(10, 6) NOT NULL,
	"longitude" numeric(10, 6) NOT NULL,
	"province" text,
	"visit_count" integer DEFAULT 1 NOT NULL,
	"last_visit_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "avatar_url" SET DEFAULT '/avatar/a5.png';--> statement-breakpoint
ALTER TABLE "weather_city_history" ADD CONSTRAINT "weather_city_history_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_weather_city_history_user_visit" ON "weather_city_history" USING btree ("user_id","last_visit_at");--> statement-breakpoint
CREATE INDEX "idx_weather_city_history_user_city" ON "weather_city_history" USING btree ("user_id","city_name");