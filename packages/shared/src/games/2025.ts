import type { GameSchema } from "./types";

/**
 * Approximate REEFSCAPE (2025) scoring — ships as a working example/test fixture for
 * the dynamic form and QR/offline pipeline. Double-check point values against the
 * official game manual before scoring a real event with it.
 */
export const GAME_2025_REEFSCAPE: GameSchema = {
  year: 2025,
  gameName: "REEFSCAPE",
  phases: [
    {
      id: "auto",
      label: "Autonomous",
      elements: [
        { id: "auto_left_start", label: "Left starting line", type: "boolean", points: 3 },
        { id: "auto_coral_l1", label: "Coral — L1", type: "counter", points: 2 },
        { id: "auto_coral_l2", label: "Coral — L2", type: "counter", points: 3 },
        { id: "auto_coral_l3", label: "Coral — L3", type: "counter", points: 4 },
        { id: "auto_coral_l4", label: "Coral — L4", type: "counter", points: 5 },
        { id: "auto_algae_processor", label: "Algae — Processor", type: "counter", points: 6 },
        { id: "auto_algae_net", label: "Algae — Net", type: "counter", points: 4 },
      ],
    },
    {
      id: "teleop",
      label: "Teleop",
      elements: [
        { id: "teleop_coral_l1", label: "Coral — L1", type: "counter", points: 2 },
        { id: "teleop_coral_l2", label: "Coral — L2", type: "counter", points: 3 },
        { id: "teleop_coral_l3", label: "Coral — L3", type: "counter", points: 4 },
        { id: "teleop_coral_l4", label: "Coral — L4", type: "counter", points: 5 },
        { id: "teleop_algae_processor", label: "Algae — Processor", type: "counter", points: 6 },
        { id: "teleop_algae_net", label: "Algae — Net", type: "counter", points: 4 },
        { id: "defense_played", label: "Played defense", type: "boolean" },
      ],
    },
    {
      id: "endgame",
      label: "Endgame",
      elements: [
        {
          id: "endgame_climb",
          label: "Climb / park",
          type: "select",
          options: [
            { value: "none", label: "None", points: 0 },
            { value: "park", label: "Parked", points: 2 },
            { value: "shallow_cage", label: "Shallow cage", points: 6 },
            { value: "deep_cage", label: "Deep cage", points: 12 },
          ],
        },
        { id: "died", label: "Robot died / disabled", type: "boolean" },
      ],
    },
  ],
};
