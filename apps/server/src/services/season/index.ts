import { db, schema } from "@scout5090/db";
import { desc, eq } from "drizzle-orm";
import type { CreateSeasonInput } from "@scout5090/shared";
import type { GameSchema } from "@scout5090/shared";
import { NotFoundError } from "../../lib/errors";

export async function getActiveSeason() {
  const [season] = await db.select().from(schema.seasons).where(eq(schema.seasons.isActive, true)).limit(1);
  return season ?? null;
}

export async function requireActiveSeason(): Promise<{ year: number; gameName: string; gameSchema: GameSchema }> {
  const season = await getActiveSeason();
  if (!season) throw new NotFoundError("Active season");
  return { year: season.year, gameName: season.gameName, gameSchema: season.gameSchema as GameSchema };
}

export async function listSeasons() {
  return db.select().from(schema.seasons).orderBy(desc(schema.seasons.year));
}

export async function createSeason(input: CreateSeasonInput) {
  return db.transaction(async (tx) => {
    if (input.makeActive) {
      await tx.update(schema.seasons).set({ isActive: false }).where(eq(schema.seasons.isActive, true));
    }
    const [season] = await tx
      .insert(schema.seasons)
      .values({ year: input.year, gameName: input.gameName, gameSchema: input.gameSchema, isActive: input.makeActive })
      .onConflictDoUpdate({
        target: schema.seasons.year,
        set: { gameName: input.gameName, gameSchema: input.gameSchema, isActive: input.makeActive },
      })
      .returning();
    return season;
  });
}

export async function setActiveSeason(year: number) {
  return db.transaction(async (tx) => {
    await tx.update(schema.seasons).set({ isActive: false }).where(eq(schema.seasons.isActive, true));
    const [season] = await tx
      .update(schema.seasons)
      .set({ isActive: true })
      .where(eq(schema.seasons.year, year))
      .returning();
    if (!season) throw new NotFoundError("Season");
    return season;
  });
}
