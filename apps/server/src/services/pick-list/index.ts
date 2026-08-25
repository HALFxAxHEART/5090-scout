import { db, schema } from "@scout5090/db";
import { and, asc, eq, inArray } from "drizzle-orm";
import type { GameSchema } from "@scout5090/shared";
import { NotFoundError } from "../../lib/errors";
import { computeScoutedAverages } from "../scouting-stats";

async function seedEntriesIfEmpty(eventKey: string) {
  const existing = await db
    .select({ teamKey: schema.pickListEntries.teamKey })
    .from(schema.pickListEntries)
    .where(eq(schema.pickListEntries.eventKey, eventKey));
  if (existing.length > 0) return;

  const teams = await db
    .select({ teamKey: schema.eventTeams.teamKey })
    .from(schema.eventTeams)
    .innerJoin(schema.teams, eq(schema.eventTeams.teamKey, schema.teams.key))
    .where(eq(schema.eventTeams.eventKey, eventKey))
    .orderBy(asc(schema.teams.teamNumber));

  if (teams.length === 0) return;
  await db
    .insert(schema.pickListEntries)
    .values(teams.map((t, i) => ({ eventKey, teamKey: t.teamKey, position: i })))
    .onConflictDoNothing();
}

interface PickListRow {
  teamKey: string;
  teamNumber: number;
  nickname: string | null;
  position: number;
  tags: string[];
  notes: string | null;
  tbaRank: number | null;
  epaNorm: number | null;
  epaTotal: number | null;
  scoutedAvgTotal: number | null;
  scoutedMatchCount: number;
}

export async function getPickList(eventKey: string): Promise<PickListRow[]> {
  const [event] = await db.select().from(schema.events).where(eq(schema.events.key, eventKey)).limit(1);
  if (!event) throw new NotFoundError("Event");

  await seedEntriesIfEmpty(eventKey);

  const [season] = await db.select().from(schema.seasons).where(eq(schema.seasons.year, event.year)).limit(1);
  const [activeSeason] = season ? [season] : await db.select().from(schema.seasons).where(eq(schema.seasons.isActive, true)).limit(1);
  const gameSchema = activeSeason?.gameSchema as GameSchema | undefined;

  const entries = await db
    .select({
      teamKey: schema.pickListEntries.teamKey,
      position: schema.pickListEntries.position,
      tags: schema.pickListEntries.tags,
      notes: schema.pickListEntries.notes,
      teamNumber: schema.teams.teamNumber,
      nickname: schema.teams.nickname,
    })
    .from(schema.pickListEntries)
    .innerJoin(schema.teams, eq(schema.pickListEntries.teamKey, schema.teams.key))
    .where(eq(schema.pickListEntries.eventKey, eventKey))
    .orderBy(asc(schema.pickListEntries.position));

  if (entries.length === 0) return [];
  const teamKeys = entries.map((e) => e.teamKey);

  const rankings = await db
    .select()
    .from(schema.rankings)
    .where(and(eq(schema.rankings.eventKey, eventKey), inArray(schema.rankings.teamKey, teamKeys)));
  const rankByTeam = new Map(rankings.map((r) => [r.teamKey, r.rank]));

  const epa = await db
    .select()
    .from(schema.epaSnapshots)
    .where(and(eq(schema.epaSnapshots.year, event.year), inArray(schema.epaSnapshots.teamKey, teamKeys)));
  const epaByTeam = new Map(epa.map((e) => [e.teamKey, e]));

  const scoutedByTeam = await computeScoutedAverages(eventKey, teamKeys, gameSchema);

  return entries.map((e) => {
    const epaRow = epaByTeam.get(e.teamKey);
    const scouted = scoutedByTeam.get(e.teamKey);
    return {
      teamKey: e.teamKey,
      teamNumber: e.teamNumber,
      nickname: e.nickname,
      position: e.position,
      tags: e.tags,
      notes: e.notes,
      tbaRank: rankByTeam.get(e.teamKey) ?? null,
      epaNorm: epaRow?.epaNorm ? Number(epaRow.epaNorm) : null,
      epaTotal: epaRow?.epaTotal ? Number(epaRow.epaTotal) : null,
      scoutedAvgTotal: scouted?.scoutedAvgTotal ?? null,
      scoutedMatchCount: scouted?.scoutedMatchCount ?? 0,
    };
  });
}

/** Weighted-formula ordering suggestion (EPA-norm 50% / scouted-avg 30% / rank-percentile 20%) — not persisted. */
export async function suggestOrder(eventKey: string): Promise<string[]> {
  const rows = await getPickList(eventKey);
  const teamCount = rows.length;
  const maxEpa = Math.max(1e-9, ...rows.map((r) => r.epaNorm ?? 0));
  const maxScouted = Math.max(1e-9, ...rows.map((r) => r.scoutedAvgTotal ?? 0));

  const scored = rows.map((r) => {
    const epaScore = (r.epaNorm ?? 0) / maxEpa;
    const scoutedScore = (r.scoutedAvgTotal ?? 0) / maxScouted;
    const rankScore = r.tbaRank && teamCount > 1 ? 1 - (r.tbaRank - 1) / (teamCount - 1) : 0.5;
    return { teamKey: r.teamKey, score: epaScore * 0.5 + scoutedScore * 0.3 + rankScore * 0.2 };
  });

  return scored.sort((a, b) => b.score - a.score).map((s) => s.teamKey);
}

export async function reorderPickList(eventKey: string, orderedTeamKeys: string[]) {
  await seedEntriesIfEmpty(eventKey);
  await db.transaction(async (tx) => {
    for (const [index, teamKey] of orderedTeamKeys.entries()) {
      await tx
        .update(schema.pickListEntries)
        .set({ position: index, updatedAt: new Date() })
        .where(and(eq(schema.pickListEntries.eventKey, eventKey), eq(schema.pickListEntries.teamKey, teamKey)));
    }
  });
}

export async function updatePickListEntry(
  eventKey: string,
  teamKey: string,
  updates: { tags?: string[]; notes?: string | null },
  updatedBy: string,
) {
  await seedEntriesIfEmpty(eventKey);
  const [row] = await db
    .update(schema.pickListEntries)
    .set({ ...updates, updatedBy, updatedAt: new Date() })
    .where(and(eq(schema.pickListEntries.eventKey, eventKey), eq(schema.pickListEntries.teamKey, teamKey)))
    .returning();
  if (!row) throw new NotFoundError("Pick list entry");
  return row;
}

export async function exportPickListCsv(eventKey: string): Promise<string> {
  const rows = await getPickList(eventKey);
  const header = "position,team_number,nickname,tba_rank,epa_norm,scouted_avg_total,scouted_matches,tags,notes";
  const lines = rows.map((r) =>
    [
      r.position + 1,
      r.teamNumber,
      csvEscape(r.nickname ?? ""),
      r.tbaRank ?? "",
      r.epaNorm ?? "",
      r.scoutedAvgTotal?.toFixed(1) ?? "",
      r.scoutedMatchCount,
      csvEscape(r.tags.join(" ")),
      csvEscape(r.notes ?? ""),
    ].join(","),
  );
  return [header, ...lines].join("\n");
}

function csvEscape(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}
