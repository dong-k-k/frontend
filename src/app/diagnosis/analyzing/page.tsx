"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Shell, ShellHeader } from "@/components/ui/Shell";
import { useWizard } from "@/context/wizard-context";
import { createRiskAssessment, ApiError } from "@/lib/api";

const CHECKLIST = [
  "계약 정보 확인",
  "실시간 매매기준율 조회 중...",
  "최근 환율 데이터 조회 중...",
  "남은 영업일 계산",
  "순노출액 계산",
  "BEP 안전여유율 계산",
  "97.5% Expected Shortfall 계산",
  "위험 등급 산정",
];

const STEP_DELAY_MS = 550;

export default function AnalyzingPage() {
  const router = useRouter();
  const { contract, server, setServer } = useWizard();
  const [doneCount, setDoneCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const startedRef = useRef(false);

  // Drives the visual checklist independently of the real network calls below.
  useEffect(() => {
    if (error || doneCount >= CHECKLIST.length) return;
    const timeout = setTimeout(() => setDoneCount((n) => n + 1), STEP_DELAY_MS);
    return () => clearTimeout(timeout);
  }, [doneCount, error]);

  // Kicks off the real risk-assessment calls once, in parallel with the animation above.
  // Navigation to the result page waits for both to finish.
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const settlementEntries = contract.paymentSchedules
      .map((schedule) => [schedule.id, server.settlementIdByScheduleId[schedule.id]] as const)
      .filter((entry): entry is [string, number] => entry[1] !== undefined);

    const minDelay = new Promise((resolve) => setTimeout(resolve, STEP_DELAY_MS * CHECKLIST.length));

    (async () => {
      if (settlementEntries.length === 0) {
        throw new Error("저장된 계약 정보를 찾을 수 없습니다. 이전 단계로 돌아가 계약 정보를 다시 저장해주세요.");
      }
      const pairs = await Promise.all(
        settlementEntries.map(([scheduleId, settlementId]) =>
          createRiskAssessment(settlementId).then((assessment) => [scheduleId, assessment] as const),
        ),
      );
      await minDelay;
      const assessmentByScheduleId = { ...server.assessmentByScheduleId };
      for (const [scheduleId, assessment] of pairs) {
        assessmentByScheduleId[scheduleId] = assessment;
      }
      setServer({ assessmentByScheduleId });
      setDoneCount(CHECKLIST.length);
      router.push("/diagnosis/result");
    })().catch((e) => {
      setError(e instanceof ApiError || e instanceof Error ? e.message : "환율 리스크 진단 중 오류가 발생했습니다.");
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally runs once on mount
  }, []);

  return (
    <Shell>
      <ShellHeader step={1} right={<span>✓ 임시저장됨</span>} />
      <div className="px-14 py-14 text-center">
        {error ? (
          <>
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-risk-bg text-2xl font-extrabold text-danger">
              !
            </div>
            <h2 className="mb-1.5 text-lg font-bold text-ink">진단 요청이 실패했습니다</h2>
            <p className="mb-6 max-w-[380px] mx-auto text-[12.5px] text-muted">{error}</p>
            <button
              type="button"
              onClick={() => router.push("/diagnosis/contract")}
              className="rounded-[10px] bg-accent px-6 py-3 text-sm font-bold text-ink"
            >
              계약정보로 돌아가기
            </button>
          </>
        ) : (
          <>
            <div className="mx-auto mb-5 h-14 w-14 animate-spin-slow rounded-full border-4 border-warning-bg border-t-accent" />
            <h2 className="mb-1.5 text-lg font-bold text-ink">계약의 환율 위험을 분석하고 있습니다</h2>
            <p className="mb-6 text-[12.5px] text-muted">
              실시간 환율과 최근 데이터를 바탕으로 결제일까지의 위험을 계산합니다
            </p>
            <div className="mx-auto flex max-w-[360px] flex-col items-stretch gap-2.5 text-left">
              {CHECKLIST.map((label, i) => {
                const done = i < doneCount;
                const active = i === doneCount;
                return (
                  <div
                    key={label}
                    className={
                      "flex items-center gap-2.5 text-[13px] " +
                      (done ? "text-ink-soft" : active ? "font-bold text-ink" : "text-faint")
                    }
                  >
                    {done ? (
                      <span className="font-extrabold text-success">✓</span>
                    ) : active ? (
                      <span className="inline-block h-3.5 w-3.5 animate-spin-slow rounded-full border-2 border-accent border-t-transparent" />
                    ) : (
                      <span>○</span>
                    )}
                    {label}
                  </div>
                );
              })}
            </div>
            <p className="mt-5 text-[11.5px] text-muted">분석에는 약 10~20초가 소요될 수 있습니다.</p>
          </>
        )}
      </div>
    </Shell>
  );
}
