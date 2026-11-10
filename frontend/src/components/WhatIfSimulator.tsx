import { useMemo, useState } from 'react';
import { ArrowRight, RotateCcw, Save, Wand2 } from 'lucide-react';
import { simulateWhatIf, type CalculationInput, type CalculationResult } from '@portocalc/shared';
import { formatPct, formatRupiah, formatSignedRupiah } from '../lib/format';
import { NumberInput, SectionTitle, TargetBadge, plColor } from './ui';

interface Props {
  input: CalculationInput | null;
  base: CalculationResult | null;
  onSaveSimulation: (sim: CalculationResult) => void;
  saving: boolean;
}

/** Simulasi "angan-angan": bagaimana bila harga jual berubah & modal ditambah? */
export function WhatIfSimulator({ input, base, onSaveSimulation, saving }: Props) {
  const [priceChangePct, setPriceChangePct] = useState(0);
  const [additionalCapital, setAdditionalCapital] = useState<number | null>(0);

  const sim = useMemo(() => {
    if (!input || !base) return null;
    try {
      return simulateWhatIf({ base: input, priceChangePct, additionalCapital: additionalCapital ?? 0 });
    } catch {
      return null;
    }
  }, [input, base, priceChangePct, additionalCapital]);

  const step = base ? niceStep(base.initialCapital) : 100_000;
  const disabled = !base;
  const changed = priceChangePct !== 0 || (additionalCapital ?? 0) > 0;

  return (
    <section className="card">
      <SectionTitle
        icon={<Wand2 size={18} />}
        title="Simulasi Angan-Angan"
        subtitle="Geser untuk melihat skenario “bagaimana jika…”"
        action={
          changed && (
            <button
              type="button"
              className="btn-ghost text-xs"
              onClick={() => {
                setPriceChangePct(0);
                setAdditionalCapital(0);
              }}
            >
              <RotateCcw size={14} /> Reset
            </button>
          )
        }
      />
      <div className={`space-y-5 p-5 ${disabled ? 'pointer-events-none opacity-50' : ''}`}>
        <div>
          <div className="mb-2 flex items-center justify-between text-sm">
            <label htmlFor="whatif-price" className="font-medium text-slate-700">
              Perubahan harga JUAL
            </label>
            <span className={`num font-bold ${plColor(priceChangePct)}`}>{formatPct(priceChangePct, 1, true)}</span>
          </div>
          <input
            id="whatif-price"
            type="range"
            className="range"
            min={-30}
            max={50}
            step={0.5}
            value={priceChangePct}
            onChange={(e) => setPriceChangePct(Number(e.target.value))}
          />
          <div className="mt-1 flex justify-between text-[11px] text-slate-400">
            <span>-30%</span>
            <span>0</span>
            <span>+50%</span>
          </div>
          {base && (
            <p className="mt-1 text-xs text-slate-500">
              Harga JUAL {formatRupiah(base.sellPrice)} → <b className="num">{formatRupiah(sim?.sellPrice)}</b>
            </p>
          )}
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between text-sm">
            <label htmlFor="whatif-capital" className="font-medium text-slate-700">
              Tambahan modal (dibeli di harga BELI)
            </label>
          </div>
          <NumberInput id="whatif-capital" prefix="Rp" value={additionalCapital} onChange={setAdditionalCapital} placeholder="0" decimals={0} />
          <div className="mt-2 flex flex-wrap gap-1.5">
            {[1, 2, 5, 10].map((m) => (
              <button
                key={m}
                type="button"
                className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-indigo-50 hover:text-indigo-700"
                onClick={() => setAdditionalCapital((additionalCapital ?? 0) + step * m)}
              >
                +{formatRupiah(step * m)}
              </button>
            ))}
          </div>
        </div>

        {base && sim && (
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold">Metrik</th>
                  <th className="px-3 py-2 text-right font-semibold">Saat ini</th>
                  <th className="w-6" />
                  <th className="px-3 py-2 text-right font-semibold text-indigo-700">Simulasi</th>
                </tr>
              </thead>
              <tbody className="num divide-y divide-slate-100">
                <CompareRow label="Modal" a={formatRupiah(base.initialCapital)} b={formatRupiah(sim.initialCapital)} />
                <CompareRow label="Aset" a={formatRupiah(base.currentAssetValue)} b={formatRupiah(sim.currentAssetValue)} />
                <CompareRow
                  label="L/R"
                  a={<span className={plColor(base.profitLossNominal)}>{formatSignedRupiah(base.profitLossNominal)}</span>}
                  b={<span className={plColor(sim.profitLossNominal)}>{formatSignedRupiah(sim.profitLossNominal)}</span>}
                />
                <CompareRow
                  label="%L/R"
                  a={<span className={plColor(base.profitLossPct)}>{formatPct(base.profitLossPct, 2, true)}</span>}
                  b={<span className={plColor(sim.profitLossPct)}>{formatPct(sim.profitLossPct, 2, true)}</span>}
                />
                <CompareRow label="Target" a={<TargetBadge met={base.isTargetMet} />} b={<TargetBadge met={sim.isTargetMet} />} />
              </tbody>
            </table>
          </div>
        )}

        {base && sim && changed && (
          <button type="button" className="btn-secondary w-full" disabled={saving} onClick={() => onSaveSimulation(sim)}>
            <Save size={16} /> Simpan skenario ini sebagai Simulasi
          </button>
        )}
      </div>
    </section>
  );
}

function CompareRow({ label, a, b }: { label: string; a: React.ReactNode; b: React.ReactNode }) {
  return (
    <tr>
      <td className="px-3 py-2 font-sans text-slate-500">{label}</td>
      <td className="px-3 py-2 text-right">{a}</td>
      <td className="text-center text-slate-300">
        <ArrowRight size={14} className="inline" />
      </td>
      <td className="px-3 py-2 text-right font-semibold">{b}</td>
    </tr>
  );
}

/** Langkah tombol cepat ≈ 10% modal, dibulatkan ke angka "cantik". */
function niceStep(capital: number): number {
  const raw = Math.max(10_000, capital * 0.1);
  const pow = 10 ** Math.floor(Math.log10(raw));
  const n = raw / pow;
  return (n < 2 ? 1 : n < 5 ? 2 : 5) * pow;
}

