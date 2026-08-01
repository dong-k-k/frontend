import type { ContractInfo, RiskGrade } from "./types";

export function formatKrw(value: number): string {
  return `${Math.round(value).toLocaleString("ko-KR")}원`;
}

export function formatSignedKrw(value: number): string {
  const rounded = Math.round(value);
  const sign = rounded > 0 ? "+" : "";
  return `${sign}${rounded.toLocaleString("ko-KR")}`;
}

export function formatNumber(value: number, fractionDigits = 0): string {
  return value.toLocaleString("ko-KR", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
}

export function formatDateDots(iso: string): string {
  if (!iso) return "";
  return iso.replaceAll("-", ".");
}

/** First schedule's currency, used as the contract's representative currency for display. */
export function primaryCurrency(contract: ContractInfo): string {
  return contract.paymentSchedules[0]?.currency ?? "USD";
}

/** Nearest upcoming 결제 예정일 across all payment schedules. */
export function nearestDueDate(contract: ContractInfo): string {
  const dates = contract.paymentSchedules.map((s) => s.dueDate).filter(Boolean).sort();
  return dates[0] ?? "";
}

/** True only if every payment schedule's due date is adjustable. */
export function allDueDatesAdjustable(contract: ContractInfo): boolean {
  return contract.paymentSchedules.length > 0 && contract.paymentSchedules.every((s) => s.dueDateAdjustable);
}

export const RISK_GRADE_LABEL: Record<RiskGrade, string> = {
  LOW: "낮음",
  MEDIUM: "중간",
  HIGH: "높음",
};
