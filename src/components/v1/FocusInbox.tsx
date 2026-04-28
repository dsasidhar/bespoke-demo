import { Inbox, ArrowUpRight, AlertOctagon, AlertTriangle, Info, CheckCircle2, MailPlus } from 'lucide-react';
import { INSIGHTS } from '../../data/insights';
import { SKU_BY_ID } from '../../data/skus';
import { DC_BY_ID } from '../../data/dcs';
import { cn } from '../../lib/utils';
import type { Insight } from '../../types';

const ICON: Record<Insight['severity'], React.ReactNode> = {
  critical: <AlertOctagon className="size-4" />,
  warning:  <AlertTriangle className="size-4" />,
  info:     <Info className="size-4" />,
  positive: <CheckCircle2 className="size-4" />,
};

const STYLE: Record<Insight['severity'], { bg: string; border: string; text: string; pill: string }> = {
  critical: { bg: 'bg-rose-50',    border: 'border-rose-200',    text: 'text-rose-700',    pill: 'bg-rose-100 text-rose-800' },
  warning:  { bg: 'bg-amber-50',   border: 'border-amber-200',   text: 'text-amber-700',   pill: 'bg-amber-100 text-amber-800' },
  info:     { bg: 'bg-ink-50',     border: 'border-ink-200',     text: 'text-ink-700',     pill: 'bg-ink-100 text-ink-700' },
  positive: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', pill: 'bg-emerald-100 text-emerald-800' },
};

const RANK: Record<Insight['severity'], number> = { critical: 0, warning: 1, info: 2, positive: 3 };

export default function FocusInbox() {
  const sorted = INSIGHTS.slice().sort((a, b) => RANK[a.severity] - RANK[b.severity]);
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-start gap-3">
          <div className="size-9 rounded-lg bg-ink-900 text-amber-400 grid place-items-center shrink-0">
            <Inbox className="size-4" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-ink-900">Focus inbox</h3>
            <p className="text-xs text-ink-500 mt-0.5">
              {INSIGHTS.length} attention items, ranked by urgency. Each has a one-click action.
              <span className="ml-1 text-ink-400 italic">Note: rule-based for v0 — we'll add AI ranking after Walmart sees value.</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-ink-500">
          <Counter color="bg-rose-500"    n={INSIGHTS.filter(i => i.severity === 'critical').length} label="critical" />
          <Counter color="bg-amber-500"   n={INSIGHTS.filter(i => i.severity === 'warning').length}  label="warning" />
          <Counter color="bg-ink-500"     n={INSIGHTS.filter(i => i.severity === 'info').length}     label="info" />
          <Counter color="bg-emerald-500" n={INSIGHTS.filter(i => i.severity === 'positive').length} label="good" />
        </div>
      </div>

      <ul className="space-y-2">
        {sorted.map((it) => {
          const s = STYLE[it.severity];
          const sku = it.skuId ? SKU_BY_ID[it.skuId] : null;
          const dc = it.dcId ? DC_BY_ID[it.dcId] : null;
          return (
            <li key={it.id} className={cn('rounded-xl border p-3.5 transition hover:shadow-sm group', s.bg, s.border)}>
              <div className="flex items-start gap-3">
                <div className={cn('mt-0.5', s.text)}>{ICON[it.severity]}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={cn('pill text-[10px]', s.pill)}>{it.severity}</span>
                    {sku && <span className="pill bg-white border border-ink-200 text-ink-700 text-[10px]">{sku.emoji} {sku.name}</span>}
                    {dc && <span className="pill bg-white border border-ink-200 text-ink-700 text-[10px]">{dc.code} · {dc.city}</span>}
                    {it.metric && <span className="pill bg-white border border-ink-200 text-ink-700 text-[10px]"><b className="mr-1">{it.metric}</b>{it.delta}</span>}
                  </div>
                  <h4 className="font-semibold text-ink-900 leading-snug">{it.title}</h4>
                  <p className="text-sm text-ink-700 mt-1 leading-relaxed">{it.body}</p>
                </div>
                <div className="flex flex-col gap-1.5 shrink-0">
                  <button className="btn-primary px-2.5 py-1 text-xs">
                    <MailPlus className="size-3.5" /> Notify Bespoke
                  </button>
                  <button className="btn px-2.5 py-1 text-xs">
                    Open <ArrowUpRight className="size-3" />
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Counter({ color, n, label }: { color: string; n: number; label: string }) {
  return (
    <div className="flex items-center gap-1">
      <span className={cn('size-2 rounded-full', color)} />
      <span className="num font-medium">{n}</span>
      <span>{label}</span>
    </div>
  );
}
