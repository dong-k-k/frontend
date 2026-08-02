"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Shell, ShellHeader, ShellFooter } from "@/components/ui/Shell";
import { LinkButton } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useWizard } from "@/context/wizard-context";
import { aggregateRiskAssessments } from "@/lib/api/riskAggregate";
import { getExchangeRateForecast, ApiError } from "@/lib/api";
import { buildForecastView, type ForecastView } from "@/lib/api/rateForecastView";
import {
  formatDateDots,
  formatKrw,
  formatNumber,
  formatOrDash,
  formatSignedKrw,
  nearestDueDate,
  primaryCurrency,
  RISK_GRADE_LABEL,
} from "@/lib/risk";
import { ExchangeRateForecastCard } from "./ExchangeRateForecastCard";
import { ScenarioSection } from "./ScenarioSection";

type ForecastStatus =
  | "loading"
  | "not_generated"
  | "upstream_unavailable"
  | "temporarily_unavailable"
  | "unavailable"
  | "ready";

/** 서버 오류 응답 body(`{"detail": "..."}`)에서 실제 사유 문구를 꺼낸다 — 못 읽으면
 * null(카드는 그때 상태별 기본 문구만 보여준다, 지어낸 문구를 채우지 않는다). */
function parseErrorDetail(message: string): string | null {
  try {
    const parsed: unknown = JSON.parse(message);
    if (parsed && typeof parsed === "object" && "detail" in parsed && typeof parsed.detail === "string") {
      return parsed.detail;
    }
    return null;
  } catch {
    return null;
  }
}

const RISK_BADGE_VARIANT = {
  LOW: "success",
  MEDIUM: "riskSolid",
  HIGH: "riskSolid",
} as const;

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-[11.5px] text-ink-soft">
      {label} <b className="text-ink">{value}</b>
    </div>
  );
}

export default function ResultPage() {
  const { contract, server } = useWizard();
  const [asOfDate] = useState(() => new Date());

  const assessments = useMemo(
    () =>
      contract.paymentSchedules
        .map((s) => server.assessmentByScheduleId[s.id])
        .filter((a): a is NonNullable<typeof a> => Boolean(a)),
    [contract.paymentSchedules, server.assessmentByScheduleId],
  );
  const agg = useMemo(() => aggregateRiskAssessments(assessments), [assessments]);

  const totalForeignAmount = useMemo(
    () => contract.paymentSchedules.reduce((sum, s) => sum + (s.amount ?? 0), 0),
    [contract.paymentSchedules],
  );

  // 대표(첫 결제 회차) 정산건 기준 미래 환율 예측 — 그래프와 표 전환이 데이터를
  // 다시 요청하지 않도록, 한 번만 조회해 로컬 state에 보관하고 두 뷰가 공유한다.
  // 응답에 기준환율/BEP가 없으므로(app/risk/schemas.py::RateForecastResponse), 화면이
  // 이미 아는 실제 값(진단 결과의 current_rate, 결제 정보의 bep)을 그대로 넘긴다 —
  // 과거 환율(rate-history)이나 지어낸 값으로 대체하지 않는다.
  const primaryScheduleId = contract.paymentSchedules[0]?.id;
  const primarySettlementId = primaryScheduleId ? server.settlementIdByScheduleId[primaryScheduleId] : undefined;
  const primaryBepRate = contract.paymentSchedules[0]?.bep ?? null;
  const [forecastView, setForecastView] = useState<ForecastView | null>(null);
  const [forecastStatus, setForecastStatus] = useState<ForecastStatus>("loading");
  const [forecastErrorDetail, setForecastErrorDetail] = useState<string | null>(null);
  const forecastRequestedFor = useRef<number | null>(null);

  useEffect(() => {
    if (!primarySettlementId || forecastRequestedFor.current === primarySettlementId) return;
    forecastRequestedFor.current = primarySettlementId;
    setForecastStatus("loading");
    setForecastErrorDetail(null);
    getExchangeRateForecast(primarySettlementId)
      .then((response) => {
        setForecastView(buildForecastView(response, { referenceRate: agg?.currentRate ?? null, bepRate: primaryBepRate }));
        setForecastStatus("ready");
      })
      .catch((e) => {
        if (!(e instanceof ApiError)) {
          setForecastStatus("unavailable");
          return;
        }
        setForecastErrorDetail(parseErrorDetail(e.message));
        // 404 = 이 정산건은 애초에 예측 대상이 아님(통화가 USD가 아니거나 정산건 없음).
        // 502 = dongkk-server는 정상이지만 fx-chronos가 응답하지 않음.
        // 503/504 = 인프라 단 일시적 장애/타임아웃. 그 외는 진짜 오류로 구분한다.
        if (e.status === 404) setForecastStatus("not_generated");
        else if (e.status === 502) setForecastStatus("upstream_unavailable");
        else if (e.status === 503 || e.status === 504) setForecastStatus("temporarily_unavailable");
        else setForecastStatus("unavailable");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- settlementId당 한 번만 조회
  }, [primarySettlementId]);

  if (!agg) {
    return (
      <Shell width="lg">
        <ShellHeader step={2} />
        <div className="px-10 py-16 text-center">
          <p className="mb-6 text-sm text-ink-soft">아직 진단 결과가 없습니다. 계약 정보 입력부터 다시 진행해주세요.</p>
          <LinkButton href="/diagnosis/contract">계약정보 입력으로 이동</LinkButton>
        </div>
      </Shell>
    );
  }

  const breachVerb = contract.contractType === "export" ? "하락" : "상승";
  const gradeLabel = RISK_GRADE_LABEL[agg.riskGrade];
  const referenceScenario = agg.scenarios.find(
    (row) => row.scenario_pct === (contract.contractType === "export" ? -5 : 5),
  );
  const referencePl = referenceScenario
    ? contract.contractType === "export"
      ? referenceScenario.export_pl_krw
      : referenceScenario.import_pl_krw
    : null;

  return (
    <Shell width="lg">
      <ShellHeader step={2} />
      <div className="px-10 py-8">
        <h2 className={agg.itemCount > 1 ? "mb-1 text-xl font-bold text-ink" : "mb-3.5 text-xl font-bold text-ink"}>
          환율 리스크 진단 결과
        </h2>
        {agg.itemCount > 1 && (
          <p className="mb-3.5 text-[12px] text-muted">
            결제 정보 카드 {agg.itemCount}건(분할 결제)의 금액과 일정을 합산한 결과입니다.
          </p>
        )}

        <div className="mb-6 grid grid-cols-2 gap-6">
          <div className="rounded-xl border border-border-soft p-5">
            <Badge variant={RISK_BADGE_VARIANT[agg.riskGrade]}>위험 등급: {gradeLabel}</Badge>
            <p className="mt-3.5 text-sm leading-relaxed text-ink">
              최근 환율 변동성을 기준으로 분석한 결과, 환율이 5%{" "}
              {breachVerb === "하락" ? "불리하게(하락)" : "불리하게(상승)"} 움직이면 약{" "}
              <b>{formatKrw(Math.abs(referencePl ?? agg.expectedMaxLossTotal))}</b>의 손실이
              예상됩니다.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2">
              <MiniStat label="기준 환율" value={`${formatNumber(agg.currentRate, 1)}원`} />
              <MiniStat label="데이터 기준일" value={formatDateDots(asOfDate.toISOString().slice(0, 10))} />
              <MiniStat label="분석 통화" value={primaryCurrency(contract)} />
              <MiniStat label="거래 규모" value={`${primaryCurrency(contract)} ${formatNumber(totalForeignAmount)}`} />
              <MiniStat label="결제 예정일" value={formatDateDots(nearestDueDate(contract))} />
              <MiniStat label="남은 영업일" value={`${agg.holdingDaysMin}영업일`} />
            </div>
          </div>

          <ExchangeRateForecastCard view={forecastView} status={forecastStatus} errorDetail={forecastErrorDetail} />
        </div>

        <div className="mb-5 rounded-xl border border-border-soft p-4">
          <div className="mb-2 text-[12.5px] font-bold text-ink-soft">환율 시나리오</div>
          <ScenarioSection
            scenarios={agg.scenarios}
            netExposureTotal={agg.netExposureTotal}
            contractType={contract.contractType}
          />
        </div>

        <details className="rounded-[10px] border border-border-soft px-4 py-3.5 text-[12.5px] text-ink-soft">
          <summary className="cursor-pointer list-none">
            ▸ 분석 근거 자세히 보기{" "}
            <span className="text-muted">(BEP 여유율, 손실 산정 방식 등)</span>
          </summary>
          <div className="mt-3 space-y-1.5 text-[12px] leading-relaxed text-muted">
            <p>· 순노출액은 정산 항목별 진단 결과의 원화 환산 노출액을 합산한 값입니다.</p>
            <p>· 위험 등급은 각 정산 항목의 진단 결과 중 가장 위험도가 높은 등급을 표시합니다.</p>
            <p>
              · 이번 진단 기준 BEP 안전여유율(최소){" "}
              {formatOrDash(agg.bepSafetyMarginPctWorst, (v) => `${formatNumber(v, 1)}%`)} · 97.5% ES 변동률{" "}
              {formatNumber(agg.esPctAggregate, 1)}% · 예상 최대 손실액 {formatSignedKrw(-agg.expectedMaxLossTotal)}원 ·
              남은 영업일 {agg.holdingDaysMin}영업일
            </p>
          </div>
        </details>
      </div>
      <ShellFooter
        left={
          <LinkButton href="/diagnosis/contract" variant="secondary" size="sm">
            계약정보 수정
          </LinkButton>
        }
        right={<LinkButton href="/diagnosis/risk-profile">환율 대응 성향 테스트</LinkButton>}
      />
    </Shell>
  );
}
