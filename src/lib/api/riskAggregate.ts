import type { ContractType } from "@/lib/types";
import type { ApiRiskGrade, RiskAssessmentResponse } from "./types";

const GRADE_RANK: Record<ApiRiskGrade, number> = { LOW: 0, MEDIUM: 1, HIGH: 2 };

export interface AggregatedScenario {
  scenario_pct: number;
  projected_rate: number;
  pl_krw: number;
}

export interface AggregatedRisk {
  riskGrade: ApiRiskGrade;
  netExposureTotal: number;
  currentRate: number;
  bepSafetyMarginPctWorst: number;
  esPctAggregate: number;
  expectedMaxLossTotal: number;
  holdingDaysMin: number;
  scenarios: AggregatedScenario[];
  itemCount: number;
}

/**
 * Aggregates one risk-assessment response per settlement item (payment
 * schedule) into a single view for the result screen. The backend has no
 * "assess the whole contract at once" endpoint — each settlement item is
 * assessed independently — so this combines them the same way the old
 * client-side mock model did: exposure and expected loss are summed, the
 * worst (tightest) BEP safety margin drives the headline risk, and the
 * overall grade is the worst grade seen across items.
 */
export function aggregateRiskAssessments(
  assessments: RiskAssessmentResponse[],
  contractType: ContractType,
): AggregatedRisk | null {
  if (assessments.length === 0) return null;

  const netExposureTotal = assessments.reduce((sum, a) => sum + a.net_exposure, 0);
  const expectedMaxLossTotal = assessments.reduce((sum, a) => sum + a.expected_max_loss, 0);
  const holdingDaysMin = Math.min(...assessments.map((a) => a.holding_days));
  const worst = assessments.reduce((a, b) => (b.bep_safety_margin_pct < a.bep_safety_margin_pct ? b : a));
  const riskGrade = assessments.reduce<ApiRiskGrade>(
    (worstGrade, a) => (GRADE_RANK[a.risk_grade] > GRADE_RANK[worstGrade] ? a.risk_grade : worstGrade),
    assessments[0].risk_grade,
  );
  const esPctAggregate = netExposureTotal !== 0 ? (expectedMaxLossTotal / netExposureTotal) * 100 : 0;

  const scenarioMap = new Map<number, AggregatedScenario>();
  for (const a of assessments) {
    for (const s of a.scenarios) {
      const pl = contractType === "export" ? s.export_pl_krw : s.import_pl_krw;
      const existing = scenarioMap.get(s.scenario_pct);
      if (existing) {
        existing.pl_krw += pl;
      } else {
        scenarioMap.set(s.scenario_pct, {
          scenario_pct: s.scenario_pct,
          projected_rate: s.projected_rate,
          pl_krw: pl,
        });
      }
    }
  }
  const scenarios = [...scenarioMap.values()].sort((a, b) => a.scenario_pct - b.scenario_pct);

  return {
    riskGrade,
    netExposureTotal,
    currentRate: assessments[0].current_rate,
    bepSafetyMarginPctWorst: worst.bep_safety_margin_pct,
    esPctAggregate,
    expectedMaxLossTotal,
    holdingDaysMin,
    scenarios,
    itemCount: assessments.length,
  };
}
