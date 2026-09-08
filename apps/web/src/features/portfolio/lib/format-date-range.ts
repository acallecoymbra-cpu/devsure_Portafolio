/** Shared by Experience levels and Studies: renders a compact "2021 — 2023" / "2021 — Presente" label. */
export function formatDateRange(
  startDate?: string,
  endDate?: string | null,
  inProgress?: boolean,
): string {
  const start = startDate ? formatYear(startDate) : '';
  if (inProgress) return start ? `${start} — Presente` : 'Presente';
  const end = endDate ? formatYear(endDate) : '';
  if (start && end) return `${start} — ${end}`;
  return start || end || '';
}

function formatYear(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : String(date.getFullYear());
}
