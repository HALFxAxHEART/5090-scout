import { db, schema } from "@scout5090/db";
import { and, eq, inArray } from "drizzle-orm";
import { computeTotalScore, type GameSchema } from "@scout5090/shared";

export interface ScoutedAverage {
  scoutedAvgTotal: number | null;
  scoutedMatchCount: number;
}

/** Per-team average scouted total (and match count) at an event, from raw scouting records. */
export async function computeScoutedAverages(
  eventKey: string,
  teamKeys: string[],
  gameSchema: GameSchema | undefined,
): Promise<Map<string, ScoutedAverage>> {
  const result = new Map<string, ScoutedAverage>();
  for (const teamKey of teamKeys) result.set(teamKey, { scoutedAvgTotal: null, scoutedMatchCount: 0 });
  if (teamKeys.length === 0 || !gameSchema) return result;

  const scoutRows = await db
    .select({ record: schema.scoutingRecords })
    .from(schema.scoutingRecords)
    .innerJoin(schema.matches, eq(schema.scoutingRecords.matchKey, schema.matches.key))
    .where(and(eq(schema.matches.eventKey, eventKey), inArray(schema.scoutingRecords.scoutedTeamKey, teamKeys)));

  const totalsByTeam = new Map<string, number[]>();
  for (const { record } of scoutRows) {
    const total = computeTotalScore(gameSchema, record.data as Record<string, number | boolean | string>);
    const list = totalsByTeam.get(record.scoutedTeamKey) ?? [];
    list.push(total);
    totalsByTeam.set(record.scoutedTeamKey, list);
  }

  for (const teamKey of teamKeys) {
    const totals = totalsByTeam.get(teamKey) ?? [];
    result.set(teamKey, {
      scoutedAvgTotal: totals.length ? totals.reduce((a, b) => a + b, 0) / totals.length : null,
      scoutedMatchCount: totals.length,
    });
  }
  return result;
}
