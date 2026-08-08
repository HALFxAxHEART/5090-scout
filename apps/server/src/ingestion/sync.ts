import { db, schema } from "@scout5090/db";
import { eq } from "drizzle-orm";
import { tbaClient, tbaVideoToUrl } from "./tba-client";
import { statboticsClient } from "./statbotics-client";
import { createLogger } from "../lib/logger";

const logger = createLogger("ingestion");

export function teamKeyFromNumber(teamNumber: number): string {
  return `frc${teamNumber}`;
}

async function upsertTeam(teamKey: string) {
  const team = await tbaClient.getTeam(teamKey);
  await db
    .insert(schema.teams)
    .values({
      key: team.key,
      teamNumber: team.team_number,
      nickname: team.nickname,
      name: team.name,
      city: team.city,
      stateProv: team.state_prov,
      country: team.country,
      rookieYear: team.rookie_year,
    })
    .onConflictDoUpdate({
      target: schema.teams.key,
      set: {
        nickname: team.nickname,
        name: team.name,
        city: team.city,
        stateProv: team.state_prov,
        country: team.country,
        rookieYear: team.rookie_year,
        updatedAt: new Date(),
      },
    });
}

/** Syncs one event end-to-end: event row, attendee teams, matches, rankings, EPA. */
export async function ingestEvent(eventKey: string): Promise<void> {
  logger.info("ingesting event", { eventKey });

  const event = await tbaClient.getEvent(eventKey);
  await db
    .insert(schema.events)
    .values({
      key: event.key,
      name: event.name,
      shortName: event.short_name,
      eventType: event.event_type,
      city: event.city,
      stateProv: event.state_prov,
      country: event.country,
      startDate: event.start_date,
      endDate: event.end_date,
      year: event.year,
      week: event.week,
      timezone: event.timezone,
      webcasts: event.webcasts,
    })
    .onConflictDoUpdate({
      target: schema.events.key,
      set: {
        name: event.name,
        shortName: event.short_name,
        eventType: event.event_type,
        city: event.city,
        stateProv: event.state_prov,
        country: event.country,
        startDate: event.start_date,
        endDate: event.end_date,
        week: event.week,
        timezone: event.timezone,
        webcasts: event.webcasts,
        updatedAt: new Date(),
      },
    });

  const teamKeys = await tbaClient.getEventTeamKeys(eventKey);
  for (const teamKey of teamKeys) {
    await upsertTeam(teamKey);
    await db.insert(schema.eventTeams).values({ eventKey, teamKey }).onConflictDoNothing();

    const statbotics = await statboticsClient
      .getTeamYear(Number(teamKey.replace("frc", "")), event.year)
      .catch(() => null);
    if (statbotics?.epa) {
      const total = typeof statbotics.epa.total_points === "number" ? statbotics.epa.total_points : statbotics.epa.total_points.mean;
      await db
        .insert(schema.epaSnapshots)
        .values({ teamKey, year: event.year, epaTotal: String(total), epaNorm: String(statbotics.epa.norm) })
        .onConflictDoUpdate({
          target: [schema.epaSnapshots.teamKey, schema.epaSnapshots.year],
          set: { epaTotal: String(total), epaNorm: String(statbotics.epa.norm), updatedAt: new Date() },
        });
    }
  }

  const matches = await tbaClient.getEventMatches(eventKey);
  for (const match of matches) {
    const videoUrl = tbaVideoToUrl(match.videos?.[0]);
    await db
      .insert(schema.matches)
      .values({
        key: match.key,
        eventKey: match.event_key,
        compLevel: match.comp_level,
        setNumber: match.set_number,
        matchNumber: match.match_number,
        redTeams: match.alliances.red.team_keys,
        blueTeams: match.alliances.blue.team_keys,
        redScore: match.alliances.red.score >= 0 ? match.alliances.red.score : null,
        blueScore: match.alliances.blue.score >= 0 ? match.alliances.blue.score : null,
        winningAlliance: match.winning_alliance || null,
        scoreBreakdown: match.score_breakdown,
        actualTime: match.actual_time ? new Date(match.actual_time * 1000) : null,
        videoUrl,
      })
      .onConflictDoUpdate({
        target: schema.matches.key,
        set: {
          redScore: match.alliances.red.score >= 0 ? match.alliances.red.score : null,
          blueScore: match.alliances.blue.score >= 0 ? match.alliances.blue.score : null,
          winningAlliance: match.winning_alliance || null,
          scoreBreakdown: match.score_breakdown,
          actualTime: match.actual_time ? new Date(match.actual_time * 1000) : null,
          // Don't clobber a manually-entered video URL with a null from TBA.
          ...(videoUrl ? { videoUrl } : {}),
          updatedAt: new Date(),
        },
      });
  }

  const rankings = await tbaClient.getEventRankings(eventKey).catch(() => null);
  if (rankings) {
    for (const r of rankings.rankings) {
      await db
        .insert(schema.rankings)
        .values({
          eventKey,
          teamKey: r.team_key,
          rank: r.rank,
          wins: r.record?.wins ?? 0,
          losses: r.record?.losses ?? 0,
          ties: r.record?.ties ?? 0,
          played: r.matches_played,
        })
        .onConflictDoUpdate({
          target: [schema.rankings.eventKey, schema.rankings.teamKey],
          set: {
            rank: r.rank,
            wins: r.record?.wins ?? 0,
            losses: r.record?.losses ?? 0,
            ties: r.record?.ties ?? 0,
            played: r.matches_played,
            updatedAt: new Date(),
          },
        });
    }
  }

  logger.info("event ingested", { eventKey, teams: teamKeys.length, matches: matches.length });
}

/** All events our own team is registered for in a given year. */
export async function ingestTeamYear(teamNumber: number, year: number): Promise<string[]> {
  const teamKey = teamKeyFromNumber(teamNumber);
  await upsertTeam(teamKey);
  const eventKeys = await tbaClient.getTeamEventsForYear(teamKey, year);
  for (const eventKey of eventKeys) {
    await ingestEvent(eventKey).catch((err) =>
      logger.error("event ingest failed", { eventKey, error: String(err) }),
    );
  }
  return eventKeys;
}

export async function refreshEventTeamKeys(eventKey: string): Promise<void> {
  const rows = await db
    .select({ teamKey: schema.eventTeams.teamKey })
    .from(schema.eventTeams)
    .where(eq(schema.eventTeams.eventKey, eventKey));
  logger.debug("event teams cached", { eventKey, count: rows.length });
}
