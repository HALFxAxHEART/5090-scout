import { z } from "zod";
import { createSeasonSchema } from "@scout5090/shared";
import { createSeason, getActiveSeason, listSeasons, setActiveSeason } from "../../services/season";
import { adminProcedure, publicProcedure, router } from "../trpc";

export const seasonRouter = router({
  list: publicProcedure.query(() => listSeasons()),
  getActive: publicProcedure.query(() => getActiveSeason()),
  create: adminProcedure.input(createSeasonSchema).mutation(({ input }) => createSeason(input)),
  setActive: adminProcedure.input(z.object({ year: z.number().int() })).mutation(({ input }) => setActiveSeason(input.year)),
});
