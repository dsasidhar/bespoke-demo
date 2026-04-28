import { useMemo, useState } from 'react';
import { buildAggregateGrid, buildRegionGrid, applyMcLaneOverride } from '../../data/aggregate';
import type { AggregateMetric } from '../../data/aggregate';
import { fmtCs, fmtDollars, cn } from '../../lib/utils';

const METRICS: { key: AggregateMetric; label: string; sub: string }[] = [
  { key: 'doh',           label: 'Days on hand',     sub: 'days of forward cover' },
  { key: 'cases',         label: 'Cases on hand',    sub: 'opening cases per period' },
  { key: 'sl',            label: 'Service level',    sub: 'expected % of demand met' },
  { key: 'lost',          label: 'Lost sales $',     sub: 'unmet demand × retail price' },
  { key: 'prob_below_95', label: 'P(SL < 95%)',      sub: 'risk SL drops below 95%' },
];

type Granularity = 'region' | 'dc' | 'store';

interface Props {
  skuId: string;
  skuName: string;
  /** Optional override that adds extra cases at McLane (from the simulator). */
  mclaneOverrideCases?: number;
}

export default function PilotHeatmap({ skuId, skuName, mclaneOverrideCases = 0 }: Props) {
  const [metric, setMetric] = useState<AggregateMetric>('doh');
  const [granularity, setGranularity] = useState<Granularity>('dc');

  const dcGrid = useMemo(() => buildAggregateGrid(skuId, metric), [skuId, metric]);
  const regionGrid = useMemo(() => buildRegionGrid(skuId, metric), [skuId, metric]);
  const adjustedDc = useMemo(
    () => mclaneOverrideCases > 0 ? applyMcLaneOverride(dcGrid, mclaneOverrideCases, metric) : dcGrid,
    [dcGrid, mclaneOverrideCases, metric],
  );

  const meta = METRICS.find((m) => m.key === metric)!;
  const fmt = (v: number): string => {
    switch (metric) {
      case 'doh':           return `${v}`;
      case 'cases':         return fmtCs(v);
      case 'sl':            return `${v}%`;
      case 'lost':          return fmtDollars(v);
      case 'prob_below_95': return `${v}%`;
    }
  };

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
        <div>
          <h3 className="text-base font-semibold text-ink-900">Network heatmap — {skuName}</h3>
          <p className="text-xs text-ink-500 mt-0.5">
            12-week horizon · {meta.sub}
            {mclaneOverrideCases > 0 && (
              <span className="ml-2 inline-flex items-center gap-1 text-cocoa-700 font-medium">
                · simulator: +{fmtCs(mclaneOverrideCases)} cs at McLane
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="inline-flex p-0.5 rounded-lg bg-ink-100 text-xs font-medium">
            {(['region', 'dc', 'store'] as Granularity[]).map((g) => (
              <button
                key={g}
                onClick={() => setGranularity(g)}
                disabled={g === 'store'}
                className={cn(
                  'px-2.5 py-1 rounded-md transition capitalize',
                  granularity === g ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500 hover:text-ink-700',
                  g === 'store' && 'opacity-40 cursor-not-allowed',
                )}
                title={g === 'store' ? 'Store-level rollup — coming in v1' : ''}
              >
                {g === 'region' ? '5 Regions' : g === 'dc' ? '12 DCs' : '4,000 Stores'}
              </button>
            ))}
          </div>
          <div className="inline-flex p-0.5 rounded-lg bg-ink-100 text-xs font-medium overflow-x-auto">
            {METRICS.map((m) => (
              <button
                key={m.key}
                onClick={() => setMetric(m.key)}
                className={cn(
                  'px-2.5 py-1 rounded-md font-medium transition whitespace-nowrap',
                  metric === m.key ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500 hover:text-ink-700',
                )}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {granularity === 'region'
        ? <RegionTable grid={regionGrid} fmt={fmt} />
        : <DcTable grid={adjustedDc} fmt={fmt} />}

      <div className="mt-4 flex items-center gap-3 text-[11px] text-ink-500">
        <span>Color scale:</span>
        {(['critical', 'bad', 'warn', 'ok', 'good'] as const).map((b) => (
          <div key={b} className="flex items-center gap-1.5">
            <span className={cn('size-3 rounded', BAND[b].split(' ')[0])} />
            <span className="capitalize">{b}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const BAND: Record<string, string> = {
  good: 'bg-emerald-100 text-emerald-900',
  ok: 'bg-lime-100 text-lime-900',
  warn: 'bg-amber-100 text-amber-900',
  bad: 'bg-orange-200 text-orange-900',
  critical: 'bg-rose-200 text-rose-900',
};

function DcTable({
  grid, fmt,
}: {
  grid: ReturnType<typeof buildAggregateGrid>;
  fmt: (v: number) => string;
}) {
  return (
    <div className="overflow-x-auto -mx-2 px-2">
      <table className="min-w-full text-xs">
        <thead>
          <tr>
            <th className="sticky left-0 bg-white text-left font-medium text-ink-500 px-2 py-2 z-10">Week</th>
            {grid.dcs.map((dc) => (
              <th key={dc.id} className="px-1 py-2 text-center font-medium text-ink-500 min-w-[68px]">
                <div className="text-[10px] text-ink-400">{dc.code.replace('DC ', '')}</div>
                <div className="font-medium text-ink-700 truncate max-w-[64px]">{dc.city}</div>
              </th>
            ))}
            <th className="px-2 py-2 text-center font-medium text-ink-700 bg-ink-50 rounded-tr-lg">Network</th>
          </tr>
        </thead>
        <tbody>
          {grid.weeks.map((w, wi) => (
            <tr key={w.weekStart} className="hover:bg-ink-50/40">
              <td className={cn('sticky left-0 bg-white px-2 py-1 text-ink-600 z-10', wi === 0 && 'font-semibold text-cocoa-700')}>
                {w.label}
              </td>
              {grid.cells[wi].map((cell, di) => (
                <td key={di} className="p-1">
                  <div className={cn('num text-center text-[11px] py-1.5 rounded-md font-medium', BAND[cell.band])}>
                    {fmt(cell.value)}
                  </div>
                </td>
              ))}
              <td className="p-1">
                <div className={cn('num text-center text-[11px] py-1.5 rounded-md font-semibold', BAND[grid.totals[wi].band])}>
                  {fmt(grid.totals[wi].value)}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RegionTable({
  grid, fmt,
}: {
  grid: ReturnType<typeof buildRegionGrid>;
  fmt: (v: number) => string;
}) {
  return (
    <div className="overflow-x-auto -mx-2 px-2">
      <table className="min-w-full text-xs">
        <thead>
          <tr>
            <th className="sticky left-0 bg-white text-left font-medium text-ink-500 px-2 py-2 z-10">Week</th>
            {grid.regions.map((r) => (
              <th key={r.key} className="px-2 py-2 text-center font-medium text-ink-700 min-w-[120px]">
                <div className="font-semibold">{r.label}</div>
                <div className="text-[10px] text-ink-400 num">{r.dcCount} DC{r.dcCount === 1 ? '' : 's'}</div>
              </th>
            ))}
            <th className="px-2 py-2 text-center font-medium text-ink-700 bg-ink-50 rounded-tr-lg">Network</th>
          </tr>
        </thead>
        <tbody>
          {grid.weeks.map((w, wi) => (
            <tr key={w.weekStart} className="hover:bg-ink-50/40">
              <td className={cn('sticky left-0 bg-white px-2 py-1 text-ink-600 z-10', wi === 0 && 'font-semibold text-cocoa-700')}>
                {w.label}
              </td>
              {grid.cells[wi].map((cell, ri) => (
                <td key={ri} className="p-1">
                  <div className={cn('num text-center text-sm py-2 rounded-md font-semibold', BAND[cell.band])}>
                    {fmt(cell.value)}
                  </div>
                </td>
              ))}
              <td className="p-1">
                <div className={cn('num text-center text-sm py-2 rounded-md font-semibold', BAND[grid.totals[wi].band])}>
                  {fmt(grid.totals[wi].value)}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

void METRICS;
