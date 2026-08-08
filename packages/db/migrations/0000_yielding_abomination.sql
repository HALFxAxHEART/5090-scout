CREATE TYPE "public"."user_role" AS ENUM('admin', 'scout');--> statement-breakpoint
CREATE TYPE "public"."api_source" AS ENUM('tba', 'statbotics');--> statement-breakpoint
CREATE TYPE "public"."alliance_color" AS ENUM('red', 'blue');--> statement-breakpoint
CREATE TYPE "public"."synced_via" AS ENUM('direct', 'qr');--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"user_agent" text,
	"ip" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sessions_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"display_name" text NOT NULL,
	"role" "user_role" DEFAULT 'scout' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "epa_snapshots" (
	"team_key" text NOT NULL,
	"year" integer NOT NULL,
	"epa_total" numeric,
	"epa_norm" numeric,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "epa_snapshots_team_year_unique" UNIQUE("team_key","year")
);
--> statement-breakpoint
CREATE TABLE "event_teams" (
	"event_key" text NOT NULL,
	"team_key" text NOT NULL,
	CONSTRAINT "event_teams_event_key_team_key_pk" PRIMARY KEY("event_key","team_key")
);
--> statement-breakpoint
CREATE TABLE "events" (
	"key" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"short_name" text,
	"event_type" integer NOT NULL,
	"city" text,
	"state_prov" text,
	"country" text,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"year" integer NOT NULL,
	"week" integer,
	"timezone" text,
	"webcasts" jsonb,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "matches" (
	"key" text PRIMARY KEY NOT NULL,
	"event_key" text NOT NULL,
	"comp_level" text NOT NULL,
	"set_number" integer NOT NULL,
	"match_number" integer NOT NULL,
	"red_teams" jsonb NOT NULL,
	"blue_teams" jsonb NOT NULL,
	"red_score" integer,
	"blue_score" integer,
	"winning_alliance" text,
	"score_breakdown" jsonb,
	"actual_time" timestamp with time zone,
	"video_url" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rankings" (
	"event_key" text NOT NULL,
	"team_key" text NOT NULL,
	"rank" integer NOT NULL,
	"wins" integer NOT NULL,
	"losses" integer NOT NULL,
	"ties" integer NOT NULL,
	"played" integer NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "rankings_event_key_team_key_pk" PRIMARY KEY("event_key","team_key")
);
--> statement-breakpoint
CREATE TABLE "teams" (
	"key" text PRIMARY KEY NOT NULL,
	"team_number" integer NOT NULL,
	"nickname" text,
	"name" text,
	"city" text,
	"state_prov" text,
	"country" text,
	"rookie_year" integer,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "teams_team_number_unique" UNIQUE("team_number")
);
--> statement-breakpoint
CREATE TABLE "api_cache_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source" "api_source" NOT NULL,
	"endpoint_key" text NOT NULL,
	"etag" text,
	"response_body" jsonb,
	"status_code" text NOT NULL,
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "api_cache_entries_source_endpoint_unique" UNIQUE("source","endpoint_key")
);
--> statement-breakpoint
CREATE TABLE "scouting_records" (
	"id" uuid PRIMARY KEY NOT NULL,
	"match_key" text NOT NULL,
	"scouted_team_key" text NOT NULL,
	"alliance_color" "alliance_color" NOT NULL,
	"station" integer NOT NULL,
	"season_year" integer NOT NULL,
	"scout_user_id" uuid,
	"scout_display_name" text NOT NULL,
	"data" jsonb NOT NULL,
	"event_log" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"notes" text,
	"synced_via" "synced_via" DEFAULT 'direct' NOT NULL,
	"client_created_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seasons" (
	"year" integer PRIMARY KEY NOT NULL,
	"game_name" text NOT NULL,
	"game_schema" jsonb NOT NULL,
	"is_active" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pick_list_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_key" text NOT NULL,
	"team_key" text NOT NULL,
	"position" integer NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"notes" text,
	"updated_by" uuid,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pick_list_entries_event_team_unique" UNIQUE("event_key","team_key")
);
--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "epa_snapshots" ADD CONSTRAINT "epa_snapshots_team_key_teams_key_fk" FOREIGN KEY ("team_key") REFERENCES "public"."teams"("key") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_teams" ADD CONSTRAINT "event_teams_event_key_events_key_fk" FOREIGN KEY ("event_key") REFERENCES "public"."events"("key") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_teams" ADD CONSTRAINT "event_teams_team_key_teams_key_fk" FOREIGN KEY ("team_key") REFERENCES "public"."teams"("key") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_event_key_events_key_fk" FOREIGN KEY ("event_key") REFERENCES "public"."events"("key") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rankings" ADD CONSTRAINT "rankings_event_key_events_key_fk" FOREIGN KEY ("event_key") REFERENCES "public"."events"("key") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rankings" ADD CONSTRAINT "rankings_team_key_teams_key_fk" FOREIGN KEY ("team_key") REFERENCES "public"."teams"("key") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scouting_records" ADD CONSTRAINT "scouting_records_match_key_matches_key_fk" FOREIGN KEY ("match_key") REFERENCES "public"."matches"("key") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scouting_records" ADD CONSTRAINT "scouting_records_scouted_team_key_teams_key_fk" FOREIGN KEY ("scouted_team_key") REFERENCES "public"."teams"("key") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scouting_records" ADD CONSTRAINT "scouting_records_scout_user_id_users_id_fk" FOREIGN KEY ("scout_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pick_list_entries" ADD CONSTRAINT "pick_list_entries_event_key_events_key_fk" FOREIGN KEY ("event_key") REFERENCES "public"."events"("key") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pick_list_entries" ADD CONSTRAINT "pick_list_entries_team_key_teams_key_fk" FOREIGN KEY ("team_key") REFERENCES "public"."teams"("key") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pick_list_entries" ADD CONSTRAINT "pick_list_entries_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "events_year_idx" ON "events" USING btree ("year");--> statement-breakpoint
CREATE INDEX "matches_event_idx" ON "matches" USING btree ("event_key");--> statement-breakpoint
CREATE INDEX "scouting_records_match_idx" ON "scouting_records" USING btree ("match_key");--> statement-breakpoint
CREATE INDEX "scouting_records_team_season_idx" ON "scouting_records" USING btree ("scouted_team_key","season_year");--> statement-breakpoint
CREATE INDEX "pick_list_entries_event_position_idx" ON "pick_list_entries" USING btree ("event_key","position");