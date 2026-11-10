import { Target, TrendingDown, TrendingUp, Wallet, PiggyBank } from 'lucide-react';
import type { PortfolioRecord } from '@portocalc/shared';
import { formatPct, formatRupiah, formatSignedRupiah } from '../lib/format';
import { plColor } from './ui';

/**
 * KPI ringkasan dihitung dari catatan AKTUAL terbaru per aset
 * (catatan simulasi & riwayat tanggal lama tidak dijumlahkan agar tidak dobel).
 */
export function SummaryCards({ records }: { records: PortfolioRecord[] }) {
  const latest = new Map<string, PortfolioRecord>();
  for (const r of records) {
    if (r.isSimulation) continue;
    const prev = latest.get(r.symbol);
    if (!prev || r.recordDate > prev.recordDate || (r.recordDate === prev.recordDate && r.createdAt > prev.createdAt)) {
      latest.set(r.symbol, r);
    }
  }
  const rows = [...latest.values()];
  const capital = rows.reduce((a, r) => a + r.initialCapital, 0);
  const asset = rows.reduce((a, r) => a + r.currentAssetValue, 0);
  const pl = asset - capital;
  const plPct = capital > 0 ? (pl / capital) * 100 : null;
  const met = rows.filter((r) => r.isTargetMet).length;
  const empty = rows.length === 0;

  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Ringkasan portofolio">
      <Kpi
        icon={<PiggyBank size={18} />}
        label="Total Modal Awal"
        value={empty ? '—' : formatRupiah(capital)}
        foot={empty ? 'Belum ada catatan aktual' : `${rows.length} aset aktual`}
      />
      <Kpi
        icon={<Wallet size={18} />}
        label="Total Aset Saat Ini"
        value={empty ? '—' : formatRupiah(asset)}
        foot="Catatan terbaru per aset"
      />
      <Kpi
        icon={pl >= 0 ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
        label="Total Laba / Rugi"
        value={empty ? '—' : formatSignedRupiah(pl)}
        valueClass={empty ? '' : plColor(pl)}
        foot={empty ? '—' : <span className={plColor(plPct)}>{formatPct(plPct, 2, true)} dari modal</span>}
        accent={empty ? 'slate' : pl >= 0 ? 'green' : 'red'}
      />
      <Kpi
        icon={<Target size={18} />}
        label="Status Target"
        value={empty ? '—' : `${met} / ${rows.length}`}
        foot={empty ? '—' : met === rows.length ? 'Semua target tercapai 🎉' : `${rows.length - met} aset belum mencapai target`}
        accent={empty ? 'slate' : met === rows.length ? 'green' : 'amber'}
      />
    </section>
  );
}

const ACCENTS = {
  indigo: 'bg-indigo-50 text-indigo-600',
  green: 'bg-emerald-50 text-emerald-600',
  red: 'bg-rose-50 text-rose-600',
  amber: 'bg-amber-50 text-amber-600',
  slate: 'bg-slate-100 text-slate-500',
};

function Kpi({
  icon,
  label,
  value,
  foot,
  valueClass = 'text-slate-900',
  accent = 'indigo',
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  foot: React.ReactNode;
  valueClass?: string;
  accent?: keyof typeof ACCENTS;
}) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-500">{label}</span>
        <span className={`rounded-lg p-2 ${ACCENTS[accent]}`}>{icon}</span>
      </div>
      <div className={`num mt-3 text-2xl font-bold ${valueClass}`}>{value}</div>
      <div className="mt-1 text-xs text-slate-500">{foot}</div>
    </div>
  );
}

