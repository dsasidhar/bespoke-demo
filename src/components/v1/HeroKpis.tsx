import { ArrowDown, ArrowUp, Boxes, ShieldCheck, AlertTriangle, DollarSign, Activity } from 'lucide-react';
import type { SkuDcPlan } from '../../types';
import { fmtCs, fmtDollars, fmtPct, cn } from '../../lib/utils';

interface Props {
  plan: SkuDcPlan;
  networkCases: number;
  networkDOH: number;
  atRiskDcs: number;
  totalLost: number;
  pSlBelow95: number;
  compareLastWeek?: boolean;
}

export default function HeroKpis({ plan, networkCases, networkDOH, atRiskDcs, totalLost, pSlBelow95, compareLastWeek }: Props) {
  const sl = plan.expectedServiceLevel[0];
  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
      <Kpi
        label="Network service level"
        value={fmtPct(sl, 1)}
        delta={compareLastWeek ? '+0.4 pts vs. last wk' : 'on target'}
        deltaDir={compareLastWeek ? 'up' : 'flat'}
        icon={<ShieldCheck className="size-4" />}
        accent={sl >= 0.97 ? 'emerald' : 'amber'}
      />
      <Kpi
        label="Days on hand (selected DC)"
        value={`${plan.daysOnHand[0]}d`}
        delta={compareLastWeek ? '−4d vs. last wk' : `${plan.daysOnHand[2]}d in 2 wks`}
        deltaDir={compareLastWeek ? 'down' : 'flat'}
        icon={<Boxes className="size-4" />}
        accent={plan.daysOnHand[0] < 14 ? 'amber' : 'emerald'}
      />
      <Kpi
        label="In-pipeline inventory"
        value={fmtCs(networkCases) + ' cs'}
        delta={`${networkDOH}d avg DOH`}
        deltaDir="flat"
        icon={<Activity className="size-4" />}
        accent="ink"
      />
      <Kpi
        label="At-risk DCs (selected SKU)"
        value={`${atRiskDcs}/12`}
        delta={compareLastWeek ? `${atRiskDcs > 2 ? '+' : ''}${atRiskDcs - 2} vs. last wk` : 'projected stockouts'}
        deltaDir={compareLastWeek ? (atRiskDcs > 2 ? 'up' : 'down') : 'flat'}
        icon={<AlertTriangle className="size-4" />}
        accent={atRiskDcs > 2 ? 'rose' : 'amber'}
      />
      <Kpi
        label="Expected lost sales (12w)"
        value={fmtDollars(totalLost)}
        delta={`P(SL<95%) ${pSlBelow95}%`}
        deltaDir="flat"
        icon={<DollarSign className="size-4" />}
        accent={totalLost > 50000 ? 'rose' : 'amber'}
      />
    </div>
  );
}

function Kpi({
  label, value, delta, deltaDir, icon, accent,
}: {
  label: string;
  value: string;
  delta: string;
  deltaDir: 'up' | 'down' | 'flat';
  icon: React.ReactNode;
  accent: 'ink' | 'emerald' | 'amber' | 'rose';
}) {
  const accentBg = {
    ink: 'bg-ink-100 text-ink-700',
    emerald: 'bg-emerald-100 text-emerald-700',
    amber: 'bg-amber-100 text-amber-800',
    rose: 'bg-rose-100 text-rose-700',
  }[accent];
  const deltaColor = deltaDir === 'down' ? 'text-rose-600' : deltaDir === 'up' ? 'text-emerald-600' : 'text-ink-500';
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs text-ink-500">{label}</div>
        <div className={cn('size-7 rounded-md grid place-items-center', accentBg)}>{icon}</div>
      </div>
      <div className="num text-2xl font-semibold tracking-tight">{value}</div>
      <div className={cn('text-xs mt-1 flex items-center gap-1', deltaColor)}>
        {deltaDir === 'up' && <ArrowUp className="size-3" />}
        {deltaDir === 'down' && <ArrowDown className="size-3" />}
        {delta}
      </div>
    </div>
  );
}
