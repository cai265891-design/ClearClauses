import { createLogger } from "@/lib/logger";
import { callChatCompletion } from "./llm-client";
import { CLAUSE_REWRITE_SYSTEM_PROMPT } from "./prompts";
import { clauseRewriteResultSchema } from "./schemas";
import type { ClauseRewritePayload, ClauseRewriteResult } from "./types";

interface OptimizeParams {
  payload: ClauseRewritePayload;
  model?: string;
}

export async function runClauseRewrite(params: OptimizeParams): Promise<{
  clause: ClauseRewriteResult;
  traceId: string;
  raw: unknown;
}> {
  const { payload } = params;
  const model = params.model || process.env.LLM_GENERATE_MODEL || "gpt-5.1-2025-11-13";
  const logger = createLogger("contract-optimize");

  logger.log("info", "optimize request received", {
    model,
    clause_id: payload.clause.clause_id,
    clause_title: payload.clause.title,
    user_note: payload.user_note,
    kb_item_ids: payload.kb_items?.map((k) => k.id) ?? [],
  });

  const userPrompt = `You are given the current contract metadata, the original clause, the user's requested changes for this clause, and optional KB items.

Please refine ONLY this clause according to the instructions and return a JSON object in the required format.

<INPUT_JSON>
${JSON.stringify(payload, null, 2)}
</INPUT_JSON>`;

  logger.log("info", "optimize prompt prepared", { prompt: userPrompt });

  const completion = await callChatCompletion(
    {
      model,
      messages: [
        { role: "system", content: CLAUSE_REWRITE_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
    },
    "contract-optimize",
  );

  logger.log("info", "optimize completion received", {
    traceId: completion.traceId,
    content: completion.content,
    model,
  });

  try {
    const parsed = JSON.parse(completion.content || "{}");
    const validated = clauseRewriteResultSchema.parse(parsed);
    logger.log("info", "optimize parse success", {
      clause_id: validated.clause_id,
    });
    return {
      clause: validated,
      traceId: completion.traceId,
      raw: completion.raw,
    };
  } catch (error) {
    logger.log("error", "optimize parse failed", {
      error: (error as Error).message,
      content: completion.content,
    });
    throw error;
  }
}
