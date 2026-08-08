import { index, integer, jsonb, pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { events, teams } from "./tba";
import { users } from "./auth";

export const pickListEntries = pgTable(
  "pick_list_entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    eventKey: text("event_key")
      .notNull()
      .references(() => events.key, { onDelete: "cascade" }),
    teamKey: text("team_key")
      .notNull()
      .references(() => teams.key, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    tags: jsonb("tags").$type<string[]>().notNull().default([]),
    notes: text("notes"),
    updatedBy: uuid("updated_by").references(() => users.id, { onDelete: "set null" }),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique("pick_list_entries_event_team_unique").on(t.eventKey, t.teamKey),
    index("pick_list_entries_event_position_idx").on(t.eventKey, t.position),
  ],
);

export const pickListEntriesRelations = relations(pickListEntries, ({ one }) => ({
  event: one(events, { fields: [pickListEntries.eventKey], references: [events.key] }),
  team: one(teams, { fields: [pickListEntries.teamKey], references: [teams.key] }),
}));
