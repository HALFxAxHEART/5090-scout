import { z } from "zod";

export const strategyPhaseSchema = z.enum(["auto", "active", "inactive"]);
export type StrategyPhase = z.infer<typeof strategyPhaseSchema>;

export const strokeSchema = z.object({
  color: z.string(),
  // Fractions of canvas width/height (0-1), so a saved board redraws correctly at any
  // screen size instead of being pinned to the pixel dimensions it was drawn at.
  points: z.array(z.object({ x: z.number(), y: z.number() })).min(2),
});
export type Stroke = z.infer<typeof strokeSchema>;

export const boardDataSchema = z.object({
  auto: z.array(strokeSchema),
  active: z.array(strokeSchema),
  inactive: z.array(strokeSchema),
});
export type BoardData = z.infer<typeof boardDataSchema>;

export const EMPTY_BOARD_DATA: BoardData = { auto: [], active: [], inactive: [] };

export const strategyBoardSchema = z.object({
  id: z.string(),
  eventKey: z.string(),
  matchKey: z.string().nullable(),
  name: z.string(),
  boardData: boardDataSchema,
  createdBy: z.string().nullable(),
  updatedAt: z.string(),
});
export type StrategyBoard = z.infer<typeof strategyBoardSchema>;

export const getBoardForMatchInputSchema = z.object({ matchKey: z.string() });
export const listTemplatesInputSchema = z.object({ eventKey: z.string() });

export const saveBoardForMatchInputSchema = z.object({
  matchKey: z.string(),
  boardData: boardDataSchema,
});
export type SaveBoardForMatchInput = z.infer<typeof saveBoardForMatchInputSchema>;

export const saveTemplateInputSchema = z.object({
  eventKey: z.string(),
  name: z.string().min(1),
  boardData: boardDataSchema,
});
export type SaveTemplateInput = z.infer<typeof saveTemplateInputSchema>;

export const applyTemplateInputSchema = z.object({
  templateId: z.string(),
  matchKey: z.string(),
});
export type ApplyTemplateInput = z.infer<typeof applyTemplateInputSchema>;
