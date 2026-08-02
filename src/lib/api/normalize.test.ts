import { describe, expect, it } from "vitest";
import { normalizeRateForecast, normalizeRateHistory, normalizeRiskAssessment } from "./normalize";
import type { RateForecastResponse, RateHistoryResponse, RiskAssessmentResponse } from "./types";

// The live server serializes Decimal fields as JSON strings (verified via a
// real POST .../risk-assessment call, e.g. "net_exposure": "500000.00").
// These fixtures use that exact shape — `as unknown as RiskAssessmentResponse`
// stands in for what the wire actually sends versus what the type declares.
const rawAssessment = {
  assessment_id: 12,
  settlement_id: 17,
  net_exposure: "500000.00",
  holding_days: 65,
  current_rate: "1441.10",
  contract_rate: "1320.00",
  valuation_pl: "60550000.00",
  es_pct: "12.910",
  expected_max_loss: "93023005.00",
  bep_gap: "121.10",
  bep_safety_margin_pct: "8.400",
  risk_grade: "HIGH",
  recommended_action: "IMMEDIATE_HEDGE",
  data_confidence: "BASIC",
  created_at: "2026-08-02T17:45:36.609211",
  scenarios: [
    { scenario_pct: "-10.00", projected_rate: "1296.99", export_pl_krw: "-72055000.00", import_pl_krw: "72055000.00", remark: null },
  ],
} as unknown as RiskAssessmentResponse;

describe("normalizeRiskAssessment", () => {
  it("coerces every Decimal-backed field to a real number", () => {
    const normalized = normalizeRiskAssessment(rawAssessment);
    expect(normalized.net_exposure).toBe(500000);
    expect(normalized.current_rate).toBe(1441.1);
    expect(normalized.es_pct).toBe(12.91);
    expect(normalized.bep_gap).toBe(121.1);
    expect(normalized.bep_safety_margin_pct).toBe(8.4);
    expect(normalized.scenarios[0].scenario_pct).toBe(-10);
    expect(normalized.scenarios[0].export_pl_krw).toBe(-72055000);
  });

  it("leaves an already-numeric bep_gap/bep_safety_margin_pct alone (mock mode sends real numbers)", () => {
    const normalized = normalizeRiskAssessment({ ...rawAssessment, bep_gap: 10, bep_safety_margin_pct: 2 } as unknown as RiskAssessmentResponse);
    expect(normalized.bep_gap).toBe(10);
    expect(normalized.bep_safety_margin_pct).toBe(2);
  });

  it("does not turn a genuine null into 0 or NaN", () => {
    const normalized = normalizeRiskAssessment({ ...rawAssessment, bep_gap: null, bep_safety_margin_pct: null } as unknown as RiskAssessmentResponse);
    expect(normalized.bep_gap).toBeNull();
    expect(normalized.bep_safety_margin_pct).toBeNull();
  });

  it("arithmetic on the normalized value no longer produces NaN (the bug this fixes)", () => {
    const normalized = normalizeRiskAssessment(rawAssessment);
    expect(Number.isNaN(normalized.net_exposure + normalized.scenarios[0].export_pl_krw)).toBe(false);
  });
});

const rawRateHistory = {
  settlement_id: 17,
  currency: "USD",
  bep_rate: "1320.00",
  confidence_band_pct: "2.100",
  source: "한국은행 ECOS(731Y001)",
  as_of: "2026-07-31",
  series: [{ date: "2026-07-31", rate: "1441.10" }],
} as unknown as RateHistoryResponse;

describe("normalizeRateHistory", () => {
  it("coerces bep_rate, confidence_band_pct, and every series point", () => {
    const normalized = normalizeRateHistory(rawRateHistory);
    expect(normalized.bep_rate).toBe(1320);
    expect(normalized.confidence_band_pct).toBe(2.1);
    expect(normalized.series[0].rate).toBe(1441.1);
  });

  it("keeps bep_rate/confidence_band_pct null when the server omits them", () => {
    const normalized = normalizeRateHistory({ ...rawRateHistory, bep_rate: null, confidence_band_pct: null } as unknown as RateHistoryResponse);
    expect(normalized.bep_rate).toBeNull();
    expect(normalized.confidence_band_pct).toBeNull();
  });
});

// 실제 `GET .../rate-forecast` 응답 기준(app/risk/schemas.py::RateForecastResponse) —
// point/lower/median/upper는 Decimal이라 다른 Decimal 필드처럼 문자열로 내려온다.
const rawRateForecast = {
  settlement_id: 17,
  currency_pair: "USD/KRW",
  forecast_origin: "2026-08-03",
  horizon: 90,
  unit: "KRW per USD",
  model_name: "shrunk_ensemble",
  generated_at: "2026-08-03T03:00:00+09:00",
  forecast: [{ date: "2026-08-04", point: "1443.20", lower: "1420.00", median: "1442.00", upper: "1466.00" }],
  warnings: ["Chronos 분위수는 검증된 신뢰구간이 아닙니다."],
} as unknown as RateForecastResponse;

describe("normalizeRateForecast", () => {
  it("coerces every forecast point's Decimal-string fields", () => {
    const normalized = normalizeRateForecast(rawRateForecast);
    expect(normalized.forecast[0].point).toBe(1443.2);
    expect(normalized.forecast[0].lower).toBe(1420);
    expect(normalized.forecast[0].median).toBe(1442);
    expect(normalized.forecast[0].upper).toBe(1466);
  });

  it("leaves non-Decimal fields (currency_pair/model_name/warnings) untouched", () => {
    const normalized = normalizeRateForecast(rawRateForecast);
    expect(normalized.currency_pair).toBe("USD/KRW");
    expect(normalized.model_name).toBe("shrunk_ensemble");
    expect(normalized.warnings).toEqual(["Chronos 분위수는 검증된 신뢰구간이 아닙니다."]);
  });

  it("does not fabricate points for an empty forecast array", () => {
    const normalized = normalizeRateForecast({ ...rawRateForecast, forecast: [] } as unknown as RateForecastResponse);
    expect(normalized.forecast).toEqual([]);
  });
});
