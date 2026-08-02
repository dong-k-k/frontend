import type { ForecastPoint, RateForecastResponse, RateHistoryResponse, RiskAssessmentResponse, RiskScenario } from "./types";

/**
 * The live server serializes Pydantic `Decimal` fields as JSON **strings**
 * (e.g. `"net_exposure": "500000.00"`), not numbers — confirmed by inspecting
 * the actual `POST .../risk-assessment` response body. The TypeScript types
 * in `types.ts` declare these as `number` (the intended shape consumers work
 * with), so every Decimal-backed field is normalized here, once, right after
 * the fetch — everything downstream (aggregation, charts, formatters) can
 * then trust it's a real number instead of re-coercing in a dozen places.
 */
function toNumber(value: number | string): number {
  return typeof value === "number" ? value : Number(value);
}

function toNumberOrNull(value: number | string | null): number | null {
  if (value === null) return null;
  return toNumber(value);
}

export function normalizeRiskScenario(raw: RiskScenario): RiskScenario {
  return {
    scenario_pct: toNumber(raw.scenario_pct),
    projected_rate: toNumber(raw.projected_rate),
    export_pl_krw: toNumber(raw.export_pl_krw),
    import_pl_krw: toNumber(raw.import_pl_krw),
    remark: raw.remark,
  };
}

export function normalizeRiskAssessment(raw: RiskAssessmentResponse): RiskAssessmentResponse {
  return {
    ...raw,
    net_exposure: toNumber(raw.net_exposure),
    current_rate: toNumber(raw.current_rate),
    contract_rate: toNumber(raw.contract_rate),
    valuation_pl: toNumber(raw.valuation_pl),
    es_pct: toNumber(raw.es_pct),
    expected_max_loss: toNumber(raw.expected_max_loss),
    bep_gap: toNumberOrNull(raw.bep_gap),
    bep_safety_margin_pct: toNumberOrNull(raw.bep_safety_margin_pct),
    scenarios: raw.scenarios.map(normalizeRiskScenario),
  };
}

export function normalizeRateHistory(raw: RateHistoryResponse): RateHistoryResponse {
  return {
    ...raw,
    bep_rate: toNumberOrNull(raw.bep_rate),
    confidence_band_pct: toNumberOrNull(raw.confidence_band_pct),
    series: raw.series.map((p) => ({ date: p.date, rate: toNumber(p.rate) })),
  };
}

function normalizeForecastPoint(raw: ForecastPoint): ForecastPoint {
  return {
    date: raw.date,
    point: toNumber(raw.point),
    lower: toNumber(raw.lower),
    median: toNumber(raw.median),
    upper: toNumber(raw.upper),
  };
}

/** 다른 Decimal 필드(net_exposure 등)와 동일하게, 실제 서버가 point/lower/median/upper를
 * JSON 문자열로 내려보내므로 숫자로 정규화한다. */
export function normalizeRateForecast(raw: RateForecastResponse): RateForecastResponse {
  return {
    ...raw,
    forecast: raw.forecast.map(normalizeForecastPoint),
  };
}
