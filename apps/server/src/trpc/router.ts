import { router } from "./trpc";
import { authRouter } from "./routers/auth";
import { seasonRouter } from "./routers/season";
import { eventRouter } from "./routers/event";
import { scoutingRouter } from "./routers/scouting";
import { pickListRouter } from "./routers/pick-list";

export const appRouter = router({
  auth: authRouter,
  season: seasonRouter,
  event: eventRouter,
  scouting: scoutingRouter,
  pickList: pickListRouter,
});

export type AppRouter = typeof appRouter;
