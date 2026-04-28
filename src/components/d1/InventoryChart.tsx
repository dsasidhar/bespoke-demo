import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Area,
} from 'recharts';
import type { SkuDcPlan } from '../../types';
import { fmtCs, fmtWeek } from '../../lib/utils';

interface Props { plan: SkuDcPlan; skuName: string; dcLabel: string; }

export default function InventoryChart({ plan, skuName, dcLabel }: Props) {
  const data = plan.weeks.map((w, i) => {
    const arriving = plan.arrivals.reduce((s, r) => s + r.cases[i], 0);
    return {
      week: fmtWeek(w.weekStart),
      onHand: plan.openingInventory[i],
      arriving,
      forecast: plan.forecastCs[i],
      band: plan.forecastCs[i] * 1.5, // safety stock visual
      lostSales: plan.expectedLostSales$[i],
    };
  });

  return (
    <div className="card p-5 h-[440px] flex flex-col">
      <div className="flex items-start justify-between mb-3 flex-wrap gap-2 shrink-0">
        <div>
          <h3 className="text-base font-semibold text-ink-900">Inventory trajectory</h3>
          <p className="text-xs text-ink-500 mt-0.5">{skuName} · {dcLabel}</p>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-ink-500">
          <Legend swatch="bg-cocoa-500" label="On hand" />
          <Legend swatch="bg-cocoa-200" label="Safety stock band" />
          <Legend swatch="bg-amber-400" label="Arrivals" />
          <Legend swatch="bg-rose-500" dashed label="Forecast demand" />
        </div>
      </div>
      <div className="flex-1 min-h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 5, right: 10, bottom: 0, left: -10 }}>
            <CartesianGrid stroke="#eceef2" vertical={false} />
            <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#7a8294' }} stroke="#d4d8e0" />
            <YAxis tick={{ fontSize: 11, fill: '#7a8294' }} stroke="#d4d8e0" tickFormatter={(v) => fmtCs(v)} />
            <Tooltip
              cursor={{ fill: 'rgba(168, 112, 68, 0.06)' }}
              contentStyle={{ borderRadius: 8, border: '1px solid #e6cdb1', fontSize: 12 }}
              formatter={(v) => [fmtCs(Number(v)) + ' cs', undefined as unknown as string]}
            />
            <ReferenceLine y={0} stroke="#fb7185" strokeDasharray="3 3" />
            <Area type="monotone" dataKey="band" fill="#e6cdb1" stroke="none" fillOpacity={0.4} />
            <Bar dataKey="arriving" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={18} />
            <Line type="monotone" dataKey="onHand" stroke="#a87044" strokeWidth={2.5} dot={{ r: 3, fill: '#a87044' }} />
            <Line type="monotone" dataKey="forecast" stroke="#fb7185" strokeWidth={1.5} strokeDasharray="4 3" dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function Legend({ swatch, label, dashed }: { swatch: string; label: string; dashed?: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`${dashed ? 'h-px w-3 bg-rose-500' : `size-2 rounded-sm ${swatch}`}`} />
      <span>{label}</span>
    </div>
  );
}
