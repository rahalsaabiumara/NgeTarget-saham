import { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import {
  tryCalculatePortfolio,
  type AiInsightRequest,
  type CalculationResult,
  type HealthStatus,
  type PortfolioRecord,
  type StockListItem,
} from '@portocalc/shared';
import { api, type RecordFilter } from './lib/api';
import { formatDateId } from './lib/format';
import { EMPTY_FORM, HRTA_EXAMPLE, recordToForm, toCalculationInput, toRecordInput, type FormState } from './lib/form';
import { Header } from './components/Header';
import { SummaryCards } from './components/SummaryCards';
import { CalculatorForm } from './components/CalculatorForm';
import { ResultPanel } from './components/ResultPanel';
import { WhatIfSimulator } from './components/WhatIfSimulator';
import { PortfolioTable } from './components/PortfolioTable';
import { ForecastChart, type ForecastData } from './components/ForecastChart';
import { AiInsightCard } from './components/AiInsightCard';

interface Toast {
  id: number;
  type: 'success' | 'error';
  message: string;
}

export default function App() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [healthError, setHealthError] = useState<string | null>(null);
  const [stocks, setStocks] = useState<StockListItem[]>([]);
  const [records, setRecords] = useState<PortfolioRecord[]>([]);
  const [allRecords, setAllRecords] = useState<PortfolioRecord[]>([]);
  const [filter, setFilter] = useState<RecordFilter>('all');
  const [loadingRecords, setLoadingRecords] = useState(true);

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [forecast, setForecast] = useState<ForecastData | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);

  const notify = useCallback((type: Toast['type'], message: string) => {
    const id = Date.now();
    setToast({ id, type, message });
    setTimeout(() => setToast((t) => (t?.id === id ? null : t)), 3500);
  }, []);

  /* ------------------------------ Data loading ------------------------------ */
  useEffect(() => {
    api.health().then(setHealth).catch((e: Error) => setHealthError(e.message));
    api.stockList().then(setStocks).catch(() => setStocks([]));
  }, []);

  const loadRecords = useCallback(async () => {
    setLoadingRecords(true);
    try {
      const all = await api.listRecords('all');
      setAllRecords(all);
      setRecords(filter === 'all' ? all : all.filter((r) => r.isSimulation === (filter === 'simulation')));
    } catch (e) {
      notify('error', (e as Error).message);
    } finally {
      setLoadingRecords(false);
    }
  }, [filter, notify]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  // Muat baris terbaru ke kalkulator saat pertama kali dibuka agar dashboard langsung terisi.
  const [bootstrapped, setBootstrapped] = useState(false);
  useEffect(() => {
    if (!bootstrapped && allRecords.length > 0) {
      setBootstrapped(true);
      setForm(recordToForm(allRecords[0]));
      setEditingId(allRecords[0].id);
    }
  }, [allRecords, bootstrapped]);

  /* ------------------------------- Kalkulasi -------------------------------- */
  const calcInput = useMemo(() => toCalculationInput(form), [form]);
  const calc = useMemo(() => tryCalculatePortfolio(calcInput), [calcInput]);
  const result: CalculationResult | null = calc.ok ? calc.result : null;
  const canSave = calc.ok && form.symbol.trim().length > 0 && /^\d{4}-\d{2}-\d{2}$/.test(form.recordDate);

  const patchForm = (patch: Partial<FormState>) => setForm((f) => ({ ...f, ...patch }));

  /* --------------------------------- Aksi ----------------------------------- */
  const save = async (asNew = false) => {
    setSaving(true);
    try {
      const input = toRecordInput(form);
      const updating = editingId != null && !asNew;
      const saved = updating ? await api.updateRecord(editingId, input) : await api.createRecord(input);
      setEditingId(saved.id);
      notify('success', updating ? 'Perubahan tersimpan.' : `Catatan ${saved.symbol} ditambahkan ke tabel.`);
      await loadRecords();
    } catch (e) {
      notify('error', (e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const saveSimulation = async (sim: CalculationResult) => {
    setSaving(true);
    try {
      const base = toRecordInput(form);
      const saved = await api.createRecord({
        ...base,
        buyPrice: sim.buyPrice,
        sellPrice: sim.sellPrice,
        initialCapital: sim.initialCapital,
        currentAssetValue: sim.currentAssetValue,
        assetValueMode: 'manual',
        units: null,
        isSimulation: true,
        notes: `Skenario angan-angan dari ${base.symbol} (${formatDateId(base.recordDate)})`,
      });
      notify('success', 'Skenario disimpan sebagai catatan simulasi.');
      await loadRecords();
      setForm(recordToForm(saved));
      setEditingId(saved.id);
    } catch (e) {
      notify('error', (e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (r: PortfolioRecord) => {
    if (!window.confirm(`Hapus catatan ${r.symbol} tanggal ${formatDateId(r.recordDate)}?`)) return;
    try {
      await api.deleteRecord(r.id);
      if (editingId === r.id) {
        setEditingId(null);
        setForm(EMPTY_FORM);
      }
      notify('success', 'Catatan dihapus.');
      await loadRecords();
    } catch (e) {
      notify('error', (e as Error).message);
    }
  };

  const select = (r: PortfolioRecord) => {
    setForm(recordToForm(r));
    setEditingId(r.id);
    document.getElementById('kalkulator')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  /* ---------------------------------- AI ------------------------------------ */
  const aiRequest: AiInsightRequest | null = useMemo(() => {
    if (!result || !form.symbol.trim()) return null;
    const last = forecast?.points.at(-1);
    return {
      ...calcInput,
      symbol: form.symbol.trim().toUpperCase(),
      assetName: form.assetName.trim() || form.symbol.trim().toUpperCase(),
      recordDate: form.recordDate,
      recordId: editingId ?? undefined,
      forecast:
        forecast && last
          ? {
            method: forecast.method,
            months: forecast.months,
            annualizedReturnPct: forecast.annualizedReturnPct,
            annualizedVolatilityPct: forecast.annualizedVolatilityPct,
            targetHitMonth: forecast.targetHitMonth,
            finalBase: last.base,
            finalBull: last.bull,
            finalBear: last.bear,
          }
          : undefined,
    };
  }, [result, calcInput, form.symbol, form.assetName, form.recordDate, editingId, forecast]);

  return (
    <div className="min-h-screen">
      <Header health={health} error={healthError} />

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6">
        <SummaryCards records={allRecords} />

        <div id="kalkulator" className="grid scroll-mt-20 grid-cols-1 gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <CalculatorForm
              form={form}
              onChange={patchForm}
              stocks={stocks}
              editing={editingId != null}
              saving={saving}
              canSave={canSave}
              onSave={() => save(false)}
              onSaveAsNew={() => save(true)}
              onReset={() => setForm({ ...EMPTY_FORM })}
              onCancelEdit={() => {
                setEditingId(null);
                setForm({ ...EMPTY_FORM });
              }}
              onLoadExample={() => {
                setEditingId(null);
                setForm({ ...HRTA_EXAMPLE });
              }}
            />
          </div>
          <div className="space-y-6 lg:col-span-2">
            <ResultPanel result={result} errors={calc.ok ? [] : calc.errors} />
            <WhatIfSimulator input={calc.ok ? calcInput : null} base={result} onSaveSimulation={saveSimulation} saving={saving} />
          </div>
        </div>

        <PortfolioTable
          records={records}
          filter={filter}
          onFilterChange={setFilter}
          selectedId={editingId}
          onSelect={select}
          onDelete={remove}
          loading={loadingRecords}
        />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <ForecastChart result={result} symbol={form.symbol} assetName={form.assetName} stocks={stocks} onForecast={setForecast} />
          </div>
          <div className="lg:col-span-2">
            <AiInsightCard request={aiRequest} />
          </div>
        </div>

        <footer className="pt-2 pb-8 text-center text-xs text-slate-400">
          NgeTarget Saham · Data pasar: Yahoo Finance (via yahoo-finance2) · Bukan rekomendasi investasi.
        </footer>
      </main>

      {toast && (
        <div className="fixed right-4 bottom-4 z-50" role="status">
          <div
            className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-white shadow-lg ${toast.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'
              }`}
          >
            {toast.type === 'success' ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
            {toast.message}
          </div>
        </div>
      )}
    </div>
  );
}
