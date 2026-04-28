import { useState } from 'react';
import { ArrowRight, Truck } from 'lucide-react';
import type { SkuStatusAtDc, SkuStatus } from '../../data/dcOps';
import { fmtCs, cn } from '../../lib/utils';

const SORTS = [
  { key: 'risk',     label: 'Risk' },
  { key: 'doh',      label: 'Days on hand' },
  { key: 'category', label: 'Category' },
  { key: 'name',     label: 'Name' },
] as const;

type SortKey = typeof SORTS[number]['key'];

const STATUS_RANK: Record<SkuStatus, number> = {
  critical: 0, at_risk: 1, on_track: 2, healthy: 3,
};

interface Props {
  statuses: SkuStatusAtDc[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
}

export default function SkuStatusCards({ statuses, selectedId, onSelect }: Props) {
  const [sort, setSort] = useState<SortKey>('risk');

  const sorted = statuses.slice().sort((a, b) => {
    switch (sort) {
      case 'risk':     return STATUS_RANK[a.status] - STATUS_RANK[b.status] || a.dohNow - b.dohNow;
      case 'doh':      return a.dohNow - b.dohNow;
      case 'category': return a.sku.category.localeCompare(b.sku.category) || a.sku.name.localeCompare(b.sku.name);
      case 'name':     return a.sku.name.localeCompare(b.sku.name);
    }
  });

  return (
    <section>
      <div className="flex items-end justify-between mb-3">
        <div>
          <h2 className="text-lg font-semibold text-ink-900">Are you OK right now?</h2>
          <p className="text-xs text-ink-500 mt-0.5">
            All {statuses.length} pilot SKUs at this DC, ranked by {sortDescription(sort)}.
          </p>
        </div>
        <div className="inline-flex p-0.5 rounded-lg bg-ink-100 text-xs font-medium">
          {SORTS.map((s) => (
            <button
              key={s.key}
              onClick={() => setSort(s.key)}
              className={cn(
                'px-2.5 py-1 rounded-md transition',
                sort === s.key ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500 hover:text-ink-700',
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
        {sorted.map((s) => (
          <SkuCard
            key={s.skuId}
            s={s}
            isSelected={selectedId === s.skuId}
            onClick={() => onSelect?.(s.skuId)}
          />
        ))}
      </div>
    </section>
  );
}

function sortDescription(s: SortKey): string {
  return s === 'risk' ? 'risk (worst first)'
    : s === 'doh' ? 'days on hand (lowest first)'
    : s === 'category' ? 'category'
    : 'name';
}

function SkuCard({
  s, isSelected, onClick,
}: {
  s: SkuStatusAtDc;
  isSelected: boolean;
  onClick: () => void;
}) {
  const meta = STATUS_META[s.status];
  // DOH gauge: clip at 28d for the bar; tick marks at 7/14/21/28
  const pct = Math.min(100, (Math.max(0, s.dohNow) / 28) * 100);
  const arrival = s.nextArrival;

  return (
    <button
      onClick={onClick}
      className={cn(
        'card p-4 text-left hover:-translate-y-0.5 hover:shadow-soft transition relative overflow-hidden',
        isSelected && 'ring-2 ring-cocoa-500',
      )}
    >
      {/* Status accent bar */}
      <div className={cn('absolute inset-x-0 top-0 h-1', meta.barClass)} />

      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0">
          <div className="text-2xl leading-none mb-1">{s.sku.emoji}</div>
          <div className="text-sm font-semibold text-ink-900 leading-tight truncate">{s.sku.name}</div>
          <div className="text-[10px] text-ink-400 mt-0.5">{s.sku.code}</div>
        </div>
        <span className={cn('pill text-[10px] font-semibold uppercase border', meta.pillClass)}>
          {meta.label}
        </span>
      </div>

      {/* DOH gauge */}
      <div className="mt-3 mb-1.5">
        <div className="flex items-end justify-between mb-1">
          <span className="num text-2xl font-semibold tracking-tight">{s.dohNow}<span className="text-base font-normal text-ink-500">d</span></span>
          <span className="text-[11px] text-ink-500">days on hand</span>
        </div>
        <div className="relative h-2 rounded-full bg-ink-100 overflow-hidden">
          <div className={cn('h-full transition-all', meta.gaugeClass)} style={{ width: `${pct}%` }} />
        </div>
        <div className="flex justify-between mt-1 px-0.5 text-[9px] text-ink-300 num">
          <span>0</span><span>7</span><span>14</span><span>21</span><span>28+</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-ink-100">
        <div>
          <div className="text-[10px] text-ink-400 uppercase tracking-wider">On hand</div>
          <div className="num text-sm font-semibold text-ink-900">{fmtCs(s.casesNow)}<span className="text-[10px] font-normal text-ink-400 ml-1">cs</span></div>
        </div>
        <div>
          <div className="text-[10px] text-ink-400 uppercase tracking-wider">Burn rate</div>
          <div className="num text-sm font-semibold text-ink-900">{fmtCs(s.burnRate)}<span className="text-[10px] font-normal text-ink-400 ml-1">/wk</span></div>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-ink-100">
        {arrival ? (
          <div className="flex items-center gap-2 text-[11px]">
            <span className="size-6 rounded-md bg-cocoa-100 text-cocoa-700 grid place-items-center shrink-0">
              <Truck className="size-3.5" />
            </span>
            <div className="flex-1 min-w-0 leading-tight">
              <div className="text-ink-700">
                <b className="text-ink-900">{fmtCs(arrival.cases)}</b> cs in <b>{arrivalLabel(arrival.weekIndex)}</b>
              </div>
              <div className="text-[10px] text-ink-400">next inbound</div>
            </div>
            <ArrowRight className="size-3.5 text-ink-300" />
          </div>
        ) : (
          <div className="flex items-center gap-2 text-[11px] text-ink-400">
            <span className="size-6 rounded-md bg-ink-100 grid place-items-center shrink-0">
              <Truck className="size-3.5" />
            </span>
            <span>No inbound in 12-week horizon</span>
          </div>
        )}
      </div>

      {s.oosWeek != null && (
        <div className="mt-2 text-[11px] text-rose-600 font-medium">
          Projected OOS: week +{s.oosWeek}
        </div>
      )}
    </button>
  );
}

function arrivalLabel(week: number): string {
  return week === 0 ? 'this week' : week === 1 ? '1 week' : `${week} weeks`;
}

const STATUS_META: Record<SkuStatus, {
  label: string;
  pillClass: string;
  barClass: string;
  gaugeClass: string;
}> = {
  healthy:  { label: 'Healthy',  pillClass: 'bg-emerald-50 text-emerald-700 border-emerald-200', barClass: 'bg-emerald-500',  gaugeClass: 'bg-emerald-500' },
  on_track: { label: 'On track', pillClass: 'bg-lime-50    text-lime-700    border-lime-200',    barClass: 'bg-lime-500',     gaugeClass: 'bg-lime-500' },
  at_risk:  { label: 'At risk',  pillClass: 'bg-amber-50   text-amber-800   border-amber-200',   barClass: 'bg-amber-500',    gaugeClass: 'bg-amber-500' },
  critical: { label: 'Critical', pillClass: 'bg-rose-50    text-rose-700    border-rose-200',    barClass: 'bg-rose-500',     gaugeClass: 'bg-rose-500' },
};
