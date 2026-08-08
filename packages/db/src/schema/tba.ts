import { boolean, date, index, integer, jsonb, numeric, pgTable, primaryKey, text, timestamp, unique } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

/**
 * TBA-sourced entities key off TBA's own natural keys (e.g. "frc5090", "2026mifim")
 * instead of a synthetic uuid. Ingestion upserts by that key, so re-running the job is
 * always idempotent and there's no separate id-mapping table to keep in sync.
 */

export const teams = pgTable("teams", {
  key: text("key").primaryKey(), // e.g. "frc5090"
  teamNumber: integer("team_number").notNull().unique(),
  nickname: text("nickname"),
  name: text("name"),
  city: text("city"),
  stateProv: text("state_prov"),
  country: text("country"),
  rookieYear: integer("rookie_year"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const events = pgTable(
  "events",
  {
    key: text("key").primaryKey(), // e.g. "2026mifim"
    name: text("name").notNull(),
    shortName: text("short_name"),
    eventType: integer("event_type").notNull(),
    city: text("city"),
    stateProv: text("state_prov"),
    country: text("country"),
    startDate: date("start_date").notNull(),
    endDate: date("end_date").notNull(),
    year: integer("year").notNull(),
    week: integer("week"),
    timezone: text("timezone"),
    webcasts: jsonb("webcasts").$type<{ type: string; channel: string }[]>(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("events_year_idx").on(t.year)],
);

/** The attendee list an event's scouting/pick-list screens work from. */
export const eventTeams = pgTable(
  "event_teams",
  {
    eventKey: text("event_key")
      .notNull()
      .references(() => events.key, { onDelete: "cascade" }),
    teamKey: text("team_key")
      .notNull()
      .references(() => teams.key, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.eventKey, t.teamKey] })],
);

export const matches = pgTable(
  "matches",
  {
    key: text("key").primaryKey(), // e.g. "2026mifim_qm1"
    eventKey: text("event_key")
      .notNull()
      .references(() => events.key, { onDelete: "cascade" }),
    compLevel: text("comp_level").notNull(), // qm, ef, qf, sf, f
    setNumber: integer("set_number").notNull(),
    matchNumber: integer("match_number").notNull(),
    redTeams: jsonb("red_teams").$type<string[]>().notNull(),
    blueTeams: jsonb("blue_teams").$type<string[]>().notNull(),
    redScore: integer("red_score"),
    blueScore: integer("blue_score"),
    winningAlliance: text("winning_alliance"), // "red" | "blue" | "" (tie)
    scoreBreakdown: jsonb("score_breakdown"),
    actualTime: timestamp("actual_time", { withTimezone: true }),
    // TBA-provided when available (its `videos` array); otherwise filled in manually by
    // a scout/admin so the video-assisted entry form has something to embed.
    videoUrl: text("video_url"),
    // Once a human sets a video URL, ingestion leaves it alone even if TBA later
    // supplies its own — otherwise every re-ingest would clobber a manual override.
    videoUrlIsManual: boolean("video_url_is_manual").notNull().default(false),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("matches_event_idx").on(t.eventKey)],
);

export const rankings = pgTable(
  "rankings",
  {
    eventKey: text("event_key")
      .notNull()
      .references(() => events.key, { onDelete: "cascade" }),
    teamKey: text("team_key")
      .notNull()
      .references(() => teams.key, { onDelete: "cascade" }),
    rank: integer("rank").notNull(),
    wins: integer("wins").notNull(),
    losses: integer("losses").notNull(),
    ties: integer("ties").notNull(),
    played: integer("played").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.eventKey, t.teamKey] })],
);

/** Latest Statbotics EPA per team/year — enough for the pick list, no trajectory chart here. */
export const epaSnapshots = pgTable(
  "epa_snapshots",
  {
    teamKey: text("team_key")
      .notNull()
      .references(() => teams.key, { onDelete: "cascade" }),
    year: integer("year").notNull(),
    epaTotal: numeric("epa_total"),
    epaNorm: numeric("epa_norm"),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique("epa_snapshots_team_year_unique").on(t.teamKey, t.year)],
);

export const teamsRelations = relations(teams, ({ many }) => ({
  eventTeams: many(eventTeams),
  rankings: many(rankings),
  epaSnapshots: many(epaSnapshots),
}));

export const eventsRelations = relations(events, ({ many }) => ({
  eventTeams: many(eventTeams),
  matches: many(matches),
  rankings: many(rankings),
}));

export const eventTeamsRelations = relations(eventTeams, ({ one }) => ({
  event: one(events, { fields: [eventTeams.eventKey], references: [events.key] }),
  team: one(teams, { fields: [eventTeams.teamKey], references: [teams.key] }),
}));

export const matchesRelations = relations(matches, ({ one }) => ({
  event: one(events, { fields: [matches.eventKey], references: [events.key] }),
}));
