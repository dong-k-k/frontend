"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Shell, ShellHeader } from "@/components/ui/Shell";
import { useWizard } from "@/context/wizard-context";
import { createRiskAssessment, ApiError } from "@/lib/api";

/** 이 시간 이상 요청이 끝나지 않으면 안내 문구만 바꾼다 — 단계나 퍼센트를 지어내지 않는다. */
const SLOW_NOTICE_DELAY_MS = 15000;

/**
 * dongkk-server의 진단 생성 API(POST .../risk-assessment)는 완전 동기 호출로,
 * 단계별 진행 상태나 폴링 가능한 상태 조회 엔드포인트를 제공하지 않는다
 * (job id, status 필드, SSE/WebSocket 없음). 그래서 여기서는 실제로 알 수 없는
 * "몇 단계 중 몇 번째"류 체크리스트를 지어내지 않고, 요청이 진행 중인지 여부만
 * 정직하게 표시한다.
 */
export default function AnalyzingPage() {
  const router = useRouter();
  const { contract, server, setServer } = useWizard();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [slowNotice, setSlowNotice] = useState(false);
  const startedRef = useRef(false);
  // 요청 진행 중 재시도 버튼 연타 등으로 겹쳐 호출되는 것을 막는 동기 가드(state는 다음 렌더까지 반영이 늦을 수 있음).
  const submittingRef = useRef(false);
  // 언마운트(뒤로가기/다른 페이지 이동) 이후에는 응답이 와도 상태를 갱신하거나 라우팅하지 않는다.
  const mountedRef = useRef(true);

  useEffect(() => {
    // StrictMode 개발 모드에서는 mount→cleanup→mount가 한 번 더 일어나므로,
    // cleanup에서 false로 내린 값을 다음 마운트 시점에 다시 true로 되돌려야 한다.
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const runAssessment = useCallback(() => {
    if (submittingRef.current) return;

    // 새로고침 없이 뒤로가기 등으로 이 페이지에 다시 들어온 경우, 이미 모든 결제 정보 카드의
    // 진단이 끝나 있다면 API를 다시 호출하지 않고 바로 결과 화면으로 보낸다.
    const alreadyAssessed =
      contract.paymentSchedules.length > 0 &&
      contract.paymentSchedules.every((s) => server.assessmentByScheduleId[s.id]);
    if (alreadyAssessed) {
      router.push("/diagnosis/result");
      return;
    }

    const settlementEntries = contract.paymentSchedules
      .map((schedule) => [schedule.id, server.settlementIdByScheduleId[schedule.id]] as const)
      .filter((entry): entry is [string, number] => entry[1] !== undefined);

    submittingRef.current = true;
    setSubmitting(true);
    setError(null);
    setSlowNotice(false);
    const slowTimer = setTimeout(() => {
      if (mountedRef.current) setSlowNotice(true);
    }, SLOW_NOTICE_DELAY_MS);

    (async () => {
      if (settlementEntries.length === 0) {
        throw new Error("저장된 계약 정보를 찾을 수 없습니다. 이전 단계로 돌아가 계약 정보를 다시 저장해주세요.");
      }
      const pairs = await Promise.all(
        settlementEntries.map(([scheduleId, settlementId]) =>
          createRiskAssessment(settlementId).then((assessment) => [scheduleId, assessment] as const),
        ),
      );
      if (!mountedRef.current) return;
      const assessmentByScheduleId = { ...server.assessmentByScheduleId };
      for (const [scheduleId, assessment] of pairs) {
        assessmentByScheduleId[scheduleId] = assessment;
      }
      setServer({ assessmentByScheduleId });
      router.push("/diagnosis/result");
    })()
      .catch((e) => {
        if (!mountedRef.current) return;
        setError(e instanceof ApiError || e instanceof Error ? e.message : "환율 리스크 진단 중 오류가 발생했습니다.");
      })
      .finally(() => {
        clearTimeout(slowTimer);
        submittingRef.current = false;
        if (mountedRef.current) {
          setSubmitting(false);
          setSlowNotice(false);
        }
      });
  }, [contract.paymentSchedules, router, server.assessmentByScheduleId, server.settlementIdByScheduleId, setServer]);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    runAssessment();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 마운트 시 1회만 실행
  }, []);

  const handleRetry = () => {
    if (submittingRef.current) return;
    runAssessment();
  };

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
            <div className="flex items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={handleRetry}
                disabled={submitting}
                className="rounded-[10px] bg-accent px-6 py-3 text-sm font-bold text-ink disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? "다시 시도하는 중..." : "다시 시도"}
              </button>
              <button
                type="button"
                onClick={() => router.push("/diagnosis/contract")}
                disabled={submitting}
                className="rounded-[10px] border border-disabled px-6 py-3 text-sm font-semibold text-ink-soft disabled:cursor-not-allowed disabled:opacity-50"
              >
                계약정보로 돌아가기
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="mx-auto mb-5 h-14 w-14 animate-spin-slow rounded-full border-4 border-warning-bg border-t-accent" />
            <h2 className="mb-1.5 text-lg font-bold text-ink">계약의 환율 위험을 분석하고 있습니다</h2>
            <p className="mb-6 text-[12.5px] text-muted">
              실시간 환율과 최근 데이터를 바탕으로 결제일까지의 위험을 계산합니다
            </p>
            <p className="mt-5 text-[11.5px] text-muted">
              {slowNotice
                ? "예상보다 시간이 조금 더 걸리고 있습니다. 잠시만 기다려주세요."
                : "분석에는 약 10~20초가 소요될 수 있습니다."}
            </p>
          </>
        )}
      </div>
    </Shell>
  );
}
