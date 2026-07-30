import type { ReactNode } from "react";

const variants = {
  neutral: "bg-chip text-ink-soft",
  accent: "bg-accent text-ink",
  risk: "bg-risk-bg text-risk-text",
  riskSolid: "bg-risk-solid text-white",
  success: "bg-success-bg text-success-text",
  warning: "bg-warning-bg text-warning-text",
};

export function Badge({
  children,
  variant = "neutral",
  className = "",
}: {
  children: ReactNode;
  variant?: keyof typeof variants;
  className?: string;
}) {
  return (
    <span
      className={`inline-block rounded-full px-3 py-1 text-[11.5px] font-bold ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
