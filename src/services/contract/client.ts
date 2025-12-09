import type {
  Brief,
  ClauseRewriteResult,
  ContractClause,
  ContractDocument,
  GenerateOptions,
  IntakeResult,
  KbItem,
} from "./types";

interface RespShape<T> {
  code: number;
  message: string;
  data?: T;
}

async function handleResponse<T>(res: Response): Promise<T> {
  const json = (await res.json()) as RespShape<T>;
  if (json.code !== 0 || !json.data) {
    throw new Error(json.message || "request failed");
  }
  return json.data;
}

export async function intakeContract(params: {
  userDescription: string;
  locale?: string;
  defaultCurrency?: string;
}): Promise<{ result: IntakeResult; trace_id: string }> {
  const res = await fetch("/api/contract/intake", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      user_description: params.userDescription,
      locale: params.locale,
      default_currency: params.defaultCurrency,
    }),
  });
  return handleResponse(res);
}

export async function generateContract(params: {
  brief: Brief;
  options?: GenerateOptions;
  extraTopics?: string[];
}): Promise<{ contract: ContractDocument; kb_items: KbItem[]; trace_id: string }> {
  const res = await fetch("/api/contract/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      brief: params.brief,
      options: params.options,
      extra_topics: params.extraTopics,
    }),
  });
  return handleResponse(res);
}

export async function optimizeClause(params: {
  contractMetadata: Record<string, unknown>;
  clause: ContractClause;
  userNote: string;
  kbItems?: KbItem[];
}): Promise<{ clause: ClauseRewriteResult; trace_id: string }> {
  const res = await fetch("/api/contract/optimize", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contract_metadata: params.contractMetadata,
      clause: params.clause,
      user_note: params.userNote,
      kb_items: params.kbItems,
    }),
  });
  return handleResponse(res);
}

export async function checkDownloadPermission(): Promise<{
  allowed: boolean;
  reason?: string;
}> {
  const res = await fetch("/api/download/permission", {
    method: "GET",
  });
  return handleResponse(res);
}
