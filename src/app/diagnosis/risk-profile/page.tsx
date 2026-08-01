"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Shell, ShellHeader, ShellFooter } from "@/components/ui/Shell";
import { LinkButton, Button } from "@/components/ui/Button";
import { SectionLabel } from "@/components/ui/Field";
import { OptionCards } from "@/components/ui/OptionCards";
import { useWizard } from "@/context/wizard-context";
import { createRiskProfile, ApiError } from "@/lib/api";
import type { HedgeManagementStyle, KrwCertaintyPreference, MaxLossTolerance } from "@/lib/types";

const Q1: { value: MaxLossTolerance; label: string }[] = [
  { value: "UNDER_2", label: "거래금액의 2% 미만" },
  { value: "BETWEEN_2_5", label: "거래금액의 2~5%" },
  { value: "OVER_5", label: "거래금액의 5% 이상" },
];

const Q2: { value: KrwCertaintyPreference; label: string }[] = [
  { value: "FULL_LOCK", label: "가능한 한 확정하고 싶음" },
  { value: "PARTIAL_LOCK", label: "일부만 확정하고 싶음" },
  { value: "KEEP_UPSIDE", label: "추가 이익 가능성 유지" },
];

const Q3: { value: HedgeManagementStyle; label: string }[] = [
  { value: "SET_AND_HOLD", label: "한 번 설정 후 유지" },
  { value: "ADJUST_GRADUALLY", label: "나누어 조정" },
  { value: "REACT_AS_NEEDED", label: "필요할 때만 대응" },
];

// 백엔드는 각 문항 점수를 0~2 범위로만 허용합니다 (app/risk_profile/schemas.py: Field(ge=0, le=2)).
const Q1_SCORE: Record<MaxLossTolerance, number> = { UNDER_2: 0, BETWEEN_2_5: 1, OVER_5: 2 };
const Q2_SCORE: Record<KrwCertaintyPreference, number> = { FULL_LOCK: 0, PARTIAL_LOCK: 1, KEEP_UPSIDE: 2 };
const Q3_SCORE: Record<HedgeManagementStyle, number> = { SET_AND_HOLD: 0, ADJUST_GRADUALLY: 1, REACT_AS_NEEDED: 2 };

export default function RiskProfilePage() {
  const router = useRouter();
  const { contract, riskProfile, setRiskProfile, server, setServer } = useWizard();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const canProceed = useMemo(
    () =>
      Boolean(
        riskProfile.maxLossTolerance && riskProfile.krwCertaintyPreference && riskProfile.hedgeManagementStyle,
      ),
    [riskProfile],
  );

  const handleSubmit = async () => {
    if (!riskProfile.maxLossTolerance || !riskProfile.krwCertaintyPreference || !riskProfile.hedgeManagementStyle) {
      return;
    }
    const primaryScheduleId = contract.paymentSchedules[0]?.id;
    const settlementId = primaryScheduleId ? server.settlementIdByScheduleId[primaryScheduleId] : undefined;
    if (!settlementId) {
      setSubmitError("계약 정보가 저장되지 않았습니다. 이전 단계부터 다시 진행해주세요.");
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      const response = await createRiskProfile(settlementId, {
        q1: Q1_SCORE[riskProfile.maxLossTolerance],
        q2: Q2_SCORE[riskProfile.krwCertaintyPreference],
        q3: Q3_SCORE[riskProfile.hedgeManagementStyle],
      });
      setServer({ riskProfileId: response.id, riskProfileResult: response });
      router.push("/diagnosis/recommendations");
    } catch (e) {
      setSubmitError(e instanceof ApiError ? e.message : "리스크 성향 진단 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Shell>
      <ShellHeader step={3} />
      <div className="px-12 py-10">
        <h2 className="mb-1 text-center text-[19px] font-bold text-ink">
          우리 기업의 환율 대응 성향을 확인해주세요
        </h2>
        <p className="mb-6 text-center text-[12.5px] text-muted">
          계약에서 감수할 수 있는 손실과 원화 금액 확정 선호를 기준으로 추천 전략을 조정합니다.
        </p>

        <SectionLabel>Q1. 이 거래에서 감수할 수 있는 최대 환손실은 어느 정도인가요?</SectionLabel>
        <div className="mb-4.5">
          <OptionCards
            options={Q1}
            value={riskProfile.maxLossTolerance ?? ("" as MaxLossTolerance)}
            onChange={(maxLossTolerance) => setRiskProfile({ maxLossTolerance })}
          />
        </div>

        <SectionLabel>Q2. 유리한 환율 변동의 추가 이익을 포기하더라도 원화 금액을 확정하고 싶나요?</SectionLabel>
        <div className="mb-4.5">
          <OptionCards
            options={Q2}
            value={riskProfile.krwCertaintyPreference ?? ("" as KrwCertaintyPreference)}
            onChange={(krwCertaintyPreference) => setRiskProfile({ krwCertaintyPreference })}
          />
        </div>

        <SectionLabel>Q3. 환헤지를 관리할 때 어떤 방식을 선호하나요?</SectionLabel>
        <div className="mb-5">
          <OptionCards
            options={Q3}
            value={riskProfile.hedgeManagementStyle ?? ("" as HedgeManagementStyle)}
            onChange={(hedgeManagementStyle) => setRiskProfile({ hedgeManagementStyle })}
          />
        </div>
        {submitError && <p className="text-xs text-danger">{submitError}</p>}
      </div>
      <ShellFooter
        left={
          <LinkButton href="/diagnosis/result" variant="secondary" size="sm">
            이전
          </LinkButton>
        }
        right={
          <Button disabled={!canProceed || submitting} onClick={handleSubmit}>
            {submitting ? "저장 중..." : "AI 전략 추천받기"}
          </Button>
        }
      />
    </Shell>
  );
}
