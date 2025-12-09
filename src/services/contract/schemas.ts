import { z } from "zod";

export const serviceTypeSchema = z
  .enum(["cleaning", "pet_sitting", "lawn_care", "pool_cleaning", "organizing"])
  .nullable();

export const howOftenSchema = z
  .enum(["one_time", "weekly", "bi_weekly", "monthly", "mixed"])
  .nullable();

export const chargeModelSchema = z
  .enum(["hourly", "per_visit", "monthly_flat", "project"])
  .nullable();

export const cancellationFeePolicySchema = z
  .enum(["none", "full_fee", "percentage", "flat_fee", "flexible"])
  .nullable();

export const briefSchema = z
  .object({
    service_type: serviceTypeSchema,
    what_service: z.string().nullable(),
    how_often: howOftenSchema,
    how_charge_model: chargeModelSchema,
    how_charge_text: z.string().nullable(),
    location_area: z.string().nullable(),
    cancellation_notice_hours: z.number().nullable(),
    cancellation_fee_policy: cancellationFeePolicySchema,
    damage_cap_amount: z.number().nullable(),
    damage_cap_currency: z.string(),
    has_pets: z.boolean().nullable(),
    short_notes: z.string().nullable(),
    service_specific: z.record(z.unknown()),
    custom_terms: z.array(z.unknown()),
  })
  .passthrough();

export const fieldConfidenceSchema = z.object({
    service_type: z.number(),
    what_service: z.number(),
    how_often: z.number(),
    how_charge_model: z.number(),
    how_charge_text: z.number(),
    location_area: z.number(),
    cancellation_notice_hours: z.number(),
    cancellation_fee_policy: z.number(),
    damage_cap_amount: z.number(),
    damage_cap_currency: z.number(),
    has_pets: z.number(),
    short_notes: z.number(),
  });

export const intakeResultSchema = z.object({
  is_supported_service_agreement: z.boolean(),
  unsupported_reason: z.string().nullable(),
  assistant_out_of_scope_message: z.string().nullable(),
  brief: briefSchema,
  field_confidence: fieldConfidenceSchema,
  missing_critical_fields: z.array(z.string()),
  next_action: z.enum(["proceed_to_form", "clarify_inputs"]),
});

export const kbItemSchema = z
  .object({
    id: z.string(),
    service_type: serviceTypeSchema.or(z.literal("home_services")).or(z.string()),
    topic: z.string(),
    label: z.string(),
    summary: z.string(),
    url: z.string(),
    source_type: z.string(),
    enabled: z.boolean(),
    last_reviewed_at: z.string().optional(),
  })
  .passthrough();

export const contractClauseSchema = z.object({
  clause_id: z.string(),
  title: z.string(),
  body: z.string(),
  explanation: z.object({
    summary: z.string(),
    business_risk_note: z.string(),
    kb_ids_used: z.array(z.string()),
  }),
  reference_ids: z.array(z.string()),
});

export const contractFootnoteSchema = z.object({
  id: z.string(),
  label: z.string(),
  summary: z.string(),
  url: z.string(),
});

export const contractDocumentSchema = z.object({
  contract_title: z.string(),
  preamble: z.string(),
  governing_note: z.string(),
  clauses: z.array(contractClauseSchema),
  footnotes: z.array(contractFootnoteSchema),
  generation_meta: z.object({
    model: z.string(),
    version: z.string(),
    generated_at: z.string(),
  }),
});

export const clauseRewriteResultSchema = z.object({
  clause_id: z.string(),
  title: z.string(),
  body: z.string(),
  explanation: z.object({
    summary: z.string(),
    business_risk_note: z.string(),
    kb_ids_used: z.array(z.string()),
  }),
  reference_ids: z.array(z.string()),
});
