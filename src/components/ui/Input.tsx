"use client";

import type { ChangeEvent } from "react";

const inputClass =
  "mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-[13px] text-ink placeholder:text-faint focus:border-accent focus:outline-none";

export function TextInput({
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <input
      type={type}
      className={inputClass}
      value={value}
      placeholder={placeholder}
      onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
    />
  );
}

export function NumberInput({
  value,
  onChange,
  placeholder,
  suffix,
}: {
  value: number | null;
  onChange: (value: number | null) => void;
  placeholder?: string;
  suffix?: string;
}) {
  return (
    <div className="relative">
      <input
        type="text"
        inputMode="numeric"
        className={inputClass + (suffix ? " pr-12" : "")}
        value={value == null ? "" : value.toLocaleString("ko-KR")}
        placeholder={placeholder}
        onChange={(e) => {
          const digits = e.target.value.replace(/[^0-9]/g, "");
          onChange(digits === "" ? null : Number(digits));
        }}
      />
      {suffix && (
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[12px] text-muted">
          {suffix}
        </span>
      )}
    </div>
  );
}

export function DateInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <input
      type="date"
      className={inputClass}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

export function Select({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <select
      className={inputClass + " bg-surface"}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {children}
    </select>
  );
}
