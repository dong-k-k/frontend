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

/** 값이 없는 필드(서버 스키마상 optional) 표시용 — 실제 값이 없으면 "-"만 보여주고, 임의 기본값으로 채우지 않는다. */
export function formatOrDash<T>(value: T | null | undefined, format: (v: T) => string): string {
  return value === null || value === undefined ? "-" : format(value);
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

/** 시나리오 응답에는 이름(enum)이 없고 scenario_pct(숫자)만 있다 — 그 숫자에서
 * 직접 파생한 라벨이며, 존재하지 않는 시나리오 이름을 지어내지 않는다. */
export function scenarioLabel(scenarioPct: number): string {
  if (scenarioPct === 0) return "변동없음";
  return `${scenarioPct > 0 ? "+" : ""}${scenarioPct}%`;
}

export const RISK_GRADE_LABEL: Record<RiskGrade, string> = {
  LOW: "낮음",
  MEDIUM: "중간",
  HIGH: "높음",
};
