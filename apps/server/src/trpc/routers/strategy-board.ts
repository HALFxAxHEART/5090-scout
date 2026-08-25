import {
  applyTemplateInputSchema,
  getBoardForMatchInputSchema,
  listTemplatesInputSchema,
  saveBoardForMatchInputSchema,
  saveTemplateInputSchema,
} from "@scout5090/shared";
import { applyTemplate, getBoardForMatch, listTemplates, saveBoardForMatch, saveTemplate } from "../../services/strategy-board";
import { protectedProcedure, publicProcedure, router } from "../trpc";

export const strategyBoardRouter = router({
  getForMatch: publicProcedure.input(getBoardForMatchInputSchema).query(({ input }) => getBoardForMatch(input.matchKey)),
  listTemplates: publicProcedure.input(listTemplatesInputSchema).query(({ input }) => listTemplates(input.eventKey)),

  saveForMatch: protectedProcedure
    .input(saveBoardForMatchInputSchema)
    .mutation(({ input, ctx }) => saveBoardForMatch({ ...input, userId: ctx.user.id })),

  saveTemplate: protectedProcedure
    .input(saveTemplateInputSchema)
    .mutation(({ input, ctx }) => saveTemplate({ ...input, userId: ctx.user.id })),

  applyTemplate: protectedProcedure
    .input(applyTemplateInputSchema)
    .mutation(({ input, ctx }) => applyTemplate({ ...input, userId: ctx.user.id })),
});
