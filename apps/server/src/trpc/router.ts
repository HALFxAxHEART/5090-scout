import { router } from "./trpc";
import { authRouter } from "./routers/auth";
import { seasonRouter } from "./routers/season";
import { eventRouter } from "./routers/event";
import { scoutingRouter } from "./routers/scouting";
import { pickListRouter } from "./routers/pick-list";
import { driveDashboardRouter } from "./routers/drive-dashboard";
import { scoutProgressRouter } from "./routers/scout-progress";
import { strategyBoardRouter } from "./routers/strategy-board";

export const appRouter = router({
  auth: authRouter,
  season: seasonRouter,
  event: eventRouter,
  scouting: scoutingRouter,
  pickList: pickListRouter,
  driveDashboard: driveDashboardRouter,
  scoutProgress: scoutProgressRouter,
  strategyBoard: strategyBoardRouter,
});

export type AppRouter = typeof appRouter;
