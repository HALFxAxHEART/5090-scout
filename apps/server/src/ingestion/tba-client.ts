import { env } from "../config/env";
import { cachedFetch } from "./api-cache";
import { TokenBucket } from "./rate-limiter";

const TBA_BASE = "https://www.thebluealliance.com/api/v3";

// TBA is generous (a few req/sec sustained is fine) but we stay well under it — this is
// background ingestion + on-demand lookups, not a scraper.
const bucket = new TokenBucket(10, 5);

export interface TbaTeam {
  key: string;
  team_number: number;
  nickname: string | null;
  name: string | null;
  city: string | null;
  state_prov: string | null;
  country: string | null;
  rookie_year: number | null;
}

export interface TbaEvent {
  key: string;
  name: string;
  short_name: string | null;
  event_type: number;
  city: string | null;
  state_prov: string | null;
  country: string | null;
  start_date: string;
  end_date: string;
  year: number;
  week: number | null;
  timezone: string | null;
  webcasts: { type: string; channel: string }[] | null;
}

export interface TbaMatchVideo {
  type: string;
  key: string;
}

export interface TbaMatch {
  key: string;
  event_key: string;
  comp_level: string;
  set_number: number;
  match_number: number;
  alliances: {
    red: { team_keys: string[]; score: number };
    blue: { team_keys: string[]; score: number };
  };
  winning_alliance: string;
  score_breakdown: Record<string, unknown> | null;
  actual_time: number | null;
  videos: TbaMatchVideo[] | null;
}

export interface TbaRanking {
  rankings: {
    team_key: string;
    rank: number;
    record: { wins: number; losses: number; ties: number } | null;
    matches_played: number;
  }[];
}

async function tbaGet<T>(path: string): Promise<T> {
  await bucket.take();
  return cachedFetch<T>({
    source: "tba",
    endpointKey: path,
    url: `${TBA_BASE}${path}`,
    headers: { "X-TBA-Auth-Key": env.TBA_API_KEY, Accept: "application/json" },
  });
}

/** Turns a TBA `videos` entry into an embeddable URL, if we know the type. */
export function tbaVideoToUrl(video: TbaMatchVideo | undefined): string | null {
  if (!video) return null;
  if (video.type === "youtube") return `https://www.youtube.com/watch?v=${video.key}`;
  return null;
}

export const tbaClient = {
  getTeam: (teamKey: string) => tbaGet<TbaTeam>(`/team/${teamKey}`),
  getTeamEventsForYear: (teamKey: string, year: number) =>
    tbaGet<string[]>(`/team/${teamKey}/events/${year}/keys`),

  getEvent: (eventKey: string) => tbaGet<TbaEvent>(`/event/${eventKey}`),
  getEventTeamKeys: (eventKey: string) => tbaGet<string[]>(`/event/${eventKey}/teams/keys`),
  getEventMatches: (eventKey: string) => tbaGet<TbaMatch[]>(`/event/${eventKey}/matches`),
  getEventRankings: (eventKey: string) => tbaGet<TbaRanking>(`/event/${eventKey}/rankings`),
};
