import { z } from "zod";

export const driveDashboardInputSchema = z.object({
  eventKey: z.string(),
  teamKey: z.string().optional(),
});
export type DriveDashboardInput = z.infer<typeof driveDashboardInputSchema>;

export const driveDashboardTeamSchema = z.object({
  teamKey: z.string(),
  teamNumber: z.number(),
  nickname: z.string().nullable(),
  allianceColor: z.enum(["red", "blue"]),
  station: z.number(),
  epaTotal: z.number().nullable(),
  epaNorm: z.number().nullable(),
  scoutedAvgTotal: z.number().nullable(),
  scoutedMatchCount: z.number(),
});
export type DriveDashboardTeam = z.infer<typeof driveDashboardTeamSchema>;

export const driveDashboardResultSchema = z.object({
  ownTeamKey: z.string(),
  match: z
    .object({
      key: z.string(),
      compLevel: z.string(),
      matchNumber: z.number(),
      isUpcoming: z.boolean(),
    })
    .nullable(),
  teams: z.array(driveDashboardTeamSchema),
});
export type DriveDashboardResult = z.infer<typeof driveDashboardResultSchema>;
