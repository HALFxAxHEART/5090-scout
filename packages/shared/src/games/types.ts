export type ScoringElementType = "counter" | "boolean" | "select";

export interface ScoringSelectOption {
  value: string;
  label: string;
  points?: number;
}

export interface ScoringElement {
  /** Stable key — used as the field name in a scouting record's `data` and `eventLog`. */
  id: string;
  label: string;
  type: ScoringElementType;
  /** Points per unit (counter) or when true (boolean). Ignored for "select" — use option points. */
  points?: number;
  /** "select" only. */
  options?: ScoringSelectOption[];
  /** "counter" only — caps the increment buttons, e.g. a robot can't score more than N. */
  max?: number;
}

export interface GamePhase {
  id: string; // e.g. "auto" | "teleop" | "endgame"
  label: string;
  elements: ScoringElement[];
}

/**
 * The data-driven definition a season's scouting form renders from. One of these ships
 * per year in this package as a starting point; the live copy an event actually uses
 * lives in the `seasons.game_schema` DB column so it can be tweaked without a redeploy.
 */
export interface GameSchema {
  year: number;
  gameName: string;
  phases: GamePhase[];
}
