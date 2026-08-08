import { z } from "zod";

export const gameSchemaElementSchema = z.object({
  id: z.string(),
  label: z.string(),
  type: z.enum(["counter", "boolean", "select"]),
  points: z.number().optional(),
  options: z.array(z.object({ value: z.string(), label: z.string(), points: z.number().optional() })).optional(),
  max: z.number().optional(),
});

export const gameSchemaPhaseSchema = z.object({
  id: z.string(),
  label: z.string(),
  elements: z.array(gameSchemaElementSchema),
});

export const gameSchemaSchema = z.object({
  year: z.number().int(),
  gameName: z.string(),
  phases: z.array(gameSchemaPhaseSchema),
});

export const createSeasonSchema = z.object({
  year: z.number().int(),
  gameName: z.string().min(1),
  gameSchema: gameSchemaSchema,
  makeActive: z.boolean().default(true),
});
export type CreateSeasonInput = z.infer<typeof createSeasonSchema>;

export const setVideoUrlSchema = z.object({
  matchKey: z.string(),
  videoUrl: z.string().url().nullable(),
});
export type SetVideoUrlInput = z.infer<typeof setVideoUrlSchema>;
