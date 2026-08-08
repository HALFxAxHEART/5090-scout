import { boolean, index, integer, jsonb, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { matches, teams } from "./tba";
import { users } from "./auth";

/**
 * One row per year's game. `gameSchema` is the data-driven scoring definition the
 * scouting form renders from (see @scout5090/shared's games/*.ts for the shape) — so
 * a new season is "add a schema file + flip isActive", not a form rewrite.
 */
export const seasons = pgTable("seasons", {
  year: integer("year").primaryKey(),
  gameName: text("game_name").notNull(),
  gameSchema: jsonb("game_schema").notNull(),
  isActive: boolean("is_active").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const allianceColorEnum = pgEnum("alliance_color", ["red", "blue"]);
export const syncedViaEnum = pgEnum("synced_via", ["direct", "qr"]);

/**
 * `id` is client-generated (crypto.randomUUID() at the moment a scout starts a match),
 * not server-assigned — that's what makes direct submission and QR-code sync both safe
 * to upsert on: whichever path a record arrives by, re-submitting the same id can never
 * create a duplicate.
 */
export const scoutingRecords = pgTable(
  "scouting_records",
  {
    id: uuid("id").primaryKey(),
    matchKey: text("match_key")
      .notNull()
      .references(() => matches.key, { onDelete: "cascade" }),
    scoutedTeamKey: text("scouted_team_key")
      .notNull()
      .references(() => teams.key, { onDelete: "cascade" }),
    allianceColor: allianceColorEnum("alliance_color").notNull(),
    station: integer("station").notNull(), // 1-3
    seasonYear: integer("season_year").notNull(),
    // Who scouted it, captured on their device at record-creation time — not derived
    // from the uploader's session, since a QR sync is uploaded by a *different* user.
    scoutUserId: uuid("scout_user_id").references(() => users.id, { onDelete: "set null" }),
    scoutDisplayName: text("scout_display_name").notNull(),
    // Keyed by the active game schema's element ids -> value (number | boolean | string).
    data: jsonb("data").notNull(),
    // Timestamped taps from video-assisted entry: { elementId, value, videoTimestampSeconds, at }[].
    eventLog: jsonb("event_log").$type<unknown[]>().notNull().default([]),
    notes: text("notes"),
    syncedVia: syncedViaEnum("synced_via").notNull().default("direct"),
    clientCreatedAt: timestamp("client_created_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("scouting_records_match_idx").on(t.matchKey),
    index("scouting_records_team_season_idx").on(t.scoutedTeamKey, t.seasonYear),
  ],
);

export const scoutingRecordsRelations = relations(scoutingRecords, ({ one }) => ({
  match: one(matches, { fields: [scoutingRecords.matchKey], references: [matches.key] }),
  scoutedTeam: one(teams, { fields: [scoutingRecords.scoutedTeamKey], references: [teams.key] }),
  scout: one(users, { fields: [scoutingRecords.scoutUserId], references: [users.id] }),
}));
