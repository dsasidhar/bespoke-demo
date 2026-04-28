import { useState } from 'react';
import {
  Factory, Anchor, Ship, Building2, Truck, Store,
  AlertOctagon, AlertTriangle, CheckCircle2, Info,
  ArrowUpRight, MailPlus, TrendingUp, ChevronDown, ChevronRight,
} from 'lucide-react';
import { cn, fmtCs } from '../../lib/utils';

type ConstraintSeverity = 'critical' | 'warning' | 'info' | 'positive';

interface Shipment {
  id: string;
  label: string;
  cases: number;
  planEta?: string;
  actualEta?: string;
  slipDays: number;
  affected: boolean;
}

interface Constraint {
  nodeKey: string;
  nodeLabel: string;
  severity: ConstraintSeverity;
  cause: string;
  causeBody: string;
  metric: string;
  attributableLost$: number;
  weekOverWeekDelta$: number;
  binding?: boolean;
  startedDate?: string;
  recovery?: string;
  unit: string;
  shipments: Shipment[];
  /** When unaffected entries are pre-rolled (e.g. "21 other DCs"), set the real count of unaffected entities. */
  unaffectedRollupCount?: number;
}

const CONSTRAINTS: Constraint[] = [
  {
    nodeKey: 'origin_port',
    nodeLabel: 'Rotterdam',
    severity: 'critical',
    cause: 'Rotterdam dockworker strike',
    causeBody: 'Selective walkout at ECT terminals through Apr 30. Two containers re-routed via Antwerp.',
    metric: '+4d slip',
    attributableLost$: 148_000,
    weekOverWeekDelta$: 42_000,
    binding: true,
    startedDate: 'Apr 22, 2026',
    recovery: 'wk of May 7',
    unit: 'containers',
    shipments: [
      { id: 'c1', label: 'ECTU-447821 · PO 4421', cases: 7_200, planEta: 'Apr 26', actualEta: 'Apr 30', slipDays: 4, affected: true  },
      { id: 'c2', label: 'HLBU-882103 · PO 4422', cases: 7_000, planEta: 'Apr 27', actualEta: 'May 1',  slipDays: 4, affected: true  },
      { id: 'c3', label: 'MSCU-913445 · PO 4419', cases: 6_800, slipDays: 0, affected: false },
      { id: 'c4', label: 'MSCU-913446 · PO 4420', cases: 6_800, slipDays: 0, affected: false },
      { id: 'c5', label: 'CMAU-220089 · PO 4423', cases: 7_100, slipDays: 0, affected: false },
      { id: 'c6', label: 'CMAU-220090 · PO 4424', cases: 7_100, slipDays: 0, affected: false },
      { id: 'c7', label: 'TCNU-554612 · PO 4425', cases: 7_000, slipDays: 0, affected: false },
      { id: 'c8', label: 'TCNU-554613 · PO 4426', cases: 7_000, slipDays: 0, affected: false },
    ],
  },
  {
    nodeKey: 'ocean',
    nodeLabel: 'Ocean',
    severity: 'warning',
    cause: 'North Atlantic weather diversion',
    causeBody: 'MSC Helvetia and Maersk Altona rerouted 250nm south to avoid storm system.',
    metric: '+3d ETA',
    attributableLost$: 50_000,
    weekOverWeekDelta$: 12_000,
    unit: 'vessels',
    shipments: [
      { id: 'v1', label: 'MSC Helvetia · V-87',  cases: 5_200, planEta: 'May 4', actualEta: 'May 7', slipDays: 3, affected: true  },
      { id: 'v2', label: 'Maersk Altona · V-91', cases: 3_200, planEta: 'May 5', actualEta: 'May 8', slipDays: 3, affected: true  },
      { id: 'v3', label: 'CMA Tarragona · V-93', cases: 4_400, slipDays: 0, affected: false },
      { id: 'v4', label: 'Ever Given · V-101',   cases: 4_200, slipDays: 0, affected: false },
      { id: 'v5', label: 'ONE Olympus · V-104',  cases: 4_000, slipDays: 0, affected: false },
    ],
  },
  {
    nodeKey: 'mclane',
    nodeLabel: 'McLane SE',
    severity: 'warning',
    cause: 'Memorial Day staffing — McLane SE',
    causeBody: '80% headcount May 25–27. +1d dwell expected across SE region DCs.',
    metric: '+1d dwell',
    attributableLost$: 28_000,
    weekOverWeekDelta$: 8_000,
    unit: 'DCs',
    unaffectedRollupCount: 21,
    shipments: [
      { id: 'd1', label: 'DC 6020 · Cleburne, TX',   cases: 1_200, slipDays: 1, affected: true  },
      { id: 'd2', label: 'DC 6094 · Pocahontas, AR', cases: 800,   slipDays: 1, affected: true  },
      { id: 'd3', label: 'DC 6034 · Hope Mills, NC', cases: 700,   slipDays: 1, affected: true  },
      { id: 'd4', label: 'DC 6011 · Brookhaven, MS', cases: 700,   slipDays: 1, affected: true  },
      { id: 'd5', label: 'DC 6042 · Searcy, AR',     cases: 700,   slipDays: 1, affected: true  },
      { id: 'd6', label: 'DC 6076 · Douglas, GA',    cases: 700,   slipDays: 1, affected: true  },
      { id: 'rest', label: '21 other McLane DCs',    cases: 17_200, slipDays: 0, affected: false },
    ],
  },
];

interface NodeMeta { key: string; label: string; icon: React.ReactNode; }

const NODES: NodeMeta[] = [
  { key: 'producer',    label: 'Producer',  icon: <Factory className="size-3.5" /> },
  { key: 'origin_port', label: 'Rotterdam', icon: <Anchor className="size-3.5" /> },
  { key: 'ocean',       label: 'Ocean',     icon: <Ship className="size-3.5" /> },
  { key: 'us_port',     label: 'Newark',    icon: <Anchor className="size-3.5" /> },
  { key: 'bespoke',     label: '3PL',       icon: <Building2 className="size-3.5" /> },
  { key: 'mclane',      label: 'McLane',    icon: <Truck className="size-3.5" /> },
  { key: 'walmart',     label: 'Walmart',   icon: <Store className="size-3.5" /> },
];

const NODE_AMBIENT: Record<string, ConstraintSeverity | undefined> = {
  us_port: 'positive',
  walmart: 'info',
};

const SEVERITY_STYLE: Record<ConstraintSeverity, {
  text: string; iconBg: string; bar: string; dot: string;
}> = {
  critical: { text: 'text-rose-700',    iconBg: 'bg-rose-100 text-rose-700',       bar: 'bg-rose-500',    dot: 'bg-rose-500'    },
  warning:  { text: 'text-amber-800',   iconBg: 'bg-amber-100 text-amber-700',     bar: 'bg-amber-500',   dot: 'bg-amber-500'   },
  info:     { text: 'text-ink-600',     iconBg: 'bg-ink-100 text-ink-600',         bar: 'bg-ink-400',     dot: 'bg-ink-400'     },
  positive: { text: 'text-emerald-700', iconBg: 'bg-emerald-100 text-emerald-700', bar: 'bg-emerald-500', dot: 'bg-emerald-500' },
};

function severityIcon(s: ConstraintSeverity) {
  const cls = 'size-3.5';
  if (s === 'critical') return <AlertOctagon className={cls} />;
  if (s === 'warning')  return <AlertTriangle className={cls} />;
  if (s === 'positive') return <CheckCircle2 className={cls} />;
  return <Info className={cls} />;
}

interface ConstraintMetrics {
  affected: Shipment[];
  affectedCount: number;
  totalEntities: number;
  ratio: number;            // 0..1 share of node entities affected
  worstSlip: number;
  affectedCases: number;
  totalCases: number;
  unaffectedCases: number;
  unaffectedCount: number;
}

function metricsFor(c: Constraint): ConstraintMetrics {
  const affected = c.shipments.filter((s) => s.affected);
  const unaffected = c.shipments.filter((s) => !s.affected);
  const affectedCases = affected.reduce((s, sh) => s + sh.cases, 0);
  const unaffectedCases = unaffected.reduce((s, sh) => s + sh.cases, 0);
  const totalCases = affectedCases + unaffectedCases;
  const unaffectedCount = c.unaffectedRollupCount ?? unaffected.length;
  const totalEntities = affected.length + unaffectedCount;
  const ratio = totalEntities > 0 ? affected.length / totalEntities : 0;
  const worstSlip = affected.reduce((m, s) => Math.max(m, s.slipDays), 0);
  return {
    affected, affectedCount: affected.length, totalEntities, ratio, worstSlip,
    affectedCases, totalCases, unaffectedCases, unaffectedCount,
  };
}

export default function BottleneckCard() {
  const binding = CONSTRAINTS.find((c) => c.binding) ?? CONSTRAINTS[0];
  const lostDriving = CONSTRAINTS.filter((c) => c.attributableLost$ > 0);
  const totalLost = lostDriving.reduce((s, c) => s + c.attributableLost$, 0);
  const totalDelta = lostDriving.reduce((s, c) => s + c.weekOverWeekDelta$, 0);

  const metricsByNode = Object.fromEntries(
    CONSTRAINTS.map((c) => [c.nodeKey, metricsFor(c)]),
  ) as Record<string, ConstraintMetrics>;
  const constraintByNode = Object.fromEntries(CONSTRAINTS.map((c) => [c.nodeKey, c]));
  const cleanCount = NODES.filter((n) => !constraintByNode[n.key] && !NODE_AMBIENT[n.key]).length;

  const [expanded, setExpanded] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(CONSTRAINTS.map((c) => [c.nodeKey, !!c.binding])),
  );
  const toggle = (k: string) => setExpanded((s) => ({ ...s, [k]: !s[k] }));

  return (
    <div className="card overflow-hidden">
      {/* Header bar */}
      <div className="flex items-center justify-between gap-3 px-5 py-3 bg-rose-50 border-b border-rose-200 flex-wrap">
        <div className="flex items-center gap-2.5">
          <span className="size-6 rounded-md bg-rose-600 text-white grid place-items-center shrink-0">
            <AlertOctagon className="size-3.5" />
          </span>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-rose-700 font-semibold">
              Active constraints · binding: {binding.nodeLabel}
            </div>
            <div className="text-sm font-semibold text-ink-900 leading-tight">
              {binding.cause}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2.5 text-[11px] text-ink-500">
            <span className="flex items-center gap-1"><span className="size-1.5 rounded-full bg-rose-500" />{CONSTRAINTS.filter(c => c.severity === 'critical').length} critical</span>
            <span className="flex items-center gap-1"><span className="size-1.5 rounded-full bg-amber-500" />{CONSTRAINTS.filter(c => c.severity === 'warning').length} warnings</span>
            <span className="flex items-center gap-1"><span className="size-1.5 rounded-full bg-emerald-500" />{Object.values(NODE_AMBIENT).filter(s => s === 'positive').length} cleared</span>
            <span className="text-ink-300">·</span>
            <span>{cleanCount}/{NODES.length} clean</span>
          </div>
          <div className="flex items-baseline gap-1.5 text-rose-700 border-l border-rose-200 pl-4">
            <span className="text-[10px] uppercase tracking-wider font-semibold">Risk</span>
            <span className="num text-base font-semibold">${(totalLost / 1000).toFixed(0)}K</span>
            <span className="flex items-center gap-0.5 text-[11px] num font-semibold">
              <TrendingUp className="size-3" />+${(totalDelta / 1000).toFixed(0)}K wk
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 p-5">
        {/* Left: multi-state ribbon */}
        <div className="lg:col-span-5">
          <div className="flex items-baseline justify-between mb-2">
            <div className="text-[10px] uppercase tracking-wider text-ink-400 font-semibold">
              Where in the chain
            </div>
            <div className="text-[10px] text-ink-400">
              fill = % of node affected
            </div>
          </div>

          <div className="flex items-stretch gap-1">
            {NODES.map((n, i) => {
              const c = constraintByNode[n.key];
              const ambient = NODE_AMBIENT[n.key];
              const severity = c?.severity ?? ambient;
              const m = c ? metricsByNode[n.key] : undefined;
              const isBinding = !!c?.binding;
              const style = severity ? SEVERITY_STYLE[severity] : null;

              // Border intensity scaled by ratio (only when there's a constraint).
              const ratio = m?.ratio ?? 0;
              const borderTone = !c
                ? severity === 'positive' ? 'border-emerald-300 bg-emerald-50/50'
                : severity === 'info'     ? 'border-ink-200 bg-white'
                : 'border-ink-100 bg-ink-50/60 opacity-60'
                : ratio >= 0.5
                  ? severity === 'critical' ? 'border-rose-500 ring-2 ring-rose-300 bg-white'   : 'border-amber-500 bg-white'
                : ratio >= 0.2
                  ? severity === 'critical' ? 'border-rose-300 bg-rose-50/50'                   : 'border-amber-300 bg-amber-50/40'
                : severity === 'critical' ? 'border-rose-200 bg-white'                          : 'border-amber-200 bg-white';

              return (
                <div key={n.key} className="flex items-stretch gap-1 flex-1 min-w-0">
                  <div
                    className={cn(
                      'flex-1 min-w-0 rounded-lg border flex flex-col items-center text-center transition relative overflow-hidden',
                      borderTone,
                    )}
                  >
                    {isBinding && (
                      <span
                        title="Binding constraint (largest $-driver)"
                        className="absolute top-1 right-1 text-[8px] font-bold text-white bg-rose-600 rounded px-1 leading-tight tracking-wide"
                      >
                        B
                      </span>
                    )}

                    <div className="px-1.5 pt-2 pb-1.5 flex flex-col items-center w-full">
                      <div className={cn('size-6 rounded-md grid place-items-center mb-1', style ? style.iconBg : 'bg-white text-ink-400')}>
                        {n.icon}
                      </div>
                      <div className={cn('text-[10px] leading-tight truncate w-full font-semibold', style ? style.text : 'text-ink-400')}>
                        {n.label}
                      </div>
                      {m ? (
                        <div className="mt-0.5 leading-tight">
                          <div className={cn('text-[11px] num font-bold', style!.text)}>
                            {m.affectedCount}/{m.totalEntities}
                          </div>
                          <div className="text-[9px] num text-ink-500 -mt-0.5">
                            +{m.worstSlip}d worst
                          </div>
                        </div>
                      ) : ambient === 'positive' ? (
                        <div className="text-[9px] text-emerald-700 font-medium mt-0.5">cleared</div>
                      ) : ambient === 'info' ? (
                        <div className="text-[9px] text-ink-500 mt-0.5">demand event</div>
                      ) : (
                        <div className="text-[9px] text-ink-300 mt-0.5">on plan</div>
                      )}
                    </div>

                    {/* Fill bar at bottom — % of node entities affected */}
                    <div className="h-1.5 w-full bg-ink-50 mt-auto">
                      {m && (
                        <div
                          className={cn('h-full', style!.bar)}
                          style={{ width: `${Math.max(4, m.ratio * 100)}%` }}
                          title={`${(m.ratio * 100).toFixed(0)}% of ${n.label} affected`}
                        />
                      )}
                    </div>
                  </div>
                  {i < NODES.length - 1 && <div className="flex items-center text-ink-200 text-xs">›</div>}
                </div>
              );
            })}
          </div>

          <div className="mt-3 flex items-center flex-wrap gap-x-3 gap-y-1 text-[10px] text-ink-500">
            <span className="flex items-center gap-1"><span className="size-1.5 rounded-full bg-rose-500" /> Critical</span>
            <span className="flex items-center gap-1"><span className="size-1.5 rounded-full bg-amber-500" /> Watch</span>
            <span className="flex items-center gap-1"><span className="size-1.5 rounded-full bg-emerald-500" /> Cleared</span>
            <span className="flex items-center gap-1"><span className="size-1.5 rounded-full bg-ink-400" /> Info</span>
            <span className="flex items-center gap-1"><span className="size-1.5 rounded-full bg-ink-200" /> Clean</span>
            <span className="text-ink-300">·</span>
            <span><b className="text-rose-700">B</b> = binding ($-driver)</span>
          </div>

          <div className="mt-3 pt-3 border-t border-ink-100 text-[11px] text-ink-500">
            <span className="font-semibold text-ink-700">Started {binding.startedDate}</span>
            <span className="mx-1.5 text-ink-300">·</span>
            <span>recovery est. {binding.recovery}</span>
          </div>
        </div>

        {/* Right: ranked constraint list with lot drill-down */}
        <div className="lg:col-span-7 lg:border-l lg:border-ink-100 lg:pl-5">
          <div className="text-[10px] uppercase tracking-wider text-ink-400 font-semibold mb-2">
            Active constraints — ranked by lost-$ risk
          </div>

          <ul className="space-y-2">
            {CONSTRAINTS.map((c) => {
              const style = SEVERITY_STYLE[c.severity];
              const m = metricsByNode[c.nodeKey];
              const sharePct = totalLost > 0 ? (c.attributableLost$ / totalLost) * 100 : 0;
              const isOpen = expanded[c.nodeKey];

              return (
                <li
                  key={c.nodeKey}
                  className={cn(
                    'rounded-lg border p-2.5',
                    c.binding ? 'border-rose-200 bg-rose-50' : 'border-ink-100 bg-white',
                  )}
                >
                  <div className="flex items-start gap-2">
                    <span className={cn('mt-0.5', style.text)}>{severityIcon(c.severity)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-ink-900 leading-tight">{c.cause}</span>
                        <span className={cn('num text-[11px] font-semibold', style.text)}>{c.metric}</span>
                      </div>
                      <div className="text-[11px] text-ink-500 mt-0.5">
                        <span className="font-medium text-ink-700">{c.nodeLabel}</span>
                        <span className="mx-1 text-ink-300">·</span>
                        <span>{c.causeBody}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => toggle(c.nodeKey)}
                    className="mt-2 w-full flex items-center justify-between gap-2 px-2 py-1 rounded-md bg-white border border-ink-100 hover:border-ink-300 transition text-left"
                  >
                    <div className="flex items-center gap-1.5 text-[11px] text-ink-700">
                      {isOpen ? <ChevronDown className="size-3.5 text-ink-400" /> : <ChevronRight className="size-3.5 text-ink-400" />}
                      <span className="font-semibold">
                        {m.affectedCount} of {m.totalEntities} {c.unit} affected
                      </span>
                      <span className="text-ink-400">·</span>
                      <span className="num">
                        {fmtCs(m.affectedCases)} of {fmtCs(m.totalCases)} cs at risk
                      </span>
                    </div>
                    <span className="num text-[10px] text-ink-400">
                      {(m.ratio * 100).toFixed(0)}%
                    </span>
                  </button>

                  {isOpen && (
                    <ul className="mt-2 ml-1 space-y-1">
                      {m.affected.map((s) => (
                        <li
                          key={s.id}
                          className="flex items-center gap-2 px-2 py-1 rounded-md bg-white border border-ink-100 text-[11px]"
                        >
                          <span className={cn('size-1.5 rounded-full shrink-0', style.dot)} />
                          <span className="text-ink-800 font-medium truncate flex-1">{s.label}</span>
                          <span className="num text-ink-700 w-20 text-right">{fmtCs(s.cases)} cs</span>
                          {s.planEta && s.actualEta && (
                            <span className="num text-ink-500 hidden md:inline">
                              {s.planEta} <span className="text-ink-300">→</span> {s.actualEta}
                            </span>
                          )}
                          <span className={cn('num font-semibold w-10 text-right', style.text)}>
                            +{s.slipDays}d
                          </span>
                        </li>
                      ))}
                      {m.unaffectedCount > 0 && (
                        <li className="flex items-center gap-2 px-2 py-1 rounded-md bg-emerald-50/40 border border-emerald-100 text-[11px]">
                          <CheckCircle2 className="size-3 text-emerald-600 shrink-0" />
                          <span className="text-emerald-800 truncate flex-1">
                            {m.unaffectedCount} other {c.unit} on schedule
                          </span>
                          <span className="num text-emerald-700 w-20 text-right">{fmtCs(m.unaffectedCases)} cs</span>
                        </li>
                      )}
                    </ul>
                  )}

                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full bg-ink-100 overflow-hidden">
                      <div className={cn('h-full', style.bar)} style={{ width: `${sharePct}%` }} />
                    </div>
                    <span className="num text-[11px] text-ink-700 font-semibold w-24 text-right">
                      ${(c.attributableLost$ / 1000).toFixed(0)}K
                      <span className="text-ink-400 font-normal"> · {sharePct.toFixed(0)}%</span>
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* Footer: actions */}
      <div className="px-5 py-3 border-t border-ink-100 bg-ink-50/50 flex items-center justify-between flex-wrap gap-2">
        <div className="text-[11px] text-ink-500">
          Ratio in ribbon = share of node entities affected. Risk attribution drives the ranking.
        </div>
        <div className="flex items-center gap-2">
          <button className="btn text-xs">
            <MailPlus className="size-3.5" /> Notify Bespoke
          </button>
          <button className="btn-primary text-xs">
            <ArrowUpRight className="size-3.5" /> Expedite cleared lots
          </button>
        </div>
      </div>
    </div>
  );
}
