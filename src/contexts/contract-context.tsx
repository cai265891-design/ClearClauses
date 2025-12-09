"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import {
  checkDownloadPermission,
  generateContract,
  intakeContract,
  optimizeClause,
} from "@/services/contract/client";
import type {
  Brief,
  ContractClause,
  ContractDocument,
  GenerateOptions,
  IntakeResult,
  KbItem,
} from "@/services/contract/types";

type Status =
  | "idle"
  | "intake_loading"
  | "intake_ready"
  | "unsupported"
  | "generate_loading"
  | "contract_ready"
  | "optimize_loading";

interface ContractContextValue {
  status: Status;
  error?: string;
  intakeResult?: IntakeResult;
  brief?: Brief;
  fieldConfidence?: IntakeResult["field_confidence"];
  contract?: ContractDocument;
  kbItems?: KbItem[];
  optimizingClauseId?: string;
  runIntake: (params: { description: string; locale?: string }) => Promise<void>;
  runGenerate: (params?: { brief?: Brief; options?: GenerateOptions }) => Promise<void>;
  runOptimize: (params: { clauseId: string; userNote: string }) => Promise<void>;
  refreshPermission: () => Promise<{ allowed: boolean; reason?: string }>;
  updateBrief: (payload: Partial<Brief>) => void;
}

const ContractContext = createContext<ContractContextValue | null>(null);

export function ContractProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string>();
  const [intakeResult, setIntakeResult] = useState<IntakeResult>();
  const [brief, setBrief] = useState<Brief>();
  const [fieldConfidence, setFieldConfidence] = useState<IntakeResult["field_confidence"]>();
  const [contract, setContract] = useState<ContractDocument>();
  const [kbItems, setKbItems] = useState<KbItem[]>();
  const [optimizingClauseId, setOptimizingClauseId] = useState<string>();

  const runIntake = useCallback(async ({ description, locale }: { description: string; locale?: string }) => {
    setStatus("intake_loading");
    setError(undefined);
    try {
      const { result } = await intakeContract({
        userDescription: description,
        locale,
      });
      setIntakeResult(result);
      setBrief(result.brief);
      setFieldConfidence(result.field_confidence);
      setContract(undefined);
      setKbItems(undefined);
      if (result.is_supported_service_agreement) {
        setStatus("intake_ready");
      } else {
        setStatus("unsupported");
      }
    } catch (err) {
      setError((err as Error).message);
      setStatus("idle");
      throw err;
    }
  }, []);

  const runGenerate = useCallback(async (params?: { brief?: Brief; options?: GenerateOptions }) => {
    const targetBrief = params?.brief || brief;
    if (!targetBrief) {
      setError("brief is required before generating contract");
      return;
    }
    setStatus("generate_loading");
    setError(undefined);
    try {
      const data = await generateContract({
        brief: targetBrief,
        options: params?.options,
      });
      setContract(data.contract);
      setKbItems(data.kb_items);
      setStatus("contract_ready");
    } catch (err) {
      setError((err as Error).message);
      setStatus("intake_ready");
      throw err;
    }
  }, [brief]);

  const runOptimize = useCallback(
    async ({ clauseId, userNote }: { clauseId: string; userNote: string }) => {
      if (!contract) {
        setError("contract not ready");
        return;
      }
      const targetClause = contract.clauses.find((item) => item.clause_id === clauseId);
      if (!targetClause) {
        setError("clause not found");
        return;
      }
      setOptimizingClauseId(clauseId);
      setStatus("optimize_loading");
      setError(undefined);
      try {
        const data = await optimizeClause({
          contractMetadata: {},
          clause: targetClause as ContractClause,
          userNote,
          kbItems,
        });
        const updatedClauses = contract.clauses.map((item) =>
          item.clause_id === clauseId ? data.clause : item,
        );
        setContract({ ...contract, clauses: updatedClauses });
        setStatus("contract_ready");
      } catch (err) {
        setError((err as Error).message);
        setStatus("contract_ready");
        throw err;
      } finally {
        setOptimizingClauseId(undefined);
      }
    },
    [contract, kbItems],
  );

  const updateBrief = useCallback((payload: Partial<Brief>) => {
    setBrief((prev) => ({ ...(prev || ({} as Brief)), ...payload }));
  }, []);

  const refreshPermission = useCallback(async () => {
    try {
      return await checkDownloadPermission();
    } catch (err) {
      setError((err as Error).message);
      return { allowed: false, reason: (err as Error).message };
    }
  }, []);

  const value = useMemo<ContractContextValue>(
    () => ({
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
      refreshPermission,
      updateBrief,
    }),
    [
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
      refreshPermission,
      updateBrief,
    ],
  );

  return <ContractContext.Provider value={value}>{children}</ContractContext.Provider>;
}

export function useContract() {
  const ctx = useContext(ContractContext);
  if (!ctx) {
    throw new Error("useContract must be used within ContractProvider");
  }
  return ctx;
}
