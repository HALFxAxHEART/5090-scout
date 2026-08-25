import { db, schema } from "@scout5090/db";
import { and, eq, isNull } from "drizzle-orm";
import type {
  ApplyTemplateInput,
  BoardData,
  SaveBoardForMatchInput,
  SaveTemplateInput,
  StrategyBoard,
} from "@scout5090/shared";
import { NotFoundError } from "../../lib/errors";

type BoardRow = typeof schema.strategyBoards.$inferSelect;

function toStrategyBoard(row: BoardRow): StrategyBoard {
  return {
    id: row.id,
    eventKey: row.eventKey,
    matchKey: row.matchKey,
    name: row.name,
    boardData: row.boardData as BoardData,
    createdBy: row.createdBy,
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function getBoardForMatch(matchKey: string): Promise<StrategyBoard | null> {
  const [row] = await db.select().from(schema.strategyBoards).where(eq(schema.strategyBoards.matchKey, matchKey)).limit(1);
  return row ? toStrategyBoard(row) : null;
}

export async function listTemplates(eventKey: string): Promise<StrategyBoard[]> {
  const rows = await db
    .select()
    .from(schema.strategyBoards)
    .where(and(eq(schema.strategyBoards.eventKey, eventKey), isNull(schema.strategyBoards.matchKey)));
  return rows.map(toStrategyBoard);
}

export async function saveBoardForMatch(
  input: SaveBoardForMatchInput & { userId: string | null },
): Promise<StrategyBoard> {
  const [match] = await db.select().from(schema.matches).where(eq(schema.matches.key, input.matchKey)).limit(1);
  if (!match) throw new NotFoundError("Match");

  const [row] = await db
    .insert(schema.strategyBoards)
    .values({
      eventKey: match.eventKey,
      matchKey: input.matchKey,
      name: `${match.compLevel.toUpperCase()} ${match.matchNumber} strategy`,
      boardData: input.boardData,
      createdBy: input.userId,
    })
    .onConflictDoUpdate({
      target: schema.strategyBoards.matchKey,
      set: { boardData: input.boardData, updatedAt: new Date() },
    })
    .returning();
  if (!row) throw new NotFoundError("Strategy board");
  return toStrategyBoard(row);
}

export async function saveTemplate(input: SaveTemplateInput & { userId: string | null }): Promise<StrategyBoard> {
  const [row] = await db
    .insert(schema.strategyBoards)
    .values({
      eventKey: input.eventKey,
      matchKey: null,
      name: input.name,
      boardData: input.boardData,
      createdBy: input.userId,
    })
    .returning();
  if (!row) throw new NotFoundError("Strategy board");
  return toStrategyBoard(row);
}

export async function applyTemplate(input: ApplyTemplateInput & { userId: string | null }): Promise<StrategyBoard> {
  const [template] = await db.select().from(schema.strategyBoards).where(eq(schema.strategyBoards.id, input.templateId)).limit(1);
  if (!template) throw new NotFoundError("Template");
  return saveBoardForMatch({ matchKey: input.matchKey, boardData: template.boardData as BoardData, userId: input.userId });
}
