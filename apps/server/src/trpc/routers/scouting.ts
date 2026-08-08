import { z } from "zod";
import { analyzeVideoInputSchema, submitScoutingRecordSchema } from "@scout5090/shared";
import { listByEvent, listByMatch, submitScoutingRecord } from "../../services/scouting";
import { analyzeMatchVideo } from "../../services/ai-review";
import { protectedProcedure, publicProcedure, router } from "../trpc";

export const scoutingRouter = router({
  submit: protectedProcedure.input(submitScoutingRecordSchema).mutation(({ input }) => submitScoutingRecord(input)),
  listByMatch: publicProcedure.input(z.object({ matchKey: z.string() })).query(({ input }) => listByMatch(input.matchKey)),
  listByEvent: publicProcedure.input(z.object({ eventKey: z.string() })).query(({ input }) => listByEvent(input.eventKey)),
  analyzeVideo: protectedProcedure.input(analyzeVideoInputSchema).mutation(({ input }) => analyzeMatchVideo(input)),
});
