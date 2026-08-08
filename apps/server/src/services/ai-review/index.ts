import Anthropic from "@anthropic-ai/sdk";
import { db, schema } from "@scout5090/db";
import { eq } from "drizzle-orm";
import type { AnalyzeVideoInput, AnalyzeVideoResult } from "@scout5090/shared";
import type { GameSchema, ScoringElement } from "@scout5090/shared";
import { env } from "../../config/env";
import { NotFoundError, ValidationError } from "../../lib/errors";
import { requireActiveSeason } from "../season";
import { createLogger } from "../../lib/logger";

const logger = createLogger("ai-review");

let client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!env.ANTHROPIC_API_KEY) {
    throw new ValidationError(
      "AI video review isn't set up yet — an admin needs to add an ANTHROPIC_API_KEY to the deployment.",
    );
  }
  client ??= new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  return client;
}

/** Every element of the active game schema becomes a required property Claude must fill in. */
function buildResponseSchema(gameSchema: GameSchema) {
  const properties: Record<string, unknown> = {};
  const required: string[] = [];

  for (const phase of gameSchema.phases) {
    for (const element of phase.elements) {
      properties[element.id] = elementJsonSchema(element);
      required.push(element.id);
    }
  }

  properties.notes = {
    type: "string",
    description: "One or two sentences on overall confidence and anything you couldn't tell from the frames.",
  };
  required.push("notes");

  return {
    type: "object" as const,
    properties,
    required,
    additionalProperties: false,
  };
}

function elementJsonSchema(element: ScoringElement) {
  if (element.type === "boolean") return { type: "boolean" };
  if (element.type === "select") {
    return { type: "string", enum: element.options?.map((o) => o.value) ?? [] };
  }
  return { type: "integer", minimum: 0, maximum: element.max ?? 100 };
}

function describeElements(gameSchema: GameSchema): string {
  return gameSchema.phases
    .map((phase) => {
      const lines = phase.elements.map((el) => {
        if (el.type === "select") {
          const options = el.options?.map((o) => `"${o.value}" (${o.label})`).join(", ") ?? "";
          return `- ${el.id}: one of ${options}`;
        }
        return `- ${el.id} (${el.type}): ${el.label}`;
      });
      return `${phase.label}:\n${lines.join("\n")}`;
    })
    .join("\n\n");
}

export async function analyzeMatchVideo(input: AnalyzeVideoInput): Promise<AnalyzeVideoResult> {
  const season = await requireActiveSeason();

  const [team] = await db.select().from(schema.teams).where(eq(schema.teams.key, input.scoutedTeamKey)).limit(1);
  if (!team) throw new NotFoundError("Team");

  const responseSchema = buildResponseSchema(season.gameSchema);
  const promptText = `You are helping an FRC (FIRST Robotics Competition) scout draft a scoring record from match video. \
The scouted robot is team ${team.teamNumber} (${input.allianceColor} alliance, station ${input.station}). \
Attached are ${input.frames.length} frames sampled across the match, in chronological order. \
Watch team ${team.teamNumber}'s robot specifically — ignore the other five robots on the field. \
This is the ${season.gameName} (${season.year}) game. Estimate a final tally for each field below based on what \
you can see across the frames. If you genuinely can't tell, make your best reasonable guess rather than leaving \
it at zero, but say so in "notes". This is a first-pass draft a human will review and correct, not a final score.

Fields to fill in:
${describeElements(season.gameSchema)}

Respond with a single JSON object matching the required schema — no extra commentary outside the JSON.`;

  const anthropic = getClient();
  const response = await anthropic.messages.create({
    model: "claude-opus-5",
    max_tokens: 2048,
    thinking: { type: "disabled" },
    output_config: {
      effort: "medium",
      format: { type: "json_schema", schema: responseSchema },
    },
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: promptText },
          ...input.frames.map((frame) => ({
            type: "image" as const,
            source: { type: "base64" as const, media_type: "image/jpeg" as const, data: frame.base64 },
          })),
        ],
      },
    ],
  });

  if (response.stop_reason === "refusal") {
    logger.warn("AI video review refused", { matchKey: input.matchKey, teamKey: input.scoutedTeamKey });
    throw new ValidationError("The AI declined to analyze this clip. Fill in the form manually instead.");
  }

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new ValidationError("AI review returned no usable output — fill in the form manually.");
  }

  const parsed = JSON.parse(textBlock.text) as Record<string, unknown>;
  const { notes, ...data } = parsed;

  logger.info("AI video review complete", { matchKey: input.matchKey, teamKey: input.scoutedTeamKey, frames: input.frames.length });

  return {
    data: data as AnalyzeVideoResult["data"],
    notes: typeof notes === "string" ? notes : "",
  };
}
