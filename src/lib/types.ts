export type CompanyType = "export" | "import" | "both";

export type CreditRating = "A_PLUS" | "BBB" | "BB_MINUS" | "UNKNOWN";

export interface CompanyInfo {
  companyType: CompanyType;
  exportRevenueUsd: number | null;
  importRevenueUsd: number | null;
  annualRevenueKrw: number | null;
  operatingProfitKrw: number | null;
  creditRating: CreditRating | null;
}

export type ContractType = "export" | "import";
export type SettlementMethod = "TT" | "LC" | "DP" | "DA";

export interface PaymentSchedule {
  id: string;
  amount: number | null;
  currency: string;
  priceFixDate: string;
  dueDate: string;
  bep: number | null;
  dueDateAdjustable: boolean;
}

export interface ContractInfo {
  contractType: ContractType;
  countryCode: string;
  settlementMethod: SettlementMethod;
  /** One entry per payment. Index 0 ("결제 정보 카드 1") is always required and cannot be removed. */
  paymentSchedules: PaymentSchedule[];
}

export type MaxLossTolerance = "UNDER_2" | "BETWEEN_2_5" | "OVER_5";
export type KrwCertaintyPreference = "FULL_LOCK" | "PARTIAL_LOCK" | "KEEP_UPSIDE";
export type HedgeManagementStyle = "SET_AND_HOLD" | "ADJUST_GRADUALLY" | "REACT_AS_NEEDED";

export interface RiskProfile {
  maxLossTolerance: MaxLossTolerance | null;
  krwCertaintyPreference: KrwCertaintyPreference | null;
  hedgeManagementStyle: HedgeManagementStyle | null;
}

export type ContactMethod = "PHONE" | "EMAIL" | "BRANCH";

export interface ConsultationInfo {
  companyName: string;
  contactName: string;
  phone: string;
  email: string;
  contactMethod: ContactMethod;
  preferredTime: string;
  branch: string;
  memo: string;
  agree: boolean;
}

export type RiskGrade = "LOW" | "MEDIUM" | "HIGH";

export interface ScenarioRow {
  deltaPct: number;
  impliedRate: number;
  pnlKrw: number;
}

export interface AnalysisResult {
  currentRate: number;
  netExposureForeign: number;
  netExposureKrw: number;
  bep: number;
  bepIsEstimated: boolean;
  bepSafetyMarginPct: number;
  remainingBusinessDays: number;
  esPct: number;
  maxLossKrw: number;
  riskGrade: RiskGrade;
  breachMoveKrw: number;
  scenarios: ScenarioRow[];
  /** Number of payment schedules (결제 정보 카드) this analysis aggregates. */
  scheduleCount: number;
}
