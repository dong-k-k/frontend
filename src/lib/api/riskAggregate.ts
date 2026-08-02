import type { ApiRiskGrade, RiskAssessmentResponse } from "./types";

const GRADE_RANK: Record<ApiRiskGrade, number> = { LOW: 0, MEDIUM: 1, HIGH: 2 };

/** export_pl_krw/import_pl_krw를 둘 다 그대로 보존한다 — 어느 방향을 보여줄지는
 * 화면(ScenarioSection)이 계약의 실제 거래방향으로 정하고, 여기서는 서버가 준
 * 부호를 미리 반전하거나 하나로 합치지 않는다. */
export interface AggregatedScenario {
  scenario_pct: number;
  projected_rate: number;
  export_pl_krw: number;
  import_pl_krw: number;
  remark: string | null;
}

export interface AggregatedRisk {
  riskGrade: ApiRiskGrade;
  netExposureTotal: number;
  currentRate: number;
  /** null when every assessment is missing bep_rate(따라서 bep_safety_margin_pct도 null)인 경우. */
  bepSafetyMarginPctWorst: number | null;
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
export function aggregateRiskAssessments(assessments: RiskAssessmentResponse[]): AggregatedRisk | null {
  if (assessments.length === 0) return null;

  const netExposureTotal = assessments.reduce((sum, a) => sum + a.net_exposure, 0);
  const expectedMaxLossTotal = assessments.reduce((sum, a) => sum + a.expected_max_loss, 0);
  const holdingDaysMin = Math.min(...assessments.map((a) => a.holding_days));
  // bep_safety_margin_pct는 해당 정산건에 bep_rate(BEP)가 없으면 null이다 — null을 가진
  // 항목은 "여유율을 알 수 없음"이지 "가장 위험함"이 아니므로 비교에서 제외한다.
  const marginsWithValue = assessments.filter(
    (a): a is typeof a & { bep_safety_margin_pct: number } => a.bep_safety_margin_pct !== null,
  );
  const bepSafetyMarginPctWorst =
    marginsWithValue.length > 0
      ? marginsWithValue.reduce((a, b) => (b.bep_safety_margin_pct < a.bep_safety_margin_pct ? b : a))
          .bep_safety_margin_pct
      : null;
  const riskGrade = assessments.reduce<ApiRiskGrade>(
    (worstGrade, a) => (GRADE_RANK[a.risk_grade] > GRADE_RANK[worstGrade] ? a.risk_grade : worstGrade),
    assessments[0].risk_grade,
  );
  const esPctAggregate = netExposureTotal !== 0 ? (expectedMaxLossTotal / netExposureTotal) * 100 : 0;

  const scenarioMap = new Map<number, AggregatedScenario>();
  for (const a of assessments) {
    for (const s of a.scenarios) {
      const existing = scenarioMap.get(s.scenario_pct);
      if (existing) {
        existing.export_pl_krw += s.export_pl_krw;
        existing.import_pl_krw += s.import_pl_krw;
        existing.remark = existing.remark ?? s.remark;
      } else {
        scenarioMap.set(s.scenario_pct, {
          scenario_pct: s.scenario_pct,
          projected_rate: s.projected_rate,
          export_pl_krw: s.export_pl_krw,
          import_pl_krw: s.import_pl_krw,
          remark: s.remark,
        });
      }
    }
  }
  const scenarios = [...scenarioMap.values()].sort((a, b) => a.scenario_pct - b.scenario_pct);

  return {
    riskGrade,
    netExposureTotal,
    currentRate: assessments[0].current_rate,
    bepSafetyMarginPctWorst,
    esPctAggregate,
    expectedMaxLossTotal,
    holdingDaysMin,
    scenarios,
    itemCount: assessments.length,
  };
}
