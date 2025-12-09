import { createLogger } from "@/lib/logger";
import { callChatCompletion } from "./llm-client";
import { CONTRACT_GENERATE_SYSTEM_PROMPT } from "./prompts";
import { contractDocumentSchema } from "./schemas";
import type { Brief, ContractDocument, GenerateOptions, KbItem } from "./types";

interface GenerateParams {
  brief: Brief;
  options?: GenerateOptions;
  kbItems: KbItem[];
  model?: string;
}

export async function runContractGenerate(params: GenerateParams): Promise<{
  contract: ContractDocument;
  traceId: string;
  raw: unknown;
}> {
  const { brief, kbItems, options = {} } = params;
  const model = params.model || process.env.LLM_GENERATE_MODEL || "gpt-5.1-2025-11-13";
  const logger = createLogger("contract-generate");

  const optionsWithDefaults: GenerateOptions = {
    locale: options.locale ?? "en-US",
    include_explanations: options.include_explanations ?? true,
    include_references: options.include_references ?? true,
  };

  const userPrompt = `You will receive three JSON objects:
- "brief": the structured configuration of this service agreement.
- "options": flags controlling explanations and references.
- "kb_items": zero or more knowledge items summarizing common business practices.

Use:
- brief as the single source of truth for what the contract should say.
- kb_items only to enrich explanations and reference footnotes,
  following the system instructions.

Input:

brief:
${JSON.stringify(brief, null, 2)}

options:
${JSON.stringify(optionsWithDefaults, null, 2)}

kb_items:
${JSON.stringify(kbItems, null, 2)}

Now:
1) Decide which clauses you will include.
2) Use the brief to write clear, neutral contract text for each clause (body).
3) If options.include_explanations is true, write explanations and business_risk_notes.
4) If options.include_references is true and kb_items is not empty,
   connect relevant kb_items to specific clauses using reference_ids and footnotes.

Return ONLY the contract JSON object in the exact format described in the system message.
Do not add any extra text.`;

  logger.log("info", "generate prompt prepared", { prompt: userPrompt });

  const completion = await callChatCompletion(
    {
      model,
      messages: [
        { role: "system", content: CONTRACT_GENERATE_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
    },
    "contract-generate",
  );

  logger.log("info", "generate completion received", {
    traceId: completion.traceId,
    content: completion.content,
  });

  try {
    const parsed = JSON.parse(completion.content || "{}");
    const validated = contractDocumentSchema.parse(parsed);
    logger.log("info", "generate parse success", {
      clauses: validated.clauses.length,
      footnotes: validated.footnotes.length,
    });
    return {
      contract: validated,
      traceId: completion.traceId,
      raw: completion.raw,
    };
  } catch (error) {
    logger.log("error", "generate parse failed", {
      error: (error as Error).message,
      content: completion.content,
    });
    throw error;
  }
}
