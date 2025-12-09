import path from "path";
import { promises as fs } from "fs";

import { createLogger } from "@/lib/logger";
import { briefSchema, kbItemSchema } from "./schemas";
import type { Brief, KbItem } from "./types";

const KB_PATH = path.join(process.cwd(), "data", "service_kb.json");
const MAX_ITEMS = 4;

let cachedItems: KbItem[] | null = null;

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9_]+/g)
    .filter(Boolean);
}

function buildTopicsFromBrief(brief: Brief): Set<string> {
  const topics = new Set<string>();
  if (brief.cancellation_notice_hours !== null || brief.cancellation_fee_policy) {
    topics.add("cancellation");
  }
  if (brief.damage_cap_amount !== null) {
    topics.add("damage");
  }
  if (brief.has_pets) {
    topics.add("pets");
  }
  if (brief.how_charge_model || brief.how_charge_text) {
    topics.add("payment");
  }
  return topics;
}

export async function loadKbItems(): Promise<KbItem[]> {
  if (cachedItems) {
    return cachedItems;
  }
  const logger = createLogger("kb-load");
  try {
    const file = await fs.readFile(KB_PATH, "utf-8");
    const parsed = JSON.parse(file);
    const result = kbItemSchema.array().safeParse(parsed);
    if (!result.success) {
      logger.log("warn", "KB 数据解析失败，返回空集", {
        issues: result.error.issues,
      });
      cachedItems = [];
      return cachedItems;
    }
    cachedItems = result.data.filter((item) => item.enabled);
    return cachedItems;
  } catch (error: any) {
    if (error.code === "ENOENT") {
      cachedItems = [];
      return cachedItems;
    }
    const loggerError = createLogger("kb-load-error");
    loggerError.log("error", "KB 读取异常", {
      message: (error as Error).message,
    });
    cachedItems = [];
    return cachedItems;
  }
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

export async function selectKbItems(
  brief: Brief,
  limit = MAX_ITEMS,
  extraTopics?: string[],
): Promise<KbItem[]> {
  const parsedBrief = briefSchema.parse(brief);
  const kbItems = await loadKbItems();
  if (!kbItems.length) return [];

  const topics = buildTopicsFromBrief(parsedBrief);
  (extraTopics || []).forEach((topic) => topics.add(topic));

  // service_type 过滤：优先精确匹配，否则退到 home_services，最终兜底全部
  const primaryCandidates = kbItems.filter(
    (item) =>
      (parsedBrief.service_type && item.service_type === parsedBrief.service_type) ||
      item.service_type === "home_services",
  );
  const candidates = primaryCandidates.length ? primaryCandidates : kbItems;

  const queryText = [
    parsedBrief.service_type ?? "",
    parsedBrief.what_service ?? "",
    parsedBrief.how_often ?? "",
    parsedBrief.how_charge_model ?? "",
    parsedBrief.how_charge_text ?? "",
    parsedBrief.location_area ?? "",
    parsedBrief.short_notes ?? "",
    parsedBrief.cancellation_fee_policy ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  const queryTokens = tokenize(queryText);

  const docsTokens = candidates.map((item) =>
    tokenize(`${item.label} ${item.summary} ${item.topic} ${item.service_type}`),
  );
  const df = computeDf(docsTokens);

  const scored = candidates.map((item, index) => {
    const simScore = tfIdfScore(queryTokens, docsTokens[index], docsTokens.length, df);
    const serviceTypeScore =
      item.service_type === parsedBrief.service_type
        ? 0.3
        : item.service_type === "home_services"
          ? 0.15
          : 0;
    const topicScore = topics.has(item.topic) ? 0.2 : 0;
    const finalScore = simScore * 0.5 + serviceTypeScore + topicScore;
    return {
      item,
      score: finalScore,
    };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) => entry.item);
}
