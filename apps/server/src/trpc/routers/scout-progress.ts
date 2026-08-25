import { scoutProgressInputSchema } from "@scout5090/shared";
import { getScoutProgress } from "../../services/scout-progress";
import { adminProcedure, router } from "../trpc";

export const scoutProgressRouter = router({
  get: adminProcedure.input(scoutProgressInputSchema).query(({ input }) => getScoutProgress(input.eventKey)),
});
