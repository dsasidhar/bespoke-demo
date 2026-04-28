import { useMemo, useState } from 'react';
import type { AggregateMetric } from '../../data/aggregate';
import { buildAggregateGrid } from '../../data/aggregate';
import { fmtCs, fmtDollars, fmtPct, cn } from '../../lib/utils';

const METRICS: { key: AggregateMetric; label: string; sub: string }[] = [
  { key: 'doh',           label: 'Days on hand',          sub: 'days of forward cover at each DC' },
  { key: 'cases',         label: 'Cases on hand',         sub: 'opening cases at each DC each week' },
  { key: 'sl',            label: 'Expected service level', sub: '% of forecasted demand we expect to meet' },
  { key: 'lost',          label: 'Expected lost sales $',  sub: 'unmet demand × retail price' },
  { key: 'prob_below_95', label: 'P(SL < 95%)',           sub: 'probability service level dips under 95%' },
];

interface Props {
  skuId: string;
  skuName: string;
}

export default function AggregateHeatmap({ skuId, skuName }: Props) {
  const [metric, setMetric] = useState<AggregateMetric>('doh');
  const grid = useMemo(() => buildAggregateGrid(skuId, metric), [skuId, metric]);

  const fmt = (v: number): string => {
    switch (metric) {
      case 'doh':           return `${v}`;
      case 'cases':         return fmtCs(v);
      case 'sl':            return `${v}%`;
      case 'lost':          return fmtDollars(v);
      case 'prob_below_95': return `${v}%`;
    }
  };

  const bandColor: Record<string, string> = {
    good: 'bg-emerald-100 text-emerald-900',
    ok: 'bg-lime-100 text-lime-900',
    warn: 'bg-amber-100 text-amber-900',
    bad: 'bg-orange-200 text-orange-900',
    critical: 'bg-rose-200 text-rose-900',
  };

  const meta = METRICS.find((m) => m.key === metric)!;

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
        <div>
          <h3 className="text-base font-semibold text-ink-900">Network heatmap — {skuName}</h3>
          <p className="text-xs text-ink-500 mt-0.5">
            All 12 DCs · 12-week horizon · {meta.sub}
          </p>
        </div>
        <div className="flex items-center gap-1 p-0.5 rounded-lg bg-ink-100 text-xs">
          {METRICS.map((m) => (
            <button
              key={m.key}
              onClick={() => setMetric(m.key)}
              className={cn(
                'px-3 py-1.5 rounded-md font-medium transition',
                metric === m.key ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500 hover:text-ink-700',
              )}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto -mx-2 px-2">
        <table className="min-w-full text-xs">
          <thead>
            <tr>
              <th className="sticky left-0 bg-white text-left font-medium text-ink-500 px-2 py-2 z-10">Week</th>
              {grid.dcs.map((dc) => (
                <th
                  key={dc.id}
                  className="px-1 py-2 text-center font-medium text-ink-500 min-w-[68px]"
                  title={`${dc.code} · ${dc.city}`}
                >
                  <div className="text-[10px] text-ink-400">{dc.code.replace('DC ', '')}</div>
                  <div className="font-medium text-ink-700 truncate max-w-[64px]">{dc.city}</div>
                </th>
              ))}
              <th className="px-2 py-2 text-center font-medium text-ink-700 bg-ink-50 rounded-tr-lg">
                Network
              </th>
            </tr>
          </thead>
          <tbody>
            {grid.weeks.map((w, wi) => (
              <tr key={w.weekStart} className="hover:bg-ink-50/40">
                <td className={cn(
                  'sticky left-0 bg-white px-2 py-1 text-ink-600 z-10',
                  wi === 0 && 'font-semibold text-cocoa-700',
                )}>
                  {w.label}
                </td>
                {grid.cells[wi].map((cell, di) => (
                  <td key={di} className="p-1">
                    <div
                      className={cn(
                        'num text-center text-[11px] py-1.5 rounded-md font-medium',
                        bandColor[cell.band],
                      )}
                    >
                      {fmt(cell.value)}
                    </div>
                  </td>
                ))}
                <td className="p-1">
                  <div className={cn(
                    'num text-center text-[11px] py-1.5 rounded-md font-semibold',
                    bandColor[grid.totals[wi].band],
                  )}>
                    {metric === 'sl' ? fmtPct(grid.totals[wi].value / 100, 0) : fmt(grid.totals[wi].value)}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center gap-3 text-[11px] text-ink-500">
        <span>Color scale:</span>
        {(['critical', 'bad', 'warn', 'ok', 'good'] as const).map((b) => (
          <div key={b} className="flex items-center gap-1.5">
            <span className={cn('size-3 rounded', bandColor[b].split(' ')[0])} />
            <span className="capitalize">{b}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
