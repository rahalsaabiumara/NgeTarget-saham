import type { AssetValueMode, CalculationInput, PortfolioRecord, PortfolioRecordInput } from '@portocalc/shared';
import { todayIso } from './format';

/** State form kalkulator (nilai kosong = null agar input bisa dikosongkan). */
export interface FormState {
  symbol: string;
  assetName: string;
  buyPrice: number | null;
  sellPrice: number | null;
  initialCapital: number | null;
  currentAssetValue: number | null;
  units: number | null;
  assetValueMode: AssetValueMode;
  targetPct: number | null;
  recordDate: string;
  isSimulation: boolean;
  notes: string;
}

export const EMPTY_FORM: FormState = {
  symbol: '',
  assetName: '',
  buyPrice: null,
  sellPrice: null,
  initialCapital: null,
  currentAssetValue: null,
  units: null,
  assetValueMode: 'manual',
  targetPct: 10,
  recordDate: todayIso(),
  isSimulation: false,
  notes: '',
};

/** Contoh baris spreadsheet pengguna. */
export const HRTA_EXAMPLE: FormState = {
  symbol: 'HRTA',
  assetName: 'Emas HRTA (Hartadinata)',
  buyPrice: 2_455_000,
  sellPrice: 2_375_000,
  initialCapital: 2_100_000,
  currentAssetValue: 2_072_900,
  units: null,
  assetValueMode: 'manual',
  targetPct: 10,
  recordDate: '2026-11-09',
  isSimulation: true,
  notes: '',
};

export function toCalculationInput(f: FormState): CalculationInput {
  return {
    buyPrice: f.buyPrice ?? NaN,
    sellPrice: f.sellPrice ?? NaN,
    initialCapital: f.initialCapital ?? NaN,
    currentAssetValue: f.assetValueMode === 'manual' ? (f.currentAssetValue ?? NaN) : null,
    units: f.assetValueMode === 'auto' ? f.units : null,
    targetPct: f.targetPct ?? NaN,
    assetValueMode: f.assetValueMode,
  };
}

export function toRecordInput(f: FormState): PortfolioRecordInput {
  return {
    ...toCalculationInput(f),
    symbol: f.symbol.trim().toUpperCase(),
    assetName: f.assetName.trim() || f.symbol.trim().toUpperCase(),
    recordDate: f.recordDate,
    isSimulation: f.isSimulation,
    notes: f.notes.trim() || null,
  };
}

export function recordToForm(r: PortfolioRecord): FormState {
  return {
    symbol: r.symbol,
    assetName: r.assetName,
    buyPrice: r.buyPrice,
    sellPrice: r.sellPrice,
    initialCapital: r.initialCapital,
    currentAssetValue: r.currentAssetValue,
    units: r.units,
    assetValueMode: r.assetValueMode,
    targetPct: r.targetPct,
    recordDate: r.recordDate,
    isSimulation: r.isSimulation,
    notes: r.notes ?? '',
  };
}

