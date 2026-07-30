export function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-[13px] font-extrabold text-ink">
        FX
      </div>
      <div>
        <div className="text-[15px] font-extrabold leading-tight text-ink">FX Mate</div>
        <div className="text-[11px] leading-tight text-muted">AI 외환 리스크 매니저</div>
      </div>
    </div>
  );
}
