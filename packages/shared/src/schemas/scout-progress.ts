import { z } from "zod";

export const scoutProgressInputSchema = z.object({
  eventKey: z.string(),
});
export type ScoutProgressInput = z.infer<typeof scoutProgressInputSchema>;

export const scoutProgressRowSchema = z.object({
  scoutUserId: z.string().nullable(),
  scoutDisplayName: z.string(),
  recordCount: z.number(),
  matchCount: z.number(),
});
export type ScoutProgressRow = z.infer<typeof scoutProgressRowSchema>;
