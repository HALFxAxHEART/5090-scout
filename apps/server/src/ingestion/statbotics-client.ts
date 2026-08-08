import { env } from "../config/env";
import { cachedFetch } from "./api-cache";
import { TokenBucket } from "./rate-limiter";

// Statbotics is public/unauthenticated but we still rate-limit ourselves as a good citizen.
const bucket = new TokenBucket(10, 5);

export interface StatboticsTeamYear {
  team: number;
  year: number;
  epa: {
    total_points: { mean: number } | number;
    norm: number;
  } | null;
}

async function statboticsGet<T>(path: string): Promise<T> {
  await bucket.take();
  return cachedFetch<T>({
    source: "statbotics",
    endpointKey: path,
    url: `${env.STATBOTICS_API_BASE}${path}`,
    headers: { Accept: "application/json" },
  });
}

export const statboticsClient = {
  getTeamYear: (teamNumber: number, year: number) =>
    statboticsGet<StatboticsTeamYear>(`/team_year/${teamNumber}/${year}`),
};
