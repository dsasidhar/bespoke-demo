import { ArrowDown, ArrowUp, Boxes, ShieldCheck, AlertTriangle, DollarSign } from 'lucide-react';
import type { SkuDcPlan } from '../../types';
import { fmtCs, fmtDollars, fmtPct } from '../../lib/utils';

interface Props {
  plan: SkuDcPlan;
  networkCases: number;
  networkDOH: number;
  atRiskDcs: number;
  totalLost: number;
  pSlBelow95: number;
}

export default function KpiCards({ plan, networkCases, networkDOH, atRiskDcs, totalLost, pSlBelow95 }: Props) {
  const sl = plan.expectedServiceLevel[0];
  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
      <Kpi
        label="Service level (SKU·DC)"
        value={fmtPct(sl, 1)}
        delta={{ dir: sl >= 0.97 ? 'up' : 'down', label: sl >= 0.97 ? 'on target' : '−2.4 pts vs plan' }}
        icon={<ShieldCheck className="size-4" />}
        accent={sl >= 0.97 ? 'emerald' : 'amber'}
      />
      <Kpi
        label="Days on hand"
        value={`${plan.daysOnHand[0]}d`}
        delta={{ dir: plan.daysOnHand[0] < plan.daysOnHand[2] ? 'down' : 'up', label: 'next 2w trend' }}
        icon={<Boxes className="size-4" />}
        accent={plan.daysOnHand[0] < 14 ? 'amber' : 'emerald'}
      />
      <Kpi
        label="Network on-hand"
        value={fmtCs(networkCases) + ' cs'}
        delta={{ dir: 'up', label: `${networkDOH}d avg DOH` }}
        icon={<Boxes className="size-4" />}
        accent="ink"
      />
      <Kpi
        label="At-risk DCs"
        value={`${atRiskDcs}/12`}
        delta={{ dir: atRiskDcs > 2 ? 'up' : 'down', label: 'projected stockout' }}
        icon={<AlertTriangle className="size-4" />}
        accent={atRiskDcs > 2 ? 'rose' : 'amber'}
      />
      <Kpi
        label="Expected lost sales"
        value={fmtDollars(totalLost)}
        delta={{ dir: 'up', label: `P(SL<95%) ${pSlBelow95}%` }}
        icon={<DollarSign className="size-4" />}
        accent={totalLost > 50000 ? 'rose' : 'amber'}
      />
    </div>
  );
}

function Kpi({
  label, value, delta, icon, accent,
}: {
  label: string;
  value: string;
  delta: { dir: 'up' | 'down'; label: string };
  icon: React.ReactNode;
  accent: 'ink' | 'emerald' | 'amber' | 'rose';
}) {
  const accentBg = {
    ink: 'bg-ink-100 text-ink-700',
    emerald: 'bg-emerald-100 text-emerald-700',
    amber: 'bg-amber-100 text-amber-800',
    rose: 'bg-rose-100 text-rose-700',
  }[accent];
  const deltaColor = accent === 'emerald' ? 'text-emerald-600' : accent === 'rose' ? 'text-rose-600' : 'text-ink-500';
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs text-ink-500">{label}</div>
        <div className={`size-7 rounded-md grid place-items-center ${accentBg}`}>{icon}</div>
      </div>
      <div className="num text-2xl font-semibold tracking-tight">{value}</div>
      <div className={`text-xs mt-1 flex items-center gap-1 ${deltaColor}`}>
        {delta.dir === 'up' ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />}
        {delta.label}
      </div>
    </div>
  );
}
