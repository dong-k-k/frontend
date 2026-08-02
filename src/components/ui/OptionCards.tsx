export function OptionCards<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex gap-2">
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(opt.value)}
            className={
              "flex-1 rounded-[10px] border px-3 py-3 text-center text-[13px] transition-colors " +
              (selected
                ? "border-2 border-accent bg-accent-soft font-bold text-ink"
                : "border-border text-ink-soft hover:border-ink-soft/40")
            }
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export function PillOptions<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(opt.value)}
            className={
              "rounded-full px-3 py-1.5 text-xs transition-colors " +
              (selected ? "bg-accent font-bold text-ink" : "border border-border text-ink-soft hover:border-ink-soft/40")
            }
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
