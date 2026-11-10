import { useState } from 'react';
import { AlertTriangle, Bot, Lightbulb, Loader2, RefreshCw, ShieldAlert, Sparkles, Target, TrendingDown } from 'lucide-react';
import type { AiInsightRequest, AiInsightResponse, RiskLevel } from '@portocalc/shared';
import { api } from '../lib/api';
import { Badge, SectionTitle } from './ui';

interface Props {
  /** Payload yang siap dikirim; null bila input belum lengkap. */
  request: AiInsightRequest | null;
}

const RISK: Record<RiskLevel, { tone: 'green' | 'amber' | 'red'; label: string }> = {
  rendah: { tone: 'green', label: 'Risiko rendah' },
  sedang: { tone: 'amber', label: 'Risiko sedang' },
  tinggi: { tone: 'red', label: 'Risiko tinggi' },
};

/** Panel saran & insight dari Gemini AI (fallback rule-based bila API key belum diatur). */
export function AiInsightCard({ request }: Props) {
  const [data, setData] = useState<AiInsightResponse | null>(null);
  const [requestKey, setRequestKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentKey = request ? keyOf(request) : null;
  const stale = data != null && currentKey !== requestKey;

  const run = async (force = false) => {
    if (!request) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.aiInsight({ ...request, force });
      setData(res);
      setRequestKey(keyOf(request));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="card flex flex-col">
      <SectionTitle
        icon={<Sparkles size={18} />}
        title="Insight & Saran AI"
        subtitle="Analisis posisi, spread, dan strategi menuju target"
        action={
          data && (
            <Badge tone={data.source === 'gemini' ? 'indigo' : 'slate'}>
              <Bot size={12} />
              {data.source === 'gemini' ? `Gemini${data.cached ? ' · cache' : ''}` : 'Rule-based'}
            </Badge>
          )
        }
      />
      <div className="flex flex-1 flex-col gap-4 p-5">
        {!data && !loading && (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-xl bg-gradient-to-br from-indigo-50 to-sky-50 px-6 py-10 text-center">
            <div className="rounded-full bg-white p-3 text-indigo-600 shadow-sm">
              <Sparkles size={24} />
            </div>
            <p className="max-w-xs text-sm text-slate-600">
              Dapatkan diagnosis posisi, analisis spread %Rugi, dan saran strategi berdasarkan kalkulasi & proyeksi Anda.
            </p>
            <button type="button" className="btn-primary" disabled={!request} onClick={() => run(false)}>
              <Sparkles size={16} /> Minta Saran AI
            </button>
            {!request && <p className="text-xs text-slate-500">Lengkapi kalkulator terlebih dahulu.</p>}
          </div>
        )}

        {loading && (
          <div className="flex flex-1 flex-col gap-3" aria-busy="true">
            <div className="flex items-center gap-2 text-sm text-indigo-600">
              <Loader2 size={16} className="animate-spin" /> Menganalisis portofolio…
            </div>
            {[80, 95, 70, 90, 60].map((w, i) => (
              <div key={i} className="h-3 animate-pulse rounded bg-slate-100" style={{ width: `${w}%` }} />
            ))}
          </div>
        )}

        {error && !loading && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>
        )}

        {data && !loading && (
          <>
            {data.notice && (
              <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                <span>{data.notice}</span>
              </div>
            )}
            {stale && (
              <div className="flex items-center justify-between gap-2 rounded-lg bg-sky-50 px-3 py-2 text-xs text-sky-800">
                <span>Data kalkulasi berubah sejak analisis ini dibuat.</span>
                <button type="button" className="font-semibold underline" onClick={() => run(false)}>
                  Analisis ulang
                </button>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Badge tone={RISK[data.insight.riskLevel].tone}>
                <ShieldAlert size={12} /> {RISK[data.insight.riskLevel].label}
              </Badge>
            </div>

            <Block icon={<Bot size={16} />} title="Ringkasan Posisi" text={data.insight.summary} />
            <Block icon={<TrendingDown size={16} />} title="Analisis Spread (%Rugi)" text={data.insight.spreadAnalysis} />
            <Block icon={<Target size={16} />} title="Strategi Menuju Target" text={data.insight.targetStrategy} />

            <div>
              <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-800">
                <Lightbulb size={16} className="text-amber-500" /> Saran Tindakan
              </h3>
              <ol className="space-y-2">
                {data.insight.recommendations.map((r, i) => (
                  <li key={i} className="flex gap-3 rounded-lg border border-slate-200 p-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
                      {i + 1}
                    </span>
                    <div>
                      <div className="text-sm font-semibold text-slate-800">{r.title}</div>
                      <p className="text-sm text-slate-600">{r.detail}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <p className="text-[11px] leading-relaxed text-slate-400">{data.insight.disclaimer}</p>

            <div className="mt-auto flex justify-end">
              <button type="button" className="btn-secondary text-xs" disabled={!request} onClick={() => run(true)}>
                <RefreshCw size={14} /> Buat ulang analisis
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

function Block({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  if (!text) return null;
  return (
    <div>
      <h3 className="mb-1 flex items-center gap-2 text-sm font-semibold text-slate-800">
        <span className="text-indigo-500">{icon}</span>
        {title}
      </h3>
      <p className="text-sm leading-relaxed text-slate-600">{text}</p>
    </div>
  );
}

function keyOf(req: AiInsightRequest): string {
  const { force: _f, ...rest } = req;
  return JSON.stringify(rest);
}

