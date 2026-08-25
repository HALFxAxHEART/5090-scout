import { jsonb, pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { events, matches } from "./tba";
import { users } from "./auth";

/**
 * A drawn field-diagram strategy. `matchKey` null = a reusable named template (not tied
 * to a match yet); non-null = the live board for that match, one per match via the
 * unique constraint below (Postgres allows any number of NULLs under a unique
 * constraint, so templates aren't affected by it). `boardData` is opaque jsonb owned by
 * the client's drawing tool — the server just stores/returns it.
 */
export const strategyBoards = pgTable(
  "strategy_boards",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    eventKey: text("event_key")
      .notNull()
      .references(() => events.key, { onDelete: "cascade" }),
    matchKey: text("match_key").references(() => matches.key, { onDelete: "cascade" }),
    name: text("name").notNull(),
    boardData: jsonb("board_data").notNull(),
    createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique("strategy_boards_match_unique").on(t.matchKey)],
);

export const strategyBoardsRelations = relations(strategyBoards, ({ one }) => ({
  event: one(events, { fields: [strategyBoards.eventKey], references: [events.key] }),
  match: one(matches, { fields: [strategyBoards.matchKey], references: [matches.key] }),
  createdByUser: one(users, { fields: [strategyBoards.createdBy], references: [users.id] }),
}));
