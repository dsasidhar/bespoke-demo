import type { IncomingShipment } from '../../data/dcOps';
import { SKU_BY_ID } from '../../data/skus';
import { SEGMENT_BY_KEY } from '../../data/segments';
import { fmtCs, fmtWeek, cn } from '../../lib/utils';
import { Truck } from 'lucide-react';

interface Props { incoming: IncomingShipment[]; }

export default function IncomingShipments({ incoming }: Props) {
  // Group by week
  const byWeek = new Map<number, IncomingShipment[]>();
  for (const s of incoming) {
    const arr = byWeek.get(s.weekIndex) ?? [];
    arr.push(s);
    byWeek.set(s.weekIndex, arr);
  }
  const weeks = Array.from(byWeek.keys()).sort((a, b) => a - b);

  return (
    <section>
      <div className="flex items-end justify-between mb-3">
        <div>
          <h2 className="text-lg font-semibold text-ink-900">What's arriving?</h2>
          <p className="text-xs text-ink-500 mt-0.5">
            Inbound shipments to this DC over the next 4 weeks, grouped by week.
          </p>
        </div>
        <div className="text-[11px] text-ink-500 num">
          {incoming.reduce((s, x) => s + x.cases, 0).toLocaleString()} cs total inbound · {incoming.length} shipments
        </div>
      </div>

      <div className="card p-4">
        {weeks.length === 0 ? (
          <div className="text-sm text-ink-500 py-8 text-center">No inbound shipments in the next 4 weeks.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {weeks.map((w) => {
              const list = byWeek.get(w)!;
              const total = list.reduce((s, x) => s + x.cases, 0);
              return (
                <div key={w} className={cn(
                  'rounded-lg p-3 border',
                  w === 0 ? 'border-cocoa-300 bg-cocoa-50' : 'border-ink-100 bg-white',
                )}>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-ink-400 font-semibold">
                        {w === 0 ? 'This week' : `Week +${w}`}
                      </div>
                      <div className="text-[11px] text-ink-500 num">{fmtWeek(list[0].weekStart)}</div>
                    </div>
                    <div className="text-right">
                      <div className="num text-base font-semibold">{fmtCs(total)}</div>
                      <div className="text-[10px] text-ink-400">cs total</div>
                    </div>
                  </div>
                  <ul className="space-y-1.5">
                    {list.slice(0, 5).map((s, i) => {
                      const sku = SKU_BY_ID[s.skuId];
                      const seg = SEGMENT_BY_KEY[s.fromSegment as keyof typeof SEGMENT_BY_KEY];
                      return (
                        <li key={i} className="flex items-center gap-2 text-[11px]">
                          <span className="size-5 rounded bg-ink-100 text-ink-700 grid place-items-center shrink-0">
                            <Truck className="size-3" />
                          </span>
                          <span className="text-base leading-none">{sku?.emoji}</span>
                          <span className="flex-1 min-w-0 truncate text-ink-800">{sku?.name}</span>
                          <span className="num text-ink-700 font-medium">{fmtCs(s.cases)}</span>
                          <span className="text-[9px] text-ink-400 hidden lg:inline">from {seg?.short}</span>
                        </li>
                      );
                    })}
                    {list.length > 5 && (
                      <li className="text-[10px] text-ink-400 italic pl-7">+{list.length - 5} more</li>
                    )}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
