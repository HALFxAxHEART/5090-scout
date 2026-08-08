import { z } from "zod";

export const scoutingDataValueSchema = z.union([z.number(), z.boolean(), z.string()]);

export const scoutingEventLogEntrySchema = z.object({
  elementId: z.string(),
  value: scoutingDataValueSchema,
  videoTimestampSeconds: z.number().nonnegative().nullable(),
  at: z.number(), // client-side epoch ms when the tap happened
});

/**
 * What both the direct tRPC submit path and the QR-scan import path send — the
 * client-generated `id` is what makes upserting either path idempotent.
 */
export const submitScoutingRecordSchema = z.object({
  id: z.string().uuid(),
  matchKey: z.string(),
  scoutedTeamKey: z.string(),
  allianceColor: z.enum(["red", "blue"]),
  station: z.number().int().min(1).max(3),
  seasonYear: z.number().int(),
  scoutUserId: z.string().uuid().nullable(),
  scoutDisplayName: z.string().min(1),
  data: z.record(z.string(), scoutingDataValueSchema),
  eventLog: z.array(scoutingEventLogEntrySchema).default([]),
  notes: z.string().nullable().optional(),
  syncedVia: z.enum(["direct", "qr"]),
  clientCreatedAt: z.string(), // ISO timestamp
});
export type SubmitScoutingRecordInput = z.infer<typeof submitScoutingRecordSchema>;

/**
 * Frames sampled client-side from a locally recorded match clip, sent for an AI-drafted
 * first pass at the scoring form. Only the sampled frames leave the device — the
 * recording itself is never uploaded.
 */
export const analyzeVideoFrameSchema = z.object({
  base64: z.string().min(1), // raw base64 JPEG bytes, no data: prefix
  timestampSeconds: z.number().nonnegative(),
});

export const analyzeVideoInputSchema = z.object({
  matchKey: z.string(),
  scoutedTeamKey: z.string(),
  allianceColor: z.enum(["red", "blue"]),
  station: z.number().int().min(1).max(3),
  frames: z.array(analyzeVideoFrameSchema).min(1).max(30),
});
export type AnalyzeVideoInput = z.infer<typeof analyzeVideoInputSchema>;

export const analyzeVideoResultSchema = z.object({
  data: z.record(z.string(), scoutingDataValueSchema),
  notes: z.string(),
});
export type AnalyzeVideoResult = z.infer<typeof analyzeVideoResultSchema>;
