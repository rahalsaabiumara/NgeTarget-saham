import { useEffect, useId, useState, type ReactNode } from 'react';
import { formatNumber, parseIdNumber } from '../lib/format';

/* ------------------------------ NumberInput ------------------------------- */

interface NumberInputProps {
  value: number | null;
  onChange: (value: number | null) => void;
  prefix?: string;
  suffix?: string;
  placeholder?: string;
  decimals?: number;
  disabled?: boolean;
  id?: string;
  ariaLabel?: string;
}

/** Input angka berformat Indonesia (2.455.000) — mengetik bebas, diformat ulang saat blur. */
export function NumberInput({
  value,
  onChange,
  prefix,
  suffix,
  placeholder,
  decimals = 2,
  disabled,
  id,
  ariaLabel,
}: NumberInputProps) {
  const [focused, setFocused] = useState(false);
  const [text, setText] = useState(value == null ? '' : formatNumber(value, decimals));

  useEffect(() => {
    if (!focused) setText(value == null ? '' : formatNumber(value, decimals));
  }, [value, focused, decimals]);

  return (
    <div className="relative flex items-center">
      {prefix && <span className="pointer-events-none absolute left-3 text-sm text-slate-400">{prefix}</span>}
      <input
        id={id}
        aria-label={ariaLabel}
        inputMode="decimal"
        className={`input num ${prefix ? 'pl-10' : ''} ${suffix ? 'pr-10' : ''}`}
        value={text}
        placeholder={placeholder}
        disabled={disabled}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onChange={(e) => {
          const raw = e.target.value.replace(/[^\d.,-]/g, '');
          setText(raw);
          onChange(parseIdNumber(raw));
        }}
      />
      {suffix && <span className="pointer-events-none absolute right-3 text-sm text-slate-400">{suffix}</span>}
    </div>
  );
}

/* --------------------------------- Field ---------------------------------- */

export function Field({
  label,
  hint,
  children,
  className = '',
}: {
  label: string;
  hint?: ReactNode;
  children: (id: string) => ReactNode;
  className?: string;
}) {
  const id = useId();
  return (
    <div className={className}>
      <label htmlFor={id} className="label">
        {label}
      </label>
      {children(id)}
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

/* --------------------------------- Badge ---------------------------------- */

type Tone = 'green' | 'red' | 'amber' | 'slate' | 'indigo' | 'sky';
const TONES: Record<Tone, string> = {
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  red: 'bg-rose-50 text-rose-700 ring-rose-600/20',
  amber: 'bg-amber-50 text-amber-800 ring-amber-600/20',
  slate: 'bg-slate-100 text-slate-600 ring-slate-500/20',
  indigo: 'bg-indigo-50 text-indigo-700 ring-indigo-600/20',
  sky: 'bg-sky-50 text-sky-700 ring-sky-600/20',
};

export function Badge({ tone = 'slate', children, title }: { tone?: Tone; children: ReactNode; title?: string }) {
  return (
    <span
      title={title}
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap ring-1 ring-inset ${TONES[tone]}`}
    >
      {children}
    </span>
  );
}

export function TargetBadge({ met, targetPct }: { met: boolean; targetPct?: number }) {
  return (
    <Badge tone={met ? 'green' : 'amber'} title={targetPct != null ? `Target ${targetPct}%` : undefined}>
      <span className={`h-1.5 w-1.5 rounded-full ${met ? 'bg-emerald-500' : 'bg-amber-500'}`} />
      {met ? 'Tercapai' : 'Belum Tercapai'}
    </Badge>
  );
}

/** Kelas warna teks untuk nilai positif/negatif. */
export const plColor = (v: number | null | undefined) =>
  v == null ? 'text-slate-500' : v > 0 ? 'text-emerald-600' : v < 0 ? 'text-rose-600' : 'text-slate-700';

/* ------------------------------ SectionTitle ------------------------------ */

export function SectionTitle({
  icon,
  title,
  subtitle,
  action,
}: {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-lg bg-indigo-50 p-2 text-indigo-600">{icon}</div>
        <div>
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

/* --------------------------------- Toggle --------------------------------- */

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  size = 'md',
}: {
  value: T;
  options: { value: T; label: ReactNode }[];
  onChange: (v: T) => void;
  size?: 'sm' | 'md';
}) {
  return (
    <div className="inline-flex rounded-lg bg-slate-100 p-1" role="tablist">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="tab"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className={`rounded-md font-semibold transition ${size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-sm'} ${
            value === o.value ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

