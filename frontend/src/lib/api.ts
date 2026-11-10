import type {
  AiInsightRequest,
  AiInsightResponse,
  CalculationInput,
  CalculationResult,
  ForecastResult,
  HealthStatus,
  PortfolioRecord,
  PortfolioRecordInput,
  PricePoint,
  StockListItem,
  StockQuote,
} from '@portocalc/shared';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    });
  } catch {
    throw new ApiError(0, 'Tidak dapat terhubung ke server backend. Pastikan backend berjalan di port 4000.');
  }
  if (res.status === 204) return undefined as T;
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const details = Array.isArray(body.details)
      ? body.details.map((d: { message?: string } | string) => (typeof d === 'string' ? d : d.message)).join(' ')
      : '';
    throw new ApiError(res.status, [body.error ?? `HTTP ${res.status}`, details].filter(Boolean).join(' '), body.details);
  }
  return body as T;
}

const post = <T>(path: string, data: unknown) => request<T>(path, { method: 'POST', body: JSON.stringify(data) });

export type RecordFilter = 'all' | 'actual' | 'simulation';

export interface ForecastRequest {
  currentAssetValue: number;
  initialCapital: number;
  targetPct: number;
  months: number;
  monthlyContribution: number;
  method: 'historical' | 'assumption';
  annualReturnPct?: number;
  annualVolatilityPct?: number;
  symbol?: string;
  historyRange: '1m' | '3m' | '6m' | '1y';
}

export const api = {
  health: () => request<HealthStatus>('/health'),

  stockList: () => request<StockListItem[]>('/stocks/list'),
  searchStocks: (q: string) => request<StockListItem[]>(`/stocks/search?q=${encodeURIComponent(q)}`),
  quote: (symbol: string) => request<StockQuote>(`/stocks/quote/${encodeURIComponent(symbol)}`),
  history: (symbol: string, range = '3m') =>
    request<PricePoint[]>(`/stocks/history/${encodeURIComponent(symbol)}?range=${range}`),

  calculate: (input: CalculationInput) => post<{ result: CalculationResult }>('/portfolio/calculate', input),
  listRecords: (filter: RecordFilter = 'all') => request<PortfolioRecord[]>(`/portfolio?type=${filter}`),
  createRecord: (input: PortfolioRecordInput) => post<PortfolioRecord>('/portfolio', input),
  updateRecord: (id: string, input: PortfolioRecordInput) =>
    request<PortfolioRecord>(`/portfolio/${id}`, { method: 'PUT', body: JSON.stringify(input) }),
  deleteRecord: (id: string) => request<void>(`/portfolio/${id}`, { method: 'DELETE' }),
  exportCsvUrl: (filter: RecordFilter = 'all') => `/api/portfolio/export.csv?type=${filter}`,

  forecast: (req: ForecastRequest, signal?: AbortSignal) =>
    request<ForecastResult & { notice?: string }>('/portfolio/forecast', {
      method: 'POST',
      body: JSON.stringify(req),
      signal,
    }),

  aiInsight: (req: AiInsightRequest) => post<AiInsightResponse>('/ai/insight', req),
};

