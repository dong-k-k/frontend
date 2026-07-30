import type { AnalysisResult, ContractInfo, RiskGrade, ScenarioRow } from "./types";

/** Sample USD/KRW 매매기준율 used as the "live" reference rate for this demo. */
export const MOCK_CURRENT_RATE = 1350.2;

/**
 * Assumed annualized USD/KRW volatility used to derive the parametric ES estimate below.
 * This is a simplifying, clearly-labeled demo assumption — not a market-calibrated figure.
 */
const ASSUMED_ANNUAL_VOL_PCT = 8;
const TRADING_DAYS_PER_YEAR = 252;
/** Expected Shortfall multiplier at the 97.5% level for a standard normal distribution. */
const ES_975_MULTIPLIER = 2.34;

export function businessDaysBetween(start: Date, end: Date): number {
  const from = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const to = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  if (to <= from) return 0;
  let count = 0;
  const cursor = new Date(from);
  cursor.setDate(cursor.getDate() + 1);
  while (cursor <= to) {
    const day = cursor.getDay();
    if (day !== 0 && day !== 6) count++;
    cursor.setDate(cursor.getDate() + 1);
  }
  return count;
}

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

function riskGradeFrom(esAbsPct: number, safetyMarginPct: number): RiskGrade {
  if (safetyMarginPct <= 0) return "HIGH";
  if (esAbsPct >= safetyMarginPct) return "HIGH";
  if (esAbsPct >= safetyMarginPct * 0.5) return "MEDIUM";
  return "LOW";
}

/**
 * Computes a demo risk analysis for a contract.
 *
 * Statistical figures (ES%, max loss) use a simplified parametric approach —
 * a fixed assumed annualized volatility scaled by sqrt(time) — rather than a
 * real historical-data model. Exposure, BEP margin and business-day figures
 * are computed directly from the entered contract, not sampled.
 */
export function computeAnalysis(contract: ContractInfo, today: Date = new Date()): AnalysisResult {
  const currentRate = MOCK_CURRENT_RATE;
  const netExposureForeign = contract.amount ?? 0;
  const netExposureKrw = netExposureForeign * currentRate;

  const bepIsEstimated = contract.bep == null;
  const bep =
    contract.bep ??
    (contract.contractType === "export" ? currentRate * 0.978 : currentRate * 1.022);

  const bepSafetyMarginPct =
    contract.contractType === "export"
      ? ((currentRate - bep) / currentRate) * 100
      : ((bep - currentRate) / currentRate) * 100;

  const dueDate = contract.dueDate ? new Date(contract.dueDate) : today;
  const remainingBusinessDays = businessDaysBetween(today, dueDate);

  const dailyVol = ASSUMED_ANNUAL_VOL_PCT / 100 / Math.sqrt(TRADING_DAYS_PER_YEAR);
  const horizonVol = dailyVol * Math.sqrt(Math.max(remainingBusinessDays, 1));
  const esPct = -(horizonVol * ES_975_MULTIPLIER * 100);
  const maxLossKrw = netExposureKrw * (esPct / 100);

  const riskGrade = riskGradeFrom(Math.abs(esPct), bepSafetyMarginPct);
  const breachMoveKrw = Math.abs(currentRate - bep);

  const scenarios: ScenarioRow[] = [-10, -5, 0, 5, 10].map((deltaPct) => {
    const impliedRate = currentRate * (1 + deltaPct / 100);
    const direction = contract.contractType === "export" ? 1 : -1;
    const pnlKrw = netExposureKrw * (deltaPct / 100) * direction;
    return { deltaPct, impliedRate, pnlKrw };
  });

  return {
    currentRate,
    netExposureForeign,
    netExposureKrw,
    bep,
    bepIsEstimated,
    bepSafetyMarginPct,
    remainingBusinessDays,
    esPct,
    maxLossKrw,
    riskGrade,
    breachMoveKrw,
    scenarios,
  };
}

export const RISK_GRADE_LABEL: Record<RiskGrade, string> = {
  LOW: "낮음",
  MEDIUM: "중간",
  HIGH: "높음",
};
