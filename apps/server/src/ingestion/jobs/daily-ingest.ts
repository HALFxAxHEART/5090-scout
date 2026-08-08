import { env } from "../../config/env";
import { ingestTeamYear } from "../sync";
import { createLogger } from "../../lib/logger";

const logger = createLogger("daily-ingest");

export async function runDailyIngest(): Promise<void> {
  const year = new Date().getFullYear();
  logger.info("daily ingest starting", { teamNumber: env.TEAM_NUMBER, year });
  const eventKeys = await ingestTeamYear(env.TEAM_NUMBER, year);
  logger.info("daily ingest finished", { eventCount: eventKeys.length });
}

if (import.meta.main) {
  await runDailyIngest();
  process.exit(0);
}
