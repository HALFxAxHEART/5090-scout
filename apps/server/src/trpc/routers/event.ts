import { z } from "zod";
import { setVideoUrlSchema } from "@scout5090/shared";
import {
  getEventDetail,
  listEvents,
  setMatchVideoUrl,
  triggerIngestEvent,
  triggerIngestTeamYear,
} from "../../services/event";
import { adminProcedure, publicProcedure, protectedProcedure, router } from "../trpc";

export const eventRouter = router({
  list: publicProcedure.input(z.object({ year: z.number().int().optional() }).optional()).query(({ input }) => listEvents(input?.year)),
  get: publicProcedure.input(z.object({ eventKey: z.string() })).query(({ input }) => getEventDetail(input.eventKey)),

  setMatchVideoUrl: protectedProcedure
    .input(setVideoUrlSchema)
    .mutation(({ input }) => setMatchVideoUrl(input.matchKey, input.videoUrl)),

  ingestEvent: adminProcedure.input(z.object({ eventKey: z.string() })).mutation(({ input }) => triggerIngestEvent(input.eventKey)),

  ingestTeamYear: adminProcedure
    .input(z.object({ teamNumber: z.number().int(), year: z.number().int() }))
    .mutation(({ input }) => triggerIngestTeamYear(input.teamNumber, input.year)),
});
