"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { CompanyInfo, ConsultationInfo, ContractInfo, RiskProfile } from "@/lib/types";
import { addDays, toISODate } from "@/lib/date";

const initialCompanyInfo: CompanyInfo = {
  companyType: "export",
  exportRevenueUsd: 2_400_000,
  importRevenueUsd: null,
  annualRevenueKrw: 8_500_000_000,
  operatingProfitKrw: 320_000_000,
  creditRating: "BBB",
};

const initialContractInfo: ContractInfo = {
  contractType: "export",
  countryCode: "US",
  settlementMethod: "TT",
  amount: 500_000,
  currency: "USD",
  priceFixDate: "",
  dueDate: "",
  bep: 1320,
  dueDateAdjustable: true,
};

/**
 * Builds a fresh contract default: signed 30 days ago, due 90 days from now.
 * Computed once per call (initial render, and again on reset()) so the demo
 * always shows an already-signed contract due a few months out, regardless
 * of when the app is actually run.
 */
function defaultContract(): ContractInfo {
  const today = new Date();
  return {
    ...initialContractInfo,
    priceFixDate: toISODate(addDays(today, -30)),
    dueDate: toISODate(addDays(today, 90)),
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

interface WizardContextValue {
  company: CompanyInfo;
  setCompany: (patch: Partial<CompanyInfo>) => void;
  contract: ContractInfo;
  setContract: (patch: Partial<ContractInfo>) => void;
  riskProfile: RiskProfile;
  setRiskProfile: (patch: Partial<RiskProfile>) => void;
  consultation: ConsultationInfo;
  setConsultation: (patch: Partial<ConsultationInfo>) => void;
  consultationSubmitted: { id: string } | null;
  submitConsultation: () => { id: string };
  reset: () => void;
}

const WizardContext = createContext<WizardContextValue | null>(null);

export function WizardProvider({ children }: { children: ReactNode }) {
  const [company, setCompanyState] = useState<CompanyInfo>(initialCompanyInfo);
  const [contract, setContractState] = useState<ContractInfo>(defaultContract);
  const [riskProfile, setRiskProfileState] = useState<RiskProfile>(initialRiskProfile);
  const [consultation, setConsultationState] = useState<ConsultationInfo>(initialConsultationInfo);
  const [consultationSubmitted, setConsultationSubmitted] = useState<{ id: string } | null>(null);

  const value = useMemo<WizardContextValue>(
    () => ({
      company,
      setCompany: (patch) => setCompanyState((prev) => ({ ...prev, ...patch })),
      contract,
      setContract: (patch) => setContractState((prev) => ({ ...prev, ...patch })),
      riskProfile,
      setRiskProfile: (patch) => setRiskProfileState((prev) => ({ ...prev, ...patch })),
      consultation,
      setConsultation: (patch) => setConsultationState((prev) => ({ ...prev, ...patch })),
      consultationSubmitted,
      submitConsultation: () => {
        const id = `FXM-${new Date()
          .toISOString()
          .slice(0, 10)
          .replace(/-/g, "")}-${Math.floor(Math.random() * 9000 + 1000)}`;
        const result = { id };
        setConsultationSubmitted(result);
        return result;
      },
      reset: () => {
        setCompanyState(initialCompanyInfo);
        setContractState(defaultContract());
        setRiskProfileState(initialRiskProfile);
        setConsultationState(initialConsultationInfo);
        setConsultationSubmitted(null);
      },
    }),
    [company, contract, riskProfile, consultation, consultationSubmitted],
  );

  return <WizardContext.Provider value={value}>{children}</WizardContext.Provider>;
}

export function useWizard(): WizardContextValue {
  const ctx = useContext(WizardContext);
  if (!ctx) throw new Error("useWizard must be used within a WizardProvider");
  return ctx;
}
