import { db, schema } from "./index";
import { GAME_SCHEMAS } from "@scout5090/shared";
import { eq } from "drizzle-orm";

/** Inserts a season from the bundled starting-point schema if it doesn't exist yet.
 * Never touches a season that's already there, so it's safe to run on every deploy
 * without clobbering anything Michel has since edited via the admin panel. */
async function ensureSeasonSeeded(year: number, makeActive: boolean) {
  const [existing] = await db.select().from(schema.seasons).where(eq(schema.seasons.year, year)).limit(1);
  if (existing) {
    console.log(`Season ${year} already exists, skipping.`);
    return;
  }
  const gameSchema = GAME_SCHEMAS[year];
  if (!gameSchema) return;

  await db.transaction(async (tx) => {
    if (makeActive) {
      await tx.update(schema.seasons).set({ isActive: false }).where(eq(schema.seasons.isActive, true));
    }
    await tx.insert(schema.seasons).values({
      year,
      gameName: gameSchema.gameName,
      gameSchema,
      isActive: makeActive,
    });
  });
  console.log(`Seeded ${year} ${gameSchema.gameName} season${makeActive ? " (active)" : ""}.`);
}

await ensureSeasonSeeded(2025, false);
await ensureSeasonSeeded(2026, true);
process.exit(0);
