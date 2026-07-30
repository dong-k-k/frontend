import type { ReactNode } from "react";
import Link from "next/link";
import { Logo } from "./Logo";
import { StepIndicator } from "./StepIndicator";

export function Shell({
  width = "md",
  children,
}: {
  width?: "md" | "lg";
  children: ReactNode;
}) {
  return (
    <div
      className={
        "w-full overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_1px_3px_rgba(84,80,69,0.08)] " +
        (width === "lg" ? "max-w-[1120px]" : "max-w-[1000px]")
      }
    >
      {children}
    </div>
  );
}

export function ShellHeader({
  step,
  right,
}: {
  step?: number;
  right?: ReactNode;
}) {
  return (
    <div className="flex min-h-16 flex-wrap items-center justify-between gap-y-2 border-b border-border-soft px-8">
      <Logo />
      {step != null && <StepIndicator current={step} />}
      <div className="flex items-center gap-3.5 text-[11.5px] whitespace-nowrap text-muted">
        {right !== undefined ? (
          right
        ) : (
          <Link href="/" className="hover:underline">
            처음부터
          </Link>
        )}
      </div>
    </div>
  );
}

export function ShellFooter({
  left,
  right,
}: {
  left?: ReactNode;
  right?: ReactNode;
}) {
  return (
    <div className="flex h-[72px] items-center justify-between border-t border-border-soft px-8">
      <div>{left}</div>
      <div className="flex gap-2.5">{right}</div>
    </div>
  );
}
