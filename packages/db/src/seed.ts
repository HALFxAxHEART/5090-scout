import { db, schema } from "./index";
import { GAME_SCHEMAS } from "@scout5090/shared";

const existing = await db.select().from(schema.seasons).limit(1);
if (existing.length === 0) {
  await db.insert(schema.seasons).values({
    year: 2025,
    gameName: GAME_SCHEMAS[2025]!.gameName,
    gameSchema: GAME_SCHEMAS[2025],
    isActive: true,
  });
  console.log("Seeded 2025 REEFSCAPE season as active.");
} else {
  console.log("Seasons already exist, skipping seed.");
}
process.exit(0);
