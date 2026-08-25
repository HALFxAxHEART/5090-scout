CREATE TABLE "strategy_boards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_key" text NOT NULL,
	"match_key" text,
	"name" text NOT NULL,
	"board_data" jsonb NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "strategy_boards_match_unique" UNIQUE("match_key")
);
--> statement-breakpoint
ALTER TABLE "strategy_boards" ADD CONSTRAINT "strategy_boards_event_key_events_key_fk" FOREIGN KEY ("event_key") REFERENCES "public"."events"("key") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "strategy_boards" ADD CONSTRAINT "strategy_boards_match_key_matches_key_fk" FOREIGN KEY ("match_key") REFERENCES "public"."matches"("key") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "strategy_boards" ADD CONSTRAINT "strategy_boards_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;