export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

export function toISODate(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Today's calendar date in Asia/Seoul (KST), pinned to UTC midnight so
 * `addDays`/`toISODate` can operate on it with plain UTC arithmetic. Using
 * the host process's local timezone here (e.g. via `new Date()` + the
 * local-getter variants this function replaces) made SSR (often UTC) and
 * the browser (KST) disagree on "today" for part of each day, causing a
 * hydration mismatch — this makes the calendar day deterministic regardless
 * of where it runs.
 */
export function todayKst(): Date {
  const isoDate = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(new Date());
  return new Date(`${isoDate}T00:00:00Z`);
}
