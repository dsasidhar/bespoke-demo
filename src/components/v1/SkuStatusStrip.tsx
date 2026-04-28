import { useState } from 'react';
import { ArrowRight, Truck } from 'lucide-react';
import type { SkuStatusAtDc, SkuStatus } from '../../data/dcOps';
import { fmtCs, cn } from '../../lib/utils';

const SORTS = [
  { key: 'risk',     label: 'Risk' },
  { key: 'doh',      label: 'DOH' },
  { key: 'name',     label: 'Name' },
] as const;
type SortKey = typeof SORTS[number]['key'];

const STATUS_RANK: Record<SkuStatus, number> = {
  critical: 0, at_risk: 1, on_track: 2, healthy: 3,
};

interface Props {
  statuses: SkuStatusAtDc[];
  selectedId: string;
  onSelect: (id: string) => void;
}

export default function SkuStatusStrip({ statuses, selectedId, onSelect }: Props) {
  const [sort, setSort] = useState<SortKey>('risk');
  const sorted = statuses.slice().sort((a, b) => {
    switch (sort) {
      case 'risk':     return STATUS_RANK[a.status] - STATUS_RANK[b.status] || a.dohNow - b.dohNow;
      case 'doh':      return a.dohNow - b.dohNow;
      case 'name':     return a.sku.name.localeCompare(b.sku.name);
    }
  });

  return (
    <div className="card p-4 lg:p-5 h-[440px] flex flex-col">
      <div className="flex items-end justify-between mb-3 shrink-0">
        <div>
          <h3 className="text-sm font-semibold text-ink-900">SKU status — at selected DC</h3>
          <p className="text-[11px] text-ink-500 mt-0.5">
            All 8 Better Goods SKUs · click to drill in
          </p>
        </div>
        <div className="inline-flex p-0.5 rounded-lg bg-ink-100 text-[11px] font-medium">
          {SORTS.map((s) => (
            <button
              key={s.key}
              onClick={() => setSort(s.key)}
              className={cn(
                'px-2 py-0.5 rounded-md transition',
                sort === s.key ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500 hover:text-ink-700',
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <ul className="space-y-1.5 flex-1 overflow-y-auto pr-1 -mr-1">
        {sorted.map((s) => (
          <SkuRow
            key={s.skuId}
            s={s}
            isSelected={selectedId === s.skuId}
            onClick={() => onSelect(s.skuId)}
          />
        ))}
      </ul>
    </div>
  );
}

const STATUS_META: Record<SkuStatus, {
  label: string;
  pill: string;
  bar: string;
  bg: string;
}> = {
  healthy:  { label: 'Healthy',  pill: 'bg-emerald-50 text-emerald-700 border-emerald-200', bar: 'bg-emerald-500', bg: 'border-emerald-200' },
  on_track: { label: 'On track', pill: 'bg-lime-50    text-lime-700    border-lime-200',    bar: 'bg-lime-500',    bg: 'border-lime-200' },
  at_risk:  { label: 'At risk',  pill: 'bg-amber-50   text-amber-800   border-amber-200',   bar: 'bg-amber-500',   bg: 'border-amber-200' },
  critical: { label: 'Critical', pill: 'bg-rose-50    text-rose-700    border-rose-200',    bar: 'bg-rose-500',    bg: 'border-rose-200' },
};

function SkuRow({ s, isSelected, onClick }: { s: SkuStatusAtDc; isSelected: boolean; onClick: () => void }) {
  const meta = STATUS_META[s.status];
  const pct = Math.min(100, (Math.max(0, s.dohNow) / 28) * 100);
  return (
    <li>
      <button
        onClick={onClick}
        className={cn(
          'w-full text-left rounded-lg p-2.5 border transition flex items-center gap-3 hover:shadow-sm',
          isSelected
            ? 'border-cocoa-500 bg-cocoa-50 ring-1 ring-cocoa-300'
            : `${meta.bg} bg-white hover:border-cocoa-300`,
        )}
      >
        <div className="text-2xl leading-none shrink-0">{s.sku.emoji}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-ink-900 truncate">{s.sku.name}</span>
            <span className={cn('pill border text-[10px]', meta.pill)}>{meta.label}</span>
          </div>
          <div className="mt-1 flex items-center gap-2">
            <div className="flex-1 h-1.5 rounded-full bg-ink-100 overflow-hidden">
              <div className={cn('h-full', meta.bar)} style={{ width: `${pct}%` }} />
            </div>
            <span className="num text-[11px] text-ink-700 font-semibold w-12 text-right">{s.dohNow}d</span>
          </div>
          <div className="flex items-center justify-between mt-1 text-[10px] text-ink-500">
            <span>{fmtCs(s.casesNow)} cs · burn {fmtCs(s.burnRate)}/wk</span>
            {s.nextArrival ? (
              <span className="flex items-center gap-1 text-ink-600">
                <Truck className="size-3" />
                +{fmtCs(s.nextArrival.cases)} in {s.nextArrival.weekIndex === 0 ? 'this wk' : `${s.nextArrival.weekIndex}w`}
              </span>
            ) : (
              <span className="text-rose-600">no inbound</span>
            )}
          </div>
        </div>
        <ArrowRight className="size-4 text-ink-300 shrink-0" />
      </button>
    </li>
  );
}
