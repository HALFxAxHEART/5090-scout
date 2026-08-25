import { driveDashboardInputSchema } from "@scout5090/shared";
import { getDriveDashboard } from "../../services/drive-dashboard";
import { publicProcedure, router } from "../trpc";

export const driveDashboardRouter = router({
  get: publicProcedure.input(driveDashboardInputSchema).query(({ input }) => getDriveDashboard(input)),
});
