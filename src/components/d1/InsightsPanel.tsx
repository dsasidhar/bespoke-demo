import { Sparkles, AlertOctagon, AlertTriangle, Info, CheckCircle2, ArrowUpRight } from 'lucide-react';
import { INSIGHTS } from '../../data/insights';
import { SKU_BY_ID } from '../../data/skus';
import { DC_BY_ID } from '../../data/dcs';
import { cn } from '../../lib/utils';
import type { Insight } from '../../types';

const ICON: Record<Insight['severity'], React.ReactNode> = {
  critical: <AlertOctagon className="size-5" />,
  warning:  <AlertTriangle className="size-5" />,
  info:     <Info className="size-5" />,
  positive: <CheckCircle2 className="size-5" />,
};

const STYLE: Record<Insight['severity'], { bg: string; border: string; text: string; pill: string }> = {
  critical: { bg: 'bg-rose-50',    border: 'border-rose-200',    text: 'text-rose-700',    pill: 'bg-rose-100 text-rose-800' },
  warning:  { bg: 'bg-amber-50',   border: 'border-amber-200',   text: 'text-amber-700',   pill: 'bg-amber-100 text-amber-800' },
  info:     { bg: 'bg-ink-50',     border: 'border-ink-200',     text: 'text-ink-700',     pill: 'bg-ink-100 text-ink-700' },
  positive: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', pill: 'bg-emerald-100 text-emerald-800' },
};

export default function InsightsPanel() {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between mb-4 gap-4 flex-wrap">
        <div>
          <h3 className="text-base font-semibold text-ink-900 flex items-center gap-2">
            <span className="grid place-items-center size-7 rounded-md bg-gradient-to-br from-amber-400 to-cocoa-500 text-white">
              <Sparkles className="size-4" />
            </span>
            What changed this week
          </h3>
          <p className="text-xs text-ink-500 mt-1">
            5 signals worth your attention · auto-generated from snapshot diff and lead-time variance
          </p>
        </div>
        <div className="flex items-center gap-2 text-[11px]">
          <span className="pill bg-ink-50 border border-ink-200 text-ink-600">vs. last week</span>
          <span className="pill bg-ink-50 border border-ink-200 text-ink-600">last 30 days</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {INSIGHTS.map((it) => {
          const s = STYLE[it.severity];
          const sku = it.skuId ? SKU_BY_ID[it.skuId] : null;
          const dc = it.dcId ? DC_BY_ID[it.dcId] : null;
          return (
            <div
              key={it.id}
              className={cn('rounded-xl border p-4 hover:shadow-soft transition group', s.bg, s.border)}
            >
              <div className="flex items-start gap-3">
                <div className={cn('mt-0.5', s.text)}>{ICON[it.severity]}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className={cn('pill', s.pill)}>{it.severity}</span>
                    {sku && <span className="pill bg-white/80 text-ink-700 border border-ink-200">{sku.emoji} {sku.name}</span>}
                    {dc && <span className="pill bg-white/80 text-ink-700 border border-ink-200">{dc.code} · {dc.city}</span>}
                  </div>
                  <h4 className="font-semibold text-ink-900 mt-1 leading-snug">{it.title}</h4>
                  <p className="text-sm text-ink-600 mt-1.5 leading-relaxed">{it.body}</p>
                  {it.metric && (
                    <div className="mt-3 flex items-center gap-3 text-[11px] text-ink-500">
                      <span><b className="text-ink-700">{it.metric}</b> {it.delta}</span>
                      <button className="ml-auto inline-flex items-center gap-1 text-ink-700 hover:text-ink-900 font-medium">
                        Investigate <ArrowUpRight className="size-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
