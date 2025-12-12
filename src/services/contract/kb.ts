import path from "path";
import { promises as fs } from "fs";
import { z } from "zod";

import { createLogger } from "@/lib/logger";
import { briefSchema, kbItemSchema } from "./schemas";
import type { Brief, KbItem } from "./types";

const KB_DIR = path.join(process.cwd(), "kb");
const MAX_ITEMS = 6;

const kbRawSchema = z
  .object({
    id: z.string(),
    service_type: z.string(),
    clause_type: z.string().optional(),
    title: z.string(),
    short_summary: z.string().optional(),
    normalized_clause_en: z.string().optional(),
    risk_level: z.string().optional(),
    tags: z.array(z.string()).optional(),
    source: z
      .object({
        url: z.string().optional(),
        page_title: z.string().optional(),
        retrieved_at: z.string().optional(),
        content_type: z.string().optional(),
      })
      .optional(),
    source_quote: z.string().optional(),
    notes_for_llm: z.string().optional(),
  })
  .passthrough();

const SERVICE_ALIASES: Record<string, string> = {
  pool: "pool_cleaning",
};

let cachedItems: KbItem[] | null = null;

function normalizeServiceType(serviceType: string | null | undefined): string {
  if (!serviceType) return "";
  const lower = serviceType.toLowerCase();
  return SERVICE_ALIASES[lower] ?? lower;
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9_]+/g)
    .filter(Boolean);
}

function buildTopicsFromBrief(brief: Brief, extraTopics?: string[]): Set<string> {
  const topics = new Set<string>();
  const push = (value?: string | null) => {
    if (value) {
      topics.add(value.toLowerCase());
    }
  };

  if (brief.cancellation_notice_hours !== null || brief.cancellation_fee_policy) {
    ["cancellation", "cancellations", "reschedule"].forEach(push);
  }
  if (brief.damage_cap_amount !== null) {
    ["damage", "damage_liability", "liability"].forEach(push);
  }
  if (brief.has_pets) {
    ["pets", "pet", "animals", "safety"].forEach(push);
  }
  if (brief.how_charge_model || brief.how_charge_text) {
    ["payment", "payments", "pricing"].forEach(push);
  }
  if (brief.how_often && brief.how_often !== "one_time") {
    ["recurring", "schedule"].forEach(push);
  }

  (extraTopics || []).forEach(push);
  return topics;
}

function buildQueryTokens(brief: Brief, topics: Set<string>): string[] {
  const parts: string[] = [
    normalizeServiceType(brief.service_type),
    brief.service_type ?? "",
    brief.what_service ?? "",
    brief.how_often ?? "",
    brief.how_charge_model ?? "",
    brief.how_charge_text ?? "",
    brief.location_area ?? "",
    brief.short_notes ?? "",
    brief.cancellation_fee_policy ?? "",
  ];

  if (brief.cancellation_notice_hours !== null) {
    parts.push(`${brief.cancellation_notice_hours} hours`, "notice");
  }
  if (brief.damage_cap_amount !== null) {
    parts.push(`${brief.damage_cap_amount}`, "damage", "liability", brief.damage_cap_currency);
  }
  if (brief.has_pets !== null) {
    parts.push(brief.has_pets ? "pets" : "no_pets");
  }

  topics.forEach((topic) => parts.push(topic));
  return tokenize(parts.filter(Boolean).join(" "));
}

function buildDocTokens(item: KbItem): string[] {
  return tokenize(
    [
      item.label,
      item.summary,
      item.topic,
      item.service_type,
      item.clause_type,
      item.short_summary,
      item.normalized_clause_en,
      item.notes_for_llm,
      item.source_quote,
      item.risk_level,
      (item.tags || []).join(" "),
    ]
      .filter(Boolean)
      .join(" "),
  );
}

function tfIdfScore(queryTokens: string[], docTokens: string[], docCount: number, dfMap: Map<string, number>) {
  if (!queryTokens.length || !docTokens.length || docCount === 0) {
    return 0;
  }
  const tf = new Map<string, number>();
  docTokens.forEach((token) => tf.set(token, (tf.get(token) ?? 0) + 1));

  let score = 0;
  for (const token of queryTokens) {
    const termFreq = tf.get(token) ?? 0;
    if (!termFreq) continue;
    const df = dfMap.get(token) ?? 0;
    const idf = Math.log((1 + docCount) / (1 + df)) + 1;
    score += termFreq * idf;
  }
  return score / queryTokens.length;
}

function computeDf(docs: string[][]): Map<string, number> {
  const df = new Map<string, number>();
  docs.forEach((tokens) => {
    const unique = new Set(tokens);
    unique.forEach((token) => {
      df.set(token, (df.get(token) ?? 0) + 1);
    });
  });
  return df;
}

function computeServiceScore(item: KbItem, brief: Brief): number {
  const briefService = normalizeServiceType(brief.service_type);
  const itemService = normalizeServiceType(item.service_type);
  if (briefService && itemService && briefService === itemService) {
    return 0.35;
  }
  if (itemService === "generic" || itemService === "home_services") {
    return 0.2;
  }
  if (!briefService && itemService) {
    return 0.08;
  }
  return 0;
}

function computeTopicScore(item: KbItem, topics: Set<string>): number {
  if (!topics.size) return 0;
  const itemTopics = [item.topic, item.clause_type, ...(item.tags || [])]
    .filter((topic): topic is string => Boolean(topic))
    .map((topic) => topic.toLowerCase());
  return itemTopics.some((topic) => topics.has(topic)) ? 0.2 : 0;
}

function mapRawToKbItem(raw: z.infer<typeof kbRawSchema>): KbItem {
  const normalizedServiceType = normalizeServiceType(raw.service_type);
  const mapped: KbItem = {
    id: raw.id,
    service_type: normalizedServiceType || raw.service_type,
    topic: raw.clause_type || "general",
    label: raw.title,
    summary: raw.short_summary || raw.normalized_clause_en || raw.title,
    url: raw.source?.url || "",
    source_type: raw.source?.content_type || "unknown",
    enabled: true,
    last_reviewed_at: raw.source?.retrieved_at,
    clause_type: raw.clause_type,
    title: raw.title,
    short_summary: raw.short_summary,
    normalized_clause_en: raw.normalized_clause_en,
    risk_level: raw.risk_level,
    tags: raw.tags || [],
    source: raw.source,
    source_quote: raw.source_quote,
    notes_for_llm: raw.notes_for_llm,
  };
  return kbItemSchema.parse(mapped);
}

export async function loadKbItems(): Promise<KbItem[]> {
  if (cachedItems) {
    return cachedItems;
  }
  const logger = createLogger("kb-load");
  try {
    const files = await fs.readdir(KB_DIR);
    const jsonFiles = files.filter((file) => file.endsWith(".json"));
    const items = new Map<string, KbItem>();

    for (const file of jsonFiles) {
      try {
        const filePath = path.join(KB_DIR, file);
        const content = await fs.readFile(filePath, "utf-8");
        const parsedJson = JSON.parse(content);
        const result = kbRawSchema.array().safeParse(parsedJson);
        if (!result.success) {
          logger.log("warn", "KB 文件格式校验失败", {
            file,
            issues: result.error.issues,
          });
          continue;
        }
        result.data.forEach((raw) => {
          const mapped = mapRawToKbItem(raw);
          items.set(mapped.id, mapped);
        });
      } catch (error) {
        logger.log("warn", "KB 文件解析异常，跳过该文件", {
          file,
          message: (error as Error).message,
        });
      }
    }

    cachedItems = Array.from(items.values());
    return cachedItems;
  } catch (error) {
    logger.log("error", "KB 目录读取失败", {
      message: (error as Error).message,
    });
    cachedItems = [];
    return cachedItems;
  }
}

export async function selectKbItems(
  brief: Brief,
  limit = MAX_ITEMS,
  extraTopics?: string[],
): Promise<KbItem[]> {
  const parsedBrief = briefSchema.parse(brief);
  const kbItems = await loadKbItems();
  if (!kbItems.length) return [];

  const topics = buildTopicsFromBrief(parsedBrief, extraTopics);
  const queryTokens = buildQueryTokens(parsedBrief, topics);

  const docsTokens = kbItems.map(buildDocTokens);
  const df = computeDf(docsTokens);

  const scored = kbItems.map((item, index) => {
    const simScore = tfIdfScore(queryTokens, docsTokens[index], docsTokens.length, df);
    const finalScore = simScore * 0.65 + computeServiceScore(item, parsedBrief) + computeTopicScore(item, topics);
    return {
      item,
      score: finalScore,
    };
  });

  const selected = scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) => entry.item);

  const logger = createLogger("kb-select");
  logger.log("info", "kb selection", {
    brief_service_type: parsedBrief.service_type,
    topics: Array.from(topics),
    query_tokens: queryTokens,
    selected_ids: selected.map((item) => item.id),
  });

  return selected;
}
