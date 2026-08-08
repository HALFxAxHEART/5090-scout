import { z } from "zod";

export const reorderPickListSchema = z.object({
  eventKey: z.string(),
  orderedTeamKeys: z.array(z.string()).min(1),
});
export type ReorderPickListInput = z.infer<typeof reorderPickListSchema>;

export const updatePickListEntrySchema = z.object({
  eventKey: z.string(),
  teamKey: z.string(),
  tags: z.array(z.string()).optional(),
  notes: z.string().nullable().optional(),
});
export type UpdatePickListEntryInput = z.infer<typeof updatePickListEntrySchema>;
