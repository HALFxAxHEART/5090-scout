import { db, schema } from "@scout5090/db";
import { desc, eq } from "drizzle-orm";
import { NotFoundError } from "../../lib/errors";
import { ingestEvent, ingestTeamYear, teamKeyFromNumber } from "../../ingestion/sync";

export async function listEvents(year?: number) {
  const query = db.select().from(schema.events).orderBy(desc(schema.events.startDate));
  if (year) return query.where(eq(schema.events.year, year));
  return query;
}

export async function getEventDetail(eventKey: string) {
  const [event] = await db.select().from(schema.events).where(eq(schema.events.key, eventKey)).limit(1);
  if (!event) throw new NotFoundError("Event");

  const teams = await db
    .select({ team: schema.teams })
    .from(schema.eventTeams)
    .innerJoin(schema.teams, eq(schema.eventTeams.teamKey, schema.teams.key))
    .where(eq(schema.eventTeams.eventKey, eventKey));

  const matches = await db
    .select()
    .from(schema.matches)
    .where(eq(schema.matches.eventKey, eventKey))
    .orderBy(schema.matches.matchNumber);

  return { event, teams: teams.map((t) => t.team), matches };
}

export async function setMatchVideoUrl(matchKey: string, videoUrl: string | null) {
  const [match] = await db
    .update(schema.matches)
    .set({ videoUrl, updatedAt: new Date() })
    .where(eq(schema.matches.key, matchKey))
    .returning();
  if (!match) throw new NotFoundError("Match");
  return match;
}

export async function triggerIngestEvent(eventKey: string) {
  await ingestEvent(eventKey);
  return getEventDetail(eventKey);
}

export async function triggerIngestTeamYear(teamNumber: number, year: number) {
  return ingestTeamYear(teamNumber, year);
}

export { teamKeyFromNumber };
