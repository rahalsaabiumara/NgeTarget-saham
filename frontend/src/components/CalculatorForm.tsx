import { useState } from 'react';
import { Calculator, CopyPlus, Download, Eraser, FileSpreadsheet, Loader2, Save, X } from 'lucide-react';
import type { StockListItem, StockQuote } from '@portocalc/shared';
import { api } from '../lib/api';
import { formatPct, formatRupiah } from '../lib/format';
import type { FormState } from '../lib/form';
import { Badge, Field, NumberInput, SectionTitle, Segmented } from './ui';

interface Props {
  form: FormState;
  onChange: (patch: Partial<FormState>) => void;
  stocks: StockListItem[];
  editing: boolean;
  saving: boolean;
  canSave: boolean;
  onSave: () => void;
  onSaveAsNew: () => void;
  onReset: () => void;
  onCancelEdit: () => void;
  onLoadExample: () => void;
}

export function CalculatorForm({
  form,
  onChange,
  stocks,
  editing,
  saving,
  canSave,
  onSave,
  onSaveAsNew,
  onReset,
  onCancelEdit,
  onLoadExample,
}: Props) {
  const [quote, setQuote] = useState<StockQuote | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [loadingQuote, setLoadingQuote] = useState(false);

  const handleSymbol = (raw: string) => {
    const upper = raw.toUpperCase();
    const match = stocks.find((s) => s.symbol === upper);
    onChange({ symbol: upper, ...(match ? { assetName: match.name } : {}) });
    setQuote(null);
    setQuoteError(null);
  };

  const fetchQuote = async () => {
    if (!form.symbol.trim()) return;
    setLoadingQuote(true);
    setQuoteError(null);
    try {
      const q = await api.quote(form.symbol);
      setQuote(q);
      onChange({ symbol: q.symbol, assetName: q.name, buyPrice: q.buyPrice, sellPrice: q.sellPrice });
    } catch (e) {
      setQuote(null);
      setQuoteError((e as Error).message);
    } finally {
      setLoadingQuote(false);
    }
  };

  return (
    <section className="card">
      <SectionTitle
        icon={<Calculator size={18} />}
        title={editing ? 'Ubah Catatan Portofolio' : 'Kalkulator Portofolio'}
        subtitle="Pilih aset, isi harga & modal — hasil dihitung otomatis"
        action={
          <button type="button" className="btn-ghost text-xs" onClick={onLoadExample} title="Isi contoh dari spreadsheet">
            <FileSpreadsheet size={16} /> Contoh HRTA
          </button>
        }
      />

      <form
        className="space-y-5 p-5"
        onSubmit={(e) => {
          e.preventDefault();
          if (canSave) onSave();
        }}
      >
        {/* 1. Aset */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-5">
          <Field
            label="Saham / Aset"
            className="sm:col-span-2"
            hint="Ketik ticker IDX (mis. BBCA) atau nama aset bebas"
          >
            {(id) => (
              <div className="flex gap-2">
                <input
                  id={id}
                  className="input uppercase"
                  list="stock-options"
                  placeholder="HRTA.JK"
                  value={form.symbol}
                  onChange={(e) => handleSymbol(e.target.value)}
                  autoComplete="off"
                />
                <datalist id="stock-options">
                  {stocks.map((s) => (
                    <option key={s.symbol} value={s.symbol}>
                      {s.name} · {s.sector}
                    </option>
                  ))}
                </datalist>
                <button
                  type="button"
                  className="btn-secondary shrink-0 px-3"
                  onClick={fetchQuote}
                  disabled={!form.symbol.trim() || loadingQuote}
                  title="Ambil harga pasar terbaru dari Yahoo Finance"
                >
                  {loadingQuote ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                  <span className="hidden md:inline">Harga</span>
                </button>
              </div>
            )}
          </Field>
          <Field label="Nama Aset" className="sm:col-span-3">
            {(id) => (
              <input
                id={id}
                className="input"
                placeholder="Mis. Emas HRTA (Hartadinata)"
                value={form.assetName}
                onChange={(e) => onChange({ assetName: e.target.value })}
              />
            )}
          </Field>
        </div>

        {quote && (
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-800">
            <Badge tone={quote.source === 'live' ? 'green' : 'amber'}>{quote.source === 'live' ? 'Live' : 'Cache'}</Badge>
            <span className="font-semibold">{quote.name}</span>
            <span>
              Terakhir {formatRupiah(quote.lastPrice)}
              {quote.changePct != null && (
                <span className={quote.changePct >= 0 ? 'text-emerald-700' : 'text-rose-700'}>
                  {' '}
                  ({formatPct(quote.changePct, 2, true)})
                </span>
              )}
            </span>
            <span className="text-sky-700/80">· {quote.priceBasis}</span>
          </div>
        )}
        {quoteError && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">{quoteError}</div>
        )}

        {/* 2. Harga */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Harga Beli (BELI)" hint="Harga beli / ask per unit">
            {(id) => (
              <NumberInput id={id} prefix="Rp" value={form.buyPrice} onChange={(v) => onChange({ buyPrice: v })} placeholder="2.455.000" />
            )}
          </Field>
          <Field label="Harga Jual (JUAL)" hint="Harga jual / buyback / bid per unit">
            {(id) => (
              <NumberInput id={id} prefix="Rp" value={form.sellPrice} onChange={(v) => onChange({ sellPrice: v })} placeholder="2.375.000" />
            )}
          </Field>
        </div>

        {/* 3. Modal & aset */}
        <div className="space-y-3 rounded-xl bg-slate-50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm font-semibold text-slate-700">Nilai Aset Saat Ini</span>
            <Segmented
              size="sm"
              value={form.assetValueMode}
              onChange={(v) => onChange({ assetValueMode: v })}
              options={[
                { value: 'manual', label: 'Input langsung' },
                { value: 'auto', label: 'Hitung otomatis' },
              ]}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Modal Awal">
              {(id) => (
                <NumberInput
                  id={id}
                  prefix="Rp"
                  value={form.initialCapital}
                  onChange={(v) => onChange({ initialCapital: v })}
                  placeholder="2.100.000"
                />
              )}
            </Field>
            {form.assetValueMode === 'manual' ? (
              <Field label="Aset Saat Ini" hint="Nilai aset seperti di aplikasi/spreadsheet Anda">
                {(id) => (
                  <NumberInput
                    id={id}
                    prefix="Rp"
                    value={form.currentAssetValue}
                    onChange={(v) => onChange({ currentAssetValue: v })}
                    placeholder="2.072.900"
                  />
                )}
              </Field>
            ) : (
              <Field
                label="Jumlah Unit (opsional)"
                hint={
                  form.units
                    ? `Aset = unit × JUAL. Saham: 1 lot = 100 lembar (${(form.units / 100).toLocaleString('id-ID')} lot).`
                    : 'Kosongkan → aset = modal × (JUAL ÷ BELI)'
                }
              >
                {(id) => (
                  <NumberInput
                    id={id}
                    suffix="unit"
                    value={form.units}
                    onChange={(v) => onChange({ units: v })}
                    placeholder="lembar / gram"
                    decimals={4}
                  />
                )}
              </Field>
            )}
          </div>
        </div>

        {/* 4. Target & tanggal */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Target Keuntungan">
            {(id) => (
              <NumberInput id={id} suffix="%" value={form.targetPct} onChange={(v) => onChange({ targetPct: v })} placeholder="10" />
            )}
          </Field>
          <Field label="Tanggal">
            {(id) => (
              <input
                id={id}
                type="date"
                className="input"
                value={form.recordDate}
                onChange={(e) => onChange({ recordDate: e.target.value })}
              />
            )}
          </Field>
          <Field label="Jenis Catatan">
            {() => (
              <Segmented
                value={form.isSimulation ? 'sim' : 'actual'}
                onChange={(v) => onChange({ isSimulation: v === 'sim' })}
                options={[
                  { value: 'actual', label: 'Aktual' },
                  { value: 'sim', label: 'Simulasi' },
                ]}
              />
            )}
          </Field>
        </div>

        <Field label="Catatan (opsional)">
          {(id) => (
            <input
              id={id}
              className="input"
              maxLength={500}
              placeholder="Mis. beli via aplikasi X, rencana hold 1 tahun"
              value={form.notes}
              onChange={(e) => onChange({ notes: e.target.value })}
            />
          )}
        </Field>

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 pt-4">
          {editing ? (
            <button type="button" className="btn-ghost" onClick={onCancelEdit}>
              <X size={16} /> Batal ubah
            </button>
          ) : (
            <button type="button" className="btn-ghost" onClick={onReset}>
              <Eraser size={16} /> Reset
            </button>
          )}
          {editing && (
            <button type="button" className="btn-secondary" disabled={!canSave || saving} onClick={onSaveAsNew}>
              <CopyPlus size={16} /> Simpan sebagai baru
            </button>
          )}
          <button type="submit" className="btn-primary" disabled={!canSave || saving}>
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {editing ? 'Simpan Perubahan' : 'Simpan ke Tabel'}
          </button>
        </div>
      </form>
    </section>
  );
}
