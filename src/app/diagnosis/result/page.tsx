"use client";

import { useMemo } from "react";
import { Shell, ShellHeader, ShellFooter } from "@/components/ui/Shell";
import { LinkButton } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useWizard } from "@/context/wizard-context";
import {
  computeAnalysis,
  earliestPriceFixDate,
  formatDateDots,
  formatKrw,
  formatNumber,
  formatSignedKrw,
  nearestDueDate,
  primaryCurrency,
  RISK_GRADE_LABEL,
} from "@/lib/risk";

const RISK_BADGE_VARIANT = {
  LOW: "success",
  MEDIUM: "riskSolid",
  HIGH: "riskSolid",
} as const;

function StatCard({ label, value, tone }: { label: string; value: string; tone?: "danger" }) {
  return (
    <div className="rounded-[10px] border border-border-soft p-3">
      <div className="text-[11px] text-muted">{label}</div>
      <div className={"mt-1 text-[16px] font-extrabold " + (tone === "danger" ? "text-danger" : "text-ink")}>
        {value}
      </div>
    </div>
  );
}

export default function ResultPage() {
  const { contract } = useWizard();
  const analysis = useMemo(() => computeAnalysis(contract), [contract]);

  const breachVerb = contract.contractType === "export" ? "하락" : "상승";
  const gradeLabel = RISK_GRADE_LABEL[analysis.riskGrade];
  const boxTone =
    analysis.riskGrade === "LOW"
      ? "border-success-bg bg-success-bg/60"
      : "border-risk-border bg-risk-bg";

  return (
    <Shell width="lg">
      <ShellHeader step={2} />
      <div className="px-10 py-8">
        <h2 className={analysis.scheduleCount > 1 ? "mb-1 text-xl font-bold text-ink" : "mb-3.5 text-xl font-bold text-ink"}>
          환율 리스크 진단 결과
        </h2>
        {analysis.scheduleCount > 1 && (
          <p className="mb-3.5 text-[12px] text-muted">
            결제 정보 카드 {analysis.scheduleCount}건(분할 결제)의 금액과 일정을 합산한 결과입니다.
          </p>
        )}

        <div className={"mb-5 rounded-xl border px-5 py-4 " + boxTone}>
          <Badge variant={RISK_BADGE_VARIANT[analysis.riskGrade]}>
            ⚠ {gradeLabel} · 97.5% ES 예상 환손실률 {formatNumber(Math.abs(analysis.esPct), 1)}%
          </Badge>
          <p className="mt-3 text-sm leading-relaxed text-ink">
            현재 환율 {formatNumber(analysis.currentRate, 0)}원에서 약 {formatNumber(analysis.breachMoveKrw, 0)}원{" "}
            {breachVerb}하면 손익분기 환율({formatNumber(analysis.bep, 0)}원)을 이탈합니다. 최근 환율 변동성을
            기준으로 불리한 상황이 발생할 경우 약 <b>{formatKrw(Math.abs(analysis.maxLossKrw))}</b>의 손실이
            예상됩니다.
          </p>
        </div>

        <div className="mb-5 grid grid-cols-5 gap-2.5">
          <StatCard label="현재 환율" value={`${formatNumber(analysis.currentRate, 2)}원`} />
          <StatCard
            label="순노출 외화금액"
            value={`${primaryCurrency(contract)} ${formatNumber(analysis.netExposureForeign)}`}
          />
          <StatCard label="순노출 원화 환산액" value={formatKrw(analysis.netExposureKrw)} />
          <StatCard
            label={analysis.scheduleCount > 1 ? "손익분기 환율(최소 여유율 기준)" : "손익분기 환율(BEP)"}
            value={`${formatNumber(analysis.bep, 2)}원`}
          />
          <StatCard label="남은 영업일" value={`${analysis.remainingBusinessDays}영업일`} />
          <StatCard label="계약·가격 확정일" value={formatDateDots(earliestPriceFixDate(contract))} />
          <StatCard label="결제 예정일" value={formatDateDots(nearestDueDate(contract))} />
          <StatCard label="BEP 안전여유율" value={`${formatNumber(analysis.bepSafetyMarginPct, 1)}%`} />
          <StatCard
            label="97.5% ES 변동률"
            value={`${formatNumber(analysis.esPct, 1)}%`}
            tone="danger"
          />
          <StatCard label="예상 최대 손실액" value={formatSignedKrw(analysis.maxLossKrw)} tone="danger" />
        </div>

        <div className="mb-5 grid grid-cols-[1.3fr_1fr] gap-5">
          <div className="rounded-xl border border-border-soft p-4">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-[12.5px] font-bold text-ink-soft">최근 6개월 환율 추이</div>
              <div className="flex gap-1.5">
                <span className="rounded-xl bg-chip px-2.5 py-0.5 text-[11px] font-bold text-ink">그래프로 보기</span>
                <span className="rounded-xl border border-border px-2.5 py-0.5 text-[11px] text-muted">표로 보기</span>
              </div>
            </div>
            <svg width="100%" height="130" viewBox="0 0 400 130">
              <rect x="0" y="35" width="400" height="45" fill="#FFF3D6" opacity="0.6" />
              <line x1="0" y1="55" x2="400" y2="55" stroke="#898989" strokeDasharray="4" strokeWidth="1" />
              <line x1="0" y1="88" x2="400" y2="88" stroke="#B23B2E" strokeDasharray="4" strokeWidth="1.5" />
              <polyline
                points="0,60 50,52 100,66 150,48 200,72 250,44 300,68 350,50 400,58"
                fill="none"
                stroke="#545045"
                strokeWidth="2.2"
              />
            </svg>
            <div className="text-[10.5px] leading-relaxed text-muted">
              실선: 일별 환율 · 노란 밴드: 97.5% 예상 범위 · 빨간선: BEP({formatNumber(analysis.bep, 0)}원) · 데이터
              기준일 {formatDateDots(nearestDueDate(contract))} · 출처: 서울외국환중개
            </div>
          </div>
          <div className="rounded-xl border border-border-soft p-4">
            <div className="mb-2 text-[12.5px] font-bold text-ink-soft">환율 시나리오</div>
            <table className="w-full border-collapse text-[11.5px]">
              <thead>
                <tr className="text-muted">
                  <th className="px-1 py-1.5 text-left">변동</th>
                  <th className="px-1 py-1.5 text-left">예상환율</th>
                  <th className="px-1 py-1.5 text-left">손익</th>
                </tr>
              </thead>
              <tbody>
                {analysis.scenarios.map((row) => (
                  <tr key={row.deltaPct} className={row.deltaPct === 0 ? "bg-accent-softer" : undefined}>
                    <td className={"border-t border-border-soft px-1 py-1.5" + (row.deltaPct === 0 ? " font-bold" : "")}>
                      {row.deltaPct === 0 ? "변동없음" : `${row.deltaPct > 0 ? "+" : ""}${row.deltaPct}%`}
                    </td>
                    <td className="border-t border-border-soft px-1 py-1.5">{formatNumber(row.impliedRate, 1)}</td>
                    <td
                      className={
                        "border-t border-border-soft px-1 py-1.5" +
                        (row.pnlKrw > 0 ? " text-success" : row.pnlKrw < 0 ? " text-danger" : "")
                      }
                    >
                      {row.pnlKrw === 0 ? "0" : formatSignedKrw(row.pnlKrw)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <details className="rounded-[10px] border border-border-soft px-4 py-3.5 text-[12.5px] text-ink-soft">
          <summary className="cursor-pointer list-none">
            ▸ 분석 근거 자세히 보기{" "}
            <span className="text-muted">(데이터 기준, 순노출 산정 방식, ES 개념, 위험등급 판정 기준)</span>
          </summary>
          <div className="mt-3 space-y-1.5 text-[12px] leading-relaxed text-muted">
            <p>
              · 순노출액은 계약상 결제 예정 금액을 그대로 사용하며, 별도 상계 포지션은 반영하지 않습니다.
            </p>
            <p>
              · 97.5% Expected Shortfall은 연 {8}% 수준의 가정 변동성을 남은 영업일 수만큼 시간축으로 환산한 뒤,
              정규분포 97.5% 구간의 평균 손실로 추정한 참고용 수치입니다.
            </p>
            <p>· 위험 등급은 BEP 안전여유율 대비 예상 손실률의 비율로 낮음·중간·높음 3단계로 산정합니다.</p>
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
