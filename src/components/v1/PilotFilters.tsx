import { Calendar, ChevronDown, Filter, GitCompare } from 'lucide-react';
import { DCS } from '../../data/dcs';
import { SKUS } from '../../data/skus';
import type { DC, SKU } from '../../types';
import { cn } from '../../lib/utils';

interface Props {
  sku: SKU;
  dc: DC;
  setSkuId: (id: string) => void;
  setDcId: (id: string) => void;
  snapshotLabel: string;
  compareLastWeek: boolean;
  setCompareLastWeek: (b: boolean) => void;
}

export default function PilotFilters({
  sku, dc, setSkuId, setDcId, snapshotLabel, compareLastWeek, setCompareLastWeek,
}: Props) {
  return (
    <div className="card p-4 flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2 text-xs text-ink-400 uppercase tracking-wider mr-1">
        <Filter className="size-3.5" /> Drill into
      </div>

      <FilterSelect
        label="SKU"
        value={sku.id}
        onChange={setSkuId}
        options={SKUS.map((s) => ({ value: s.id, label: `${s.emoji} ${s.name}`, sub: s.code }))}
      />
      <FilterSelect
        label="Distribution center"
        value={dc.id}
        onChange={setDcId}
        options={DCS.map((d) => ({ value: d.id, label: d.code, sub: `${d.city}, ${d.state}` }))}
      />
      <div className="ml-auto flex items-center gap-2">
        <button className="btn">
          <Calendar className="size-4" /> Snapshot · {snapshotLabel}
          <ChevronDown className="size-3.5" />
        </button>
        <button
          onClick={() => setCompareLastWeek(!compareLastWeek)}
          className={cn(
            'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition',
            compareLastWeek
              ? 'bg-cocoa-700 text-white border-cocoa-700 hover:bg-cocoa-800'
              : 'bg-white text-ink-700 border-ink-200 hover:bg-ink-50',
          )}
        >
          <GitCompare className="size-4" />
          {compareLastWeek ? 'Comparing to last week' : 'Compare to last week'}
        </button>
      </div>
    </div>
  );
}

function FilterSelect<T extends string>({
  label, value, onChange, options,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; sub?: string }[];
}) {
  return (
    <label className="flex items-center gap-2 px-3 h-9 rounded-lg border border-ink-200 bg-white hover:border-ink-300 transition">
      <span className="text-[10px] font-semibold text-ink-400 uppercase tracking-wider">{label}</span>
      <span className="h-4 w-px bg-ink-200" />
      <select
        className="bg-transparent text-sm font-medium text-ink-900 outline-none pr-2 max-w-[200px] truncate"
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}{o.sub ? ` — ${o.sub}` : ''}
          </option>
        ))}
      </select>
    </label>
  );
}
