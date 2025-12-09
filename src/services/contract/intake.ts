import { createLogger } from "@/lib/logger";
import { callChatCompletion } from "./llm-client";
import { CONTRACT_INTAKE_SYSTEM_PROMPT } from "./prompts";
import { intakeResultSchema } from "./schemas";
import type { IntakeResult } from "./types";

interface IntakeParams {
  userDescription: string;
  locale?: string;
  defaultCurrency?: string;
  model?: string;
}

export async function runContractIntake(params: IntakeParams): Promise<{
  result: IntakeResult;
  traceId: string;
  raw: unknown;
}> {
  const { userDescription, locale = "en-US", defaultCurrency = "USD" } = params;
  const model = params.model || process.env.LLM_INTAKE_MODEL || "gpt-5-mini";
  const logger = createLogger("contract-intake");

  const userPrompt = `You will receive a short free-text description of a specific job or client situation.
Use it to fill in the brief and field_confidence according to the system instructions.

User description:
"""
${userDescription}
"""

Additional context:
- locale: ${locale}
- default_currency: ${defaultCurrency}

Based ONLY on the user description above, decide:
1) Whether this is a supported local/home service agreement.
2) If supported, how to fill the brief fields.
3) For every brief field, what confidence score (0.0–1.0) you assign.

Remember:
- If the contract type is not supported (e.g. lease, employment, family-law), set is_supported_service_agreement = false,
  provide a clear unsupported_reason and assistant_out_of_scope_message, and keep all brief fields null (except currency).
- If a detail is not clearly stated, leave the corresponding brief field as null and give it low confidence.

Now return ONLY the JSON object specified in the system instructions, with all required keys.
Do not add any extra text.`;

  logger.log("info", "intake prompt prepared", { prompt: userPrompt });

  const completion = await callChatCompletion(
    {
      model,
      messages: [
        { role: "system", content: CONTRACT_INTAKE_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
    },
    "contract-intake",
  );

  logger.log("info", "intake completion received", {
    traceId: completion.traceId,
    content: completion.content,
  });

  try {
    const parsed = JSON.parse(completion.content || "{}");
    const validated = intakeResultSchema.parse(parsed);
    logger.log("info", "intake parse success", {
      is_supported: validated.is_supported_service_agreement,
      next_action: validated.next_action,
    });
    return {
      result: validated,
      traceId: completion.traceId,
      raw: completion.raw,
    };
  } catch (error) {
    logger.log("error", "intake parse failed", {
      error: (error as Error).message,
      content: completion.content,
    });
    throw error;
  }
}
