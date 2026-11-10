import { Activity, Database, Sparkles } from 'lucide-react';
import type { HealthStatus } from '@portocalc/shared';

export function Header({ health, error }: { health: HealthStatus | null; error: string | null }) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/85 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <img src="/favicon.svg" alt="" className="h-9 w-9" />
          <div>
            <h1 className="text-lg leading-tight font-bold text-slate-900">NgeTarget Saham</h1>
            <p className="text-xs text-slate-500">Kalkulasi, simulasi &amp; forecasting portofolio</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
          {error ? (
            <StatusPill ok={false} icon={<Activity size={14} />} label="Backend tidak terhubung" />
          ) : (
            <>
              <StatusPill ok={health?.database ?? null} icon={<Database size={14} />} label="SQLite" />
              <StatusPill
                ok={health ? health.geminiConfigured : null}
                warn
                icon={<Sparkles size={14} />}
                label={health?.geminiConfigured ? `Gemini · ${health.geminiModel}` : 'Gemini belum diatur (rule-based)'}
              />
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function StatusPill({
  ok,
  warn,
  icon,
  label,
}: {
  ok: boolean | null;
  warn?: boolean;
  icon: React.ReactNode;
  label: string;
}) {
  const cls =
    ok == null
      ? 'bg-slate-100 text-slate-500'
      : ok
        ? 'bg-emerald-50 text-emerald-700'
        : warn
          ? 'bg-amber-50 text-amber-700'
          : 'bg-rose-50 text-rose-700';
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 ${cls}`}>
      {icon}
      {label}
    </span>
  );
}

