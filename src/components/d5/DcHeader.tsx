import { ChevronDown, MapPin } from 'lucide-react';
import { DCS } from '../../data/dcs';
import type { DC } from '../../types';

interface Props {
  dc: DC;
  setDcId: (id: string) => void;
  liveStats: { healthy: number; at_risk: number; critical: number; totalSkus: number };
}

export default function DcHeader({ dc, setDcId, liveStats }: Props) {
  return (
    <div className="card p-5 lg:p-6 bg-gradient-to-br from-ink-900 to-ink-800 border-ink-700 text-white">
      <div className="flex flex-wrap items-start gap-5">
        <div className="size-14 rounded-xl bg-white/10 grid place-items-center shrink-0">
          <MapPin className="size-6 text-amber-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[11px] uppercase tracking-wider text-white/55 mb-0.5">
            DC operator view · single-DC pulse
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <label className="flex items-center gap-2 cursor-pointer group">
              <h1 className="text-2xl font-semibold tracking-tight group-hover:text-amber-200 transition">
                {dc.code} · {dc.city}, {dc.state}
              </h1>
              <ChevronDown className="size-5 text-white/55 group-hover:text-white" />
              <select
                value={dc.id}
                onChange={(e) => setDcId(e.target.value)}
                className="absolute opacity-0 cursor-pointer w-full h-full"
                style={{ position: 'absolute', inset: 0, left: '-100%' }}
              >
                {DCS.map((d) => (
                  <option key={d.id} value={d.id}>{d.code} · {d.city}, {d.state}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="text-sm text-white/65 mt-1">
            Region {dc.region} · {dc.weeklyDemandCases.toLocaleString()} cases/week base demand · {liveStats.totalSkus} SKUs in pilot
          </div>
        </div>

        <div className="flex items-center gap-2 ml-auto flex-wrap">
          <Pill color="emerald" label="Healthy"  count={liveStats.healthy} />
          <Pill color="amber"   label="At risk"  count={liveStats.at_risk} />
          <Pill color="rose"    label="Critical" count={liveStats.critical} />
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-white/10 flex flex-wrap items-center gap-x-6 gap-y-1 text-[12px] text-white/60">
        <span><b className="text-white/85">Snapshot:</b> Apr 27, 2026</span>
        <span><b className="text-white/85">Inbound this week:</b> 6 shipments</span>
        <span><b className="text-white/85">Last refresh:</b> 4 min ago</span>
      </div>
    </div>
  );
}

function Pill({ color, label, count }: { color: 'emerald' | 'amber' | 'rose'; label: string; count: number }) {
  const cls = {
    emerald: 'bg-emerald-500/15 text-emerald-200 border-emerald-500/30',
    amber:   'bg-amber-500/15 text-amber-200 border-amber-500/30',
    rose:    'bg-rose-500/15 text-rose-200 border-rose-500/30',
  }[color];
  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[11px] font-medium ${cls}`}>
      <span className="num text-base font-semibold">{count}</span>
      <span className="opacity-80">{label}</span>
    </div>
  );
}
