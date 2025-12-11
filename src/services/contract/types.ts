export type ServiceType =
  | "cleaning"
  | "pet_sitting"
  | "lawn_care"
  | "pool_cleaning"
  | "organizing"
  | null;

export type HowOften =
  | "one_time"
  | "weekly"
  | "bi_weekly"
  | "monthly"
  | "mixed"
  | null;

export type ChargeModel = "hourly" | "per_visit" | "monthly_flat" | "project" | null;

export type CancellationFeePolicy =
  | "none"
  | "full_fee"
  | "percentage"
  | "flat_fee"
  | "flexible"
  | null;

export interface Brief {
  service_type: ServiceType;
  what_service: string | null;
  how_often: HowOften;
  how_charge_model: ChargeModel;
  how_charge_text: string | null;
  location_area: string | null;
  cancellation_notice_hours: number | null;
  cancellation_fee_policy: CancellationFeePolicy;
  damage_cap_amount: number | null;
  damage_cap_currency: string;
  has_pets: boolean | null;
  short_notes: string | null;
  service_specific: Record<string, unknown>;
  custom_terms: unknown[];
}

export interface FieldConfidence {
  service_type: number;
  what_service: number;
  how_often: number;
  how_charge_model: number;
  how_charge_text: number;
  location_area: number;
  cancellation_notice_hours: number;
  cancellation_fee_policy: number;
  damage_cap_amount: number;
  damage_cap_currency: number;
  has_pets: number;
  short_notes: number;
}

export interface IntakeResult {
  is_supported_service_agreement: boolean;
  unsupported_reason: string | null;
  assistant_out_of_scope_message: string | null;
  brief: Brief;
  field_confidence: FieldConfidence;
  missing_critical_fields: string[];
  next_action: "proceed_to_form" | "clarify_inputs";
}

export interface KbItem {
  id: string;
  service_type: ServiceType | "home_services" | string;
  topic: string;
  label: string;
  summary: string;
  url: string;
  source_type: string;
  enabled: boolean;
  last_reviewed_at?: string;
  clause_type?: string;
  title?: string;
  short_summary?: string;
  normalized_clause_en?: string;
  risk_level?: string;
  tags?: string[];
  source?: {
    url?: string;
    page_title?: string;
    retrieved_at?: string;
    content_type?: string;
  };
  source_quote?: string;
  notes_for_llm?: string;
}

export interface GenerateOptions {
  locale?: string;
  include_explanations?: boolean;
  include_references?: boolean;
}

export interface ContractClause {
  clause_id: string;
  title: string;
  body: string;
  explanation: {
    summary: string;
    business_risk_note: string;
    kb_ids_used: string[];
  };
  reference_ids: string[];
}

export interface ContractFootnote {
  id: string;
  label: string;
  summary: string;
  url: string;
}

export interface ContractDocument {
  contract_title: string;
  preamble: string;
  governing_note: string;
  clauses: ContractClause[];
  footnotes: ContractFootnote[];
  generation_meta: {
    model: string;
    version: string;
    generated_at: string;
  };
}

export interface ClauseRewritePayload {
  contract_metadata: Record<string, unknown>;
  clause: ContractClause;
  user_note: string;
  kb_items?: KbItem[];
}

export interface ClauseRewriteResult {
  clause_id: string;
  title: string;
  body: string;
  explanation: {
    summary: string;
    business_risk_note: string;
    kb_ids_used: string[];
  };
  reference_ids: string[];
}

export interface PermissionCheckResult {
  allowed: boolean;
  reason?: string;
}

export interface TraceMeta {
  traceId: string;
  label: string;
}

export type ChatRole = "system" | "user" | "assistant";

export interface LlmMessage {
  role: ChatRole;
  content: string;
}

export interface ChatCompletionParams {
  model: string;
  messages: LlmMessage[];
  temperature?: number;
  max_tokens?: number;
  response_format?: {
    type: "json_object" | "text";
  };
}
