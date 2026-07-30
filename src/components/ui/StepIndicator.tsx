const STEPS = ["계약정보", "리스크 진단", "성향분석", "전략·상품추천", "상담연결"];

export function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {STEPS.map((label, i) => {
        const step = i + 1;
        const done = step < current;
        const active = step === current;
        return (
          <div
            key={label}
            className={
              "whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-semibold " +
              (done
                ? "bg-accent-done text-ink"
                : active
                  ? "bg-accent text-ink"
                  : "text-disabled font-normal")
            }
          >
            {step} {label}
            {done ? " ✓" : ""}
          </div>
        );
      })}
    </div>
  );
}
