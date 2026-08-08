import { jsonb, pgEnum, pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";

export const apiSourceEnum = pgEnum("api_source", ["tba", "statbotics"]);

/** The literal ETag/If-None-Match cache the TBA and Statbotics clients read/write. */
export const apiCacheEntries = pgTable(
  "api_cache_entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    source: apiSourceEnum("source").notNull(),
    endpointKey: text("endpoint_key").notNull(), // normalized path+query, e.g. "/team/frc5090/matches/2026/simple"
    etag: text("etag"),
    responseBody: jsonb("response_body"),
    statusCode: text("status_code").notNull(),
    fetchedAt: timestamp("fetched_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique("api_cache_entries_source_endpoint_unique").on(t.source, t.endpointKey)],
);
