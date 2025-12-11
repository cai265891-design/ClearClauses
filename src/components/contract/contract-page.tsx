"use client";

import { useEffect, useMemo, useState } from "react";
import { ContractProvider, useContract } from "@/contexts/contract-context";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import LoadingLines from "@/components/ui/loading-lines";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { Brief, ContractClause } from "@/services/contract/types";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight } from "lucide-react";

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
      <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
        AI confident
      </Badge>
    );
  }
  if (score >= 0.4) {
    return (
      <Badge variant="secondary" className="bg-amber-100 text-amber-700 border-amber-200">
        Please review
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-muted-foreground border-dashed">
      Model guess
    </Badge>
  );
}

function FieldSection({
  title,
  badgeScore,
  children,
}: {
  title: string;
  badgeScore?: number;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border bg-white/80 p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <div className="text-sm font-semibold text-foreground">{title}</div>
        <ConfidenceBadge score={badgeScore} />
      </div>
      <div className="mt-3 grid gap-3">{children}</div>
    </div>
  );
}

function SelectField({
  id,
  value,
  onChange,
  options,
  badgeScore,
  placeholder,
  hint,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { label: string; value: string }[];
  badgeScore?: number;
  placeholder?: string;
  hint?: string;
}) {
  return (
    <div className="space-y-2">
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id} className="w-full">
          <SelectValue
            placeholder={placeholder || "Select…"}
            className="truncate text-left"
          />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function InputField({
  id,
  value,
  onChange,
  placeholder,
  badgeScore,
  hint,
  type = "text",
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  badgeScore?: number;
  hint?: string;
  type?: string;
}) {
  return (
    <div className="space-y-2">
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      <Input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="placeholder:text-muted-foreground/70"
      />
    </div>
  );
}

function TextareaField({
  id,
  value,
  onChange,
  placeholder,
  badgeScore,
  hint,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  badgeScore?: number;
  hint?: string;
}) {
  return (
    <div className="space-y-2">
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      <Textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="min-h-[96px] placeholder:text-muted-foreground/70"
      />
    </div>
  );
}

const serviceOptions = [
  { id: "home_cleaning", label: "Home cleaning", serviceType: "cleaning" as Brief["service_type"], autoWhat: "home cleaning services" },
  { id: "move_in_out", label: "Move-in / move-out cleaning", serviceType: "cleaning" as Brief["service_type"], autoWhat: "move-in / move-out cleaning services" },
  { id: "airbnb", label: "Short-term rental / Airbnb turnover cleaning", serviceType: "cleaning" as Brief["service_type"], autoWhat: "short-term rental turnover cleaning" },
  { id: "lawn_care", label: "Lawn & yard care (mowing, edging, basic yard work)", serviceType: "lawn_care" as Brief["service_type"], autoWhat: "lawn and yard care services" },
  { id: "pool", label: "Pool care / pool maintenance", serviceType: "pool_cleaning" as Brief["service_type"], autoWhat: "pool care and maintenance" },
  { id: "window_gutter", label: "Window & gutter cleaning", serviceType: "cleaning" as Brief["service_type"], autoWhat: "window and gutter cleaning" },
  { id: "organizing", label: "Home organizing / decluttering", serviceType: "organizing" as Brief["service_type"], autoWhat: "home organizing and decluttering" },
  { id: "pet_sitting", label: "Pet sitting / dog walking", serviceType: "pet_sitting" as Brief["service_type"], autoWhat: "pet sitting and dog walking" },
  { id: "mixed", label: "Mixed home services (a bit of everything above)", serviceType: "cleaning" as Brief["service_type"], autoWhat: "mixed home services" },
  { id: "other_service", label: "Other home service (please describe)", serviceType: null, autoWhat: "", requiresDetail: true },
];

const clientTypeOptions = [
  { id: "home", label: "Homeowners and tenants (residential customers)" },
  { id: "business", label: "Small local businesses / offices" },
  { id: "pm", label: "Property managers / landlords / HOAs" },
  { id: "str", label: "Short-term rental hosts (Airbnb / VRBO, etc.)" },
  { id: "mix", label: "A mix of residential and small business clients" },
  { id: "client_other", label: "Other types of clients (please describe)", requiresDetail: true },
];

const scheduleOptions = [
  { id: "one_time", label: "One-time / occasional jobs only", howOften: "one_time" as Brief["how_often"] },
  { id: "weekly", label: "Weekly (every week)", howOften: "weekly" as Brief["how_often"] },
  { id: "bi_weekly", label: "Every two weeks (bi-weekly)", howOften: "bi_weekly" as Brief["how_often"] },
  { id: "monthly", label: "Monthly", howOften: "monthly" as Brief["how_often"] },
  { id: "seasonal", label: "Seasonal (e.g. spring / fall cleanups, pool opening / closing)", howOften: "mixed" as Brief["how_often"], note: "Seasonal schedule" },
  { id: "project_based", label: "It depends / project-based schedule", howOften: "mixed" as Brief["how_often"], note: "Project-based schedule" },
  { id: "other_schedule", label: "Other schedule (please describe)", howOften: null, requiresDetail: true },
];

const pricingOptions = [
  {
    id: "per_visit",
    label: "Per visit (flat fee per job)",
    model: "per_visit" as Brief["how_charge_model"],
    text: "Per visit (flat fee per job)",
  },
  {
    id: "hourly",
    label: "Per hour",
    model: "hourly" as Brief["how_charge_model"],
    text: "Per hour pricing",
  },
  {
    id: "monthly_package",
    label: "Monthly package covering recurring visits",
    model: "monthly_flat" as Brief["how_charge_model"],
    text: "Monthly package covering recurring visits",
  },
  {
    id: "per_project",
    label: "Per project / per quote (price agreed case by case)",
    model: "project" as Brief["how_charge_model"],
    text: "Per project or custom quote",
  },
  {
    id: "per_unit",
    label: "Per unit or area (e.g. per room, per yard, per pool, per square foot)",
    model: "per_visit" as Brief["how_charge_model"],
    text: "Per unit or area pricing",
  },
  {
    id: "mixed_pricing",
    label: "Mixed – depends on the job",
    model: null,
    text: "Mixed pricing, depends on the job",
  },
  {
    id: "other_pricing",
    label: "Other pricing method (please describe)",
    model: null,
    text: "",
    requiresDetail: true,
  },
];

const cancellationOptions = [
  {
    id: "24_full_fee",
    label:
      "Clients must give at least 24 hours’ notice. Same-day cancellations or no-shows may be charged up to the full visit fee.",
    noticeHours: 24,
    policy: "full_fee" as Brief["cancellation_fee_policy"],
  },
  {
    id: "48_percentage",
    label:
      "Clients must give at least 48 hours’ notice. Cancellations within 48 hours may be charged 50–100% of the visit fee.",
    noticeHours: 48,
    policy: "percentage" as Brief["cancellation_fee_policy"],
  },
  {
    id: "no_fee",
    label: "No cancellation fee, but visits may be rescheduled at your convenience.",
    noticeHours: null,
    policy: "none" as Brief["cancellation_fee_policy"],
  },
  {
    id: "case_by_case",
    label: "I decide case by case and do not want a fixed cancellation fee in the contract.",
    noticeHours: null,
    policy: "flexible" as Brief["cancellation_fee_policy"],
  },
  {
    id: "other_cancel",
    label: "Other cancellation rule (please describe)",
    noticeHours: null,
    policy: null,
    requiresDetail: true,
  },
];

function ClauseCard({
  clause,
  highlight,
  onSelect,
  isUpdating,
  isUpdated,
  footnoteMap,
}: {
  clause: ContractClause;
  highlight?: boolean;
  onSelect?: (id: string) => void;
  isUpdating?: boolean;
  isUpdated?: boolean;
  footnoteMap: Record<string, number>;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border border-dashed bg-white p-3 text-sm shadow-sm transition-colors",
        "hover:border-primary/60 hover:bg-primary/5 cursor-pointer",
        highlight && "border-primary bg-primary/10",
        isUpdating && "opacity-80",
        "relative overflow-hidden",
      )}
      onClick={() => onSelect?.(clause.clause_id)}
      aria-busy={isUpdating}
      role="button"
      tabIndex={0}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="text-xs font-semibold text-muted-foreground">{clause.title}</div>
        <div className="flex items-center gap-1">
          {isUpdating && (
            <Badge variant="secondary" className="text-xs font-semibold">
              Updating…
            </Badge>
          )}
          {!isUpdating && isUpdated && (
            <Badge className="text-xs font-semibold bg-emerald-100 text-emerald-700 border-emerald-200">
              Updated
            </Badge>
          )}
        </div>
      </div>
      {isUpdating && (
        <div className="pointer-events-none absolute inset-0 rounded-lg bg-white/60 backdrop-blur-[1px]" />
      )}
      <p className="leading-6 text-foreground whitespace-pre-line">{clause.body}</p>
      {!!clause.reference_ids.length && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {clause.reference_ids.map((ref) => (
            <a
              key={ref}
              href={footnoteMap[ref] ? `#ref-${ref}` : undefined}
              className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary hover:border-primary/60"
              title="相关引用"
            >
              KB {footnoteMap[ref] ? `#${footnoteMap[ref]}` : ref}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

function ExplanationCard({
  clause,
  highlight,
  onSelect,
  isUpdating,
  isUpdated,
  footnoteMap,
}: {
  clause: ContractClause;
  highlight?: boolean;
  onSelect?: (id: string) => void;
  isUpdating?: boolean;
  isUpdated?: boolean;
  footnoteMap: Record<string, number>;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border border-dashed bg-gradient-to-br from-slate-50 to-white p-3 text-sm shadow-sm transition-colors",
        "hover:border-primary/50 hover:bg-primary/5 cursor-pointer",
        highlight && "border-primary bg-primary/10",
        isUpdating && "opacity-80",
        "relative overflow-hidden",
      )}
      onClick={() => onSelect?.(clause.clause_id)}
      aria-busy={isUpdating}
      role="button"
      tabIndex={0}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="text-xs font-semibold text-muted-foreground">{clause.title}</div>
        <div className="flex items-center gap-1">
          {isUpdating && (
            <Badge variant="secondary" className="text-xs font-semibold">
              Updating…
            </Badge>
          )}
          {!isUpdating && isUpdated && (
            <Badge className="text-xs font-semibold bg-emerald-100 text-emerald-700 border-emerald-200">
              Updated
            </Badge>
          )}
        </div>
      </div>
      {isUpdating && (
        <div className="pointer-events-none absolute inset-0 rounded-lg bg-white/60 backdrop-blur-[1px]" />
      )}
      <p className="leading-6 text-foreground whitespace-pre-line">
        {clause.explanation.summary}
      </p>
      {clause.explanation.business_risk_note && (
        <p className="mt-2 text-xs text-muted-foreground whitespace-pre-line">
          {clause.explanation.business_risk_note}
        </p>
      )}
      {!!clause.reference_ids.length && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {clause.reference_ids.map((ref) => (
            <a
              key={ref}
              href={footnoteMap[ref] ? `#ref-${ref}` : undefined}
              className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700 hover:border-blue-400"
              title="引用来源"
            >
              KB {footnoteMap[ref] ? `#${footnoteMap[ref]}` : ref}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

function SkeletonBox() {
  return <div className="h-16 w-full animate-pulse rounded-md bg-muted" />;
}

function DownloadActionBar({ show }: { show: boolean }) {
  const [footerVisible, setFooterVisible] = useState(false);

  useEffect(() => {
    if (!show) return;

    const footerEl = document.querySelector("footer");
    if (!footerEl) return;

    const observer = new IntersectionObserver(
      ([entry]) => setFooterVisible(entry.isIntersecting),
      { threshold: 0.05 },
    );

    observer.observe(footerEl);
    return () => observer.disconnect();
  }, [show]);

  if (!show) return null;

  return (
    <div
      className={cn(
        "pointer-events-none z-40 transition-all duration-200",
        footerVisible
          ? "relative mx-auto max-w-6xl px-4"
          : "fixed bottom-4 right-4 w-full max-w-xl px-4 sm:bottom-8 sm:right-8",
      )}
      aria-live="polite"
    >
      <div
        className={cn(
          "pointer-events-auto flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/90 px-4 py-3 shadow-xl backdrop-blur-md",
          footerVisible && "bg-white",
        )}
      >
        <div className="flex flex-1 flex-wrap items-center gap-3">
          <div className="flex-1 text-sm font-semibold text-foreground">
            Download your contract
          </div>
          <div className="flex items-center gap-2">
            <Button size="lg" className="px-5 shadow-sm">
              Download PDF
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-primary/40 bg-white/80 px-4 text-primary shadow-sm hover:bg-primary/10"
            >
              Download Word
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ContractPageInner({ initialDescription }: Props) {
  const {
    status,
    error,
    intakeResult,
    brief,
    fieldConfidence,
    contract,
    optimizingClauseId,
    runIntake,
    runGenerate,
    runOptimize,
    updateBrief,
  } = useContract();

  const [draftBrief, setDraftBrief] = useState<Brief>(brief || defaultBrief);
  const [selectedServiceId, setSelectedServiceId] = useState<string>("");
  const [serviceOther, setServiceOther] = useState<string>("");
  const [businessName, setBusinessName] = useState<string>("");
  const [clientTypeSelection, setClientTypeSelection] = useState<string>("");
  const [clientType, setClientType] = useState<string>("");
  const [clientTypeOther, setClientTypeOther] = useState<string>("");
  const [selectedScheduleId, setSelectedScheduleId] = useState<string>("");
  const [otherScheduleNote, setOtherScheduleNote] = useState<string>("");
  const [selectedPricingId, setSelectedPricingId] = useState<string>("");
  const [pricingNote, setPricingNote] = useState<string>("");
  const [selectedCancellationId, setSelectedCancellationId] = useState<string>("");
  const [otherCancellationNote, setOtherCancellationNote] = useState<string>("");
  const [baseShortNotes, setBaseShortNotes] = useState<string | null>(null);
  const [updatedClauses, setUpdatedClauses] = useState<Set<string>>(new Set());
  const [selectedClauseId, setSelectedClauseId] = useState<string>("");
  const [userNote, setUserNote] = useState("");
  const [isExplanationOpen, setIsExplanationOpen] = useState(true);
  const hasContractReady = Boolean(contract && status !== "generate_loading");
  const footnoteMap = useMemo(() => {
    if (!contract) return {};
    const map: Record<string, number> = {};
    contract.footnotes.forEach((item, idx) => {
      map[item.id] = idx + 1;
    });
    return map;
  }, [contract]);
  const setDraft = (patch: Partial<Brief>) => {
    setDraftBrief((prev) => ({ ...prev, ...patch }));
  };

  const isBlockingLoading = status === "intake_loading";
  const actionLoading = status === "generate_loading" || status === "optimize_loading";
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
      setBaseShortNotes(brief.short_notes ?? null);
    }
  }, [brief]);

  useEffect(() => {
    if (!brief) return;

    const matchedService = serviceOptions.find(
      (opt) => opt.serviceType === brief.service_type && !opt.requiresDetail,
    );
    setSelectedServiceId(matchedService?.id || (brief.what_service ? "other_service" : ""));
    if (!matchedService && brief.what_service) {
      setServiceOther(brief.what_service);
    }

    const matchedSchedule = scheduleOptions.find(
      (opt) => opt.howOften === brief.how_often && !opt.requiresDetail,
    );
    setSelectedScheduleId(matchedSchedule?.id || "");

    const matchedPricing = pricingOptions.find(
      (opt) => opt.model === brief.how_charge_model && !opt.requiresDetail,
    );
    if (matchedPricing) {
      setSelectedPricingId(matchedPricing.id);
      setPricingNote(brief.how_charge_text || matchedPricing.text || "");
    } else if (brief.how_charge_text) {
      setSelectedPricingId("other_pricing");
      setPricingNote(brief.how_charge_text);
    } else {
      setSelectedPricingId("");
      setPricingNote("");
    }

    const matchedCancellation = cancellationOptions.find(
      (opt) =>
        opt.noticeHours === brief.cancellation_notice_hours &&
        opt.policy === brief.cancellation_fee_policy,
    );
    if (matchedCancellation) {
      setSelectedCancellationId(matchedCancellation.id);
      setOtherCancellationNote("");
    } else if (
      brief.cancellation_notice_hours !== null ||
      brief.cancellation_fee_policy !== null
    ) {
      setSelectedCancellationId("other_cancel");
    } else {
      setSelectedCancellationId("");
      setOtherCancellationNote("");
    }
  }, [brief]);

  useEffect(() => {
    const extras = [
      businessName ? `Business name: ${businessName}` : "",
      clientType ? `Client type: ${clientType}` : "",
      otherScheduleNote ? `Schedule note: ${otherScheduleNote}` : "",
      pricingNote ? `Pricing note: ${pricingNote}` : "",
      otherCancellationNote ? `Cancellation note: ${otherCancellationNote}` : "",
    ].filter(Boolean);

    const pieces = [];
    if (baseShortNotes) pieces.push(baseShortNotes);
    if (extras.length) pieces.push(extras.join(" | "));
    const nextShortNotes = pieces.length ? pieces.join(" | ") : null;

    setDraftBrief((prev) => {
      if (prev.short_notes === nextShortNotes) return prev;
      return { ...prev, short_notes: nextShortNotes };
    });
  }, [baseShortNotes, businessName, clientType, otherScheduleNote, pricingNote, otherCancellationNote]);

  const handleServiceChange = (id: string) => {
    setSelectedServiceId(id);
    const option = serviceOptions.find((item) => item.id === id);
    if (!option) return;
    if (option.requiresDetail) {
      setDraft({ service_type: null, what_service: serviceOther || null });
      return;
    }
    setServiceOther("");
    setDraft({
      service_type: option.serviceType,
      what_service: option.autoWhat || option.label,
    });
  };

  useEffect(() => {
    const option = serviceOptions.find((item) => item.id === selectedServiceId);
    if (option?.requiresDetail) {
      setDraft({ service_type: null, what_service: serviceOther || null });
    }
  }, [selectedServiceId, serviceOther]);

  const handleScheduleChange = (id: string) => {
    setSelectedScheduleId(id);
    const option = scheduleOptions.find((item) => item.id === id);
    if (!option) return;
    if (option.requiresDetail) {
      setOtherScheduleNote("");
    } else {
      setOtherScheduleNote(option.note || "");
    }
    setDraft({ how_often: option.howOften });
  };

  const handlePricingChange = (id: string) => {
    setSelectedPricingId(id);
    const option = pricingOptions.find((item) => item.id === id);
    if (!option) return;
    if (option.requiresDetail) {
      setPricingNote("");
      setDraft({ how_charge_model: option.model, how_charge_text: null });
      return;
    }
    setPricingNote(option.text);
    setDraft({ how_charge_model: option.model, how_charge_text: option.text });
  };

  useEffect(() => {
    const option = pricingOptions.find((item) => item.id === selectedPricingId);
    if (option?.requiresDetail) {
      setDraft({
        how_charge_model: option.model,
        how_charge_text: pricingNote || null,
      });
    }
  }, [pricingNote, selectedPricingId]);

  const handleCancellationChange = (id: string) => {
    setSelectedCancellationId(id);
    const option = cancellationOptions.find((item) => item.id === id);
    if (!option) return;
    if (option.requiresDetail) {
      setOtherCancellationNote("");
      setDraft({
        cancellation_notice_hours: null,
        cancellation_fee_policy: null,
      });
      return;
    }
    setOtherCancellationNote("");
    setDraft({
      cancellation_notice_hours: option.noticeHours,
      cancellation_fee_policy: option.policy,
    });
  };

  useEffect(() => {
    const option = cancellationOptions.find((item) => item.id === selectedCancellationId);
    if (option?.requiresDetail) {
      setDraft({
        cancellation_notice_hours: null,
        cancellation_fee_policy: null,
      });
    }
  }, [selectedCancellationId]);

  const handleGenerate = async () => {
    updateBrief(draftBrief);
    await runGenerate({ brief: draftBrief }).catch(() => {});
  };

  useEffect(() => {
    setUpdatedClauses(new Set());
  }, [contract?.contract_title]);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("contract-explanation-open");
      if (saved === "false") setIsExplanationOpen(false);
    } catch {
      // ignore storage errors
    }
  }, []);

  useEffect(() => {
    try {
      sessionStorage.setItem("contract-explanation-open", String(isExplanationOpen));
    } catch {
      // ignore storage errors
    }
  }, [isExplanationOpen]);

  const handleOptimize = async () => {
    if (!selectedClauseId || !userNote.trim()) return;
    try {
      await runOptimize({ clauseId: selectedClauseId, userNote });
      setUpdatedClauses((prev) => {
        const next = new Set(prev);
        next.add(selectedClauseId);
        return next;
      });
      setUserNote("");
      toast.success("Clause updated successfully.");
    } catch (err) {
      toast.error("We couldn’t update this clause. Please try again.");
    }
  };

  const sortedClauses = useMemo(() => contract?.clauses || [], [contract]);

  if (isBlockingLoading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="min-h-[60vh] flex flex-col items-center justify-center px-6 text-center">
          <LoadingLines />
          <p className="text-sm font-semibold text-muted-foreground">
            {loadingLabel || "Getting your intake ready..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("mx-auto max-w-6xl space-y-8 px-4 py-8", hasContractReady && "pb-32")}>
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

      {status !== "generate_loading" && status !== "contract_ready" && status !== "optimize_loading" && (
        <Card className="bg-gradient-to-br from-white to-neutral-50 border-primary/10 shadow-lg">
        <CardHeader className="border-b border-dashed pb-4">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <CardTitle className="text-xl">Review your brief (6 quick questions)</CardTitle>
              <CardDescription>
                Pre-filled from your intake. Keep it short and clear—these answers feed the LLM
                directly.
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">Prefilled</Badge>
              {status === "intake_ready" && (
                <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
                  Ready to generate
                </Badge>
              )}
              {status === "unsupported" && <Badge variant="destructive">Out of scope</Badge>}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div className="text-sm font-semibold text-muted-foreground">Service basics</div>
            <div className="grid gap-4 lg:grid-cols-2">
              <FieldSection
                title="Q1. What kind of service do you provide?"
                badgeScore={fieldConfidence?.service_type}
              >
                <SelectField
                  id="service-type"
                  value={selectedServiceId}
                  onChange={handleServiceChange}
                  options={serviceOptions.map((o) => ({ label: o.label, value: o.id }))}
                  placeholder="Select a service type"
                />
                {selectedServiceId === "other_service" && (
                  <InputField
                    id="other-service"
                    value={serviceOther}
                    onChange={(v) => {
                      setServiceOther(v);
                      setDraft({ what_service: v || null });
                    }}
                    placeholder="e.g. appliance installation for rentals"
                    badgeScore={fieldConfidence?.what_service}
                  />
                )}
              </FieldSection>
              <FieldSection title="Q2. Your business name">
                <InputField
                  id="business-name"
                  value={businessName}
                  onChange={setBusinessName}
                  placeholder="e.g. CleanBee Services"
                />
              </FieldSection>
            </div>
          </div>

          <div className="space-y-3">
            <div className="text-sm font-semibold text-muted-foreground">Customers & cadence</div>
            <div className="grid gap-4 lg:grid-cols-2">
              <FieldSection title="Q3. Who do you usually work for?">
                <SelectField
                  id="client-type"
                  value={clientTypeSelection}
                  onChange={(v) => {
                    setClientTypeSelection(v);
                    const found = clientTypeOptions.find((o) => o.id === v);
                    if (found?.requiresDetail) {
                      setClientType("");
                      setClientTypeOther("");
                    } else {
                      setClientType(found?.label || "");
                      setClientTypeOther("");
                    }
                  }}
                  options={clientTypeOptions.map((o) => ({ label: o.label, value: o.id }))}
                  placeholder="Select a client type"
                />
                {clientTypeOptions.find((o) => o.id === clientTypeSelection)?.requiresDetail && (
                  <InputField
                    id="client-type-other"
                    value={clientTypeOther}
                    onChange={(v) => {
                      setClientTypeOther(v);
                      setClientType(v);
                    }}
                    placeholder="Describe your typical client"
                  />
                )}
              </FieldSection>
              <FieldSection
                title="Q4. How often do you provide this service for a typical client?"
                badgeScore={fieldConfidence?.how_often}
              >
                <SelectField
                  id="schedule"
                  value={selectedScheduleId}
                  onChange={handleScheduleChange}
                  options={scheduleOptions.map((o) => ({ label: o.label, value: o.id }))}
                  placeholder="Select a frequency"
                />
                {scheduleOptions.find((o) => o.id === selectedScheduleId)?.requiresDetail && (
                  <TextareaField
                    id="other-schedule"
                    value={otherScheduleNote}
                    onChange={(v) => setOtherScheduleNote(v)}
                    placeholder="e.g. every 10 days during peak season"
                  />
                )}
              </FieldSection>
            </div>
          </div>

          <div className="space-y-3">
            <div className="text-sm font-semibold text-muted-foreground">Pricing & cancellation</div>
            <div className="grid gap-4 lg:grid-cols-2">
              <FieldSection
                title="Q5. How do you charge for this service?"
                badgeScore={fieldConfidence?.how_charge_model}
              >
                <SelectField
                  id="pricing"
                  value={selectedPricingId}
                  onChange={handlePricingChange}
                  options={pricingOptions.map((o) => ({ label: o.label, value: o.id }))}
                  placeholder="Select a pricing model"
                />
                {pricingOptions.find((o) => o.id === selectedPricingId)?.requiresDetail && (
                  <TextareaField
                    id="pricing-other"
                    value={pricingNote}
                    onChange={(v) => setPricingNote(v)}
                    placeholder="e.g. $0.18/sqft for exterior windows"
                  />
                )}
              </FieldSection>
              <FieldSection
                title="Q6. Which cancellation rule fits you best?"
                badgeScore={fieldConfidence?.cancellation_fee_policy}
              >
                <SelectField
                  id="cancellation"
                  value={selectedCancellationId}
                  onChange={handleCancellationChange}
                  options={cancellationOptions.map((o) => ({ label: o.label, value: o.id }))}
                  placeholder="Select a cancellation rule"
                />
                {cancellationOptions.find((o) => o.id === selectedCancellationId)?.requiresDetail && (
                  <TextareaField
                    id="cancellation-other"
                    value={otherCancellationNote}
                    onChange={(v) => setOtherCancellationNote(v)}
                    placeholder="e.g. 72 hours’ notice, otherwise $50 flat fee"
                  />
                )}
              </FieldSection>
            </div>
          </div>

          <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-1">
              {error && <p className="text-sm text-destructive">{error}</p>}
              {intakeResult && !intakeResult.is_supported_service_agreement && (
                <p className="text-sm text-amber-600">
                  {intakeResult.assistant_out_of_scope_message ||
                    "This request is out of scope for home-service agreements."}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden text-xs text-muted-foreground lg:inline">
                Generate with the answers above
              </span>
              <Button
                size="lg"
                className="px-5"
                onClick={handleGenerate}
                disabled={actionLoading}
              >
                {status === "generate_loading" ? "Generating…" : "Generate contract"}
              </Button>
            </div>
          </div>
        </CardContent>
        </Card>
      )}

      <div id="step-1" className="relative">
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="hidden lg:flex fixed right-4 top-[calc(50vh-22px)] z-50 rounded-full bg-white shadow-md"
                onClick={() => setIsExplanationOpen((prev) => !prev)}
                aria-label={isExplanationOpen ? "Hide explanations" : "Show explanations"}
              >
                {isExplanationOpen ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left" className="text-sm">
              {isExplanationOpen ? "Hide explanations" : "Show explanations"}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <Button
          variant="outline"
          size="icon"
          className="lg:hidden fixed right-4 top-20 z-50 rounded-full bg-white shadow-md"
          onClick={() => setIsExplanationOpen((prev) => !prev)}
          aria-label={isExplanationOpen ? "Hide explanations" : "Show explanations"}
        >
          {isExplanationOpen ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
        </Button>

        <div
          className={cn(
            "grid gap-6",
            isExplanationOpen ? "lg:grid-cols-[1.4fr_1fr]" : "lg:grid-cols-[1fr_0]",
          )}
        >
          <div className="relative">
            <Card className="border border-primary/20 bg-white shadow-md">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="bg-primary/5 border-primary/30 text-primary">
                    Contract clauses
                  </Badge>
                  <h3 className="text-lg font-semibold text-foreground">Base Contract</h3>
                </div>
                <CardDescription className="mt-1">
                  This is your base service agreement. You can use it as-is or add extra requirements
                  below. Each clause matches the plain-language explanation on the right.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
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
                      {contract.contract_title || "Service Agreement"}
                    </div>
                    {sortedClauses.map((clause) => (
                      <ClauseCard
                        key={clause.clause_id}
                        clause={clause}
                        highlight={clause.clause_id === selectedClauseId}
                        onSelect={setSelectedClauseId}
                        isUpdating={
                          optimizingClauseId === clause.clause_id && status === "optimize_loading"
                        }
                        isUpdated={updatedClauses.has(clause.clause_id)}
                        footnoteMap={footnoteMap}
                      />
                    ))}
                    <div className="rounded-lg border bg-muted/30 p-3">
                      <div className="text-sm font-semibold text-muted-foreground">Citation Data</div>
                      <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
                        {contract.footnotes.map((item, idx) => (
                          <li
                            key={item.id}
                            id={`ref-${item.id}`}
                            className="flex flex-col gap-1 rounded-md border border-dashed border-slate-200/70 bg-white/70 p-2"
                          >
                            <div className="flex items-center gap-2">
                              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                                KB #{idx + 1}
                              </span>
                              <a
                                href={item.url}
                                target="_blank"
                                rel="noreferrer"
                                className="font-semibold text-primary hover:underline"
                                title={item.summary}
                              >
                                {item.label}
                              </a>
                            </div>
                            <div className="text-xs text-muted-foreground">{item.summary}</div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                )}
                {!contract && status !== "generate_loading" && (
                  <div className="rounded-lg border border-dashed bg-muted/20 p-4 text-sm text-muted-foreground">
                    No contract yet. Fill the brief above and click “Generate contract”.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {isExplanationOpen && (
            <div className="relative">
              <Card className="border border-slate-200 bg-gradient-to-br from-slate-50 to-white shadow-sm">
                <CardHeader className="pb-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary" className="bg-slate-100 text-slate-700">
                        Explanations / tips
                      </Badge>
                      <h3 className="text-base font-semibold text-foreground">Plain-language explanations</h3>
                    </div>
                  </div>
                  <CardDescription className="mt-1">
                    Each card explains what the matching clause on the left is doing in simple language.
                    These explanations are for your understanding only and are not part of the legal contract.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
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
                        onSelect={setSelectedClauseId}
                        isUpdating={optimizingClauseId === clause.clause_id && status === "optimize_loading"}
                        isUpdated={updatedClauses.has(clause.clause_id)}
                        footnoteMap={footnoteMap}
                      />
                    ))}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      <div id="step-2" className="rounded-2xl border bg-white/95 p-6 shadow-md space-y-5">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="border-primary/30 bg-primary/10 text-primary">
              Step 2
            </Badge>
            <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
              Required
            </Badge>
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-foreground">Refine a clause</h3>
            <p className="text-sm text-muted-foreground">
              Pick one clause and write the change. Both fields are required.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="rounded-xl border bg-slate-50/80 p-4 shadow-[0_1px_0_rgba(15,23,42,0.04)]">
            <div className="mb-2 flex items-center justify-between gap-2">
              <Label htmlFor="clause-select" className="text-sm font-semibold text-foreground">
                Clause to modify
              </Label>
              <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
                Required
              </Badge>
            </div>
            <Select
              value={selectedClauseId}
              onValueChange={setSelectedClauseId}
              disabled={!contract || actionLoading}
            >
              <SelectTrigger
                id="clause-select"
                className="w-full text-left"
                aria-required="true"
              >
                <SelectValue placeholder="Select a clause to refine" />
              </SelectTrigger>
              <SelectContent>
                {contract?.clauses.map((c) => (
                  <SelectItem key={c.clause_id} value={c.clause_id}>
                    {c.clause_id} – {c.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-xl border bg-slate-50/80 p-4 shadow-[0_1px_0_rgba(15,23,42,0.04)]">
            <div className="mb-2 flex items-center justify-between gap-2">
              <Label htmlFor="clause-note" className="text-sm font-semibold text-foreground">
                What to change
              </Label>
              <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
                Required
              </Badge>
            </div>
            <Textarea
              id="clause-note"
              className="min-h-[120px] w-full"
              placeholder="Keep it short: what to add, tighten, or remove."
              value={userNote}
              onChange={(e) => setUserNote(e.target.value)}
              disabled={!selectedClauseId || actionLoading}
              required
            />
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-xs text-muted-foreground">Complete the required fields to send.</span>
          <div className="flex items-center gap-3">
            {optimizingClauseId && (
              <span className="text-xs text-muted-foreground">Updating {optimizingClauseId}…</span>
            )}
            <Button
              className="px-4 font-semibold"
              onClick={handleOptimize}
              disabled={!selectedClauseId || !userNote.trim() || actionLoading}
            >
              {optimizingClauseId ? "Sending…" : "Send"}
            </Button>
          </div>
        </div>
      </div>

      <DownloadActionBar show={hasContractReady} />
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
