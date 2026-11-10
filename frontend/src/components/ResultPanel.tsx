import { AlertCircle, CheckCircle2, Gauge } from 'lucide-react';
import type { CalculationResult } from '@portocalc/shared';
import { formatPct, formatRupiah, formatSignedRupiah } from '../lib/format';
import { SectionTitle, TargetBadge, plColor } from './ui';

/** Hasil kalkulasi instan — kolom persis seperti spreadsheet + info tambahan. */
export function ResultPanel({ result, errors }: { result: CalculationResult | null; errors: string[] }) {
  return (
    <section className="card">
      <SectionTitle icon={<Gauge size={18} />} title="Hasil Kalkulasi" subtitle="Diperbarui otomatis saat Anda mengetik" />
      {!result ? (
        <div className="flex items-start gap-3 p-5 text-sm text-slate-500">
          <AlertCircle size={18} className="mt-0.5 shrink-0 text-slate-400" />
          <div>
            <p className="font-medium text-slate-600">Lengkapi input untuk melihat hasil.</p>
            {errors.length > 0 && (
              <ul className="mt-1 list-disc pl-4 text-xs">
                {errors.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4 p-5">
          <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4">
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase">Laba / Rugi</div>
              <div className={`num text-2xl font-bold ${plColor(result.profitLossNominal)}`}>
                {formatSignedRupiah(result.profitLossNominal, 2)}
              </div>
              <div className={`num text-sm font-semibold ${plColor(result.profitLossPct)}`}>
                {formatPct(result.profitLossPct, 2, true)}
              </div>
            </div>
            <div className="text-right">
              <div className="mb-1 text-xs font-semibold text-slate-500 uppercase">Target &gt;{formatPct(result.targetPct, 0)}</div>
              <TargetBadge met={result.isTargetMet} />
            </div>
          </div>

          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <Item label="%Rugi (spread)" value={formatPct(result.spreadLossPct)} valueClass={result.spreadLossPct > 0 ? 'text-rose-600' : ''} />
            <Item label="Aset saat ini" value={formatRupiah(result.currentAssetValue)} />
            <Item label="Modal awal" value={formatRupiah(result.initialCapital)} />
            <Item label="Nilai aset target" value={formatRupiah(result.targetAssetValue)} />
          </dl>

          <div className="rounded-xl border border-slate-200 p-4 text-sm">
            {result.isTargetMet ? (
              <p className="flex items-start gap-2 text-emerald-700">
                <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
                Target tercapai! Aset melebihi target sebesar{' '}
                <b className="num">{formatRupiah(result.currentAssetValue - result.targetAssetValue)}</b>.
              </p>
            ) : (
              <div className="space-y-2">
                <Row label="Kurang menuju target" value={formatRupiah(result.shortfallToTarget)} strong />
                <Row label="Harga JUAL impas (L/R = 0)" value={formatRupiah(result.breakEvenSellPrice)} />
                <Row
                  label="Harga JUAL untuk target"
                  value={
                    <>
                      {formatRupiah(result.requiredSellPriceForTarget)}{' '}
                      <span className="text-xs text-slate-500">({formatPct(result.requiredPriceChangePct, 2, true)})</span>
                    </>
                  }
                />
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function Item({ label, value, valueClass = 'text-slate-900' }: { label: string; value: string; valueClass?: string }) {
  return (
    <div>
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className={`num font-semibold ${valueClass}`}>{value}</dd>
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: React.ReactNode; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-slate-500">{label}</span>
      <span className={`num text-right ${strong ? 'font-bold text-amber-700' : 'font-semibold text-slate-800'}`}>{value}</span>
    </div>
  );
}

