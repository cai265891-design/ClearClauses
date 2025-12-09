import { createLogger } from "@/lib/logger";
import type { ChatCompletionParams } from "./types";

const DEFAULT_TIMEOUT_MS = 60_000;

interface ChatCompletionResult<T = unknown> {
  content: string;
  raw: T;
  traceId: string;
}

export async function callChatCompletion<T = unknown>(
  params: ChatCompletionParams,
  traceLabel = "chat-completion",
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<ChatCompletionResult<T>> {
  const logger = createLogger(traceLabel);
  const apiBase = process.env.LLM_API_BASE?.replace(/\/+$/, "");
  const apiKey = process.env.LLM_API_KEY;

  if (!apiBase || !apiKey) {
    throw new Error("LLM_API_BASE 或 LLM_API_KEY 未配置");
  }

  // 兼容多种代理路径：根域 /v1、/v1/chat、完整 /v1/chat/completions
  const endpoint = (() => {
    if (apiBase.match(/\/v1\/chat\/completions$/)) return apiBase;
    if (apiBase.match(/\/v1\/chat$/)) return `${apiBase}/completions`;
    if (apiBase.match(/\/chat\/completions$/)) return apiBase;
    if (apiBase.match(/\/chat$/)) return `${apiBase}/completions`;
    if (apiBase.endsWith("/v1")) return `${apiBase}/chat/completions`;
    return `${apiBase}/v1/chat/completions`;
  })();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  const body = {
    model: params.model,
    messages: params.messages,
    temperature: params.temperature ?? 0.3,
    max_tokens: params.max_tokens,
    response_format: params.response_format,
  };

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      const errorText = await res.text();
      logger.log("error", "LLM 请求失败", {
        status: res.status,
        statusText: res.statusText,
        body: errorText,
      });
      throw new Error(`LLM 请求失败: ${res.status} ${res.statusText}`);
    }

    const data = (await res.json()) as T;
    const content = (data as any)?.choices?.[0]?.message?.content ?? "";

    logger.log("info", "LLM 请求完成", {
      traceId: logger.traceId,
      model: params.model,
      hasContent: Boolean(content),
    });

    return {
      content,
      raw: data,
      traceId: logger.traceId,
    };
  } catch (error) {
    logger.log("error", "LLM 请求异常", {
      error: (error as Error).message,
    });
    throw error;
  }
}
