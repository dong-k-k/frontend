import { describe, expect, it } from "vitest";
import { aggregateRiskAssessments } from "./riskAggregate";
import type { RiskAssessmentResponse } from "./types";

function assessment(overrides: Partial<RiskAssessmentResponse>): RiskAssessmentResponse {
  return {
    assessment_id: 1,
    settlement_id: 1,
    net_exposure: 100,
    holding_days: 30,
    current_rate: 1350,
    contract_rate: 1330,
    valuation_pl: 0,
    es_pct: 2,
    expected_max_loss: 1000,
    bep_gap: null,
    bep_safety_margin_pct: null,
    risk_grade: "LOW",
    recommended_action: "TARGET_ORDER",
    data_confidence: "HIGH",
    created_at: "2026-08-01T00:00:00",
    scenarios: [],
    ...overrides,
  };
}

describe("aggregateRiskAssessments", () => {
  it("returns null for an empty list", () => {
    expect(aggregateRiskAssessments([])).toBeNull();
  });

  it("does not invent a BEP safety margin when every assessment lacks bep_rate", () => {
    const agg = aggregateRiskAssessments([assessment({ bep_safety_margin_pct: null })]);
    expect(agg?.bepSafetyMarginPctWorst).toBeNull();
  });

  it("picks the worst (smallest) margin among assessments that do have one, ignoring nulls", () => {
    const agg = aggregateRiskAssessments([
      assessment({ bep_safety_margin_pct: null }),
      assessment({ bep_safety_margin_pct: 5 }),
      assessment({ bep_safety_margin_pct: 1.5 }),
    ]);
    expect(agg?.bepSafetyMarginPctWorst).toBe(1.5);
  });

  it("keeps both export_pl_krw and import_pl_krw as the server sent them, without flipping either sign", () => {
    const scenario = { scenario_pct: -5, projected_rate: 1300, export_pl_krw: -50, import_pl_krw: 50, remark: null };
    const agg = aggregateRiskAssessments([assessment({ scenarios: [scenario] })]);
    expect(agg?.scenarios[0].export_pl_krw).toBe(-50);
    expect(agg?.scenarios[0].import_pl_krw).toBe(50);
  });

  it("sums both export_pl_krw and import_pl_krw across items for the same scenario_pct instead of overwriting them", () => {
    const a = assessment({ scenarios: [{ scenario_pct: 0, projected_rate: 1350, export_pl_krw: 10, import_pl_krw: -10, remark: null }] });
    const b = assessment({ scenarios: [{ scenario_pct: 0, projected_rate: 1350, export_pl_krw: 20, import_pl_krw: -20, remark: null }] });
    const agg = aggregateRiskAssessments([a, b]);
    expect(agg?.scenarios[0].export_pl_krw).toBe(30);
    expect(agg?.scenarios[0].import_pl_krw).toBe(-30);
  });
});
