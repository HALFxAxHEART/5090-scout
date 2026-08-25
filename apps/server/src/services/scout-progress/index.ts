import { db, schema } from "@scout5090/db";
import { eq } from "drizzle-orm";
import type { ScoutProgressRow } from "@scout5090/shared";

export async function getScoutProgress(eventKey: string): Promise<ScoutProgressRow[]> {
  const rows = await db
    .select({ record: schema.scoutingRecords })
    .from(schema.scoutingRecords)
    .innerJoin(schema.matches, eq(schema.scoutingRecords.matchKey, schema.matches.key))
    .where(eq(schema.matches.eventKey, eventKey));

  const byScout = new Map<string, { scoutUserId: string | null; scoutDisplayName: string; matchKeys: Set<string>; recordCount: number }>();
  for (const { record } of rows) {
    const key = record.scoutUserId ?? `anon:${record.scoutDisplayName}`;
    const entry = byScout.get(key) ?? {
      scoutUserId: record.scoutUserId,
      scoutDisplayName: record.scoutDisplayName,
      matchKeys: new Set<string>(),
      recordCount: 0,
    };
    entry.recordCount += 1;
    entry.matchKeys.add(record.matchKey);
    byScout.set(key, entry);
  }

  return [...byScout.values()]
    .map((e) => ({
      scoutUserId: e.scoutUserId,
      scoutDisplayName: e.scoutDisplayName,
      recordCount: e.recordCount,
      matchCount: e.matchKeys.size,
    }))
    .sort((a, b) => b.recordCount - a.recordCount);
}
