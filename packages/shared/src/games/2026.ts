import type { GameSchema } from "./types";

/**
 * 2026 REBUILT (presented by Haas): alliances shoot FUEL balls into their HUB and climb
 * a 3-level TOWER. Game facts sourced the same way as the Kickoff planning app's
 * GAME_2026_REBUILT breakdown (public post-kickoff summaries, cross-checked for internal
 * consistency — not verified against the official manual PDF; re-check before relying on
 * it for real strategy calls). Simplified for live scouting: HUB scoring is tallied per
 * match phase rather than per alternating shift (impractical to track shift-by-shift by
 * hand mid-match), and only the best Teleop/Endgame TOWER climb is recorded rather than
 * every intermediate attempt.
 */
export const GAME_2026_REBUILT: GameSchema = {
  year: 2026,
  gameName: "REBUILT",
  phases: [
    {
      id: "auto",
      label: "Autonomous",
      elements: [
        { id: "auto_fuel_hub", label: "FUEL — HUB", type: "counter", points: 1 },
        { id: "auto_tower_climb", label: "Tower — Level 1 climb", type: "boolean", points: 15 },
      ],
    },
    {
      id: "teleop",
      label: "Teleop",
      elements: [
        { id: "teleop_fuel_hub", label: "FUEL — HUB", type: "counter", points: 1 },
        { id: "defense_played", label: "Played defense", type: "boolean" },
      ],
    },
    {
      id: "endgame",
      label: "Endgame",
      elements: [
        {
          id: "endgame_climb",
          label: "Tower climb (best, teleop/endgame)",
          type: "select",
          options: [
            { value: "none", label: "None", points: 0 },
            { value: "l1", label: "Level 1", points: 10 },
            { value: "l2", label: "Level 2", points: 20 },
            { value: "l3", label: "Level 3", points: 30 },
          ],
        },
        { id: "died", label: "Robot died / disabled", type: "boolean" },
      ],
    },
  ],
};
