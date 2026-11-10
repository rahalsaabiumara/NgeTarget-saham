const idNumber = (digits: number) =>
  new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: digits });

/** Rp 2.072.900 */
export function formatRupiah(value: number | null | undefined, digits = 0): string {
  if (value == null || !Number.isFinite(value)) return '—';
  const sign = value < 0 ? '-' : '';
  return `${sign}Rp ${idNumber(digits).format(Math.abs(value))}`;
}

/** +Rp 27.100 / -Rp 27.100 */
export function formatSignedRupiah(value: number | null | undefined, digits = 0): string {
  if (value == null || !Number.isFinite(value)) return '—';
  return `${value > 0 ? '+' : ''}${formatRupiah(value, digits)}`;
}

/** -1,29% */
export function formatPct(value: number | null | undefined, digits = 2, signed = false): string {
  if (value == null || !Number.isFinite(value)) return '—';
  const s = new Intl.NumberFormat('id-ID', { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value);
  return `${signed && value > 0 ? '+' : ''}${s}%`;
}

export function formatNumber(value: number | null | undefined, digits = 2): string {
  if (value == null || !Number.isFinite(value)) return '';
  return idNumber(digits).format(value);
}

/** Ringkas untuk sumbu grafik: 2,1 jt / 850 rb */
export function formatCompactRupiah(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1e12) return `${formatNumber(value / 1e12, 1)} T`;
  if (abs >= 1e9) return `${formatNumber(value / 1e9, 1)} M`;
  if (abs >= 1e6) return `${formatNumber(value / 1e6, 2)} jt`;
  if (abs >= 1e3) return `${formatNumber(value / 1e3, 0)} rb`;
  return formatNumber(value, 0);
}

const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

/** "2026-11-09" → "9 November 2026" */
export function formatDateId(iso: string | null | undefined, withYear = true): string {
  if (!iso) return '—';
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  if (!y || !m || !d) return iso;
  return `${d} ${MONTHS[m - 1]}${withYear ? ` ${y}` : ''}`;
}

/** "2027-02-09" → "Feb 27" */
export function formatMonthShort(iso: string): string {
  const [y, m] = iso.split('-').map(Number);
  return `${MONTHS[m - 1].slice(0, 3)} ${String(y).slice(2)}`;
}

export function todayIso(): string {
  const d = new Date();
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60_000).toISOString().slice(0, 10);
}

/** Parse input bergaya Indonesia: "2.455.000" → 2455000, "3,5" → 3.5 */
export function parseIdNumber(text: string): number | null {
  const cleaned = text.replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.');
  if (cleaned === '' || cleaned === '-' || cleaned === '.') return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

