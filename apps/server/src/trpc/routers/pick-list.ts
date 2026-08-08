import { z } from "zod";
import { reorderPickListSchema, updatePickListEntrySchema } from "@scout5090/shared";
import { exportPickListCsv, getPickList, reorderPickList, suggestOrder, updatePickListEntry } from "../../services/pick-list";
import { protectedProcedure, publicProcedure, router } from "../trpc";

export const pickListRouter = router({
  get: publicProcedure.input(z.object({ eventKey: z.string() })).query(({ input }) => getPickList(input.eventKey)),
  suggestOrder: publicProcedure.input(z.object({ eventKey: z.string() })).query(({ input }) => suggestOrder(input.eventKey)),
  exportCsv: publicProcedure.input(z.object({ eventKey: z.string() })).query(({ input }) => exportPickListCsv(input.eventKey)),

  reorder: protectedProcedure
    .input(reorderPickListSchema)
    .mutation(({ input }) => reorderPickList(input.eventKey, input.orderedTeamKeys)),

  updateEntry: protectedProcedure.input(updatePickListEntrySchema).mutation(({ input, ctx }) =>
    updatePickListEntry(input.eventKey, input.teamKey, { tags: input.tags, notes: input.notes }, ctx.user.id),
  ),
});
