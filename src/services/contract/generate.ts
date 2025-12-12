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
  userDescriptionRaw?: string;
}

const DEFAULT_GENERATE_TIMEOUT_MS = 120_000;

function resolveGenerateTimeoutMs() {
  const parsed = Number(process.env.LLM_GENERATE_TIMEOUT_MS);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_GENERATE_TIMEOUT_MS;
}

function validateReferences(
  doc: ContractDocument,
  kbItems: KbItem[],
  options: GenerateOptions,
) {
  const kbIdSet = new Set(kbItems.map((k) => k.id));
  const referenceIds = new Set<string>();
  doc.clauses.forEach((clause) => {
    clause.reference_ids.forEach((id) => referenceIds.add(id));
    clause.explanation.kb_ids_used.forEach((id) => {
      if (!clause.reference_ids.includes(id)) {
        throw new Error(`kb_ids_used missing in reference_ids for clause ${clause.clause_id}`);
      }
    });
  });

  const footnoteIds = new Set(doc.footnotes.map((f) => f.id));

  // When references are required, ensure at least one is present and all are valid/covered.
  const referencesRequired = (options.include_references ?? true) && kbItems.length > 0;
  if (referencesRequired) {
    if (referenceIds.size === 0) {
      throw new Error("references required when kb_items provided with include_references=true");
    }
    referenceIds.forEach((id) => {
      if (!kbIdSet.has(id)) {
        throw new Error(`reference id ${id} not found in provided kb_items`);
      }
      if (!footnoteIds.has(id)) {
        throw new Error(`footnote missing for reference id ${id}`);
      }
    });
    doc.footnotes.forEach((footnote) => {
      if (!kbIdSet.has(footnote.id)) {
        throw new Error(`footnote id ${footnote.id} not found in provided kb_items`);
      }
    });
  } else {
    // Even if references not required, keep sanity: no invented ids outside kb_items.
    referenceIds.forEach((id) => {
      if (!kbIdSet.has(id)) {
        throw new Error(`reference id ${id} not found in provided kb_items`);
      }
    });
    doc.footnotes.forEach((footnote) => {
      if (!kbIdSet.has(footnote.id)) {
        throw new Error(`footnote id ${footnote.id} not found in provided kb_items`);
      }
    });
  }
}

function validateStructure(doc: ContractDocument) {
  const requiredOrder = [
    "services",
    "fees_payment",
    "schedule_cancellations",
    "access_safety",
    "pets_special",
    "exclusions",
    "term_termination",
    "liability_damage",
    "governing_law_disputes",
    "general_provisions",
    "signatures",
  ];

  if (!doc.preamble || !doc.contract_title) {
    throw new Error("contract_title or preamble is missing");
  }

  const clauseIdToIndex = new Map<string, number>();
  doc.clauses.forEach((clause, idx) => clauseIdToIndex.set(clause.clause_id, idx));

  requiredOrder.forEach((id) => {
    if (!clauseIdToIndex.has(id)) {
      throw new Error(`missing required clause: ${id}`);
    }
  });

  // Ensure order matches requiredOrder
  let lastIndex = -1;
  requiredOrder.forEach((id) => {
    const idx = clauseIdToIndex.get(id) ?? -1;
    if (idx < lastIndex) {
      throw new Error("clauses are not in the required order");
    }
    lastIndex = idx;
  });
}

export async function runContractGenerate(params: GenerateParams): Promise<{
  contract: ContractDocument;
  traceId: string;
  raw: unknown;
}> {
  const { brief, kbItems, options = {}, userDescriptionRaw } = params;
  const model = params.model || process.env.LLM_GENERATE_MODEL || "gpt-5.1-2025-11-13";
  const logger = createLogger("contract-generate");
  const timeoutMs = resolveGenerateTimeoutMs();

  const optionsWithDefaults: GenerateOptions = {
    locale: options.locale ?? "en-US",
    include_explanations: options.include_explanations ?? true,
    include_references: options.include_references ?? true,
  };

  logger.log("info", "generate request received", {
    model,
    brief,
    options: optionsWithDefaults,
    kb_item_ids: kbItems.map((k) => k.id),
    user_description_raw: userDescriptionRaw,
    timeout_ms: timeoutMs,
  });

  const userPrompt = `Here is the input for this contract generation run.

brief:
${JSON.stringify(brief, null, 2)}

options:
${JSON.stringify(optionsWithDefaults, null, 2)}

kb_items:
${JSON.stringify(kbItems, null, 2)}

user_description_raw (optional):
${userDescriptionRaw ? `"""\n${userDescriptionRaw}\n"""` : "(none provided)"}

Follow all system instructions and return ONLY one valid JSON object in the required schema.
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
    timeoutMs,
  );

  logger.log("info", "generate completion received", {
    traceId: completion.traceId,
    content: completion.content,
    model,
  });

  try {
    const parsed = JSON.parse(completion.content || "{}");
    const validated = contractDocumentSchema.parse(parsed);
    validateStructure(validated);
    validateReferences(validated, kbItems, optionsWithDefaults);
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
