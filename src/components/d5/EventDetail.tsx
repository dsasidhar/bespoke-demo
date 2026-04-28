import { Sparkles, AlertTriangle, BadgeAlert, MailPlus } from 'lucide-react';
import type { EventReadiness, SkuStatus } from '../../data/dcOps';
import { fmtCs, fmtDollars, cn } from '../../lib/utils';

interface Props { r: EventReadiness; }

const STATUS_BAR: Record<SkuStatus, string> = {
  healthy:  'bg-emerald-200',
  on_track: 'bg-lime-200',
  at_risk:  'bg-amber-300',
  critical: 'bg-rose-300',
};

const STATUS_FILL: Record<SkuStatus, string> = {
  healthy:  'bg-emerald-500',
  on_track: 'bg-lime-500',
  at_risk:  'bg-amber-500',
  critical: 'bg-rose-500',
};

const STATUS_PILL: Record<SkuStatus, string> = {
  healthy:  'bg-emerald-50 text-emerald-700 border-emerald-200',
  on_track: 'bg-lime-50    text-lime-700    border-lime-200',
  at_risk:  'bg-amber-50   text-amber-800   border-amber-200',
  critical: 'bg-rose-50    text-rose-700    border-rose-200',
};

export default function EventDetail({ r }: Props) {
  const ev = r.event;
  const dt = new Date(ev.date + 'T00:00:00Z').toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC',
  });

  // Sort: critical first, then biggest gap
  const STATUS_RANK: Record<SkuStatus, number> = { critical: 0, at_risk: 1, on_track: 2, healthy: 3 };
  const sorted = r.perSku.slice().sort(
    (a, b) => STATUS_RANK[a.status] - STATUS_RANK[b.status] || b.gap - a.gap,
  );

  const totalRequired = r.perSku.reduce((s, p) => s + p.required, 0);
  const totalGap = r.perSku.reduce((s, p) => s + p.gap, 0);

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
        <div className="flex items-start gap-3">
          <div className="size-12 rounded-xl bg-cocoa-100 grid place-items-center text-2xl shrink-0">
            {ev.emoji}
          </div>
          <div>
            <div className="text-xs text-ink-500">{dt} · +{ev.weekIndex} weeks · decide by week +{r.decisionWeek}</div>
            <h3 className="text-xl font-semibold tracking-tight">{ev.name} · readiness check</h3>
            <p className="text-sm text-ink-500 mt-1 max-w-2xl">{ev.longDescription}</p>
          </div>
        </div>
        <span className={cn('pill border font-semibold', STATUS_PILL[r.overall])}>
          {r.overall === 'healthy' ? 'Ready' : r.overall === 'on_track' ? 'Tight' : r.overall === 'at_risk' ? 'At risk' : 'Critical'}
        </span>
      </div>

      {/* Lift summary */}
      <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        <Mini
          label="Total cases needed"
          value={fmtCs(totalRequired) + ' cs'}
          sub={`across ${r.perSku.length} SKUs · ${dt} window`}
          icon={<Sparkles className="size-4" />}
          accent="cocoa"
        />
        <Mini
          label="Total gap"
          value={totalGap === 0 ? 'None' : fmtCs(totalGap) + ' cs short'}
          sub={totalGap === 0 ? 'You are covered for this event' : `${r.perSku.filter((p) => p.gap > 0).length} SKUs need attention`}
          icon={<AlertTriangle className="size-4" />}
          accent={totalGap === 0 ? 'emerald' : 'amber'}
        />
        <Mini
          label="$ exposure if unaddressed"
          value={fmtDollars(r.exposureUsd)}
          sub="lost retail sales · 2-week event window"
          icon={<BadgeAlert className="size-4" />}
          accent={r.exposureUsd > 50000 ? 'rose' : r.exposureUsd > 0 ? 'amber' : 'emerald'}
        />
      </div>

      {/* SKU readiness rows */}
      <div className="space-y-1.5">
        {sorted.map((p) => {
          const ratio = Math.min(1, p.projected / Math.max(1, p.required));
          const pct = Math.round(ratio * 100);
          return (
            <div key={p.sku.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-ink-50 transition">
              <div className="text-xl shrink-0">{p.sku.emoji}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-medium text-ink-900 truncate">{p.sku.name}</span>
                  {p.lift > 1 && (
                    <span className="text-[10px] text-cocoa-700 font-semibold">×{p.lift.toFixed(1)} lift</span>
                  )}
                  <span className={cn('ml-auto pill border text-[10px]', STATUS_PILL[p.status])}>
                    {p.status === 'healthy' ? 'Ready' : p.status === 'on_track' ? 'Tight' : p.status === 'at_risk' ? 'At risk' : 'Critical'}
                  </span>
                </div>
                <div className={cn('relative h-2 rounded-full overflow-hidden', STATUS_BAR[p.status])}>
                  <div className={cn('h-full', STATUS_FILL[p.status])} style={{ width: `${pct}%` }} />
                </div>
                <div className="flex items-center justify-between mt-1 text-[11px]">
                  <span className="text-ink-500">
                    Projected <b className="text-ink-700 num">{fmtCs(p.projected)}</b> cs
                    <span className="text-ink-400 mx-1">/</span>
                    <span>required <b className="text-ink-700 num">{fmtCs(p.required)}</b> cs</span>
                  </span>
                  <span className={cn(
                    'num font-semibold',
                    p.gap > 0 ? 'text-rose-700' : 'text-emerald-700',
                  )}>
                    {p.gap > 0 ? `−${fmtCs(p.gap)} cs short` : `+${fmtCs(p.projected - p.required)} cs cushion`}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {totalGap > 0 && (
        <div className="mt-4 pt-4 border-t border-ink-100 flex items-center gap-2 flex-wrap">
          <button className="btn-primary">
            <MailPlus className="size-4" />
            Notify Bespoke — close gap by wk +{r.decisionWeek}
          </button>
          <button className="btn">Reallocate from another DC</button>
          <span className="text-[11px] text-ink-400 ml-auto">
            Notification draft will pre-fill the SKUs and quantities listed above.
          </span>
        </div>
      )}
    </div>
  );
}

function Mini({
  label, value, sub, icon, accent,
}: {
  label: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
  accent: 'cocoa' | 'emerald' | 'amber' | 'rose';
}) {
  const accentBg = {
    cocoa: 'bg-cocoa-100 text-cocoa-700',
    emerald: 'bg-emerald-100 text-emerald-700',
    amber: 'bg-amber-100 text-amber-800',
    rose: 'bg-rose-100 text-rose-700',
  }[accent];
  return (
    <div className="rounded-lg bg-ink-50 border border-ink-100 p-3">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11px] text-ink-500">{label}</span>
        <span className={cn('size-6 rounded-md grid place-items-center', accentBg)}>{icon}</span>
      </div>
      <div className="text-lg font-semibold tracking-tight num">{value}</div>
      <div className="text-[11px] text-ink-500 mt-0.5">{sub}</div>
    </div>
  );
}
