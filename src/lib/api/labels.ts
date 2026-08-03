import type { ApiEligibilityStatus } from "./types";

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

export const ELIGIBILITY_LABEL: Record<ApiEligibilityStatus, string> = {
  RECOMMENDED: "추천",
  CONDITIONAL: "조건부 추천",
  RM_REVIEW_REQUIRED: "RM 확인 필요",
  NOT_RECOMMENDED: "비추천",
};

export const ELIGIBILITY_BADGE_VARIANT: Record<ApiEligibilityStatus, "success" | "warning" | "neutral"> = {
  RECOMMENDED: "success",
  CONDITIONAL: "warning",
  RM_REVIEW_REQUIRED: "warning",
  NOT_RECOMMENDED: "neutral",
};

/**
 * 백엔드는 시나리오를 "point"/"lower"/"median"/"upper" 원본 키로 보내다가,
 * 2026-08-03 이후 이미 한국어 문구("환율이 낮을 때" 등)로 번역해 보내도록 바뀌었다.
 * 두 형태를 모두 인식하도록 키워드 기반으로 분류해서, 어느 쪽이 오더라도 같은
 * 라벨/설명을 붙일 수 있게 한다.
 */
export type ScenarioKind = "point" | "lower" | "median" | "upper";

export function classifyScenarioKind(scenarioName: string): ScenarioKind | null {
  if (scenarioName === "point" || scenarioName.includes("AI 예상")) return "point";
  if (scenarioName === "lower" || scenarioName.includes("낮")) return "lower";
  if (scenarioName === "median" || scenarioName.includes("중간")) return "median";
  if (scenarioName === "upper" || scenarioName.includes("높")) return "upper";
  return null;
}

/** 시나리오 조건(환율이 어느 쪽으로 움직였는지)만 나타내는 객관적인 표현.
 * 이 결과가 유리한지 불리한지는 실제 손익 금액을 보고 별도로 판단한다(둘이 항상 같은 방향이지 않음). */
const SCENARIO_KIND_LABEL: Record<ScenarioKind, string> = {
  point: "AI 예상 환율",
  lower: "환율 하락 시나리오",
  median: "환율 유지 시나리오",
  upper: "환율 상승 시나리오",
};

const SCENARIO_KIND_DESCRIPTION: Record<ScenarioKind, string> = {
  point: "현재 조건에서 가장 가능성이 높은 예상 결과입니다.",
  lower: "환율이 하락하는 방향으로 움직일 경우 예상되는 결과입니다.",
  median: "환율이 현재 예측과 비슷한 수준을 유지할 경우 예상되는 결과입니다.",
  upper: "환율이 상승하는 방향으로 움직일 경우 예상되는 결과입니다.",
};

export function scenarioNameLabel(scenarioName: string): string {
  const kind = classifyScenarioKind(scenarioName);
  return kind ? SCENARIO_KIND_LABEL[kind] : scenarioName;
}

export function scenarioConditionDescription(scenarioName: string): string {
  const kind = classifyScenarioKind(scenarioName);
  return kind ? SCENARIO_KIND_DESCRIPTION[kind] : "현재 조건을 기준으로 예상한 결과입니다.";
}