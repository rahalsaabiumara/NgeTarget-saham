import { FileDown, Pencil, Sparkles, Table2, Trash2 } from 'lucide-react';
import type { PortfolioRecord } from '@portocalc/shared';
import { api, type RecordFilter } from '../lib/api';
import { formatDateId, formatPct, formatRupiah, formatSignedRupiah } from '../lib/format';
import { Badge, SectionTitle, Segmented, TargetBadge, plColor } from './ui';

interface Props {
  records: PortfolioRecord[];
  filter: RecordFilter;
  onFilterChange: (f: RecordFilter) => void;
  selectedId: string | null;
  onSelect: (r: PortfolioRecord) => void;
  onDelete: (r: PortfolioRecord) => void;
  loading: boolean;
}

const HEADERS = [
  { label: 'Saham / Aset', align: 'left' },
  { label: 'Beli', align: 'right' },
  { label: 'Jual', align: 'right' },
  { label: '%Rugi', align: 'right' },
  { label: 'Tanggal', align: 'left' },
  { label: 'Aset Saat Ini', align: 'right' },
  { label: 'Modal Awal', align: 'right' },
  { label: 'L/R', align: 'right' },
  { label: '%L/R', align: 'right' },
  { label: 'Target', align: 'left' },
  { label: 'Aksi', align: 'right' },
] as const;

/** Tabel monitoring bergaya spreadsheet — kolom sama persis dengan referensi pengguna. */
export function PortfolioTable({ records, filter, onFilterChange, selectedId, onSelect, onDelete, loading }: Props) {
  return (
    <section className="card overflow-hidden">
      <SectionTitle
        icon={<Table2 size={18} />}
        title="Tabel Monitoring Portofolio"
        subtitle="Klik baris untuk memuat ke kalkulator, forecasting & analisis AI"
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Segmented
              size="sm"
              value={filter}
              onChange={onFilterChange}
              options={[
                { value: 'all', label: 'Semua' },
                { value: 'actual', label: 'Aktual' },
                { value: 'simulation', label: 'Simulasi' },
              ]}
            />
            <a className="btn-secondary px-3 py-1.5 text-xs" href={api.exportCsvUrl(filter)} download>
              <FileDown size={14} /> Export CSV
            </a>
          </div>
        }
      />
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1040px] text-sm">
          <thead className="bg-slate-50 text-[11px] tracking-wide text-slate-500 uppercase">
            <tr>
              {HEADERS.map((h) => (
                <th key={h.label} className={`px-2.5 py-2.5 font-semibold whitespace-nowrap ${h.align === 'right' ? 'text-right' : 'text-left'}`}>
                  {h.label === 'Target' ? 'Target >X%' : h.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {records.length === 0 && (
              <tr>
                <td colSpan={HEADERS.length} className="px-3 py-10 text-center text-slate-500">
                  {loading ? 'Memuat data…' : 'Belum ada catatan. Isi kalkulator lalu klik “Simpan ke Tabel”.'}
                </td>
              </tr>
            )}
            {records.map((r) => {
              const selected = r.id === selectedId;
              return (
                <tr
                  key={r.id}
                  onClick={() => onSelect(r)}
                  className={`cursor-pointer transition ${selected ? 'bg-indigo-50/70' : 'hover:bg-slate-50'}`}
                  aria-selected={selected}
                >
                  <td className="px-2.5 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className={`h-8 w-1 rounded-full ${selected ? 'bg-indigo-500' : 'bg-transparent'}`} />
                      <div>
                        <div className="flex items-center gap-1.5 font-semibold text-slate-900">
                          {r.symbol}
                          {r.isSimulation && <Badge tone="sky">Simulasi</Badge>}
                          {r.hasAiInsight && <Sparkles size={13} className="text-indigo-500" aria-label="Ada insight AI" />}
                        </div>
                        <div className="max-w-[170px] truncate text-xs text-slate-500" title={r.assetName}>
                          {r.assetName}
                        </div>
                      </div>
                    </div>
                  </td>
                  <Num>{formatRupiah(r.buyPrice)}</Num>
                  <Num>{formatRupiah(r.sellPrice)}</Num>
                  <Num className={r.spreadLossPct > 0 ? 'text-rose-600' : ''}>{formatPct(r.spreadLossPct)}</Num>
                  <td className="px-2.5 py-2.5 whitespace-nowrap text-slate-600">{formatDateId(r.recordDate)}</td>
                  <Num className="font-semibold text-slate-900">{formatRupiah(r.currentAssetValue)}</Num>
                  <Num>{formatRupiah(r.initialCapital)}</Num>
                  <Num className={`font-semibold ${plColor(r.profitLossNominal)}`}>{formatSignedRupiah(r.profitLossNominal, 2)}</Num>
                  <Num className={`font-semibold ${plColor(r.profitLossPct)}`}>{formatPct(r.profitLossPct, 2, true)}</Num>
                  <td className="px-2.5 py-2.5">
                    <div className="flex flex-col items-start gap-0.5">
                      <TargetBadge met={r.isTargetMet} targetPct={r.targetPct} />
                      <span className="text-[11px] whitespace-nowrap text-slate-500">
                        &gt;{formatPct(r.targetPct, 0)}
                        {!r.isTargetMet && ` · kurang ${formatRupiah(r.shortfallToTarget)}`}
                      </span>
                    </div>
                  </td>
                  <td className="px-2.5 py-2.5 text-right whitespace-nowrap">
                    <button
                      type="button"
                      className="rounded-md p-1.5 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600"
                      title="Ubah"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelect(r);
                      }}
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      type="button"
                      className="rounded-md p-1.5 text-slate-500 hover:bg-rose-50 hover:text-rose-600"
                      title="Hapus"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(r);
                      }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Num({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <td className={`num px-2.5 py-2.5 text-right whitespace-nowrap text-slate-700 ${className}`}>{children}</td>;
}
