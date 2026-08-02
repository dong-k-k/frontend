"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { CompanyInfo, ConsultationInfo, ContractInfo, PaymentSchedule, RiskProfile } from "@/lib/types";
import { addDays, toISODate, todayKst } from "@/lib/date";
import type {
  ProductMatchItem,
  RiskAssessmentResponse,
  RiskProfileResponse,
  StrategyMixItem,
  AvoidedLossCard,
  ApiConsultationStatus,
} from "@/lib/api/types";

const initialCompanyInfo: CompanyInfo = {
  businessName: "(주)한빛무역",
  email: "export@hanbit.co.kr",
  phone: "010-1234-5678",
  companyType: "export",
  exportRevenueUsd: 2_400_000,
  importRevenueUsd: null,
  annualRevenueKrw: 8_500_000_000,
  operatingProfitKrw: 320_000_000,
  creditRating: "BBB",
};

const initialContractInfo: Pick<ContractInfo, "contractType" | "countryCode" | "settlementMethod"> = {
  contractType: "export",
  countryCode: "US",
  settlementMethod: "TT",
};

function createPaymentSchedule(id: string, overrides: Partial<PaymentSchedule> = {}): PaymentSchedule {
  return {
    id,
    amount: null,
    currency: "USD",
    priceFixDate: "",
    dueDate: "",
    bep: null,
    dueDateAdjustable: true,
    ...overrides,
  };
}

function newScheduleId(): string {
  return `sched-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

/**
 * Builds a fresh contract default: one payment schedule (결제 정보 카드 1),
 * signed 30 days ago and due 90 days from now. Computed once per call
 * (initial render, and again on reset()) so the demo always shows an
 * already-signed contract due a few months out, regardless of when the app
 * is actually run.
 */
function defaultContract(): ContractInfo {
  const today = todayKst();
  return {
    ...initialContractInfo,
    paymentSchedules: [
      createPaymentSchedule("1", {
        amount: 500_000,
        priceFixDate: toISODate(addDays(today, -30)),
        dueDate: toISODate(addDays(today, 90)),
        bep: 1320,
      }),
    ],
  };
}

const initialRiskProfile: RiskProfile = {
  maxLossTolerance: null,
  krwCertaintyPreference: null,
  hedgeManagementStyle: null,
};

const initialConsultationInfo: ConsultationInfo = {
  companyName: "",
  contactName: "",
  phone: "",
  email: "",
  contactMethod: "PHONE",
  preferredTime: "",
  branch: "강남기업금융센터",
  memo: "",
  agree: false,
};

/**
 * IDs and responses returned by the real backend (API 명세서 기준) as the
 * wizard progresses. Pages call the `@/lib/api` functions themselves and
 * write results back here via `setServer` — this slice just holds state,
 * it doesn't orchestrate the calls.
 */
export interface ServerState {
  profileId: number | null;
  contractId: number | null;
  /** Maps a local payment-schedule id (PaymentSchedule.id) to the server's settlement_id. */
  settlementIdByScheduleId: Record<string, number>;
  /** Maps a local payment-schedule id to its latest risk assessment response. */
  assessmentByScheduleId: Record<string, RiskAssessmentResponse>;
  riskProfileId: number | null;
  riskProfileResult: RiskProfileResponse | null;
  matchId: number | null;
  matchItems: ProductMatchItem[];
  recommendationId: number | null;
  recommendationMix: StrategyMixItem[];
  recommendationReason: string | null;
  avoidedLossByProduct: AvoidedLossCard[] | null;
  consultationRequestId: number | null;
  consultationStatus: ApiConsultationStatus | null;
}

const initialServerState: ServerState = {
  profileId: null,
  contractId: null,
  settlementIdByScheduleId: {},
  assessmentByScheduleId: {},
  riskProfileId: null,
  riskProfileResult: null,
  matchId: null,
  matchItems: [],
  recommendationId: null,
  recommendationMix: [],
  recommendationReason: null,
  avoidedLossByProduct: null,
  consultationRequestId: null,
  consultationStatus: null,
};

interface WizardContextValue {
  company: CompanyInfo;
  setCompany: (patch: Partial<CompanyInfo>) => void;
  contract: ContractInfo;
  setContract: (patch: Partial<ContractInfo>) => void;
  addPaymentSchedule: () => void;
  removePaymentSchedule: (id: string) => void;
  updatePaymentSchedule: (id: string, patch: Partial<PaymentSchedule>) => void;
  riskProfile: RiskProfile;
  setRiskProfile: (patch: Partial<RiskProfile>) => void;
  consultation: ConsultationInfo;
  setConsultation: (patch: Partial<ConsultationInfo>) => void;
  server: ServerState;
  setServer: (patch: Partial<ServerState>) => void;
  reset: () => void;
}

const WizardContext = createContext<WizardContextValue | null>(null);

export function WizardProvider({ children }: { children: ReactNode }) {
  const [company, setCompanyState] = useState<CompanyInfo>(initialCompanyInfo);
  const [contract, setContractState] = useState<ContractInfo>(defaultContract);
  const [riskProfile, setRiskProfileState] = useState<RiskProfile>(initialRiskProfile);
  const [consultation, setConsultationState] = useState<ConsultationInfo>(initialConsultationInfo);
  const [server, setServerState] = useState<ServerState>(initialServerState);

  const value = useMemo<WizardContextValue>(
    () => ({
      company,
      setCompany: (patch) => setCompanyState((prev) => ({ ...prev, ...patch })),
      contract,
      setContract: (patch) => setContractState((prev) => ({ ...prev, ...patch })),
      addPaymentSchedule: () =>
        setContractState((prev) => ({
          ...prev,
          paymentSchedules: [...prev.paymentSchedules, createPaymentSchedule(newScheduleId())],
        })),
      removePaymentSchedule: (id) =>
        setContractState((prev) => {
          if (prev.paymentSchedules[0]?.id === id) return prev; // 카드 1은 삭제할 수 없음
          return { ...prev, paymentSchedules: prev.paymentSchedules.filter((s) => s.id !== id) };
        }),
      updatePaymentSchedule: (id, patch) =>
        setContractState((prev) => ({
          ...prev,
          paymentSchedules: prev.paymentSchedules.map((s) => (s.id === id ? { ...s, ...patch } : s)),
        })),
      riskProfile,
      setRiskProfile: (patch) => setRiskProfileState((prev) => ({ ...prev, ...patch })),
      consultation,
      setConsultation: (patch) => setConsultationState((prev) => ({ ...prev, ...patch })),
      server,
      setServer: (patch) => setServerState((prev) => ({ ...prev, ...patch })),
      reset: () => {
        setCompanyState(initialCompanyInfo);
        setContractState(defaultContract());
        setRiskProfileState(initialRiskProfile);
        setConsultationState(initialConsultationInfo);
        setServerState(initialServerState);
      },
    }),
    [company, contract, riskProfile, consultation, server],
  );

  return <WizardContext.Provider value={value}>{children}</WizardContext.Provider>;
}

export function useWizard(): WizardContextValue {
  const ctx = useContext(WizardContext);
  if (!ctx) throw new Error("useWizard must be used within a WizardProvider");
  return ctx;
}
