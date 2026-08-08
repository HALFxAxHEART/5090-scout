import { z } from "zod";
import { submitScoutingRecordSchema } from "@scout5090/shared";
import { listByEvent, listByMatch, submitScoutingRecord } from "../../services/scouting";
import { protectedProcedure, publicProcedure, router } from "../trpc";

export const scoutingRouter = router({
  submit: protectedProcedure.input(submitScoutingRecordSchema).mutation(({ input }) => submitScoutingRecord(input)),
  listByMatch: publicProcedure.input(z.object({ matchKey: z.string() })).query(({ input }) => listByMatch(input.matchKey)),
  listByEvent: publicProcedure.input(z.object({ eventKey: z.string() })).query(({ input }) => listByEvent(input.eventKey)),
});
