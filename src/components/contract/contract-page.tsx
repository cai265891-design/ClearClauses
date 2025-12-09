"use client";

import { useEffect, useMemo, useState } from "react";
import { ContractProvider, useContract } from "@/contexts/contract-context";
import type { Brief, ContractClause } from "@/services/contract/types";
import { cn } from "@/lib/utils";
import LoadingLines from "@/components/ui/loading-lines";

interface Props {
  initialDescription?: string;
}

const defaultBrief: Brief = {
  service_type: null,
  what_service: null,
  how_often: null,
  how_charge_model: null,
  how_charge_text: null,
  location_area: null,
  cancellation_notice_hours: null,
  cancellation_fee_policy: null,
  damage_cap_amount: null,
  damage_cap_currency: "USD",
  has_pets: null,
  short_notes: null,
  service_specific: {},
  custom_terms: [],
};

function ConfidenceBadge({ score }: { score?: number }) {
  if (score === undefined || score === null) return null;
  if (score >= 0.8) {
    return (
      <span className="ml-2 rounded-sm bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">
        ✅ AI filled
      </span>
    );
  }
  if (score >= 0.4) {
    return (
      <span className="ml-2 text-xs font-semibold text-amber-500">
        Please review
      </span>
    );
  }
  return null;
}

function FormSelect({
  label,
  value,
  onChange,
  options,
  badgeScore,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { label: string; value: string }[];
  badgeScore?: number;
}) {
  return (
    <div className="space-y-2">
      <label className="flex items-center text-sm font-semibold text-foreground">
        {label}
        <ConfidenceBadge score={badgeScore} />
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border px-3 py-2 text-sm"
      >
        <option value="">Select…</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function FormInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-foreground">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-md border px-3 py-2 text-sm"
      />
    </div>
  );
}

function ClauseCard({ clause, highlight }: { clause: ContractClause; highlight?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-lg border border-dashed bg-white p-3 text-sm shadow-sm",
        highlight && "border-primary bg-primary/5",
      )}
    >
      <div className="text-xs font-semibold text-muted-foreground mb-2">{clause.title}</div>
      <p className="leading-6 text-foreground whitespace-pre-line">{clause.body}</p>
    </div>
  );
}

function ExplanationCard({ clause, highlight }: { clause: ContractClause; highlight?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-lg border border-dashed bg-white p-3 text-sm shadow-sm",
        highlight && "border-primary bg-primary/5",
      )}
    >
      <div className="text-xs font-semibold text-muted-foreground mb-2">{clause.title}</div>
      <p className="leading-6 text-foreground whitespace-pre-line">
        {clause.explanation.summary}
      </p>
      {clause.explanation.business_risk_note && (
        <p className="mt-2 text-xs text-muted-foreground whitespace-pre-line">
          {clause.explanation.business_risk_note}
        </p>
      )}
    </div>
  );
}

function SkeletonBox() {
  return <div className="h-16 w-full animate-pulse rounded-md bg-muted" />;
}

function ContractPageInner({ initialDescription }: Props) {
  const {
    status,
    error,
    intakeResult,
    brief,
    fieldConfidence,
    contract,
    kbItems,
    optimizingClauseId,
    runIntake,
    runGenerate,
    runOptimize,
    updateBrief,
  } = useContract();

  const [draftBrief, setDraftBrief] = useState<Brief>(brief || defaultBrief);
  const [businessName, setBusinessName] = useState("");
  const [clientType, setClientType] = useState("");
  const [selectedClauseId, setSelectedClauseId] = useState<string>("");
  const [userNote, setUserNote] = useState("");

  const isLoading =
    status === "intake_loading" || status === "generate_loading" || status === "optimize_loading";
  const loadingLabel =
    status === "intake_loading"
      ? "Preparing your prefilled form..."
      : status === "generate_loading"
        ? "Generating your contract..."
        : status === "optimize_loading"
          ? `Updating clause${optimizingClauseId ? `: ${optimizingClauseId}` : ""}...`
          : "";

  useEffect(() => {
    if (initialDescription) {
      runIntake({ description: initialDescription }).catch(() => {});
    }
  }, [initialDescription, runIntake]);

  useEffect(() => {
    if (brief) {
      setDraftBrief(brief);
    }
  }, [brief]);

  const handleGenerate = async () => {
    updateBrief(draftBrief);
    await runGenerate({ brief: draftBrief }).catch(() => {});
  };

  const handleOptimize = async () => {
    if (!selectedClauseId || !userNote.trim()) return;
    await runOptimize({ clauseId: selectedClauseId, userNote }).catch(() => {});
    setUserNote("");
  };

  const sortedClauses = useMemo(() => contract?.clauses || [], [contract]);

  const serviceOptions = [
    { label: "Home cleaning", value: "cleaning" },
    { label: "Pet sitting / dog walking", value: "pet_sitting" },
    { label: "Lawn & yard care", value: "lawn_care" },
    { label: "Pool care / maintenance", value: "pool_cleaning" },
    { label: "Home organizing", value: "organizing" },
  ];

  const oftenOptions = [
    { label: "One-time", value: "one_time" },
    { label: "Weekly", value: "weekly" },
    { label: "Every two weeks (bi-weekly)", value: "bi_weekly" },
    { label: "Monthly", value: "monthly" },
    { label: "Mixed", value: "mixed" },
  ];

  const chargeOptions = [
    { label: "Per visit (flat fee per job)", value: "per_visit" },
    { label: "Per hour", value: "hourly" },
    { label: "Monthly package", value: "monthly_flat" },
    { label: "Per project / per quote", value: "project" },
  ];

  const cancellationOptions = [
    {
      label: "Clients must give at least 24 hours’ notice. Same-day cancellations may be charged up to the full visit fee.",
      value: "24_full_fee",
      payload: { hours: 24, policy: "full_fee" as const },
    },
    {
      label: "Clients must give at least 48 hours’ notice. Cancellations within 48 hours may be charged 50–100% of the visit fee.",
      value: "48_percentage",
      payload: { hours: 48, policy: "percentage" as const },
    },
    {
      label: "No cancellation fee, reschedule at your convenience.",
      value: "none",
      payload: { hours: null, policy: "none" as const },
    },
    {
      label: "Case by case, no fixed fee in the contract.",
      value: "flexible",
      payload: { hours: null, policy: "flexible" as const },
    },
  ];

  const selectedCancellation = cancellationOptions.find(
    (opt) =>
      opt.payload.hours === draftBrief.cancellation_notice_hours &&
      opt.payload.policy === draftBrief.cancellation_fee_policy,
  )?.value || "";

  const setDraft = (patch: Partial<Brief>) => {
    setDraftBrief((prev) => ({ ...prev, ...patch }));
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="min-h-[60vh] rounded-2xl bg-black text-white shadow-xl flex flex-col items-center justify-center px-6 text-center">
          <LoadingLines />
          <p className="text-sm font-semibold">{loadingLabel || "Working on it..."}</p>
          <p className="mt-2 text-xs text-white/70">
            We are talking to the model. The page will update automatically once it’s ready.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8">
      <div className="flex flex-wrap items-center gap-3">
        <button
          className={cn(
            "rounded-full border px-4 py-2 text-sm font-semibold",
            "bg-primary/10 text-primary border-primary/40",
          )}
          onClick={() => {
            document.getElementById("step-1")?.scrollIntoView({ behavior: "smooth" });
          }}
        >
          Step 1 · Review base contract
        </button>
        <button
          className="rounded-full border px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
          onClick={() => {
            document.getElementById("step-2")?.scrollIntoView({ behavior: "smooth" });
          }}
        >
          Step 2 · Optimize specific terms (optional)
        </button>
      </div>

      <div className="rounded-2xl border bg-neutral-50 p-5 shadow-sm">
        <h2 className="text-xl font-semibold text-foreground">Review your service brief</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          We pre-filled this form from what you typed in the hero box. Check anything marked and
          adjust before generating your contract.
        </p>
        <div className="mt-4 rounded-xl border bg-white p-5 shadow-sm">
          <div className="space-y-4">
            <FormSelect
              label="1. What kind of service do you provide?"
              value={draftBrief.service_type || ""}
              onChange={(v) =>
                setDraft({ service_type: (v as Brief["service_type"]) || null })
              }
              options={serviceOptions}
              badgeScore={fieldConfidence?.service_type}
            />
            <FormInput
              label="2. Your business name"
              value={businessName}
              onChange={setBusinessName}
              placeholder="Optional"
            />
            <FormSelect
              label="3. Who do you usually work for?"
              value={clientType}
              onChange={setClientType}
              options={[
                { label: "Homeowners / tenants", value: "home" },
                { label: "Small businesses / offices", value: "business" },
                { label: "Property managers / landlords / HOAs", value: "pm" },
                { label: "Short-term rental hosts", value: "str" },
                { label: "A mix of residential and small business", value: "mix" },
              ]}
            />
            <FormSelect
              label="4. How often do you provide this service for a typical client?"
              value={draftBrief.how_often || ""}
              onChange={(v) => setDraft({ how_often: (v as Brief["how_often"]) || null })}
              options={oftenOptions}
              badgeScore={fieldConfidence?.how_often}
            />
            <FormSelect
              label="5. How do you charge for this service?"
              value={draftBrief.how_charge_model || ""}
              onChange={(v) =>
                setDraft({ how_charge_model: (v as Brief["how_charge_model"]) || null })
              }
              options={chargeOptions}
              badgeScore={fieldConfidence?.how_charge_model}
            />
            <FormSelect
              label="6. Which cancellation rule fits you best?"
              value={selectedCancellation}
              onChange={(v) => {
                const found = cancellationOptions.find((o) => o.value === v);
                setDraft({
                  cancellation_notice_hours: found?.payload.hours ?? null,
                  cancellation_fee_policy: found?.payload.policy ?? null,
                });
              }}
              options={cancellationOptions.map((o) => ({ label: o.label, value: o.value }))}
              badgeScore={fieldConfidence?.cancellation_fee_policy}
            />
          </div>
          <div className="mt-5 flex justify-end">
            <button
              className="rounded-full bg-neutral-900 px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
              onClick={handleGenerate}
              disabled={isLoading}
            >
              {status === "generate_loading" ? "Generating…" : "Generate contract"}
            </button>
          </div>
          {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
          {intakeResult && !intakeResult.is_supported_service_agreement && (
            <p className="mt-2 text-sm text-amber-600">
              {intakeResult.assistant_out_of_scope_message ||
                "This request is out of scope for home-service agreements."}
            </p>
          )}
        </div>
      </div>

      <div
        id="step-1"
        className="grid gap-6 rounded-2xl border bg-white p-5 shadow-sm lg:grid-cols-[1.4fr_1fr]"
      >
        <div className="space-y-3">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Base Contract</h3>
            <p className="text-sm text-muted-foreground">
              This is your base service agreement. You can use it as-is or add extra requirements
              below. Each clause matches the plain-language explanation on the right.
            </p>
          </div>
          {status === "generate_loading" && (
            <div className="space-y-3">
              <SkeletonBox />
              <SkeletonBox />
              <SkeletonBox />
            </div>
          )}
          {contract && status !== "generate_loading" && (
            <>
              <div className="rounded-lg border border-dashed bg-white p-3 text-center text-base font-semibold">
                Contract Title
              </div>
              {sortedClauses.map((clause) => (
                <ClauseCard
                  key={clause.clause_id}
                  clause={clause}
                  highlight={clause.clause_id === selectedClauseId}
                />
              ))}
              <div className="rounded-lg border bg-muted/30 p-3">
                <div className="text-sm font-semibold text-muted-foreground">Citation Data</div>
                <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                  {contract.footnotes.map((item, idx) => (
                    <li key={item.id}>
                      {idx + 1}. {item.label}
                    </li>
                  ))}
                </ul>
                <div className="mt-3 flex flex-wrap gap-3">
                  <button className="rounded-full bg-neutral-900 px-4 py-2 text-sm font-semibold text-white">
                    Download PDF
                  </button>
                  <button className="rounded-full bg-neutral-900 px-4 py-2 text-sm font-semibold text-white">
                    Download Word
                  </button>
                </div>
              </div>
            </>
          )}
          {!contract && status !== "generate_loading" && (
            <div className="rounded-lg border border-dashed bg-muted/20 p-4 text-sm text-muted-foreground">
              尚未生成合同。填写上方 brief 后点击 “Generate contract”。
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Plain-language explanations</h3>
            <p className="text-sm text-muted-foreground">
              Each card explains what the matching clause on the left is doing in simple language.
              These explanations are for your understanding only and are not part of the legal
              contract.
            </p>
          </div>
          {status === "generate_loading" && (
            <div className="space-y-3">
              <SkeletonBox />
              <SkeletonBox />
              <SkeletonBox />
            </div>
          )}
          {contract &&
            status !== "generate_loading" &&
            sortedClauses.map((clause) => (
              <ExplanationCard
                key={clause.clause_id}
                clause={clause}
                highlight={clause.clause_id === selectedClauseId}
              />
            ))}
        </div>
      </div>

      <div id="step-2" className="rounded-2xl border bg-white p-5 shadow-sm space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            Step 2 · Tell the assistant what to refine
          </h3>
          <p className="text-sm text-muted-foreground">
            Use an option below, then describe your extra requirement in plain language. We’ll update
            only the matching clause in your contract.
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-[240px_1fr]">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">Modify</label>
            <select
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={selectedClauseId}
              onChange={(e) => setSelectedClauseId(e.target.value)}
              disabled={!contract || isLoading}
            >
              <option value="">Select a clause to modify…</option>
              {contract?.clauses.map((c) => (
                <option key={c.clause_id} value={c.clause_id}>
                  {c.clause_id} – {c.title}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">Describe change</label>
            <textarea
              className="min-h-[80px] w-full rounded-md border px-3 py-2 text-sm"
              placeholder="Enter your revision suggestions…"
              value={userNote}
              onChange={(e) => setUserNote(e.target.value)}
              disabled={!selectedClauseId || isLoading}
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            className="rounded-full bg-neutral-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            onClick={handleOptimize}
            disabled={!selectedClauseId || !userNote.trim() || isLoading}
          >
            {optimizingClauseId ? "Updating clause…" : "Send"}
          </button>
          {optimizingClauseId && (
            <span className="text-xs text-muted-foreground">Updating {optimizingClauseId}…</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ContractPage(props: Props) {
  return (
    <ContractProvider>
      <ContractPageInner {...props} />
    </ContractProvider>
  );
}
