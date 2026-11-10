import { useEffect, useMemo, useState } from 'react';
import { Info, LineChart as LineChartIcon, Loader2 } from 'lucide-react';
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { CalculationResult, ForecastPoint, ForecastResult, StockListItem } from '@portocalc/shared';
import { api, type ForecastRequest } from '../lib/api';
import { formatCompactRupiah, formatDateId, formatMonthShort, formatPct, formatRupiah } from '../lib/format';
import { Field, NumberInput, SectionTitle, Segmented } from './ui';

export type ForecastData = ForecastResult & { notice?: string; months: number };

interface Props {
  result: CalculationResult | null;
  symbol: string;
  assetName: string;
  stocks: StockListItem[];
  onForecast: (f: ForecastData | null) => void;
}

const HORIZONS = [3, 6, 12, 24, 36];
const ASSUMPTION = '__assumption__';

/** Tebak acuan tren historis: ticker IDX → dirinya sendiri; aset emas → emas spot per gram. */
function guessTrendSymbol(symbol: string, assetName: string, stocks: StockListItem[]): string {
  const s = symbol.trim().toUpperCase();
  const text = `${s} ${assetName}`;
  if (/emas|gold|logam mulia|xau/i.test(assetName) || s === 'XAU-IDR') return 'XAU-IDR';
  if (stocks.some((x) => x.symbol === s)) return s;
  if (/^[A-Z]{4}$/.test(s)) return `${s}.JK`;
  if (/\.JK$/.test(s)) return s;
  return /emas|gold/i.test(text) ? 'XAU-IDR' : ASSUMPTION;
}

export function ForecastChart({ result, symbol, assetName, stocks, onForecast }: Props) {
  const [months, setMonths] = useState(12);
  const [trendOverride, setTrendOverride] = useState<string | null>(null);
  const [historyRange, setHistoryRange] = useState<ForecastRequest['historyRange']>('1y');
  const [annualReturnPct, setAnnualReturnPct] = useState(8);
  const [monthlyContribution, setMonthlyContribution] = useState<number | null>(0);
  const [forecast, setForecast] = useState<ForecastData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Acuan tren otomatis mengikuti aset yang dipilih, kecuali pengguna memilih manual.
  useEffect(() => setTrendOverride(null), [symbol]);
  const trendSymbol = trendOverride ?? guessTrendSymbol(symbol, assetName, stocks);
  const method: ForecastRequest['method'] = trendSymbol === ASSUMPTION ? 'assumption' : 'historical';

  const asset = result?.currentAssetValue;
  const capital = result?.initialCapital;
  const target = result?.targetPct;

  useEffect(() => {
    if (asset == null || capital == null || target == null) {
      setForecast(null);
      onForecast(null);
      return;
    }
    const ctrl = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.forecast(
          {
            currentAssetValue: asset,
            initialCapital: capital,
            targetPct: target,
            months,
            monthlyContribution: monthlyContribution ?? 0,
            method,
            annualReturnPct,
            symbol: method === 'historical' ? trendSymbol : undefined,
            historyRange,
          },
          ctrl.signal,
        );
        const data = { ...res, months };
        setForecast(data);
        onForecast(data);
      } catch (e) {
        if ((e as Error).name !== 'AbortError') setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    }, 350);
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
    // onForecast sengaja tidak dimasukkan agar tidak memicu ulang request.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asset, capital, target, months, method, trendSymbol, historyRange, annualReturnPct, monthlyContribution]);

  const data = useMemo(
    () => forecast?.points.map((p) => ({ ...p, band: [p.bear, p.bull] as [number, number] })) ?? [],
    [forecast],
  );
  const usedAssumption = forecast?.method === 'assumption';

  return (
    <section className="card">
      <SectionTitle
        icon={<LineChartIcon size={18} />}
        title="Forecasting Perkembangan Aset"
        subtitle="Proyeksi skenario optimis, moderat & pesimis"
        action={loading && <Loader2 size={18} className="animate-spin text-indigo-500" />}
      />
      <div className="space-y-4 p-5">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Horizon">
            {(id) => (
              <select id={id} className="input" value={months} onChange={(e) => setMonths(Number(e.target.value))}>
                {HORIZONS.map((h) => (
                  <option key={h} value={h}>
                    {h} bulan
                  </option>
                ))}
              </select>
            )}
          </Field>
          <Field label="Acuan tren">
            {(id) => (
              <select id={id} className="input" value={trendSymbol} onChange={(e) => setTrendOverride(e.target.value)}>
                <option value={ASSUMPTION}>Asumsi return manual</option>
                {!stocks.some((s) => s.symbol === trendSymbol) && trendSymbol !== ASSUMPTION && (
                  <option value={trendSymbol}>{trendSymbol} (historis)</option>
                )}
                {stocks.map((s) => (
                  <option key={s.symbol} value={s.symbol}>
                    {s.symbol} — {s.name}
                  </option>
                ))}
              </select>
            )}
          </Field>
          {method === 'historical' ? (
            <Field label="Data historis">
              {() => (
                <Segmented
                  size="sm"
                  value={historyRange}
                  onChange={setHistoryRange}
                  options={[
                    { value: '3m', label: '3 bln' },
                    { value: '6m', label: '6 bln' },
                    { value: '1y', label: '1 thn' },
                  ]}
                />
              )}
            </Field>
          ) : (
            <Field label={`Return tahunan: ${formatPct(annualReturnPct, 0, true)}`}>
              {(id) => (
                <input
                  id={id}
                  type="range"
                  className="range mt-3"
                  min={-20}
                  max={40}
                  step={1}
                  value={annualReturnPct}
                  onChange={(e) => setAnnualReturnPct(Number(e.target.value))}
                />
              )}
            </Field>
          )}
          <Field label="Setoran rutin / bulan">
            {(id) => (
              <NumberInput id={id} prefix="Rp" value={monthlyContribution} onChange={setMonthlyContribution} placeholder="0" decimals={0} />
            )}
          </Field>
        </div>

        {!result ? (
          <Empty text="Lengkapi kalkulator untuk melihat proyeksi." />
        ) : error ? (
          <Empty text={error} />
        ) : !forecast ? (
          <div className="h-[320px] animate-pulse rounded-xl bg-slate-100" />
        ) : (
          <>
            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis dataKey="date" tickFormatter={formatMonthShort} tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={{ stroke: '#cbd5e1' }} />
                  <YAxis tickFormatter={formatCompactRupiah} tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} width={64} domain={['auto', 'auto']} />
                  <Tooltip content={<ForecastTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 12 }} iconType="plainline" />
                  <Area dataKey="band" name="Rentang skenario" fill="#6366f1" fillOpacity={0.08} stroke="none" legendType="none" isAnimationActive={false} />
                  <Line dataKey="targetValue" name="Target" type="stepAfter" stroke="#d97706" strokeWidth={1.5} strokeDasharray="6 4" dot={false} isAnimationActive={false} />
                  <Line dataKey="invested" name="Modal disetor" type="stepAfter" stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="2 3" dot={false} isAnimationActive={false} />
                  <Line dataKey="bull" name="Optimis" stroke="#10b981" strokeWidth={1.75} dot={false} isAnimationActive={false} />
                  <Line dataKey="base" name="Moderat" stroke="#4f46e5" strokeWidth={2.5} dot={false} isAnimationActive={false} />
                  <Line dataKey="bear" name="Pesimis" stroke="#f43f5e" strokeWidth={1.75} dot={false} isAnimationActive={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <HitCard tone="rose" label="Pesimis" month={forecast.targetHitMonth.bear} points={forecast.points} final={forecast.points.at(-1)!.bear} />
              <HitCard tone="indigo" label="Moderat" month={forecast.targetHitMonth.base} points={forecast.points} final={forecast.points.at(-1)!.base} />
              <HitCard tone="emerald" label="Optimis" month={forecast.targetHitMonth.bull} points={forecast.points} final={forecast.points.at(-1)!.bull} />
            </div>

            <div className="flex items-start gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
              <Info size={14} className="mt-0.5 shrink-0 text-slate-400" />
              <p>
                {usedAssumption ? (
                  <>Metode <b>asumsi return</b> {formatPct(forecast.annualizedReturnPct, 1, true)}/tahun, volatilitas {formatPct(forecast.annualizedVolatilityPct, 0)}.</>
                ) : (
                  <>
                    Metode <b>tren historis {trendSymbol}</b> ({forecast.sampleSize} hari bursa): return ~{formatPct(forecast.annualizedReturnPct, 1, true)}/tahun
                    {forecast.rawAnnualizedReturnPct != null && forecast.rawAnnualizedReturnPct !== forecast.annualizedReturnPct && (
                      <> (aktual {formatPct(forecast.rawAnnualizedReturnPct, 1, true)}, dibatasi agar wajar)</>
                    )}
                    , volatilitas {formatPct(forecast.annualizedVolatilityPct, 0)}.
                  </>
                )}{' '}
                {forecast.notice && <span className="text-amber-700">{forecast.notice} </span>}
                Proyeksi bersifat ilustratif — kinerja masa lalu tidak menjamin hasil masa depan.
              </p>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="flex h-[200px] items-center justify-center rounded-xl bg-slate-50 px-4 text-center text-sm text-slate-500">{text}</div>;
}

const HIT_TONES = {
  rose: 'border-rose-200 bg-rose-50/60 text-rose-700',
  indigo: 'border-indigo-200 bg-indigo-50/60 text-indigo-700',
  emerald: 'border-emerald-200 bg-emerald-50/60 text-emerald-700',
};

function HitCard({
  tone,
  label,
  month,
  points,
  final,
}: {
  tone: keyof typeof HIT_TONES;
  label: string;
  month: number | null;
  points: ForecastPoint[];
  final: number;
}) {
  const hitDate = month != null ? points.find((p) => p.month === month)?.date : null;
  return (
    <div className={`rounded-xl border px-3 py-2.5 ${HIT_TONES[tone]}`}>
      <div className="text-xs font-semibold uppercase">{label}</div>
      <div className="mt-0.5 text-sm font-bold text-slate-900">
        {month == null ? 'Target belum tercapai' : month === 0 ? 'Sudah tercapai' : `Target ±bulan ke-${month}`}
      </div>
      <div className="text-xs text-slate-600">
        {hitDate && month! > 0 ? `${formatDateId(hitDate)} · ` : ''}akhir: <span className="num">{formatRupiah(final)}</span>
      </div>
    </div>
  );
}

interface TooltipProps {
  active?: boolean;
  payload?: { payload: ForecastPoint }[];
}

function ForecastTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  const rows: [string, number, string][] = [
    ['Optimis', p.bull, 'text-emerald-600'],
    ['Moderat', p.base, 'text-indigo-600'],
    ['Pesimis', p.bear, 'text-rose-600'],
    ['Target', p.targetValue, 'text-amber-600'],
    ['Modal disetor', p.invested, 'text-slate-500'],
  ];
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg">
      <div className="mb-1 font-semibold text-slate-800">
        {p.month === 0 ? 'Saat ini' : `Bulan ke-${p.month}`} · {formatDateId(p.date)}
      </div>
      {rows.map(([label, value, cls]) => (
        <div key={label} className="flex justify-between gap-4">
          <span className={cls}>{label}</span>
          <span className="num font-semibold text-slate-800">{formatRupiah(value)}</span>
        </div>
      ))}
    </div>
  );
}
