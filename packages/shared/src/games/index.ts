import type { GameSchema } from "./types";
import { GAME_2025_REEFSCAPE } from "./2025";
import { GAME_2026_REBUILT } from "./2026";

export * from "./types";

/** Starting-point schemas by year. Add a new file + entry here each Kickoff. */
export const GAME_SCHEMAS: Record<number, GameSchema> = {
  2025: GAME_2025_REEFSCAPE,
  2026: GAME_2026_REBUILT,
};

/** Every element across all phases, in phase order — handy for scoring/aggregation code. */
export function flattenElements(schema: GameSchema) {
  return schema.phases.flatMap((phase) => phase.elements.map((element) => ({ phase, element })));
}

/** Max points a single element can contribute, used by aggregation and the pick-list formula. */
export function elementMaxPoints(element: GameSchema["phases"][number]["elements"][number]): number {
  if (element.type === "boolean") return element.points ?? 0;
  if (element.type === "select") return Math.max(0, ...(element.options ?? []).map((o) => o.points ?? 0));
  // counter: unbounded unless `max` is set
  return element.max ? element.max * (element.points ?? 0) : Infinity;
}

type ScoutingData = Record<string, number | boolean | string>;

function scoreElement(element: GameSchema["phases"][number]["elements"][number], value: unknown): number {
  if (value === undefined || value === null) return 0;
  if (element.type === "boolean") return value ? (element.points ?? 0) : 0;
  if (element.type === "counter") return (typeof value === "number" ? value : 0) * (element.points ?? 0);
  if (element.type === "select") {
    const option = element.options?.find((o) => o.value === value);
    return option?.points ?? 0;
  }
  return 0;
}

/** Total points a scouting record's `data` implies, broken down by phase id. */
export function computeScoreByPhase(schema: GameSchema, data: ScoutingData): Record<string, number> {
  const result: Record<string, number> = {};
  for (const phase of schema.phases) {
    result[phase.id] = phase.elements.reduce((sum, element) => sum + scoreElement(element, data[element.id]), 0);
  }
  return result;
}

/** Total points a scouting record's `data` implies, summed across all phases. */
export function computeTotalScore(schema: GameSchema, data: ScoutingData): number {
  return Object.values(computeScoreByPhase(schema, data)).reduce((a, b) => a + b, 0);
}
