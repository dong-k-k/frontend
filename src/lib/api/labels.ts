import type { ApiMatchVerdict } from "./types";

/**
 * The API returns raw enum-ish strings for strategy types and product
 * groups with no accompanying Korean label. This maps the values seen in
 * the spec's examples, and falls back to a humanized version of the raw
 * value (underscores → spaces, title case) for anything unrecognized —
 * so a new backend enum value never renders as a broken UI, just a
 * slightly less polished one.
 */
const STRATEGY_TYPE_LABEL: Record<string, string> = {
  FULL_COVER_INSURANCE: "전액 헤지(환변동보험)",
  PARTIAL_HEDGE_MONITOR: "부분 헤지 + 모니터링",
  NO_ACTION: "대응 없음",
};

function humanize(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function strategyTypeLabel(strategyType: string): string {
  return STRATEGY_TYPE_LABEL[strategyType] ?? humanize(strategyType);
}

const STRATEGY_GROUP_LABEL: Record<string, string> = {
  FX_HEDGING: "환헤지",
  EXPORT_LEAD: "수출금융",
  IMPORT_LEAD: "수입금융",
  FX_MATCHING: "매칭거래",
};

export function strategyGroupLabel(strategyGroup: string): string {
  return STRATEGY_GROUP_LABEL[strategyGroup] ?? humanize(strategyGroup);
}

export const VERDICT_LABEL: Record<ApiMatchVerdict, string> = {
  ELIGIBLE: "자격 충족",
  CONDITIONAL: "조건부 충족",
  NOT_ELIGIBLE: "자격 미충족",
};

export const VERDICT_BADGE_VARIANT: Record<ApiMatchVerdict, "success" | "warning" | "neutral"> = {
  ELIGIBLE: "success",
  CONDITIONAL: "warning",
  NOT_ELIGIBLE: "neutral",
};
