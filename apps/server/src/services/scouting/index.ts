import { db, schema } from "@scout5090/db";
import { desc, eq } from "drizzle-orm";
import type { SubmitScoutingRecordInput } from "@scout5090/shared";

/**
 * Upsert on the client-generated id — this is the one path both the direct-submit form
 * and the QR-scan sync-station import call, and it must be safe to run twice for the
 * same record without creating a duplicate.
 */
export async function submitScoutingRecord(input: SubmitScoutingRecordInput) {
  const [record] = await db
    .insert(schema.scoutingRecords)
    .values({
      id: input.id,
      matchKey: input.matchKey,
      scoutedTeamKey: input.scoutedTeamKey,
      allianceColor: input.allianceColor,
      station: input.station,
      seasonYear: input.seasonYear,
      scoutUserId: input.scoutUserId,
      scoutDisplayName: input.scoutDisplayName,
      data: input.data,
      eventLog: input.eventLog,
      notes: input.notes ?? null,
      syncedVia: input.syncedVia,
      clientCreatedAt: new Date(input.clientCreatedAt),
    })
    .onConflictDoUpdate({
      target: schema.scoutingRecords.id,
      set: {
        data: input.data,
        eventLog: input.eventLog,
        notes: input.notes ?? null,
        syncedVia: input.syncedVia,
        updatedAt: new Date(),
      },
    })
    .returning();
  return record;
}

export async function listByMatch(matchKey: string) {
  return db
    .select()
    .from(schema.scoutingRecords)
    .where(eq(schema.scoutingRecords.matchKey, matchKey))
    .orderBy(desc(schema.scoutingRecords.createdAt));
}

export async function listByEvent(eventKey: string) {
  return db
    .select({ record: schema.scoutingRecords, match: schema.matches })
    .from(schema.scoutingRecords)
    .innerJoin(schema.matches, eq(schema.scoutingRecords.matchKey, schema.matches.key))
    .where(eq(schema.matches.eventKey, eventKey));
}
