import { Wand2, RotateCcw, ArrowDownRight, ArrowUpRight, Plus, TrendingUp } from 'lucide-react';
import { fmtCs, fmtDollars, fmtPct, cn } from '../../lib/utils';

export interface WhatIfState {
  /** Extra cases injected at McLane this week (Jim's headline ask). */
  mclaneExtraCases: number;
  /** Pull next ocean shipment forward by N weeks. */
  expediteWeeks: number;
  /** Demand multiplier (1.0 = baseline). */
  demandMultiplier: number;
}

export const WHATIF_DEFAULT: WhatIfState = {
  mclaneExtraCases: 0,
  expediteWeeks: 0,
  demandMultiplier: 1.0,
};

interface ImpactSummary {
  baselineLost: number;
  scenarioLost: number;
  baselineSL: number;
  scenarioSL: number;
  baselineAtRiskDcs: number;
  scenarioAtRiskDcs: number;
}

interface Props {
  state: WhatIfState;
  setState: (s: WhatIfState) => void;
  impact: ImpactSummary;
}

export default function WhatIfSimulator({ state, setState, impact }: Props) {
  const reset = () => setState({ ...WHATIF_DEFAULT });
  const isActive = state.mclaneExtraCases > 0 || state.expediteWeeks > 0 || state.demandMultiplier !== 1.0;

  const lostDelta = impact.scenarioLost - impact.baselineLost;
  const slDelta = impact.scenarioSL - impact.baselineSL;
  const dcsDelta = impact.scenarioAtRiskDcs - impact.baselineAtRiskDcs;

  return (
    <div className="card overflow-hidden">
      <div className="bg-gradient-to-br from-cocoa-50 to-white p-5 border-b border-cocoa-100">
        <div className="flex items-start justify-between mb-3 flex-wrap gap-2">
          <div className="flex items-start gap-3">
            <div className="size-9 rounded-lg bg-cocoa-700 text-white grid place-items-center shrink-0">
              <Wand2 className="size-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-ink-900">What-if simulator</h3>
              <p className="text-xs text-ink-500 mt-0.5 max-w-xl">
                Walmart can pull these levers and see the impact on the network heatmap and lost-sales $. Adjust, watch the cells shift.
              </p>
            </div>
          </div>
          <button onClick={reset} disabled={!isActive} className="btn px-2 disabled:opacity-40">
            <RotateCcw className="size-3.5" /> Reset
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-ink-100">
        <div className="lg:col-span-3 p-5 space-y-5">
          <Slider
            icon={<Plus className="size-4" />}
            label="Add cases at McLane this week"
            sub="Walmart asks the distributor to expedite incremental product across all DCs. The heatmap recomputes live."
            value={state.mclaneExtraCases}
            onChange={(v) => setState({ ...state, mclaneExtraCases: v })}
            min={0} max={20000} step={500}
            display={(v) => v === 0 ? 'no override' : `+${fmtCs(v)} cs`}
          />
          <Slider
            icon={<ArrowDownRight className="size-4" />}
            label="Expedite next ocean shipment"
            sub="Pull in-transit ETA forward (faster carrier, air-freight a portion). Charges +$0.40/cs."
            value={state.expediteWeeks}
            onChange={(v) => setState({ ...state, expediteWeeks: v })}
            min={0} max={2} step={1}
            display={(v) => v === 0 ? 'on schedule' : `−${v} ${v === 1 ? 'week' : 'weeks'}`}
          />
          <Slider
            icon={<TrendingUp className="size-4" />}
            label="Demand spike"
            sub="Stress-test for an unannounced endcap, hot weather, or Mother's Day lift."
            value={Math.round((state.demandMultiplier - 1) * 100)}
            onChange={(v) => setState({ ...state, demandMultiplier: 1 + v / 100 })}
            min={-20} max={50} step={5}
            display={(v) => v === 0 ? 'baseline' : `${v >= 0 ? '+' : ''}${v}%`}
          />
        </div>

        <div className="lg:col-span-2 p-5 bg-ink-50/40">
          <div className="text-[10px] uppercase tracking-wider text-ink-400 font-semibold mb-2">Live impact vs. baseline</div>
          <div className="space-y-2">
            <ImpactRow
              label="Expected lost sales (12w)"
              baseline={fmtDollars(impact.baselineLost)}
              scenario={fmtDollars(impact.scenarioLost)}
              delta={lostDelta}
              fmt={(v) => fmtDollars(Math.abs(v))}
              betterDir="down"
            />
            <ImpactRow
              label="Network service level"
              baseline={fmtPct(impact.baselineSL, 1)}
              scenario={fmtPct(impact.scenarioSL, 1)}
              delta={slDelta * 100}
              fmt={(v) => `${Math.abs(v).toFixed(1)} pts`}
              betterDir="up"
            />
            <ImpactRow
              label="At-risk DCs"
              baseline={`${impact.baselineAtRiskDcs}`}
              scenario={`${impact.scenarioAtRiskDcs}`}
              delta={dcsDelta}
              fmt={(v) => `${Math.abs(v)}`}
              betterDir="down"
            />
          </div>

          {!isActive && (
            <div className="mt-4 text-[11px] text-ink-400 italic">
              No scenario active — pull a lever on the left.
            </div>
          )}
          {isActive && (
            <div className="mt-4 text-[11px] text-ink-700 leading-relaxed">
              <span className="text-cocoa-700 font-semibold">Scenario summary:</span>
              {state.mclaneExtraCases > 0 && <> +{fmtCs(state.mclaneExtraCases)} cs at McLane this week ·</>}
              {state.expediteWeeks > 0 && <> next vessel arrives {state.expediteWeeks} {state.expediteWeeks === 1 ? 'wk' : 'wks'} early ·</>}
              {state.demandMultiplier !== 1 && <> demand {state.demandMultiplier > 1 ? '+' : ''}{Math.round((state.demandMultiplier - 1) * 100)}% ·</>}
              {' '}see the heatmap above for cell-level changes.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Slider({
  icon, label, sub, value, onChange, min, max, step, display,
}: {
  icon: React.ReactNode;
  label: string;
  sub: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  display: (v: number) => string;
}) {
  const isActive = value !== 0;
  return (
    <div className={cn('rounded-lg border p-3 transition', isActive ? 'border-cocoa-300 bg-cocoa-50/50' : 'border-ink-200 bg-white')}>
      <div className="flex items-center gap-2 mb-1.5">
        <div className={cn('size-7 rounded-md grid place-items-center',
          isActive ? 'bg-cocoa-700 text-white' : 'bg-ink-100 text-ink-700')}>{icon}</div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-ink-900">{label}</div>
          <div className="text-[10px] text-ink-500">{sub}</div>
        </div>
        <div className={cn('num text-sm font-semibold tabular-nums', isActive ? 'text-cocoa-700' : 'text-ink-500')}>
          {display(value)}
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-cocoa-700"
      />
      <div className="flex justify-between text-[10px] text-ink-300 num mt-0.5 px-0.5">
        <span>{display(min)}</span>
        <span>{display(max)}</span>
      </div>
    </div>
  );
}

function ImpactRow({
  label, baseline, scenario, delta, fmt, betterDir,
}: {
  label: string;
  baseline: string;
  scenario: string;
  delta: number;
  fmt: (v: number) => string;
  betterDir: 'up' | 'down';
}) {
  const isImprovement = (betterDir === 'down' && delta < 0) || (betterDir === 'up' && delta > 0);
  const isUnchanged = Math.abs(delta) < 0.001;
  const color = isUnchanged ? 'text-ink-500' : isImprovement ? 'text-emerald-700' : 'text-rose-700';
  return (
    <div className="rounded-lg bg-white border border-ink-100 px-3 py-2">
      <div className="flex items-center justify-between mb-0.5">
        <span className="text-[11px] text-ink-500">{label}</span>
        {!isUnchanged && (
          <span className={cn('flex items-center gap-1 text-[11px] font-semibold num', color)}>
            {isImprovement ? <ArrowDownRight className="size-3" /> : <ArrowUpRight className="size-3" />}
            {fmt(delta)}
          </span>
        )}
        {isUnchanged && <span className="text-[11px] text-ink-400">no change</span>}
      </div>
      <div className="flex items-baseline justify-between">
        <span className="text-[10px] text-ink-400">baseline {baseline}</span>
        <span className={cn('num text-base font-semibold', color)}>
          {scenario}
        </span>
      </div>
    </div>
  );
}
