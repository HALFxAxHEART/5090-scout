import { db, schema } from "@scout5090/db";
import { and, asc, eq, inArray } from "drizzle-orm";
import type { DriveDashboardInput, DriveDashboardResult, DriveDashboardTeam } from "@scout5090/shared";
import type { GameSchema } from "@scout5090/shared";
import { NotFoundError } from "../../lib/errors";
import { env } from "../../config/env";
import { teamKeyFromNumber } from "../../ingestion/sync";
import { computeScoutedAverages } from "../scouting-stats";

export async function getDriveDashboard(input: DriveDashboardInput): Promise<DriveDashboardResult> {
  const { eventKey } = input;
  const [event] = await db.select().from(schema.events).where(eq(schema.events.key, eventKey)).limit(1);
  if (!event) throw new NotFoundError("Event");

  const teamKey = input.teamKey ?? teamKeyFromNumber(env.TEAM_NUMBER);

  const eventMatches = await db
    .select()
    .from(schema.matches)
    .where(eq(schema.matches.eventKey, eventKey))
    .orderBy(asc(schema.matches.matchNumber));

  const teamMatches = eventMatches.filter((m) => m.redTeams.includes(teamKey) || m.blueTeams.includes(teamKey));
  const upcoming = teamMatches.find((m) => m.redScore === null || m.blueScore === null);
  const chosen = upcoming ?? teamMatches[teamMatches.length - 1];

  if (!chosen) {
    return { ownTeamKey: teamKey, match: null, teams: [] };
  }

  const roster: { teamKey: string; allianceColor: "red" | "blue"; station: number }[] = [
    ...chosen.redTeams.map((k, i) => ({ teamKey: k, allianceColor: "red" as const, station: i + 1 })),
    ...chosen.blueTeams.map((k, i) => ({ teamKey: k, allianceColor: "blue" as const, station: i + 1 })),
  ];
  const teamKeys = roster.map((t) => t.teamKey);

  const teamRows = await db.select().from(schema.teams).where(inArray(schema.teams.key, teamKeys));
  const teamByKey = new Map(teamRows.map((t) => [t.key, t]));

  const epaRows = await db
    .select()
    .from(schema.epaSnapshots)
    .where(and(eq(schema.epaSnapshots.year, event.year), inArray(schema.epaSnapshots.teamKey, teamKeys)));
  const epaByTeam = new Map(epaRows.map((e) => [e.teamKey, e]));

  const [season] = await db.select().from(schema.seasons).where(eq(schema.seasons.year, event.year)).limit(1);
  const gameSchema = season?.gameSchema as GameSchema | undefined;
  const scoutedByTeam = await computeScoutedAverages(eventKey, teamKeys, gameSchema);

  const teams: DriveDashboardTeam[] = roster.map((t) => {
    const team = teamByKey.get(t.teamKey);
    const epa = epaByTeam.get(t.teamKey);
    const scouted = scoutedByTeam.get(t.teamKey);
    return {
      teamKey: t.teamKey,
      teamNumber: team?.teamNumber ?? 0,
      nickname: team?.nickname ?? null,
      allianceColor: t.allianceColor,
      station: t.station,
      epaTotal: epa?.epaTotal ? Number(epa.epaTotal) : null,
      epaNorm: epa?.epaNorm ? Number(epa.epaNorm) : null,
      scoutedAvgTotal: scouted?.scoutedAvgTotal ?? null,
      scoutedMatchCount: scouted?.scoutedMatchCount ?? 0,
    };
  });

  return {
    ownTeamKey: teamKey,
    match: {
      key: chosen.key,
      compLevel: chosen.compLevel,
      matchNumber: chosen.matchNumber,
      isUpcoming: upcoming !== undefined,
    },
    teams,
  };
}
