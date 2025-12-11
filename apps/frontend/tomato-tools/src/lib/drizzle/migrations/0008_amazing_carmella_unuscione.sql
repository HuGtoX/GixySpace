CREATE TABLE "weather_poster" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"city" text NOT NULL,
	"condition" text NOT NULL,
	"date" text NOT NULL,
	"generated_date" date NOT NULL,
	"img_url" text NOT NULL,
	"poetry" text NOT NULL,
	"temp_high" integer NOT NULL,
	"temp_low" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "weather_poster" ADD CONSTRAINT "weather_poster_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_weather_poster_user_date" ON "weather_poster" USING btree ("user_id","generated_date");--> statement-breakpoint
CREATE INDEX "idx_weather_poster_user_created" ON "weather_poster" USING btree ("user_id","created_at");