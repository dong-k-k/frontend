"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Shell, ShellHeader } from "@/components/ui/Shell";
import { MOCK_CURRENT_RATE, formatNumber } from "@/lib/risk";

const CHECKLIST = [
  "계약 정보 확인",
  `실시간 매매기준율 조회 (${formatNumber(MOCK_CURRENT_RATE, 2)}원)`,
  "최근 3년 일별 환율 데이터 조회 중...",
  "남은 영업일 계산",
  "순노출액 계산",
  "BEP 안전여유율 계산",
  "97.5% Expected Shortfall 계산",
  "위험 등급 산정",
];

const STEP_DELAY_MS = 550;

export default function AnalyzingPage() {
  const router = useRouter();
  const [doneCount, setDoneCount] = useState(0);

  useEffect(() => {
    if (doneCount >= CHECKLIST.length) {
      const timeout = setTimeout(() => router.push("/diagnosis/result"), 500);
      return () => clearTimeout(timeout);
    }
    const timeout = setTimeout(() => setDoneCount((n) => n + 1), STEP_DELAY_MS);
    return () => clearTimeout(timeout);
  }, [doneCount, router]);

  return (
    <Shell>
      <ShellHeader step={1} right={<span>✓ 임시저장됨</span>} />
      <div className="px-14 py-14 text-center">
        <div className="mx-auto mb-5 h-14 w-14 animate-spin-slow rounded-full border-4 border-warning-bg border-t-accent" />
        <h2 className="mb-1.5 text-lg font-bold text-ink">계약의 환율 위험을 분석하고 있습니다</h2>
        <p className="mb-6 text-[12.5px] text-muted">
          실시간 환율과 최근 3년의 일별 환율 데이터를 바탕으로 결제일까지의 위험을 계산합니다
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
      </div>
    </Shell>
  );
}
