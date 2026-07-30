import type { ReactNode } from "react";

export function FieldLabel({
  children,
  required,
  optional,
}: {
  children: ReactNode;
  required?: boolean;
  optional?: boolean;
}) {
  return (
    <label className="mb-2 block text-xs font-bold text-ink-soft">
      {children}
      {required && <span className="ml-1 font-normal text-danger">*</span>}
      {optional && <span className="ml-1 font-normal text-muted">(선택)</span>}
    </label>
  );
}

export function RequiredTag() {
  return <span className="ml-1 text-xs font-normal text-danger">*필수</span>;
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return <div className="mb-2 text-sm font-bold text-ink-soft">{children}</div>;
}
