"use client";

import { useMemo, useState } from "react";
import { Shell, ShellHeader } from "@/components/ui/Shell";
import { LinkButton } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useWizard } from "@/context/wizard-context";
import {
  allDueDatesAdjustable,
  computeAnalysis,
  formatDateDots,
  formatKrw,
  formatNumber,
  nearestDueDate,
  RISK_GRADE_LABEL,
} from "@/lib/risk";
import {
  deriveProfileLabel,
  hedgeTargetRangeLabel,
  PRODUCTS,
  productThirdCardDetail,
  scenarioNarrative,
  STRATEGIES,
  type ProductCategory,
} from "@/lib/recommendations";

const FILTERS: ("전체" | ProductCategory)[] = ["전체", "환헤지", "수출금융", "보증·보험"];

export default function RecommendationsPage() {
  const { contract, riskProfile, company } = useWizard();
  const analysis = useMemo(() => computeAnalysis(contract), [contract]);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("전체");

  const breachVerb = contract.contractType === "export" ? "하락" : "상승";
  const profileLabel = deriveProfileLabel(riskProfile);
  const visibleProducts = PRODUCTS.filter((p) => filter === "전체" || p.category === filter);

  return (
    <Shell width="lg">
      <ShellHeader
        step={4}
        right={
          <span className="rounded-full border border-disabled px-2.5 py-1.5 text-[11px] text-ink-soft">
            PDF 다운로드
          </span>
        }
      />
      <div className="px-10 py-8">
        <h2 className="mb-2.5 text-xl font-bold text-ink">계약에 적합한 대응 전략을 찾았습니다</h2>

        <div className="mb-4 flex flex-wrap gap-2">
          <Badge variant="risk">위험 {RISK_GRADE_LABEL[analysis.riskGrade]}</Badge>
          <Badge>성향 {profileLabel}</Badge>
          <Badge>헤지목표 {hedgeTargetRangeLabel(analysis.riskGrade)}</Badge>
          <Badge>순노출 {formatKrw(analysis.netExposureKrw)}</Badge>
          <Badge>결제일 {formatDateDots(nearestDueDate(contract))}</Badge>
        </div>

        <div className="mb-6 rounded-xl border border-border-soft px-5 py-4.5">
          <div className="mb-1.5 text-[12.5px] font-bold text-ink-soft">AI 최종 권장 시나리오</div>
          <p className="text-[13.5px] leading-relaxed text-ink">{scenarioNarrative(analysis, breachVerb)}</p>
          <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-muted">
            근거: BEP 안전여유율 {analysis.bepSafetyMarginPct <= 3 ? "낮음" : "충분"} · 결제일까지{" "}
            {analysis.remainingBusinessDays}영업일 · 예상 손실률 {formatNumber(Math.abs(analysis.esPct), 1)}% ·{" "}
            {profileLabel} 성향 · 결제일 조정 {allDueDatesAdjustable(contract) ? "가능" : "불가능"}
          </div>
        </div>

        <div className="mb-3 text-[15px] font-extrabold text-ink">우리 기업에 적합한 환헤지 전략입니다</div>
        <div className="mb-6 grid grid-cols-3 gap-3.5">
          {STRATEGIES.map((s) => (
            <div
              key={s.rank}
              className={
                "rounded-xl border p-4 " +
                (s.rank === 1 ? "border-2 border-accent bg-accent-soft" : "border-border-soft")
              }
            >
              <Badge variant={s.rank === 1 ? "accent" : "neutral"}>
                {s.rank === 1 ? "AI추천 1순위" : `${s.rank}순위`}
              </Badge>
              <div className="mt-2 text-sm font-extrabold text-ink">{s.title}</div>
              <div className="mt-1 text-[11.5px] leading-relaxed text-ink-soft">
                {s.detailLines.map((line) => (
                  <div key={line}>{line}</div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mb-1.5 text-[15px] font-extrabold text-ink">추천 금융상품</div>
        <p className="mb-3 text-xs text-muted">
          최근 실적, 계약 금액, 결제 방식, 신용등급, 결제 예정일을 기준으로 예상 적합도를 분석했습니다.
        </p>
        <div className="mb-3.5 flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={
                "rounded-xl px-2.5 py-1 text-[11px] " +
                (f === filter ? "bg-chip font-bold text-ink" : "border border-border text-ink-soft")
              }
            >
              {f}
            </button>
          ))}
        </div>
        <div className="mb-6 grid grid-cols-3 gap-3.5">
          {visibleProducts.map((p) => {
            const eligibility = p.eligible(company.creditRating);
            return (
              <div
                key={p.name}
                className={
                  "rounded-xl border p-4 " + (p.rank === 1 ? "border-2 border-accent bg-accent-soft" : "border-border-soft")
                }
              >
                <div className="flex justify-between">
                  <span
                    className={
                      "rounded-md px-2 py-0.5 text-[10px] font-extrabold " +
                      (p.rank === 1 ? "bg-accent text-ink" : "bg-chip text-ink-soft")
                    }
                  >
                    적합도 {p.rank}위
                  </span>
                  <Badge variant={eligibility.met ? "success" : "warning"} className="!text-[10.5px]">
                    {eligibility.label}
                  </Badge>
                </div>
                <div className="mt-2 text-sm font-extrabold text-ink">{p.name}</div>
                <div className="text-[11px] text-muted">{p.issuer}</div>
                <div className="mt-2 text-[11.5px] text-ink-soft">
                  {p.detail || productThirdCardDetail(company.creditRating)}
                </div>
              </div>
            );
          })}
        </div>

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
