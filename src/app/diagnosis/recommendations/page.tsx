"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Shell, ShellHeader } from "@/components/ui/Shell";
import { LinkButton } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useWizard } from "@/context/wizard-context";
import { useDownloadStrategyReport } from "@/hooks/useDownloadStrategyReport";
import { aggregateRiskAssessments } from "@/lib/api/riskAggregate";
import {
  createProductMatch,
  createStrategyRecommendation,
  ApiError,
  ELIGIBILITY_LABEL,
  ELIGIBILITY_BADGE_VARIANT,
  scenarioNameLabel,
  scenarioConditionDescription,
  parseProductMatchReasons,
} from "@/lib/api";
import type { AvoidedLossScenario } from "@/lib/api";

import {
  allDueDatesAdjustable,
  formatDateDots,
  formatKrw,
  formatManwon,
  formatNumber,
  formatOrDash,
  formatSignedWon,
  nearestDueDate,
  RISK_GRADE_LABEL,
} from "@/lib/risk";

/** "손실 회피액"(avoidedLossKrw)을 "이 상품을 쓰지 않았다면 어떻게 됐을지" 손익으로 뒤집어 보여준다.
 * 회피액이 양수면 상품 덕분에 막은 손실이 있었다는 뜻이므로, 안 썼다면 그만큼 손실(-)이 났을 것이고,
 * 회피액이 음수면 오히려 안 쓰는 편이 나았을 것이므로 그만큼 이익(+)이 됐을 것이다. 계산 자체는 그대로 두고
 * 부호만 사용자 관점("안 썼다면 손익이 얼마?")으로 재해석하는 표시 전용 로직이다. */
const NEUTRAL_THRESHOLD_KRW = 10000;

type ScenarioImpact = "loss" | "gain" | "neutral";

function classifyImpact(pnlIfNotUsed: number): ScenarioImpact {
  if (pnlIfNotUsed <= -NEUTRAL_THRESHOLD_KRW) return "loss";
  if (pnlIfNotUsed >= NEUTRAL_THRESHOLD_KRW) return "gain";
  return "neutral";
}

const IMPACT_STYLE: Record<ScenarioImpact, { amountClass: string; headline: string }> = {
  loss: { amountClass: "text-danger", headline: "예상 손실" },
  gain: { amountClass: "text-success-text", headline: "예상 이익" },
  neutral: { amountClass: "text-ink-soft", headline: "예상 손익 변화 미미" },
};

function impactSentence(impact: ScenarioImpact, pnlIfNotUsed: number): string {
  if (impact === "loss") return `약 ${formatManwon(pnlIfNotUsed)}의 손실이 발생할 수 있습니다.`;
  if (impact === "gain") return `약 ${formatManwon(pnlIfNotUsed)}의 이익이 발생할 수 있습니다.`;
  return "값이 0에 가까워 큰 손익 변화가 예상되지 않습니다.";
}

function AvoidedLossScenarioItem({ scenario }: { scenario: AvoidedLossScenario }) {
  const pnlIfNotUsed = -scenario.avoidedLossKrw;
  const impact = classifyImpact(pnlIfNotUsed);
  const style = IMPACT_STYLE[impact];
  return (
    <div className="rounded-lg border border-border-soft bg-surface p-3">
      <div className="text-[10.5px] font-bold text-ink-soft">{scenarioNameLabel(scenario.scenarioName)}</div>
      <div className="mt-1.5 text-[11px] font-bold text-ink-soft">{style.headline}</div>
      <div className={`mt-0.5 text-[15px] font-extrabold ${style.amountClass}`}>{formatSignedWon(pnlIfNotUsed)}</div>
      <p className="mt-1 text-[11px] leading-relaxed text-ink-soft">{impactSentence(impact, pnlIfNotUsed)}</p>
      <p className="mt-1.5 text-[10.5px] leading-relaxed text-muted">
        {scenarioConditionDescription(scenario.scenarioName)}
      </p>
    </div>
  );
}

/** dongkk-server가 내려주는 `reason_text`(내부 코드가 섞인 문장을 "; "로 이어붙인
 * 문자열)를 사람이 읽기 좋은 문장 목록으로 바꿔 보여준다. 실제로 표시할 문장이
 * 없으면 아무것도 렌더링하지 않는다(없는 근거를 지어내지 않음). */
function ProductMatchReasons({ reasonText }: { reasonText: string | null }) {
  const reasons = parseProductMatchReasons(reasonText);
  if (reasons.length === 0) return null;
  return (
    <div className="mt-2">
      <div className="text-[10.5px] font-bold text-ink-soft">추천 이유</div>
      <ul className="mt-1 list-disc space-y-0.5 pl-4 text-[11.5px] leading-relaxed text-ink-soft">
        {reasons.map((reason, idx) => (
          <li key={idx}>{reason}</li>
        ))}
      </ul>
    </div>
  );
}

export default function RecommendationsPage() {
  const { contract, server, setServer } = useWizard();
  const [loading, setLoading] = useState(!server.recommendationId);
  const [error, setError] = useState<string | null>(null);
  const { downloading: pdfDownloading, download: handleDownloadPdf } = useDownloadStrategyReport(
    server.recommendationId,
  );
  const startedRef = useRef(false);

  const assessments = useMemo(
    () =>
      contract.paymentSchedules
        .map((s) => server.assessmentByScheduleId[s.id])
        .filter((a): a is NonNullable<typeof a> => Boolean(a)),
    [contract.paymentSchedules, server.assessmentByScheduleId],
  );
  const agg = useMemo(() => aggregateRiskAssessments(assessments), [assessments]);

  const primaryScheduleId = contract.paymentSchedules[0]?.id;
  const primarySettlementId = primaryScheduleId ? server.settlementIdByScheduleId[primaryScheduleId] : undefined;
  const primaryAssessment = primaryScheduleId ? server.assessmentByScheduleId[primaryScheduleId] : undefined;

  useEffect(() => {
    if (startedRef.current || server.recommendationId) return;
    startedRef.current = true;

    (async () => {
      if (!primarySettlementId || !primaryAssessment || !server.riskProfileId) {
        throw new Error("진단 또는 성향 분석이 아직 완료되지 않았습니다. 이전 단계부터 다시 진행해주세요.");
      }
      const match = await createProductMatch({
        settlement_id: primarySettlementId,
        assessment_id: primaryAssessment.assessment_id,
        risk_profile_id: server.riskProfileId,
      });
      const recommendation = await createStrategyRecommendation({
        settlement_id: primarySettlementId,
        match_id: match.match_id,
        risk_profile_id: server.riskProfileId,
      });
      setServer({
        matchId: match.match_id,
        matchItems: match.items,
        recommendationId: recommendation.recommendation_id,
        recommendationMix: recommendation.recommendation_mix,
        recommendationReason: recommendation.recommendation_reason,
        avoidedLossByProduct: recommendation.avoided_loss_by_product,
      });
    })()
      .catch((e) =>
        setError(e instanceof ApiError || e instanceof Error ? e.message : "추천 정보를 불러오지 못했습니다."),
      )
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally runs once on mount
  }, []);

  const rankedItems = useMemo(
    () => [...server.matchItems].sort((a, b) => b.fit_score - a.fit_score),
    [server.matchItems],
  );

  if (loading) {
    return (
      <Shell width="lg">
        <ShellHeader step={4} />
        <div className="px-10 py-16 text-center text-sm text-ink-soft">AI가 전략과 상품을 분석하고 있습니다...</div>
      </Shell>
    );
  }

  if (error || !agg) {
    return (
      <Shell width="lg">
        <ShellHeader step={4} />
        <div className="px-10 py-16 text-center">
          <p className="mb-6 text-sm text-ink-soft">{error ?? "진단 결과를 먼저 완료해주세요."}</p>
          <LinkButton href="/diagnosis/result">진단 결과로 이동</LinkButton>
        </div>
      </Shell>
    );
  }

  return (
    <Shell width="lg">
      <ShellHeader
        step={4}
        right={
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={!server.recommendationId || pdfDownloading}
            className="rounded-full border border-disabled px-2.5 py-1.5 text-[11px] text-ink-soft transition-colors hover:bg-page disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pdfDownloading ? "다운로드 중..." : "PDF 다운로드"}
          </button>
        }
      />
      <div className="px-10 py-8">
        <h2 className="mb-2.5 text-xl font-bold text-ink">계약에 적합한 대응 전략을 찾았습니다</h2>

        <div className="mb-4 flex flex-wrap gap-2">
          <Badge variant="risk">위험 {RISK_GRADE_LABEL[agg.riskGrade]}</Badge>
          {server.riskProfileResult && <Badge>성향 {server.riskProfileResult.profile_type}</Badge>}
          {server.riskProfileResult && (
            <Badge>
              헤지목표 {server.riskProfileResult.target_hedge_ratio_min}~
              {server.riskProfileResult.target_hedge_ratio_max}%
            </Badge>
          )}
          <Badge>순노출 {formatKrw(agg.netExposureTotal)}</Badge>
          <Badge>결제일 {formatDateDots(nearestDueDate(contract))}</Badge>
        </div>

        <div className="mb-6 rounded-xl border border-border-soft px-5 py-4.5">
          <div className="mb-1.5 text-[12.5px] font-bold text-ink-soft">AI 최종 권장 시나리오</div>
          <p className="text-[13.5px] leading-relaxed text-ink">
            {server.recommendationReason ?? "AI 추천 사유 정보가 아직 제공되지 않았습니다."}
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-muted">
            근거: BEP 안전여유율(최소) {formatOrDash(agg.bepSafetyMarginPctWorst, (v) => `${formatNumber(v, 1)}%`)} · 결제일까지{" "}
            {agg.holdingDaysMin}영업일 · 예상 손실률 {formatNumber(Math.abs(agg.esPctAggregate), 1)}% ·{" "}
            {server.riskProfileResult?.profile_type ?? "-"} 성향 · 결제일 조정{" "}
            {allDueDatesAdjustable(contract) ? "가능" : "불가능"}
          </div>
        </div>

        <div className="mb-3 text-[15px] font-extrabold text-ink">우리 기업에 적합한 환헤지 전략입니다</div>
        {server.recommendationMix.length === 0 ? (
          <p className="mb-6 text-[12.5px] text-muted">추천 가능한 전략이 아직 없습니다.</p>
        ) : (
          <div className="mb-6 grid grid-cols-3 gap-3.5">
            {server.recommendationMix.map((s, i) => (
              <div
                key={`${s.productId}-${i}`}
                className={
                  "rounded-xl border p-4 " +
                  (i === 0 ? "border-2 border-accent bg-accent-soft" : "border-border-soft")
                }
              >
                <Badge variant={i === 0 ? "accent" : "neutral"}>{i === 0 ? "AI추천 1순위" : `${i + 1}순위`}</Badge>
                <div className="mt-2 text-sm font-extrabold text-ink">{s.productName}</div>
                <div className="mt-1 text-[11.5px] leading-relaxed text-ink-soft">
                  <div>{s.provider}</div>
                  <div>배분 비율 {formatNumber(s.allocationRatio * 100, 0)}%</div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mb-1.5 text-[15px] font-extrabold text-ink">추천 금융상품</div>
        <p className="mb-3 text-xs text-muted">
          최근 실적, 계약 금액, 결제 방식, 신용등급, 결제 예정일을 기준으로 예상 적합도를 분석했습니다.
        </p>
        {rankedItems.length === 0 ? (
          <p className="mb-6 text-[12.5px] text-muted">추천 금융상품이 아직 없습니다.</p>
        ) : (
          <div className="mb-6 grid grid-cols-3 gap-3.5">
            {rankedItems.map((item, i) => (
              <div
                key={item.id}
                className={
                  "rounded-xl border p-4 " + (i === 0 ? "border-2 border-accent bg-accent-soft" : "border-border-soft")
                }
              >
                <div className="flex justify-between">
                  <span
                    className={
                      "rounded-md px-2 py-0.5 text-[10px] font-extrabold " +
                      (i === 0 ? "bg-accent text-ink" : "bg-chip text-ink-soft")
                    }
                  >
                    적합도 {i + 1}위
                  </span>
                  <Badge variant={ELIGIBILITY_BADGE_VARIANT[item.eligibility_status]} className="!text-[10.5px]">
                    {ELIGIBILITY_LABEL[item.eligibility_status]}
                  </Badge>
                </div>
                <div className="mt-2 text-sm font-extrabold text-ink">{item.product_name}</div>
                <div className="text-[11px] text-muted">{item.provider}</div>
                <ProductMatchReasons reasonText={item.reason_text} />
              </div>
            ))}
          </div>
        )}

        {server.avoidedLossByProduct && server.avoidedLossByProduct.length > 0 && (
          <>
            <div className="mb-1.5 text-[15px] font-extrabold text-ink">이 상품을 쓰지 않았다면?</div>
            <p className="mb-3 text-xs text-muted">
              AI 환율 예측 시나리오 기준으로, 추천 상품을 사용하지 않았을 경우 예상되는 손익입니다. 실제 결과는 환율
              움직임에 따라 달라질 수 있습니다.
            </p>
            <div className="mb-6 space-y-4">
              {server.avoidedLossByProduct.map((card) => (
                <div key={card.productId} className="rounded-xl border border-border-soft p-4">
                  <div className="text-sm font-extrabold text-ink">{card.productName}</div>
                  <div className="mb-3 text-[11px] text-muted">{card.provider}</div>
                  {card.avoidedLossScenarios && card.avoidedLossScenarios.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
                      {card.avoidedLossScenarios.map((s) => (
                        <AvoidedLossScenarioItem key={s.scenarioName} scenario={s} />
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-muted">AI 예측 지원 범위 밖이라 시나리오를 계산하지 못했습니다.</p>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
        
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-accent-softer px-6 py-4.5">
          <div>
            <div className="text-sm font-extrabold text-ink">분석 결과를 바탕으로 KB 기업금융 전문가와 상담해보세요</div>
            <div className="mt-1 text-[11.5px] text-ink-soft">
              계약 정보, 환리스크 분석 결과, 추천 전략과 상품이 상담 신청서에 자동으로 포함됩니다.
            </div>
          </div>
          <LinkButton href="/consultation" size="sm">
            KB 상담 신청
          </LinkButton>
        </div>
        <p className="mt-4 text-[10.5px] leading-relaxed text-muted">
          본 서비스의 환율 분석 및 금융상품 추천 결과는 참고용입니다. 실제 상품 가입 가능 여부, 적용 환율, 금리,
          보험료, 한도와 필요 서류는 금융기관의 심사 및 상담 결과에 따라 달라질 수 있습니다.
        </p>
      </div>
    </Shell>
  );
}